/**
 * GET /api/agents/:agentId/logs
 * Get agent logs (polling endpoint - converted from SSE for Vercel compatibility)
 *
 * Returns current agent logs and status. Frontend should poll every 2 seconds.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = requireAuthUser(request)
    const params = await context.params
    const { agentId } = params

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Verify agent exists and user has access
    const agent = await drizzleDb.getAgentById(agentId, { includeProject: true })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Verify user owns the project
    if (agent.project?.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Return current logs (convert array to string if needed)
    const logs = Array.isArray(agent.logs)
      ? agent.logs.join('\n')
      : agent.logs || ''

    return NextResponse.json({
      logs,
      status: agent.status,
      error: agent.error,
    })
  } catch (error) {
    console.error('[Logs] Get agent logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
