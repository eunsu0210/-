import { NextResponse } from 'next/server'
import { findTerm, getExplanation, suggestTerm } from '@/lib/mock-terms'
import { LruCache } from '@/lib/lru-cache'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

export type ExplainApiResponse = {
  status: 'success' | 'irrelevant' | 'typo' | 'error'
  term?: string
  definition?: string
  analogy?: string
  role?: string
  suggestedTerm?: string
  message?: string
  source?: 'ai' | 'fallback'
  model?: string
}

// 상한이 있는 인메모리 캐시 (빠른 응답 최적화 + 메모리 누수 방지)
const cache = new LruCache<ExplainApiResponse>(500)

// 레이트리밋: IP당 60초에 20회
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

// Gemini generateContent 엔드포인트 버전 (systemInstruction + JSON 강제는 v1beta 필요)
const GEMINI_API_VERSION = 'v1beta'

// 모델 우선순위. GEMINI_MODELS 환경변수(쉼표 구분)로 오버라이드 가능.
// 2026-08 실측: gemini-flash-lite-latest ≈ 1.3s + 완전한 3요소 응답 → 3초 SLA 충족 (기본).
//   gemini-3.6-flash ≈ 7s (품질↑, 지연↑) → 1차 실패 시 품질 보정용 폴백.
//   gemini-flash-latest 는 현재 폭주(503)로 응답까지 50s+ 소요되어 기본 체인에서 제외.
const DEFAULT_MODELS = ['gemini-flash-lite-latest', 'gemini-3.6-flash']
const GEMINI_MODELS = (process.env.GEMINI_MODELS || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)
const MODELS = GEMINI_MODELS.length > 0 ? GEMINI_MODELS : DEFAULT_MODELS

// 모델 1개당 최대 대기 시간. 클라이언트(10초) 안에서 2개 모델까지 시도 가능하도록 설정.
const PER_MODEL_TIMEOUT_MS = 7000
// 이 시간을 넘기면 남은 모델 시도를 포기하고 폴백으로 전환.
const TOTAL_AI_BUDGET_MS = 9000

// 응답 길이 가드 (초과 시 서버에서 절삭)
const MAX_DEFINITION_LEN = 60
const MAX_ANALOGY_LEN = 320
const MAX_ROLE_LEN = 220

// NOTE: generationConfig.responseSchema 는 의도적으로 사용하지 않는다.
// 느슨한(optional) 스키마를 주면 flash-lite 계열이 status/term 만 채우고
// definition·analogy·role 을 생략해버리는 현상이 확인됨(2026-08). 대신
// responseMimeType(JSON 강제) + 프롬프트 지시 + safeJsonParse 조합으로 처리한다.

