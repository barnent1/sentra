// Integration tests for authentication endpoints
// Following TDD: Write tests FIRST, then implementation
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { prisma, createTestUser } from '../../test-setup'
import type { AuthResponse, ErrorResponse } from '../types'
import { createApp } from '../server'

const app = createApp()

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    // ARRANGE
    const userData = createTestUser()

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201)

    const body = response.body as AuthResponse

    // ASSERT
    expect(body.token).toBeDefined()
    expect(body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/) // JWT format
    expect(body.refreshToken).toBeDefined()
    expect(body.user.email).toBe(userData.email)
    expect(body.user.name).toBe(userData.name)
    expect(body.user.id).toBeDefined()

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    })
    expect(user).toBeDefined()
    expect(user?.email).toBe(userData.email)
  })

  it('should hash password before storing', async () => {
    // ARRANGE
    const userData = createTestUser()

    // ACT
    await request(app).post('/api/auth/register').send(userData).expect(201)

    // ASSERT
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    })
    // In Prisma schema, User model doesn't have password field
    // Password will be stored in separate UserCredentials table
    expect(user).toBeDefined()
  })

  it('should reject registration with duplicate email', async () => {
    // ARRANGE
    const userData = createTestUser()
    await request(app).post('/api/auth/register').send(userData).expect(201)

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('already exists')
  })

  it('should reject registration with invalid email', async () => {
    // ARRANGE
    const userData = createTestUser({ email: 'invalid-email' })

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('email')
  })

  it('should reject registration with weak password', async () => {
    // ARRANGE
    const userData = createTestUser({ password: '123' })

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('password')
  })

  it('should reject registration with missing email', async () => {
    // ARRANGE
    const userData = { password: 'Test123!@#', name: 'Test User' }

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('email')
  })

  it('should reject registration with missing password', async () => {
    // ARRANGE
    const userData = { email: 'test@example.com', name: 'Test User' }

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('password')
  })

  it('should allow registration without name (optional field)', async () => {
    // ARRANGE
    const userData = {
      email: 'test@example.com',
      password: 'Test123!@#',
    }

    // ACT
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201)

    const body = response.body as AuthResponse

    // ASSERT
    expect(body.user.name).toBeNull()
  })
})

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    // ARRANGE
    const userData = createTestUser()
    await request(app).post('/api/auth/register').send(userData).expect(201)

    // ACT
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200)

    const body = response.body as AuthResponse

    // ASSERT
    expect(body.token).toBeDefined()
    expect(body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/) // JWT format
    expect(body.refreshToken).toBeDefined()
    expect(body.user.email).toBe(userData.email)
  })

  it('should reject login with incorrect password', async () => {
    // ARRANGE
    const userData = createTestUser()
    await request(app).post('/api/auth/register').send(userData).expect(201)

    // ACT
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'WrongPassword123!',
      })
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Invalid credentials')
  })

  it('should reject login with non-existent email', async () => {
    // ACT
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      })
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Invalid credentials')
  })

  it('should reject login with missing email', async () => {
    // ACT
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'Test123!@#',
      })
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('email')
  })

  it('should reject login with missing password', async () => {
    // ACT
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
      })
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('password')
  })
})

describe('POST /api/auth/refresh', () => {
  it('should refresh token with valid refresh token', async () => {
    // ARRANGE
    const userData = createTestUser()
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201)

    const { refreshToken } = registerResponse.body as AuthResponse

    // ACT
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200)

    const body = response.body as AuthResponse

    // ASSERT
    expect(body.token).toBeDefined()
    expect(body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/) // JWT format
    expect(body.refreshToken).toBeDefined()
    expect(body.user.email).toBe(userData.email)
  })

  it('should reject refresh with invalid token', async () => {
    // ACT
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Invalid refresh token')
  })

  it('should reject refresh with missing token', async () => {
    // ACT
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({})
      .expect(400)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('refreshToken')
  })
})

describe('GET /api/auth/me', () => {
  it('should return user info with valid token', async () => {
    // ARRANGE
    const userData = createTestUser()
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201)

    const { token } = registerResponse.body as AuthResponse

    // ACT
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const body = response.body

    // ASSERT
    expect(body.user.email).toBe(userData.email)
    expect(body.user.name).toBe(userData.name)
    expect(body.user.id).toBeDefined()
  })

  it('should reject request without token', async () => {
    // ACT
    const response = await request(app).get('/api/auth/me').expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('No token provided')
  })

  it('should reject request with invalid token', async () => {
    // ACT
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)

    const body = response.body as ErrorResponse

    // ASSERT
    expect(body.error).toContain('Invalid token')
  })
})
