import type { RedisClientType } from 'redis'
import type { ICacheAdapter } from '../../domain/adapters/cache-adapter'
import process from 'node:process'
import { createClient } from 'redis'
import { logger } from '../logging/logger'

const MAX_RECONNECT_ATTEMPTS = 3

export class CacheService implements ICacheAdapter {
  private client: RedisClientType | null = null
  private connected = false

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        disableOfflineQueue: true,
        socket: {
          reconnectStrategy: retries => retries < MAX_RECONNECT_ATTEMPTS
            ? Math.min(2 ** retries * 100, 1000)
            : false,
        },
      })
      this.client.on('error', (err: unknown) => {
        logger.warn({ err: String(err) }, 'Redis connection error')
      })
      this.client.on('ready', () => {
        logger.info('Redis connected')
        this.connected = true
      })
      this.client.on('end', () => {
        this.connected = false
      })
      await this.client.connect()
    }
    catch (err: any) {
      logger.warn({ err: String(err?.message || err) }, 'Redis connection failed - caching disabled')
      this.connected = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client)
      return null

    try {
      const data = await this.client.get(key)
      if (!data)
        return null
      return JSON.parse(data) as T
    }
    catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    if (!this.connected || !this.client)
      return

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value))
    }
    catch (err: any) {
      logger.warn({ err: String(err?.message || err) }, 'Redis set failed')
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.connected || !this.client)
      return

    try {
      await this.client.del(key)
    }
    catch (err: any) {
      logger.warn({ err: String(err?.message || err) }, 'Redis invalidate failed')
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.connected || !this.client)
      return
    try {
      let cursor = '0'
      do {
        const result = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 })
        cursor = String(result.cursor)
        if (result.keys.length > 0) {
          await this.client.del(result.keys)
        }
      } while (cursor !== '0')
    }
    catch (err: any) {
      logger.warn({ err: String(err?.message || err) }, 'Redis invalidatePattern failed')
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  async disconnect() {
    await this.client?.disconnect()
    this.connected = false
  }
}
