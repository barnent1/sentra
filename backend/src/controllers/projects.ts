// Project controller
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { CreateProjectRequest, ProjectResponse } from '../types'

const prisma = new PrismaClient()

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
 * GET /api/projects
 * Get all projects for the authenticated user
 */
export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const projects = await prisma.project.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    })

    res.status(200).json({
      projects: projects.map(serializeProject),
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

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        path,
        userId: req.user.userId,
        settings: settings ? JSON.stringify(settings) : null,
      },
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
 * Get a single project by ID
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

    const project = await prisma.project.findUnique({
      where: { id },
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

    res.status(200).json({
      project: serializeProject(project),
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

    const project = await prisma.project.findUnique({
      where: { id },
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

    // Delete project (cascade will delete related records)
    await prisma.project.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('[Projects] Delete project error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
