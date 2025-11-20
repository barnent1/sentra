/**
 * GET /api/dashboard
 * Returns dashboard summary with aggregated statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'
import { eq, and, sql, count, sum } from 'drizzle-orm'
import { agents, costs } from '@/db/schema'
import { db } from '@/db/client'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

/**
 * Calculate project progress based on activities
 * Progress is based on agent completion ratio
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

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const userId = user.userId

    // Get all user's projects
    const userProjects = await drizzleDb.listProjectsByUser(userId)
    const projectIds = userProjects.map(p => p.id)

    // Get total projects count
    const totalProjects = userProjects.length

    // Get active agents count (status = 'running')
    let activeAgentsCount = 0
    if (projectIds.length > 0) {
      const activeAgentsResult = await db
        .select({ count: count() })
        .from(agents)
        .where(
          and(
            sql`${agents.projectId} IN (${sql.join(
              projectIds.map(id => sql`${id}`),
              sql`, `
            )})`,
            eq(agents.status, 'running')
          )
        )
      activeAgentsCount = Number(activeAgentsResult[0]?.count || 0)
    }

    // Get total costs (sum from costs table)
    let totalCosts = 0
    if (projectIds.length > 0) {
      const costsResult = await db
        .select({ total: sum(costs.amount) })
        .from(costs)
        .where(
          sql`${costs.projectId} IN (${sql.join(
            projectIds.map(id => sql`${id}`),
            sql`, `
          )})`
        )
      totalCosts = Number(costsResult[0]?.total || 0)
    }

    // Get recent activities (last 10)
    const recentActivities = await drizzleDb.getRecentActivities(userId, 10)

    // Get project statistics with progress
    const projectStats = await Promise.all(
      userProjects.slice(0, 5).map(async project => {
        const [totalCost, agentCount, progress] = await Promise.all([
          drizzleDb.getTotalCostByProject(project.id),
          drizzleDb.listAgentsByProject(project.id).then(a => a.length),
          calculateProjectProgress(project.id),
        ])

        return {
          id: project.id,
          name: project.name,
          path: project.path,
          totalCost,
          agentCount,
          progress,
          lastActivity:
            recentActivities.find(a => a.projectId === project.id)?.timestamp.toISOString() ||
            project.updatedAt.toISOString(),
        }
      })
    )

    return NextResponse.json({
      summary: {
        totalProjects,
        activeAgents: activeAgentsCount,
        totalCosts: Number(totalCosts.toFixed(2)),
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        projectId: activity.projectId,
        projectName: activity.project?.name,
        type: activity.type,
        message: activity.message,
        metadata: activity.metadata,
        timestamp: activity.timestamp.toISOString(),
      })),
      projectStats,
    })
  } catch (error) {
    console.error('[Dashboard] Get dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
