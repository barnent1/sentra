/**
 * Code Execution Types
 *
 * Type definitions for code execution and validation operations in worktree environments.
 */

export type WhitelistedCommand = 'npm' | 'tsc' | 'eslint' | 'playwright' | 'jest' | 'vitest';

export interface CommandExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

export interface TypeCheckError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface TestResult {
  testSuite: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorMessage?: string;
}

export interface ScreenshotResult {
  id: number;
  path: string;
  url: string;
  createdAt: string;
}

// Tool Input Types
export interface ExecuteCommandInput {
  worktreePath: string;
  command: WhitelistedCommand;
  args: string[];
  timeout?: number;
  maxBuffer?: number;
}

export interface ExecuteCommandOutput extends CommandExecutionResult {
  command: string;
  args: string[];
  worktreePath: string;
}

export interface RunTestsInput {
  worktreePath: string;
  testPattern?: string;
  testType?: 'unit' | 'integration' | 'e2e';
  timeout?: number;
}

export interface RunTestsOutput {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  results: TestResult[];
  executionTimeMs: number;
  stdout: string;
  stderr: string;
}

export interface TypeCheckInput {
  worktreePath: string;
  project?: string;
  timeout?: number;
}

export interface TypeCheckOutput {
  success: boolean;
  errors: TypeCheckError[];
  errorCount: number;
  warningCount: number;
  executionTimeMs: number;
  stdout: string;
  stderr: string;
}

export interface CaptureScreenshotInput {
  worktreePath: string;
  url: string;
  screenshotName: string;
  viewport?: {
    width: number;
    height: number;
  };
  fullPage?: boolean;
  timeout?: number;
}

export interface CaptureScreenshotOutput {
  success: boolean;
  screenshot: ScreenshotResult;
  executionTimeMs: number;
}
