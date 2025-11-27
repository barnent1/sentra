/**
 * POST /api/github/repos
 * Create a new GitHub repository from Quetrex template
 */

import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';
import { decryptValue } from '@/services/encryption';

interface CreateRepoRequest {
  name: string;
  owner?: string; // If not provided, creates in authenticated user's account
  description?: string;
  private?: boolean;
}

/**
 * Get user's GitHub token from settings
 */
async function getGitHubToken(userId: string): Promise<string> {
  const settings = await drizzleDb.getSettingsByUserId(userId);

  if (!settings?.githubToken) {
    throw new Error('GitHub token not configured. Please add your GitHub token in Settings.');
  }

  return decryptValue(settings.githubToken);
}

/**
 * Validate repository name (GitHub naming rules)
 */
function validateRepoName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Repository name is required' };
  }

  // GitHub repo name rules:
  // - Can contain alphanumeric characters, hyphens, underscores, periods
  // - Cannot start with a period or hyphen
  // - Cannot end with .git
  // - Must be between 1-100 characters
  const regex = /^[a-zA-Z0-9_][a-zA-Z0-9._-]{0,98}[a-zA-Z0-9_]$|^[a-zA-Z0-9_]$/;

  if (!regex.test(name)) {
    return {
      valid: false,
      error:
        'Invalid repository name. Use only letters, numbers, hyphens, underscores, and periods.',
    };
  }

  if (name.endsWith('.git')) {
    return { valid: false, error: 'Repository name cannot end with .git' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request);
    const body = (await request.json()) as CreateRepoRequest;

    // Validate input
    const { name, owner, description, private: isPrivate = true } = body;

    const validation = validateRepoName(name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get user's GitHub token
    const githubToken = await getGitHubToken(user.userId);

    // Initialize Octokit
    const octokit = new Octokit({
      auth: githubToken,
    });

    // Get authenticated user's GitHub username if owner not provided
    let targetOwner = owner;
    if (!targetOwner) {
      const { data: githubUser } = await octokit.rest.users.getAuthenticated();
      targetOwner = githubUser.login;
    }

    console.log(`[GitHub] Creating repository ${targetOwner}/${name} from template`);

    // Create repository from template
    // Template: Barnhardt-Enterprises-Inc/quetrex-template-nextjs
    const { data: repo } = await octokit.rest.repos.createUsingTemplate({
      template_owner: 'Barnhardt-Enterprises-Inc',
      template_repo: 'quetrex-template-nextjs',
      name,
      owner: targetOwner,
      description: description || `Quetrex AI-powered project: ${name}`,
      private: isPrivate,
      include_all_branches: false,
    });

    console.log(`[GitHub] ✓ Repository created: ${repo.html_url}`);

    return NextResponse.json({
      success: true,
      repository: {
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        owner: repo.owner?.login,
        private: repo.private,
        description: repo.description,
      },
    });
  } catch (error) {
    console.error('[GitHub] Create repository error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('GitHub token not configured')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // GitHub API errors (Octokit errors have status and response)
      if ('status' in error) {
        const status = (error as { status: number; message?: string; response?: { data?: { message?: string } } }).status;
        const errorMessage = (error as { message?: string }).message;
        const githubMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;

        if (status === 401) {
          return NextResponse.json(
            { error: 'Invalid GitHub token. Please update your token in Settings.' },
            { status: 401 }
          );
        }

        if (status === 403) {
          return NextResponse.json(
            { error: 'Insufficient permissions. Your GitHub token needs repo creation access.' },
            { status: 403 }
          );
        }

        if (status === 422) {
          // Check if it's a name conflict or validation issue
          const detailedMessage = githubMessage || errorMessage || '';

          if (detailedMessage.toLowerCase().includes('already exists')) {
            return NextResponse.json(
              { error: `Repository "${name}" already exists in your GitHub account. Please choose a different name.` },
              { status: 422 }
            );
          }

          if (detailedMessage.toLowerCase().includes('name')) {
            return NextResponse.json(
              { error: `Invalid repository name "${name}". ${githubMessage || 'Please use only letters, numbers, hyphens, and underscores.'}` },
              { status: 422 }
            );
          }

          // Generic 422 error with GitHub message if available
          return NextResponse.json(
            { error: githubMessage || 'Repository name already exists or is invalid. Please try a different name.' },
            { status: 422 }
          );
        }

        // Other status codes with GitHub message
        if (githubMessage) {
          return NextResponse.json(
            { error: `GitHub API error: ${githubMessage}` },
            { status: status }
          );
        }
      }
    }

    return NextResponse.json(
      { error: 'Failed to create repository. Please try again.' },
      { status: 500 }
    );
  }
}
