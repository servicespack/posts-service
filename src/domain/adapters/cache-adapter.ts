export interface ICacheAdapter {
  get: <T>(key: string) => Promise<T | null>
  set: (key: string, value: unknown, ttlSeconds?: number) => Promise<void>
  invalidatePattern: (pattern: string) => Promise<void>
}
