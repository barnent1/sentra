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
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

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
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }

    next()
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
