/**
 * POST /api/auth/register
 * Register a new user
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

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

interface RegisterRequest {
  email: string
  password: string
  name?: string
}

interface JWTPayload {
  userId: string
  email: string
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
function isValidPassword(password: string): boolean {
  if (password.length < 8) return false

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return hasUppercase && hasLowercase && hasNumber && hasSpecial
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
    const body = await request.json() as RegisterRequest
    const { email, password, name } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await drizzleDb.getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user
    const user = await drizzleDb.createUser({
      email,
      password: hashedPassword,
      name: name || undefined,
    })

    // Generate tokens
    const tokens = generateTokens(user.id, user.email)

    // Update user with refresh token
    await drizzleDb.updateUserRefreshToken(user.id, tokens.refreshToken)

    return NextResponse.json(
      {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Auth] Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
