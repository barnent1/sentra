/**
 * Git Operations Validation Schemas
 *
 * Zod schemas for validating git operation tool inputs.
 */

import { z } from 'zod';

// Path validation - prevent path traversal
const WorktreePathSchema = z.string().min(1).refine(
  (path) => {
    // Must be absolute path
    if (!path.startsWith('/')) return false;
    // No path traversal patterns
    if (path.includes('..')) return false;
    // No null bytes
    if (path.includes('\0')) return false;
    return true;
  },
  { message: 'Invalid worktree path: must be absolute and contain no path traversal' }
);

// Branch name validation - prevent command injection
const BranchNameSchema = z.string().min(1).max(255).refine(
  (name) => {
    // Only allow alphanumeric, dash, underscore, and slash
    const safeBranchName = /^[a-zA-Z0-9_/-]+$/;
    return safeBranchName.test(name);
  },
  { message: 'Branch name must only contain alphanumeric, dash, underscore, and slash characters' }
);

// Commit message components validation
const CommitPhaseSchema = z.string().min(1).max(200).refine(
  (phase) => {
    // Prevent shell metacharacters
    const dangerousChars = /[;&|`$(){}[\]<>\\]/;
    return !dangerousChars.test(phase);
  },
  { message: 'Phase contains potentially dangerous characters' }
);

const CommitDescriptionSchema = z.string().min(1).max(1000).refine(
  (desc) => {
    // Prevent shell metacharacters
    const dangerousChars = /[;&|`$(){}[\]<>\\]/;
    return !dangerousChars.test(desc);
  },
  { message: 'Description contains potentially dangerous characters' }
);

const CommitTypeSchema = z.enum(['chore', 'bug', 'feature']);

const TaskIdSchema = z.string().min(1).max(50).refine(
  (id) => {
    // Only allow alphanumeric, dash, and underscore
    const safeId = /^[a-zA-Z0-9_-]+$/;
    return safeId.test(id);
  },
  { message: 'Task ID must only contain alphanumeric, dash, and underscore characters' }
);

const AdwIdSchema = z.string().min(1).max(50).refine(
  (id) => {
    // Only allow alphanumeric, dash, and underscore
    const safeId = /^[a-zA-Z0-9_-]+$/;
    return safeId.test(id);
  },
  { message: 'ADW ID must only contain alphanumeric, dash, and underscore characters' }
);

const PlanIdSchema = z.string().min(1).max(50).refine(
  (id) => {
    // Only allow alphanumeric, dash, and underscore
    const safeId = /^[a-zA-Z0-9_-]+$/;
    return safeId.test(id);
  },
  { message: 'Plan ID must only contain alphanumeric, dash, and underscore characters' }
);

// PR title validation
const PrTitleSchema = z.string().min(1).max(200).refine(
  (title) => {
    // Prevent shell metacharacters
    const dangerousChars = /[;&|`$(){}[\]<>\\]/;
    return !dangerousChars.test(title);
  },
  { message: 'PR title contains potentially dangerous characters' }
);

// PR description validation
const PrDescriptionSchema = z.string().min(1).max(5000).refine(
  (desc) => {
    // Prevent shell metacharacters
    const dangerousChars = /[;&|`$(){}[\]<>\\]/;
    return !dangerousChars.test(desc);
  },
  { message: 'PR description contains potentially dangerous characters' }
);

export const CreateWorktreeSchema = z.object({
  projectId: z.number().int().positive(),
  worktreePath: WorktreePathSchema,
  branch: BranchNameSchema,
  baseBranch: BranchNameSchema.optional(),
});

export const CreateBranchSchema = z.object({
  worktreePath: WorktreePathSchema,
  branchName: BranchNameSchema,
  baseBranch: BranchNameSchema.optional(),
});

export const CommitChangesSchema = z.object({
  worktreePath: WorktreePathSchema,
  phase: CommitPhaseSchema,
  description: CommitDescriptionSchema,
  type: CommitTypeSchema,
  taskId: TaskIdSchema,
  adwId: AdwIdSchema,
});

export const CreatePullRequestSchema = z.object({
  worktreePath: WorktreePathSchema,
  title: PrTitleSchema,
  description: PrDescriptionSchema,
  planId: PlanIdSchema,
  taskId: TaskIdSchema,
  screenshotIds: z.array(z.number().int().positive()).optional(),
  testResults: z.object({
    unitTests: z.object({
      passed: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
    integrationTests: z.object({
      passed: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
    e2eTests: z.object({
      passed: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
    coverage: z.number().min(0).max(100),
  }).optional(),
  baseBranch: BranchNameSchema.optional(),
});

export const CleanupWorktreeSchema = z.object({
  worktreePath: WorktreePathSchema,
});
