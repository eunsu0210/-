import { NextResponse } from 'next/server'
import { findTerm, getExplanation, suggestTerm } from '@/lib/mock-terms'

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

// 인메모리 캐시 (빠른 응답 최적화)
const cache = new Map<string, ExplainApiResponse>()

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

// NOTE: generationConfig.responseSchema 는 의도적으로 사용하지 않는다.
// 느슨한(optional) 스키마를 주면 flash-lite 계열이 status/term 만 채우고
// definition·analogy·role 을 생략해버리는 현상이 확인됨(2026-08). 대신
// responseMimeType(JSON 강제) + 프롬프트 지시 + safeJsonParse 조합으로 처리한다.

export async function POST(req: Request) {
  try {
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

    const cacheKey = `${query.toLowerCase()}_v${variantIndex}_regen${regenerate}`
    if (!regenerate && cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey)!)
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // Gemini API 키가 있으면 AI 생성 시도
    if (apiKey) {
      try {
        const aiResult = await fetchFromGemini(query, apiKey, regenerate, variantIndex)
        if (aiResult) {
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
  '반드시 지정된 JSON 형식으로만 응답하고, 마크다운 백틱이나 부가 설명을 절대 포함하지 마세요.'

function buildPrompt(query: string, regenerate: boolean, variantIndex: number): string {
  return `입력받은 용어: "${query}"
${regenerate ? `(주의: 기존과 완전히 다른 새로운 비유 방식을 사용하세요. 시드 번호: ${variantIndex})` : ''}

다음 규칙에 따라 status 를 결정하세요:

1) 보안과 무관한 단어("사과", "날씨", "축구" 등)  → {"status":"irrelevant"}
2) 철자가 틀린 보안 용어로 추정("피슁"→"피싱")     → {"status":"typo","suggestedTerm":"정확한 보안 용어"}
3) 올바른 보안 용어 또는 보안 분야 개념           → {
     "status":"success",
     "term":"정식 용어명",
     "definition":"초보자 눈높이의 간결하고 명확한 한 줄 정의 (40자 이내)",
     "analogy":"누구나 겪을 법한 구체적 일상 상황에 빗댄 비유 2~3문장",
     "role":"실제 보안에서 왜 중요한지, 어떤 역할을 하는지 2문장"
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
        console.log(`[Gemini] ✅ ${model} 성공 — query: "${query}" (${Date.now() - startedAt}ms)`)
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
