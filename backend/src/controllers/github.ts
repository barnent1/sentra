/**
 * GitHub Controller
 *
 * Handles GitHub API operations for PR review functionality.
 * All endpoints require JWT authentication and GitHub token from user settings.
 */

import { Request, Response } from 'express';
import { drizzleDb } from '@/services/database-drizzle';
import { decryptValue } from '@/services/encryption';
import type { JWTPayload } from '../types';

interface GitHubPullRequest {
  number: number;
  title: string;
  body: string;
  state: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  mergeable: boolean | null;
  html_url: string;
}

interface GitHubCheckRuns {
  total_count: number;
  check_runs: Array<{
    status: string;
    conclusion: string | null;
  }>;
}

interface GitHubReviewComment {
  id: number;
  user: {
    login: string;
  };
  body: string;
  created_at: string;
  path?: string;
  line?: number;
}

/**
 * Get user's GitHub token from settings
 */
async function getGitHubToken(userId: string): Promise<string> {
  const settings = await drizzleDb.getSettingsByUserId(userId);

  if (!settings?.githubToken) {
    throw new Error('GitHub token not configured');
  }

  return decryptValue(settings.githubToken);
}

/**
 * Determine checks status from GitHub API
 */
function determineChecksStatus(checkRuns: GitHubCheckRuns): string {
  if (checkRuns.total_count === 0) {
    return 'pending';
  }

  const allCompleted = checkRuns.check_runs.every(run => run.status === 'completed');
  const anyFailed = checkRuns.check_runs.some(run => run.conclusion === 'failure');

  if (!allCompleted) {
    return 'pending';
  }

  if (anyFailed) {
    return 'failure';
  }

  return 'success';
}

/**
 * GET /api/github/pr/:owner/:repo/:number
 * Get PR details from GitHub
 */
export async function getPullRequest(req: Request, res: Response): Promise<void> {
  try {
    const { owner, repo, number } = req.params;
    const user = req.user as JWTPayload;

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId);

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
    );

    if (!prResponse.ok) {
      if (prResponse.status === 401) {
        res.status(401).json({ error: 'Invalid GitHub token' });
        return;
      }
      if (prResponse.status === 404) {
        res.status(404).json({ error: 'Pull request not found' });
        return;
      }
      if (prResponse.status === 403) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      throw new Error(`GitHub API error: ${prResponse.status}`);
    }

    const pr = (await prResponse.json()) as GitHubPullRequest;

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
    );

    let checksStatus = 'pending';
    if (checksResponse.ok) {
      const checkRuns = (await checksResponse.json()) as GitHubCheckRuns;
      checksStatus = determineChecksStatus(checkRuns);
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
    );

    let comments: GitHubReviewComment[] = [];
    if (commentsResponse.ok) {
      comments = (await commentsResponse.json()) as GitHubReviewComment[];
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
    };

    res.json(prData);
  } catch (error) {
    console.error('[GitHub] Get PR error:', error);

    if (error instanceof Error && error.message === 'GitHub token not configured') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to fetch pull request' });
  }
}

/**
 * GET /api/github/pr/:owner/:repo/:number/diff
 * Get PR diff from GitHub
 */
export async function getPRDiff(req: Request, res: Response): Promise<void> {
  try {
    const { owner, repo, number } = req.params;
    const user = req.user as JWTPayload;

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId);

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
    );

    if (!diffResponse.ok) {
      if (diffResponse.status === 401) {
        res.status(401).json({ error: 'Invalid GitHub token' });
        return;
      }
      if (diffResponse.status === 404) {
        res.status(404).json({ error: 'Pull request not found' });
        return;
      }
      throw new Error(`GitHub API error: ${diffResponse.status}`);
    }

    const diff = await diffResponse.text();

    res.json({ diff });
  } catch (error) {
    console.error('[GitHub] Get PR diff error:', error);

    if (error instanceof Error && error.message === 'GitHub token not configured') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to fetch PR diff' });
  }
}

/**
 * POST /api/github/pr/:owner/:repo/:number/approve
 * Approve a PR on GitHub
 */
export async function approvePullRequest(req: Request, res: Response): Promise<void> {
  try {
    const { owner, repo, number } = req.params;
    const { comment } = req.body;
    const user = req.user as JWTPayload;

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId);

    // Create approval review on GitHub
    const reviewResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/reviews`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'APPROVE',
          body: comment || 'Approved via Quetrex',
        }),
      }
    );

    if (!reviewResponse.ok) {
      if (reviewResponse.status === 401) {
        res.status(401).json({ error: 'Invalid GitHub token' });
        return;
      }
      if (reviewResponse.status === 404) {
        res.status(404).json({ error: 'Pull request not found' });
        return;
      }
      if (reviewResponse.status === 403) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      throw new Error(`GitHub API error: ${reviewResponse.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[GitHub] Approve PR error:', error);

    if (error instanceof Error && error.message === 'GitHub token not configured') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to approve pull request' });
  }
}

/**
 * POST /api/github/pr/:owner/:repo/:number/request-changes
 * Request changes on a PR
 */
export async function requestChangesPullRequest(req: Request, res: Response): Promise<void> {
  try {
    const { owner, repo, number } = req.params;
    const { comment } = req.body;
    const user = req.user as JWTPayload;

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      res.status(400).json({ error: 'Comment is required' });
      return;
    }

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId);

    // Create request changes review on GitHub
    const reviewResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/reviews`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'REQUEST_CHANGES',
          body: comment,
        }),
      }
    );

    if (!reviewResponse.ok) {
      if (reviewResponse.status === 401) {
        res.status(401).json({ error: 'Invalid GitHub token' });
        return;
      }
      if (reviewResponse.status === 404) {
        res.status(404).json({ error: 'Pull request not found' });
        return;
      }
      if (reviewResponse.status === 403) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      throw new Error(`GitHub API error: ${reviewResponse.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[GitHub] Request changes error:', error);

    if (error instanceof Error && error.message === 'GitHub token not configured') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to request changes' });
  }
}

/**
 * POST /api/github/pr/:owner/:repo/:number/merge
 * Merge a PR on GitHub
 */
export async function mergePullRequest(req: Request, res: Response): Promise<void> {
  try {
    const { owner, repo, number } = req.params;
    const { mergeMethod } = req.body;
    const user = req.user as JWTPayload;

    if (!mergeMethod || !['merge', 'squash', 'rebase'].includes(mergeMethod)) {
      res.status(400).json({ error: 'Invalid merge method' });
      return;
    }

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId);

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
    );

    if (!mergeResponse.ok) {
      if (mergeResponse.status === 401) {
        res.status(401).json({ error: 'Invalid GitHub token' });
        return;
      }
      if (mergeResponse.status === 404) {
        res.status(404).json({ error: 'Pull request not found' });
        return;
      }
      if (mergeResponse.status === 403) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      if (mergeResponse.status === 405) {
        res.status(400).json({ error: 'Pull request is not mergeable' });
        return;
      }
      throw new Error(`GitHub API error: ${mergeResponse.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[GitHub] Merge PR error:', error);

    if (error instanceof Error && error.message === 'GitHub token not configured') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to merge pull request' });
  }
}
