/**
 * GitHub Integration Library
 *
 * Handles GitHub API interactions for creating issues from specs.
 * Requires GitHub PAT to be configured in settings.
 */

import { logger } from '@/services/logger'

export interface GitHubIssueRequest {
  title: string
  body: string
  labels?: string[]
  repo?: {
    owner: string
    name: string
  }
}

export interface GitHubIssueResponse {
  number: number
  html_url: string
  id: number
}

/**
 * Parse spec markdown to extract title and description
 *
 * @param specMarkdown - The full specification markdown content
 * @returns Object with title and body
 */
export function parseSpecMarkdown(specMarkdown: string): {
  title: string
  description: string
} {
  const lines = specMarkdown.split('\n')
  let title = 'Untitled Specification'
  let description = specMarkdown

  // Try to extract title from first H1
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.replace(/^# /, '').trim()
      break
    }
  }

  // Description is everything after the first heading
  const titleIndex = lines.findIndex((line) => line.startsWith('# '))
  if (titleIndex !== -1) {
    description = lines.slice(titleIndex + 1).join('\n').trim()
  }

  return { title, description }
}

/**
 * Extract labels from spec markdown
 *
 * Looks for labels in format [P1], [bug], [feature], etc.
 *
 * @param specMarkdown - The full specification markdown content
 * @returns Array of extracted labels
 */
export function extractLabelsFromSpec(specMarkdown: string): string[] {
  const labels: string[] = []
  const labelRegex = /\[([^\]]+)\]/g
  let match

  // Look for common GitHub labels in brackets
  while ((match = labelRegex.exec(specMarkdown)) !== null) {
    const label = match[1].toLowerCase().trim()

    // Only include known label patterns
    if (
      /^(p[0-3]|bug|feature|enhancement|documentation|breaking)$/i.test(label)
    ) {
      labels.push(label)
    }
  }

  // Always include ai-feature
  if (!labels.includes('ai-feature')) {
    labels.push('ai-feature')
  }

  return [...new Set(labels)] // Remove duplicates
}

/**
 * Create a GitHub issue from a spec
 *
 * This function:
 * 1. Parses the spec markdown for title and description
 * 2. Extracts labels from the spec
 * 3. Makes API call to create the GitHub issue
 * 4. Returns the issue URL
 *
 * @param spec - The specification markdown content
 * @param githubToken - GitHub Personal Access Token (from settings)
 * @param repoOwner - Repository owner
 * @param repoName - Repository name
 * @returns GitHub issue URL
 * @throws Error if GitHub token is not configured or API call fails
 */
export async function createIssueFromSpec(
  spec: string,
  githubToken: string,
  repoOwner: string,
  repoName: string
): Promise<string> {
  try {
    // Validate inputs
    if (!githubToken) {
      throw new Error('GitHub PAT (Personal Access Token) not configured in settings')
    }

    if (!spec || spec.trim().length === 0) {
      throw new Error('Specification content is empty')
    }

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner or name not configured')
    }

    logger.info('Creating GitHub issue from spec', {
      repoOwner,
      repoName,
      specLength: spec.length,
    })

    // Parse spec for title and description
    const { title, description } = parseSpecMarkdown(spec)
    logger.debug('Parsed spec', { title, descriptionLength: description.length })

    // Extract labels
    const labels = extractLabelsFromSpec(spec)
    logger.debug('Extracted labels', { labels })

    // Prepare issue body (add spec link header)
    const issueBody = `## Specification

${description}

---
*Created from Sentra AI Specification*`

    // Call GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body: issueBody,
          labels,
        }),
      }
    )

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json()
      logger.error('GitHub API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error('GitHub authentication failed. Check your PAT in settings.')
      }
      if (response.status === 403) {
        throw new Error(
          'GitHub permission denied. Ensure your PAT has "repo" and "issues" scopes.'
        )
      }
      if (response.status === 404) {
        throw new Error(
          `Repository "${repoOwner}/${repoName}" not found. Check your settings.`
        )
      }

      throw new Error(
        `GitHub API error (${response.status}): ${errorData.message || response.statusText}`
      )
    }

    // Parse response
    const issueData: GitHubIssueResponse = await response.json()

    const issueUrl = issueData.html_url
    logger.info('GitHub issue created successfully', {
      issueNumber: issueData.number,
      issueUrl,
    })

    return issueUrl
  } catch (error) {
    logger.error('Failed to create GitHub issue', error)
    throw error
  }
}

/**
 * Validate GitHub token format
 *
 * @param token - The token to validate
 * @returns true if token appears valid
 */
export function isValidGitHubToken(token: string): boolean {
  if (!token) return false
  // GitHub tokens typically start with 'ghp_' or 'github_pat_'
  // But we'll accept any non-empty string as the actual validation happens at API call time
  return token.length > 10 // Basic length check
}
