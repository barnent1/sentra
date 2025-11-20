// Dashboard controller
// Provides aggregated dashboard data for the authenticated user
import { Request, Response } from 'express'
import { drizzleDb } from '@/services/database-drizzle'
import { eq, and, sql, count, sum } from 'drizzle-orm'
import { agents, costs } from '@/db/schema'
import { db } from '@/db/client'

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

    const completedAgents = projectAgents.filter(a => a.status === 'completed').length
    return Math.round((completedAgents / projectAgents.length) * 100)
  } catch (error) {
    return 0
  }
}

/**
 * GET /api/dashboard
 * Returns dashboard summary with aggregated statistics
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const userId = req.user.userId

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
            sql`${agents.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
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
          sql`${costs.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`
        )
      totalCosts = Number(costsResult[0]?.total || 0)
    }

    // Get recent activities (last 10)
    const recentActivities = await drizzleDb.getRecentActivities(userId, 10)

    // Get project statistics with progress
    const projectStats = await Promise.all(
      userProjects.slice(0, 5).map(async (project) => {
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
          lastActivity: recentActivities.find(a => a.projectId === project.id)?.timestamp.toISOString() || project.updatedAt.toISOString(),
        }
      })
    )

    res.status(200).json({
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
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/agents
 * Returns all agents for user's projects
 * Query params:
 * - projectId: Filter by specific project (optional)
 * - status: Filter by status (optional)
 */
export async function getAgents(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { projectId, status } = req.query

    // If projectId specified, verify user owns it
    if (projectId && typeof projectId === 'string') {
      const project = await drizzleDb.getProjectById(projectId)

      if (!project) {
        res.status(404).json({ error: 'Project not found' })
        return
      }

      if (project.userId !== req.user.userId) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      let projectAgents = await drizzleDb.listAgentsByProject(projectId)

      // Filter by status if provided
      if (status && typeof status === 'string') {
        projectAgents = projectAgents.filter(a => a.status === status)
      }

      res.status(200).json({
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
      return
    }

    // Otherwise, get agents for all user's projects
    const userProjects = await drizzleDb.listProjectsByUser(req.user.userId)
    const allAgents = await Promise.all(
      userProjects.map(p => drizzleDb.listAgentsByProject(p.id))
    )

    // Flatten and sort by start time desc
    let agents = allAgents
      .flat()
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

    // Filter by status if provided
    if (status && typeof status === 'string') {
      agents = agents.filter(a => a.status === status)
    }

    res.status(200).json({
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
    res.status(500).json({ error: 'Internal server error' })
  }
}
