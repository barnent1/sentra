/**
 * GET /api/github/scan
 * Scan user's GitHub repositories and return list of available repos
 *
 * POST /api/github/scan
 * Sync selected repositories as Sentra projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'
import { decryptValue } from '@/services/encryption'
import { githubScanner, type ScanOptions } from '@/services/github-scanner'
import { logger } from '@/services/logger'

/**
 * Get user's GitHub token from settings
 */
async function getGitHubToken(userId: string): Promise<string> {
  const settings = await drizzleDb.getSettingsByUserId(userId)

  if (!settings?.githubToken) {
    throw new Error(
      'GitHub token not configured. Please add your GitHub token in Settings.'
    )
  }

  return decryptValue(settings.githubToken)
}

/**
 * GET /api/github/scan
 * Scan user's GitHub repositories
 *
 * Query parameters:
 * - excludeArchived: boolean (default: true)
 * - excludeForks: boolean (default: true)
 * - language: string (filter by language)
 * - limit: number (max results)
 * - sentraEnabledOnly: boolean (only repos with .claude/ directory)
 * - forceRefresh: boolean (bypass cache)
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const options: ScanOptions = {
      excludeArchived: searchParams.get('excludeArchived') !== 'false',
      excludeForks: searchParams.get('excludeForks') !== 'false',
      language: searchParams.get('language') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!, 10)
        : undefined,
      sentraEnabledOnly: searchParams.get('sentraEnabledOnly') === 'true',
      forceRefresh: searchParams.get('forceRefresh') === 'true',
    }

    logger.info('[GitHub Scan] Starting repository scan', {
      userId: user.userId,
      options,
    })

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId)

    // Scan repositories
    const scanResult = await githubScanner.scanRepositories(
      githubToken,
      user.userId,
      options
    )

    // Get existing projects to mark which repos are already imported
    const existingProjects = await drizzleDb.getProjectsByUserId(user.userId)
    const existingPaths = new Set(existingProjects.map((p) => p.path))

    // Mark repos that are already imported
    const repositoriesWithStatus = scanResult.repositories.map((repo) => ({
      ...repo,
      imported: existingPaths.has(repo.htmlUrl),
    }))

    logger.info('[GitHub Scan] Scan complete', {
      userId: user.userId,
      totalRepos: scanResult.totalCount,
      returnedRepos: repositoriesWithStatus.length,
      alreadyImported: repositoriesWithStatus.filter((r) => r.imported).length,
      fromCache: scanResult.fromCache,
    })

    return NextResponse.json({
      repositories: repositoriesWithStatus,
      totalCount: scanResult.totalCount,
      sentraEnabledCount: scanResult.sentraEnabledCount,
      scannedAt: scanResult.scannedAt,
      fromCache: scanResult.fromCache,
    })
  } catch (error) {
    logger.error('[GitHub Scan] Scan failed', { error })

    if (error instanceof Error) {
      if (error.message.includes('GitHub token not configured')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Handle GitHub API errors
      if ('status' in error) {
        const status = (error as { status: number }).status

        if (status === 401) {
          return NextResponse.json(
            {
              error:
                'Invalid GitHub token. Please update your token in Settings.',
            },
            { status: 401 }
          )
        }

        if (status === 403) {
          return NextResponse.json(
            {
              error:
                'GitHub rate limit exceeded or insufficient permissions. Please try again later.',
            },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.json(
      { error: 'Failed to scan repositories. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/github/scan
 * Import selected repositories as Sentra projects
 *
 * Request body:
 * - repositoryIds: number[] (GitHub repo IDs to import)
 * - all: boolean (import all available repos)
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const body = (await request.json()) as {
      repositoryIds?: number[]
      all?: boolean
    }

    const { repositoryIds, all } = body

    if (!repositoryIds?.length && !all) {
      return NextResponse.json(
        { error: 'Either repositoryIds or all=true must be provided' },
        { status: 400 }
      )
    }

    logger.info('[GitHub Scan] Starting repository import', {
      userId: user.userId,
      repositoryIds,
      importAll: all,
    })

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId)

    // Get user's organization ID (use first organization)
    const userOrgs = await drizzleDb.listUserOrganizations(user.userId)
    if (!userOrgs.length) {
      return NextResponse.json(
        { error: 'User organization not found. Please create an organization first.' },
        { status: 400 }
      )
    }
    const userOrg = userOrgs[0]

    // Get existing projects
    const existingProjects = await drizzleDb.getProjectsByUserId(user.userId)
    const existingPaths = new Set(existingProjects.map((p) => p.path))

    // Scan repositories (use cached if available)
    const scanResult = await githubScanner.scanRepositories(
      githubToken,
      user.userId
    )

    // Filter repositories to import
    let reposToImport = scanResult.repositories.filter(
      (repo) => !existingPaths.has(repo.htmlUrl)
    )

    if (!all && repositoryIds) {
      const idSet = new Set(repositoryIds)
      reposToImport = reposToImport.filter((repo) => idSet.has(repo.id))
    }

    if (reposToImport.length === 0) {
      return NextResponse.json({
        imported: [],
        skipped: 0,
        message: 'No new repositories to import',
      })
    }

    // Create projects for each repository
    const importedProjects = []
    const errors = []

    for (const repo of reposToImport) {
      try {
        const projectInput = githubScanner.createProjectInput(
          repo,
          user.userId,
          userOrg.id
        )
        const project = await drizzleDb.createProject(projectInput)
        importedProjects.push({
          id: project.id,
          name: project.name,
          path: project.path,
          githubRepoId: repo.id,
        })
      } catch (err) {
        logger.error('[GitHub Scan] Failed to import repository', {
          repo: repo.fullName,
          error: err,
        })
        errors.push({
          repo: repo.fullName,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    logger.info('[GitHub Scan] Import complete', {
      userId: user.userId,
      imported: importedProjects.length,
      errors: errors.length,
    })

    return NextResponse.json({
      imported: importedProjects,
      errors: errors.length > 0 ? errors : undefined,
      skipped: scanResult.repositories.length - reposToImport.length,
    })
  } catch (error) {
    logger.error('[GitHub Scan] Import failed', { error })

    if (error instanceof Error) {
      if (error.message.includes('GitHub token not configured')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to import repositories. Please try again.' },
      { status: 500 }
    )
  }
}
