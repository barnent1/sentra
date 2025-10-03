/**
 * Unit Tests: Git Operations
 *
 * Tests for git operations validation schemas, path traversal prevention,
 * branch name sanitization, and shell metacharacter prevention.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';
import {
  CreateWorktreeSchema,
  CreateBranchSchema,
  CommitChangesSchema,
  CreatePullRequestSchema,
  CleanupWorktreeSchema,
} from '../../src/mcp/tools/schemas/git-operations-schemas.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Mock execFile for testing
jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

describe('Git Operations - Validation Schemas', () => {
  describe('WorktreePath Validation', () => {
    describe('CreateWorktreeSchema - worktreePath', () => {
      it('should accept valid absolute paths', () => {
        const validInput = {
          projectId: 1,
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'feature/task-1',
        };

        const result = CreateWorktreeSchema.parse(validInput);
        expect(result.worktreePath).toBe('/home/user/worktrees/task-1');
      });

      it('should reject relative paths', () => {
        const invalidInput = {
          projectId: 1,
          worktreePath: 'relative/path',
          branch: 'feature/task-1',
        };

        expect(() => CreateWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
      });

      it('should reject paths with path traversal (..) patterns', () => {
        const invalidInputs = [
          {
            projectId: 1,
            worktreePath: '/home/user/../../../etc/passwd',
            branch: 'feature/task-1',
          },
          {
            projectId: 1,
            worktreePath: '/home/user/worktrees/../../../root',
            branch: 'feature/task-1',
          },
          {
            projectId: 1,
            worktreePath: '/home/user/..worktrees',
            branch: 'feature/task-1',
          },
        ];

        invalidInputs.forEach((input) => {
          expect(() => CreateWorktreeSchema.parse(input)).toThrow(z.ZodError);
        });
      });

      it('should reject paths with null bytes', () => {
        const invalidInput = {
          projectId: 1,
          worktreePath: '/home/user/worktrees\0/malicious',
          branch: 'feature/task-1',
        };

        expect(() => CreateWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
      });

      it('should reject empty paths', () => {
        const invalidInput = {
          projectId: 1,
          worktreePath: '',
          branch: 'feature/task-1',
        };

        expect(() => CreateWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
      });
    });

    describe('CreateBranchSchema - worktreePath', () => {
      it('should accept valid absolute paths', () => {
        const validInput = {
          worktreePath: '/home/user/worktrees/task-1',
          branchName: 'feature/new-feature',
        };

        const result = CreateBranchSchema.parse(validInput);
        expect(result.worktreePath).toBe('/home/user/worktrees/task-1');
      });

      it('should reject relative paths', () => {
        const invalidInput = {
          worktreePath: './worktree',
          branchName: 'feature/test',
        };

        expect(() => CreateBranchSchema.parse(invalidInput)).toThrow(z.ZodError);
      });
    });
  });

  describe('Branch Name Validation', () => {
    it('should accept valid branch names', () => {
      const validBranchNames = [
        'feature/task-1',
        'bugfix/issue-123',
        'main',
        'develop',
        'release/v1-0-0',
        'feature_branch',
        'FEATURE-BRANCH',
        'user/john/feature',
        'feature-123_test',
      ];

      validBranchNames.forEach((branchName) => {
        const input = {
          projectId: 1,
          worktreePath: '/home/user/worktrees/task-1',
          branch: branchName,
        };

        const result = CreateWorktreeSchema.parse(input);
        expect(result.branch).toBe(branchName);
      });
    });

    it('should reject branch names with shell metacharacters', () => {
      const invalidBranchNames = [
        'feature;rm -rf /',
        'feature|dangerous',
        'feature`whoami`',
        'feature$PWD',
        'feature(test)',
        'feature{test}',
        'feature[test]',
        'feature<test>',
        'feature\\test',
        'feature&test',
      ];

      invalidBranchNames.forEach((branchName) => {
        const input = {
          projectId: 1,
          worktreePath: '/home/user/worktrees/task-1',
          branch: branchName,
        };

        expect(() => CreateWorktreeSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject branch names with spaces', () => {
      const invalidInput = {
        projectId: 1,
        worktreePath: '/home/user/worktrees/task-1',
        branch: 'feature branch',
      };

      expect(() => CreateWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject branch names with dots (periods)', () => {
      const invalidInputs = [
        {
          projectId: 1,
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'feature.branch',
        },
        {
          projectId: 1,
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'release/v1.0.0',
        },
      ];

      invalidInputs.forEach((input) => {
        expect(() => CreateWorktreeSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject empty branch names', () => {
      const invalidInput = {
        projectId: 1,
        worktreePath: '/home/user/worktrees/task-1',
        branch: '',
      };

      expect(() => CreateWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject branch names longer than 255 characters', () => {
      const invalidInput = {
        projectId: 1,
        worktreePath: '/home/user/worktrees/task-1',
        branch: 'a'.repeat(256),
      };

      expect(() => CreateWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('CreateWorktreeSchema', () => {
    it('should accept valid input with required fields', () => {
      const validInput = {
        projectId: 1,
        worktreePath: '/home/user/worktrees/task-1',
        branch: 'feature/task-1',
      };

      const result = CreateWorktreeSchema.parse(validInput);
      expect(result.projectId).toBe(1);
      expect(result.worktreePath).toBe('/home/user/worktrees/task-1');
      expect(result.branch).toBe('feature/task-1');
      expect(result.baseBranch).toBeUndefined();
    });

    it('should accept valid input with optional baseBranch', () => {
      const validInput = {
        projectId: 1,
        worktreePath: '/home/user/worktrees/task-1',
        branch: 'feature/task-1',
        baseBranch: 'main',
      };

      const result = CreateWorktreeSchema.parse(validInput);
      expect(result.baseBranch).toBe('main');
    });

    it('should reject non-positive project IDs', () => {
      expect(() =>
        CreateWorktreeSchema.parse({
          projectId: 0,
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'feature/task-1',
        })
      ).toThrow(z.ZodError);

      expect(() =>
        CreateWorktreeSchema.parse({
          projectId: -1,
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'feature/task-1',
        })
      ).toThrow(z.ZodError);
    });

    it('should reject non-integer project IDs', () => {
      expect(() =>
        CreateWorktreeSchema.parse({
          projectId: 1.5,
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'feature/task-1',
        })
      ).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      expect(() =>
        CreateWorktreeSchema.parse({
          projectId: 1,
          worktreePath: '/home/user/worktrees/task-1',
        })
      ).toThrow(z.ZodError);

      expect(() =>
        CreateWorktreeSchema.parse({
          projectId: 1,
          branch: 'feature/task-1',
        })
      ).toThrow(z.ZodError);

      expect(() =>
        CreateWorktreeSchema.parse({
          worktreePath: '/home/user/worktrees/task-1',
          branch: 'feature/task-1',
        })
      ).toThrow(z.ZodError);
    });
  });

  describe('CreateBranchSchema', () => {
    it('should accept valid input with required fields', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        branchName: 'feature/new-branch',
      };

      const result = CreateBranchSchema.parse(validInput);
      expect(result.worktreePath).toBe('/home/user/worktrees/task-1');
      expect(result.branchName).toBe('feature/new-branch');
      expect(result.baseBranch).toBeUndefined();
    });

    it('should accept valid input with optional baseBranch', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        branchName: 'feature/new-branch',
        baseBranch: 'develop',
      };

      const result = CreateBranchSchema.parse(validInput);
      expect(result.baseBranch).toBe('develop');
    });

    it('should reject missing required fields', () => {
      expect(() =>
        CreateBranchSchema.parse({
          worktreePath: '/home/user/worktrees/task-1',
        })
      ).toThrow(z.ZodError);

      expect(() =>
        CreateBranchSchema.parse({
          branchName: 'feature/new-branch',
        })
      ).toThrow(z.ZodError);
    });
  });

  describe('CommitChangesSchema - Shell Metacharacter Prevention', () => {
    it('should accept valid commit input', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        phase: 'implement feature',
        description: 'Add new user authentication flow',
        type: 'feature' as const,
        taskId: 'task-123',
        adwId: 'adw-456',
      };

      const result = CommitChangesSchema.parse(validInput);
      expect(result.phase).toBe('implement feature');
      expect(result.description).toBe('Add new user authentication flow');
      expect(result.type).toBe('feature');
    });

    it('should accept all valid commit types', () => {
      const types: Array<'chore' | 'bug' | 'feature'> = ['chore', 'bug', 'feature'];

      types.forEach((type) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          phase: 'test phase',
          description: 'test description',
          type,
          taskId: 'task-1',
          adwId: 'adw-1',
        };

        const result = CommitChangesSchema.parse(input);
        expect(result.type).toBe(type);
      });
    });

    it('should reject invalid commit types', () => {
      const invalidInput = {
        worktreePath: '/home/user/worktrees/task-1',
        phase: 'test phase',
        description: 'test description',
        type: 'invalid',
        taskId: 'task-1',
        adwId: 'adw-1',
      };

      expect(() => CommitChangesSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject phase with shell metacharacters', () => {
      const dangerousPhases = [
        'implement; rm -rf /',
        'implement | cat /etc/passwd',
        'implement `whoami`',
        'implement $PWD',
        'implement (test)',
        'implement {test}',
        'implement [test]',
        'implement <test>',
        'implement \\test',
      ];

      dangerousPhases.forEach((phase) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          phase,
          description: 'valid description',
          type: 'feature' as const,
          taskId: 'task-1',
          adwId: 'adw-1',
        };

        expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject description with shell metacharacters', () => {
      const dangerousDescriptions = [
        'Add feature; rm -rf /',
        'Add feature | malicious',
        'Add feature `whoami`',
        'Add feature $HOME',
        'Add feature (injection)',
        'Add feature {test}',
        'Add feature [array]',
        'Add feature <script>',
        'Add feature \\escape',
      ];

      dangerousDescriptions.forEach((description) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          phase: 'valid phase',
          description,
          type: 'feature' as const,
          taskId: 'task-1',
          adwId: 'adw-1',
        };

        expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject taskId with invalid characters', () => {
      const invalidTaskIds = [
        'task;123',
        'task|123',
        'task`123',
        'task$123',
        'task.123',
        'task 123',
        'task/123',
      ];

      invalidTaskIds.forEach((taskId) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          phase: 'valid phase',
          description: 'valid description',
          type: 'feature' as const,
          taskId,
          adwId: 'adw-1',
        };

        expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should accept taskId with valid characters', () => {
      const validTaskIds = ['task-123', 'task_456', 'TASK-789', 'task123', 'T-1'];

      validTaskIds.forEach((taskId) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          phase: 'valid phase',
          description: 'valid description',
          type: 'feature' as const,
          taskId,
          adwId: 'adw-1',
        };

        const result = CommitChangesSchema.parse(input);
        expect(result.taskId).toBe(taskId);
      });
    });

    it('should reject adwId with invalid characters', () => {
      const invalidAdwIds = [
        'adw;123',
        'adw|123',
        'adw`123',
        'adw$123',
        'adw.123',
        'adw 123',
      ];

      invalidAdwIds.forEach((adwId) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          phase: 'valid phase',
          description: 'valid description',
          type: 'feature' as const,
          taskId: 'task-1',
          adwId,
        };

        expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject phase longer than 200 characters', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        phase: 'a'.repeat(201),
        description: 'valid description',
        type: 'feature' as const,
        taskId: 'task-1',
        adwId: 'adw-1',
      };

      expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject description longer than 1000 characters', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        phase: 'valid phase',
        description: 'a'.repeat(1001),
        type: 'feature' as const,
        taskId: 'task-1',
        adwId: 'adw-1',
      };

      expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required fields', () => {
      const requiredFields = [
        'worktreePath',
        'phase',
        'description',
        'type',
        'taskId',
        'adwId',
      ];

      requiredFields.forEach((fieldToOmit) => {
        const input: any = {
          worktreePath: '/home/user/worktrees/task-1',
          phase: 'valid phase',
          description: 'valid description',
          type: 'feature',
          taskId: 'task-1',
          adwId: 'adw-1',
        };

        delete input[fieldToOmit];

        expect(() => CommitChangesSchema.parse(input)).toThrow(z.ZodError);
      });
    });
  });

  describe('CreatePullRequestSchema', () => {
    it('should accept valid input with required fields', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'Add new feature',
        description: 'This PR adds a new authentication feature',
        planId: 'plan-123',
        taskId: 'task-456',
      };

      const result = CreatePullRequestSchema.parse(validInput);
      expect(result.title).toBe('Add new feature');
      expect(result.description).toBe('This PR adds a new authentication feature');
      expect(result.planId).toBe('plan-123');
      expect(result.taskId).toBe('task-456');
    });

    it('should accept valid input with optional fields', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'Add new feature',
        description: 'This PR adds a new authentication feature',
        planId: 'plan-123',
        taskId: 'task-456',
        screenshotIds: [1, 2, 3],
        testResults: {
          unitTests: { passed: 50, total: 50 },
          integrationTests: { passed: 20, total: 20 },
          e2eTests: { passed: 10, total: 10 },
          coverage: 85.5,
        },
        baseBranch: 'main',
      };

      const result = CreatePullRequestSchema.parse(validInput);
      expect(result.screenshotIds).toEqual([1, 2, 3]);
      expect(result.testResults?.unitTests.passed).toBe(50);
      expect(result.testResults?.coverage).toBe(85.5);
      expect(result.baseBranch).toBe('main');
    });

    it('should reject PR title with shell metacharacters', () => {
      const dangerousTitles = [
        'Feature; rm -rf /',
        'Feature | malicious',
        'Feature `whoami`',
        'Feature $HOME',
        'Feature (test)',
      ];

      dangerousTitles.forEach((title) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          title,
          description: 'valid description',
          planId: 'plan-1',
          taskId: 'task-1',
        };

        expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject PR description with shell metacharacters', () => {
      const dangerousDescriptions = [
        'Description; rm -rf /',
        'Description | malicious',
        'Description `whoami`',
        'Description $HOME',
      ];

      dangerousDescriptions.forEach((description) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          title: 'valid title',
          description,
          planId: 'plan-1',
          taskId: 'task-1',
        };

        expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject planId with invalid characters', () => {
      const invalidPlanIds = ['plan;123', 'plan|123', 'plan.123', 'plan 123'];

      invalidPlanIds.forEach((planId) => {
        const input = {
          worktreePath: '/home/user/worktrees/task-1',
          title: 'valid title',
          description: 'valid description',
          planId,
          taskId: 'task-1',
        };

        expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
      });
    });

    it('should reject negative test counts', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'valid title',
        description: 'valid description',
        planId: 'plan-1',
        taskId: 'task-1',
        testResults: {
          unitTests: { passed: -1, total: 50 },
          integrationTests: { passed: 20, total: 20 },
          e2eTests: { passed: 10, total: 10 },
          coverage: 85,
        },
      };

      expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject coverage outside 0-100 range', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'valid title',
        description: 'valid description',
        planId: 'plan-1',
        taskId: 'task-1',
        testResults: {
          unitTests: { passed: 50, total: 50 },
          integrationTests: { passed: 20, total: 20 },
          e2eTests: { passed: 10, total: 10 },
          coverage: 101,
        },
      };

      expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject negative screenshot IDs', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'valid title',
        description: 'valid description',
        planId: 'plan-1',
        taskId: 'task-1',
        screenshotIds: [1, -2, 3],
      };

      expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject title longer than 200 characters', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'a'.repeat(201),
        description: 'valid description',
        planId: 'plan-1',
        taskId: 'task-1',
      };

      expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject description longer than 5000 characters', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'valid title',
        description: 'a'.repeat(5001),
        planId: 'plan-1',
        taskId: 'task-1',
      };

      expect(() => CreatePullRequestSchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('CleanupWorktreeSchema', () => {
    it('should accept valid input', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
      };

      const result = CleanupWorktreeSchema.parse(validInput);
      expect(result.worktreePath).toBe('/home/user/worktrees/task-1');
    });

    it('should reject relative paths', () => {
      const invalidInput = {
        worktreePath: 'relative/path',
      };

      expect(() => CleanupWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject paths with path traversal', () => {
      const invalidInput = {
        worktreePath: '/home/user/../../../etc',
      };

      expect(() => CleanupWorktreeSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject missing worktreePath', () => {
      expect(() => CleanupWorktreeSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe('Commit Message Format Validation', () => {
    it('should validate orchestrator.md commit message format structure', () => {
      // Expected format:
      // Phase: Description
      //
      // Type: chore|bug|feature
      // Task ID: task-id
      // ADW ID: adw-id
      //
      // 🤖 Generated with Claude Code
      // Co-Authored-By: Claude <noreply@anthropic.com>

      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        phase: 'implement authentication',
        description: 'Add JWT token validation',
        type: 'feature' as const,
        taskId: 'task-2-6',
        adwId: 'adw-001',
      };

      const result = CommitChangesSchema.parse(validInput);

      // Verify all components are present and valid
      expect(result.phase).toBe('implement authentication');
      expect(result.description).toBe('Add JWT token validation');
      expect(result.type).toBe('feature');
      expect(result.taskId).toBe('task-2-6');
      expect(result.adwId).toBe('adw-001');
    });

    it('should accept hyphens and underscores in task and ADW IDs', () => {
      const input = {
        worktreePath: '/home/user/worktrees/task-1',
        phase: 'test phase',
        description: 'test description',
        type: 'chore' as const,
        taskId: 'task-2_6-test',
        adwId: 'adw-001_test',
      };

      const result = CommitChangesSchema.parse(input);
      expect(result.taskId).toBe('task-2_6-test');
      expect(result.adwId).toBe('adw-001_test');
    });
  });

  describe('PR Body Format Validation', () => {
    it('should validate all required PR body components are present', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'Add authentication feature',
        description: 'Implements JWT-based authentication system',
        planId: 'plan-123',
        taskId: 'task-456',
      };

      const result = CreatePullRequestSchema.parse(validInput);

      // Verify required components for PR body
      expect(result.title).toBeTruthy();
      expect(result.description).toBeTruthy();
      expect(result.planId).toBeTruthy();
      expect(result.taskId).toBeTruthy();
    });

    it('should validate optional PR components', () => {
      const validInput = {
        worktreePath: '/home/user/worktrees/task-1',
        title: 'Add authentication feature',
        description: 'Implements JWT-based authentication system',
        planId: 'plan-123',
        taskId: 'task-456',
        screenshotIds: [1, 2, 3],
        testResults: {
          unitTests: { passed: 100, total: 100 },
          integrationTests: { passed: 50, total: 50 },
          e2eTests: { passed: 20, total: 20 },
          coverage: 95.5,
        },
      };

      const result = CreatePullRequestSchema.parse(validInput);

      expect(result.screenshotIds).toHaveLength(3);
      expect(result.testResults).toBeDefined();
      expect(result.testResults?.unitTests.passed).toBe(100);
      expect(result.testResults?.coverage).toBe(95.5);
    });
  });
});
