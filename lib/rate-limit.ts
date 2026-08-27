// 아주 가벼운 인메모리 슬라이딩 윈도우 레이트리미터.
// 단일 인스턴스/로컬·소규모 배포용. 다중 인스턴스에서는 Redis 등으로 교체 필요.

type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * @param key        식별자 (보통 클라이언트 IP)
 * @param limit      윈도우당 최대 허용 횟수
 * @param windowMs   윈도우 길이(ms)
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now()
  const cutoff = now - windowMs

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { hits: [] }
    buckets.set(key, bucket)
  }

  // 윈도우 밖의 오래된 기록 제거
  bucket.hits = bucket.hits.filter((t) => t > cutoff)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { allowed: false, remaining: 0, retryAfterSec }
  }

  bucket.hits.push(now)

  // 유휴 버킷이 무한정 쌓이지 않도록 가벼운 청소
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => t <= cutoff)) buckets.delete(k)
    }
  }

  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    retryAfterSec: 0,
  }
}

/** 프록시 헤더에서 클라이언트 IP를 최선을 다해 추출한다. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'local'
  )
}
