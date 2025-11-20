/**
 * POST /api/github/pr/:owner/:repo/:number/merge
 * Merge a PR on GitHub
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string; number: string }> }
) {
  try {
    const user = requireAuthUser(request)
    const params = await context.params
    const { owner, repo, number } = params
    const body = await request.json()
    const { mergeMethod } = body

    if (!mergeMethod || !['merge', 'squash', 'rebase'].includes(mergeMethod)) {
      return NextResponse.json(
        { error: 'Invalid merge method' },
        { status: 400 }
      )
    }

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId)

    // Merge PR on GitHub
    const mergeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/merge`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merge_method: mergeMethod,
        }),
      }
    )

    if (!mergeResponse.ok) {
      if (mergeResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid GitHub token' },
          { status: 401 }
        )
      }
      if (mergeResponse.status === 404) {
        return NextResponse.json(
          { error: 'Pull request not found' },
          { status: 404 }
        )
      }
      if (mergeResponse.status === 403) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      if (mergeResponse.status === 405) {
        return NextResponse.json(
          { error: 'Pull request is not mergeable' },
          { status: 400 }
        )
      }
      throw new Error(`GitHub API error: ${mergeResponse.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GitHub] Merge PR error:', error)

    if (
      error instanceof Error &&
      error.message === 'GitHub token not configured'
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to merge pull request' },
      { status: 500 }
    )
  }
}
