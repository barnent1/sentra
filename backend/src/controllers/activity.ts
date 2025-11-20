// Activity tracking controller
import { Request, Response } from 'express'
import { drizzleDb } from '@/services/database-drizzle'
import type { CreateActivityRequest, ActivityResponse } from '../types'

/**
 * Serialize activity for API response
 */
function serializeActivity(activity: {
  id: string
  projectId: string
  type: string
  message: string
  metadata: string | null
  timestamp: Date
}): ActivityResponse {
  return {
    id: activity.id,
    projectId: activity.projectId,
    type: activity.type,
    message: activity.message,
    metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    timestamp: activity.timestamp.toISOString(),
  }
}

/**
 * POST /api/activity
 * Create a new activity entry
 */
export async function createActivity(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { projectId, type, message, metadata } =
      req.body as CreateActivityRequest

    // Validate required fields
    if (!projectId || !type || !message) {
      res
        .status(400)
        .json({ error: 'projectId, type, and message are required' })
      return
    }

    // Verify project exists and user has access
    const project = await drizzleDb.getProjectById(projectId)

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (project.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    // Create activity entry (Drizzle service handles JSON serialization and validation)
    const activity = await drizzleDb.createActivity({
      projectId,
      type: type as any, // Type is validated by Drizzle service
      message,
      metadata,
    })

    res.status(201).json({
      activity: serializeActivity(activity),
    })
  } catch (error) {
    console.error('[Activity] Create activity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/activity
 * Get activities for user's projects with pagination
 * Query params:
 * - projectId: Filter by specific project (optional)
 * - limit: Number of activities to return (optional, default: 50, max: 100)
 * - offset: Number of activities to skip (optional, default: 0)
 */
export async function getActivities(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { projectId, limit: limitParam, offset: offsetParam } = req.query

    // Parse pagination parameters
    const limit = limitParam ? Math.min(parseInt(limitParam as string, 10), 100) : 50
    const offset = offsetParam ? parseInt(offsetParam as string, 10) : 0

    // Validate pagination parameters
    if (isNaN(limit) || limit <= 0) {
      res.status(400).json({ error: 'Invalid limit parameter' })
      return
    }

    if (isNaN(offset) || offset < 0) {
      res.status(400).json({ error: 'Invalid offset parameter' })
      return
    }

    // If projectId specified, verify user owns it and get activities for that project
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

      const activities = await drizzleDb.getActivitiesByProject(projectId, {
        limit,
        offset,
      })

      res.status(200).json({
        activities: activities.map(serializeActivity),
        pagination: {
          limit,
          offset,
          total: activities.length,
        },
      })
      return
    }

    // Otherwise, get activities for all user's projects
    const projects = await drizzleDb.listProjectsByUser(req.user.userId)
    const allActivities = await Promise.all(
      projects.map(p => drizzleDb.getActivitiesByProject(p.id))
    )

    // Flatten and sort by timestamp desc
    const allActivitiesFlat = allActivities
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    const paginatedActivities = allActivitiesFlat.slice(offset, offset + limit)

    res.status(200).json({
      activities: paginatedActivities.map(serializeActivity),
      pagination: {
        limit,
        offset,
        total: allActivitiesFlat.length,
      },
    })
  } catch (error) {
    console.error('[Activity] Get activities error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
