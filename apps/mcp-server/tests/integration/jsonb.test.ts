import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestPool, createTestDb, cleanDatabase } from '../helpers/db-test-utils';
import { users, projects, tasks, stacks } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import pg from 'pg';

describe('JSONB Operations', () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof createTestDb>;

  beforeAll(() => {
    pool = createTestPool();
    db = createTestDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  describe('Task Metadata JSONB', () => {
    it('should insert task with JSON metadata', async () => {
      // First create required user and project
      const [user] = await db
        .insert(users)
        .values({
          email: 'test@example.com',
          username: 'testuser',
        })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({
          name: 'test-stack',
          version: '1.0.0',
        })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({
          name: 'Test Project',
          ownerId: user.id,
          stackId: stack.id,
        })
        .returning();

      // Insert task with metadata
      const metadata = {
        tags: ['urgent', 'bug-fix'],
        estimatedComplexity: 'medium',
        dependencies: [1, 2, 3],
        customData: {
          nestedField: 'value',
          count: 42,
        },
      };

      const [task] = await db
        .insert(tasks)
        .values({
          projectId: project.id,
          title: 'Test Task',
          description: 'Test Description',
          metadata: JSON.stringify(metadata),
        })
        .returning();

      expect(task).toBeDefined();
      expect(task.metadata).toBe(JSON.stringify(metadata));
    });

    it('should retrieve and parse JSON metadata correctly', async () => {
      // Setup
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id, stackId: stack.id })
        .returning();

      const metadata = {
        priority: 'high',
        labels: ['feature', 'enhancement'],
        estimatedHours: 8,
      };

      await db.insert(tasks).values({
        projectId: project.id,
        title: 'Test Task',
        metadata: JSON.stringify(metadata),
      });

      // Retrieve and verify
      const [retrievedTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.title, 'Test Task'));

      const parsedMetadata = JSON.parse(retrievedTask.metadata || '{}');
      expect(parsedMetadata).toEqual(metadata);
      expect(parsedMetadata.priority).toBe('high');
      expect(parsedMetadata.labels).toEqual(['feature', 'enhancement']);
      expect(parsedMetadata.estimatedHours).toBe(8);
    });

    it('should handle null metadata', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id, stackId: stack.id })
        .returning();

      const [task] = await db
        .insert(tasks)
        .values({
          projectId: project.id,
          title: 'Task Without Metadata',
          metadata: null,
        })
        .returning();

      expect(task.metadata).toBeNull();
    });

    it('should update JSON metadata', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id, stackId: stack.id })
        .returning();

      const initialMetadata = { status: 'draft' };
      const [task] = await db
        .insert(tasks)
        .values({
          projectId: project.id,
          title: 'Test Task',
          metadata: JSON.stringify(initialMetadata),
        })
        .returning();

      // Update metadata
      const updatedMetadata = { status: 'in-progress', progress: 50 };
      await db
        .update(tasks)
        .set({ metadata: JSON.stringify(updatedMetadata) })
        .where(eq(tasks.id, task.id));

      const [updatedTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(JSON.parse(updatedTask.metadata || '{}')).toEqual(updatedMetadata);
    });
  });

  describe('Project Metadata JSONB', () => {
    it('should store complex project metadata', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const projectMetadata = {
        environment: {
          nodeVersion: '18.0.0',
          framework: 'Next.js',
          database: 'PostgreSQL',
        },
        settings: {
          autoDeployment: true,
          branchProtection: ['main', 'develop'],
        },
        statistics: {
          totalCommits: 150,
          contributors: 5,
        },
      };

      const [project] = await db
        .insert(projects)
        .values({
          name: 'Complex Project',
          ownerId: user.id,
          metadata: JSON.stringify(projectMetadata),
        })
        .returning();

      const parsedMeta = JSON.parse(project.metadata || '{}');
      expect(parsedMeta.environment.framework).toBe('Next.js');
      expect(parsedMeta.settings.branchProtection).toHaveLength(2);
      expect(parsedMeta.statistics.totalCommits).toBe(150);
    });
  });

  describe('Stack Metadata JSONB', () => {
    it('should store stack configuration metadata', async () => {
      const stackMetadata = {
        installation: {
          command: 'npm install',
          requiredVersion: '>=16.0.0',
        },
        features: ['TypeScript', 'ESM', 'HMR'],
        benchmarks: {
          buildTime: '2.3s',
          bundleSize: '145kb',
        },
      };

      const [stack] = await db
        .insert(stacks)
        .values({
          name: 'next-stack',
          version: '14.0.0',
          metadata: JSON.stringify(stackMetadata),
        })
        .returning();

      const parsedMeta = JSON.parse(stack.metadata || '{}');
      expect(parsedMeta.features).toContain('TypeScript');
      expect(parsedMeta.benchmarks.buildTime).toBe('2.3s');
    });
  });

  describe('Raw SQL JSONB Operations', () => {
    it('should query JSONB fields using PostgreSQL operators', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id, stackId: stack.id })
        .returning();

      // Insert multiple tasks with different metadata
      await db.insert(tasks).values([
        {
          projectId: project.id,
          title: 'Task 1',
          metadata: JSON.stringify({ priority: 'high', tags: ['urgent'] }),
        },
        {
          projectId: project.id,
          title: 'Task 2',
          metadata: JSON.stringify({ priority: 'low', tags: ['backlog'] }),
        },
      ]);

      // Query using raw SQL with JSONB operators
      const result = await pool.query(
        `SELECT * FROM tasks WHERE metadata::jsonb->>'priority' = $1`,
        ['high']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Task 1');
    });

    it('should handle JSONB array operations', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id, stackId: stack.id })
        .returning();

      await db.insert(tasks).values({
        projectId: project.id,
        title: 'Task with Tags',
        metadata: JSON.stringify({ tags: ['bug', 'critical', 'production'] }),
      });

      // Query for tasks containing a specific tag
      const result = await pool.query(
        `SELECT * FROM tasks WHERE metadata::jsonb->'tags' ? $1`,
        ['critical']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Task with Tags');
    });
  });
});
