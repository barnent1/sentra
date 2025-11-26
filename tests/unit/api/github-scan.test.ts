/**
 * Unit Tests for GitHub Scan API Endpoint
 *
 * Tests the /api/github/scan endpoint for repository scanning and import
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/github/scan/route'

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  requireAuthUser: vi.fn().mockReturnValue({
    userId: 'test-user-123',
    email: 'test@example.com',
  }),
}))

vi.mock('@/services/database-drizzle', () => ({
  drizzleDb: {
    getSettingsByUserId: vi.fn().mockResolvedValue({
      githubToken: 'encrypted-token',
    }),
    getProjectsByUserId: vi.fn().mockResolvedValue([]),
    listUserOrganizations: vi.fn().mockResolvedValue([
      { id: 'org-123', name: 'Test Org', slug: 'test-org' },
    ]),
    createProject: vi.fn().mockResolvedValue({
      id: 'project-123',
      name: 'test-repo',
      path: 'https://github.com/owner/test-repo',
    }),
  },
}))

vi.mock('@/services/encryption', () => ({
  decryptValue: vi.fn().mockReturnValue('decrypted-github-token'),
}))

vi.mock('@/services/github-scanner', () => ({
  githubScanner: {
    scanRepositories: vi.fn().mockResolvedValue({
      repositories: [
        {
          id: 1,
          name: 'test-repo',
          fullName: 'owner/test-repo',
          owner: 'owner',
          private: false,
          htmlUrl: 'https://github.com/owner/test-repo',
          description: 'A test repo',
          language: 'TypeScript',
          defaultBranch: 'main',
          pushedAt: '2024-01-01T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          archived: false,
          fork: false,
          stargazersCount: 10,
          openIssuesCount: 2,
        },
      ],
      totalCount: 1,
      sentraEnabledCount: 0,
      scannedAt: '2024-01-01T00:00:00Z',
      fromCache: false,
    }),
    createProjectInput: vi.fn().mockReturnValue({
      name: 'test-repo',
      path: 'https://github.com/owner/test-repo',
      userId: 'test-user-123',
      orgId: 'org-123',
      settings: {},
    }),
  },
}))

vi.mock('@/services/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('GitHub Scan API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/github/scan', () => {
    it('should return list of repositories', async () => {
      const request = new NextRequest('http://localhost/api/github/scan')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.repositories).toBeDefined()
      expect(data.repositories.length).toBe(1)
      expect(data.repositories[0].name).toBe('test-repo')
      expect(data.totalCount).toBe(1)
    })

    it('should mark already imported repos', async () => {
      const { drizzleDb } = await import('@/services/database-drizzle')
      vi.mocked(drizzleDb.getProjectsByUserId).mockResolvedValueOnce([
        {
          id: 'existing-project',
          name: 'test-repo',
          path: 'https://github.com/owner/test-repo',
          userId: 'test-user-123',
          orgId: 'org-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null,
        },
      ])

      const request = new NextRequest('http://localhost/api/github/scan')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.repositories[0].imported).toBe(true)
    })

    it('should handle missing GitHub token', async () => {
      const { drizzleDb } = await import('@/services/database-drizzle')
      vi.mocked(drizzleDb.getSettingsByUserId).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost/api/github/scan')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('GitHub token not configured')
    })

    it('should parse query parameters correctly', async () => {
      const { githubScanner } = await import('@/services/github-scanner')
      const request = new NextRequest(
        'http://localhost/api/github/scan?excludeArchived=false&language=TypeScript&limit=10'
      )

      await GET(request)

      expect(githubScanner.scanRepositories).toHaveBeenCalledWith(
        'decrypted-github-token',
        'test-user-123',
        expect.objectContaining({
          excludeArchived: false,
          language: 'TypeScript',
          limit: 10,
        })
      )
    })
  })

  describe('POST /api/github/scan', () => {
    it('should import selected repositories', async () => {
      const request = new NextRequest('http://localhost/api/github/scan', {
        method: 'POST',
        body: JSON.stringify({ repositoryIds: [1] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imported).toBeDefined()
      expect(data.imported.length).toBe(1)
    })

    it('should import all repositories when all=true', async () => {
      const request = new NextRequest('http://localhost/api/github/scan', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imported).toBeDefined()
    })

    it('should return error when no repositories specified', async () => {
      const request = new NextRequest('http://localhost/api/github/scan', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('repositoryIds or all=true')
    })

    it('should skip already imported repositories', async () => {
      const { drizzleDb } = await import('@/services/database-drizzle')
      vi.mocked(drizzleDb.getProjectsByUserId).mockResolvedValueOnce([
        {
          id: 'existing-project',
          name: 'test-repo',
          path: 'https://github.com/owner/test-repo',
          userId: 'test-user-123',
          orgId: 'org-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null,
        },
      ])

      const request = new NextRequest('http://localhost/api/github/scan', {
        method: 'POST',
        body: JSON.stringify({ repositoryIds: [1] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imported.length).toBe(0)
      expect(data.message).toContain('No new repositories')
    })

    it('should handle missing organization', async () => {
      const { drizzleDb } = await import('@/services/database-drizzle')
      vi.mocked(drizzleDb.listUserOrganizations).mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost/api/github/scan', {
        method: 'POST',
        body: JSON.stringify({ repositoryIds: [1] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('organization not found')
    })
  })
})
