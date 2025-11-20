/**
 * GET /api/agents
 * Returns all agents for user's projects
 * Query params:
 * - projectId: Filter by specific project (optional)
 * - status: Filter by status (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    // If projectId specified, verify user owns it
    if (projectId) {
      const project = await drizzleDb.getProjectById(projectId)

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (project.userId !== user.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      let projectAgents = await drizzleDb.listAgentsByProject(projectId)

      // Filter by status if provided
      if (status) {
        projectAgents = projectAgents.filter(a => a.status === status)
      }

      return NextResponse.json({
        agents: projectAgents.map(agent => ({
          id: agent.id,
          projectId: agent.projectId,
          status: agent.status,
          startTime: agent.startTime.toISOString(),
          endTime: agent.endTime?.toISOString() || null,
          logs: agent.logs,
          error: agent.error,
          createdAt: agent.createdAt.toISOString(),
          updatedAt: agent.updatedAt.toISOString(),
        })),
      })
    }

    // Otherwise, get agents for all user's projects
    const userProjects = await drizzleDb.listProjectsByUser(user.userId)
    const allAgents = await Promise.all(
      userProjects.map(p => drizzleDb.listAgentsByProject(p.id))
    )

    // Flatten and sort by start time desc
    let agents = allAgents
      .flat()
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

    // Filter by status if provided
    if (status) {
      agents = agents.filter(a => a.status === status)
    }

    return NextResponse.json({
      agents: agents.map(agent => ({
        id: agent.id,
        projectId: agent.projectId,
        status: agent.status,
        startTime: agent.startTime.toISOString(),
        endTime: agent.endTime?.toISOString() || null,
        logs: agent.logs,
        error: agent.error,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Dashboard] Get agents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
