/**
 * GET /api/github/pr/:owner/:repo/:number/diff
 * Get PR diff from GitHub
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'
import { decryptValue } from '@/services/encryption'

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

    // Fetch PR diff from GitHub
    const diffResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.diff',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    if (!diffResponse.ok) {
      if (diffResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid GitHub token' },
          { status: 401 }
        )
      }
      if (diffResponse.status === 404) {
        return NextResponse.json(
          { error: 'Pull request not found' },
          { status: 404 }
        )
      }
      throw new Error(`GitHub API error: ${diffResponse.status}`)
    }

    const diff = await diffResponse.text()

    return NextResponse.json({ diff })
  } catch (error) {
    console.error('[GitHub] Get PR diff error:', error)

    if (
      error instanceof Error &&
      error.message === 'GitHub token not configured'
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch PR diff' },
      { status: 500 }
    )
  }
}
