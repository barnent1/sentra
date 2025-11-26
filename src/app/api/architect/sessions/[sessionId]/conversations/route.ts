/**
 * Architect Session Conversations API Route
 *
 * POST /api/architect/sessions/:sessionId/conversations - Store a conversation turn
 * GET /api/architect/sessions/:sessionId/conversations - Load session context
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthUser } from '@/lib/auth-helpers'
import { getSessionById } from '@/services/session'
import { storeConversation, loadSessionContext } from '@/services/vector-store'

export const runtime = 'nodejs'

// Validation schema for storing conversation
const StoreConversationSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'content is required').max(50000, 'content too long'),
  mode: z.enum(['voice', 'text', 'system']),
  category: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * POST /api/architect/sessions/:sessionId/conversations
 * Store a conversation turn
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuthUser(request)
    const { sessionId } = await params
    const body = await request.json()

    // Validate input
    const result = StoreConversationSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation failed: ${errors}` }, { status: 400 })
    }

    // Verify session exists and belongs to user
    const session = await getSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to access this session' }, { status: 403 })
    }

    // Store conversation
    const conversation = await storeConversation(
      {
        sessionId,
        ...result.data,
      },
      user.userId
    )

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('[Architect Sessions] Store conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/architect/sessions/:sessionId/conversations
 * Load session context (recent conversations)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = requireAuthUser(request)
    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')

    // Verify session exists and belongs to user
    const session = await getSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to access this session' }, { status: 403 })
    }

    // Load context
    const conversations = await loadSessionContext(sessionId, {
      category: category || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('[Architect Sessions] Load conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
