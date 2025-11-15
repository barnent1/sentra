// Integration tests for cost and activity endpoints
// Following TDD: Write tests FIRST, then implementation
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { prisma, createTestUser, createTestProject } from '../../test-setup'
import type {
  AuthResponse,
  CostResponse,
  ActivityResponse,
  ErrorResponse,
} from '../types'
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

describe('POST /api/costs', () => {
  it('should create a new cost entry', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    const costData = {
      projectId: project.id,
      amount: 0.05,
      model: 'gpt-4',
      provider: 'openai',
      inputTokens: 1000,
      outputTokens: 500,
    }

    // ACT
    const response = await request(app)
      .post('/api/costs')
      .set('Authorization', `Bearer ${token}`)
      .send(costData)
      .expect(201)

    const cost = response.body.cost as CostResponse

    // ASSERT
    expect(cost.id).toBeDefined()
    expect(cost.projectId).toBe(project.id)
    expect(cost.amount).toBe(costData.amount)
    expect(cost.model).toBe(costData.model)
    expect(cost.provider).toBe(costData.provider)
    expect(cost.inputTokens).toBe(costData.inputTokens)
    expect(cost.outputTokens).toBe(costData.outputTokens)
    expect(cost.timestamp).toBeDefined()

    // Verify cost was created in database
    const dbCost = await prisma.cost.findUnique({
      where: { id: cost.id },
    })
    expect(dbCost).toBeDefined()
  })

  it('should create cost without token counts (optional fields)', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    const costData = {
      projectId: project.id,
      amount: 0.05,
      model: 'gpt-4',
      provider: 'openai',
    }

    // ACT
    const response = await request(app)
      .post('/api/costs')
      .set('Authorization', `Bearer ${token}`)
      .send(costData)
      .expect(201)

    const cost = response.body.cost as CostResponse

    // ASSERT
    expect(cost.inputTokens).toBeNull()
    expect(cost.outputTokens).toBeNull()
  })

  it('should reject cost creation for project owned by another user', async () => {
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

    const costData = {
      projectId: otherProject.id,
      amount: 0.05,
      model: 'gpt-4',
      provider: 'openai',
    }

    // ACT
    const response = await request(app)
      .post('/api/costs')
      .set('Authorization', `Bearer ${token}`)
      .send(costData)
      .expect(403)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Access denied')
  })

  it('should reject cost creation with missing required fields', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    const costData = {
      projectId: project.id,
      amount: 0.05,
      // Missing model and provider
    }

    // ACT
    const response = await request(app)
      .post('/api/costs')
      .set('Authorization', `Bearer ${token}`)
      .send(costData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toBeDefined()
  })

  it('should reject cost creation without authentication', async () => {
    // ACT
    const response = await request(app)
      .post('/api/costs')
      .send({
        projectId: 'some-id',
        amount: 0.05,
        model: 'gpt-4',
        provider: 'openai',
      })
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('No token provided')
  })
})

