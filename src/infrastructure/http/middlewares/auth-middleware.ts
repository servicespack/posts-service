import type { NextFunction, Request, Response } from 'express'
import process from 'node:process'
import jwt from 'jsonwebtoken'
import { logger } from '../../logging/logger'

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization

  if (!authorization) {
    res.status(401).json({ msg: 'No token provided' })
    return
  }

  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ msg: 'Token malformed' })
    return
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      logger.error('JWT_SECRET environment variable is required in production.')
      res.status(500).json({ msg: 'Internal server error' })
      return
    }

    const secretToUse = jwtSecret || 'secret'

    const decoded = jwt.verify(token, secretToUse, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'servicespack',
      audience: process.env.JWT_AUDIENCE || 'servicespack',
    }) as { sub?: string, id?: string }

    const userId = decoded.sub || decoded.id
    if (!userId) {
      res.status(401).json({ msg: 'Invalid token' })
      return
    }

    req.userId = userId
    next()
  }
  catch {
    res.status(401).json({ msg: 'Invalid token' })
  }
}
