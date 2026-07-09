/**
 * Minimal bounded LRU built on Map's insertion order: a get re-inserts the
 * key (marking it most recent), a set past capacity evicts the oldest.
 */
export class LruCache<K, V> {
  private map = new Map<K, V>()

  constructor(private readonly maxEntries: number) {
    if (maxEntries < 1) throw new Error('LruCache needs a capacity of at least 1')
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key) as V
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value as K
      this.map.delete(oldest)
    }
  }

  delete(key: K): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  get size(): number {
    return this.map.size
  }
}
