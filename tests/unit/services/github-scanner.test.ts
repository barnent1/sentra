/**
 * Unit Tests for GitHub Repository Scanner Service
 *
 * Tests repository scanning, filtering, and caching logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  GitHubScanner,
  type GitHubRepository,
  type ScanOptions,
  type ScanResult,
} from '@/services/github-scanner'

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      repos: {
        listForAuthenticatedUser: vi.fn(),
        getContent: vi.fn(),
      },
      users: {
        getAuthenticated: vi.fn(),
      },
    },
  })),
}))

describe('GitHubScanner', () => {
  let scanner: GitHubScanner

  beforeEach(() => {
    scanner = new GitHubScanner()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with default cache TTL of 5 minutes', () => {
      const defaultScanner = new GitHubScanner()
      expect(defaultScanner).toBeDefined()
    })

    it('should accept custom cache TTL', () => {
      const customScanner = new GitHubScanner(10 * 60 * 1000)
      expect(customScanner).toBeDefined()
    })
  })

  describe('isSentraEnabled', () => {
    it('should return true for repo with .claude directory', async () => {
      const mockOctokit = {
        rest: {
          repos: {
            getContent: vi.fn().mockResolvedValue({ data: { type: 'dir' } }),
          },
        },
      }

      const result = await scanner.checkSentraEnabled(
        mockOctokit as unknown as Parameters<typeof scanner.checkSentraEnabled>[0],
        'owner',
        'repo'
      )
      expect(result).toBe(true)
    })

    it('should return false when .claude directory not found', async () => {
      const mockOctokit = {
        rest: {
          repos: {
            getContent: vi.fn().mockRejectedValue({ status: 404 }),
          },
        },
      }

      const result = await scanner.checkSentraEnabled(
        mockOctokit as unknown as Parameters<typeof scanner.checkSentraEnabled>[0],
        'owner',
        'repo'
      )
      expect(result).toBe(false)
    })

    it('should return false on other errors', async () => {
      const mockOctokit = {
        rest: {
          repos: {
            getContent: vi.fn().mockRejectedValue(new Error('Network error')),
          },
        },
      }

      const result = await scanner.checkSentraEnabled(
        mockOctokit as unknown as Parameters<typeof scanner.checkSentraEnabled>[0],
        'owner',
        'repo'
      )
      expect(result).toBe(false)
    })
  })

  describe('filterRepositories', () => {
    const mockRepos: GitHubRepository[] = [
      {
        id: 1,
        name: 'repo-1',
        fullName: 'owner/repo-1',
        owner: 'owner',
        private: false,
        htmlUrl: 'https://github.com/owner/repo-1',
        description: 'First repo',
        language: 'TypeScript',
        defaultBranch: 'main',
        pushedAt: '2024-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        archived: false,
        fork: false,
        stargazersCount: 100,
        openIssuesCount: 5,
      },
      {
        id: 2,
        name: 'repo-2',
        fullName: 'owner/repo-2',
        owner: 'owner',
        private: true,
        htmlUrl: 'https://github.com/owner/repo-2',
        description: 'Second repo',
        language: 'Python',
        defaultBranch: 'main',
        pushedAt: '2024-02-01T00:00:00Z',
        createdAt: '2023-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
        archived: false,
        fork: false,
        stargazersCount: 50,
        openIssuesCount: 3,
      },
      {
        id: 3,
        name: 'archived-repo',
        fullName: 'owner/archived-repo',
        owner: 'owner',
        private: false,
        htmlUrl: 'https://github.com/owner/archived-repo',
        description: null,
        language: null,
        defaultBranch: 'main',
        pushedAt: '2020-01-01T00:00:00Z',
        createdAt: '2019-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z',
        archived: true,
        fork: false,
        stargazersCount: 10,
        openIssuesCount: 0,
      },
      {
        id: 4,
        name: 'forked-repo',
        fullName: 'owner/forked-repo',
        owner: 'owner',
        private: false,
        htmlUrl: 'https://github.com/owner/forked-repo',
        description: 'A fork',
        language: 'JavaScript',
        defaultBranch: 'main',
        pushedAt: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        archived: false,
        fork: true,
        stargazersCount: 0,
        openIssuesCount: 0,
      },
    ]

    it('should filter out archived repos by default', () => {
      const result = scanner.filterRepositories(mockRepos, {})
      expect(result.map((r) => r.name)).not.toContain('archived-repo')
    })

    it('should include archived repos when excludeArchived is false', () => {
      const result = scanner.filterRepositories(mockRepos, { excludeArchived: false })
      expect(result.map((r) => r.name)).toContain('archived-repo')
    })

    it('should filter out forks by default', () => {
      const result = scanner.filterRepositories(mockRepos, {})
      expect(result.map((r) => r.name)).not.toContain('forked-repo')
    })

    it('should include forks when excludeForks is false', () => {
      const result = scanner.filterRepositories(mockRepos, { excludeForks: false })
      expect(result.map((r) => r.name)).toContain('forked-repo')
    })

    it('should filter by language', () => {
      const result = scanner.filterRepositories(mockRepos, { language: 'TypeScript' })
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('repo-1')
    })

    it('should filter by language case-insensitively', () => {
      const result = scanner.filterRepositories(mockRepos, { language: 'typescript' })
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('repo-1')
    })

    it('should limit results', () => {
      const result = scanner.filterRepositories(mockRepos, { limit: 1 })
      expect(result.length).toBe(1)
    })

    it('should combine multiple filters', () => {
      const result = scanner.filterRepositories(mockRepos, {
        excludeArchived: true,
        excludeForks: true,
        limit: 1,
      })
      expect(result.length).toBe(1)
      expect(result[0].archived).toBe(false)
      expect(result[0].fork).toBe(false)
    })
  })

  describe('caching', () => {
    it('should cache scan results', async () => {
      const cacheKey = 'user123'
      const mockResult: ScanResult = {
        repositories: [],
        totalCount: 0,
        sentraEnabledCount: 0,
        scannedAt: new Date().toISOString(),
        fromCache: false,
      }

      scanner.setCacheEntry(cacheKey, mockResult)
      const cached = scanner.getCacheEntry(cacheKey)

      expect(cached).toBeDefined()
      expect(cached?.fromCache).toBe(true)
    })

    it('should return null for expired cache entries', async () => {
      const cacheKey = 'user123'
      const mockResult: ScanResult = {
        repositories: [],
        totalCount: 0,
        sentraEnabledCount: 0,
        scannedAt: new Date().toISOString(),
        fromCache: false,
      }

      scanner.setCacheEntry(cacheKey, mockResult)

      // Advance time past TTL (5 minutes + 1 second)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000)

      const cached = scanner.getCacheEntry(cacheKey)
      expect(cached).toBeNull()
    })

    it('should allow cache invalidation', () => {
      const cacheKey = 'user123'
      const mockResult: ScanResult = {
        repositories: [],
        totalCount: 0,
        sentraEnabledCount: 0,
        scannedAt: new Date().toISOString(),
        fromCache: false,
      }

      scanner.setCacheEntry(cacheKey, mockResult)
      expect(scanner.getCacheEntry(cacheKey)).toBeDefined()

      scanner.invalidateCache(cacheKey)
      expect(scanner.getCacheEntry(cacheKey)).toBeNull()
    })

    it('should clear all cache entries', () => {
      scanner.setCacheEntry('user1', {
        repositories: [],
        totalCount: 0,
        sentraEnabledCount: 0,
        scannedAt: new Date().toISOString(),
        fromCache: false,
      })
      scanner.setCacheEntry('user2', {
        repositories: [],
        totalCount: 0,
        sentraEnabledCount: 0,
        scannedAt: new Date().toISOString(),
        fromCache: false,
      })

      scanner.clearCache()

      expect(scanner.getCacheEntry('user1')).toBeNull()
      expect(scanner.getCacheEntry('user2')).toBeNull()
    })
  })

  describe('transformRepository', () => {
    it('should transform GitHub API response to GitHubRepository', () => {
      const apiResponse = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        owner: { login: 'owner' },
        private: true,
        html_url: 'https://github.com/owner/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        default_branch: 'main',
        pushed_at: '2024-01-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        archived: false,
        fork: false,
        stargazers_count: 42,
        open_issues_count: 10,
      }

      const result = scanner.transformRepository(apiResponse)

      expect(result).toEqual({
        id: 123,
        name: 'test-repo',
        fullName: 'owner/test-repo',
        owner: 'owner',
        private: true,
        htmlUrl: 'https://github.com/owner/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        defaultBranch: 'main',
        pushedAt: '2024-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        archived: false,
        fork: false,
        stargazersCount: 42,
        openIssuesCount: 10,
      })
    })

    it('should handle null values', () => {
      const apiResponse = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        owner: { login: 'owner' },
        private: false,
        html_url: 'https://github.com/owner/test-repo',
        description: null,
        language: null,
        default_branch: 'main',
        pushed_at: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        archived: false,
        fork: false,
        stargazers_count: 0,
        open_issues_count: 0,
      }

      const result = scanner.transformRepository(apiResponse)

      expect(result.description).toBeNull()
      expect(result.language).toBeNull()
      expect(result.pushedAt).toBeNull()
    })
  })

  describe('createProjectFromRepository', () => {
    it('should create project input from repository', () => {
      const repo: GitHubRepository = {
        id: 123,
        name: 'test-repo',
        fullName: 'owner/test-repo',
        owner: 'owner',
        private: true,
        htmlUrl: 'https://github.com/owner/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        defaultBranch: 'main',
        pushedAt: '2024-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        archived: false,
        fork: false,
        stargazersCount: 42,
        openIssuesCount: 10,
      }

      const result = scanner.createProjectInput(repo, 'user-123', 'org-456')

      expect(result).toEqual({
        name: 'test-repo',
        path: 'https://github.com/owner/test-repo',
        userId: 'user-123',
        orgId: 'org-456',
        settings: {
          github: {
            repoId: 123,
            fullName: 'owner/test-repo',
            owner: 'owner',
            name: 'test-repo',
            private: true,
            defaultBranch: 'main',
            language: 'TypeScript',
            openIssuesCount: 10,
            stargazersCount: 42,
          },
          sentraEnabled: true,
          syncedAt: expect.any(String),
        },
      })
    })
  })
})
