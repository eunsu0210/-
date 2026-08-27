/**
 * 모델 갱신 루틴 (분기 1회 권장)
 *
 *   node scripts/check-models.mjs
 *
 * Gemini ListModels 로 generateContent 지원 모델을 나열하고,
 * flash 계열 후보에 짧은 한국어 프롬프트를 던져 지연/성공을 실측한다.
 * 결과를 보고 app/api/explain/route.ts 의 DEFAULT_MODELS 상단 교체를 검토한다.
 */
import { readFileSync } from 'node:fs'

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  for (const f of ['.env.local', '.env']) {
    try {
      const line = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
        .split(/\r?\n/)
        .find((l) => l.startsWith('GEMINI_API_KEY='))
      if (line) {
        const v = line.slice('GEMINI_API_KEY='.length).trim()
        if (v && v !== 'your_gemini_api_key_here') return v
      }
    } catch {}
  }
  return null
}

const KEY = loadKey()
if (!KEY) {
  console.error('GEMINI_API_KEY 를 찾을 수 없습니다 (.env.local 확인).')
  process.exit(1)
}

const PROMPT =
  '보안 용어 "제로데이"를 초보자에게 설명. JSON만: {"status":"success","term":"제로데이","definition":"45자 이내","analogy":"비유 2문장","role":"역할 2문장"}'

async function listModels() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': KEY },
  })
  const data = await res.json()
  return (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
}

async function probe(model) {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json', maxOutputTokens: 2048 },
        }),
      }
    )
    const ms = Date.now() - started
    if (!res.ok) return { model, ok: false, ms, note: `HTTP ${res.status}` }
    const data = await res.json()
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text
    let complete = false
    try {
      const p = JSON.parse(txt)
      complete = Boolean(p.definition && p.analogy && p.role)
    } catch {}
    return { model, ok: complete, ms, note: complete ? '3요소 완전' : '불완전 응답' }
  } catch (e) {
    return { model, ok: false, ms: Date.now() - started, note: e.name === 'AbortError' ? 'timeout(15s)' : e.message }
  } finally {
    clearTimeout(timer)
  }
}

const all = await listModels()
console.log(`\ngenerateContent 지원 모델 ${all.length}개\n`)

const candidates = all.filter((m) => /flash/.test(m) && !/(image|tts|audio|live|robotics|transcribe)/.test(m))
console.log(`flash 후보 ${candidates.length}개 실측 (제로데이 설명, 3초 SLA 기준)\n`)

const rows = []
for (const m of candidates) {
  const r = await probe(m)
  rows.push(r)
  const flag = r.ok && r.ms <= 3000 ? '✅' : r.ok ? '🟡' : '❌'
  console.log(`  ${flag} ${m.padEnd(34)} ${String(r.ms + 'ms').padStart(8)}  ${r.note}`)
}

const best = rows.filter((r) => r.ok).sort((a, b) => a.ms - b.ms)[0]
console.log(
  best
    ? `\n권장 1순위: ${best.model} (${best.ms}ms)\n→ route.ts DEFAULT_MODELS 확인/갱신`
    : '\n⚠️ 3초 내 완전 응답 모델 없음 — 폴백 사전 비중 점검 필요'
)
