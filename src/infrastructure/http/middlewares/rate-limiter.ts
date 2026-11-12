import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { logger } from '../../logging/logger'

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per windowMs per IP (roughly 20/min avg)
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests, please try again later.' },
  handler: (req: Request, res: Response) => {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded (general)')
    res.status(429).json({ msg: 'Too many requests, please try again later.' })
  },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs per IP for authenticated routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests, please try again later.' },
  handler: (req: Request, res: Response) => {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded (auth)')
    res.status(429).json({ msg: 'Too many requests, please try again later.' })
  },
})

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per windowMs per IP for strict routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests, please try again later.' },
  handler: (req: Request, res: Response) => {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded (strict)')
    res.status(429).json({ msg: 'Too many requests, please try again later.' })
  },
})
