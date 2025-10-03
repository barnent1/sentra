import { describe, it, expect } from '@jest/globals';
import * as schema from '../../db/schema/index';

describe('Database Schema Definitions', () => {
  describe('Schema Exports', () => {
    it('should export users table', () => {
      expect(schema.users).toBeDefined();
      expect(typeof schema.users).toBe('object');
    });

    it('should export projects table', () => {
      expect(schema.projects).toBeDefined();
      expect(typeof schema.projects).toBe('object');
    });

    it('should export tasks table', () => {
      expect(schema.tasks).toBeDefined();
      expect(typeof schema.tasks).toBe('object');
    });

    it('should export stacks table', () => {
      expect(schema.stacks).toBeDefined();
      expect(typeof schema.stacks).toBe('object');
    });

    it('should export documentationChunks table', () => {
      expect(schema.documentationChunks).toBeDefined();
      expect(typeof schema.documentationChunks).toBe('object');
    });

    it('should export userKeys table', () => {
      expect(schema.userKeys).toBeDefined();
      expect(typeof schema.userKeys).toBe('object');
    });

    it('should export auditLog table', () => {
      expect(schema.auditLog).toBeDefined();
      expect(typeof schema.auditLog).toBe('object');
    });

    it('should export workflowState table', () => {
      expect(schema.workflowState).toBeDefined();
      expect(typeof schema.workflowState).toBe('object');
    });

    it('should export logs table', () => {
      expect(schema.logs).toBeDefined();
      expect(typeof schema.logs).toBe('object');
    });

    it('should export agentPrompts table', () => {
      expect(schema.agentPrompts).toBeDefined();
      expect(typeof schema.agentPrompts).toBe('object');
    });

    it('should export projectPromptOverrides table', () => {
      expect(schema.projectPromptOverrides).toBeDefined();
      expect(typeof schema.projectPromptOverrides).toBe('object');
    });

    it('should export designAssets table', () => {
      expect(schema.designAssets).toBeDefined();
      expect(typeof schema.designAssets).toBe('object');
    });

    it('should export screenshots table', () => {
      expect(schema.screenshots).toBeDefined();
      expect(typeof schema.screenshots).toBe('object');
    });

    it('should export worktrees table', () => {
      expect(schema.worktrees).toBeDefined();
      expect(typeof schema.worktrees).toBe('object');
    });
  });

  describe('Type Exports', () => {
    it('should export User type', () => {
      type User = schema.User;
      type NewUser = schema.NewUser;

      const user: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        isActive: true,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUser: NewUser = {
        email: 'new@example.com',
        username: 'newuser',
      };

      expect(user).toBeDefined();
      expect(newUser).toBeDefined();
    });

    it('should export Project type', () => {
      type Project = schema.Project;
      type NewProject = schema.NewProject;

      const project: Project = {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        ownerId: 1,
        stackId: 1,
        repoPath: '/path/to/repo',
        mainBranch: 'main',
        status: 'active',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newProject: NewProject = {
        name: 'New Project',
        ownerId: 1,
      };

      expect(project).toBeDefined();
      expect(newProject).toBeDefined();
    });

    it('should export Task type', () => {
      type Task = schema.Task;
      type NewTask = schema.NewTask;

      const task: Task = {
        id: 1,
        projectId: 1,
        title: 'Test Task',
        description: 'Task description',
        status: 'pending',
        assignedTo: 1,
        priority: 0,
        estimatedMinutes: 120,
        actualMinutes: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      const newTask: NewTask = {
        projectId: 1,
        title: 'New Task',
      };

      expect(task).toBeDefined();
      expect(newTask).toBeDefined();
    });

    it('should export Stack type', () => {
      type Stack = schema.Stack;
      type NewStack = schema.NewStack;

      const stack: Stack = {
        id: 1,
        name: 'test-stack',
        version: '1.0.0',
        description: 'Test stack',
        docsUrl: 'https://docs.example.com',
        homepage: 'https://example.com',
        isActive: true,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newStack: NewStack = {
        name: 'new-stack',
        version: '1.0.0',
      };

      expect(stack).toBeDefined();
      expect(newStack).toBeDefined();
    });
  });

  describe('Column Definitions', () => {
    it('should have correct column types for users', () => {
      expect(schema.users.id.dataType).toBe('number');
      expect(schema.users.email.dataType).toBe('string');
      expect(schema.users.username.dataType).toBe('string');
      expect(schema.users.isActive.dataType).toBe('boolean');
    });

    it('should have all user columns defined', () => {
      expect(schema.users.id).toBeDefined();
      expect(schema.users.email).toBeDefined();
      expect(schema.users.username).toBeDefined();
      expect(schema.users.displayName).toBeDefined();
      expect(schema.users.avatarUrl).toBeDefined();
      expect(schema.users.isActive).toBeDefined();
      expect(schema.users.role).toBeDefined();
      expect(schema.users.createdAt).toBeDefined();
      expect(schema.users.updatedAt).toBeDefined();
    });

    it('should have all task columns defined including metadata', () => {
      expect(schema.tasks.id).toBeDefined();
      expect(schema.tasks.projectId).toBeDefined();
      expect(schema.tasks.title).toBeDefined();
      expect(schema.tasks.description).toBeDefined();
      expect(schema.tasks.status).toBeDefined();
      expect(schema.tasks.assignedTo).toBeDefined();
      expect(schema.tasks.priority).toBeDefined();
      expect(schema.tasks.metadata).toBeDefined();
      expect(schema.tasks.createdAt).toBeDefined();
      expect(schema.tasks.updatedAt).toBeDefined();
      expect(schema.tasks.completedAt).toBeDefined();
    });
  });
});
