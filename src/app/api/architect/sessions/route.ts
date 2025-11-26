/**
 * Architect Sessions API Route
 *
 * POST /api/architect/sessions - Create a new architect session
 * GET /api/architect/sessions - List all sessions for user
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthUser } from '@/lib/auth-helpers'
import { createSession } from '@/services/session'
import { drizzleDb } from '@/services/database-drizzle'

export const runtime = 'nodejs'

// Validation schema for creating session
const CreateSessionSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
})

/**
 * POST /api/architect/sessions
 * Create a new architect session
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const body = await request.json()

    // Validate input
    const result = CreateSessionSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation failed: ${errors}` }, { status: 400 })
    }

    const { projectId } = result.data

    // Verify project exists and belongs to user
    const project = await drizzleDb.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to access this project' }, { status: 403 })
    }

    // Create session
    const session = await createSession({
      projectId,
      userId: user.userId,
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('[Architect Sessions] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/architect/sessions
 * List all sessions for user, optionally filtered by project
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Get sessions from database
    const sessions = await drizzleDb.getArchitectSessionsByUser(user.userId, projectId || undefined)

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('[Architect Sessions] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
