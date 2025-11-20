/**
 * Activity API Routes
 *
 * GET /api/activity - Get activities for user's projects with pagination
 * POST /api/activity - Create a new activity entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

interface CreateActivityRequest {
  projectId: string
  type: string
  message: string
  metadata?: Record<string, any>
}

interface ActivityResponse {
  id: string
  projectId: string
  type: string
  message: string
  metadata: Record<string, any> | null
  timestamp: string
}

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
 * GET /api/activity
 * Get activities for user's projects with pagination
 * Query params:
 * - projectId: Filter by specific project (optional)
 * - limit: Number of activities to return (optional, default: 50, max: 100)
 * - offset: Number of activities to skip (optional, default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Parse pagination parameters
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Validate pagination parameters
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      )
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter' },
        { status: 400 }
      )
    }

    // If projectId specified, verify user owns it and get activities for that project
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

      const activities = await drizzleDb.getActivitiesByProject(projectId, {
        limit,
        offset,
      })

      return NextResponse.json({
        activities: activities.map(serializeActivity),
        pagination: {
          limit,
          offset,
          total: activities.length,
        },
      })
    }

    // Otherwise, get activities for all user's projects
    const projects = await drizzleDb.listProjectsByUser(user.userId)
    const allActivities = await Promise.all(
      projects.map(p => drizzleDb.getActivitiesByProject(p.id))
    )

    // Flatten and sort by timestamp desc
    const allActivitiesFlat = allActivities
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    const paginatedActivities = allActivitiesFlat.slice(offset, offset + limit)

    return NextResponse.json({
      activities: paginatedActivities.map(serializeActivity),
      pagination: {
        limit,
        offset,
        total: allActivitiesFlat.length,
      },
    })
  } catch (error) {
    console.error('[Activity] Get activities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/activity
 * Create a new activity entry
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const body = await request.json() as CreateActivityRequest
    const { projectId, type, message, metadata } = body

    // Validate required fields
    if (!projectId || !type || !message) {
      return NextResponse.json(
        { error: 'projectId, type, and message are required' },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
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

    // Create activity entry
    const activity = await drizzleDb.createActivity({
      projectId,
      type: type as any,
      message,
      metadata,
    })

    return NextResponse.json(
      {
        activity: serializeActivity(activity),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Activity] Create activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
