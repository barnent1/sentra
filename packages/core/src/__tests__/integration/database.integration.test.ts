/**
 * Database Integration Tests
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import type {
  EvolutionDnaId,
  CodeDNA,
  PatternTypeEnum,
} from '../../types/evolution';

// Import database utilities
import { createDatabaseConnection } from '../../db/utils/connection';
import { runMigrations, rollbackMigrations } from '../../db/migrate';

// Import testcontainers for real database testing
import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers';

describe('Database Integration Tests', () => {
  let container: StartedPostgreSqlContainer;
  let db: any;
  let connectionString: string;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('sentra_test')
      .withUsername('test')
      .withPassword('test')
      .withExposedPorts(5432)
      .start();

    connectionString = container.getConnectionUri();
    process.env['DATABASE_URL'] = connectionString;

    // Create database connection
    db = await createDatabaseConnection({
      connectionString,
      ssl: false,
      max: 10,
    });

    // Run migrations
    await runMigrations(db);
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    if (db) {
      await db.end();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    // Clean up data before each test
    await db.query('TRUNCATE TABLE evolution_patterns, evolution_results CASCADE');
  });

  describe('Evolution Patterns Table', () => {
    it('should insert and retrieve evolution patterns', async () => {
      const testPattern: Partial<CodeDNA> = {
        id: 'test-pattern-1' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function test() { return "hello world"; }',
        genetics: {
          successRate: 0.85,
          adaptationRate: 0.72,
          complexityIndex: 0.65,
          diversityScore: 0.58,
          stabilityFactor: 0.91,
        },
        performance: {
          responseTime: 150,
          throughput: 100,
          errorRate: 0.02,
          resourceUtilization: 0.75,
          scalabilityIndex: 0.83,
        },
        metadata: {
          description: 'Test optimization pattern',
          tags: ['test', 'optimization'],
          author: 'test-author',
          version: '1.0.0',
        },
      };

      // Insert pattern
      const insertResult = await db.query(
        `INSERT INTO evolution_patterns (
          id, generation, parent_id, pattern_type, code, genetics, performance, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          testPattern.id,
          testPattern.generation,
          testPattern.parentId,
          testPattern.patternType,
          testPattern.code,
          JSON.stringify(testPattern.genetics),
          JSON.stringify(testPattern.performance),
          JSON.stringify(testPattern.metadata),
        ]
      );

      expect(insertResult.rows).toHaveLength(1);
      const insertedPattern = insertResult.rows[0];

      expect(insertedPattern).toMatchObject({
        id: testPattern.id,
        generation: testPattern.generation,
        parent_id: testPattern.parentId,
        pattern_type: testPattern.patternType,
        code: testPattern.code,
      });

      // Verify JSON fields are properly stored
      expect(JSON.parse(insertedPattern.genetics)).toEqual(testPattern.genetics);
      expect(JSON.parse(insertedPattern.performance)).toEqual(testPattern.performance);
      expect(JSON.parse(insertedPattern.metadata)).toEqual(testPattern.metadata);

      // Retrieve pattern
      const selectResult = await db.query(
        'SELECT * FROM evolution_patterns WHERE id = $1',
        [testPattern.id]
      );

      expect(selectResult.rows).toHaveLength(1);
      const retrievedPattern = selectResult.rows[0];

      expect(retrievedPattern.id).toBe(testPattern.id);
      expect(JSON.parse(retrievedPattern.genetics)).toEqual(testPattern.genetics);
    });

    it('should handle parent-child relationships', async () => {
      // Insert parent pattern
      const parentPattern: Partial<CodeDNA> = {
        id: 'parent-pattern' as EvolutionDnaId,
        generation: 1,
        parentId: null,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function parent() { return "original"; }',
        genetics: {
          successRate: 0.75,
          adaptationRate: 0.65,
          complexityIndex: 0.60,
          diversityScore: 0.55,
          stabilityFactor: 0.85,
        },
        performance: {
          responseTime: 180,
          throughput: 90,
          errorRate: 0.025,
          resourceUtilization: 0.70,
          scalabilityIndex: 0.78,
        },
        metadata: {
          description: 'Parent pattern',
          tags: ['parent'],
          author: 'test-author',
          version: '1.0.0',
        },
      };

      await db.query(
        `INSERT INTO evolution_patterns (
          id, generation, parent_id, pattern_type, code, genetics, performance, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          parentPattern.id,
          parentPattern.generation,
          parentPattern.parentId,
          parentPattern.patternType,
          parentPattern.code,
          JSON.stringify(parentPattern.genetics),
          JSON.stringify(parentPattern.performance),
          JSON.stringify(parentPattern.metadata),
        ]
      );

      // Insert child pattern
      const childPattern: Partial<CodeDNA> = {
        id: 'child-pattern' as EvolutionDnaId,
        generation: 2,
        parentId: parentPattern.id,
        patternType: 'optimization' as PatternTypeEnum,
        code: 'function child() { return "evolved"; }',
        genetics: {
          successRate: 0.82,
          adaptationRate: 0.71,
          complexityIndex: 0.63,
          diversityScore: 0.61,
          stabilityFactor: 0.89,
        },
        performance: {
          responseTime: 160,
          throughput: 105,
          errorRate: 0.018,
          resourceUtilization: 0.73,
          scalabilityIndex: 0.84,
        },
        metadata: {
          description: 'Child pattern evolved from parent',
          tags: ['child', 'evolved'],
          author: 'test-author',
          version: '1.1.0',
        },
      };

      await db.query(
        `INSERT INTO evolution_patterns (
          id, generation, parent_id, pattern_type, code, genetics, performance, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          childPattern.id,
          childPattern.generation,
          childPattern.parentId,
          childPattern.patternType,
          childPattern.code,
          JSON.stringify(childPattern.genetics),
          JSON.stringify(childPattern.performance),
          JSON.stringify(childPattern.metadata),
        ]
      );

      // Query parent-child relationship
      const relationshipQuery = await db.query(
        `SELECT p.id as parent_id, p.generation as parent_generation,
                c.id as child_id, c.generation as child_generation
         FROM evolution_patterns p
         JOIN evolution_patterns c ON p.id = c.parent_id
         WHERE p.id = $1`,
        [parentPattern.id]
      );

      expect(relationshipQuery.rows).toHaveLength(1);
      const relationship = relationshipQuery.rows[0];

      expect(relationship.parent_id).toBe(parentPattern.id);
      expect(relationship.child_id).toBe(childPattern.id);
      expect(relationship.child_generation).toBe(relationship.parent_generation + 1);
    });

    it('should support complex queries with JSON fields', async () => {
      // Insert multiple patterns with different genetic markers
      const patterns = [
        {
          id: 'high-success-pattern' as EvolutionDnaId,
          genetics: { successRate: 0.95, adaptationRate: 0.85, complexityIndex: 0.70, diversityScore: 0.80, stabilityFactor: 0.90 },
        },
        {
          id: 'medium-success-pattern' as EvolutionDnaId,
          genetics: { successRate: 0.75, adaptationRate: 0.65, complexityIndex: 0.60, diversityScore: 0.55, stabilityFactor: 0.70 },
        },
        {
          id: 'low-success-pattern' as EvolutionDnaId,
          genetics: { successRate: 0.45, adaptationRate: 0.40, complexityIndex: 0.35, diversityScore: 0.30, stabilityFactor: 0.50 },
        },
      ];

      for (const pattern of patterns) {
        await db.query(
          `INSERT INTO evolution_patterns (
            id, generation, parent_id, pattern_type, code, genetics, performance, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            pattern.id,
            1,
            null,
            'optimization',
            'function test() { return "test"; }',
            JSON.stringify(pattern.genetics),
            JSON.stringify({ responseTime: 100, throughput: 50, errorRate: 0.01, resourceUtilization: 0.5, scalabilityIndex: 0.5 }),
            JSON.stringify({ description: 'Test pattern', tags: ['test'], author: 'test', version: '1.0.0' }),
          ]
        );
      }

      // Query patterns with high success rate using JSON operator
      const highSuccessPatterns = await db.query(
        `SELECT id, (genetics->>'successRate')::float as success_rate
         FROM evolution_patterns
         WHERE (genetics->>'successRate')::float > 0.8
         ORDER BY (genetics->>'successRate')::float DESC`
      );

      expect(highSuccessPatterns.rows).toHaveLength(1);
      expect(highSuccessPatterns.rows[0].id).toBe('high-success-pattern');
      expect(highSuccessPatterns.rows[0].success_rate).toBe(0.95);

      // Query patterns by adaptability range
      const adaptablePatterns = await db.query(
        `SELECT id, (genetics->>'adaptationRate')::float as adaptation_rate
         FROM evolution_patterns
         WHERE (genetics->>'adaptationRate')::float BETWEEN 0.6 AND 0.9
         ORDER BY (genetics->>'adaptationRate')::float DESC`
      );

      expect(adaptablePatterns.rows).toHaveLength(2);
      expect(adaptablePatterns.rows[0].id).toBe('high-success-pattern');
      expect(adaptablePatterns.rows[1].id).toBe('medium-success-pattern');
    });
  });

  describe('Evolution Results Table', () => {
    it('should store and retrieve evolution results', async () => {
      // First, insert a pattern to reference
      const patternId = 'result-test-pattern' as EvolutionDnaId;
      await db.query(
        `INSERT INTO evolution_patterns (
          id, generation, parent_id, pattern_type, code, genetics, performance, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          patternId,
          1,
          null,
          'optimization',
          'function test() { return "test"; }',
          JSON.stringify({ successRate: 0.8, adaptationRate: 0.7, complexityIndex: 0.6, diversityScore: 0.5, stabilityFactor: 0.9 }),
          JSON.stringify({ responseTime: 150, throughput: 100, errorRate: 0.02, resourceUtilization: 0.75, scalabilityIndex: 0.83 }),
          JSON.stringify({ description: 'Test pattern', tags: ['test'], author: 'test', version: '1.0.0' }),
        ]
      );

      // Insert evolution result
      const evolutionResult = {
        id: 'evolution-result-1',
        patternId,
        generation: 1,
        metrics: {
          responseTime: 145,
          throughput: 105,
          errorRate: 0.018,
          resourceUtilization: 0.72,
          scalabilityIndex: 0.86,
        },
        feedback: 'Improved performance metrics across all dimensions',
      };

      const insertResult = await db.query(
        `INSERT INTO evolution_results (
          id, pattern_id, generation, metrics, feedback
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          evolutionResult.id,
          evolutionResult.patternId,
          evolutionResult.generation,
          JSON.stringify(evolutionResult.metrics),
          evolutionResult.feedback,
        ]
      );

      expect(insertResult.rows).toHaveLength(1);
      const insertedResult = insertResult.rows[0];

      expect(insertedResult.id).toBe(evolutionResult.id);
      expect(insertedResult.pattern_id).toBe(evolutionResult.patternId);
      expect(JSON.parse(insertedResult.metrics)).toEqual(evolutionResult.metrics);

      // Query results with pattern information
      const joinedQuery = await db.query(
        `SELECT er.id as result_id, er.feedback, er.metrics,
                ep.id as pattern_id, ep.generation, ep.pattern_type
         FROM evolution_results er
         JOIN evolution_patterns ep ON er.pattern_id = ep.id
         WHERE er.id = $1`,
        [evolutionResult.id]
      );

      expect(joinedQuery.rows).toHaveLength(1);
      const joinedResult = joinedQuery.rows[0];

      expect(joinedResult.result_id).toBe(evolutionResult.id);
      expect(joinedResult.pattern_id).toBe(patternId);
      expect(joinedResult.feedback).toBe(evolutionResult.feedback);
      expect(JSON.parse(joinedResult.metrics)).toEqual(evolutionResult.metrics);
    });
  });

  describe('Database Transactions', () => {
    it('should handle transaction rollback on error', async () => {
      const client = await db.connect();

      try {
        await client.query('BEGIN');

        // Insert a valid pattern
        await client.query(
          `INSERT INTO evolution_patterns (
            id, generation, parent_id, pattern_type, code, genetics, performance, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'transaction-test' as EvolutionDnaId,
            1,
            null,
            'optimization',
            'function test() { return "test"; }',
            JSON.stringify({ successRate: 0.8, adaptationRate: 0.7, complexityIndex: 0.6, diversityScore: 0.5, stabilityFactor: 0.9 }),
            JSON.stringify({ responseTime: 150, throughput: 100, errorRate: 0.02, resourceUtilization: 0.75, scalabilityIndex: 0.83 }),
            JSON.stringify({ description: 'Transaction test', tags: ['test'], author: 'test', version: '1.0.0' }),
          ]
        );

        // Attempt to insert invalid data (this should fail)
        await expect(
          client.query(
            `INSERT INTO evolution_patterns (
              id, generation, parent_id, pattern_type, code, genetics, performance, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              'transaction-test', // Duplicate ID should cause constraint violation
              1,
              null,
              'optimization',
              'function test() { return "duplicate"; }',
              JSON.stringify({ successRate: 0.8, adaptationRate: 0.7, complexityIndex: 0.6, diversityScore: 0.5, stabilityFactor: 0.9 }),
              JSON.stringify({ responseTime: 150, throughput: 100, errorRate: 0.02, resourceUtilization: 0.75, scalabilityIndex: 0.83 }),
              JSON.stringify({ description: 'Duplicate test', tags: ['test'], author: 'test', version: '1.0.0' }),
            ]
          )
        ).rejects.toThrow();

        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      // Verify that the transaction was rolled back
      const checkResult = await db.query(
        'SELECT * FROM evolution_patterns WHERE id = $1',
        ['transaction-test']
      );

      expect(checkResult.rows).toHaveLength(0);
    });

    it('should commit successful transactions', async () => {
      const client = await db.connect();

      try {
        await client.query('BEGIN');

        // Insert parent pattern
        await client.query(
          `INSERT INTO evolution_patterns (
            id, generation, parent_id, pattern_type, code, genetics, performance, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'commit-parent' as EvolutionDnaId,
            1,
            null,
            'optimization',
            'function parent() { return "original"; }',
            JSON.stringify({ successRate: 0.75, adaptationRate: 0.65, complexityIndex: 0.60, diversityScore: 0.55, stabilityFactor: 0.85 }),
            JSON.stringify({ responseTime: 180, throughput: 90, errorRate: 0.025, resourceUtilization: 0.70, scalabilityIndex: 0.78 }),
            JSON.stringify({ description: 'Parent for commit test', tags: ['commit'], author: 'test', version: '1.0.0' }),
          ]
        );

        // Insert child pattern
        await client.query(
          `INSERT INTO evolution_patterns (
            id, generation, parent_id, pattern_type, code, genetics, performance, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'commit-child' as EvolutionDnaId,
            2,
            'commit-parent',
            'optimization',
            'function child() { return "evolved"; }',
            JSON.stringify({ successRate: 0.82, adaptationRate: 0.71, complexityIndex: 0.63, diversityScore: 0.61, stabilityFactor: 0.89 }),
            JSON.stringify({ responseTime: 160, throughput: 105, errorRate: 0.018, resourceUtilization: 0.73, scalabilityIndex: 0.84 }),
            JSON.stringify({ description: 'Child for commit test', tags: ['commit'], author: 'test', version: '1.1.0' }),
          ]
        );

        await client.query('COMMIT');
      } finally {
        client.release();
      }

      // Verify both records were committed
      const parentResult = await db.query(
        'SELECT * FROM evolution_patterns WHERE id = $1',
        ['commit-parent']
      );
      const childResult = await db.query(
        'SELECT * FROM evolution_patterns WHERE id = $1',
        ['commit-child']
      );

      expect(parentResult.rows).toHaveLength(1);
      expect(childResult.rows).toHaveLength(1);
      expect(childResult.rows[0].parent_id).toBe('commit-parent');
    });
  });

  describe('Database Performance', () => {
    it('should handle bulk inserts efficiently', async () => {
      const batchSize = 100;
      const patterns = Array.from({ length: batchSize }, (_, i) => ({
        id: `bulk-pattern-${i}` as EvolutionDnaId,
        generation: Math.floor(i / 10) + 1,
        parentId: i > 0 ? `bulk-pattern-${i - 1}` as EvolutionDnaId : null,
        patternType: 'optimization' as PatternTypeEnum,
        code: `function bulk${i}() { return ${i}; }`,
        genetics: {
          successRate: Math.random(),
          adaptationRate: Math.random(),
          complexityIndex: Math.random(),
          diversityScore: Math.random(),
          stabilityFactor: Math.random(),
        },
        performance: {
          responseTime: 100 + Math.random() * 100,
          throughput: 50 + Math.random() * 50,
          errorRate: Math.random() * 0.1,
          resourceUtilization: Math.random(),
          scalabilityIndex: Math.random(),
        },
        metadata: {
          description: `Bulk pattern ${i}`,
          tags: ['bulk', 'test'],
          author: 'test-author',
          version: '1.0.0',
        },
      }));

      const { result: insertedCount, duration } = await global.measurePerformance(async () => {
        let count = 0;
        for (const pattern of patterns) {
          await db.query(
            `INSERT INTO evolution_patterns (
              id, generation, parent_id, pattern_type, code, genetics, performance, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              pattern.id,
              pattern.generation,
              pattern.parentId,
              pattern.patternType,
              pattern.code,
              JSON.stringify(pattern.genetics),
              JSON.stringify(pattern.performance),
              JSON.stringify(pattern.metadata),
            ]
          );
          count++;
        }
        return count;
      });

      expect(insertedCount).toBe(batchSize);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all records were inserted
      const countResult = await db.query('SELECT COUNT(*) FROM evolution_patterns');
      expect(parseInt(countResult.rows[0].count)).toBe(batchSize);
    });

    it('should execute complex queries within performance thresholds', async () => {
      // Insert test data
      const testPatterns = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-pattern-${i}` as EvolutionDnaId,
        generation: (i % 5) + 1,
        successRate: 0.5 + (i % 5) * 0.1,
        adaptationRate: 0.4 + (i % 6) * 0.1,
      }));

      for (const pattern of testPatterns) {
        await db.query(
          `INSERT INTO evolution_patterns (
            id, generation, parent_id, pattern_type, code, genetics, performance, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            pattern.id,
            pattern.generation,
            null,
            'optimization',
            'function test() { return "test"; }',
            JSON.stringify({ 
              successRate: pattern.successRate, 
              adaptationRate: pattern.adaptationRate, 
              complexityIndex: 0.6, 
              diversityScore: 0.5, 
              stabilityFactor: 0.9 
            }),
            JSON.stringify({ responseTime: 150, throughput: 100, errorRate: 0.02, resourceUtilization: 0.75, scalabilityIndex: 0.83 }),
            JSON.stringify({ description: 'Performance test pattern', tags: ['perf'], author: 'test', version: '1.0.0' }),
          ]
        );
      }

      // Execute complex query with performance measurement
      const { result, duration } = await global.measurePerformance(async () => {
        return await db.query(`
          SELECT 
            generation,
            COUNT(*) as pattern_count,
            AVG((genetics->>'successRate')::float) as avg_success_rate,
            MAX((genetics->>'adaptationRate')::float) as max_adaptation_rate,
            MIN((genetics->>'adaptationRate')::float) as min_adaptation_rate
          FROM evolution_patterns
          WHERE (genetics->>'successRate')::float > 0.6
          GROUP BY generation
          HAVING COUNT(*) > 5
          ORDER BY avg_success_rate DESC
        `);
      });

      expect(result.rows.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // Complex query should execute within 50ms
      
      // Verify aggregation results
      result.rows.forEach(row => {
        expect(row.pattern_count).toBeGreaterThan(5);
        expect(row.avg_success_rate).toBeGreaterThan(0.6);
        expect(row.max_adaptation_rate).toBeGreaterThanOrEqual(row.min_adaptation_rate);
      });
    });
  });
});