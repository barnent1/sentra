/**
 * Type Definition Tests for Sentra API Client
 * 
 * Validates all TypeScript interfaces, type guards, and branded types
 * to ensure proper type safety and interface compliance.
 */

import type {
  ProjectId,
  TaskId,
  AgentId,
  AgentResponse,
  TaskResponse,
  WebSocketMessage,
  APIError,
  AgentRoleType,
  TaskStatusType,
  TaskPriorityType,
} from '../types';

import {
  AgentRole,
  TaskStatus,
  TaskPriority,
  isAgentResponse,
  isTaskResponse,
  isWebSocketMessage,
  isAPIError,
} from '../types';

describe('API Types', () => {
  
  describe('Branded Types', () => {
    it('should create unique branded types for IDs', () => {
      const projectId = 'proj_123' as ProjectId;
      const taskId = 'task_456' as TaskId;
      const agentId = 'agent_789' as AgentId;

      // These should be assignable to string but not to each other
      const projectIdStr: string = projectId;
      const taskIdStr: string = taskId;
      const agentIdStr: string = agentId;

      expect(projectIdStr).toBe('proj_123');
      expect(taskIdStr).toBe('task_456');
      expect(agentIdStr).toBe('agent_789');
    });

    it('should prevent accidental cross-assignment of branded types', () => {
      const projectId = 'proj_123' as ProjectId;
      const taskId = 'task_456' as TaskId;

      // TypeScript should prevent this at compile time
      // In runtime tests, we just ensure the values are distinct
      expect(projectId).not.toBe(taskId);
    });
  });

  describe('Agent Role Enum', () => {
    it('should have all required agent roles', () => {
      expect(AgentRole.ANALYST).toBe('analyst');
      expect(AgentRole.PM).toBe('pm');
      expect(AgentRole.DEV).toBe('dev');
      expect(AgentRole.QA).toBe('qa');
      expect(AgentRole.UIUX).toBe('uiux');
      expect(AgentRole.ORCHESTRATOR).toBe('orchestrator');
    });

    it('should provide valid agent role type', () => {
      const role: AgentRoleType = AgentRole.DEV;
      expect(role).toBe('dev');
    });
  });

  describe('Task Status Enum', () => {
    it('should have all required task statuses', () => {
      expect(TaskStatus.QUEUED).toBe('queued');
      expect(TaskStatus.IN_PROGRESS).toBe('in_progress');
      expect(TaskStatus.COMPLETED).toBe('completed');
      expect(TaskStatus.FAILED).toBe('failed');
      expect(TaskStatus.CANCELLED).toBe('cancelled');
    });

    it('should provide valid task status type', () => {
      const status: TaskStatusType = TaskStatus.IN_PROGRESS;
      expect(status).toBe('in_progress');
    });
  });

  describe('Task Priority Enum', () => {
    it('should have correct priority values', () => {
      expect(TaskPriority.HIGH).toBe(1);
      expect(TaskPriority.MEDIUM).toBe(3);
      expect(TaskPriority.LOW).toBe(5);
    });

    it('should provide valid task priority type', () => {
      const priority: TaskPriorityType = TaskPriority.HIGH;
      expect(priority).toBe(1);
    });
  });

  describe('Type Guards', () => {
    describe('isAgentResponse', () => {
      it('should validate valid agent response', () => {
        const validAgent: AgentResponse = {
          id: 'agent_123' as AgentId,
          name: 'Test Agent',
          role: AgentRole.DEV,
          prompt: 'Test prompt',
          config: {},
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        expect(isAgentResponse(validAgent)).toBe(true);
      });

      it('should reject invalid agent response', () => {
        const invalidAgent = {
          id: 'agent_123',
          name: 'Test Agent',
          // Missing required fields
        };

        expect(isAgentResponse(invalidAgent)).toBe(false);
      });

      it('should reject non-object values', () => {
        expect(isAgentResponse(null)).toBe(false);
        expect(isAgentResponse(undefined)).toBe(false);
        expect(isAgentResponse('string')).toBe(false);
        expect(isAgentResponse(123)).toBe(false);
      });
    });

    describe('isTaskResponse', () => {
      it('should validate valid task response', () => {
        const validTask: TaskResponse = {
          id: 'task_123' as TaskId,
          project_id: 'proj_456' as ProjectId,
          project_name: 'Test Project',
          title: 'Test Task',
          spec: 'Test specification',
          status: TaskStatus.QUEUED,
          priority: TaskPriority.MEDIUM,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        expect(isTaskResponse(validTask)).toBe(true);
      });

      it('should reject invalid task response', () => {
        const invalidTask = {
          id: 'task_123',
          title: 'Test Task',
          // Missing required fields
        };

        expect(isTaskResponse(invalidTask)).toBe(false);
      });
    });

    describe('isWebSocketMessage', () => {
      it('should validate valid WebSocket message', () => {
        const validMessage: WebSocketMessage = {
          type: 'project_update',
          id: 'msg_123',
          timestamp: '2024-01-01T00:00:00Z',
          data: { test: 'data' },
        };

        expect(isWebSocketMessage(validMessage)).toBe(true);
      });

      it('should reject invalid WebSocket message', () => {
        const invalidMessage = {
          type: 'project_update',
          // Missing required fields
        };

        expect(isWebSocketMessage(invalidMessage)).toBe(false);
      });
    });

    describe('isAPIError', () => {
      it('should validate valid API error', () => {
        const validError: APIError = {
          status_code: 400,
          message: 'Bad request',
          timestamp: '2024-01-01T00:00:00Z',
        };

        expect(isAPIError(validError)).toBe(true);
      });

      it('should reject invalid API error', () => {
        const invalidError = {
          message: 'Bad request',
          // Missing required fields
        };

        expect(isAPIError(invalidError)).toBe(false);
      });

      it('should validate status_code is number', () => {
        const invalidError = {
          status_code: '400', // Should be number
          message: 'Bad request',
          timestamp: '2024-01-01T00:00:00Z',
        };

        expect(isAPIError(invalidError)).toBe(false);
      });
    });
  });

  describe('Interface Structure Validation', () => {
    it('should have proper readonly properties', () => {
      const agent: AgentResponse = {
        id: 'agent_123' as AgentId,
        name: 'Test Agent',
        role: AgentRole.DEV,
        prompt: 'Test prompt',
        config: {},
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Properties should be accessible
      expect(agent.id).toBe('agent_123');
      expect(agent.name).toBe('Test Agent');
      expect(agent.role).toBe(AgentRole.DEV);
      expect(agent.active).toBe(true);
    });

    it('should support optional properties correctly', () => {
      const task: TaskResponse = {
        id: 'task_123' as TaskId,
        project_id: 'proj_456' as ProjectId,
        project_name: 'Test Project',
        title: 'Test Task',
        spec: 'Test specification',
        status: TaskStatus.QUEUED,
        priority: TaskPriority.MEDIUM,
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        // Optional properties not provided
      };

      expect(task.assigned_agent).toBeUndefined();
      expect(task.assigned_agent_name).toBeUndefined();
    });

    it('should support complex nested objects', () => {
      const agent: AgentResponse = {
        id: 'agent_123' as AgentId,
        name: 'Test Agent',
        role: AgentRole.DEV,
        prompt: 'Test prompt',
        config: {
          tools: ['code_implementation', 'testing'],
          memory_focus: ['implementation_decisions'],
          priority: 'quality_over_speed',
        },
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(agent.config.tools).toEqual(['code_implementation', 'testing']);
      expect(agent.config.priority).toBe('quality_over_speed');
    });
  });

  describe('Type Compatibility', () => {
    it('should allow assignment from API responses', () => {
      // Simulating API response parsing
      const apiResponse = {
        id: 'agent_123',
        name: 'Test Agent',
        role: 'dev',
        prompt: 'Test prompt',
        config: {},
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Should be able to cast to proper types
      const agent: AgentResponse = {
        ...apiResponse,
        id: apiResponse.id as AgentId,
        role: apiResponse.role as AgentRoleType,
      };

      expect(agent.id).toBe('agent_123');
      expect(agent.role).toBe('dev');
    });

    it('should handle date string conversions', () => {
      const dateString = '2024-01-01T00:00:00Z';
      const date = new Date(dateString);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe(dateString);
    });
  });

  describe('Error Handling Types', () => {
    it('should provide comprehensive error information', () => {
      const error: APIError = {
        status_code: 422,
        error_code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          field_errors: [
            { field: 'name', message: 'Name is required' },
            { field: 'role', message: 'Invalid role value' },
          ],
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(error.status_code).toBe(422);
      expect(error.error_code).toBe('VALIDATION_ERROR');
      expect(error.details?.field_errors).toHaveLength(2);
    });
  });

  describe('Configuration Types', () => {
    it('should support API client configuration', () => {
      const config = {
        baseUrl: 'http://localhost:8000',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        authentication: {
          type: 'token' as const,
          value: 'test-token',
        },
        logging: {
          enabled: true,
          level: 'info' as const,
        },
      };

      expect(config.baseUrl).toBe('http://localhost:8000');
      expect(config.authentication?.type).toBe('token');
      expect(config.logging?.level).toBe('info');
    });
  });

  describe('Utility Types', () => {
    it('should support API response wrapper', () => {
      const successResponse = {
        success: true as const,
        data: {
          id: 'agent_123' as AgentId,
          name: 'Test Agent',
          role: AgentRole.DEV,
          prompt: 'Test prompt',
          config: {},
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as AgentResponse,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const errorResponse = {
        success: false as const,
        error: {
          status_code: 400,
          message: 'Bad request',
          timestamp: '2024-01-01T00:00:00Z',
        } as APIError,
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data.name).toBe('Test Agent');

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.status_code).toBe(400);
    });

    it('should support paginated responses', () => {
      const paginatedResponse = {
        items: [
          {
            id: 'task_123' as TaskId,
            project_id: 'proj_456' as ProjectId,
            project_name: 'Test Project',
            title: 'Test Task',
            spec: 'Test specification',
            status: TaskStatus.QUEUED,
            priority: TaskPriority.MEDIUM,
            metadata: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          } as TaskResponse,
        ],
        total: 1,
        page: 1,
        page_size: 10,
        has_next: false,
        has_previous: false,
      };

      expect(paginatedResponse.items).toHaveLength(1);
      expect(paginatedResponse.total).toBe(1);
      expect(paginatedResponse.has_next).toBe(false);
    });
  });
});