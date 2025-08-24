import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Project, Agent, Task } from '@/types';

// MCP (Model Context Protocol) Integration Types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: MCPCapability[];
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  authentication: MCPAuth;
  config: MCPConfig;
}

export interface MCPCapability {
  name: string;
  description: string;
  parameters: MCPParameter[];
  returnType: string;
  examples: MCPExample[];
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: MCPValidation;
}

export interface MCPValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  min?: number;
  max?: number;
}

export interface MCPExample {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedResult: any;
}

export interface MCPAuth {
  type: 'none' | 'api_key' | 'oauth2' | 'jwt';
  credentials: Record<string, string>;
  headers?: Record<string, string>;
}

export interface MCPConfig {
  timeout: number;
  retryAttempts: number;
  rateLimit: {
    requests: number;
    period: number; // in seconds
  };
  caching: {
    enabled: boolean;
    ttl: number; // in seconds
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface MCPRequest {
  capability: string;
  parameters: Record<string, any>;
  context?: MCPRequestContext;
  metadata?: Record<string, any>;
}

export interface MCPRequestContext {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  sessionId?: string;
  userContext?: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: MCPError;
  metadata: MCPResponseMetadata;
}

export interface MCPError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface MCPResponseMetadata {
  serverId: string;
  capability: string;
  executionTime: number;
  cacheHit: boolean;
  requestId: string;
  timestamp: string;
}

export interface MCPServerRegistry {
  servers: MCPServer[];
  defaultServers: string[];
  serverGroups: MCPServerGroup[];
}

export interface MCPServerGroup {
  id: string;
  name: string;
  description: string;
  serverIds: string[];
  loadBalancing: 'round_robin' | 'random' | 'weighted' | 'failover';
  weights?: Record<string, number>;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  capability: string;
  icon?: string;
  category: string;
  tags: string[];
  usage: MCPToolUsage;
}

export interface MCPToolUsage {
  totalCalls: number;
  successRate: number;
  averageExecutionTime: number;
  lastUsed: string;
  errorRate: number;
}

export const useMCPServer = () => {
  const [servers, setServers] = useState<Map<string, MCPServer>>(new Map());
  const [tools, setTools] = useState<Map<string, MCPTool>>(new Map());
  const [activeRequests, setActiveRequests] = useState<Map<string, any>>(new Map());
  const [serverRegistry, setServerRegistry] = useState<MCPServerRegistry | null>(null);
  const requestCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const rateLimiters = useRef<Map<string, { requests: number; resetTime: number }>>(new Map());
  
  const { addNotification, projects, agents } = useDashboardStore();

  // Initialize MCP server registry
  const initializeRegistry = useCallback(async () => {
    try {
      // Load server registry from configuration or API
      const registry: MCPServerRegistry = {
        servers: [
          {
            id: 'code-analysis-server',
            name: 'Code Analysis Server',
            description: 'Advanced code analysis, refactoring, and optimization tools',
            url: 'http://localhost:3002/mcp',
            version: '1.0.0',
            capabilities: [
              {
                name: 'analyze_complexity',
                description: 'Analyze code complexity and suggest improvements',
                parameters: [
                  {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'Source code to analyze',
                  },
                  {
                    name: 'language',
                    type: 'string',
                    required: true,
                    description: 'Programming language',
                  },
                  {
                    name: 'metrics',
                    type: 'array',
                    required: false,
                    description: 'Specific metrics to calculate',
                    defaultValue: ['cyclomatic', 'cognitive', 'maintainability'],
                  },
                ],
                returnType: 'object',
                examples: [
                  {
                    name: 'Analyze TypeScript function',
                    description: 'Analyze complexity of a TypeScript function',
                    parameters: {
                      code: 'function calculateTotal(items) { /* ... */ }',
                      language: 'typescript',
                    },
                    expectedResult: {
                      cyclomaticComplexity: 5,
                      cognitiveComplexity: 3,
                      maintainabilityIndex: 72,
                    },
                  },
                ],
              },
              {
                name: 'refactor_code',
                description: 'Refactor code for better maintainability and performance',
                parameters: [
                  {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'Code to refactor',
                  },
                  {
                    name: 'refactoring_type',
                    type: 'string',
                    required: true,
                    description: 'Type of refactoring',
                    validation: {
                      enum: ['extract_method', 'rename_variable', 'simplify_conditions', 'optimize_performance'],
                    },
                  },
                ],
                returnType: 'object',
                examples: [],
              },
            ],
            status: 'disconnected',
            authentication: {
              type: 'api_key',
              credentials: {},
            },
            config: {
              timeout: 30000,
              retryAttempts: 3,
              rateLimit: { requests: 100, period: 60 },
              caching: { enabled: true, ttl: 300 },
              logging: { enabled: true, level: 'info' },
            },
          },
          {
            id: 'test-generation-server',
            name: 'Test Generation Server',
            description: 'Automated test generation and validation tools',
            url: 'http://localhost:3003/mcp',
            version: '1.0.0',
            capabilities: [
              {
                name: 'generate_unit_tests',
                description: 'Generate comprehensive unit tests for code',
                parameters: [
                  {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'Source code to test',
                  },
                  {
                    name: 'framework',
                    type: 'string',
                    required: true,
                    description: 'Testing framework',
                    validation: {
                      enum: ['jest', 'mocha', 'pytest', 'junit', 'vitest'],
                    },
                  },
                  {
                    name: 'coverage_target',
                    type: 'number',
                    required: false,
                    description: 'Target code coverage percentage',
                    defaultValue: 90,
                    validation: { min: 0, max: 100 },
                  },
                ],
                returnType: 'object',
                examples: [],
              },
              {
                name: 'generate_integration_tests',
                description: 'Generate integration tests for APIs and components',
                parameters: [
                  {
                    name: 'endpoints',
                    type: 'array',
                    required: true,
                    description: 'API endpoints to test',
                  },
                  {
                    name: 'framework',
                    type: 'string',
                    required: true,
                    description: 'Testing framework',
                  },
                ],
                returnType: 'object',
                examples: [],
              },
            ],
            status: 'disconnected',
            authentication: { type: 'none', credentials: {} },
            config: {
              timeout: 60000,
              retryAttempts: 2,
              rateLimit: { requests: 50, period: 60 },
              caching: { enabled: true, ttl: 600 },
              logging: { enabled: true, level: 'info' },
            },
          },
          {
            id: 'deployment-automation-server',
            name: 'Deployment Automation Server',
            description: 'CI/CD pipeline automation and deployment tools',
            url: 'http://localhost:3004/mcp',
            version: '1.0.0',
            capabilities: [
              {
                name: 'generate_pipeline',
                description: 'Generate CI/CD pipeline configuration',
                parameters: [
                  {
                    name: 'platform',
                    type: 'string',
                    required: true,
                    description: 'CI/CD platform',
                    validation: {
                      enum: ['github_actions', 'gitlab_ci', 'jenkins', 'azure_devops'],
                    },
                  },
                  {
                    name: 'project_type',
                    type: 'string',
                    required: true,
                    description: 'Project type',
                  },
                  {
                    name: 'deployment_targets',
                    type: 'array',
                    required: true,
                    description: 'Deployment targets',
                  },
                ],
                returnType: 'object',
                examples: [],
              },
            ],
            status: 'disconnected',
            authentication: { type: 'api_key', credentials: {} },
            config: {
              timeout: 45000,
              retryAttempts: 3,
              rateLimit: { requests: 30, period: 60 },
              caching: { enabled: false, ttl: 0 },
              logging: { enabled: true, level: 'debug' },
            },
          },
        ],
        defaultServers: ['code-analysis-server', 'test-generation-server'],
        serverGroups: [
          {
            id: 'code-quality-group',
            name: 'Code Quality Tools',
            description: 'Servers providing code quality analysis and improvement tools',
            serverIds: ['code-analysis-server', 'test-generation-server'],
            loadBalancing: 'round_robin',
          },
          {
            id: 'deployment-group',
            name: 'Deployment Tools',
            description: 'Servers providing deployment and CI/CD automation',
            serverIds: ['deployment-automation-server'],
            loadBalancing: 'failover',
          },
        ],
      };

      setServerRegistry(registry);
      
      // Initialize servers
      for (const server of registry.servers) {
        servers.set(server.id, server);
        
        // Create tools from capabilities
        for (const capability of server.capabilities) {
          const tool: MCPTool = {
            id: `${server.id}_${capability.name}`,
            name: capability.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: capability.description,
            serverId: server.id,
            capability: capability.name,
            category: getToolCategory(capability.name),
            tags: getTags(capability.name, server.name),
            usage: {
              totalCalls: 0,
              successRate: 1.0,
              averageExecutionTime: 0,
              lastUsed: '',
              errorRate: 0,
            },
          };
          tools.set(tool.id, tool);
        }
      }
      
      setServers(new Map(servers));
      setTools(new Map(tools));

      addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'MCP Servers Initialized',
        message: `Loaded ${registry.servers.length} MCP servers with ${Array.from(tools.values()).length} tools`,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error('Failed to initialize MCP registry:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'MCP Initialization Failed',
        message: 'Failed to initialize MCP server registry',
        timestamp: new Date().toISOString(),
        priority: 'high',
        ttsEnabled: true,
        crossDeviceSync: true,
      });
    }
  }, [addNotification]);

  // Connect to MCP server
  const connectServer = useCallback(async (serverId: string): Promise<void> => {
    const server = servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      // Update status to connecting
      const updatedServer = { ...server, status: 'connecting' as const };
      servers.set(serverId, updatedServer);
      setServers(new Map(servers));

      // Attempt connection
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(server.authentication),
        },
        signal: AbortSignal.timeout(server.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // Update status to connected
      const connectedServer = { ...server, status: 'connected' as const };
      servers.set(serverId, connectedServer);
      setServers(new Map(servers));

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'MCP Server Connected',
        message: `Connected to ${server.name}`,
        timestamp: new Date().toISOString(),
        priority: 'low',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error(`Failed to connect to server ${serverId}:`, error);
      
      const errorServer = { ...server, status: 'error' as const };
      servers.set(serverId, errorServer);
      setServers(new Map(servers));

      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'MCP Connection Failed',
        message: `Failed to connect to ${server.name}`,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });
    }
  }, [servers, addNotification]);

  // Execute MCP request
  const executeRequest = useCallback(async (request: MCPRequest): Promise<MCPResponse> => {
    const tool = Array.from(tools.values()).find(t => t.capability === request.capability);
    if (!tool) {
      throw new Error(`Capability ${request.capability} not found`);
    }

    const server = servers.get(tool.serverId);
    if (!server || server.status !== 'connected') {
      throw new Error(`Server ${tool.serverId} not available`);
    }

    const requestId = `${tool.serverId}_${request.capability}_${Date.now()}`;
    
    try {
      // Check rate limiting
      await checkRateLimit(server);
      
      // Check cache
      const cacheKey = getCacheKey(request);
      if (server.config.caching.enabled && requestCache.current.has(cacheKey)) {
        const cached = requestCache.current.get(cacheKey)!;
        if (Date.now() - cached.timestamp < server.config.caching.ttl * 1000) {
          return {
            success: true,
            data: cached.data,
            metadata: {
              serverId: server.id,
              capability: request.capability,
              executionTime: 0,
              cacheHit: true,
              requestId,
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      // Track active request
      setActiveRequests(prev => new Map(prev.set(requestId, {
        serverId: server.id,
        capability: request.capability,
        startTime: Date.now(),
      })));

      const startTime = Date.now();

      // Execute request
      const response = await fetch(`${server.url}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(server.authentication),
        },
        body: JSON.stringify({
          capability: request.capability,
          parameters: request.parameters,
          context: request.context,
          metadata: request.metadata,
        }),
        signal: AbortSignal.timeout(server.config.timeout),
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();

      // Update tool usage statistics
      const updatedTool = { ...tool };
      updatedTool.usage.totalCalls++;
      updatedTool.usage.averageExecutionTime = 
        (updatedTool.usage.averageExecutionTime * (updatedTool.usage.totalCalls - 1) + executionTime) / 
        updatedTool.usage.totalCalls;
      updatedTool.usage.lastUsed = new Date().toISOString();
      
      if (result.success) {
        updatedTool.usage.successRate = 
          (updatedTool.usage.successRate * (updatedTool.usage.totalCalls - 1) + 1) / 
          updatedTool.usage.totalCalls;
      } else {
        updatedTool.usage.errorRate = 
          (updatedTool.usage.errorRate * (updatedTool.usage.totalCalls - 1) + 1) / 
          updatedTool.usage.totalCalls;
      }
      
      tools.set(tool.id, updatedTool);
      setTools(new Map(tools));

      // Cache successful results
      if (result.success && server.config.caching.enabled) {
        requestCache.current.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        metadata: {
          serverId: server.id,
          capability: request.capability,
          executionTime,
          cacheHit: false,
          requestId,
          timestamp: new Date().toISOString(),
        },
      };

    } finally {
      setActiveRequests(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  }, [servers, tools]);

  // Batch execute multiple requests
  const batchExecute = useCallback(async (requests: MCPRequest[]): Promise<MCPResponse[]> => {
    const results = await Promise.allSettled(
      requests.map(request => executeRequest(request))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: {
            code: 'BATCH_EXECUTION_ERROR',
            message: result.reason.message || 'Batch execution failed',
            retryable: false,
          },
          metadata: {
            serverId: '',
            capability: '',
            executionTime: 0,
            cacheHit: false,
            requestId: Date.now().toString(),
            timestamp: new Date().toISOString(),
          },
        };
      }
    });
  }, [executeRequest]);

  // Get available tools by category
  const getToolsByCategory = useCallback((category?: string): MCPTool[] => {
    const allTools = Array.from(tools.values());
    return category ? allTools.filter(tool => tool.category === category) : allTools;
  }, [tools]);

  // Helper functions
  const checkRateLimit = async (server: MCPServer): Promise<void> => {
    const limiter = rateLimiters.current.get(server.id);
    const now = Date.now();
    
    if (!limiter) {
      rateLimiters.current.set(server.id, {
        requests: 1,
        resetTime: now + (server.config.rateLimit.period * 1000),
      });
      return;
    }

    if (now > limiter.resetTime) {
      limiter.requests = 1;
      limiter.resetTime = now + (server.config.rateLimit.period * 1000);
    } else if (limiter.requests >= server.config.rateLimit.requests) {
      throw new Error(`Rate limit exceeded for server ${server.id}`);
    } else {
      limiter.requests++;
    }
  };

  const buildAuthHeaders = (auth: MCPAuth): Record<string, string> => {
    switch (auth.type) {
      case 'api_key':
        return {
          'Authorization': `Bearer ${auth.credentials.apiKey}`,
          ...auth.headers,
        };
      case 'jwt':
        return {
          'Authorization': `Bearer ${auth.credentials.token}`,
          ...auth.headers,
        };
      default:
        return auth.headers || {};
    }
  };

  const getCacheKey = (request: MCPRequest): string => {
    return `${request.capability}_${JSON.stringify(request.parameters)}`;
  };

  // Initialize on mount
  useEffect(() => {
    initializeRegistry();
  }, [initializeRegistry]);

  // Connect to default servers
  useEffect(() => {
    if (serverRegistry) {
      serverRegistry.defaultServers.forEach(serverId => {
        connectServer(serverId).catch(console.error);
      });
    }
  }, [serverRegistry, connectServer]);

  return {
    // Server management
    servers: Array.from(servers.values()),
    serverRegistry,
    connectServer,
    
    // Tool management
    tools: Array.from(tools.values()),
    getToolsByCategory,
    
    // Request execution
    executeRequest,
    batchExecute,
    
    // Status
    activeRequests: Array.from(activeRequests.entries()),
    isInitialized: serverRegistry !== null,
  };
};

// Helper functions for categorization
function getToolCategory(capabilityName: string): string {
  if (capabilityName.includes('test') || capabilityName.includes('coverage')) {
    return 'Testing';
  } else if (capabilityName.includes('analyze') || capabilityName.includes('complexity')) {
    return 'Code Analysis';
  } else if (capabilityName.includes('refactor') || capabilityName.includes('optimize')) {
    return 'Code Optimization';
  } else if (capabilityName.includes('deploy') || capabilityName.includes('pipeline')) {
    return 'Deployment';
  } else {
    return 'General';
  }
}

function getTags(capabilityName: string, serverName: string): string[] {
  const tags = [];
  
  if (capabilityName.includes('test')) tags.push('testing');
  if (capabilityName.includes('analyze')) tags.push('analysis');
  if (capabilityName.includes('refactor')) tags.push('refactoring');
  if (capabilityName.includes('generate')) tags.push('generation');
  if (capabilityName.includes('deploy')) tags.push('deployment');
  if (capabilityName.includes('pipeline')) tags.push('ci-cd');
  
  return tags;
}