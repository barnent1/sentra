/**
 * Project API Routes (by ID)
 *
 * GET /api/projects/:id - Get a single project by ID with relations
 * DELETE /api/projects/:id - Delete a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

interface ProjectResponse {
  id: string
  name: string
  path: string
  userId: string
  settings: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

/**
 * Serialize project for API response
 */
function serializeProject(project: {
  id: string
  name: string
  path: string
  userId: string
  settings: string | null
  createdAt: Date
  updatedAt: Date
}): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    path: project.path,
    userId: project.userId,
    settings: project.settings ? JSON.parse(project.settings) : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

/**
 * Calculate project progress
 */
async function calculateProjectProgress(projectId: string): Promise<number> {
  try {
    const projectAgents = await drizzleDb.listAgentsByProject(projectId)

    if (projectAgents.length === 0) {
      return 0
    }

    const completedAgents = projectAgents.filter(
      a => a.status === 'completed'
    ).length
    return Math.round((completedAgents / projectAgents.length) * 100)
  } catch (error) {
    return 0
  }
}

/**
 * GET /api/projects/:id
 * Get a single project by ID with related agents, costs, and activities
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuthUser(request)
    const params = await context.params
    const { id } = params

    // Get project with relations
    const project = await drizzleDb.getProjectById(id, {
      includeAgents: true,
      includeCosts: true,
      includeActivities: true,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (project.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate progress
    const progress = await calculateProjectProgress(id)

    // Calculate total cost
    const totalCost = await drizzleDb.getTotalCostByProject(id)

    return NextResponse.json({
      project: {
        ...serializeProject(project),
        progress,
        totalCost: Number(totalCost.toFixed(2)),
        agents:
          project.agents?.map(agent => ({
            id: agent.id,
            projectId: agent.projectId,
            status: agent.status,
            startTime: agent.startTime.toISOString(),
            endTime: agent.endTime?.toISOString() || null,
            logs: agent.logs,
            error: agent.error,
            createdAt: agent.createdAt.toISOString(),
            updatedAt: agent.updatedAt.toISOString(),
          })) || [],
        costs:
          project.costs?.map(cost => ({
            id: cost.id,
            projectId: cost.projectId,
            amount: cost.amount,
            model: cost.model,
            provider: cost.provider,
            inputTokens: cost.inputTokens,
            outputTokens: cost.outputTokens,
            timestamp: cost.timestamp.toISOString(),
          })) || [],
        activities:
          project.activities?.map(activity => ({
            id: activity.id,
            projectId: activity.projectId,
            type: activity.type,
            message: activity.message,
            metadata: activity.metadata,
            timestamp: activity.timestamp.toISOString(),
          })) || [],
      },
    })
  } catch (error) {
    console.error('[Projects] Get project by ID error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuthUser(request)
    const params = await context.params
    const { id } = params

    const project = await drizzleDb.getProjectById(id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (project.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete project (cascade will delete related records)
    await drizzleDb.deleteProject(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Projects] Delete project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
