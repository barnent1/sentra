/**
 * Code Execution MCP Tools
 *
 * Tools for executing code validation and testing operations in worktree environments.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../middleware/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  ExecuteCommandSchema,
  RunTestsSchema,
  TypeCheckSchema,
  CaptureScreenshotSchema,
} from './schemas/code-execution-schemas.js';
import {
  executeCommand,
  runTests,
  typeCheck,
  captureScreenshot,
} from './executors/code-execution-executor.js';
import type {
  ExecuteCommandInput,
  RunTestsInput,
  TypeCheckInput,
  CaptureScreenshotInput,
} from '../../types/code-execution.js';

/**
 * Code execution tools
 */
export const codeExecutionTools: Tool[] = [
  {
    name: 'execute_command',
    description: 'Execute a whitelisted shell command in a worktree environment. Supports npm, tsc, eslint, playwright, jest, and vitest. Validates worktree exists and is active before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        command: {
          type: 'string',
          enum: ['npm', 'tsc', 'eslint', 'playwright', 'jest', 'vitest'],
          description: 'The command to execute (whitelisted only)',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command arguments (validated to prevent injection)',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 120000, max: 600000)',
        },
        maxBuffer: {
          type: 'number',
          description: 'Maximum buffer size in bytes (default: 10MB, max: 50MB)',
        },
      },
      required: ['worktreePath', 'command', 'args'],
    },
  },
  {
    name: 'run_tests',
    description: 'Execute test suites in a worktree and parse results. Supports Jest with JSON output parsing. Returns detailed test results including pass/fail status and error messages.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        testPattern: {
          type: 'string',
          description: 'Test file pattern to match (optional)',
        },
        testType: {
          type: 'string',
          enum: ['unit', 'integration', 'e2e'],
          description: 'Type of tests to run (optional)',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 240000, max: 600000)',
        },
      },
      required: ['worktreePath'],
    },
  },
  {
    name: 'typecheck',
    description: 'Run TypeScript type-checking with tsc. Parses errors and returns structured error information including file, line, column, and message.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        project: {
          type: 'string',
          description: 'Path to tsconfig.json file (optional)',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 120000, max: 600000)',
        },
      },
      required: ['worktreePath'],
    },
  },
  {
    name: 'capture_screenshot',
    description: 'Capture browser screenshots for E2E testing using Playwright. Stores screenshots in database and returns metadata. Supports viewport configuration and full-page capture.',
    inputSchema: {
      type: 'object',
      properties: {
        worktreePath: {
          type: 'string',
          description: 'Absolute path to the worktree directory (must be an active worktree)',
        },
        url: {
          type: 'string',
          description: 'URL to capture (must be valid URL)',
        },
        screenshotName: {
          type: 'string',
          description: 'Name for the screenshot file (alphanumeric, underscore, dash only)',
        },
        viewport: {
          type: 'object',
          properties: {
            width: {
              type: 'number',
              description: 'Viewport width (320-3840)',
            },
            height: {
              type: 'number',
              description: 'Viewport height (240-2160)',
            },
          },
          description: 'Browser viewport dimensions (optional)',
        },
        fullPage: {
          type: 'boolean',
          description: 'Capture full page (default: false)',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000, max: 600000)',
        },
      },
      required: ['worktreePath', 'url', 'screenshotName'],
    },
  },
];

/**
 * Execute a code execution tool
 */
export async function executeCodeExecutionTool(
  toolName: string,
  args: unknown
): Promise<unknown> {
  logger.debug({ toolName, args }, 'Executing code execution tool');

  try {
    switch (toolName) {
      case 'execute_command': {
        const validated = ExecuteCommandSchema.parse(args);
        return await executeCommand(validated as ExecuteCommandInput);
      }

      case 'run_tests': {
        const validated = RunTestsSchema.parse(args);
        return await runTests(validated as RunTestsInput);
      }

      case 'typecheck': {
        const validated = TypeCheckSchema.parse(args);
        return await typeCheck(validated as TypeCheckInput);
      }

      case 'capture_screenshot': {
        const validated = CaptureScreenshotSchema.parse(args);
        return await captureScreenshot(validated as CaptureScreenshotInput);
      }

      default:
        throw new AppError(`Unknown code execution tool: ${toolName}`, 400, 'UNKNOWN_TOOL');
    }
  } catch (error) {
    logger.error({ error, toolName }, 'Code execution tool execution failed');

    if (error instanceof AppError) {
      throw error;
    }

    // Re-throw validation errors
    throw error;
  }
}
