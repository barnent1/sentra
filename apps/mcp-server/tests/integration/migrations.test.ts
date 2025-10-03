import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  createTestPool,
  tableExists,
  columnExists,
  getColumnType,
  foreignKeyExists,
  getForeignKeyDetails,
} from '../helpers/db-test-utils';
import pg from 'pg';

describe('Database Migrations', () => {
  let pool: pg.Pool;

  beforeAll(() => {
    pool = createTestPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Table Creation', () => {
    const expectedTables = [
      'users',
      'user_keys',
      'audit_log',
      'stacks',
      'documentation_chunks',
      'projects',
      'worktrees',
      'tasks',
      'workflow_state',
      'logs',
      'agent_prompts',
      'project_prompt_overrides',
      'design_assets',
      'screenshots',
    ];

    expectedTables.forEach((tableName) => {
      it(`should have created ${tableName} table`, async () => {
        const exists = await tableExists(pool, tableName);
        expect(exists).toBe(true);
      });
    });
  });

  describe('Users Table Schema', () => {
    it('should have all required columns', async () => {
      const columns = [
        'id',
        'email',
        'username',
        'displayName',
        'avatarUrl',
        'isActive',
        'role',
        'createdAt',
        'updatedAt',
      ];

      for (const column of columns) {
        const exists = await columnExists(pool, 'users', column);
        expect(exists).toBe(true);
      }
    });

    it('should have correct column types', async () => {
      expect(await getColumnType(pool, 'users', 'id')).toBe('integer');
      expect(await getColumnType(pool, 'users', 'email')).toBe('text');
      expect(await getColumnType(pool, 'users', 'username')).toBe('text');
      expect(await getColumnType(pool, 'users', 'isActive')).toBe('boolean');
    });

    it('should have unique constraints on email and username', async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM information_schema.table_constraints
         WHERE table_name = 'users'
         AND constraint_type = 'UNIQUE'
         AND constraint_name IN ('users_email_unique', 'users_username_unique')`
      );
      expect(parseInt(result.rows[0].count)).toBe(2);
    });
  });

  describe('Projects Table Schema', () => {
    it('should have all required columns', async () => {
      const columns = [
        'id',
        'name',
        'description',
        'ownerId',
        'stackId',
        'repoPath',
        'mainBranch',
        'status',
        'metadata',
        'createdAt',
        'updatedAt',
      ];

      for (const column of columns) {
        const exists = await columnExists(pool, 'projects', column);
        expect(exists).toBe(true);
      }
    });

    it('should have foreign key to users', async () => {
      const hasFk = await foreignKeyExists(pool, 'projects', 'ownerId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(pool, 'projects', 'ownerId');
      expect(fkDetails).toMatchObject({
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      });
    });

    it('should have foreign key to stacks', async () => {
      const hasFk = await foreignKeyExists(pool, 'projects', 'stackId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(pool, 'projects', 'stackId');
      expect(fkDetails).toMatchObject({
        referencedTable: 'stacks',
        referencedColumn: 'id',
        onDelete: 'SET NULL',
      });
    });
  });

  describe('Tasks Table Schema', () => {
    it('should have all required columns including metadata', async () => {
      const columns = [
        'id',
        'projectId',
        'title',
        'description',
        'status',
        'assignedTo',
        'priority',
        'estimatedMinutes',
        'actualMinutes',
        'metadata',
        'createdAt',
        'updatedAt',
        'completedAt',
      ];

      for (const column of columns) {
        const exists = await columnExists(pool, 'tasks', column);
        expect(exists).toBe(true);
      }
    });

    it('should have foreign key to projects with CASCADE', async () => {
      const hasFk = await foreignKeyExists(pool, 'tasks', 'projectId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(pool, 'tasks', 'projectId');
      expect(fkDetails).toMatchObject({
        referencedTable: 'projects',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      });
    });

    it('should have foreign key to users with SET NULL', async () => {
      const hasFk = await foreignKeyExists(pool, 'tasks', 'assignedTo');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(pool, 'tasks', 'assignedTo');
      expect(fkDetails).toMatchObject({
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'SET NULL',
      });
    });
  });

  describe('Documentation Chunks Table Schema', () => {
    it('should have embedding column for vector support', async () => {
      const exists = await columnExists(pool, 'documentation_chunks', 'embedding');
      expect(exists).toBe(true);
    });

    it('should have correct embedding column type', async () => {
      const columnType = await getColumnType(pool, 'documentation_chunks', 'embedding');
      // Should be either 'vector' (custom type) or null if pgvector not installed
      expect(columnType === 'vector' || columnType === null).toBe(true);
    });

    it('should have foreign key to stacks with CASCADE', async () => {
      const hasFk = await foreignKeyExists(pool, 'documentation_chunks', 'stackId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(
        pool,
        'documentation_chunks',
        'stackId'
      );
      expect(fkDetails).toMatchObject({
        referencedTable: 'stacks',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      });
    });
  });

  describe('Auth Tables Schema', () => {
    it('should have user_keys with foreign key to users', async () => {
      const hasFk = await foreignKeyExists(pool, 'user_keys', 'userId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(pool, 'user_keys', 'userId');
      expect(fkDetails).toMatchObject({
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      });
    });

    it('should have audit_log with optional foreign key to users', async () => {
      const hasFk = await foreignKeyExists(pool, 'audit_log', 'userId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(pool, 'audit_log', 'userId');
      expect(fkDetails).toMatchObject({
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'SET NULL',
      });
    });
  });

  describe('Workflow State Table Schema', () => {
    it('should have foreign key to tasks with CASCADE', async () => {
      const hasFk = await foreignKeyExists(pool, 'workflow_state', 'taskId');
      expect(hasFk).toBe(true);

      const fkDetails = await getForeignKeyDetails(
        pool,
        'workflow_state',
        'taskId'
      );
      expect(fkDetails).toMatchObject({
        referencedTable: 'tasks',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      });
    });
  });

  describe('Primary Keys', () => {
    const tablesWithPK = [
      'users',
      'projects',
      'tasks',
      'stacks',
      'documentation_chunks',
      'user_keys',
      'audit_log',
      'workflow_state',
      'logs',
      'agent_prompts',
      'project_prompt_overrides',
      'design_assets',
      'screenshots',
      'worktrees',
    ];

    tablesWithPK.forEach((tableName) => {
      it(`should have primary key on ${tableName}.id`, async () => {
        const result = await pool.query(
          `SELECT COUNT(*) as count
           FROM information_schema.table_constraints
           WHERE table_name = $1
           AND constraint_type = 'PRIMARY KEY'`,
          [tableName]
        );
        expect(parseInt(result.rows[0].count)).toBe(1);
      });
    });
  });

  describe('Default Values', () => {
    it('should have default values for timestamps', async () => {
      const result = await pool.query(
        `SELECT column_name, column_default
         FROM information_schema.columns
         WHERE table_name = 'users'
         AND column_name IN ('createdAt', 'updatedAt')`
      );

      expect(result.rows).toHaveLength(2);
      result.rows.forEach((row) => {
        expect(row.column_default).toContain('now()');
      });
    });

    it('should have default value for isActive', async () => {
      const result = await pool.query(
        `SELECT column_default
         FROM information_schema.columns
         WHERE table_name = 'users'
         AND column_name = 'isActive'`
      );

      expect(result.rows[0].column_default).toBe('true');
    });
  });
});
