/**
 * GitHub Repository Scanner Service
 *
 * Scans user's GitHub repositories and identifies Sentra-enabled projects
 * (repos with .claude/ directory).
 *
 * Features:
 * - Paginated repository scanning with rate limit handling
 * - In-memory caching with configurable TTL (default 5 minutes)
 * - Filtering by language, archived, forks
 * - Check for Sentra enablement (.claude/ directory)
 */

import { Octokit } from '@octokit/rest'
import { logger } from '@/services/logger'
import type { CreateProjectInput } from '@/services/database-drizzle'

// ============================================================================
// Types
// ============================================================================

export interface GitHubRepository {
  id: number
  name: string
  fullName: string
  owner: string
  private: boolean
  htmlUrl: string
  description: string | null
  language: string | null
  defaultBranch: string
  pushedAt: string | null
  createdAt: string
  updatedAt: string
  archived: boolean
  fork: boolean
  stargazersCount: number
  openIssuesCount: number
  sentraEnabled?: boolean
}

export interface ScanOptions {
  /** Exclude archived repositories (default: true) */
  excludeArchived?: boolean
  /** Exclude forked repositories (default: true) */
  excludeForks?: boolean
  /** Filter by programming language */
  language?: string
  /** Maximum number of repositories to return */
  limit?: number
  /** Only return Sentra-enabled repos (with .claude/ directory) */
  sentraEnabledOnly?: boolean
  /** Force refresh, ignoring cache */
  forceRefresh?: boolean
}

export interface ScanResult {
  repositories: GitHubRepository[]
  totalCount: number
  sentraEnabledCount: number
  scannedAt: string
  fromCache: boolean
}

interface CacheEntry {
  result: ScanResult
  timestamp: number
}

// GitHub API response type
interface GitHubRepoResponse {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  html_url: string
  description: string | null
  language: string | null
  default_branch: string
  pushed_at: string | null
  created_at: string
  updated_at: string
  archived: boolean
  fork: boolean
  stargazers_count: number
  open_issues_count: number
}

// ============================================================================
// GitHub Scanner Service
// ============================================================================

export class GitHubScanner {
  private cache: Map<string, CacheEntry> = new Map()
  private cacheTTL: number

  /**
   * Create a new GitHub Scanner instance
   * @param cacheTTL - Cache TTL in milliseconds (default: 5 minutes)
   */
  constructor(cacheTTL: number = 5 * 60 * 1000) {
    this.cacheTTL = cacheTTL
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Scan user's GitHub repositories
   *
   * @param token - GitHub Personal Access Token
   * @param userId - User ID for caching
   * @param options - Scan options
   * @returns Scan result with repositories
   */
  async scanRepositories(
    token: string,
    userId: string,
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    const cacheKey = userId

    // Check cache unless force refresh is requested
    if (!options.forceRefresh) {
      const cached = this.getCacheEntry(cacheKey)
      if (cached) {
        logger.debug('[GitHubScanner] Returning cached result', { userId })
        return cached
      }
    }

    logger.info('[GitHubScanner] Scanning repositories', { userId, options })

    const octokit = new Octokit({ auth: token })

    try {
      // Fetch all repositories with pagination
      const allRepos = await this.fetchAllRepositories(octokit)

      // Transform to our format
      const repositories = allRepos.map((repo) => this.transformRepository(repo))

      // Filter repositories
      const filteredRepos = this.filterRepositories(repositories, options)

      // Check for Sentra enablement if requested
      let finalRepos = filteredRepos
      if (options.sentraEnabledOnly) {
        finalRepos = await this.checkSentraEnabledBatch(octokit, filteredRepos)
        finalRepos = finalRepos.filter((repo) => repo.sentraEnabled)
      }

      // Create result
      const result: ScanResult = {
        repositories: finalRepos,
        totalCount: repositories.length,
        sentraEnabledCount: finalRepos.filter((r) => r.sentraEnabled).length,
        scannedAt: new Date().toISOString(),
        fromCache: false,
      }

      // Cache result
      this.setCacheEntry(cacheKey, result)

      logger.info('[GitHubScanner] Scan complete', {
        userId,
        totalRepos: result.totalCount,
        filteredRepos: finalRepos.length,
        sentraEnabled: result.sentraEnabledCount,
      })

      return result
    } catch (error) {
      logger.error('[GitHubScanner] Scan failed', { userId, error })
      throw error
    }
  }

  /**
   * Scan and sync repositories to database
   *
   * @param token - GitHub Personal Access Token
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param existingProjectPaths - Set of existing project paths (GitHub URLs)
   * @param options - Scan options
   * @returns New repositories that can be added as projects
   */
  async scanAndPrepareProjects(
    token: string,
    userId: string,
    orgId: string,
    existingProjectPaths: Set<string>,
    options: ScanOptions = {}
  ): Promise<{ newProjects: CreateProjectInput[]; scanResult: ScanResult }> {
    const scanResult = await this.scanRepositories(token, userId, options)

    // Filter out repos that already exist as projects
    const newRepos = scanResult.repositories.filter(
      (repo) => !existingProjectPaths.has(repo.htmlUrl)
    )

    // Create project inputs
    const newProjects = newRepos.map((repo) =>
      this.createProjectInput(repo, userId, orgId)
    )

    logger.info('[GitHubScanner] Prepared projects for sync', {
      userId,
      totalScanned: scanResult.totalCount,
      newProjectsCount: newProjects.length,
      existingProjectsSkipped: scanResult.repositories.length - newRepos.length,
    })

    return { newProjects, scanResult }
  }

  // --------------------------------------------------------------------------
  // Repository Fetching
  // --------------------------------------------------------------------------

  /**
   * Fetch all repositories for authenticated user with pagination
   */
  private async fetchAllRepositories(octokit: Octokit): Promise<GitHubRepoResponse[]> {
    const allRepos: GitHubRepoResponse[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: perPage,
        page,
        sort: 'updated',
        direction: 'desc',
      })

      allRepos.push(...(response.data as GitHubRepoResponse[]))

      // If we got fewer than perPage, we've reached the end
      if (response.data.length < perPage) {
        break
      }

      page++

      // Safety limit to prevent infinite loops
      if (page > 50) {
        logger.warn('[GitHubScanner] Reached pagination limit of 5000 repos')
        break
      }
    }

