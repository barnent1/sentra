/**
 * Git Operations MCP Tools
 *
 * Tools for executing git operations in worktree environments.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../middleware/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateWorktreeSchema,
  CreateBranchSchema,
  CommitChangesSchema,
  CreatePullRequestSchema,
  CleanupWorktreeSchema,
} from './schemas/git-operations-schemas.js';
import {
  createWorktree,
  createBranch,
  commitChanges,
  createPullRequest,
  cleanupWorktree,
} from './executors/git-operations-executor.js';
import type {
  CreateWorktreeInput,
  CreateBranchInput,
  CommitChangesInput,
  CreatePullRequestInput,
  CleanupWorktreeInput,
} from '../../types/git-operations.js';

/**
 * Git operations tools
 */
export const gitOperationsTools: Tool[] = [
  {
    name: 'create_worktree',
    description: 'Create a git worktree for task isolation. Creates a new worktree at the specified path with a new branch. Validates project exists and has a repository path before creating worktree.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'number',
          description: 'ID of the project to create worktree for',
        },
        worktreePath: {
          type: 'string',
          description: 'Absolute path where worktree will be created (must be absolute, no path traversal)',
        },
        branch: {
          type: 'string',
          description: 'Name of the new branch to create (alphanumeric, dash, underscore, slash only)',
        },
        baseBranch: {
          type: 'string',
          description: 'Base branch to create from (defaults to project main branch)',
        },
      },
      required: ['projectId', 'worktreePath', 'branch'],
    },
  },
  {
    name: 'create_branch',
    description: 'Create and switch to a new branch in a worktree. Validates worktree exists and is active before creating branch. Updates worktree record in database with new branch name.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        branchName: {
          type: 'string',
          description: 'Name of the new branch to create (alphanumeric, dash, underscore, slash only)',
        },
        baseBranch: {
          type: 'string',
          description: 'Base branch to create from (defaults to current branch)',
        },
      },
      required: ['worktreePath', 'branchName'],
    },
  },
  {
    name: 'commit_changes',
    description: 'Commit changes with orchestrator.md format. Stages all changes, creates commit with standardized message format including phase, type, task ID, and ADW ID. Validates worktree is active and has changes to commit.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        phase: {
          type: 'string',
          description: 'Phase or stage of work (e.g., "implement", "refactor", "test")',
        },
        description: {
          type: 'string',
          description: 'Brief description of changes made',
        },
        type: {
          type: 'string',
          enum: ['chore', 'bug', 'feature'],
          description: 'Type of commit (chore, bug, or feature)',
        },
        taskId: {
          type: 'string',
          description: 'Task identifier (alphanumeric, dash, underscore only)',
        },
        adwId: {
          type: 'string',
          description: 'ADW (Automated Development Workflow) identifier (alphanumeric, dash, underscore only)',
        },
      },
      required: ['worktreePath', 'phase', 'description', 'type', 'taskId', 'adwId'],
    },
  },
  {
    name: 'create_pull_request',
    description: 'Create a GitHub pull request with screenshots and test results. Pushes current branch to remote and creates PR using GitHub CLI. Formats PR body with summary, plan reference, screenshots, test results, and checklist according to orchestrator.md format.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        title: {
          type: 'string',
          description: 'Pull request title',
        },
        description: {
          type: 'string',
          description: 'Pull request description/summary',
        },
        planId: {
          type: 'string',
          description: 'Plan identifier (alphanumeric, dash, underscore only)',
        },
        taskId: {
          type: 'string',
          description: 'Task identifier (alphanumeric, dash, underscore only)',
        },
        screenshotIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of screenshot IDs to include in PR (optional)',
        },
        testResults: {
          type: 'object',
          properties: {
            unitTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                total: { type: 'number' },
              },
              required: ['passed', 'total'],
            },
            integrationTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                total: { type: 'number' },
              },
              required: ['passed', 'total'],
            },
            e2eTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                total: { type: 'number' },
              },
              required: ['passed', 'total'],
            },
            coverage: { type: 'number' },
          },
          required: ['unitTests', 'integrationTests', 'e2eTests', 'coverage'],
          description: 'Test results summary (optional)',
        },
        baseBranch: {
          type: 'string',
          description: 'Base branch for PR (defaults to project main branch)',
        },
      },
      required: ['worktreePath', 'title', 'description', 'planId', 'taskId'],
    },
  },
  {
    name: 'cleanup_worktree',
    description: 'Remove worktree and update database. Removes the worktree directory and marks it as inactive in the database. Does not require worktree to be active.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory to remove',
        },
      },
      required: ['worktreePath'],
    },
  },
];

/**
 * Execute a git operations tool
 */
export async function executeGitOperationsTool(
  toolName: string,
  args: unknown
): Promise<unknown> {
  logger.debug({ toolName, args }, 'Executing git operations tool');

  try {
    switch (toolName) {
      case 'create_worktree': {
        const validated = CreateWorktreeSchema.parse(args);
        return await createWorktree(validated as CreateWorktreeInput);
      }

      case 'create_branch': {
        const validated = CreateBranchSchema.parse(args);
        return await createBranch(validated as CreateBranchInput);
      }

      case 'commit_changes': {
        const validated = CommitChangesSchema.parse(args);
        return await commitChanges(validated as CommitChangesInput);
      }

      case 'create_pull_request': {
        const validated = CreatePullRequestSchema.parse(args);
        return await createPullRequest(validated as CreatePullRequestInput);
      }

      case 'cleanup_worktree': {
        const validated = CleanupWorktreeSchema.parse(args);
        return await cleanupWorktree(validated as CleanupWorktreeInput);
      }

      default:
        throw new AppError(`Unknown git operations tool: ${toolName}`, 400, 'UNKNOWN_TOOL');
    }
  } catch (error) {
    logger.error({ error, toolName }, 'Git operations tool execution failed');

    if (error instanceof AppError) {
      throw error;
    }

    // Re-throw validation errors
    throw error;
  }
}
