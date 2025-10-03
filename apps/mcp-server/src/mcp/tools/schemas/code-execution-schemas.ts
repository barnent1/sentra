/**
 * Code Execution Validation Schemas
 *
 * Zod schemas for validating code execution tool inputs.
 */

import { z } from 'zod';

// Whitelist of allowed commands
export const WhitelistedCommandSchema = z.enum(['npm', 'tsc', 'eslint', 'playwright', 'jest', 'vitest']);

// Timeout constraints (milliseconds)
const MIN_TIMEOUT = 1000; // 1 second
const MAX_TIMEOUT = 600000; // 10 minutes
const DEFAULT_TIMEOUT = 120000; // 2 minutes

// Buffer size constraints (bytes)
const MIN_BUFFER = 1024 * 1024; // 1MB
const MAX_BUFFER = 50 * 1024 * 1024; // 50MB
const DEFAULT_BUFFER = 10 * 1024 * 1024; // 10MB

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

// Command arguments - prevent injection
const CommandArgsSchema = z.array(z.string()).refine(
  (args) => {
    // Check for shell metacharacters in arguments
    const dangerousChars = /[;&|`$(){}[\]<>\\]/;
    return !args.some(arg => dangerousChars.test(arg));
  },
  { message: 'Arguments contain potentially dangerous shell metacharacters' }
);

export const ExecuteCommandSchema = z.object({
  worktreePath: WorktreePathSchema,
  command: WhitelistedCommandSchema,
  args: CommandArgsSchema,
  timeout: z.number().int().min(MIN_TIMEOUT).max(MAX_TIMEOUT).optional().default(DEFAULT_TIMEOUT),
  maxBuffer: z.number().int().min(MIN_BUFFER).max(MAX_BUFFER).optional().default(DEFAULT_BUFFER),
});

export const RunTestsSchema = z.object({
  worktreePath: WorktreePathSchema,
  testPattern: z.string().optional(),
  testType: z.enum(['unit', 'integration', 'e2e']).optional(),
  timeout: z.number().int().min(MIN_TIMEOUT).max(MAX_TIMEOUT).optional().default(DEFAULT_TIMEOUT * 2), // 4 minutes default for tests
});

export const TypeCheckSchema = z.object({
  worktreePath: WorktreePathSchema,
  project: z.string().optional(),
  timeout: z.number().int().min(MIN_TIMEOUT).max(MAX_TIMEOUT).optional().default(DEFAULT_TIMEOUT),
});

export const CaptureScreenshotSchema = z.object({
  worktreePath: WorktreePathSchema,
  url: z.string().url(),
  screenshotName: z.string().min(1).max(255).refine(
    (name) => {
      // Only allow safe filename characters
      const safeFilename = /^[a-zA-Z0-9_-]+$/;
      return safeFilename.test(name);
    },
    { message: 'Screenshot name must only contain alphanumeric, underscore, and dash characters' }
  ),
  viewport: z.object({
    width: z.number().int().min(320).max(3840),
    height: z.number().int().min(240).max(2160),
  }).optional(),
  fullPage: z.boolean().optional().default(false),
  timeout: z.number().int().min(MIN_TIMEOUT).max(MAX_TIMEOUT).optional().default(30000), // 30 seconds for screenshots
});
