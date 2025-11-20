/**
 * Costs API Routes
 *
 * GET /api/costs - Get costs for user's projects
 * POST /api/costs - Create a new cost entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'

// Use Node.js runtime (Edge doesn't support all database operations)
export const runtime = 'nodejs'

interface CreateCostRequest {
  projectId: string
  amount: number
  model: string
  provider: string
  inputTokens?: number
  outputTokens?: number
}

interface CostResponse {
  id: string
  projectId: string
  amount: number
  model: string
  provider: string
  inputTokens: number | null
  outputTokens: number | null
  timestamp: string
}

/**
 * Serialize cost for API response
 */
function serializeCost(cost: {
  id: string
  projectId: string
  amount: number
  model: string
  provider: string
  inputTokens: number | null
  outputTokens: number | null
  timestamp: Date
}): CostResponse {
  return {
    id: cost.id,
    projectId: cost.projectId,
    amount: cost.amount,
    model: cost.model,
    provider: cost.provider,
    inputTokens: cost.inputTokens,
    outputTokens: cost.outputTokens,
    timestamp: cost.timestamp.toISOString(),
  }
}

/**
 * GET /api/costs
 * Get costs for user's projects
 * Query params:
 * - projectId: Filter by specific project (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // If projectId specified, verify user owns it and get costs for that project
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

      const costs = await drizzleDb.getCostsByProject(projectId)
      return NextResponse.json({
        costs: costs.map(serializeCost),
      })
    }

    // Otherwise, get costs for all user's projects
    const projects = await drizzleDb.listProjectsByUser(user.userId)
    const allCosts = await Promise.all(
      projects.map(p => drizzleDb.getCostsByProject(p.id))
    )

    // Flatten and sort by timestamp desc
    const costs = allCosts
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return NextResponse.json({
      costs: costs.map(serializeCost),
    })
  } catch (error) {
    console.error('[Costs] Get costs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/costs
 * Create a new cost entry
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const body = await request.json() as CreateCostRequest
    const { projectId, amount, model, provider, inputTokens, outputTokens } = body

    // Validate required fields
    if (!projectId || amount === undefined || !model || !provider) {
      return NextResponse.json(
        { error: 'projectId, amount, model, and provider are required' },
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

    // Create cost entry
    const cost = await drizzleDb.createCost({
      projectId,
      amount,
      model,
      provider: provider as any,
      inputTokens,
      outputTokens,
    })

    return NextResponse.json(
      {
        cost: serializeCost(cost),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Costs] Create cost error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
