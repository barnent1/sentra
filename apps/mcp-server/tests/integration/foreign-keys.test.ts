import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestPool, createTestDb, cleanDatabase } from '../helpers/db-test-utils';
import {
  users,
  projects,
  tasks,
  stacks,
  documentationChunks,
  userKeys,
  worktrees,
  workflowState,
} from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import pg from 'pg';

describe('Foreign Key Relationships', () => {
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

  describe('CASCADE Deletions', () => {
    it('should CASCADE delete user_keys when user is deleted', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      await db.insert(userKeys).values({
        userId: user.id,
        provider: 'github',
        providerUserId: 'github123',
      });

      // Verify user key exists
      let keys = await db.select().from(userKeys).where(eq(userKeys.userId, user.id));
      expect(keys).toHaveLength(1);

      // Delete user
      await db.delete(users).where(eq(users.id, user.id));

      // Verify CASCADE deletion
      keys = await db.select().from(userKeys).where(eq(userKeys.userId, user.id));
      expect(keys).toHaveLength(0);
    });

    it('should CASCADE delete projects when user is deleted', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      await db.insert(projects).values({
        name: 'Test Project',
        ownerId: user.id,
      });

      // Verify project exists
      let userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.ownerId, user.id));
      expect(userProjects).toHaveLength(1);

      // Delete user
      await db.delete(users).where(eq(users.id, user.id));

      // Verify CASCADE deletion
      userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.ownerId, user.id));
      expect(userProjects).toHaveLength(0);
    });

    it('should CASCADE delete tasks when project is deleted', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id })
        .returning();

      await db.insert(tasks).values({
        projectId: project.id,
        title: 'Test Task',
      });

      // Verify task exists
      let projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id));
      expect(projectTasks).toHaveLength(1);

      // Delete project
      await db.delete(projects).where(eq(projects.id, project.id));

      // Verify CASCADE deletion
      projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id));
      expect(projectTasks).toHaveLength(0);
    });

    it('should CASCADE delete worktrees when project is deleted', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id })
        .returning();

      await db.insert(worktrees).values({
        projectId: project.id,
        path: '/path/to/worktree',
        branch: 'feature-branch',
      });

      // Verify worktree exists
      let projectWorktrees = await db
        .select()
        .from(worktrees)
        .where(eq(worktrees.projectId, project.id));
      expect(projectWorktrees).toHaveLength(1);

      // Delete project
      await db.delete(projects).where(eq(projects.id, project.id));

      // Verify CASCADE deletion
      projectWorktrees = await db
        .select()
        .from(worktrees)
        .where(eq(worktrees.projectId, project.id));
      expect(projectWorktrees).toHaveLength(0);
    });

    it('should CASCADE delete workflow_state when task is deleted', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id })
        .returning();

      const [task] = await db
        .insert(tasks)
        .values({ projectId: project.id, title: 'Test Task' })
        .returning();

      await db.insert(workflowState).values({
        taskId: task.id,
        phase: 'CODE',
        step: 'implementation',
        state: 'in_progress',
      });

      // Verify workflow state exists
      let taskWorkflow = await db
        .select()
        .from(workflowState)
        .where(eq(workflowState.taskId, task.id));
      expect(taskWorkflow).toHaveLength(1);

      // Delete task
      await db.delete(tasks).where(eq(tasks.id, task.id));

      // Verify CASCADE deletion
      taskWorkflow = await db
        .select()
        .from(workflowState)
        .where(eq(workflowState.taskId, task.id));
      expect(taskWorkflow).toHaveLength(0);
    });

    it('should CASCADE delete documentation_chunks when stack is deleted', async () => {
      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      await db.insert(documentationChunks).values({
        stackId: stack.id,
        content: 'Test documentation content',
        chunkIndex: 0,
      });

      // Verify chunk exists
      let chunks = await db
        .select()
        .from(documentationChunks)
        .where(eq(documentationChunks.stackId, stack.id));
      expect(chunks).toHaveLength(1);

      // Delete stack
      await db.delete(stacks).where(eq(stacks.id, stack.id));

      // Verify CASCADE deletion
      chunks = await db
        .select()
        .from(documentationChunks)
        .where(eq(documentationChunks.stackId, stack.id));
      expect(chunks).toHaveLength(0);
    });
  });

  describe('SET NULL Deletions', () => {
    it('should SET NULL on tasks.assignedTo when user is deleted', async () => {
      const [owner] = await db
        .insert(users)
        .values({ email: 'owner@example.com', username: 'owner' })
        .returning();

      const [assignee] = await db
        .insert(users)
        .values({ email: 'assignee@example.com', username: 'assignee' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: owner.id })
        .returning();

      const [task] = await db
        .insert(tasks)
        .values({
          projectId: project.id,
          title: 'Test Task',
          assignedTo: assignee.id,
        })
        .returning();

      expect(task.assignedTo).toBe(assignee.id);

      // Delete assignee
      await db.delete(users).where(eq(users.id, assignee.id));

      // Verify assignedTo is set to NULL
      const [updatedTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
      expect(updatedTask.assignedTo).toBeNull();
    });

    it('should SET NULL on projects.stackId when stack is deleted', async () => {
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
        .values({
          name: 'Test Project',
          ownerId: user.id,
          stackId: stack.id,
        })
        .returning();

      expect(project.stackId).toBe(stack.id);

      // Delete stack
      await db.delete(stacks).where(eq(stacks.id, stack.id));

      // Verify stackId is set to NULL
      const [updatedProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, project.id));
      expect(updatedProject.stackId).toBeNull();
    });
  });

  describe('Referential Integrity', () => {
    it('should prevent creating task with non-existent projectId', async () => {
      await expect(async () => {
        await db.insert(tasks).values({
          projectId: 99999, // Non-existent project
          title: 'Invalid Task',
        });
      }).rejects.toThrow();
    });

    it('should prevent creating project with non-existent ownerId', async () => {
      await expect(async () => {
        await db.insert(projects).values({
          name: 'Invalid Project',
          ownerId: 99999, // Non-existent user
        });
      }).rejects.toThrow();
    });

    it('should prevent creating user_key with non-existent userId', async () => {
      await expect(async () => {
        await db.insert(userKeys).values({
          userId: 99999, // Non-existent user
          provider: 'github',
          providerUserId: 'test123',
        });
      }).rejects.toThrow();
    });
  });

  describe('Complex Cascade Chains', () => {
    it('should CASCADE through user -> project -> task -> workflow_state', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id })
        .returning();

      const [task] = await db
        .insert(tasks)
        .values({ projectId: project.id, title: 'Test Task' })
        .returning();

      await db.insert(workflowState).values({
        taskId: task.id,
        phase: 'CODE',
        step: 'implementation',
        state: 'in_progress',
      });

      // Verify all exist
      expect(await db.select().from(users).where(eq(users.id, user.id))).toHaveLength(1);
      expect(
        await db.select().from(projects).where(eq(projects.id, project.id))
      ).toHaveLength(1);
      expect(await db.select().from(tasks).where(eq(tasks.id, task.id))).toHaveLength(1);
      expect(
        await db.select().from(workflowState).where(eq(workflowState.taskId, task.id))
      ).toHaveLength(1);

      // Delete user - should cascade through all
      await db.delete(users).where(eq(users.id, user.id));

      // Verify all are deleted
      expect(await db.select().from(users).where(eq(users.id, user.id))).toHaveLength(0);
      expect(
        await db.select().from(projects).where(eq(projects.id, project.id))
      ).toHaveLength(0);
      expect(await db.select().from(tasks).where(eq(tasks.id, task.id))).toHaveLength(0);
      expect(
        await db.select().from(workflowState).where(eq(workflowState.taskId, task.id))
      ).toHaveLength(0);
    });
  });
});