describe('GET /api/costs', () => {
  it('should return costs for user projects', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    // Create costs
    const cost1 = await prisma.cost.create({
      data: {
        projectId: project.id,
        amount: 0.05,
        model: 'gpt-4',
        provider: 'openai',
        inputTokens: 1000,
        outputTokens: 500,
      },
    })
    const cost2 = await prisma.cost.create({
      data: {
        projectId: project.id,
        amount: 0.02,
        model: 'claude-3',
        provider: 'anthropic',
        inputTokens: 800,
        outputTokens: 400,
      },
    })

    // ACT
    const response = await request(app)
      .get('/api/costs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const costs = response.body.costs as CostResponse[]

    // ASSERT
    expect(costs).toHaveLength(2)
    expect(costs.map((c) => c.id)).toContain(cost1.id)
    expect(costs.map((c) => c.id)).toContain(cost2.id)
  })

  it('should filter costs by projectId query parameter', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project1 = await prisma.project.create({
      data: createTestProject(user.id, { name: 'Project 1' }),
    })
    const project2 = await prisma.project.create({
      data: createTestProject(user.id, { name: 'Project 2' }),
    })

    await prisma.cost.create({
      data: {
        projectId: project1.id,
        amount: 0.05,
        model: 'gpt-4',
        provider: 'openai',
      },
    })
    await prisma.cost.create({
      data: {
        projectId: project2.id,
        amount: 0.02,
        model: 'claude-3',
        provider: 'anthropic',
      },
    })

    // ACT
    const response = await request(app)
      .get(`/api/costs?projectId=${project1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const costs = response.body.costs as CostResponse[]

    // ASSERT
    expect(costs).toHaveLength(1)
    expect(costs[0].projectId).toBe(project1.id)
  })

  it('should only return costs for authenticated user projects', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const userProject = await prisma.project.create({
      data: createTestProject(user.id),
    })

    // Create another user with project and costs
    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: 'Other User',
      },
    })
    const otherProject = await prisma.project.create({
      data: createTestProject(otherUser.id),
    })
    await prisma.cost.create({
      data: {
        projectId: otherProject.id,
        amount: 0.99,
        model: 'gpt-4',
        provider: 'openai',
      },
    })

    // Create cost for authenticated user
    await prisma.cost.create({
      data: {
        projectId: userProject.id,
        amount: 0.05,
        model: 'gpt-4',
        provider: 'openai',
      },
    })

    // ACT
    const response = await request(app)
      .get('/api/costs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const costs = response.body.costs as CostResponse[]

    // ASSERT
    expect(costs).toHaveLength(1)
    expect(costs[0].projectId).toBe(userProject.id)
  })
})

describe('POST /api/activity', () => {
  it('should create a new activity entry', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    const activityData = {
      projectId: project.id,
      type: 'agent_started',
      message: 'Agent execution started',
      metadata: { agentId: 'abc123', issueNumber: 42 },
    }

    // ACT
    const response = await request(app)
      .post('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(201)

    const activity = response.body.activity as ActivityResponse

    // ASSERT
    expect(activity.id).toBeDefined()
    expect(activity.projectId).toBe(project.id)
    expect(activity.type).toBe(activityData.type)
    expect(activity.message).toBe(activityData.message)
    expect(activity.metadata).toEqual(activityData.metadata)
    expect(activity.timestamp).toBeDefined()

    // Verify activity was created in database
    const dbActivity = await prisma.activity.findUnique({
      where: { id: activity.id },
    })
    expect(dbActivity).toBeDefined()
  })

  it('should create activity without metadata (optional field)', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    const activityData = {
      projectId: project.id,
      type: 'cost_alert',
      message: 'Cost threshold exceeded',
    }

    // ACT
    const response = await request(app)
      .post('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(201)

    const activity = response.body.activity as ActivityResponse

    // ASSERT
    expect(activity.metadata).toBeNull()
  })

  it('should reject activity creation for project owned by another user', async () => {
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

    const activityData = {
      projectId: otherProject.id,
      type: 'agent_started',
      message: 'Test message',
    }

    // ACT
    const response = await request(app)
      .post('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(403)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Access denied')
  })

  it('should reject activity creation with missing required fields', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    const activityData = {
      projectId: project.id,
      // Missing type and message
    }

    // ACT
    const response = await request(app)
      .post('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toBeDefined()
  })
})

describe('GET /api/activity', () => {
  it('should return activities for user projects', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    // Create activities
    const activity1 = await prisma.activity.create({
      data: {
        projectId: project.id,
        type: 'agent_started',
        message: 'Agent started',
      },
    })
    const activity2 = await prisma.activity.create({
      data: {
        projectId: project.id,
        type: 'agent_completed',
        message: 'Agent completed',
      },
    })

    // ACT
    const response = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const activities = response.body.activities as ActivityResponse[]

    // ASSERT
    expect(activities).toHaveLength(2)
    expect(activities.map((a) => a.id)).toContain(activity1.id)
    expect(activities.map((a) => a.id)).toContain(activity2.id)
  })

  it('should filter activities by projectId query parameter', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project1 = await prisma.project.create({
      data: createTestProject(user.id, { name: 'Project 1' }),
    })
    const project2 = await prisma.project.create({
      data: createTestProject(user.id, { name: 'Project 2' }),
    })

    await prisma.activity.create({
      data: {
        projectId: project1.id,
        type: 'agent_started',
        message: 'Project 1 activity',
      },
    })
    await prisma.activity.create({
      data: {
        projectId: project2.id,
        type: 'agent_started',
        message: 'Project 2 activity',
      },
    })

    // ACT
    const response = await request(app)
      .get(`/api/activity?projectId=${project1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const activities = response.body.activities as ActivityResponse[]

    // ASSERT
    expect(activities).toHaveLength(1)
    expect(activities[0].projectId).toBe(project1.id)
  })

  it('should return activities in reverse chronological order', async () => {
    // ARRANGE
    const { token, user } = await createAuthenticatedUser()
    const project = await prisma.project.create({
      data: createTestProject(user.id),
    })

    // Create activities with delays to ensure different timestamps
    const activity1 = await prisma.activity.create({
      data: {
        projectId: project.id,
        type: 'agent_started',
        message: 'First activity',
      },
    })

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 10))

    const activity2 = await prisma.activity.create({
      data: {
        projectId: project.id,
        type: 'agent_completed',
        message: 'Second activity',
      },
    })

    // ACT
    const response = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const activities = response.body.activities as ActivityResponse[]

    // ASSERT
    expect(activities[0].id).toBe(activity2.id) // Most recent first
    expect(activities[1].id).toBe(activity1.id)
  })
})
