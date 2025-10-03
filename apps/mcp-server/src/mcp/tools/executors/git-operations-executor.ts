/**
 * Git Operations Tool Executors
 *
 * Core business logic for executing git operations in worktree environments.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { worktrees } from '../../../../db/schema/projects.js';
import { projects } from '../../../../db/schema/projects.js';
import { screenshots } from '../../../../db/schema/assets.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../middleware/logger.js';
import type {
  CreateWorktreeInput,
  CreateWorktreeOutput,
  CreateBranchInput,
  CreateBranchOutput,
  CommitChangesInput,
  CommitChangesOutput,
  CreatePullRequestInput,
  CreatePullRequestOutput,
  CleanupWorktreeInput,
  CleanupWorktreeOutput,
} from '../../../types/git-operations.js';

const execFileAsync = promisify(execFile);

// Constants
const GIT_TIMEOUT = 30000; // 30 seconds
const GH_CLI_PATH = '/opt/homebrew/bin/gh';

/**
 * Validate that a worktree path exists and is active
 */
async function validateWorktree(worktreePath: string): Promise<void> {
  logger.debug({ worktreePath }, 'Validating worktree');

  const worktree = await db
    .select()
    .from(worktrees)
    .where(eq(worktrees.path, worktreePath))
    .limit(1);

  if (worktree.length === 0) {
    throw new AppError(
      `Worktree not found: ${worktreePath}`,
      404,
      'WORKTREE_NOT_FOUND'
    );
  }

  if (!worktree[0].isActive) {
    throw new AppError(
      `Worktree is not active: ${worktreePath}`,
      400,
      'WORKTREE_INACTIVE'
    );
  }

  logger.debug({ worktreePath, worktreeId: worktree[0].id }, 'Worktree validated');
}

/**
 * Create a git worktree for task isolation
 */