export async function POST(req: Request) {
  try {
    // ── 레이트리밋 ──────────────────────────────────────────────
    const ip = getClientIp(req)
    const rl = checkRateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          status: 'error',
          message: `요청이 많아요. ${rl.retryAfterSec}초 후 다시 시도해주세요.`,
        },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const body = await req.json()
    const query = (body.query || '').trim()
    const regenerate = Boolean(body.regenerate)
    const variantIndex = typeof body.variantIndex === 'number' ? body.variantIndex : 0

    if (!query) {
      return NextResponse.json(
        { status: 'error', message: '검색어를 입력해주세요.' },
        { status: 400 }
      )
    }
    if (query.length > 80) {
      return NextResponse.json(
        { status: 'irrelevant', message: '너무 긴 문장이에요. 궁금한 용어 하나만 입력해보세요.' },
        { status: 200 }
      )
    }

    const cacheKey = `${query.toLowerCase()}_v${variantIndex}_regen${regenerate}`
    if (!regenerate) {
      const cached = cache.get(cacheKey)
      if (cached) return NextResponse.json(cached)
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // Gemini API 키가 있으면 AI 생성 시도
    if (apiKey) {
      try {
        let aiResult = await fetchFromGemini(query, apiKey, regenerate, variantIndex)
        if (aiResult) {
          aiResult = reconcileWithDictionary(query, aiResult, variantIndex)
          aiResult = clampLengths(aiResult)
          if (!regenerate) cache.set(cacheKey, aiResult)
          return NextResponse.json(aiResult)
        }
      } catch (err) {
        console.warn('[Gemini] AI 호출 실패, 로컬 사전으로 폴백:', err)
      }
    }

    // Fallback: 로컬 사전 조회
    const localResult = getLocalExplanation(query, variantIndex)
    if (!regenerate) cache.set(cacheKey, localResult)
    return NextResponse.json(localResult)
  } catch (error: unknown) {
    console.error('[API] /api/explain 오류:', error)
    return NextResponse.json(
      { status: 'error', message: '설명을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * AI가 정상 용어를 typo/irrelevant 로 잘못 분류한 경우, 로컬 사전에
 * 정확히 일치하는 항목이 있으면 그것을 신뢰해 success 로 되돌린다.
 * (짧은 한글 용어에서 flash-lite 가 오탐하는 사례 방어)
 */
function reconcileWithDictionary(
  query: string,
  aiResult: ExplainApiResponse,
  variantIndex: number
): ExplainApiResponse {
  if (aiResult.status === 'success') return aiResult

  const known = findTerm(query)
  if (known) {
    const ex = getExplanation(known, variantIndex)
    console.log(`[Reconcile] AI=${aiResult.status} 이지만 사전에 '${known.term}' 존재 → success 로 보정`)
    return {
      status: 'success',
      term: known.term,
      definition: ex.definition,
      analogy: ex.analogy,
      role: ex.role,
      source: 'fallback',
    }
  }
  return aiResult
}

function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text
  const cut = text.slice(0, max)
  const lastStop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('。'), cut.lastIndexOf('다'))
  return (lastStop > max * 0.5 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + '…')
}

function clampLengths(r: ExplainApiResponse): ExplainApiResponse {
  if (r.status !== 'success') return r
  return {
    ...r,
    definition: truncate(r.definition || '', MAX_DEFINITION_LEN),
    analogy: truncate(r.analogy || '', MAX_ANALOGY_LEN),
    role: truncate(r.role || '', MAX_ROLE_LEN),
  }
}

function getLocalExplanation(query: string, variantIndex: number): ExplainApiResponse {
  const found = findTerm(query)
  if (found) {
    const explanation = getExplanation(found, variantIndex)
    return {
      status: 'success',
      term: found.term,
      definition: explanation.definition,
      analogy: explanation.analogy,
      role: explanation.role,
      source: 'fallback',
    }
  }

  const typo = suggestTerm(query)
  if (typo) {
    return {
      status: 'typo',
      suggestedTerm: typo,
      source: 'fallback',
    }
  }

  return {
    status: 'irrelevant',
    message: `'${query}'은(는) 보안 용어로 보이지 않아요. 다른 용어로 다시 검색해보세요.`,
    source: 'fallback',
  }
}

const SYSTEM_INSTRUCTION =
  '당신은 보안 전공 초보자와 교육생을 위해 어려운 보안 용어를 일상적인 비유로 쉽게 설명해주는 친절한 보안 교육 전문가입니다. ' +
  '항상 지정된 JSON 형식으로만 응답하고, 마크다운 백틱이나 부가 설명을 절대 포함하지 마세요. ' +
  '공격 실습 방법, 악성코드 제작, 실제 공격 페이로드 등 악용 가능한 요청은 개념 설명만 하거나 status를 irrelevant로 처리하세요.'

const FEW_SHOT = `[좋은 예시]
입력: "방화벽"
{"status":"success","term":"방화벽","definition":"규칙에 따라 네트워크 통신을 허용하거나 막는 장치","analogy":"건물 1층 로비의 경비 데스크와 같아요. 방문 목적과 출입증을 확인해 통과시킬 사람만 들여보내고, 목록에 없는 사람은 정중히 돌려보냅니다.","role":"네트워크 보안의 가장 기본적인 경계선입니다. 열어둘 필요가 없는 통로를 닫아 공격자가 두드릴 수 있는 문의 개수 자체를 줄여줍니다."}

입력: "날씨"
{"status":"irrelevant"}

입력: "랜성웨어"
{"status":"typo","suggestedTerm":"랜섬웨어"}`

function buildPrompt(query: string, regenerate: boolean, variantIndex: number): string {
  return `${FEW_SHOT}

이제 아래 입력을 같은 형식으로 처리하세요.
입력받은 용어: "${query}"
${regenerate ? `(주의: 기존과 완전히 다른 새로운 일상 비유를 사용하세요. 시드 번호: ${variantIndex})` : ''}

규칙:
1) 보안과 무관한 단어 → {"status":"irrelevant"}
2) 철자가 틀린 보안 용어로 추정 → {"status":"typo","suggestedTerm":"정확한 보안 용어"}
3) 올바른 보안 용어 또는 보안 분야 개념 → {
     "status":"success",
     "term":"정식 용어명",
     "definition":"초보자 눈높이의 한 줄 정의 (한국어 45자 이내, 문장부호 최소화)",
     "analogy":"누구나 겪을 법한 구체적 일상 상황에 빗댄 비유 2~3문장 (200자 이내)",
     "role":"실제 보안에서 왜 중요한지·어떤 역할을 하는지 2문장 (140자 이내)"
   }`
}

async function fetchFromGemini(
  query: string,
  apiKey: string,
  regenerate: boolean,
  variantIndex: number
): Promise<ExplainApiResponse | null> {
  const prompt = buildPrompt(query, regenerate, variantIndex)
  const startedAt = Date.now()
  let lastError = ''

  for (const model of MODELS) {
    if (Date.now() - startedAt > TOTAL_AI_BUDGET_MS) {
      lastError = 'AI 예산 시간 초과 — 폴백 전환'
      break
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS)

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: regenerate ? 0.9 : 0.4,
              responseMimeType: 'application/json',
              maxOutputTokens: 2048,
            },
          }),
        }
      )

      if (!res.ok) {
        lastError = `HTTP ${res.status} (${model})`
        continue
      }

      const data = await res.json()
      const rawText: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        lastError = `빈 응답 (${model})`
        continue
      }

      const parsed = safeJsonParse(rawText)
      if (!parsed) {
        lastError = `JSON 파싱 실패 (${model})`
        continue
      }

      if (
        parsed.status === 'success' &&
        parsed.definition &&
        parsed.analogy &&
        parsed.role
      ) {
        const u = data.usageMetadata
        console.log(
          `[Gemini] ✅ ${model} 성공 — query: "${query}" (${Date.now() - startedAt}ms` +
            (u ? `, tokens: ${u.promptTokenCount ?? '?'}+${u.candidatesTokenCount ?? '?'}` : '') +
            ')'
        )
        return {
          status: 'success',
          term: parsed.term || query,
          definition: parsed.definition,
          analogy: parsed.analogy,
          role: parsed.role,
          source: 'ai',
          model,
        }
      }
      if (parsed.status === 'typo' && parsed.suggestedTerm) {
        return { status: 'typo', suggestedTerm: parsed.suggestedTerm, source: 'ai', model }
      }
      if (parsed.status === 'irrelevant') {
        return {
          status: 'irrelevant',
          message: `'${query}'은(는) 보안 용어로 보이지 않아요. 다른 용어로 다시 검색해보세요.`,
          source: 'ai',
          model,
        }
      }

      lastError = `불완전 응답 (${model}): status=${parsed.status}, keys=${Object.keys(parsed).join(',')}`
      console.warn(`[Gemini] ⚠️ ${lastError}`)
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string }
      lastError = e.name === 'AbortError' ? `타임아웃 ${PER_MODEL_TIMEOUT_MS}ms (${model})` : (e.message || String(err))
      console.warn(`[Gemini] ⚠️ ${lastError}`)
    } finally {
      clearTimeout(timer)
    }
  }

  console.warn(`[Gemini] 모든 모델 실패. 마지막 오류: ${lastError}`)
  return null
}

/** 모델이 실수로 감싼 ```json 펜스/잡텍스트를 제거하고 JSON 객체만 파싱한다. */
function safeJsonParse(text: string): Record<string, string> | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}
