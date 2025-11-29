/**
 * POST /api/auth/register
 * Register a new user
 */

import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for bcrypt compatibility
export const runtime = 'nodejs'
import bcrypt from 'bcrypt'
import { SignJWT } from 'jose'
import { drizzleDb } from '@/services/database-drizzle'

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
  [key: string]: unknown
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password - just minimum 8 characters (simple signup)
 */
function isValidPassword(password: string): boolean {
  return password.length >= 8
}

/**
 * Generate JWT token and refresh token using jose
 */
async function generateTokens(userId: string, email: string) {
  // Get JWT secrets from environment at runtime
  const JWT_SECRET = process.env.JWT_SECRET
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  const payload: JWTPayload = { userId, email }

  const secret = new TextEncoder().encode(JWT_SECRET)
  const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET)

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

    // Validate password length
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Create a personal organization for the user
    const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
    const organization = await drizzleDb.createOrganization({
      name: name ? `${name}'s Workspace` : 'Personal Workspace',
      slug,
      description: 'Personal organization created on signup',
    })

    // Add user as owner of the organization
    await drizzleDb.addOrganizationMember({
      orgId: organization.id,
      userId: user.id,
      role: 'owner',
    })

    // Generate tokens
    const tokens = await generateTokens(user.id, user.email)

    // Update user with refresh token
    await drizzleDb.updateUserRefreshToken(user.id, tokens.refreshToken)

    return NextResponse.json(
      {
        accessToken: tokens.token,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600, // 1 hour in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Auth] Register error:', error)
    console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[Auth] Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
