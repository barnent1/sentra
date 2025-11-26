/**
 * Resume Architect Session API Route
 *
 * POST /api/architect/sessions/:sessionId/resume - Resume a paused session
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { getSessionById, resumeSession } from '@/services/session'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * POST /api/architect/sessions/:sessionId/resume
 * Resume a paused session with full context
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuthUser(request)
    const { sessionId } = await params

    // Verify session exists and belongs to user
    const existingSession = await getSessionById(sessionId)
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (existingSession.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to resume this session' }, { status: 403 })
    }

    // Resume session
    const result = await resumeSession(sessionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Architect Sessions] Resume error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
