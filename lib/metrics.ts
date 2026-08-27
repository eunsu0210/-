// 프로세스 생존 기간 동안의 초경량 카운터. 외부 의존성 없이 폴백률을 관찰하기 위한 용도.
// 인스턴스 재시작 시 초기화되며, 다중 인스턴스에서는 합산되지 않는다(운영 지표는 별도 APM 권장).

type Counters = {
  startedAt: number
  total: number
  ai: number
  fallback: number
  error: number
  rateLimited: number
  reconciled: number
  latencySamples: number[] // 최근 N개 (ms)
}

const MAX_SAMPLES = 200

const c: Counters = {
  startedAt: Date.now(),
  total: 0,
  ai: 0,
  fallback: 0,
  error: 0,
  rateLimited: 0,
  reconciled: 0,
  latencySamples: [],
}

export function recordOutcome(
  kind: 'ai' | 'fallback' | 'error' | 'rateLimited',
  latencyMs?: number
) {
  c.total++
  c[kind]++
  if (typeof latencyMs === 'number') {
    c.latencySamples.push(latencyMs)
    if (c.latencySamples.length > MAX_SAMPLES) c.latencySamples.shift()
  }
}

export function recordReconcile() {
  c.reconciled++
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

export function snapshot() {
  const served = c.ai + c.fallback
  const sorted = [...c.latencySamples].sort((a, b) => a - b)
  return {
    uptimeSec: Math.round((Date.now() - c.startedAt) / 1000),
    total: c.total,
    ai: c.ai,
    fallback: c.fallback,
    error: c.error,
    rateLimited: c.rateLimited,
    reconciled: c.reconciled,
    fallbackRate: served > 0 ? +(c.fallback / served).toFixed(3) : 0,
    latencyMs: {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      samples: sorted.length,
    },
  }
}
