/**
 * Pattern Learning MCP Tools
 *
 * Tools for learning from existing code patterns and documentation.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../middleware/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  FindSimilarImplementationsSchema,
  GetRelevantDocsSchema,
  SearchByPatternSchema,
} from './schemas/pattern-learning-schemas.js';
import {
  findSimilarImplementations,
  getRelevantDocs,
  searchByPattern,
} from './executors/pattern-learning-executor.js';
import type {
  FindSimilarImplementationsInput,
  GetRelevantDocsInput,
  SearchByPatternInput,
} from '../../types/pattern-learning.js';

/**
 * Pattern learning tools
 */
export const patternLearningTools: Tool[] = [
  {
    name: 'find_similar_implementations',
    description: 'Search codebase for similar implementations using grep-based pattern matching. Returns code snippets with file paths, line numbers, and relevance scores. Useful for finding existing patterns, examples, or similar code structures.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search pattern or code snippet to find (supports regex)',
        },
        filePattern: {
          type: 'string',
          description: 'Glob pattern to filter files (e.g., "*.ts", "*.{js,jsx}")',
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional patterns to exclude (node_modules, dist, .git excluded by default)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20, max: 100)',
          default: 20,
        },
        includeContext: {
          type: 'boolean',
          description: 'Include surrounding code context (default: true)',
          default: true,
        },
        contextLines: {
          type: 'number',
          description: 'Number of context lines before/after match (default: 3, max: 10)',
          default: 3,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_relevant_docs',
    description: 'Search documentation using vector similarity (if embedding provided) or full-text search. Returns relevant documentation chunks with stack information and relevance scores. Useful for finding documentation related to technologies, APIs, or concepts.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for documentation',
        },
        stackNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by specific stack names (e.g., ["react", "typescript"])',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10, max: 50)',
          default: 10,
        },
        embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Pre-computed embedding vector (1536 dimensions for OpenAI ada-002)',
        },
        useFullTextSearch: {
          type: 'boolean',
          description: 'Force full-text search even if embedding is provided (default: false)',
          default: false,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_by_pattern',
    description: 'Comprehensive search combining code and documentation search. Returns ranked results from both sources. Useful for finding all information related to a pattern, concept, or implementation approach.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search pattern or query',
        },
        searchCode: {
          type: 'boolean',
          description: 'Include code search results (default: true)',
          default: true,
        },
        searchDocs: {
          type: 'boolean',
          description: 'Include documentation search results (default: true)',
          default: true,
        },
        filePattern: {
          type: 'string',
          description: 'Glob pattern to filter code files (e.g., "*.ts")',
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional patterns to exclude from code search',
        },
        stackNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter documentation by stack names',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum combined results to return (default: 20, max: 100)',
          default: 20,
        },
        embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Pre-computed embedding vector for documentation search',
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Execute a pattern learning tool
 */
export async function executePatternLearningTool(
  toolName: string,
  args: unknown
): Promise<unknown> {
  logger.debug({ toolName, args }, 'Executing pattern learning tool');

  try {
    switch (toolName) {
      case 'find_similar_implementations': {
        const validated = FindSimilarImplementationsSchema.parse(args);
        return await findSimilarImplementations(validated as FindSimilarImplementationsInput);
      }

      case 'get_relevant_docs': {
        const validated = GetRelevantDocsSchema.parse(args);
        return await getRelevantDocs(validated as GetRelevantDocsInput);
      }

      case 'search_by_pattern': {
        const validated = SearchByPatternSchema.parse(args);
        return await searchByPattern(validated as SearchByPatternInput);
      }

      default:
        throw new AppError(`Unknown pattern learning tool: ${toolName}`, 400, 'UNKNOWN_TOOL');
    }
  } catch (error) {
    logger.error({ error, toolName }, 'Pattern learning tool execution failed');

    if (error instanceof AppError) {
      throw error;
    }

    // Re-throw validation errors
    throw error;
  }
}
