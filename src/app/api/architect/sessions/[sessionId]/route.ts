/**
 * Architect Session by ID API Route
 *
 * GET /api/architect/sessions/:sessionId - Get session by ID
 * PATCH /api/architect/sessions/:sessionId - Update session state
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthUser } from '@/lib/auth-helpers'
import { getSessionById, updateSessionState } from '@/services/session'

export const runtime = 'nodejs'

// Validation schema for updating session
const UpdateSessionSchema = z.object({
  categoryProgress: z.record(z.string(), z.number().min(0).max(100)).optional(),
  blockers: z.array(z.string()).optional(),
  gaps: z.array(z.string()).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
})

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/architect/sessions/:sessionId
 * Get session by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuthUser(request)
    const { sessionId } = await params

    const session = await getSessionById(sessionId)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify user owns the session
    if (session.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to access this session' }, { status: 403 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('[Architect Sessions] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/architect/sessions/:sessionId
 * Update session state
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuthUser(request)
    const { sessionId } = await params
    const body = await request.json()

    // Validate input
    const result = UpdateSessionSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation failed: ${errors}` }, { status: 400 })
    }

    // Verify session exists and belongs to user
    const existingSession = await getSessionById(sessionId)
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (existingSession.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to update this session' }, { status: 403 })
    }

    // Update session
    const session = await updateSessionState(sessionId, result.data)

    return NextResponse.json(session)
  } catch (error) {
    console.error('[Architect Sessions] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
