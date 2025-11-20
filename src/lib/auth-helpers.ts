/**
 * Auth Helpers for Next.js API Routes
 *
 * Utilities for extracting user information from request headers
 * (set by middleware after JWT verification)
 */

import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
}

/**
 * Get authenticated user from request headers
 * Returns null if user info is not present (shouldn't happen if middleware runs)
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
  const userId = request.headers.get('x-user-id')
  const email = request.headers.get('x-user-email')

  if (!userId || !email) {
    return null
  }

  return {
    userId,
    email,
  }
}

/**
 * Get authenticated user or throw error
 * Use this when user is required (should always be available after middleware)
 */
export function requireAuthUser(request: NextRequest): AuthUser {
  const user = getAuthUser(request)

  if (!user) {
    throw new Error('User not authenticated')
  }

  return user
}
