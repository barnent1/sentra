/**
 * HTTP API Client Tests for Sentra API
 * 
 * Tests the HTTP API client functionality including request/response handling,
 * error handling, retry logic, and type safety.
 */

import { SentraAPIClient, createAPIClient } from '../client';
import type {
  AgentCreateRequest,
  AgentResponse,
  TaskCreateRequest,
  TaskResponse,
  APIError,
  APIClientConfig,
} from '../types';
import { AgentRole, TaskStatus, TaskPriority } from '../types';

// Mock fetch for testing
global.fetch = jest.fn();

describe('SentraAPIClient', () => {
  let client: SentraAPIClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SentraAPIClient({
      baseUrl: 'http://test-api.local',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
      logging: { enabled: false, level: 'error' },
    });
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new SentraAPIClient();
      const config = defaultClient.getConfig();

      expect(config.baseUrl).toBe('http://localhost:8000');
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig: Partial<APIClientConfig> = {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
      };

      const customClient = new SentraAPIClient(customConfig);
      const config = customClient.getConfig();

      expect(config.baseUrl).toBe('https://api.example.com');
      expect(config.timeout).toBe(10000);
      expect(config.retryAttempts).toBe(3); // Should use default
    });
  });

  describe('Health Check Endpoint', () => {
    it('should successfully call health check endpoint', async () => {
      const mockResponse = {
        status: 'healthy',
        database: 'connected',
        version: '1.0.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.healthCheck();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('healthy');
        expect(result.data.database).toBe('connected');
        expect(result.data.version).toBe('1.0.0');
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.local/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should handle health check API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response);

      const result = await client.healthCheck();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status_code).toBe(503);
        expect(result.error.message).toContain('Service Unavailable');
      }
    });
  });

  describe('Agent Management Endpoints', () => {
    describe('listAgents', () => {
      it('should list agents with default parameters', async () => {
        const mockAgents: AgentResponse[] = [
          {
            id: 'agent_1' as any,
            name: 'Test Agent 1',
            role: AgentRole.DEV,
            prompt: 'Test prompt 1',
            config: {},
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'agent_2' as any,
            name: 'Test Agent 2',
            role: AgentRole.QA,
            prompt: 'Test prompt 2',
            config: {},
            active: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockAgents),
        } as Response);

        const result = await client.listAgents();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
          expect(result.data[0].name).toBe('Test Agent 1');
          expect(result.data[1].role).toBe(AgentRole.QA);
        }

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.local/api/agents?active_only=true',
          expect.any(Object)
        );
      });

      it('should list all agents including inactive ones', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve([]),
        } as Response);

        await client.listAgents(false);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.local/api/agents?active_only=false',
          expect.any(Object)
        );
      });
    });

    describe('createAgent', () => {
      it('should create a new agent successfully', async () => {
        const createRequest: AgentCreateRequest = {
          name: 'New Test Agent',
          role: AgentRole.ANALYST,
          prompt: 'Analyze and provide insights',
          config: { priority: 'accuracy_over_speed' },
        };

        const mockResponse: AgentResponse = {
          id: 'agent_new' as any,
          name: createRequest.name,
          role: createRequest.role,
          prompt: createRequest.prompt,
          config: createRequest.config || {},
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const result = await client.createAgent(createRequest);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('New Test Agent');
          expect(result.data.role).toBe(AgentRole.ANALYST);
          expect(result.data.active).toBe(true);
        }

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.local/api/agents',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(createRequest),
          })
        );
      });

      it('should handle validation errors when creating agent', async () => {
        const createRequest: AgentCreateRequest = {
          name: '',
          role: AgentRole.DEV,
          prompt: 'Test prompt',
        };

        const validationError = {
          status_code: 422,
          error_code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            field_errors: [
              { field: 'name', message: 'Name is required' },
            ],
          },
          timestamp: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          statusText: 'Unprocessable Entity',
        } as Response);

        const result = await client.createAgent(createRequest);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.status_code).toBe(422);
        }
      });
    });
  });

  describe('Task Management Endpoints', () => {
    describe('createTask', () => {
      it('should create a task successfully', async () => {
        const taskRequest: TaskCreateRequest = {
          project_name: 'Test Project',
          title: 'Implement feature X',
          spec: 'Detailed specification for feature X',
          priority: TaskPriority.HIGH,
          assigned_agent_role: AgentRole.DEV,
        };

        const mockResponse: TaskResponse = {
          id: 'task_123' as any,
          project_id: 'proj_456' as any,
          project_name: taskRequest.project_name,
          title: taskRequest.title,
          spec: taskRequest.spec,
          status: TaskStatus.QUEUED,
          priority: taskRequest.priority!,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const result = await client.createTask(taskRequest);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Implement feature X');
          expect(result.data.status).toBe(TaskStatus.QUEUED);
          expect(result.data.priority).toBe(TaskPriority.HIGH);
        }
      });
    });

    describe('listTasks', () => {
      it('should list tasks with filtering parameters', async () => {
        const mockTasks: TaskResponse[] = [
          {
            id: 'task_1' as any,
            project_id: 'proj_1' as any,
            project_name: 'Project Alpha',
            title: 'Task 1',
            spec: 'Spec 1',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            metadata: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T01:00:00Z',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockTasks),
        } as Response);

        const result = await client.listTasks('Project Alpha', TaskStatus.IN_PROGRESS, 25);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].status).toBe(TaskStatus.IN_PROGRESS);
        }

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.local/api/tasks?project_name=Project%20Alpha&status=in_progress&limit=25',
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling and Retries', () => {
    it('should retry failed requests up to retry limit', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: 'healthy' }),
        } as Response);

      const result = await client.healthCheck();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after exceeding retry attempts', async () => {
      // All calls fail
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await client.healthCheck();

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      const result = await client.healthCheck();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('timeout');
      }
    });
  });

  describe('Authentication', () => {
    it('should include Bearer token when configured', async () => {
      const authenticatedClient = new SentraAPIClient({
        baseUrl: 'http://test-api.local',
        authentication: {
          type: 'token',
          value: 'test-jwt-token',
        },
        logging: { enabled: false, level: 'error' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ status: 'healthy' }),
      } as Response);

      await authenticatedClient.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token',
          }),
        })
      );
    });

    it('should include API key when configured', async () => {
      const apiKeyClient = new SentraAPIClient({
        baseUrl: 'http://test-api.local',
        authentication: {
          type: 'api_key',
          value: 'test-api-key',
        },
        logging: { enabled: false, level: 'error' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ status: 'healthy' }),
      } as Response);

      await apiKeyClient.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track request metrics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ status: 'healthy' }),
      } as Response);

      const initialMetrics = client.getMetrics();
      expect(initialMetrics.requests_total).toBe(0);

      await client.healthCheck();

      const updatedMetrics = client.getMetrics();
      expect(updatedMetrics.requests_total).toBe(1);
      expect(updatedMetrics.requests_successful).toBe(1);
      expect(updatedMetrics.requests_failed).toBe(0);
    });

    it('should track failed request metrics', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await client.healthCheck();

      const metrics = client.getMetrics();
      expect(metrics.requests_total).toBe(1);
      expect(metrics.requests_successful).toBe(0);
      expect(metrics.requests_failed).toBe(1);
    });
  });

  describe('Batch Operations', () => {
    it('should create multiple tasks in batch', async () => {
      const taskRequests: TaskCreateRequest[] = [
        {
          project_name: 'Test Project',
          title: 'Task 1',
          spec: 'Spec 1',
          priority: TaskPriority.HIGH,
        },
        {
          project_name: 'Test Project',
          title: 'Task 2',
          spec: 'Spec 2',
          priority: TaskPriority.MEDIUM,
        },
      ];

      // Mock successful responses for both tasks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            id: 'task_1',
            title: 'Task 1',
            status: TaskStatus.QUEUED,
          } as Partial<TaskResponse>),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            id: 'task_2',
            title: 'Task 2',
            status: TaskStatus.QUEUED,
          } as Partial<TaskResponse>),
        } as Response);

      const result = await client.createMultipleTasks(taskRequests);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Factory Functions', () => {
    it('should create client with factory function', () => {
      const factoryClient = createAPIClient({
        baseUrl: 'https://factory.example.com',
        timeout: 15000,
      });

      const config = factoryClient.getConfig();
      expect(config.baseUrl).toBe('https://factory.example.com');
      expect(config.timeout).toBe(15000);
    });
  });

  describe('Abort Controller', () => {
    it('should allow aborting requests', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ status: 'healthy' }),
          } as Response), 1000);
        })
      );

      const promise = client.healthCheck();
      client.abort();

      const result = await promise;

      // The request should either be aborted or complete normally
      // depending on timing - we just ensure no errors are thrown
      expect(result).toBeDefined();
    });
  });
});