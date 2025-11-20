// Authentication middleware for JWT validation
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JWTPayload } from '../types'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
      }
    }
  }
}

// Get JWT secret from environment
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}
const JWT_SECRET: string = process.env.JWT_SECRET

/**
 * Middleware to authenticate requests using JWT tokens
 * Expects Authorization header: Bearer <token>
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get token from Authorization header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)

    // Type guard to ensure decoded is JWTPayload
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'email' in decoded) {
      const payload = decoded as JWTPayload

      // Attach user to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
      }

      next()
    } else {
      res.status(401).json({ error: 'Invalid token payload' })
      return
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Middleware to authenticate SSE requests using JWT tokens
 * Accepts token from Authorization header OR query parameter
 * (EventSource doesn't support custom headers, so query param is needed)
 */
export function authenticateSSE(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Try to get token from Authorization header first
  const authHeader = req.headers['authorization']
  let token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  // Fall back to query parameter for SSE (EventSource limitation)
  if (!token && req.query.token && typeof req.query.token === 'string') {
    token = req.query.token
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)

    // Type guard to ensure decoded is JWTPayload
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'email' in decoded) {
      const payload = decoded as JWTPayload

      // Attach user to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
      }

      next()
    } else {
      res.status(401).json({ error: 'Invalid token payload' })
      return
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}
