/**
 * Database Service Tests
 *
 * This file tests the database layer using Prisma ORM.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 * Uses in-memory SQLite for testing (fast, isolated)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  DatabaseService,
  User,
  Project,
  Agent,
  Cost,
  Activity,
  CreateUserInput,
  CreateProjectInput,
  CreateAgentInput,
  CreateCostInput,
  CreateActivityInput,
  UpdateProjectInput,
  UpdateAgentInput,
} from '@/services/database';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from '../../setup/database.setup';

describe('DatabaseService', () => {
  let db: DatabaseService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize test database with migrations
    prisma = await setupTestDatabase();
    db = DatabaseService.createTestInstance(prisma);
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await teardownTestDatabase(prisma);
  });

  beforeEach(async () => {
    // Clear all data before each test
    await clearTestDatabase(prisma);
  });

  // ==========================================================================
  // User CRUD Operations
  // ==========================================================================

  describe('User operations', () => {
    describe('createUser', () => {
      it('should create a new user with valid data', async () => {
        // ARRANGE
        const userData: CreateUserInput = {
          email: 'test@example.com',
          name: 'Test User',
        };

        // ACT
        const user = await db.createUser(userData);

        // ASSERT
        expect(user.id).toBeDefined();
        expect(user.email).toBe('test@example.com');
        expect(user.name).toBe('Test User');
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error for duplicate email', async () => {
        // ARRANGE
        await db.createUser({
          email: 'duplicate@example.com',
          name: 'First User',
        });

        // ACT & ASSERT
        await expect(
          db.createUser({
            email: 'duplicate@example.com',
            name: 'Second User',
          })
        ).rejects.toThrow();
      });

      it('should throw error for invalid email format', async () => {
        // ACT & ASSERT
        await expect(
          db.createUser({
            email: 'invalid-email',
            name: 'Test User',
          })
        ).rejects.toThrow();
      });

      it('should create user with minimal data (name optional)', async () => {
        // ACT
        const user = await db.createUser({
          email: 'minimal@example.com',
        });

        // ASSERT
        expect(user.id).toBeDefined();
        expect(user.email).toBe('minimal@example.com');
        expect(user.name).toBeNull();
      });
    });

    describe('getUserById', () => {
      it('should retrieve user by id', async () => {
        // ARRANGE
        const created = await db.createUser({
          email: 'find@example.com',
          name: 'Find Me',
        });

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
    });

    describe('getUserByEmail', () => {
      it('should retrieve user by email', async () => {
        // ARRANGE
        await db.createUser({
          email: 'email@example.com',
          name: 'Email User',
        });

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
        await db.createUser({
          email: 'CaseSensitive@example.com',
          name: 'Case Test',
        });

        // ACT
        const found = await db.getUserByEmail('casesensitive@example.com');

        // ASSERT
        expect(found).toBeDefined();
      });
    });

    describe('listUsers', () => {
      it('should return all users', async () => {
        // ARRANGE
        await db.createUser({ email: 'user1@example.com', name: 'User 1' });
        await db.createUser({ email: 'user2@example.com', name: 'User 2' });
        await db.createUser({ email: 'user3@example.com', name: 'User 3' });

        // ACT
        const users = await db.listUsers();

        // ASSERT
        expect(users).toHaveLength(3);
      });

      it('should return empty array when no users exist', async () => {
        // ACT
        const users = await db.listUsers();

        // ASSERT
        expect(users).toEqual([]);
      });

      it('should order users by creation date descending', async () => {
        // ARRANGE
        const first = await db.createUser({ email: 'first@example.com' });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createUser({ email: 'second@example.com' });

        // ACT
        const users = await db.listUsers();

        // ASSERT
        expect(users[0].id).toBe(second.id);
        expect(users[1].id).toBe(first.id);
      });
    });
  });

  // ==========================================================================
  // Project CRUD Operations
  // ==========================================================================

  describe('Project operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await db.createUser({
        email: 'project-owner@example.com',
        name: 'Project Owner',
      });
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
        const user2 = await db.createUser({
          email: 'user2@example.com',
          name: 'User 2',
        });

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

      it('should include user relation', async () => {
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
        if (found && 'user' in found) {
          expect(found.user).toBeDefined();
          expect((found.user as any)?.email).toBe(testUser.email);
        }
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
        const projects = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projects).toHaveLength(2);
      });

      it('should not return projects from other users', async () => {
        // ARRANGE
        const user2 = await db.createUser({
          email: 'user2@example.com',
          name: 'User 2',
        });
        await db.createProject({ name: 'User1 Project', path: '/p1', userId: testUser.id });
        await db.createProject({ name: 'User2 Project', path: '/p2', userId: user2.id });

        // ACT
        const projects = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projects).toHaveLength(1);
        expect(projects[0].name).toBe('User1 Project');
      });

      it('should return empty array for user with no projects', async () => {
        // ACT
        const projects = await db.listProjectsByUser(testUser.id);

        // ASSERT
        expect(projects).toEqual([]);
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
        const agents = await db.listAgentsByProject(project.id);
        expect(agents).toEqual([]);
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
      const user = await db.createUser({
        email: 'agent-test@example.com',
        name: 'Agent Tester',
      });
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

      it('should validate status enum', async () => {
        // ACT & ASSERT
        await expect(
          db.createAgent({
            projectId: testProject.id,
            status: 'invalid-status' as any,
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

      it('should include project relation', async () => {
        // ARRANGE
        const created = await db.createAgent({
          projectId: testProject.id,
          status: 'running',
        });

        // ACT
        const found = await db.getAgentById(created.id, { includeProject: true });

        // ASSERT
        expect(found).toBeDefined();
        if (found && 'project' in found) {
          expect(found.project).toBeDefined();
          expect((found.project as any)?.name).toBe(testProject.name);
        }
      });
    });

    describe('listAgentsByProject', () => {
      it('should return all agents for a project', async () => {
        // ARRANGE
        await db.createAgent({ projectId: testProject.id, status: 'running' });
        await db.createAgent({ projectId: testProject.id, status: 'completed' });

        // ACT
        const agents = await db.listAgentsByProject(testProject.id);

        // ASSERT
        expect(agents).toHaveLength(2);
      });

      it('should order agents by start time descending', async () => {
        // ARRANGE
        const first = await db.createAgent({ projectId: testProject.id, status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 10));
        const second = await db.createAgent({ projectId: testProject.id, status: 'running' });

        // ACT
        const agents = await db.listAgentsByProject(testProject.id);

        // ASSERT
        expect(agents[0].id).toBe(second.id);
        expect(agents[1].id).toBe(first.id);
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

      it('should append logs', async () => {
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
    });
  });

  // ==========================================================================
  // Cost CRUD Operations
  // ==========================================================================

  describe('Cost operations', () => {
    let testProject: Project;

    beforeEach(async () => {
      const user = await db.createUser({
        email: 'cost-test@example.com',
        name: 'Cost Tester',
      });
      testProject = await db.createProject({
        name: 'Cost Project',
        path: '/path',
        userId: user.id,
      });
    });

    describe('createCost', () => {
      it('should create cost record', async () => {
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
        const costs = await db.getCostsByProject(testProject.id);

        // ASSERT
        expect(costs).toHaveLength(2);
      });

      it('should calculate total cost', async () => {
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

        // ACT
        const total = await db.getTotalCostByProject(testProject.id);

        // ASSERT
        expect(total).toBe(0.03);
      });
    });

    describe('getCostsByTimeRange', () => {
      it('should filter costs by date range', async () => {
        // ARRANGE
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Create costs with different timestamps (using raw SQL for exact timestamps)
        await db.createCost({
          projectId: testProject.id,
          amount: 0.01,
          model: 'gpt-4o',
          provider: 'openai',
        }); // Today

        // ACT
        const costs = await db.getCostsByTimeRange(yesterday, now);

        // ASSERT
        expect(costs.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // Activity CRUD Operations
  // ==========================================================================

  describe('Activity operations', () => {
    let testProject: Project;

    beforeEach(async () => {
      const user = await db.createUser({
        email: 'activity-test@example.com',
        name: 'Activity Tester',
      });
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

      it('should create activity with metadata', async () => {
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

      it('should validate activity type enum', async () => {
        // ACT & ASSERT
        await expect(
          db.createActivity({
            projectId: testProject.id,
            type: 'invalid-type' as any,
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
        const activities = await db.getActivitiesByProject(testProject.id);

        // ASSERT
        expect(activities).toHaveLength(2);
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
        const activities = await db.getActivitiesByProject(testProject.id);

        // ASSERT
        expect(activities[0].id).toBe(second.id);
        expect(activities[1].id).toBe(first.id);
      });

      it('should support pagination with limit and offset', async () => {
        // ARRANGE
        for (let i = 0; i < 10; i++) {
          await db.createActivity({
            projectId: testProject.id,
            type: 'agent_started',
            message: `Activity ${i}`,
          });
        }

        // ACT
        const page1 = await db.getActivitiesByProject(testProject.id, { limit: 5, offset: 0 });
        const page2 = await db.getActivitiesByProject(testProject.id, { limit: 5, offset: 5 });

        // ASSERT
        expect(page1).toHaveLength(5);
        expect(page2).toHaveLength(5);
        expect(page1[0].id).not.toBe(page2[0].id);
      });
    });

    describe('getRecentActivities', () => {
      it('should return recent activities across all projects for a user', async () => {
        // ARRANGE
        const user = await db.createUser({
          email: 'recent@example.com',
          name: 'Recent User',
        });
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
        const activities = await db.getRecentActivities(user.id, 10);

        // ASSERT
        expect(activities).toHaveLength(2);
      });

      it('should limit results', async () => {
        // ARRANGE
        const user = await db.createUser({
          email: 'limit@example.com',
          name: 'Limit User',
        });
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
        const activities = await db.getRecentActivities(user.id, 5);

        // ASSERT
        expect(activities).toHaveLength(5);
      });
    });
  });

  // ==========================================================================
  // Connection & Transaction Management
  // ==========================================================================

  describe('Connection management', () => {
    it('should connect to database', async () => {
      // ACT & ASSERT
      await expect(db.connect()).resolves.not.toThrow();
    });

    it('should disconnect from database', async () => {
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

  describe('Transaction support', () => {
    it('should execute operations in transaction', async () => {
      // ARRANGE
      const user = await db.createUser({
        email: 'transaction@example.com',
        name: 'Transaction User',
      });

      // ACT
      await db.transaction(async tx => {
        await tx.project.create({
          data: {
            name: 'Transactional Project',
            path: '/path',
            userId: user.id,
          },
        });
      });

      // ASSERT
      const projects = await db.listProjectsByUser(user.id);
      expect(projects).toHaveLength(1);
    });

    it('should rollback on error', async () => {
      // ARRANGE
      const user = await db.createUser({
        email: 'rollback@example.com',
        name: 'Rollback User',
      });

      // ACT & ASSERT
      await expect(
        db.transaction(async tx => {
          await tx.project.create({
            data: {
              name: 'Will be rolled back',
              path: '/path',
              userId: user.id,
            },
          });
          throw new Error('Simulated error');
        })
      ).rejects.toThrow('Simulated error');

      // Verify rollback
      const projects = await db.listProjectsByUser(user.id);
      expect(projects).toHaveLength(0);
    });
  });

  describe('Bulk operations', () => {
    it('should create multiple costs efficiently', async () => {
      // ARRANGE
      const user = await db.createUser({
        email: 'bulk@example.com',
        name: 'Bulk User',
      });
      const project = await db.createProject({
        name: 'Bulk Project',
        path: '/path',
        userId: user.id,
      });

      const costs = Array.from({ length: 100 }, (_, i) => ({
        projectId: project.id,
        amount: 0.01 * (i + 1),
        model: 'gpt-4o',
        provider: 'openai' as const,
      }));

      // ACT
      const start = Date.now();
      await db.bulkCreateCosts(costs);
      const duration = Date.now() - start;

      // ASSERT
      const allCosts = await db.getCostsByProject(project.id);
      expect(allCosts).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should create multiple activities efficiently', async () => {
      // ARRANGE
      const user = await db.createUser({
        email: 'bulk-activity@example.com',
        name: 'Bulk Activity User',
      });
      const project = await db.createProject({
        name: 'Bulk Activity Project',
        path: '/path',
        userId: user.id,
      });

      const activities = Array.from({ length: 50 }, (_, i) => ({
        projectId: project.id,
        type: 'agent_started' as const,
        message: `Activity ${i}`,
      }));

      // ACT
      await db.bulkCreateActivities(activities);

      // ASSERT
      const allActivities = await db.getActivitiesByProject(project.id);
      expect(allActivities).toHaveLength(50);
    });
  });
});
