/**
 * Projects API Routes
 *
 * GET /api/projects - Get all projects for authenticated user
 * POST /api/projects - Create a new project
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

interface CreateProjectRequest {
  name: string
  path: string
  orgId: string
  settings?: Record<string, any>
}

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
  settings: string | Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}): ProjectResponse {
  // Parse settings if it's a string (defensive: handle both parsed and unparsed)
  let parsedSettings: Record<string, any> | null = null;
  if (project.settings) {
    if (typeof project.settings === 'string') {
      try {
        parsedSettings = JSON.parse(project.settings);
      } catch (error) {
        console.warn('[Projects] Failed to parse settings JSON:', error);
        parsedSettings = null;
      }
    } else {
      // Already an object (drizzleDb deserializeProject already parsed it)
      parsedSettings = project.settings;
    }
  }

  return {
    id: project.id,
    name: project.name,
    path: project.path,
    userId: project.userId,
    settings: parsedSettings,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

/**
 * Calculate project progress based on activities
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
 * GET /api/projects
 * Get all projects for the authenticated user with progress calculation
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    // Get projects ordered by createdAt desc
    const projects = await drizzleDb.listProjectsByUser(user.userId)

    // Add progress to each project
    const projectsWithProgress = await Promise.all(
      projects.map(async project => {
        const progress = await calculateProjectProgress(project.id)
        return {
          ...serializeProject(project),
          progress,
        }
      })
    )

    return NextResponse.json({
      projects: projectsWithProgress,
    })
  } catch (error) {
    console.error('[Projects] Get projects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const body = await request.json() as CreateProjectRequest
    const { name, path, orgId, settings } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    // Create project
    const project = await drizzleDb.createProject({
      name,
      path,
      userId: user.userId,
      orgId,
      settings: settings || undefined,
    })

    return NextResponse.json(
      {
        project: serializeProject(project),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Projects] Create project error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
