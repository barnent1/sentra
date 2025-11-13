// Test setup utilities for backend integration tests
// @vitest-environment node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { beforeEach, afterAll } from 'vitest'

// Use dev database for tests (we clean it before each test anyway)
// In production, you'd want a separate test database
export const prisma = new PrismaClient()

// Clean database before each test
beforeEach(async () => {
  await prisma.activity.deleteMany()
  await prisma.cost.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
})

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect()
})

// Counter for unique test emails
let emailCounter = 0

export function createTestUser(overrides = {}) {
  emailCounter++
  return {
    email: `test${emailCounter}_${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User',
    ...overrides,
  }
}

export function createTestProject(userId: string, overrides = {}) {
  return {
    name: 'Test Project',
    path: '/test/project',
    userId,
    ...overrides,
  }
}
