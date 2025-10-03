/**
 * Rate Limiter Middleware
 *
 * User-specific rate limiting for authenticated requests.
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types/auth.js';
import { AppError } from './errorHandler.js';

/**
 * Key generator for user-based rate limiting
 *
 * Uses the authenticated user ID as the rate limit key.
 * Falls back to IP address for unauthenticated requests.
 */
function userKeyGenerator(req: Request): string {
  const authReq = req as AuthenticatedRequest;

  // Use user ID if authenticated
  if (authReq.user?.userId) {
    return `user:${authReq.user.userId}`;
  }

  // Fall back to IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Custom handler for rate limit exceeded
 */
function rateLimitHandler(_req: Request, _res: Response): void {
  throw new AppError(
    'Too many requests, please try again later',
    429,
    'RATE_LIMIT_EXCEEDED',
    {
      retryAfter: '60 seconds',
    }
  );
}

/**
 * Skip rate limiting for certain conditions
 *
 * @param req - Express request
 * @returns True to skip rate limiting
 */
function skipRateLimiting(req: Request): boolean {
  // Skip rate limiting for health checks
  if (req.path === '/health' || req.path === '/ready') {
    return true;
  }

  return false;
}

/**
 * Rate limiter for authenticated users
 *
 * More permissive rate limit for authenticated requests.
 */
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimiting,
});

/**
 * Strict rate limiter for unauthenticated requests
 *
 * More restrictive rate limit for requests without authentication.
 */
export const unauthenticatedRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  },
  handler: rateLimitHandler,
  skip: skipRateLimiting,
});

/**
 * Adaptive rate limiter
 *
 * Applies different rate limits based on whether the request is authenticated.
 */
export function adaptiveRateLimiter(
  req: Request,
  res: Response,
  next: () => void
): void {
  const authReq = req as AuthenticatedRequest;

  // Use authenticated rate limiter if user is present
  if (authReq.user?.userId) {
    authenticatedRateLimiter(req, res, next);
  } else {
    unauthenticatedRateLimiter(req, res, next);
  }
}
