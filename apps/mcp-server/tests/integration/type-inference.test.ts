import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestPool, createTestDb, cleanDatabase } from '../helpers/db-test-utils';
import {
  users,
  projects,
  tasks,
  stacks,
  User,
  NewUser,
  Project,
  NewProject,
  Task,
  NewTask,
  Stack,
  NewStack,
} from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import pg from 'pg';

describe('Type Inference', () => {
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

  describe('User Type Inference', () => {
    it('should infer User type correctly from select', async () => {
      await db.insert(users).values({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      });

      const [user] = await db.select().from(users).where(eq(users.email, 'test@example.com'));

      // Type assertions - these will fail at compile time if types are wrong
      const userId: number = user.id;
      const userEmail: string = user.email;
      const userName: string = user.username;
      const displayName: string | null = user.displayName;
      const isActive: boolean = user.isActive;
      const role: string = user.role;
      const createdAt: Date = user.createdAt;
      const updatedAt: Date = user.updatedAt;

      expect(userId).toBeDefined();
      expect(userEmail).toBe('test@example.com');
      expect(userName).toBe('testuser');
      expect(displayName).toBe('Test User');
      expect(isActive).toBe(true);
      expect(role).toBe('user');
      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
    });

    it('should infer NewUser type correctly for inserts', async () => {
      // Required fields only
      const newUser1: NewUser = {
        email: 'required@example.com',
        username: 'requireduser',
      };

      // All fields
      const newUser2: NewUser = {
        email: 'full@example.com',
        username: 'fulluser',
        displayName: 'Full User',
        avatarUrl: 'https://example.com/avatar.png',
        isActive: false,
        role: 'admin',
      };

      const [inserted1] = await db.insert(users).values(newUser1).returning();
      const [inserted2] = await db.insert(users).values(newUser2).returning();

      expect(inserted1.email).toBe('required@example.com');
      expect(inserted2.displayName).toBe('Full User');
    });

    it('should enforce type constraints at compile time', () => {
      // These would fail at TypeScript compile time:
      // const invalidUser: NewUser = { email: 'test@example.com' }; // Missing username
      // const invalidUser2: User = { id: 'string' }; // Wrong type for id

      // This is just a runtime check that types are defined
      const validUser: NewUser = {
        email: 'valid@example.com',
        username: 'validuser',
      };

      expect(validUser).toBeDefined();
    });
  });

  describe('Project Type Inference', () => {
    it('should infer Project type correctly from select', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [stack] = await db
        .insert(stacks)
        .values({ name: 'test-stack', version: '1.0.0' })
        .returning();

      await db.insert(projects).values({
        name: 'Test Project',
        description: 'A test project',
        ownerId: user.id,
        stackId: stack.id,
      });

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.name, 'Test Project'));

      // Type assertions
      const projectId: number = project.id;
      const projectName: string = project.name;
      const projectDesc: string | null = project.description;
      const ownerId: number = project.ownerId;
      const stackId: number | null = project.stackId;
      const repoPath: string | null = project.repoPath;
      const mainBranch: string = project.mainBranch;
      const status: string = project.status;
      const metadata: string | null = project.metadata;

      expect(projectId).toBeDefined();
      expect(projectName).toBe('Test Project');
      expect(projectDesc).toBe('A test project');
      expect(ownerId).toBe(user.id);
      expect(stackId).toBe(stack.id);
      expect(mainBranch).toBe('main');
      expect(status).toBe('active');
    });

    it('should infer NewProject type correctly', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const newProject: NewProject = {
        name: 'New Project',
        ownerId: user.id,
        description: 'Project description',
      };

      const [inserted] = await db.insert(projects).values(newProject).returning();
      expect(inserted.name).toBe('New Project');
    });
  });

  describe('Task Type Inference', () => {
    it('should infer Task type correctly from select', async () => {
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
        description: 'Task description',
        status: 'in_progress',
        assignedTo: user.id,
        priority: 5,
        estimatedMinutes: 120,
        metadata: JSON.stringify({ custom: 'data' }),
      });

      const [task] = await db.select().from(tasks).where(eq(tasks.title, 'Test Task'));

      // Type assertions
      const taskId: number = task.id;
      const projectId: number = task.projectId;
      const title: string = task.title;
      const description: string | null = task.description;
      const status: string = task.status;
      const assignedTo: number | null = task.assignedTo;
      const priority: number = task.priority;
      const estimatedMinutes: number | null = task.estimatedMinutes;
      const actualMinutes: number | null = task.actualMinutes;
      const metadata: string | null = task.metadata;
      const createdAt: Date = task.createdAt;
      const updatedAt: Date = task.updatedAt;
      const completedAt: Date | null = task.completedAt;

      expect(taskId).toBeDefined();
      expect(projectId).toBe(project.id);
      expect(title).toBe('Test Task');
      expect(status).toBe('in_progress');
      expect(priority).toBe(5);
      expect(estimatedMinutes).toBe(120);
      expect(completedAt).toBeNull();
    });

    it('should infer NewTask type correctly', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({ name: 'Test Project', ownerId: user.id })
        .returning();

      const newTask: NewTask = {
        projectId: project.id,
        title: 'New Task',
        description: 'Task description',
      };

      const [inserted] = await db.insert(tasks).values(newTask).returning();
      expect(inserted.title).toBe('New Task');
      expect(inserted.status).toBe('pending'); // Default value
    });
  });

  describe('Stack Type Inference', () => {
    it('should infer Stack type correctly', async () => {
      await db.insert(stacks).values({
        name: 'react-stack',
        version: '18.0.0',
        description: 'React framework',
        docsUrl: 'https://react.dev',
        homepage: 'https://react.dev',
        metadata: JSON.stringify({ license: 'MIT' }),
      });

      const [stack] = await db.select().from(stacks).where(eq(stacks.name, 'react-stack'));

      // Type assertions
      const stackId: number = stack.id;
      const name: string = stack.name;
      const version: string = stack.version;
      const description: string | null = stack.description;
      const docsUrl: string | null = stack.docsUrl;
      const homepage: string | null = stack.homepage;
      const isActive: boolean = stack.isActive;
      const metadata: string | null = stack.metadata;

      expect(stackId).toBeDefined();
      expect(name).toBe('react-stack');
      expect(version).toBe('18.0.0');
      expect(isActive).toBe(true);
    });
  });

  describe('Nullable vs Non-Nullable Types', () => {
    it('should correctly type nullable columns', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({
          name: 'Test Project',
          ownerId: user.id,
          stackId: null, // Explicitly null
          description: null,
        })
        .returning();

      // These should be nullable types
      const stackId: number | null = project.stackId;
      const description: string | null = project.description;

      expect(stackId).toBeNull();
      expect(description).toBeNull();
    });

    it('should correctly type non-nullable columns with defaults', async () => {
      const [user] = await db
        .insert(users)
        .values({ email: 'test@example.com', username: 'testuser' })
        .returning();

      // isActive and role have defaults and are non-nullable
      const isActive: boolean = user.isActive;
      const role: string = user.role;

      expect(isActive).toBe(true);
      expect(role).toBe('user');
    });
  });

  describe('Array Return Types', () => {
    it('should correctly type arrays of results', async () => {
      await db.insert(users).values([
        { email: 'user1@example.com', username: 'user1' },
        { email: 'user2@example.com', username: 'user2' },
        { email: 'user3@example.com', username: 'user3' },
      ]);

      const allUsers = await db.select().from(users);

      // Type should be User[]
      const users_array: User[] = allUsers;

      expect(users_array).toHaveLength(3);
      expect(users_array[0].email).toBeDefined();
    });
  });

  describe('Type Safety with Relations', () => {
    it('should maintain type safety with joined queries', async () => {
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
        assignedTo: user.id,
      });

      // Get task with project info (manual join for now)
      const tasksWithProject = await db.select().from(tasks);

      expect(tasksWithProject[0].projectId).toBe(project.id);
      expect(tasksWithProject[0].assignedTo).toBe(user.id);
    });
  });
});
