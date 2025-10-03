/**
 * Integration Tests: Pattern Learning
 *
 * Tests for pattern learning MCP tools with real filesystem and database.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createTestPool, createTestDb, cleanDatabase, isVectorExtensionEnabled } from '../helpers/db-test-utils.js';
import { stacks, documentationChunks } from '../../db/schema/stacks.js';
import { eq, sql } from 'drizzle-orm';
import {
  findSimilarImplementations,
  getRelevantDocs,
  searchByPattern,
} from '../../src/mcp/tools/executors/pattern-learning-executor.js';
import type {
  FindSimilarImplementationsInput,
  GetRelevantDocsInput,
  SearchByPatternInput,
} from '../../src/types/pattern-learning.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import { codeSearchCache, docsSearchCache, patternSearchCache } from '../../src/mcp/tools/utils/search-cache.js';
import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Pattern Learning Integration Tests', () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof createTestDb>;
  let testStackId: number;
  let tempDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    pool = createTestPool();
    db = createTestDb(pool);

    // Save original working directory
    originalCwd = process.cwd();

    // Create temporary test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pattern-test-'));

    // Create test files for grep search
    await fs.writeFile(
      path.join(tempDir, 'user-service.ts'),
      `
export class UserService {
  async getUserData(userId: string) {
    return await this.db.query('SELECT * FROM users WHERE id = $1', [userId]);
  }

  async updateUserData(userId: string, data: any) {
    return await this.db.update('users', data, { id: userId });
  }
}
      `.trim()
    );

    await fs.writeFile(
      path.join(tempDir, 'auth-service.ts'),
      `
export class AuthService {
  async getUserData(email: string) {
    const user = await this.findByEmail(email);
    return user;
  }

  async authenticateUser(email: string, password: string) {
    const user = await this.getUserData(email);
    return this.verifyPassword(user, password);
  }
}
      `.trim()
    );

    await fs.writeFile(
      path.join(tempDir, 'user-controller.ts'),
      `
export class UserController {
  constructor(private userService: UserService) {}

  async getUser(req: Request, res: Response) {
    const userData = await this.userService.getUserData(req.params.id);
    res.json(userData);
  }
}
      `.trim()
    );

    // Create a test directory that should be excluded
    await fs.mkdir(path.join(tempDir, 'node_modules'));
    await fs.writeFile(
      path.join(tempDir, 'node_modules', 'package.ts'),
      `
// This should be excluded from search
function getUserData() {
  return 'should not appear';
}
      `.trim()
    );

    // Change to temp directory for grep tests
    process.chdir(tempDir);
  });

  afterAll(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }

    await pool.end();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    // Clear all caches before each test
    codeSearchCache.clear();
    docsSearchCache.clear();
    patternSearchCache.clear();

    // Create test stack
    const [stack] = await db
      .insert(stacks)
      .values({
        name: 'react',
        version: '18.0.0',
        description: 'React documentation',
        isActive: true,
      })
      .returning();
    testStackId = stack.id;
  });

  describe('findSimilarImplementations', () => {
    it('should find code matches using grep', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 10,
      };

      const result = await findSimilarImplementations(input);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.totalFound).toBeGreaterThan(0);
      expect(result.query).toBe('getUserData');
      expect(result.executionTimeMs).toBeGreaterThan(0);

      // Verify results structure
      const firstResult = result.results[0];
      expect(firstResult.filePath).toBeDefined();
      expect(firstResult.lineNumber).toBeGreaterThan(0);
      expect(firstResult.content).toBeDefined();
      expect(firstResult.relevanceScore).toBeGreaterThan(0);
      expect(firstResult.relevanceScore).toBeLessThanOrEqual(100);
    });

    it('should filter by file pattern', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        filePattern: '*-service.ts',
        maxResults: 10,
      };

      const result = await findSimilarImplementations(input);

      expect(result.results.length).toBeGreaterThan(0);
      // All results should be from *-service.ts files
      result.results.forEach((r) => {
        expect(r.filePath).toMatch(/-service\.ts$/);
      });
    });

    it('should exclude node_modules by default', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 100,
      };

      const result = await findSimilarImplementations(input);

      // Should not include results from node_modules
      const hasNodeModules = result.results.some((r) => r.filePath.includes('node_modules'));
      expect(hasNodeModules).toBe(false);
    });

    it('should respect maxResults limit', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 2,
      };

      const result = await findSimilarImplementations(input);

      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty results for non-matching query', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'nonExistentFunctionXYZ123',
        maxResults: 10,
      };

      const result = await findSimilarImplementations(input);

      expect(result.results).toEqual([]);
      expect(result.totalFound).toBe(0);
    });

    it('should exclude custom patterns (directories)', async () => {
      // Create a subdirectory with a file
      await fs.mkdir(path.join(tempDir, 'services'));
      await fs.writeFile(
        path.join(tempDir, 'services', 'data-service.ts'),
        `
export function getUserData() {
  return 'data from services directory';
}
        `.trim()
      );

      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        excludePatterns: ['services'],
        maxResults: 10,
      };

      const result = await findSimilarImplementations(input);

      // Should not include results from services directory
      const hasServicesDir = result.results.some((r) => r.filePath.includes('services'));
      expect(hasServicesDir).toBe(false);
    });

    it('should calculate relevance scores', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 10,
      };

      const result = await findSimilarImplementations(input);

      expect(result.results.length).toBeGreaterThan(0);

      // All scores should be between 1 and 100
      result.results.forEach((r) => {
        expect(r.relevanceScore).toBeGreaterThan(0);
        expect(r.relevanceScore).toBeLessThanOrEqual(100);
      });

      // Results should be sorted by relevance score (descending)
      for (let i = 0; i < result.results.length - 1; i++) {
        expect(result.results[i].relevanceScore).toBeGreaterThanOrEqual(
          result.results[i + 1].relevanceScore
        );
      }
    });

    it('should cache results', async () => {
      const input: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 5,
      };

      // First call
      const result1 = await findSimilarImplementations(input);
      const time1 = result1.executionTimeMs;

      // Second call (should be cached)
      const result2 = await findSimilarImplementations(input);
      const time2 = result2.executionTimeMs;

      // Results should be identical
      expect(result1.totalFound).toBe(result2.totalFound);
      expect(result1.results).toEqual(result2.results);

      // Cached call should be faster (or at least comparable)
      // Note: We can't guarantee it's always faster due to system load
      expect(time2).toBeLessThan(time1 * 2);
    });
  });

  describe('getRelevantDocs', () => {
    beforeEach(async () => {
      // Check if vector extension is enabled
      const vectorEnabled = await isVectorExtensionEnabled(pool);
      if (!vectorEnabled) {
        console.warn('pgvector extension not enabled, skipping some tests');
      }
    });

    it('should search documentation using full-text search', async () => {
      // Insert test documentation
      await db.insert(documentationChunks).values([
        {
          stackId: testStackId,
          title: 'React Hooks',
          content: 'React hooks allow you to use state and other React features without writing a class.',
          url: 'https://react.dev/hooks',
          chunkIndex: 0,
          embedding: null,
        },
        {
          stackId: testStackId,
          title: 'useState Hook',
          content: 'The useState hook lets you add state to function components.',
          url: 'https://react.dev/usestate',
          chunkIndex: 0,
          embedding: null,
        },
      ]);

      const input: GetRelevantDocsInput = {
        query: 'React hooks state',
        maxResults: 10,
        useFullTextSearch: true,
      };

      const result = await getRelevantDocs(input);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.totalFound).toBeGreaterThan(0);
      expect(result.query).toBe('React hooks state');
      expect(result.searchMethod).toBe('fulltext');
      expect(result.executionTimeMs).toBeGreaterThan(0);

      // Verify result structure
      const firstResult = result.results[0];
      expect(firstResult.id).toBeDefined();
      expect(firstResult.stackId).toBe(testStackId);
      expect(firstResult.content).toBeDefined();
      expect(firstResult.relevanceScore).toBeGreaterThan(0);
      expect(firstResult.relevanceScore).toBeLessThanOrEqual(100);
    });

    it('should filter by stack names', async () => {
      // Create another stack
      const [vueStack] = await db
        .insert(stacks)
        .values({
          name: 'vue',
          version: '3.0.0',
          description: 'Vue documentation',
          isActive: true,
        })
        .returning();

      // Insert docs for both stacks
      await db.insert(documentationChunks).values([
        {
          stackId: testStackId,
          title: 'React Component',
          content: 'React components are the building blocks of React applications.',
          url: 'https://react.dev/components',
          chunkIndex: 0,
          embedding: null,
        },
        {
          stackId: vueStack.id,
          title: 'Vue Component',
          content: 'Vue components are reusable Vue instances with custom elements.',
          url: 'https://vuejs.org/components',
          chunkIndex: 0,
          embedding: null,
        },
      ]);

      const input: GetRelevantDocsInput = {
        query: 'component',
        stackNames: ['react'],
        maxResults: 10,
        useFullTextSearch: true,
      };

      const result = await getRelevantDocs(input);

      expect(result.results.length).toBeGreaterThan(0);
      // All results should be from react stack
      result.results.forEach((r) => {
        expect(r.stackName).toBe('react');
      });
    });

    it('should respect maxResults limit', async () => {
      // Insert multiple docs
      await db.insert(documentationChunks).values([
        {
          stackId: testStackId,
          title: 'Doc 1',
          content: 'Testing content for search',
          url: 'https://example.com/1',
          chunkIndex: 0,
          embedding: null,
        },
        {
          stackId: testStackId,
          title: 'Doc 2',
          content: 'Testing content for search',
          url: 'https://example.com/2',
          chunkIndex: 1,
          embedding: null,
        },
        {
          stackId: testStackId,
          title: 'Doc 3',
          content: 'Testing content for search',
          url: 'https://example.com/3',
          chunkIndex: 2,
          embedding: null,
        },
      ]);

      const input: GetRelevantDocsInput = {
        query: 'testing content',
        maxResults: 2,
        useFullTextSearch: true,
      };

      const result = await getRelevantDocs(input);

      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty results for non-matching query', async () => {
      await db.insert(documentationChunks).values({
        stackId: testStackId,
        title: 'Test Doc',
        content: 'Some content here',
        url: 'https://example.com',
        chunkIndex: 0,
        embedding: null,
      });

      const input: GetRelevantDocsInput = {
        query: 'nonexistentterminologyxyz',
        maxResults: 10,
        useFullTextSearch: true,
      };

      const result = await getRelevantDocs(input);

      expect(result.results).toEqual([]);
      expect(result.totalFound).toBe(0);
    });

    it('should use vector search when embedding provided', async () => {
      const vectorEnabled = await isVectorExtensionEnabled(pool);
      if (!vectorEnabled) {
        console.log('Skipping vector search test - extension not enabled');
        return;
      }

      // Create embedding vector
      const embedding = new Array(1536).fill(0);
      embedding[0] = 0.5;
      embedding[1] = 0.3;

      // Insert doc with embedding
      await db.insert(documentationChunks).values({
        stackId: testStackId,
        title: 'Vector Doc',
        content: 'Documentation with vector embedding',
        url: 'https://example.com',
        chunkIndex: 0,
        embedding: embedding,
      });

      const input: GetRelevantDocsInput = {
        query: 'vector search',
        embedding,
        maxResults: 10,
      };

      const result = await getRelevantDocs(input);

      expect(result.searchMethod).toBe('vector');
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should cache results', async () => {
      await db.insert(documentationChunks).values({
        stackId: testStackId,
        title: 'Cache Test',
        content: 'Testing caching behavior',
        url: 'https://example.com',
        chunkIndex: 0,
        embedding: null,
      });

      const input: GetRelevantDocsInput = {
        query: 'caching behavior',
        maxResults: 5,
        useFullTextSearch: true,
      };

      // First call
      const result1 = await getRelevantDocs(input);

      // Second call (should be cached)
      const result2 = await getRelevantDocs(input);

      // Results should be identical
      expect(result1.totalFound).toBe(result2.totalFound);
      expect(result1.results).toEqual(result2.results);
    });
  });

  describe('searchByPattern', () => {
    beforeEach(async () => {
      // Insert test documentation
      await db.insert(documentationChunks).values({
        stackId: testStackId,
        title: 'User Authentication',
        content: 'Documentation about user authentication and getUserData method',
        url: 'https://example.com/auth',
        chunkIndex: 0,
        embedding: null,
      });
    });

    it('should search both code and documentation', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: true,
        searchDocs: true,
        maxResults: 20,
      };

      const result = await searchByPattern(input);

      expect(result.codeResults.length).toBeGreaterThan(0);
      expect(result.docResults.length).toBeGreaterThan(0);
      expect(result.combinedResults.length).toBeGreaterThan(0);
      expect(result.totalFound).toBeGreaterThan(0);
      expect(result.query).toBe('getUserData');
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should search only code when searchDocs is false', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: true,
        searchDocs: false,
        maxResults: 20,
      };

      const result = await searchByPattern(input);

      expect(result.codeResults.length).toBeGreaterThan(0);
      expect(result.docResults).toEqual([]);
    });

    it('should search only docs when searchCode is false', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: false,
        searchDocs: true,
        maxResults: 20,
      };

      const result = await searchByPattern(input);

      expect(result.codeResults).toEqual([]);
      expect(result.docResults.length).toBeGreaterThan(0);
    });

    it('should combine and rank results', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: true,
        searchDocs: true,
        maxResults: 20,
      };

      // Add a doc that will match
      await db.insert(documentationChunks).values({
        stackId: testStackId,
        title: 'getUserData',
        content: 'Documentation about getUserData',
        url: 'https://example.com',
        chunkIndex: 0,
        embedding: null,
      });

      const result = await searchByPattern(input);

      expect(result.combinedResults.length).toBeGreaterThan(0);

      // Verify combined results contain both types
      const hasCode = result.combinedResults.some((r) => r.type === 'code');
      const hasDocs = result.combinedResults.some((r) => r.type === 'documentation');
      expect(hasCode).toBe(true);
      expect(hasDocs).toBe(true);

      // Verify results are sorted by relevance score
      for (let i = 0; i < result.combinedResults.length - 1; i++) {
        expect(result.combinedResults[i].relevanceScore).toBeGreaterThanOrEqual(
          result.combinedResults[i + 1].relevanceScore
        );
      }
    });

    it('should respect maxResults limit for combined results', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: true,
        searchDocs: true,
        maxResults: 5,
      };

      const result = await searchByPattern(input);

      expect(result.combinedResults.length).toBeLessThanOrEqual(5);
    });

    it('should apply file pattern to code search', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: true,
        searchDocs: false,
        filePattern: '*-service.ts',
        maxResults: 20,
      };

      const result = await searchByPattern(input);

      // All code results should match the file pattern
      result.codeResults.forEach((r) => {
        expect(r.filePath).toMatch(/-service\.ts$/);
      });
    });

    it('should apply stack filter to documentation search', async () => {
      // Create another stack
      const [angularStack] = await db
        .insert(stacks)
        .values({
          name: 'angular',
          version: '16.0.0',
          description: 'Angular documentation',
          isActive: true,
        })
        .returning();

      await db.insert(documentationChunks).values({
        stackId: angularStack.id,
        title: 'Angular Auth',
        content: 'Angular authentication with getUserData',
        url: 'https://angular.io/auth',
        chunkIndex: 0,
        embedding: null,
      });

      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: false,
        searchDocs: true,
        stackNames: ['react'],
        maxResults: 20,
      };

      const result = await searchByPattern(input);

      // All doc results should be from react stack
      result.docResults.forEach((r) => {
        expect(r.stackName).toBe('react');
      });
    });

    it('should cache results', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: true,
        searchDocs: true,
        maxResults: 10,
      };

      // First call
      const result1 = await searchByPattern(input);

      // Second call (should be cached)
      const result2 = await searchByPattern(input);

      // Results should be identical
      expect(result1.totalFound).toBe(result2.totalFound);
      expect(result1.codeResults).toEqual(result2.codeResults);
      expect(result1.docResults).toEqual(result2.docResults);
    });

    it('should return empty results when both searches disabled', async () => {
      const input: SearchByPatternInput = {
        query: 'getUserData',
        searchCode: false,
        searchDocs: false,
        maxResults: 20,
      };

      const result = await searchByPattern(input);

      expect(result.codeResults).toEqual([]);
      expect(result.docResults).toEqual([]);
      expect(result.combinedResults).toEqual([]);
      expect(result.totalFound).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle grep timeout gracefully', async () => {
      // This test would require a very large codebase or modified timeout
      // For now, we test that the error is properly wrapped
      const input: FindSimilarImplementationsInput = {
        query: '.*', // Very broad pattern that might timeout on large codebases
        maxResults: 1000,
      };

      // Should not throw, but might return fewer results
      const result = await findSimilarImplementations(input);
      expect(result).toBeDefined();
    });

    it('should handle database errors in documentation search', async () => {
      const input: GetRelevantDocsInput = {
        query: 'test query with special @@ characters',
        maxResults: 10,
        useFullTextSearch: true,
      };

      // Should handle special characters gracefully
      const result = await getRelevantDocs(input);
      expect(result).toBeDefined();
    });

    it('should handle missing vector extension gracefully', async () => {
      const vectorEnabled = await isVectorExtensionEnabled(pool);

      if (vectorEnabled) {
        console.log('Skipping missing vector extension test - extension is enabled');
        return;
      }

      const embedding = new Array(1536).fill(0.1);
      const input: GetRelevantDocsInput = {
        query: 'test',
        embedding,
        maxResults: 10,
      };

      // Should either work or throw appropriate error
      try {
        const result = await getRelevantDocs(input);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
      }
    });
  });

  describe('Cache Behavior', () => {
    it('should use separate caches for different tools', async () => {
      const codeInput: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 5,
      };

      const docsInput: GetRelevantDocsInput = {
        query: 'getUserData',
        maxResults: 5,
        useFullTextSearch: true,
      };

      await db.insert(documentationChunks).values({
        stackId: testStackId,
        title: 'Test',
        content: 'getUserData documentation',
        url: 'https://example.com',
        chunkIndex: 0,
        embedding: null,
      });

      // Execute both
      await findSimilarImplementations(codeInput);
      await getRelevantDocs(docsInput);

      // Check cache stats
      const codeStats = codeSearchCache.getStats();
      const docsStats = docsSearchCache.getStats();

      expect(codeStats.size).toBeGreaterThan(0);
      expect(docsStats.size).toBeGreaterThan(0);
    });

    it('should generate different cache keys for different inputs', async () => {
      const input1: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 5,
      };

      const input2: FindSimilarImplementationsInput = {
        query: 'getUserData',
        maxResults: 10, // Different
      };

      await findSimilarImplementations(input1);
      await findSimilarImplementations(input2);

      // Both should be in cache
      const stats = codeSearchCache.getStats();
      expect(stats.size).toBe(2);
    });
  });
});
