/**
 * Pattern Learning Tool Executors
 *
 * Core business logic for pattern learning and code search operations.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { eq, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { documentationChunks } from '../../../../db/schema/stacks.js';
import { stacks } from '../../../../db/schema/stacks.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../middleware/logger.js';
import type {
  FindSimilarImplementationsInput,
  FindSimilarImplementationsOutput,
  GetRelevantDocsInput,
  GetRelevantDocsOutput,
  SearchByPatternInput,
  SearchByPatternOutput,
  CodeSearchResult,
  DocumentationResult,
  PatternSearchResult,
} from '../../../types/pattern-learning.js';
import { codeSearchCache, docsSearchCache, patternSearchCache, SearchCache } from '../utils/search-cache.js';

const execFileAsync = promisify(execFile);

// Default excluded patterns for grep search
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  'coverage',
  '.turbo',
];

/**
 * Execute grep search with timeout and buffer limits
 */
async function executeGrepSearch(
  pattern: string,
  filePattern?: string,
  excludePatterns: string[] = [],
  maxBuffer = 10 * 1024 * 1024 // 10MB
): Promise<string> {
  const args: string[] = [
    '-r', // recursive
    '-n', // line numbers
    '-i', // case insensitive
    '--color=never', // no color codes
  ];

  // Add include pattern if specified
  if (filePattern) {
    args.push('--include', filePattern);
  }

  // Add exclude patterns
  const allExcludes = [...DEFAULT_EXCLUDE_PATTERNS, ...excludePatterns];
  allExcludes.forEach((exclude) => {
    args.push('--exclude-dir', exclude);
  });

  // Add the search pattern
  args.push(pattern);

  // Search in current project directory
  args.push('.');

  logger.debug({ args }, 'Executing grep command');

  try {
    const { stdout } = await execFileAsync('grep', args, {
      timeout: 30000, // 30 second timeout
      maxBuffer,
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    return stdout;
  } catch (error) {
    // grep returns exit code 1 if no matches found
    if (error && typeof error === 'object' && 'code' in error && error.code === 1) {
      return '';
    }
    throw error;
  }
}

/**
 * Parse grep output into structured results
 */
function parseGrepOutput(
  output: string,
  maxResults: number
): CodeSearchResult[] {
  if (!output.trim()) {
    return [];
  }

  const lines = output.split('\n').filter((line) => line.trim());
  const results: CodeSearchResult[] = [];
  const resultMap = new Map<string, CodeSearchResult[]>();

  // Parse each line
  for (const line of lines) {
    const match = line.match(/^([^:]+):(\d+):(.+)$/);
    if (!match) continue;

    const [, filePath, lineNumStr, content] = match;
    const lineNumber = parseInt(lineNumStr, 10);

    const result: CodeSearchResult = {
      filePath,
      lineNumber,
      content: content.trim(),
      relevanceScore: 100, // Will be adjusted later
    };

    if (!resultMap.has(filePath)) {
      resultMap.set(filePath, []);
    }
    resultMap.get(filePath)!.push(result);
  }

  // Calculate relevance scores and add to results
  for (const fileResults of resultMap.values()) {
    // Sort by line number
    fileResults.sort((a, b) => a.lineNumber - b.lineNumber);

    // Calculate relevance based on frequency in file and position
    const baseScore = Math.min(100, 50 + (fileResults.length * 10));

    for (let i = 0; i < Math.min(fileResults.length, maxResults); i++) {
      const result = fileResults[i];
      result.relevanceScore = Math.max(1, baseScore - (i * 2));
      results.push(result);
    }
  }

  // Sort by relevance score and limit results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, maxResults);
}

/**
 * Find similar implementations using grep-based code search
 */
export async function findSimilarImplementations(
  input: FindSimilarImplementationsInput
): Promise<FindSimilarImplementationsOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Finding similar implementations');

  // Check cache
  const cacheKey = SearchCache.generateKey('code', input as unknown as Record<string, unknown>);
  const cached = codeSearchCache.get(cacheKey) as FindSimilarImplementationsOutput | null;
  if (cached) {
    logger.info('Returning cached code search results');
    return cached;
  }

  let results: CodeSearchResult[] = [];

  try {
    // Execute grep search
    const grepOutput = await executeGrepSearch(
      input.query,
      input.filePattern,
      input.excludePatterns
    );

    // Parse results
    results = parseGrepOutput(
      grepOutput,
      input.maxResults || 20
    );
  } catch (error) {
    logger.error({ error, input }, 'Code search failed');
    throw new AppError(
      'Failed to search code',
      500,
      'CODE_SEARCH_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  const output: FindSimilarImplementationsOutput = {
    results,
    totalFound: results.length,
    query: input.query,
    executionTimeMs: Date.now() - startTime,
  };

  // Cache the results
  codeSearchCache.set(cacheKey, output);

  logger.info({ totalFound: output.totalFound, executionTimeMs: output.executionTimeMs }, 'Code search completed');
  return output;
}

/**
 * Get relevant documentation using vector or full-text search
 */
export async function getRelevantDocs(
  input: GetRelevantDocsInput
): Promise<GetRelevantDocsOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Getting relevant documentation');

  // Check cache
  const cacheKey = SearchCache.generateKey('docs', input as unknown as Record<string, unknown>);
  const cached = docsSearchCache.get(cacheKey) as GetRelevantDocsOutput | null;
  if (cached) {
    logger.info('Returning cached documentation search results');
    return cached;
  }

  let results: DocumentationResult[] = [];
  let searchMethod: 'vector' | 'fulltext' = 'fulltext';

  try {
    if (input.embedding && !input.useFullTextSearch) {
      // Vector similarity search using pgvector
      results = await vectorSearch(
        input.embedding,
        input.stackNames,
        input.maxResults || 10
      );
      searchMethod = 'vector';
    } else {
      // Full-text search fallback
      results = await fullTextSearch(
        input.query,
        input.stackNames,
        input.maxResults || 10
      );
      searchMethod = 'fulltext';
    }
  } catch (error) {
    logger.error({ error, input }, 'Documentation search failed');
    throw new AppError(
      'Failed to search documentation',
      500,
      'DOCS_SEARCH_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  const output: GetRelevantDocsOutput = {
    results,
    totalFound: results.length,
    query: input.query,
    searchMethod,
    executionTimeMs: Date.now() - startTime,
  };

  // Cache the results
  docsSearchCache.set(cacheKey, output);

  logger.info({ totalFound: output.totalFound, searchMethod, executionTimeMs: output.executionTimeMs }, 'Documentation search completed');
  return output;
}

/**
 * Vector similarity search using pgvector cosine distance
 */
async function vectorSearch(
  embedding: number[],
  stackNames?: string[],
  maxResults = 10
): Promise<DocumentationResult[]> {
  logger.debug({ embeddingLength: embedding.length, stackNames, maxResults }, 'Executing vector search');

  // Build query with optional stack filter
  let query = db
    .select({
      id: documentationChunks.id,
      stackId: documentationChunks.stackId,
      stackName: stacks.name,
      title: documentationChunks.title,
      content: documentationChunks.content,
      url: documentationChunks.url,
      chunkIndex: documentationChunks.chunkIndex,
      distance: sql<number>`${documentationChunks.embedding} <=> ${JSON.stringify(embedding)}::vector`,
    })
    .from(documentationChunks)
    .leftJoin(stacks, eq(documentationChunks.stackId, stacks.id))
    .orderBy(sql`${documentationChunks.embedding} <=> ${JSON.stringify(embedding)}::vector`)
    .limit(maxResults);

  // Add stack name filter if provided
  if (stackNames && stackNames.length > 0) {
    query = query.where(inArray(stacks.name, stackNames)) as typeof query;
  }

  const rows = await query;

  // Convert to DocumentationResult with relevance score
  return rows.map((row) => ({
    id: row.id,
    stackId: row.stackId,
    stackName: row.stackName || undefined,
    title: row.title,
    content: row.content,
    url: row.url,
    chunkIndex: row.chunkIndex,
    // Convert distance to relevance score (0-100)
    // Cosine distance ranges from 0 (identical) to 2 (opposite)
    relevanceScore: Math.max(0, Math.min(100, Math.round((1 - row.distance / 2) * 100))),
  }));
}

/**
 * Full-text search using PostgreSQL
 */
async function fullTextSearch(
  query: string,
  stackNames?: string[],
  maxResults = 10
): Promise<DocumentationResult[]> {
  logger.debug({ query, stackNames, maxResults }, 'Executing full-text search');

  // Build the full-text search query
  const searchQuery = query
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => `${word}:*`)
    .join(' & ');

  // Build where conditions
  const whereConditions = [
    sql`to_tsvector('english', ${documentationChunks.content}) @@ to_tsquery('english', ${searchQuery})`,
  ];

  if (stackNames && stackNames.length > 0) {
    whereConditions.push(inArray(stacks.name, stackNames));
  }

  const rows = await db
    .select({
      id: documentationChunks.id,
      stackId: documentationChunks.stackId,
      stackName: stacks.name,
      title: documentationChunks.title,
      content: documentationChunks.content,
      url: documentationChunks.url,
      chunkIndex: documentationChunks.chunkIndex,
      rank: sql<number>`ts_rank(to_tsvector('english', ${documentationChunks.content}), to_tsquery('english', ${searchQuery}))`,
    })
    .from(documentationChunks)
    .leftJoin(stacks, eq(documentationChunks.stackId, stacks.id))
    .where(sql.join(whereConditions, sql` AND `))
    .orderBy(sql`ts_rank(to_tsvector('english', ${documentationChunks.content}), to_tsquery('english', ${searchQuery})) DESC`)
    .limit(maxResults);

  // Convert to DocumentationResult with relevance score
  const maxRank = rows.length > 0 ? Math.max(...rows.map((r) => r.rank)) : 1;

  return rows.map((row) => ({
    id: row.id,
    stackId: row.stackId,
    stackName: row.stackName || undefined,
    title: row.title,
    content: row.content,
    url: row.url,
    chunkIndex: row.chunkIndex,
    // Normalize rank to 0-100 scale
    relevanceScore: maxRank > 0 ? Math.round((row.rank / maxRank) * 100) : 50,
  }));
}

/**
 * Search by pattern combining code and documentation search
 */
export async function searchByPattern(
  input: SearchByPatternInput
): Promise<SearchByPatternOutput> {
  const startTime = Date.now();
  logger.debug({ input }, 'Searching by pattern');

  // Check cache
  const cacheKey = SearchCache.generateKey('pattern', input as unknown as Record<string, unknown>);
  const cached = patternSearchCache.get(cacheKey) as SearchByPatternOutput | null;
  if (cached) {
    logger.info('Returning cached pattern search results');
    return cached;
  }

  let codeResults: CodeSearchResult[] = [];
  let docResults: DocumentationResult[] = [];

  try {
    // Execute searches in parallel if both are requested
    const searchPromises: Promise<void>[] = [];

    if (input.searchCode) {
      searchPromises.push(
        (async () => {
          const codeOutput = await findSimilarImplementations({
            query: input.query,
            filePattern: input.filePattern,
            excludePatterns: input.excludePatterns,
            maxResults: Math.floor((input.maxResults || 20) / 2),
            includeContext: true,
            contextLines: 2,
          });
          codeResults = codeOutput.results;
        })()
      );
    }

    if (input.searchDocs) {
      searchPromises.push(
        (async () => {
          const docsOutput = await getRelevantDocs({
            query: input.query,
            stackNames: input.stackNames,
            maxResults: Math.floor((input.maxResults || 20) / 2),
            embedding: input.embedding,
          });
          docResults = docsOutput.results;
        })()
      );
    }

    await Promise.all(searchPromises);
  } catch (error) {
    logger.error({ error, input }, 'Pattern search failed');
    throw new AppError(
      'Failed to search by pattern',
      500,
      'PATTERN_SEARCH_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  // Combine and rank results
  const combinedResults: PatternSearchResult[] = [
    ...codeResults.map((result) => ({
      type: 'code' as const,
      result,
      relevanceScore: result.relevanceScore,
    })),
    ...docResults.map((result) => ({
      type: 'documentation' as const,
      result,
      relevanceScore: result.relevanceScore,
    })),
  ];

  // Sort by relevance score
  combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const output: SearchByPatternOutput = {
    codeResults,
    docResults,
    combinedResults: combinedResults.slice(0, input.maxResults || 20),
    totalFound: combinedResults.length,
    query: input.query,
    executionTimeMs: Date.now() - startTime,
  };

  // Cache the results
  patternSearchCache.set(cacheKey, output);

  logger.info(
    {
      codeResultsCount: codeResults.length,
      docResultsCount: docResults.length,
      totalFound: output.totalFound,
      executionTimeMs: output.executionTimeMs,
    },
    'Pattern search completed'
  );
  return output;
}
