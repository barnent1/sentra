// Integration tests for project endpoints
// Following TDD: Write tests FIRST, then implementation
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { prisma, createTestUser, createTestProject } from '../../test-setup'
import type { AuthResponse, ProjectResponse, ErrorResponse } from '../types'
import { createApp } from '../server'

const app = createApp()

async function createAuthenticatedUser() {
  const userData = createTestUser()
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201)

  return response.body as AuthResponse
}

describe('GET /api/projects', () => {
  it('should return empty array when user has no projects', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()

    // ACT
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    // ASSERT
    expect(response.body.projects).toEqual([])
  })

  it('should return user projects', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()

    // Create projects directly in database
    const project1 = await prisma.project.create({
      data: createTestProject(user.id, { name: 'Project 1' }),
    })
    const project2 = await prisma.project.create({
      data: createTestProject(user.id, { name: 'Project 2' }),
    })

    // ACT
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const projects = response.body.projects as ProjectResponse[]

    // ASSERT
    expect(projects).toHaveLength(2)
    expect(projects.map((p) => p.name)).toContain('Project 1')
    expect(projects.map((p) => p.name)).toContain('Project 2')
  })

  it('should only return projects owned by authenticated user', async () => {
    // ARRANGE
    const { token: token1, user: user1 } = await createAuthenticatedUser()

    // Create another user with projects
    const user2 = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: 'Other User',
      },
    })
    await prisma.project.create({
      data: createTestProject(user2.id, { name: 'Other User Project' }),
    })

    // Create project for authenticated user
    await prisma.project.create({
      data: createTestProject(user1.id, { name: 'My Project' }),
    })

    // ACT
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200)

    const projects = response.body.projects as ProjectResponse[]

    // ASSERT
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('My Project')
  })

  it('should reject request without authentication', async () => {
    // ACT
    const response = await request(app).get('/api/projects').expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('No token provided')
  })
})

describe('POST /api/projects', () => {
  it('should create a new project', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const projectData = {
      name: 'New Project',
      path: '/projects/new-project',
      settings: { theme: 'dark' },
    }

    // ACT
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(201)

    const project = response.body.project as ProjectResponse

    // ASSERT
    expect(project.id).toBeDefined()
    expect(project.name).toBe(projectData.name)
    expect(project.path).toBe(projectData.path)
    expect(project.userId).toBe(user.id)
    expect(project.settings).toEqual(projectData.settings)
    expect(project.createdAt).toBeDefined()
    expect(project.updatedAt).toBeDefined()

    // Verify project was created in database
    const dbProject = await prisma.project.findUnique({
      where: { id: project.id },
    })
    expect(dbProject).toBeDefined()
    expect(dbProject?.name).toBe(projectData.name)
  })

  it('should create project without settings (optional field)', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()
    const projectData = {
      name: 'Minimal Project',
      path: '/projects/minimal',
    }

    // ACT
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(201)

    const project = response.body.project as ProjectResponse

    // ASSERT
    expect(project.settings).toBeNull()
  })

  it('should reject project creation with missing name', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()
    const projectData = {
      path: '/projects/no-name',
    }

    // ACT
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('name')
  })

  it('should reject project creation with missing path', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()
    const projectData = {
      name: 'No Path Project',
    }

    // ACT
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('path')
  })

  it('should reject project creation without authentication', async () => {
    // ARRANGE
    const projectData = {
      name: 'Unauthorized Project',
      path: '/projects/unauthorized',
    }

    // ACT
    const response = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('No token provided')
  })
})

describe('GET /api/projects/:id', () => {
  it('should return project by id', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const dbProject = await prisma.project.create({
      data: createTestProject(user.id),
    })

    // ACT
    const response = await request(app)
      .get(`/api/projects/${dbProject.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const project = response.body.project as ProjectResponse

    // ASSERT
    expect(project.id).toBe(dbProject.id)
    expect(project.name).toBe(dbProject.name)
    expect(project.path).toBe(dbProject.path)
  })

  it('should reject access to project owned by another user', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()

    // Create another user with a project
    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: 'Other User',
      },
    })
    const otherProject = await prisma.project.create({
      data: createTestProject(otherUser.id),
    })

    // ACT
    const response = await request(app)
      .get(`/api/projects/${otherProject.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Access denied')
  })

  it('should return 404 for non-existent project', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()

    // ACT
    const response = await request(app)
      .get('/api/projects/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Project not found')
  })

  it('should reject request without authentication', async () => {
    // ACT
    const response = await request(app)
      .get('/api/projects/some-id')
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('No token provided')
  })
})

describe('DELETE /api/projects/:id', () => {
  it('should delete project', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    // ACT
    await request(app)
      .delete(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    // ASSERT
    const deletedProject = await prisma.project.findUnique({
      where: { id: project.id },
    })
    expect(deletedProject).toBeNull()
  })

  it('should reject deletion of project owned by another user', async () => {
    // ARRANGE
    const { token } = await createAuthenticatedUser()

    // Create another user with a project
    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: 'Other User',
      },
    })
    const otherProject = await prisma.project.create({
      data: createTestProject(otherUser.id),
    })

    // ACT
    const response = await request(app)
      .delete(`/api/projects/${otherProject.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Access denied')

    // Verify project still exists
    const project = await prisma.project.findUnique({
      where: { id: otherProject.id },
    })
    expect(project).toBeDefined()
  })
})
