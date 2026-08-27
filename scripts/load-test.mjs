/**
 * 부하 테스트 — 동시 요청에서 p50/p95/p99 지연과 폴백/429/503 비율 측정
 *
 *   node scripts/load-test.mjs [총요청수] [동시성] [베이스URL]
 *   node scripts/load-test.mjs 60 20
 *
 * 주의: /api/explain 은 IP당 60초 20회 레이트리밋이 있으므로,
 * 총요청수를 20 초과로 주면 429 가 섞여 나오는 것이 정상이다(레이트리밋 검증 목적).
 * 순수 지연만 보려면 총요청수 ≤ 20 으로.
 */
const TOTAL = Number(process.argv[2] || 20)
const CONCURRENCY = Number(process.argv[3] || 10)
const BASE = process.argv[4] || 'http://localhost:3000'

const TERMS = [
  '피싱', 'VPN', '랜섬웨어', '방화벽', '제로데이', 'DDoS', 'XSS', 'CSRF',
  'SQL 인젝션', '봇넷', '스미싱', '루트킷', '사회공학', '해시', '샌드박스',
  '중간자 공격', 'APT', '제로 트러스트', '전자서명', '스푸핑',
]

let idx = 0
const results = []

async function worker() {
  while (idx < TOTAL) {
    const my = idx++
    const term = TERMS[my % TERMS.length] + (my >= TERMS.length ? ` ${my}` : '')
    const started = Date.now()
    try {
      const res = await fetch(`${BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term }),
      })
      const d = await res.json().catch(() => ({}))
      results.push({ ms: Date.now() - started, http: res.status, status: d.status, source: d.source })
    } catch (e) {
      results.push({ ms: Date.now() - started, http: 0, error: e.message })
    }
  }
}

const wallStart = Date.now()
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
const wallMs = Date.now() - wallStart

const ok = results.filter((r) => r.http === 200)
const lat = ok.map((r) => r.ms).sort((a, b) => a - b)
const pct = (p) => (lat.length ? lat[Math.min(lat.length - 1, Math.floor((p / 100) * lat.length))] : null)

const by = (f) => results.filter(f).length

console.log(`\n부하 테스트 결과  (${BASE})`)
console.log(`  총 ${TOTAL}건 / 동시성 ${CONCURRENCY} / 전체 소요 ${wallMs}ms / 처리량 ${(TOTAL / (wallMs / 1000)).toFixed(1)} req/s\n`)
console.log(`  HTTP 200        : ${by((r) => r.http === 200)}`)
console.log(`  HTTP 429(제한)  : ${by((r) => r.http === 429)}`)
console.log(`  HTTP 5xx        : ${by((r) => r.http >= 500)}`)
console.log(`  네트워크 오류   : ${by((r) => r.http === 0)}\n`)
console.log(`  응답 소스 — ai: ${by((r) => r.source === 'ai')}  fallback: ${by((r) => r.source === 'fallback')}\n`)
console.log(`  지연(200 기준)  p50 ${pct(50)}ms  p95 ${pct(95)}ms  p99 ${pct(99)}ms  max ${lat.at(-1)}ms`)

const slaOk = lat.filter((m) => m <= 3000).length
console.log(`  3초 SLA 충족    : ${slaOk}/${lat.length} (${lat.length ? Math.round((slaOk / lat.length) * 100) : 0}%)`)
