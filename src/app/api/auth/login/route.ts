/**
 * POST /api/auth/login
 * Login with email and password
 */

import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for bcrypt compatibility
export const runtime = 'nodejs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { drizzleDb } from '@/services/database-drizzle'

// Get JWT secrets from environment
const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

interface LoginRequest {
  email: string
  password: string
}

interface JWTPayload {
  userId: string
  email: string
}

/**
 * Generate JWT token and refresh token
 */
function generateTokens(userId: string, email: string) {
  const payload: JWTPayload = { userId, email }

  const token = jwt.sign(payload, JWT_SECRET!, { expiresIn: TOKEN_EXPIRY })
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })

  return { token, refreshToken }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await drizzleDb.getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user.id, user.email)

    // Update refresh token in database
    await drizzleDb.updateUserRefreshToken(user.id, refreshToken)

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
