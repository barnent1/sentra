/**
 * GET /api/github/pr/:owner/:repo/:number
 * Get PR details from GitHub
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'
import { decryptValue } from '@/services/encryption'

interface GitHubPullRequest {
  number: number
  title: string
  body: string
  state: string
  user: {
    login: string
  }
  created_at: string
  updated_at: string
  head: {
    ref: string
  }
  base: {
    ref: string
  }
  mergeable: boolean | null
  html_url: string
}

interface GitHubCheckRuns {
  total_count: number
  check_runs: Array<{
    status: string
    conclusion: string | null
  }>
}

interface GitHubReviewComment {
  id: number
  user: {
    login: string
  }
  body: string
  created_at: string
  path?: string
  line?: number
}

/**
 * Get user's GitHub token from settings
 */
async function getGitHubToken(userId: string): Promise<string> {
  const settings = await drizzleDb.getSettingsByUserId(userId)

  if (!settings?.githubToken) {
    throw new Error('GitHub token not configured')
  }

  return decryptValue(settings.githubToken)
}

/**
 * Determine checks status from GitHub API
 */
function determineChecksStatus(checkRuns: GitHubCheckRuns): string {
  if (checkRuns.total_count === 0) {
    return 'pending'
  }

  const allCompleted = checkRuns.check_runs.every(
    run => run.status === 'completed'
  )
  const anyFailed = checkRuns.check_runs.some(
    run => run.conclusion === 'failure'
  )

  if (!allCompleted) {
    return 'pending'
  }

  if (anyFailed) {
    return 'failure'
  }

  return 'success'
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string; number: string }> }
) {
  try {
    const user = requireAuthUser(request)
    const params = await context.params
    const { owner, repo, number } = params

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId)

    // Fetch PR data from GitHub
    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    if (!prResponse.ok) {
      if (prResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid GitHub token' },
          { status: 401 }
        )
      }
      if (prResponse.status === 404) {
        return NextResponse.json(
          { error: 'Pull request not found' },
          { status: 404 }
        )
      }
      if (prResponse.status === 403) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      throw new Error(`GitHub API error: ${prResponse.status}`)
    }

    const pr = (await prResponse.json()) as GitHubPullRequest

    // Fetch check runs for the PR
    const checksResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${pr.head.ref}/check-runs`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    let checksStatus = 'pending'
    if (checksResponse.ok) {
      const checkRuns = (await checksResponse.json()) as GitHubCheckRuns
      checksStatus = determineChecksStatus(checkRuns)
    }

    // Fetch review comments
    const commentsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/comments`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    let comments: GitHubReviewComment[] = []
    if (commentsResponse.ok) {
      comments = (await commentsResponse.json()) as GitHubReviewComment[]
    }

    // Transform to frontend format
    const prData = {
      pr: {
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        state: pr.state,
        author: pr.user.login,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
        mergeable: pr.mergeable ?? false,
        url: pr.html_url,
        checksStatus,
      },
      comments: comments.map(comment => ({
        id: comment.id,
        author: comment.user.login,
        body: comment.body,
        createdAt: comment.created_at,
        path: comment.path,
        line: comment.line,
      })),
    }

    return NextResponse.json(prData)
  } catch (error) {
    console.error('[GitHub] Get PR error:', error)

    if (
      error instanceof Error &&
      error.message === 'GitHub token not configured'
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch pull request' },
      { status: 500 }
    )
  }
}
