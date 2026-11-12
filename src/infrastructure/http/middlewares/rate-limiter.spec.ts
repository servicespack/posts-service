import express from 'express'
import { MemoryStore, rateLimit } from 'express-rate-limit'
import { describe, expect, it, vi } from 'vitest'
import { logger } from '../../logging/logger'
import { authLimiter, generalLimiter, strictLimiter } from './rate-limiter'

describe('rateLimiter', () => {
  it('should be exported and be a function', () => {
    expect(generalLimiter).toBeDefined()
    expect(authLimiter).toBeDefined()
    expect(strictLimiter).toBeDefined()
    expect(typeof generalLimiter).toBe('function')
    expect(typeof authLimiter).toBe('function')
    expect(typeof strictLimiter).toBe('function')
  })

  it('should return 429 and log when limit is exceeded', async () => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const store = new MemoryStore()
    const limiter = rateLimit({
      store,
      max: 1,
      windowMs: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { msg: 'Too many requests, please try again later.' },
      handler: (req, res) => {
        logger.warn({ ip: req.ip }, 'Rate limit exceeded')
        res.status(429).json({ msg: 'Too many requests, please try again later.' })
      },
    })

    const server = await new Promise<import('node:net').Server>((resolve) => {
      const app = express()
      app.use(limiter)
      app.use((req, res) => res.json({ ok: true }))
      resolve(app.listen(0))
    })
    const port = (server.address() as any).port
    const url = `http://127.0.0.1:${port}`

    const r1 = await fetch(url)
    const r2 = await fetch(url)
    server.close()

    expect(r1.status).toBe(200)
    expect(r2.status).toBe(429)
    expect(logger.warn).toHaveBeenCalledWith(expect.anything(), 'Rate limit exceeded')
  })
})
