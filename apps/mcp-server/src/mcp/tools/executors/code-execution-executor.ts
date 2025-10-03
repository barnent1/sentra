/**
 * Code Execution Tool Executors
 *
 * Core business logic for executing code validation and testing operations in worktree environments.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { db } from '../../../../db/index.js';
import { worktrees } from '../../../../db/schema/projects.js';
import { screenshots } from '../../../../db/schema/assets.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../middleware/logger.js';
import type {
  ExecuteCommandInput,
  ExecuteCommandOutput,
  RunTestsInput,
  RunTestsOutput,
  TypeCheckInput,
  TypeCheckOutput,
  CaptureScreenshotInput,
  CaptureScreenshotOutput,
  TypeCheckError,
  TestResult,
} from '../../../types/code-execution.js';

const execFileAsync = promisify(execFile);

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
 * Execute a whitelisted command in a worktree
 */
export async function executeCommand(
  input: ExecuteCommandInput
): Promise<ExecuteCommandOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Executing command');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  try {
    const { stdout, stderr } = await execFileAsync(
      input.command,
      input.args,
      {
        cwd: input.worktreePath,
        timeout: input.timeout || 120000,
        maxBuffer: input.maxBuffer || 10 * 1024 * 1024,
        encoding: 'utf8',
      }
    );

    const output: ExecuteCommandOutput = {
      success: true,
      stdout,
      stderr,
      exitCode: 0,
      command: input.command,
      args: input.args,
      worktreePath: input.worktreePath,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { command: input.command, exitCode: 0, executionTimeMs: output.executionTimeMs },
      'Command executed successfully'
    );

    return output;
  } catch (error) {
    // Handle execution errors
    const exitCode = error && typeof error === 'object' && 'code' in error ? (error.code as number) : 1;
    const stdout = error && typeof error === 'object' && 'stdout' in error ? String(error.stdout) : '';
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';

    logger.warn(
      { command: input.command, exitCode, stderr },
      'Command execution failed'
    );

    const output: ExecuteCommandOutput = {
      success: false,
      stdout,
      stderr,
      exitCode,
      command: input.command,
      args: input.args,
      worktreePath: input.worktreePath,
      executionTimeMs: Date.now() - startTime,
    };

    return output;
  }
}

/**
 * Parse TypeScript compiler errors from output
 */
function parseTypeScriptErrors(output: string): TypeCheckError[] {
  const errors: TypeCheckError[] = [];

  // Match TypeScript error format: file.ts(line,column): error TS####: message
  const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)$/gm;

  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      severity: match[4] as 'error' | 'warning',
      message: match[5],
    });
  }

  return errors;
}

/**
 * Run TypeScript type checking
 */
export async function typeCheck(
  input: TypeCheckInput
): Promise<TypeCheckOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Running type check');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  const args = ['--noEmit'];
  if (input.project) {
    args.push('--project', input.project);
  }

  try {
    const { stdout, stderr } = await execFileAsync('tsc', args, {
      cwd: input.worktreePath,
      timeout: input.timeout || 120000,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
    });

    const output: TypeCheckOutput = {
      success: true,
      errors: [],
      errorCount: 0,
      warningCount: 0,
      stdout,
      stderr,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info({ executionTimeMs: output.executionTimeMs }, 'Type check passed');
    return output;
  } catch (error) {
    const stdout = error && typeof error === 'object' && 'stdout' in error ? String(error.stdout) : '';
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';

    // Parse errors from output
    const errors = parseTypeScriptErrors(stdout + '\n' + stderr);
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;

    logger.warn(
      { errorCount, warningCount },
      'Type check failed'
    );

    const output: TypeCheckOutput = {
      success: false,
      errors,
      errorCount,
      warningCount,
      stdout,
      stderr,
      executionTimeMs: Date.now() - startTime,
    };

    return output;
  }
}

/**
 * Parse Jest test results from JSON output
 */
function parseJestResults(jsonOutput: string): TestResult[] {
  try {
    const results: TestResult[] = [];
    const parsed = JSON.parse(jsonOutput);

    if (parsed.testResults && Array.isArray(parsed.testResults)) {
      for (const suite of parsed.testResults) {
        const testSuite = suite.name || 'unknown';

        if (suite.assertionResults && Array.isArray(suite.assertionResults)) {
          for (const test of suite.assertionResults) {
            results.push({
              testSuite,
              testName: test.title || test.fullName || 'unknown',
              status: test.status === 'passed' ? 'passed' : test.status === 'pending' ? 'skipped' : 'failed',
              duration: test.duration || 0,
              errorMessage: test.failureMessages && test.failureMessages.length > 0
                ? test.failureMessages.join('\n')
                : undefined,
            });
          }
        }
      }
    }

    return results;
  } catch (error) {
    logger.warn({ error }, 'Failed to parse Jest JSON output');
    return [];
  }
}

/**
 * Run tests in a worktree
 */