    return allRepos
  }

  // --------------------------------------------------------------------------
  // Sentra Enablement Check
  // --------------------------------------------------------------------------

  /**
   * Check if a repository has Sentra enabled (.claude/ directory)
   */
  async checkSentraEnabled(
    octokit: Octokit,
    owner: string,
    repo: string
  ): Promise<boolean> {
    try {
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path: '.claude',
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Check Sentra enablement for multiple repositories
   * Uses Promise.allSettled to handle failures gracefully
   */
  private async checkSentraEnabledBatch(
    octokit: Octokit,
    repos: GitHubRepository[]
  ): Promise<GitHubRepository[]> {
    const results = await Promise.allSettled(
      repos.map(async (repo) => {
        const enabled = await this.checkSentraEnabled(octokit, repo.owner, repo.name)
        return { ...repo, sentraEnabled: enabled }
      })
    )

    return results
      .filter((r): r is PromiseFulfilledResult<GitHubRepository> => r.status === 'fulfilled')
      .map((r) => r.value)
  }

  // --------------------------------------------------------------------------
  // Filtering
  // --------------------------------------------------------------------------

  /**
   * Filter repositories based on options
   */
  filterRepositories(
    repos: GitHubRepository[],
    options: ScanOptions
  ): GitHubRepository[] {
    let filtered = [...repos]

    // Exclude archived by default
    if (options.excludeArchived !== false) {
      filtered = filtered.filter((repo) => !repo.archived)
    }

    // Exclude forks by default
    if (options.excludeForks !== false) {
      filtered = filtered.filter((repo) => !repo.fork)
    }

    // Filter by language
    if (options.language) {
      const lang = options.language.toLowerCase()
      filtered = filtered.filter(
        (repo) => repo.language?.toLowerCase() === lang
      )
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit)
    }

    return filtered
  }

  // --------------------------------------------------------------------------
  // Transformation
  // --------------------------------------------------------------------------

  /**
   * Transform GitHub API response to our GitHubRepository type
   */
  transformRepository(apiRepo: GitHubRepoResponse): GitHubRepository {
    return {
      id: apiRepo.id,
      name: apiRepo.name,
      fullName: apiRepo.full_name,
      owner: apiRepo.owner.login,
      private: apiRepo.private,
      htmlUrl: apiRepo.html_url,
      description: apiRepo.description,
      language: apiRepo.language,
      defaultBranch: apiRepo.default_branch,
      pushedAt: apiRepo.pushed_at,
      createdAt: apiRepo.created_at,
      updatedAt: apiRepo.updated_at,
      archived: apiRepo.archived,
      fork: apiRepo.fork,
      stargazersCount: apiRepo.stargazers_count,
      openIssuesCount: apiRepo.open_issues_count,
    }
  }

  /**
   * Create project input from repository
   */
  createProjectInput(
    repo: GitHubRepository,
    userId: string,
    orgId: string
  ): CreateProjectInput {
    return {
      name: repo.name,
      path: repo.htmlUrl,
      userId,
      orgId,
      settings: {
        github: {
          repoId: repo.id,
          fullName: repo.fullName,
          owner: repo.owner,
          name: repo.name,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          language: repo.language,
          openIssuesCount: repo.openIssuesCount,
          stargazersCount: repo.stargazersCount,
        },
        sentraEnabled: repo.sentraEnabled ?? true,
        syncedAt: new Date().toISOString(),
      },
    }
  }

  // --------------------------------------------------------------------------
  // Caching
  // --------------------------------------------------------------------------

  /**
   * Get cache entry if valid
   */
  getCacheEntry(key: string): ScanResult | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return { ...entry.result, fromCache: true }
  }

  /**
   * Set cache entry
   */
  setCacheEntry(key: string, result: ScanResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    })
  }

  /**
   * Invalidate specific cache entry
   */
  invalidateCache(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const githubScanner = new GitHubScanner()
