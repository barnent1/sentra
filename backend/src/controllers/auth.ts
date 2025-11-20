// Authentication controller
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { drizzleDb } from '@/services/database-drizzle'
import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
  JWTPayload,
} from '../types'

// Get JWT secrets from environment
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const JWT_SECRET: string = process.env.JWT_SECRET
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || JWT_SECRET

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

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

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })

  return { token, refreshToken }
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body as RegisterRequest

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      res.status(400).json({
        error:
          'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
      })
      return
    }

    // Check if user already exists
    const existingUser = await drizzleDb.getUserByEmail(email)

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user (Drizzle service handles user creation)
    const user = await drizzleDb.createUser({
      email,
      password: hashedPassword,
      name: name || undefined,
    })

    // Generate tokens with actual user ID
    const tokens = generateTokens(user.id, user.email)

    // Update user with refresh token
    await drizzleDb.updateUserRefreshToken(user.id, tokens.refreshToken)

    const response: AuthResponse = {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('[Auth] Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequest

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const user = await drizzleDb.getUserByEmail(email)

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user.id, user.email)

    // Update refresh token in database
    await drizzleDb.updateUserRefreshToken(user.id, refreshToken)

    const response: AuthResponse = {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('[Auth] Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function refreshToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest

    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' })
      return
    }

    // Verify refresh token
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET!) as JWTPayload
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' })
      return
    }

    // Find user and verify refresh token matches
    const user = await drizzleDb.getUserById(decoded.userId)

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ error: 'Invalid refresh token' })
      return
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email)

    // Update refresh token in database
    await drizzleDb.updateUserRefreshToken(user.id, tokens.refreshToken)

    const response: AuthResponse = {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('[Auth] Refresh token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Find user
    const user = await drizzleDb.getUserById(req.user.userId)

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[Auth] Get current user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
