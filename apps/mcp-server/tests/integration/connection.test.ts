import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestPool, createTestDb } from '../helpers/db-test-utils';
import pg from 'pg';
import { sql } from 'drizzle-orm';

describe('Database Connection', () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof createTestDb>;

  beforeAll(() => {
    pool = createTestPool();
    db = createTestDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Connection Establishment', () => {
    it('should successfully connect to PostgreSQL', async () => {
      const client = await pool.connect();
      expect(client).toBeDefined();
      client.release();
    });

    it('should execute a simple SELECT 1 query', async () => {
      const result = await pool.query('SELECT 1 as result');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].result).toBe(1);
    });

    it('should verify database name', async () => {
      const result = await pool.query('SELECT current_database()');
      expect(result.rows[0].current_database).toBe(
        process.env.DB_NAME || 'sentra'
      );
    });

    it('should verify connection is alive', async () => {
      const result = await pool.query('SELECT NOW() as time');
      expect(result.rows[0].time).toBeInstanceOf(Date);
    });
  });

  describe('Connection Pool', () => {
    it('should have correct pool configuration', () => {
      expect(pool.options.host).toBe(process.env.DB_HOST || 'localhost');
      expect(pool.options.port).toBe(
        parseInt(process.env.DB_PORT || '5432')
      );
      expect(pool.options.database).toBe(process.env.DB_NAME || 'sentra');
    });

    it('should handle multiple concurrent connections', async () => {
      const promises = Array.from({ length: 5 }, async (_, i) => {
        const result = await pool.query('SELECT $1::int as value', [i]);
        return result.rows[0].value;
      });

      const results = await Promise.all(promises);
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it('should properly release connections back to pool', async () => {
      const client = await pool.connect();
      const initialCount = pool.totalCount;

      client.release();

      // Wait a bit for the connection to be released
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(pool.idleCount).toBeGreaterThan(0);
    });
  });

  describe('Drizzle ORM Integration', () => {
    it('should initialize Drizzle with pool', () => {
      expect(db).toBeDefined();
      expect(typeof db.execute).toBe('function');
      expect(typeof db.select).toBe('function');
    });

    it('should execute raw SQL queries via Drizzle', async () => {
      const result = await db.execute(sql`SELECT 1 + 1 as sum`);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].sum).toBe(2);
    });

    it('should handle parameterized queries', async () => {
      const testValue = 'test-value';
      const result = await db.execute(
        sql`SELECT ${testValue} as value`
      );
      expect(result.rows[0].value).toBe(testValue);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      await expect(async () => {
        await pool.query('INVALID SQL QUERY');
      }).rejects.toThrow();
    });

    it('should handle connection errors', async () => {
      const badPool = new pg.Pool({
        host: 'invalid-host',
        port: 9999,
        user: 'invalid',
        password: 'invalid',
        database: 'invalid',
        connectionTimeoutMillis: 1000,
      });

      await expect(async () => {
        await badPool.query('SELECT 1');
      }).rejects.toThrow();

      await badPool.end();
    });
  });

  describe('PostgreSQL Version', () => {
    it('should retrieve PostgreSQL version', async () => {
      const result = await pool.query('SELECT version()');
      expect(result.rows[0].version).toContain('PostgreSQL');
    });

    it('should verify minimum PostgreSQL version (12+)', async () => {
      const result = await pool.query('SHOW server_version_num');
      const versionNum = parseInt(result.rows[0].server_version_num);
      expect(versionNum).toBeGreaterThanOrEqual(120000); // PostgreSQL 12.0
    });
  });
});