export async function createWorktree(
  input: CreateWorktreeInput
): Promise<CreateWorktreeOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Creating worktree');

  // Get project info
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, input.projectId))
    .limit(1);

  if (project.length === 0) {
    throw new AppError(
      `Project not found: ${input.projectId}`,
      404,
      'PROJECT_NOT_FOUND'
    );
  }

  if (!project[0].repoPath) {
    throw new AppError(
      `Project has no repository path: ${input.projectId}`,
      400,
      'PROJECT_NO_REPO'
    );
  }

  const repoPath = project[0].repoPath;
  const baseBranch = input.baseBranch || project[0].mainBranch;

  try {
    // Create worktree using git worktree add
    await execFileAsync(
      'git',
      ['worktree', 'add', '-b', input.branch, input.worktreePath, baseBranch],
      {
        cwd: repoPath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    // Store worktree in database
    const [worktree] = await db
      .insert(worktrees)
      .values({
        projectId: input.projectId,
        path: input.worktreePath,
        branch: input.branch,
        isActive: true,
      })
      .returning();

    const output: CreateWorktreeOutput = {
      success: true,
      message: `Worktree created successfully at ${input.worktreePath}`,
      worktree: {
        id: worktree.id,
        path: worktree.path,
        branch: worktree.branch,
        projectId: worktree.projectId,
      },
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { worktreeId: worktree.id, executionTimeMs: output.executionTimeMs },
      'Worktree created successfully'
    );

    return output;
  } catch (error) {
    logger.error({ error, input }, 'Failed to create worktree');
    throw new AppError(
      'Failed to create worktree',
      500,
      'WORKTREE_CREATION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Create and switch to a new branch in a worktree
 */
export async function createBranch(
  input: CreateBranchInput
): Promise<CreateBranchOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Creating branch');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  try {
    // Get current branch if baseBranch not specified
    let baseBranch = input.baseBranch;
    if (!baseBranch) {
      const { stdout } = await execFileAsync(
        'git',
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        {
          cwd: input.worktreePath,
          timeout: GIT_TIMEOUT,
          encoding: 'utf8',
        }
      );
      baseBranch = stdout.trim();
    }

    // Create and checkout new branch
    await execFileAsync(
      'git',
      ['checkout', '-b', input.branchName, baseBranch],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    // Update worktree record in database
    await db
      .update(worktrees)
      .set({ branch: input.branchName })
      .where(eq(worktrees.path, input.worktreePath));

    const output: CreateBranchOutput = {
      success: true,
      message: `Branch ${input.branchName} created successfully`,
      branch: input.branchName,
      baseBranch,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { branch: input.branchName, executionTimeMs: output.executionTimeMs },
      'Branch created successfully'
    );

    return output;
  } catch (error) {
    logger.error({ error, input }, 'Failed to create branch');
    throw new AppError(
      'Failed to create branch',
      500,
      'BRANCH_CREATION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Commit changes with orchestrator.md format
 */
export async function commitChanges(
  input: CommitChangesInput
): Promise<CommitChangesOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Committing changes');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  try {
    // Check if there are changes to commit
    const { stdout: statusOutput } = await execFileAsync(
      'git',
      ['status', '--porcelain'],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    if (!statusOutput.trim()) {
      throw new AppError(
        'No changes to commit',
        400,
        'NO_CHANGES'
      );
    }

    // Count files changed
    const filesChanged = statusOutput.trim().split('\n').length;

    // Stage all changes
    await execFileAsync(
      'git',
      ['add', '.'],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    // Format commit message according to orchestrator.md
    const commitMessage = `${input.phase}: ${input.description}

Type: ${input.type}
Task ID: ${input.taskId}
ADW ID: ${input.adwId}

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;

    // Commit changes
    await execFileAsync(
      'git',
      ['commit', '-m', commitMessage],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    // Get commit info
    const { stdout: shaOutput } = await execFileAsync(
      'git',
      ['rev-parse', 'HEAD'],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    const { stdout: authorOutput } = await execFileAsync(
      'git',
      ['log', '-1', '--format=%an <%ae>'],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    const { stdout: timestampOutput } = await execFileAsync(
      'git',
      ['log', '-1', '--format=%aI'],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    const output: CommitChangesOutput = {
      success: true,
      message: 'Changes committed successfully',
      commit: {
        sha: shaOutput.trim(),
        message: commitMessage,
        author: authorOutput.trim(),
        timestamp: timestampOutput.trim(),
      },
      filesChanged,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { sha: output.commit.sha, filesChanged, executionTimeMs: output.executionTimeMs },
      'Changes committed successfully'
    );

    return output;
  } catch (error) {
    logger.error({ error, input }, 'Failed to commit changes');

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'Failed to commit changes',
      500,
      'COMMIT_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Create a GitHub pull request with screenshots and test results
 */
export async function createPullRequest(
  input: CreatePullRequestInput
): Promise<CreatePullRequestOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Creating pull request');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  try {
    // Get worktree info to find project
    const worktree = await db
      .select()
      .from(worktrees)
      .where(eq(worktrees.path, input.worktreePath))
      .limit(1);

    if (worktree.length === 0) {
      throw new AppError(
        `Worktree not found: ${input.worktreePath}`,
        404,
        'WORKTREE_NOT_FOUND'
      );
    }

    const currentBranch = worktree[0].branch;
    const projectId = worktree[0].projectId;

    // Get project info for base branch
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      throw new AppError(
        `Project not found: ${projectId}`,
        404,
        'PROJECT_NOT_FOUND'
      );
    }

    const baseBranch = input.baseBranch || project[0].mainBranch;

    // Push current branch to remote
    await execFileAsync(
      'git',
      ['push', '-u', 'origin', currentBranch],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT * 2, // Allow more time for push
        encoding: 'utf8',
      }
    );

    // Format screenshots section
    let screenshotsSection = '';
    if (input.screenshotIds && input.screenshotIds.length > 0) {
      const screenshotRecords = await db
        .select()
        .from(screenshots)
        .where(
          and(
            eq(screenshots.projectId, projectId),
            inArray(screenshots.id, input.screenshotIds)
          )
        );

      if (screenshotRecords.length > 0) {
        screenshotsSection = '\n## Screenshots\n';
        for (const screenshot of screenshotRecords) {
          screenshotsSection += `- ${screenshot.fileName}\n`;
        }
      }
    }

    // Format test results section
    let testResultsSection = '';
    if (input.testResults) {
      const { unitTests, integrationTests, e2eTests, coverage } = input.testResults;
      testResultsSection = `
## Test Results
- Unit Tests: ${unitTests.passed}/${unitTests.total} passed
- Integration Tests: ${integrationTests.passed}/${integrationTests.total} passed
- E2E Tests: ${e2eTests.passed}/${e2eTests.total} passed
- Coverage: ${coverage}%`;
    }

    // Format PR body according to orchestrator.md
    const prBody = `## Summary
${input.description}

## Plan Reference
Plan ID: ${input.planId}
Task ID: ${input.taskId}
${screenshotsSection}${testResultsSection}

## Checklist
- [x] TypeScript strict mode passes
- [x] ESLint passes
- [x] All tests pass
- [x] Screenshots captured

🤖 Generated with Claude Code`;

    // Create PR using GitHub CLI
    const { stdout } = await execFileAsync(
      GH_CLI_PATH,
      [
        'pr', 'create',
        '--title', input.title,
        '--body', prBody,
        '--base', baseBranch,
        '--head', currentBranch,
      ],
      {
        cwd: input.worktreePath,
        timeout: GIT_TIMEOUT * 2,
        encoding: 'utf8',
      }
    );

    // Parse PR URL from output
    const prUrl = stdout.trim();

    // Extract PR number from URL (format: https://github.com/owner/repo/pull/123)
    const prNumberMatch = prUrl.match(/\/pull\/(\d+)$/);
    const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : 0;

    const output: CreatePullRequestOutput = {
      success: true,
      message: 'Pull request created successfully',
      pullRequest: {
        number: prNumber,
        url: prUrl,
        title: input.title,
        state: 'open',
      },
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { prNumber, prUrl, executionTimeMs: output.executionTimeMs },
      'Pull request created successfully'
    );

    return output;
  } catch (error) {
    logger.error({ error, input }, 'Failed to create pull request');
    throw new AppError(
      'Failed to create pull request',
      500,
      'PR_CREATION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Cleanup worktree and update database
 */
export async function cleanupWorktree(
  input: CleanupWorktreeInput
): Promise<CleanupWorktreeOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Cleaning up worktree');

  // Validate worktree exists (don't require it to be active)
  const worktree = await db
    .select()
    .from(worktrees)
    .where(eq(worktrees.path, input.worktreePath))
    .limit(1);

  if (worktree.length === 0) {
    throw new AppError(
      `Worktree not found: ${input.worktreePath}`,
      404,
      'WORKTREE_NOT_FOUND'
    );
  }

  const projectId = worktree[0].projectId;

  try {
    // Get project info for repo path
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      throw new AppError(
        `Project not found: ${projectId}`,
        404,
        'PROJECT_NOT_FOUND'
      );
    }

    if (!project[0].repoPath) {
      throw new AppError(
        `Project has no repository path: ${projectId}`,
        400,
        'PROJECT_NO_REPO'
      );
    }

    const repoPath = project[0].repoPath;

    // Remove worktree
    await execFileAsync(
      'git',
      ['worktree', 'remove', input.worktreePath, '--force'],
      {
        cwd: repoPath,
        timeout: GIT_TIMEOUT,
        encoding: 'utf8',
      }
    );

    // Mark worktree as inactive in database
    await db
      .update(worktrees)
      .set({ isActive: false })
      .where(eq(worktrees.id, worktree[0].id));

    const output: CleanupWorktreeOutput = {
      success: true,
      message: 'Worktree cleaned up successfully',
      removedPath: input.worktreePath,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { worktreeId: worktree[0].id, executionTimeMs: output.executionTimeMs },
      'Worktree cleaned up successfully'
    );

    return output;
  } catch (error) {
    logger.error({ error, input }, 'Failed to cleanup worktree');
    throw new AppError(
      'Failed to cleanup worktree',
      500,
      'WORKTREE_CLEANUP_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