export async function runTests(
  input: RunTestsInput
): Promise<RunTestsOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Running tests');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  // Build test command based on test type
  const args = ['test'];

  if (input.testPattern) {
    args.push(input.testPattern);
  }

  // Add JSON reporter for parsing
  args.push('--json', '--outputFile=test-results.json');

  // Add test type specific args
  if (input.testType === 'e2e') {
    args.push('--testPathPattern=e2e');
  } else if (input.testType === 'integration') {
    args.push('--testPathPattern=integration');
  } else if (input.testType === 'unit') {
    args.push('--testPathPattern=unit');
  }

  try {
    const { stdout, stderr } = await execFileAsync('npm', args, {
      cwd: input.worktreePath,
      timeout: input.timeout || 240000, // 4 minutes default
      maxBuffer: 50 * 1024 * 1024, // 50MB for test output
      encoding: 'utf8',
    });

    // Try to read JSON results
    const jsonPath = join(input.worktreePath, 'test-results.json');
    let results: TestResult[] = [];

    try {
      const { readFile } = await import('fs/promises');
      const jsonContent = await readFile(jsonPath, 'utf8');
      results = parseJestResults(jsonContent);
    } catch (error) {
      logger.warn({ error }, 'Could not read test results JSON');
    }

    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;

    const output: RunTestsOutput = {
      success: true,
      totalTests: results.length,
      passedTests,
      failedTests,
      skippedTests,
      results,
      stdout,
      stderr,
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { totalTests: output.totalTests, passedTests, failedTests, executionTimeMs: output.executionTimeMs },
      'Tests completed successfully'
    );

    return output;
  } catch (error) {
    const stdout = error && typeof error === 'object' && 'stdout' in error ? String(error.stdout) : '';
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';

    // Try to parse results even on failure
    const jsonPath = join(input.worktreePath, 'test-results.json');
    let results: TestResult[] = [];

    try {
      const { readFile } = await import('fs/promises');
      const jsonContent = await readFile(jsonPath, 'utf8');
      results = parseJestResults(jsonContent);
    } catch (readError) {
      logger.warn({ error: readError }, 'Could not read test results JSON after failure');
    }

    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;

    logger.warn(
      { totalTests: results.length, passedTests, failedTests },
      'Tests failed'
    );

    const output: RunTestsOutput = {
      success: false,
      totalTests: results.length,
      passedTests,
      failedTests,
      skippedTests,
      results,
      stdout,
      stderr,
      executionTimeMs: Date.now() - startTime,
    };

    return output;
  }
}

/**
 * Capture a screenshot for E2E testing
 */
export async function captureScreenshot(
  input: CaptureScreenshotInput
): Promise<CaptureScreenshotOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Capturing screenshot');

  // Validate worktree
  await validateWorktree(input.worktreePath);

  // Get worktree info to find project ID
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

  // Create screenshots directory
  const screenshotsDir = join(input.worktreePath, 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });

  const fileName = `${input.screenshotName}.png`;
  const filePath = join(screenshotsDir, fileName);

  // Build Playwright screenshot command
  const playwrightScript = `
    const { chromium } = require('playwright');

    (async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext(${input.viewport ? `{
        viewport: { width: ${input.viewport.width}, height: ${input.viewport.height} }
      }` : ''});
      const page = await context.newPage();

      await page.goto('${input.url}', { timeout: ${input.timeout || 30000} });
      await page.screenshot({
        path: '${filePath}',
        fullPage: ${input.fullPage || false}
      });

      await browser.close();
      console.log('Screenshot captured: ${filePath}');
    })();
  `;

  const scriptPath = join(input.worktreePath, 'screenshot-script.js');
  await writeFile(scriptPath, playwrightScript, 'utf8');

  try {
    await execFileAsync('node', [scriptPath], {
      cwd: input.worktreePath,
      timeout: (input.timeout || 30000) + 10000, // Add 10s buffer
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
    });

    // Get file size
    const { stat } = await import('fs/promises');
    const stats = await stat(filePath);

    // Store screenshot in database
    // Note: uploadedBy should come from authentication context
    // For now, using a placeholder value of 1
    const [screenshot] = await db
      .insert(screenshots)
      .values({
        projectId,
        filePath,
        fileName,
        mimeType: 'image/png',
        fileSize: stats.size,
        uploadedBy: 1, // TODO: Get from auth context
        metadata: JSON.stringify({
          url: input.url,
          viewport: input.viewport,
          fullPage: input.fullPage,
        }),
      })
      .returning();

    const output: CaptureScreenshotOutput = {
      success: true,
      screenshot: {
        id: screenshot.id,
        path: filePath,
        url: input.url,
        createdAt: screenshot.createdAt.toISOString(),
      },
      executionTimeMs: Date.now() - startTime,
    };

    logger.info(
      { screenshotId: screenshot.id, executionTimeMs: output.executionTimeMs },
      'Screenshot captured successfully'
    );

    return output;
  } catch (error) {
    logger.error({ error, input }, 'Screenshot capture failed');
    throw new AppError(
      'Failed to capture screenshot',
      500,
      'SCREENSHOT_CAPTURE_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
