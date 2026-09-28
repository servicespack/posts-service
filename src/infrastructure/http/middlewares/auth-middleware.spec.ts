import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from './auth-middleware'
import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authMiddleware } from './auth-middleware'

describe('authMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    nextFunction = vi.fn()
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_ISSUER = 'servicespack'
    process.env.JWT_AUDIENCE = 'servicespack'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return 401 if no authorization header is provided', () => {
    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'No token provided' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 401 if authorization header is malformed', () => {
    mockRequest.headers!.authorization = 'Bearer'

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Token malformed' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 401 if token scheme is not Bearer', () => {
    mockRequest.headers!.authorization = 'Basic token123'

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Token malformed' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 401 for an invalid token signature', () => {
    mockRequest.headers!.authorization = 'Bearer invalid-token'

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Invalid token' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should authenticate successfully with valid Bearer token and set userId', () => {
    const userId = 'user-123'
    const token = jwt.sign(
      { sub: userId },
      'test-secret',
      { issuer: 'servicespack', audience: 'servicespack' },
    )

    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockRequest.userId).toBe(userId)
    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('should fallback to decoded.id if sub is missing', () => {
    const userId = 'user-id-456'
    const token = jwt.sign(
      { id: userId },
      'test-secret',
      { issuer: 'servicespack', audience: 'servicespack' },
    )

    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockRequest.userId).toBe(userId)
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should return 401 if token does not contain sub or id', () => {
    const token = jwt.sign(
      { email: 'test@example.com' },
      'test-secret',
      { issuer: 'servicespack', audience: 'servicespack' },
    )

    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Invalid token' })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should return 500 in production if JWT_SECRET is missing', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    delete process.env.JWT_SECRET

    const token = jwt.sign(
      { sub: 'user-123' },
      'fallback-secret',
      { issuer: 'servicespack', audience: 'servicespack' },
    )
    mockRequest.headers!.authorization = `Bearer ${token}`

    authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({ msg: 'Internal server error' })
    expect(nextFunction).not.toHaveBeenCalled()

    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv
    }
    else {
      delete process.env.NODE_ENV
    }
  })
})
