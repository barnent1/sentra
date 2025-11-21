/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for JWT compatibility
export const runtime = 'nodejs'
import { SignJWT, jwtVerify } from 'jose'
import { drizzleDb } from '@/services/database-drizzle'

// Get JWT secrets from environment
const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

interface RefreshTokenRequest {
  refreshToken: string
}

interface JWTPayload {
  userId: string
  email: string
  [key: string]: unknown
}

/**
 * Generate JWT token and refresh token using jose
 */
async function generateTokens(userId: string, email: string) {
  const payload: JWTPayload = { userId, email }

  const secret = new TextEncoder().encode(JWT_SECRET!)
  const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET!)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(secret)

  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(refreshSecret)

  return { token, refreshToken }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RefreshTokenRequest
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'refreshToken is required' },
        { status: 400 }
      )
    }

    // Verify refresh token using jose
    let decoded: JWTPayload
    try {
      const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET!)
      const { payload } = await jwtVerify(refreshToken, refreshSecret)
      decoded = payload as unknown as JWTPayload
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Find user and verify refresh token matches
    const user = await drizzleDb.getUserById(decoded.userId)

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Generate new tokens
    const tokens = await generateTokens(user.id, user.email)

    // Update refresh token in database
    await drizzleDb.updateUserRefreshToken(user.id, tokens.refreshToken)

    return NextResponse.json({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[Auth] Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
