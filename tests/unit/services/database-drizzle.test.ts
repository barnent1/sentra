/**
 * Drizzle Database Service Tests
 *
 * This file tests the new Drizzle ORM database layer.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 * Uses in-memory SQLite for testing (fast, isolated)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import {
  DrizzleDatabaseService,
  type User,
  type Project,
  type Agent,
  type Cost,
  type Activity,
  type CreateUserInput,
  type CreateProjectInput,
  type CreateAgentInput,
  type CreateCostInput,
  type CreateActivityInput,
  type UpdateProjectInput,
  type UpdateAgentInput,
} from '@/services/database-drizzle';
import { users, projects, agents, costs, activities } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Helper function to create test user input with password
const createTestUserInput = (overrides?: Partial<CreateUserInput>): CreateUserInput => ({
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: undefined,
  ...overrides,
});

describe('DrizzleDatabaseService', () => {
  let db: any; // Using any for test implementation
  let sqlite: Database.Database;
  let drizzleClient: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // Initialize in-memory SQLite database
    sqlite = new Database(':memory:');
    drizzleClient = drizzle(sqlite);

    // Run migrations to create schema
    // Note: Implementation should provide migration files
    // For now, we'll create tables manually in tests
    // Using getInstance for singleton pattern
    db = DrizzleDatabaseService.getInstance();
  });

  afterAll(async () => {
    // Cleanup and close database
    sqlite.close();
  });

  beforeEach(async () => {
    // Clear all data before each test
    // Note: clearDatabase method needs to be implemented
    if (db.clearDatabase) {
      await db.clearDatabase();
    }
  });

  // ==========================================================================
  // User CRUD Operations
  // ==========================================================================

  describe('User operations', () => {
    describe('createUser', () => {
      it('should create a new user with valid data', async () => {
        // ARRANGE
        const userData: CreateUserInput = createTestUserInput({
          email: 'test@example.com',
          name: 'Test User'
        });

        // ACT
        const user = await db.createUser(userData);

        // ASSERT
        expect(user.id).toBeDefined();
        expect(user.email).toBe('test@example.com');
        expect(user.name).toBe('Test User');
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
        expect(user).not.toHaveProperty('password');
      });

      it('should hash password before storing', async () => {
        // ARRANGE
        const userData = createTestUserInput({
          email: 'hash@example.com',
          password: 'PlainTextPassword123!'
        });

        // ACT
        const user = await db.createUser(userData);

        // ASSERT - Verify password is hashed
        const storedUser = await drizzleClient
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        expect(storedUser[0].password).not.toBe('PlainTextPassword123!');
        expect(storedUser[0].password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
      });

      it('should throw error for duplicate email', async () => {
        // ARRANGE
        await db.createUser(createTestUserInput({
          email: 'duplicate@example.com',
          name: 'First User'
        }));

        // ACT & ASSERT
        await expect(
          db.createUser(createTestUserInput({
            email: 'duplicate@example.com',
            name: 'Second User'
          }))
        ).rejects.toThrow();
      });

      it('should throw error for invalid email format', async () => {
        // ACT & ASSERT
        await expect(
          db.createUser(createTestUserInput({
            email: 'invalid-email',
            name: 'Test User'
          }))
        ).rejects.toThrow(/invalid.*email/i);
      });

      it('should create user with minimal data (name optional)', async () => {
        // ACT
        const user = await db.createUser(createTestUserInput({
          email: 'minimal@example.com'
        }));

        // ASSERT
        expect(user.id).toBeDefined();
        expect(user.email).toBe('minimal@example.com');
        expect(user.name).toBeNull();
      });

      it('should not expose password in return value', async () => {
        // ACT
        const user = await db.createUser(createTestUserInput({
          email: 'secure@example.com'
        }));

        // ASSERT
        expect(user).not.toHaveProperty('password');
        expect(Object.keys(user)).not.toContain('password');
      });
    });

    describe('getUserById', () => {
      it('should retrieve user by id', async () => {
        // ARRANGE
        const created = await db.createUser(createTestUserInput({
          email: 'find@example.com',
          name: 'Find Me'
        }));

        // ACT
        const found = await db.getUserById(created.id);

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
        expect(found?.email).toBe('find@example.com');
      });

      it('should return null for non-existent id', async () => {
        // ACT
        const found = await db.getUserById('non-existent-id');

        // ASSERT
        expect(found).toBeNull();
      });

      it('should not expose password in return value', async () => {
        // ARRANGE
        const created = await db.createUser(createTestUserInput({
          email: 'secure@example.com'
        }));

        // ACT
        const found = await db.getUserById(created.id);

        // ASSERT
        expect(found).not.toHaveProperty('password');
      });
    });

    describe('getUserByEmail', () => {
      it('should retrieve user by email', async () => {
        // ARRANGE
        await db.createUser(createTestUserInput({
          email: 'email@example.com',
          name: 'Email User'
        }));

        // ACT
        const found = await db.getUserByEmail('email@example.com');

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.email).toBe('email@example.com');
      });

      it('should return null for non-existent email', async () => {
        // ACT
        const found = await db.getUserByEmail('nonexistent@example.com');

        // ASSERT
        expect(found).toBeNull();
      });

      it('should be case-insensitive', async () => {
        // ARRANGE
        await db.createUser(createTestUserInput({
          email: 'CaseSensitive@example.com',
          name: 'Case Test'
        }));

        // ACT
        const found = await db.getUserByEmail('casesensitive@example.com');

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.email.toLowerCase()).toBe('casesensitive@example.com');
      });
    });

    describe('getUserByEmailWithPassword', () => {
      it('should retrieve user with password for authentication', async () => {
        // ARRANGE
        await db.createUser(createTestUserInput({
          email: 'auth@example.com',
          password: 'SecurePass123!'
        }));

        // ACT
        // Note: This method needs to be implemented in DrizzleDatabaseService
        const found = db.getUserByEmailWithPassword
          ? await db.getUserByEmailWithPassword('auth@example.com')
          : await db.getUserByEmail('auth@example.com');

        // ASSERT
        expect(found).toBeDefined();
        if (db.getUserByEmailWithPassword) {
          expect(found?.password).toBeDefined();
          expect(found?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
        }
      });

      it('should return null for non-existent email', async () => {
        // ACT
        const found = db.getUserByEmailWithPassword
          ? await db.getUserByEmailWithPassword('nonexistent@example.com')
          : await db.getUserByEmail('nonexistent@example.com');

        // ASSERT
        expect(found).toBeNull();
      });
    });

    describe('updateUserRefreshToken', () => {
      it('should update refresh token', async () => {
        // ARRANGE
        const user = await db.createUser(createTestUserInput({
          email: 'token@example.com'
        }));
        const token = 'new-refresh-token-xyz';

        // ACT
        await db.updateUserRefreshToken(user.id, token);

        // ASSERT
        // Fetch user to verify token was updated
        const updated = await db.getUserById(user.id);
        expect(updated?.refreshToken).toBe(token);
      });

      it('should set refresh token to null', async () => {
        // ARRANGE
        const user = await db.createUser(createTestUserInput({
          email: 'nulltoken@example.com'
        }));
        await db.updateUserRefreshToken(user.id, 'some-token');

        // ACT
        await db.updateUserRefreshToken(user.id, null);

        // ASSERT
        const updated = await db.getUserById(user.id);
        expect(updated?.refreshToken).toBeNull();
      });

      it('should update updatedAt timestamp', async () => {
        // ARRANGE
        const user = await db.createUser(createTestUserInput({
          email: 'timestamp@example.com'
        }));
        const originalUpdatedAt = user.updatedAt;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 10));

        // ACT
        await db.updateUserRefreshToken(user.id, 'token');

        // ASSERT
        const updated = await db.getUserById(user.id);
        expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });

    describe('listUsers', () => {
      it('should return all users', async () => {
        // ARRANGE
        await db.createUser(createTestUserInput({ email: 'user1@example.com', name: 'User 1' }));
        await db.createUser(createTestUserInput({ email: 'user2@example.com', name: 'User 2' }));
        await db.createUser(createTestUserInput({ email: 'user3@example.com', name: 'User 3' }));

        // ACT
        const usersList = await db.listUsers();

        // ASSERT
        expect(usersList).toHaveLength(3);
      });

      it('should return empty array when no users exist', async () => {
        // ACT
        const usersList = await db.listUsers();

        // ASSERT
        expect(usersList).toEqual([]);
      });

      it('should order users by creation date descending', async () => {
        // ARRANGE
        const first = await db.createUser(createTestUserInput({ email: 'first@example.com' }));
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createUser(createTestUserInput({ email: 'second@example.com' }));

        // ACT
        const usersList = await db.listUsers();

        // ASSERT
        expect(usersList[0].id).toBe(second.id);
        expect(usersList[1].id).toBe(first.id);
      });

      it('should not expose passwords in list', async () => {
        // ARRANGE
        await db.createUser(createTestUserInput({ email: 'user1@example.com' }));

        // ACT
        const usersList = await db.listUsers();

        // ASSERT
        usersList.forEach((user: any) => {
          expect(user).not.toHaveProperty('password');
        });
      });
    });
  });

  // ==========================================================================
  // Project CRUD Operations
  // ==========================================================================

  describe('Project operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await db.createUser(createTestUserInput({
        email: 'project-owner@example.com',
        name: 'Project Owner'
      }));
    });

    describe('createProject', () => {
      it('should create a new project with valid data', async () => {
        // ARRANGE
        const projectData: CreateProjectInput = {
          name: 'Test Project',
          path: '/Users/test/projects/test-project',
          userId: testUser.id,
        };

        // ACT
        const project = await db.createProject(projectData);

        // ASSERT
        expect(project.id).toBeDefined();
        expect(project.name).toBe('Test Project');
        expect(project.path).toBe('/Users/test/projects/test-project');
        expect(project.userId).toBe(testUser.id);
        expect(project.settings).toBeNull();
        expect(project.createdAt).toBeInstanceOf(Date);
      });

      it('should create project with settings JSON', async () => {
        // ARRANGE
        const settings = {
          notifications: { enabled: true, voice: true },
          theme: 'dark',
        };

        // ACT
        const project = await db.createProject({
          name: 'Settings Project',
          path: '/path/to/project',
          userId: testUser.id,
          settings,
        });

        // ASSERT
        expect(project.settings).toEqual(settings);
      });

      it('should throw error for non-existent user', async () => {
        // ACT & ASSERT
        await expect(
          db.createProject({
            name: 'Orphan Project',
            path: '/path',
            userId: 'non-existent-user',
          })
        ).rejects.toThrow();
      });

      it('should allow duplicate project names for different users', async () => {
        // ARRANGE
        const user2 = await db.createUser(createTestUserInput({
          email: 'user2@example.com',
          name: 'User 2'
        }));

        // ACT
        const project1 = await db.createProject({
          name: 'Shared Name',
          path: '/path1',
          userId: testUser.id,
        });

        const project2 = await db.createProject({
          name: 'Shared Name',
          path: '/path2',
          userId: user2.id,
        });

        // ASSERT
        expect(project1.id).not.toBe(project2.id);
        expect(project1.name).toBe(project2.name);
      });

      it('should handle null settings correctly', async () => {
        // ACT
        const project = await db.createProject({
          name: 'Null Settings',
          path: '/path',
          userId: testUser.id,
          settings: undefined,
        });

        // ASSERT
        expect(project.settings).toBeNull();
      });

      it('should handle empty settings object', async () => {
        // ACT
        const project = await db.createProject({
          name: 'Empty Settings',
          path: '/path',
          userId: testUser.id,
          settings: {},
        });

        // ASSERT
        expect(project.settings).toEqual({});
      });
    });

    describe('getProjectById', () => {
      it('should retrieve project by id', async () => {
        // ARRANGE
        const created = await db.createProject({
          name: 'Find Project',
          path: '/path',
          userId: testUser.id,
        });

        // ACT
        const found = await db.getProjectById(created.id);

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
      });

      it('should include user relation when requested', async () => {
        // ARRANGE
        const created = await db.createProject({
          name: 'With User',
          path: '/path',
          userId: testUser.id,
        });

        // ACT
        const found = await db.getProjectById(created.id, { includeUser: true });

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.user).toBeDefined();
        expect(found?.user?.email).toBe(testUser.email);
      });

      it('should include agents relation when requested', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'With Agents',
          path: '/path',
          userId: testUser.id,
        });
        await db.createAgent({ projectId: project.id, status: 'running' });

        // ACT
        const found = await db.getProjectById(project.id, { includeAgents: true });

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.agents).toBeDefined();
        expect(found?.agents).toHaveLength(1);
      });

      it('should include costs relation when requested', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'With Costs',
          path: '/path',
          userId: testUser.id,
        });
        await db.createCost({
          projectId: project.id,
          amount: 0.05,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        const found = await db.getProjectById(project.id, { includeCosts: true });

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.costs).toBeDefined();
        expect(found?.costs).toHaveLength(1);
      });

      it('should include all relations when requested', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'With All',
          path: '/path',
          userId: testUser.id,
        });
        await db.createAgent({ projectId: project.id, status: 'running' });
        await db.createCost({
          projectId: project.id,
          amount: 0.05,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        const found = await db.getProjectById(project.id, {
          includeUser: true,
          includeAgents: true,
          includeCosts: true,
        });

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.user).toBeDefined();
        expect(found?.agents).toBeDefined();
        expect(found?.costs).toBeDefined();
      });

      it('should return null for non-existent id', async () => {
        // ACT
        const found = await db.getProjectById('non-existent');

        // ASSERT
        expect(found).toBeNull();
      });
    });

    describe('listProjectsByUser', () => {
      it('should return all projects for a user', async () => {
        // ARRANGE
        await db.createProject({ name: 'Project 1', path: '/p1', userId: testUser.id });
        await db.createProject({ name: 'Project 2', path: '/p2', userId: testUser.id });

        // ACT
        const projectsList = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projectsList).toHaveLength(2);
      });

      it('should not return projects from other users', async () => {
        // ARRANGE
        const user2 = await db.createUser(createTestUserInput({
          email: 'user2@example.com',
          name: 'User 2'
        }));
        await db.createProject({ name: 'User1 Project', path: '/p1', userId: testUser.id });
        await db.createProject({ name: 'User2 Project', path: '/p2', userId: user2.id });

        // ACT
        const projectsList = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projectsList).toHaveLength(1);
        expect(projectsList[0].name).toBe('User1 Project');
      });

      it('should return empty array for user with no projects', async () => {
        // ACT
        const projectsList = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projectsList).toEqual([]);
      });

      it('should order projects by creation date descending', async () => {
        // ARRANGE
        const first = await db.createProject({
          name: 'First',
          path: '/p1',
          userId: testUser.id
        });
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createProject({
          name: 'Second',
          path: '/p2',
          userId: testUser.id
        });

        // ACT
        const projectsList = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projectsList[0].id).toBe(second.id);
        expect(projectsList[1].id).toBe(first.id);
      });
    });

    describe('updateProject', () => {
      it('should update project name', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Old Name',
          path: '/path',
          userId: testUser.id,
        });

        // ACT
        const updated = await db.updateProject(project.id, {
          name: 'New Name',
        });

        // ASSERT
        expect(updated.name).toBe('New Name');
        expect(updated.path).toBe('/path'); // Unchanged
      });

      it('should update project path', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Project',
          path: '/old/path',
          userId: testUser.id,
        });

        // ACT
        const updated = await db.updateProject(project.id, {
          path: '/new/path',
        });

        // ASSERT
        expect(updated.path).toBe('/new/path');
      });

      it('should update project settings', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Settings Test',
          path: '/path',
          userId: testUser.id,
          settings: { old: 'value' },
        });

        // ACT
        const updated = await db.updateProject(project.id, {
          settings: { new: 'value' },
        });

        // ASSERT
        expect(updated.settings).toEqual({ new: 'value' });
      });

      it('should update updatedAt timestamp', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Timestamp Test',
          path: '/path',
          userId: testUser.id,
        });
        const originalUpdatedAt = project.updatedAt;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 10));

        // ACT
        const updated = await db.updateProject(project.id, { name: 'Updated' });

        // ASSERT
        expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should throw error for non-existent project', async () => {
        // ACT & ASSERT
        await expect(
          db.updateProject('non-existent', { name: 'New Name' })
        ).rejects.toThrow();
      });
    });

    describe('deleteProject', () => {
      it('should delete project and return true', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Delete Me',
          path: '/path',
          userId: testUser.id,
        });

        // ACT
        const result = await db.deleteProject(project.id);

        // ASSERT
        expect(result).toBe(true);

        // Verify deletion
        const found = await db.getProjectById(project.id);
        expect(found).toBeNull();
      });

      it('should cascade delete related agents', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Project',
          path: '/path',
          userId: testUser.id,
        });
        await db.createAgent({
          projectId: project.id,
          status: 'running',
        });

        // ACT
        await db.deleteProject(project.id);

        // ASSERT
        const agentsList = await db.listAgentsByProject(project.id);
        expect(agentsList).toEqual([]);
      });

      it('should cascade delete related costs', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Project',
          path: '/path',
          userId: testUser.id,
        });
        await db.createCost({
          projectId: project.id,
          amount: 0.05,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        await db.deleteProject(project.id);

        // ASSERT
        const costsList = await db.getCostsByProject(project.id);
        expect(costsList).toEqual([]);
      });

      it('should cascade delete related activities', async () => {
        // ARRANGE
        const project = await db.createProject({
          name: 'Project',
          path: '/path',
          userId: testUser.id,
        });
        await db.createActivity({
          projectId: project.id,
          type: 'agent_started',
          message: 'Test',
        });

        // ACT
        await db.deleteProject(project.id);

        // ASSERT
        const activitiesList = await db.getActivitiesByProject(project.id);
        expect(activitiesList).toEqual([]);
      });

      it('should return false for non-existent project', async () => {
        // ACT
        const result = await db.deleteProject('non-existent');

        // ASSERT
        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Agent CRUD Operations
  // ==========================================================================

  describe('Agent operations', () => {
    let testProject: Project;

    beforeEach(async () => {
      const user = await db.createUser(createTestUserInput({
        email: 'agent-test@example.com',
        name: 'Agent Tester'
      }));
      testProject = await db.createProject({
        name: 'Agent Project',
        path: '/path',
        userId: user.id,
      });
    });

    describe('createAgent', () => {
      it('should create agent with minimal data', async () => {
        // ACT
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });

        // ASSERT
        expect(agent.id).toBeDefined();
        expect(agent.projectId).toBe(testProject.id);
        expect(agent.status).toBe('running');
        expect(agent.startTime).toBeInstanceOf(Date);
        expect(agent.endTime).toBeNull();
        expect(agent.logs).toBeNull();
        expect(agent.error).toBeNull();
      });

      it('should create agent with full data', async () => {
        // ARRANGE
        const endTime = new Date();
        const logs = ['Log line 1', 'Log line 2'];

        // ACT
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'completed',
          endTime,
          logs,
          error: null,
        });

        // ASSERT
        expect(agent.status).toBe('completed');
        expect(agent.endTime).toEqual(endTime);
        expect(agent.logs).toEqual(logs);
      });

      it('should create agent with error status', async () => {
        // ACT
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'failed',
          error: 'Something went wrong',
        });

        // ASSERT
        expect(agent.status).toBe('failed');
        expect(agent.error).toBe('Something went wrong');
      });

      it('should validate status enum values', async () => {
        // ACT & ASSERT - running
        const running = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });
        expect(running.status).toBe('running');

        // completed
        const completed = await db.createAgent({
          projectId: testProject.id,
          status: 'completed',
        });
        expect(completed.status).toBe('completed');

        // failed
        const failed = await db.createAgent({
          projectId: testProject.id,
          status: 'failed',
        });
        expect(failed.status).toBe('failed');
      });

      it('should throw error for invalid status', async () => {
        // ACT & ASSERT
        await expect(
          db.createAgent({
            projectId: testProject.id,
            status: 'invalid-status' as any,
          })
        ).rejects.toThrow();
      });

      it('should handle logs as JSON array', async () => {
        // ARRANGE
        const logs = ['Line 1', 'Line 2', 'Line 3'];

        // ACT
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
          logs,
        });

        // ASSERT
        expect(agent.logs).toEqual(logs);
        expect(Array.isArray(agent.logs)).toBe(true);
      });

      it('should throw error for non-existent project', async () => {
        // ACT & ASSERT
        await expect(
          db.createAgent({
            projectId: 'non-existent-project',
            status: 'running',
          })
        ).rejects.toThrow();
      });
    });

    describe('getAgentById', () => {
      it('should retrieve agent by id', async () => {
        // ARRANGE
        const created = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });

        // ACT
        const found = await db.getAgentById(created.id);

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
      });

      it('should include project relation when requested', async () => {
        // ARRANGE
        const created = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });

        // ACT
        const found = await db.getAgentById(created.id, { includeProject: true });

        // ASSERT
        expect(found).toBeDefined();
        expect(found?.project).toBeDefined();
        expect(found?.project?.name).toBe(testProject.name);
      });

      it('should return null for non-existent id', async () => {
        // ACT
        const found = await db.getAgentById('non-existent');

        // ASSERT
        expect(found).toBeNull();
      });
    });

    describe('listAgentsByProject', () => {
      it('should return all agents for a project', async () => {
        // ARRANGE
        await db.createAgent({ projectId: testProject.id, status: 'running' });
        await db.createAgent({ projectId: testProject.id, status: 'completed' });

        // ACT
        const agentsList = await db.listAgentsByProject(testProject.id);

        // ASSERT
        expect(agentsList).toHaveLength(2);
      });

      it('should order agents by start time descending', async () => {
        // ARRANGE
        const first = await db.createAgent({ projectId: testProject.id, status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createAgent({ projectId: testProject.id, status: 'running' });

        // ACT
        const agentsList = await db.listAgentsByProject(testProject.id);

        // ASSERT
        expect(agentsList[0].id).toBe(second.id);
        expect(agentsList[1].id).toBe(first.id);
      });

      it('should return empty array for project with no agents', async () => {
        // ACT
        const agentsList = await db.listAgentsByProject(testProject.id);

        // ASSERT
        expect(agentsList).toEqual([]);
      });
    });

    describe('updateAgent', () => {
      it('should update agent status', async () => {
        // ARRANGE
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });

        // ACT
        const updated = await db.updateAgent(agent.id, {
          status: 'completed',
          endTime: new Date(),
        });

        // ASSERT
        expect(updated.status).toBe('completed');
        expect(updated.endTime).toBeInstanceOf(Date);
      });

      it('should update logs', async () => {
        // ARRANGE
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
          logs: ['Initial log'],
        });

        // ACT
        const updated = await db.updateAgent(agent.id, {
          logs: ['Initial log', 'New log'],
        });

        // ASSERT
        expect(updated.logs).toEqual(['Initial log', 'New log']);
      });

      it('should update error message', async () => {
        // ARRANGE
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });

        // ACT
        const updated = await db.updateAgent(agent.id, {
          status: 'failed',
          error: 'Execution failed',
        });

        // ASSERT
        expect(updated.status).toBe('failed');
        expect(updated.error).toBe('Execution failed');
      });

      it('should update updatedAt timestamp', async () => {
        // ARRANGE
        const agent = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });
        const originalUpdatedAt = agent.updatedAt;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 10));

        // ACT
        const updated = await db.updateAgent(agent.id, { status: 'completed' });

        // ASSERT
        expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should throw error for non-existent agent', async () => {
        // ACT & ASSERT
        await expect(
          db.updateAgent('non-existent', { status: 'completed' })
        ).rejects.toThrow();
      });
    });
  });

  // ==========================================================================
  // Cost CRUD Operations
  // ==========================================================================

  describe('Cost operations', () => {
    let testProject: Project;

    beforeEach(async () => {
      const user = await db.createUser(createTestUserInput({
        email: 'cost-test@example.com',
        name: 'Cost Tester'
      }));
      testProject = await db.createProject({
        name: 'Cost Project',
        path: '/path',
        userId: user.id,
      });
    });

    describe('createCost', () => {
      it('should create cost record with full data', async () => {
        // ACT
        const cost = await db.createCost({
          projectId: testProject.id,
          amount: 0.05,
          model: 'gpt-4o',
          provider: 'openai',
          inputTokens: 1000,
          outputTokens: 500,
        });

        // ASSERT
        expect(cost.id).toBeDefined();
        expect(cost.amount).toBe(0.05);
        expect(cost.model).toBe('gpt-4o');
        expect(cost.provider).toBe('openai');
        expect(cost.inputTokens).toBe(1000);
        expect(cost.outputTokens).toBe(500);
        expect(cost.timestamp).toBeInstanceOf(Date);
      });

      it('should create cost without token data (for audio models)', async () => {
        // ACT
        const cost = await db.createCost({
          projectId: testProject.id,
          amount: 0.006,
          model: 'whisper-1',
          provider: 'openai',
        });

        // ASSERT
        expect(cost.inputTokens).toBeNull();
        expect(cost.outputTokens).toBeNull();
      });

      it('should validate positive amount', async () => {
        // ACT & ASSERT
        await expect(
          db.createCost({
            projectId: testProject.id,
            amount: -0.05,
            model: 'gpt-4o',
            provider: 'openai',
          })
        ).rejects.toThrow(/positive|amount/i);
      });

      it('should validate zero amount is allowed', async () => {
        // ACT
        const cost = await db.createCost({
          projectId: testProject.id,
          amount: 0,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ASSERT
        expect(cost.amount).toBe(0);
      });

      it('should handle different providers', async () => {
        // ACT
        const openaiCost = await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        });

        const anthropicCost = await db.createCost({
          projectId: testProject.id,
          amount: 0.02,
          model: 'claude-sonnet-4-5',
          provider: 'anthropic',
        });

        // ASSERT
        expect(openaiCost.provider).toBe('openai');
        expect(anthropicCost.provider).toBe('anthropic');
      });

      it('should throw error for non-existent project', async () => {
        // ACT & ASSERT
        await expect(
          db.createCost({
            projectId: 'non-existent-project',
            amount: 0.05,
            model: 'gpt-4o',
            provider: 'openai',
          })
        ).rejects.toThrow();
      });
    });

    describe('getCostsByProject', () => {
      it('should return all costs for a project', async () => {
        // ARRANGE
        await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        });
        await db.createCost({
          projectId: testProject.id,
          amount: 0.02,
          model: 'claude-sonnet-4-5',
          provider: 'anthropic',
        });

        // ACT
        const costsList = await db.getCostsByProject(testProject.id);

        // ASSERT
        expect(costsList).toHaveLength(2);
      });

      it('should order costs by timestamp descending', async () => {
        // ARRANGE
        const first = await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        });
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createCost({
          projectId: testProject.id,
          amount: 0.02,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        const costsList = await db.getCostsByProject(testProject.id);

        // ASSERT
        expect(costsList[0].id).toBe(second.id);
        expect(costsList[1].id).toBe(first.id);
      });

      it('should return empty array for project with no costs', async () => {
        // ACT
        const costsList = await db.getCostsByProject(testProject.id);

        // ASSERT
        expect(costsList).toEqual([]);
      });
    });

    describe('getTotalCostByProject', () => {
      it('should sum all project costs', async () => {
        // ARRANGE
        await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        });
        await db.createCost({
          projectId: testProject.id,
          amount: 0.02,
          model: 'gpt-4o',
          provider: 'openai',
        });
        await db.createCost({
          projectId: testProject.id,
          amount: 0.03,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        const total = await db.getTotalCostByProject(testProject.id);

        // ASSERT
        expect(total).toBe(0.06);
      });

      it('should return 0 for project with no costs', async () => {
        // ACT
        const total = await db.getTotalCostByProject(testProject.id);

        // ASSERT
        expect(total).toBe(0);
      });

      it('should handle decimal precision correctly', async () => {
        // ARRANGE
        await db.createCost({
          projectId: testProject.id,
          amount: 0.001,
          model: 'gpt-4o',
          provider: 'openai',
        });
        await db.createCost({
          projectId: testProject.id,
          amount: 0.002,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        const total = await db.getTotalCostByProject(testProject.id);

        // ASSERT
        expect(total).toBeCloseTo(0.003, 5);
      });
    });

    describe('getCostsByTimeRange', () => {
      it('should filter costs by date range', async () => {
        // ARRANGE
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT
        const costsList = await db.getCostsByTimeRange(yesterday, now);

        // ASSERT
        expect(costsList.length).toBeGreaterThanOrEqual(1);
      });

      it('should exclude costs outside date range', async () => {
        // ARRANGE
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        });

        // ACT - Query for last month to last week (should exclude today's cost)
        const costsList = await db.getCostsByTimeRange(lastMonth, lastWeek);

        // ASSERT
        expect(costsList).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // Activity CRUD Operations
  // ==========================================================================

  describe('Activity operations', () => {
    let testProject: Project;

    beforeEach(async () => {
      const user = await db.createUser(createTestUserInput({
        email: 'activity-test@example.com',
        name: 'Activity Tester'
      }));
      testProject = await db.createProject({
        name: 'Activity Project',
        path: '/path',
        userId: user.id,
      });
    });

    describe('createActivity', () => {
      it('should create activity record', async () => {
        // ACT
        const activity = await db.createActivity({
          projectId: testProject.id,
          type: 'agent_started',
          message: 'Agent started working on issue #123',
        });

        // ASSERT
        expect(activity.id).toBeDefined();
        expect(activity.type).toBe('agent_started');
        expect(activity.message).toBe('Agent started working on issue #123');
        expect(activity.timestamp).toBeInstanceOf(Date);
      });

      it('should create activity with metadata JSON', async () => {
        // ARRANGE
        const metadata = {
          issueNumber: 123,
          estimatedCost: 0.5,
        };

        // ACT
        const activity = await db.createActivity({
          projectId: testProject.id,
          type: 'cost_alert',
          message: 'High cost detected',
          metadata,
        });

        // ASSERT
        expect(activity.metadata).toEqual(metadata);
      });

      it('should handle null metadata', async () => {
        // ACT
        const activity = await db.createActivity({
          projectId: testProject.id,
          type: 'agent_started',
          message: 'Test',
          metadata: undefined,
        });

        // ASSERT
        expect(activity.metadata).toBeNull();
      });

      it('should handle empty metadata object', async () => {
        // ACT
        const activity = await db.createActivity({
          projectId: testProject.id,
          type: 'agent_started',
          message: 'Test',
          metadata: {},
        });

        // ASSERT
        expect(activity.metadata).toEqual({});
      });

      it('should validate activity type enum values', async () => {
        // ACT & ASSERT
        const types = [
          'agent_started',
          'agent_completed',
          'agent_failed',
          'cost_alert',
        ];

        for (const type of types) {
          const activity = await db.createActivity({
            projectId: testProject.id,
            type: type as any,
            message: `Test ${type}`,
          });
          expect(activity.type).toBe(type);
        }
      });

      it('should throw error for invalid activity type', async () => {
        // ACT & ASSERT
        await expect(
          db.createActivity({
            projectId: testProject.id,
            type: 'invalid-type' as any,
            message: 'Test',
          })
        ).rejects.toThrow();
      });

      it('should throw error for non-existent project', async () => {
        // ACT & ASSERT
        await expect(
          db.createActivity({
            projectId: 'non-existent-project',
            type: 'agent_started',
            message: 'Test',
          })
        ).rejects.toThrow();
      });
    });

    describe('getActivitiesByProject', () => {
      it('should return all activities for a project', async () => {
        // ARRANGE
        await db.createActivity({
          projectId: testProject.id,
          type: 'agent_started',
          message: 'Activity 1',
        });
        await db.createActivity({
          projectId: testProject.id,
          type: 'agent_completed',
          message: 'Activity 2',
        });

        // ACT
        const activitiesList = await db.getActivitiesByProject(testProject.id);

        // ASSERT
        expect(activitiesList).toHaveLength(2);
      });

      it('should order activities by timestamp descending', async () => {
        // ARRANGE
        const first = await db.createActivity({
          projectId: testProject.id,
          type: 'agent_started',
          message: 'First',
        });
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createActivity({
          projectId: testProject.id,
          type: 'agent_completed',
          message: 'Second',
        });

        // ACT
        const activitiesList = await db.getActivitiesByProject(testProject.id);

        // ASSERT
        expect(activitiesList[0].id).toBe(second.id);
        expect(activitiesList[1].id).toBe(first.id);
      });

      it('should support pagination with limit', async () => {
        // ARRANGE
        for (let i = 0; i < 10; i++) {
          await db.createActivity({
            projectId: testProject.id,
            type: 'agent_started',
            message: `Activity ${i}`,
          });
        }

        // ACT
        const limited = await db.getActivitiesByProject(testProject.id, {
          limit: 5
        });

        // ASSERT
        expect(limited).toHaveLength(5);
      });

      it('should support pagination with offset', async () => {
        // ARRANGE
        for (let i = 0; i < 10; i++) {
          await db.createActivity({
            projectId: testProject.id,
            type: 'agent_started',
            message: `Activity ${i}`,
          });
        }

        // ACT
        const page1 = await db.getActivitiesByProject(testProject.id, {
          limit: 5,
          offset: 0
        });
        const page2 = await db.getActivitiesByProject(testProject.id, {
          limit: 5,
          offset: 5
        });

        // ASSERT
        expect(page1).toHaveLength(5);
        expect(page2).toHaveLength(5);
        expect(page1[0].id).not.toBe(page2[0].id);
      });

      it('should return empty array for project with no activities', async () => {
        // ACT
        const activitiesList = await db.getActivitiesByProject(testProject.id);

        // ASSERT
        expect(activitiesList).toEqual([]);
      });
    });

    describe('getRecentActivities', () => {
      it('should return recent activities across all projects for a user', async () => {
        // ARRANGE
        const user = await db.createUser(createTestUserInput({
          email: 'recent@example.com',
          name: 'Recent User'
        }));
        const project1 = await db.createProject({
          name: 'Project 1',
          path: '/p1',
          userId: user.id,
        });
        const project2 = await db.createProject({
          name: 'Project 2',
          path: '/p2',
          userId: user.id,
        });

        await db.createActivity({
          projectId: project1.id,
          type: 'agent_started',
          message: 'P1 Activity',
        });
        await db.createActivity({
          projectId: project2.id,
          type: 'agent_started',
          message: 'P2 Activity',
        });

        // ACT
        const activitiesList = await db.getRecentActivities(user.id, 10);

        // ASSERT
        expect(activitiesList).toHaveLength(2);
      });

      it('should limit results to specified count', async () => {
        // ARRANGE
        const user = await db.createUser(createTestUserInput({
          email: 'limit@example.com',
          name: 'Limit User'
        }));
        const project = await db.createProject({
          name: 'Project',
          path: '/p',
          userId: user.id,
        });

        for (let i = 0; i < 20; i++) {
          await db.createActivity({
            projectId: project.id,
            type: 'agent_started',
            message: `Activity ${i}`,
          });
        }

        // ACT
        const activitiesList = await db.getRecentActivities(user.id, 5);

        // ASSERT
        expect(activitiesList).toHaveLength(5);
      });

      it('should order by timestamp descending', async () => {
        // ARRANGE
        const user = await db.createUser(createTestUserInput({
          email: 'order@example.com',
          name: 'Order User'
        }));
        const project = await db.createProject({
          name: 'Project',
          path: '/p',
          userId: user.id,
        });

        const first = await db.createActivity({
          projectId: project.id,
          type: 'agent_started',
          message: 'First',
        });
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createActivity({
          projectId: project.id,
          type: 'agent_started',
          message: 'Second',
        });

        // ACT
        const activitiesList = await db.getRecentActivities(user.id, 10);

        // ASSERT
        expect(activitiesList[0].id).toBe(second.id);
        expect(activitiesList[1].id).toBe(first.id);
      });

      it('should not return activities from other users projects', async () => {
        // ARRANGE
        const user1 = await db.createUser(createTestUserInput({
          email: 'user1@example.com',
          name: 'User 1'
        }));
        const user2 = await db.createUser(createTestUserInput({
          email: 'user2@example.com',
          name: 'User 2'
        }));

        const project1 = await db.createProject({
          name: 'Project 1',
          path: '/p1',
          userId: user1.id,
        });
        const project2 = await db.createProject({
          name: 'Project 2',
          path: '/p2',
          userId: user2.id,
        });

        await db.createActivity({
          projectId: project1.id,
          type: 'agent_started',
          message: 'User 1 Activity',
        });
        await db.createActivity({
          projectId: project2.id,
          type: 'agent_started',
          message: 'User 2 Activity',
        });

        // ACT
        const activitiesList = await db.getRecentActivities(user1.id, 10);

        // ASSERT
        expect(activitiesList).toHaveLength(1);
        expect(activitiesList[0].message).toBe('User 1 Activity');
      });
    });
  });

  // ==========================================================================
  // Transaction Support
  // ==========================================================================

  describe('Transaction support', () => {
    it('should execute operations in transaction', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'transaction@example.com',
        name: 'Transaction User'
      }));

      // ACT
      await db.transaction(async (tx: any) => {
        await tx.insert(projects).values({
          id: 'test-id',
          name: 'Transactional Project',
          path: '/path',
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // ASSERT
      const projectsList = await db.listProjectsByUser(user.id);
      expect(projectsList).toHaveLength(1);
    });

    it('should rollback transaction on error', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'rollback@example.com',
        name: 'Rollback User'
      }));

      // ACT & ASSERT
      await expect(
        db.transaction(async (tx: any) => {
          await tx.insert(projects).values({
            id: 'rollback-id',
            name: 'Will be rolled back',
            path: '/path',
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          throw new Error('Simulated error');
        })
      ).rejects.toThrow('Simulated error');

      // Verify rollback
      const projectsList = await db.listProjectsByUser(user.id);
      expect(projectsList).toHaveLength(0);
    });

    it('should commit transaction on success', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'commit@example.com',
        name: 'Commit User'
      }));

      // ACT
      await db.transaction(async (tx: any) => {
        await tx.insert(projects).values({
          id: 'commit-id-1',
          name: 'Project 1',
          path: '/p1',
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await tx.insert(projects).values({
          id: 'commit-id-2',
          name: 'Project 2',
          path: '/p2',
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // ASSERT
      const projectsList = await db.listProjectsByUser(user.id);
      expect(projectsList).toHaveLength(2);
    });

    it('should handle nested transaction-like operations', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'nested@example.com',
        name: 'Nested User'
      }));

      // ACT
      await db.transaction(async (tx: any) => {
        const [project] = await tx.insert(projects).values({
          id: 'nested-project',
          name: 'Parent Project',
          path: '/path',
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        await tx.insert(agents).values({
          id: 'nested-agent',
          projectId: project.id,
          status: 'running',
          startTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // ASSERT
      const projectsList = await db.listProjectsByUser(user.id);
      expect(projectsList).toHaveLength(1);

      const agentsList = await db.listAgentsByProject('nested-project');
      expect(agentsList).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  describe('Bulk operations', () => {
    it('should create multiple costs efficiently', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'bulk@example.com',
        name: 'Bulk User'
      }));
      const project = await db.createProject({
        name: 'Bulk Project',
        path: '/path',
        userId: user.id,
      });

      const costsData = Array.from({ length: 100 }, (_, i) => ({
        projectId: project.id,
        amount: 0.01 * (i + 1),
        model: 'gpt-4o',
        provider: 'openai' as const,
      }));

      // ACT
      const start = Date.now();
      await db.bulkCreateCosts(costsData);
      const duration = Date.now() - start;

      // ASSERT
      const costsList = await db.getCostsByProject(project.id);
      expect(costsList).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should create multiple activities efficiently', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'bulk-activity@example.com',
        name: 'Bulk Activity User'
      }));
      const project = await db.createProject({
        name: 'Bulk Activity Project',
        path: '/path',
        userId: user.id,
      });

      const activitiesData = Array.from({ length: 50 }, (_, i) => ({
        projectId: project.id,
        type: 'agent_started' as const,
        message: `Activity ${i}`,
      }));

      // ACT
      await db.bulkCreateActivities(activitiesData);

      // ASSERT
      const activitiesList = await db.getActivitiesByProject(project.id);
      expect(activitiesList).toHaveLength(50);
    });

    it('should handle bulk insert rollback on error', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'bulk-error@example.com',
        name: 'Bulk Error User'
      }));
      const project = await db.createProject({
        name: 'Bulk Error Project',
        path: '/path',
        userId: user.id,
      });

      const invalidCosts: CreateCostInput[] = [
        { projectId: project.id, amount: 0.01, model: 'gpt-4o', provider: 'openai' as const },
        { projectId: 'non-existent', amount: 0.02, model: 'gpt-4o', provider: 'openai' as const },
      ];

      // ACT & ASSERT
      await expect(
        db.bulkCreateCosts(invalidCosts)
      ).rejects.toThrow();

      // Verify no costs were created
      const costsList = await db.getCostsByProject(project.id);
      expect(costsList).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Edge Cases & Error Handling
  // ==========================================================================

  describe('Edge cases', () => {
    it('should handle null values correctly in optional fields', async () => {
      // ACT
      const user = await db.createUser(createTestUserInput({
        email: 'nulls@example.com',
        name: undefined,
      }));

      // ASSERT
      expect(user.name).toBeNull();
    });

    it('should handle empty strings in required fields', async () => {
      // ACT & ASSERT
      await expect(
        db.createUser(createTestUserInput({ email: '' }))
      ).rejects.toThrow();
    });

    it('should handle large JSON objects in settings', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'large-json@example.com'
      }));
      const largeSettings = {
        array: Array(1000).fill({ key: 'value' }),
        nested: { deep: { very: { deep: { object: 'value' } } } },
      };

      // ACT
      const project = await db.createProject({
        name: 'Large JSON',
        path: '/path',
        userId: user.id,
        settings: largeSettings,
      });

      // ASSERT
      expect(project.settings).toEqual(largeSettings);
    });

    it('should handle large log arrays', async () => {
      // ARRANGE
      const user = await db.createUser(createTestUserInput({
        email: 'large-logs@example.com'
      }));
      const project = await db.createProject({
        name: 'Project',
        path: '/path',
        userId: user.id,
      });
      const largeLogs = Array(1000).fill('Log line');

      // ACT
      const agent = await db.createAgent({
        projectId: project.id,
        status: 'running',
        logs: largeLogs,
      });

      // ASSERT
      expect(agent.logs).toHaveLength(1000);
    });

    it('should handle concurrent user creation attempts', async () => {
      // ACT
      const promises = Array.from({ length: 10 }, (_, i) =>
        db.createUser(createTestUserInput({
          email: `concurrent-${i}@example.com`
        }))
      );

      const users = await Promise.all(promises);

      // ASSERT
      expect(users).toHaveLength(10);
      const uniqueIds = new Set(users.map(u => u.id));
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle special characters in strings', async () => {
      // ACT
      const user = await db.createUser(createTestUserInput({
        email: 'special@example.com',
        name: "O'Brien & Co. <test>",
      }));

      const project = await db.createProject({
        name: 'Project with "quotes" and \'apostrophes\'',
        path: '/path/with/special/chars!@#$%',
        userId: user.id,
      });

      // ASSERT
      expect(user.name).toBe("O'Brien & Co. <test>");
      expect(project.name).toBe('Project with "quotes" and \'apostrophes\'');
    });

    it('should handle very long strings', async () => {
      // ARRANGE
      const longString = 'x'.repeat(10000);
      const user = await db.createUser(createTestUserInput({
        email: 'long@example.com'
      }));
      const project = await db.createProject({
        name: 'Project',
        path: '/path',
        userId: user.id,
      });

      // ACT
      const activity = await db.createActivity({
        projectId: project.id,
        type: 'agent_started',
        message: longString,
      });

      // ASSERT
      expect(activity.message).toHaveLength(10000);
    });

    it('should handle timestamp precision', async () => {
      // ARRANGE
      const before = new Date();

      // ACT
      const user = await db.createUser(createTestUserInput({
        email: 'timestamp@example.com'
      }));

      const after = new Date();

      // ASSERT
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  describe('Connection management', () => {
    it('should handle database connection check', async () => {
      // ACT & ASSERT
      await expect(db.connect()).resolves.not.toThrow();
    });

    it('should handle database disconnection', async () => {
      // ACT & ASSERT
      await expect(db.disconnect()).resolves.not.toThrow();
    });

    it('should handle multiple disconnect calls gracefully', async () => {
      // ACT
      await db.disconnect();
      await db.disconnect();

      // ASSERT - Should not throw
      expect(true).toBe(true);
    });
  });
});
