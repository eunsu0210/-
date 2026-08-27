// 상한이 있는 초경량 LRU 캐시. Map 의 삽입 순서 보존 특성을 이용한다.
// (가장 오래 안 쓰인 항목 = Map 의 첫 번째 key)

export class LruCache<V> {
  private map = new Map<string, V>()

  constructor(private readonly max = 500) {}

  get(key: string): V | undefined {
    const val = this.map.get(key)
    if (val === undefined) return undefined
    // 최근 사용으로 갱신: 지웠다가 다시 넣어 맨 뒤로 이동
    this.map.delete(key)
    this.map.set(key, val)
    return val
  }

  has(key: string): boolean {
    return this.map.has(key)
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
  }

  get size(): number {
    return this.map.size
  }
}
