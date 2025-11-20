/**
 * GET /api/auth/me
 * Get current user info
 */

import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime
export const runtime = 'nodejs'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    // Find user
    const dbUser = await drizzleDb.getUserById(user.userId)

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    })
  } catch (error) {
    console.error('[Auth] Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
