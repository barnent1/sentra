// Activity tracking controller
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { CreateActivityRequest, ActivityResponse } from '../types'

const prisma = new PrismaClient()

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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (project.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    // Create activity entry
    const activity = await prisma.activity.create({
      data: {
        projectId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
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
 * Get activities for user's projects
 * Query params:
 * - projectId: Filter by specific project (optional)
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

    const { projectId } = req.query

    // Build where clause
    let whereClause: {
      project: { userId: string }
      projectId?: string
    } = {
      project: { userId: req.user.userId },
    }

    if (projectId && typeof projectId === 'string') {
      whereClause.projectId = projectId
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    })

    res.status(200).json({
      activities: activities.map(serializeActivity),
    })
  } catch (error) {
    console.error('[Activity] Get activities error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
