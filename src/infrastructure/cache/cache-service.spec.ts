import type { RedisClientType } from 'redis'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CacheService } from './cache-service'

describe('cacheService', () => {
  let service: CacheService
  let mockClient: Partial<RedisClientType>

  beforeEach(() => {
    vi.resetAllMocks()
    mockClient = {
      get: vi.fn().mockResolvedValue(null),
      setEx: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(0),
      scan: vi.fn().mockResolvedValue({ cursor: '0', keys: [] }),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
    }
    service = new CacheService()
    Object.defineProperty(service as any, 'client', { value: mockClient, writable: true })
    Object.defineProperty(service as any, 'connected', { value: true, writable: true })
  })

  it('should return null when not connected', async () => {
    Object.defineProperty(service as any, 'connected', { value: false, writable: true })
    const result = await service.get<string>('key')
    expect(result).toBe(null)
  })

  it('should return parsed data on get', async () => {
    const json = JSON.stringify({ foo: 'bar' })
    mockClient.get = vi.fn().mockResolvedValue(json)
    const result = await service.get<{ foo: string }>('key')
    expect(result).toEqual({ foo: 'bar' })
  })

  it('should return null when get returns empty', async () => {
    mockClient.get = vi.fn().mockResolvedValue(null)
    const result = await service.get<string>('key')
    expect(result).toBe(null)
  })

  it('should return null on get parse error', async () => {
    mockClient.get = vi.fn().mockResolvedValue('not json')
    const result = await service.get<{ foo: string }>('key')
    expect(result).toBe(null)
  })

  it('should set a key with ttl when connected', async () => {
    await service.set('mykey', { data: 123 }, 60)
    expect(mockClient.setEx).toHaveBeenCalledWith('mykey', 60, JSON.stringify({ data: 123 }))
  })

  it('should not set when not connected', async () => {
    Object.defineProperty(service as any, 'connected', { value: false, writable: true })
    await service.set('mykey', { data: 123 })
    expect(mockClient.setEx).not.toHaveBeenCalled()
  })

  it('should invalidate a single key', async () => {
    await service.invalidate('mykey')
    expect(mockClient.del).toHaveBeenCalledWith('mykey')
  })

  it('should invalidate all keys matching a pattern', async () => {
    mockClient.scan = vi.fn().mockResolvedValue({ cursor: '0', keys: ['a', 'b', 'c'] })
    await service.invalidatePattern('posts:*')
    expect(mockClient.del).toHaveBeenCalledWith(['a', 'b', 'c'])
  })

  it('should handle multiple scan pages', async () => {
    mockClient.scan = vi
      .fn()
      .mockResolvedValueOnce({ cursor: '1', keys: ['a'] })
      .mockResolvedValueOnce({ cursor: '0', keys: ['b'] })
    await service.invalidatePattern('posts:*')
    expect(mockClient.scan).toHaveBeenCalledTimes(2)
    expect(mockClient.del).toHaveBeenCalledWith(['a'])
    expect(mockClient.del).toHaveBeenCalledWith(['b'])
  })

  it('should report connection state', () => {
    expect(service.isConnected()).toBe(true)
    Object.defineProperty(service as any, 'connected', { value: false, writable: true })
    expect(service.isConnected()).toBe(false)
  })
})
