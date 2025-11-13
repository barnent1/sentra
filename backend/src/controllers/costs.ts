// Cost tracking controller
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { CreateCostRequest, CostResponse } from '../types'

const prisma = new PrismaClient()

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
 * POST /api/costs
 * Create a new cost entry
 */
export async function createCost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { projectId, amount, model, provider, inputTokens, outputTokens } =
      req.body as CreateCostRequest

    // Validate required fields
    if (!projectId || amount === undefined || !model || !provider) {
      res
        .status(400)
        .json({ error: 'projectId, amount, model, and provider are required' })
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

    // Create cost entry
    const cost = await prisma.cost.create({
      data: {
        projectId,
        amount,
        model,
        provider,
        inputTokens: inputTokens ?? null,
        outputTokens: outputTokens ?? null,
      },
    })

    res.status(201).json({
      cost: serializeCost(cost),
    })
  } catch (error) {
    console.error('[Costs] Create cost error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/costs
 * Get costs for user's projects
 * Query params:
 * - projectId: Filter by specific project (optional)
 */
export async function getCosts(req: Request, res: Response): Promise<void> {
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

    const costs = await prisma.cost.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    })

    res.status(200).json({
      costs: costs.map(serializeCost),
    })
  } catch (error) {
    console.error('[Costs] Get costs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
