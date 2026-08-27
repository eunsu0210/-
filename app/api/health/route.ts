import { NextResponse } from 'next/server'
import { snapshot } from '@/lib/metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PRIMARY_MODEL =
  (process.env.GEMINI_MODELS || '').split(',')[0].trim() || 'gemini-flash-lite-latest'

/**
 * GET /api/health
 * 배포 모니터링용. Gemini 기본 모델에 짧은 핑을 보내 실제 도달 가능 여부를 확인한다.
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const keyConfigured = Boolean(apiKey)

  if (!keyConfigured) {
    return NextResponse.json({
      ok: true,
      mode: 'fallback-only',
      keyConfigured: false,
      note: 'GEMINI_API_KEY 미설정 — 로컬 사전 폴백으로만 동작합니다.',
      metrics: snapshot(),
    })
  }

  const startedAt = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey! },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping. reply with the single word: pong' }] }],
          generationConfig: { maxOutputTokens: 16, temperature: 0 },
        }),
      }
    )
    const latencyMs = Date.now() - startedAt

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, keyConfigured: true, model: PRIMARY_MODEL, httpStatus: res.status, latencyMs, metrics: snapshot() },
        { status: 503 }
      )
    }
    return NextResponse.json({ ok: true, keyConfigured: true, model: PRIMARY_MODEL, latencyMs, metrics: snapshot() })
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    return NextResponse.json(
      {
        ok: false,
        keyConfigured: true,
        model: PRIMARY_MODEL,
        error: e.name === 'AbortError' ? 'timeout(8s)' : e.message || String(err),
        latencyMs: Date.now() - startedAt,
        metrics: snapshot(),
      },
      { status: 503 }
    )
  } finally {
    clearTimeout(timer)
  }
}
