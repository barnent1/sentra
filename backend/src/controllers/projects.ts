// Project controller
import { Request, Response } from 'express'
import { drizzleDb } from '@/services/database-drizzle'
import type { CreateProjectRequest, ProjectResponse } from '../types'

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
 * GET /api/projects
 * Get all projects for the authenticated user with progress calculation
 */
export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Drizzle service returns projects ordered by createdAt desc
    const projects = await drizzleDb.listProjectsByUser(req.user.userId)

    // Add progress to each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const progress = await calculateProjectProgress(project.id)
        return {
          ...serializeProject(project),
          progress,
        }
      })
    )

    res.status(200).json({
      projects: projectsWithProgress,
    })
  } catch (error) {
    console.error('[Projects] Get projects error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function createProject(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { name, path, settings } = req.body as CreateProjectRequest

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }

    if (!path) {
      res.status(400).json({ error: 'path is required' })
      return
    }

    // Create project (Drizzle service handles JSON serialization)
    const project = await drizzleDb.createProject({
      name,
      path,
      userId: req.user.userId,
      settings: settings || undefined,
    })

    res.status(201).json({
      project: serializeProject(project),
    })
  } catch (error) {
    console.error('[Projects] Create project error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/projects/:id
 * Get a single project by ID with related agents, costs, and activities
 */
export async function getProjectById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    // Get project with relations
    const project = await drizzleDb.getProjectById(id, {
      includeAgents: true,
      includeCosts: true,
      includeActivities: true,
    })

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // Check ownership
    if (project.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    // Calculate progress
    const progress = await calculateProjectProgress(id)

    // Calculate total cost
    const totalCost = await drizzleDb.getTotalCostByProject(id)

    res.status(200).json({
      project: {
        ...serializeProject(project),
        progress,
        totalCost: Number(totalCost.toFixed(2)),
        agents: project.agents?.map(agent => ({
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
        costs: project.costs?.map(cost => ({
          id: cost.id,
          projectId: cost.projectId,
          amount: cost.amount,
          model: cost.model,
          provider: cost.provider,
          inputTokens: cost.inputTokens,
          outputTokens: cost.outputTokens,
          timestamp: cost.timestamp.toISOString(),
        })) || [],
        activities: project.activities?.map(activity => ({
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
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
export async function deleteProject(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    const project = await drizzleDb.getProjectById(id)

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // Check ownership
    if (project.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    // Delete project (cascade will delete related records)
    await drizzleDb.deleteProject(id)

    res.status(204).send()
  } catch (error) {
    console.error('[Projects] Delete project error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
