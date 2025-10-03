/**
 * Git Operations Types
 *
 * Type definitions for git operations in worktree environments.
 */

export interface GitOperationResult {
  success: boolean;
  message: string;
  executionTimeMs: number;
}

export interface WorktreeInfo {
  id: number;
  path: string;
  branch: string;
  projectId: number;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface PullRequestInfo {
  number: number;
  url: string;
  title: string;
  state: string;
}

// Tool Input Types
export interface CreateWorktreeInput {
  projectId: number;
  worktreePath: string;
  branch: string;
  baseBranch?: string;
}

export interface CreateWorktreeOutput extends GitOperationResult {
  worktree: WorktreeInfo;
}

export interface CreateBranchInput {
  worktreePath: string;
  branchName: string;
  baseBranch?: string;
}

export interface CreateBranchOutput extends GitOperationResult {
  branch: string;
  baseBranch: string;
}

export interface CommitChangesInput {
  worktreePath: string;
  phase: string;
  description: string;
  type: 'chore' | 'bug' | 'feature';
  taskId: string;
  adwId: string;
}

export interface CommitChangesOutput extends GitOperationResult {
  commit: CommitInfo;
  filesChanged: number;
}

export interface CreatePullRequestInput {
  worktreePath: string;
  title: string;
  description: string;
  planId: string;
  taskId: string;
  screenshotIds?: number[];
  testResults?: {
    unitTests: { passed: number; total: number };
    integrationTests: { passed: number; total: number };
    e2eTests: { passed: number; total: number };
    coverage: number;
  };
  baseBranch?: string;
}

export interface CreatePullRequestOutput extends GitOperationResult {
  pullRequest: PullRequestInfo;
}

export interface CleanupWorktreeInput {
  worktreePath: string;
}

export interface CleanupWorktreeOutput extends GitOperationResult {
  removedPath: string;
}
