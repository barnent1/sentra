/**
 * WebSocket event system for real-time Evolution API updates
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { 
  AgentInstance, 
  LearningOutcome, 
  PerformanceMetrics,
  EvolutionDnaId,
  AgentInstanceId,
} from '@sentra/types';

import { AuthService, authenticateWebSocket, type JwtPayload } from '../middleware/auth';
import { WebSocketMessageSchema } from '../schemas/validation';

/**
 * WebSocket event types
 */
export const WebSocketEvents = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  
  // Subscription management
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  
  // Evolution events
  PATTERN_EVOLVED: 'pattern:evolved',
  PATTERN_CREATED: 'pattern:created',
  PATTERN_UPDATED: 'pattern:updated',
  PATTERN_DELETED: 'pattern:deleted',
  
  // Agent events
  AGENT_STATUS: 'agent:status',
  AGENT_SPAWNED: 'agent:spawned',
  AGENT_UPDATED: 'agent:updated',
  AGENT_ARCHIVED: 'agent:archived',
  
  // Learning events
  LEARNING_OUTCOME: 'learning:outcome',
  LEARNING_PATTERN_DISCOVERED: 'learning:pattern_discovered',
  
  // Metrics events
  METRICS_UPDATE: 'metrics:update',
  PERFORMANCE_ALERT: 'performance:alert',
  
  // System events
  SYSTEM_HEALTH: 'system:health',
  SYSTEM_MAINTENANCE: 'system:maintenance',

  // Observability events (Disler-style monitoring)
  TOOL_USAGE_STARTED: 'observability:tool_started',
  TOOL_USAGE_COMPLETED: 'observability:tool_completed',
  AGENT_DECISION: 'observability:agent_decision',
  AGENT_MEMORY_OPERATION: 'observability:memory_operation',
  AGENT_COORDINATION: 'observability:coordination',
  PERFORMANCE_PULSE: 'observability:performance_pulse',
  LEARNING_PATTERN: 'observability:learning_pattern',
  BEHAVIOR_PATTERN: 'observability:behavior_pattern',
} as const;

export type WebSocketEventType = typeof WebSocketEvents[keyof typeof WebSocketEvents];

/**
 * Event payload interfaces
 */
export interface PatternEvolvedPayload {
  readonly parentDnaId: EvolutionDnaId;
  readonly childDnaId: EvolutionDnaId;
  readonly generation: number;
  readonly improvements: Record<string, number>;
  readonly confidenceScore: number;
  readonly timestamp: Date;
}

export interface AgentStatusPayload {
  readonly agentId: AgentInstanceId;
  readonly status: AgentInstance['status'];
  readonly currentTaskId?: string;
  readonly lastActiveAt: Date;
  readonly performanceSnapshot?: PerformanceMetrics;
}

export interface LearningOutcomePayload {
  readonly outcomeId: string;
  readonly agentId: AgentInstanceId;
  readonly taskId: string;
  readonly outcomeType: LearningOutcome['outcomeType'];
  readonly performanceImprovement: number;
  readonly lessonLearned: string;
  readonly applicabilityScore: number;
  readonly timestamp: Date;
}

export interface MetricsUpdatePayload {
  readonly timestamp: Date;
  readonly metrics: Record<string, number>;
  readonly timeRange: string;
  readonly previousValues?: Record<string, number>;
}

export interface SystemHealthPayload {
  readonly timestamp: Date;
  readonly status: 'healthy' | 'degraded' | 'critical';
  readonly components: Record<string, {
    readonly status: 'up' | 'down' | 'degraded';
    readonly responseTime?: number;
    readonly errorRate?: number;
  }>;
  readonly alerts?: readonly string[];
}

/**
 * Observability event payloads (Disler-style monitoring)
 */
export interface ToolUsageStartedPayload {
  readonly agentId: AgentInstanceId;
  readonly sessionId: string;
  readonly taskId?: string;
  readonly toolName: string;
  readonly toolVersion?: string;
  readonly parameters: Record<string, unknown>;
  readonly expectedDuration?: number;
  readonly context: {
    readonly userQuery?: string;
    readonly previousTools: readonly string[];
    readonly chainOfThought?: string;
  };
  readonly timestamp: Date;
}

export interface ToolUsageCompletedPayload {
  readonly agentId: AgentInstanceId;
  readonly sessionId: string;
  readonly taskId?: string;
  readonly toolName: string;
  readonly duration: number;
  readonly success: boolean;
  readonly result?: unknown;
  readonly tokensUsed: number;
  readonly errorCount: number;
  readonly warnings: readonly string[];
  readonly performanceMetrics: {
    readonly executionTime: number;
    readonly memoryUsed: number;
    readonly cpuTime: number;
  };
  readonly timestamp: Date;
}

export interface AgentDecisionPayload {
  readonly agentId: AgentInstanceId;
  readonly sessionId: string;
  readonly taskId?: string;
  readonly decisionType: 'tool_selection' | 'approach_choice' | 'parameter_tuning' | 'strategy_pivot';
  readonly context: string;
  readonly options: readonly {
    readonly name: string;
    readonly confidence: number;
    readonly reasoning: string;
  }[];
  readonly selectedOption: string;
  readonly confidence: number;
  readonly reasoning: string;
  readonly factors: Record<string, number>;
  readonly timestamp: Date;
}

export interface MemoryOperationPayload {
  readonly agentId: AgentInstanceId;
  readonly sessionId: string;
  readonly operation: 'store' | 'retrieve' | 'update' | 'forget';
  readonly memoryType: 'working' | 'episodic' | 'semantic' | 'procedural';
  readonly key: string;
  readonly dataSize: number;
  readonly relevanceScore?: number;
  readonly retentionPriority: 'high' | 'medium' | 'low';
  readonly associatedConcepts: readonly string[];
  readonly timestamp: Date;
}

export interface CoordinationPayload {
  readonly initiatorId: AgentInstanceId;
  readonly targetId: AgentInstanceId;
  readonly coordinationType: 'delegation' | 'collaboration' | 'information_sharing' | 'conflict_resolution';
  readonly topic: string;
  readonly urgency: 'low' | 'medium' | 'high' | 'critical';
  readonly expectedOutcome: string;
  readonly context: {
    readonly sharedTaskId?: string;
    readonly sharedResources: readonly string[];
    readonly dependencies: readonly string[];
  };
  readonly timestamp: Date;
}

export interface PerformancePulsePayload {
  readonly agentId: AgentInstanceId;
  readonly sessionId: string;
  readonly pulse: {
    readonly cpuUsage: number;
    readonly memoryUsage: number;
    readonly activeConnections: number;
    readonly queueDepth: number;
    readonly responseTime: number;
    readonly errorRate: number;
  };
  readonly healthScore: number;
  readonly activities: readonly {
    readonly activity: string;
    readonly progress: number;
    readonly estimatedCompletion: number;
  }[];
  readonly timestamp: Date;
}

export interface LearningPatternPayload {
  readonly agentId: AgentInstanceId;
  readonly patternType: 'success_pattern' | 'failure_pattern' | 'efficiency_pattern' | 'adaptation_pattern';
  readonly pattern: {
    readonly name: string;
    readonly description: string;
    readonly confidence: number;
    readonly occurrences: number;
    readonly contexts: readonly string[];
    readonly actionableInsights: readonly string[];
  };
  readonly impact: 'low' | 'medium' | 'high';
  readonly recommendations: readonly string[];
  readonly timestamp: Date;
}

export interface BehaviorPatternPayload {
  readonly agentId: AgentInstanceId;
  readonly patternId: string;
  readonly type: 'efficiency' | 'error_prone' | 'learning' | 'collaboration';
  readonly confidence: number;
  readonly description: string;
  readonly evidence: readonly string[];
  readonly recommendations: readonly string[];
  readonly impact: 'low' | 'medium' | 'high';
  readonly detectedAt: Date;
}

/**
 * Connected client information
 */
export interface ConnectedClient {
  readonly socket: Socket;
  readonly user: JwtPayload;
  readonly connectedAt: Date;
  readonly subscriptions: Set<string>;
  readonly lastActivity: Date;
}

/**
 * WebSocket server configuration
 */
export interface WebSocketConfig {
  readonly cors: {
    readonly origin: string | string[];
    readonly methods: readonly string[];
  };
  readonly connectionTimeout: number;
  readonly maxConnections: number;
  readonly heartbeatInterval: number;
}

/**
 * Event broadcasting service
 */
export class EvolutionEventBroadcaster {
  private readonly io: SocketIOServer;
  private readonly authService: AuthService;
  private readonly clients: Map<string, ConnectedClient>;
  private readonly config: WebSocketConfig;
  private readonly logger: any; // TODO: Type when logger is configured
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    httpServer: HTTPServer,
    authService: AuthService,
    config: WebSocketConfig,
    logger?: any
  ) {
    this.authService = authService;
    this.config = config;
    this.logger = logger;
    this.clients = new Map();

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin as string | string[],
        methods: config.cors.methods as string[],
        credentials: true,
      },
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  /**
   * Setup WebSocket event handlers
   */
  private readonly setupEventHandlers = (): void => {
    this.io.on(WebSocketEvents.CONNECTION, this.handleConnection);

    this.io.engine.on('connection_error', (err: Error) => {
      this.logger?.error('WebSocket connection error', { error: err.message });
    });
  };

  /**
   * Handle new WebSocket connection
   */
  private readonly handleConnection = (socket: Socket): void => {
    this.logger?.info('WebSocket connection attempt', { socketId: socket.id });

    // Set connection timeout
    const timeoutId = setTimeout(() => {
      if (!this.clients.has(socket.id)) {
        socket.emit(WebSocketEvents.ERROR, {
          code: 'AUTH_TIMEOUT',
          message: 'Authentication timeout',
        });
        socket.disconnect(true);
      }
    }, this.config.connectionTimeout);

    // Handle authentication
    socket.on(WebSocketEvents.AUTHENTICATE, async (data: unknown) => {
      clearTimeout(timeoutId);
      await this.handleAuthentication(socket, data);
    });

    // Handle disconnect
    socket.on(WebSocketEvents.DISCONNECT, (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle generic errors
    socket.on(WebSocketEvents.ERROR, (error: any) => {
      this.logger?.error('WebSocket error', { 
        socketId: socket.id, 
        error: error.message || error 
      });
    });
  };

  /**
   * Handle client authentication
   */
  private readonly handleAuthentication = async (
    socket: Socket, 
    data: any
  ): Promise<void> => {
    try {
      // Validate authentication message
      const authMessage = WebSocketMessageSchema.parse(data);
      
      if (authMessage.type !== 'auth') {
        throw new Error('Expected authentication message');
      }

      // Authenticate user
      const user = await authenticateWebSocket(this.authService, authMessage.token);

      // Check connection limits
      if (this.clients.size >= this.config.maxConnections) {
        socket.emit(WebSocketEvents.ERROR, {
          code: 'MAX_CONNECTIONS',
          message: 'Maximum connections exceeded',
        });
        socket.disconnect(true);
        return;
      }

      // Store client information
      const client: ConnectedClient = {
        socket,
        user,
        connectedAt: new Date(),
        subscriptions: new Set(),
        lastActivity: new Date(),
      };

      this.clients.set(socket.id, client);

      // Set up authenticated event handlers
      this.setupAuthenticatedHandlers(socket);

      // Notify client of successful authentication
      socket.emit(WebSocketEvents.AUTHENTICATED, {
        userId: user.userId,
        permissions: user.permissions,
        timestamp: new Date(),
      });

      this.logger?.info('WebSocket client authenticated', {
        socketId: socket.id,
        userId: user.userId,
        role: user.role,
      });

    } catch (error) {
      this.logger?.warn('WebSocket authentication failed', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit(WebSocketEvents.ERROR, {
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
      });
      socket.disconnect(true);
    }
  };

  /**
   * Setup event handlers for authenticated clients
   */
  private readonly setupAuthenticatedHandlers = (socket: Socket): void => {
    // Handle subscription requests
    socket.on(WebSocketEvents.SUBSCRIBE, (data: unknown) => {
      this.handleSubscription(socket, data, 'subscribe');
    });

    // Handle unsubscription requests
    socket.on(WebSocketEvents.UNSUBSCRIBE, (data: unknown) => {
      this.handleSubscription(socket, data, 'unsubscribe');
    });

    // Update last activity
    socket.onAny(() => {
      const client = this.clients.get(socket.id);
      if (client) {
        this.clients.set(socket.id, {
          ...client,
          lastActivity: new Date(),
        });
      }
    });
  };

  /**
   * Handle subscription/unsubscription requests
   */
  private readonly handleSubscription = (
    socket: Socket,
    data: any,
    action: 'subscribe' | 'unsubscribe'
  ): void => {
    try {
      const client = this.clients.get(socket.id);
      if (!client) {
        return;
      }

      const message = WebSocketMessageSchema.parse(data);
      
      if (message.type !== action) {
        throw new Error(`Expected ${action} message`);
      }

      const channels = message.channels || [];

      // Validate channels against user permissions
      const allowedChannels = this.getAllowedChannels(client.user);
      const validChannels = channels.filter(channel => 
        allowedChannels.includes(channel as any)
      );

      if (action === 'subscribe') {
        // Join socket rooms for channels
        validChannels.forEach(channel => {
          socket.join(channel);
          client.subscriptions.add(channel);
        });

        socket.emit(WebSocketEvents.SUBSCRIBED, {
          channels: validChannels,
          timestamp: new Date(),
        });
      } else {
        // Leave socket rooms for channels
        validChannels.forEach(channel => {
          socket.leave(channel);
          client.subscriptions.delete(channel);
        });

        socket.emit(WebSocketEvents.UNSUBSCRIBED, {
          channels: validChannels,
          timestamp: new Date(),
        });
      }

      this.logger?.info(`WebSocket client ${action}d`, {
        socketId: socket.id,
        userId: client.user.userId,
        channels: validChannels,
      });

    } catch (error) {
      socket.emit(WebSocketEvents.ERROR, {
        code: 'SUBSCRIPTION_ERROR',
        message: error instanceof Error ? error.message : 'Subscription failed',
      });
    }
  };

  /**
   * Get allowed channels based on user permissions
   */
  private readonly getAllowedChannels = (user: JwtPayload): string[] => {
    const allChannels = [
      'pattern:evolved',
      'pattern:created',
      'pattern:updated',
      'agent:status',
      'agent:spawned',
      'learning:outcome',
      'metrics:update',
      'system:health',
    ];

    // Admin users can access all channels
    if (user.role === 'admin') {
      return allChannels;
    }

    // Add observability channels
    const observabilityChannels = [
      'observability:tool_started',
      'observability:tool_completed',
      'observability:agent_decision',
      'observability:memory_operation',
      'observability:coordination',
      'observability:performance_pulse',
      'observability:learning_pattern',
      'observability:behavior_pattern',
    ];
    
    const allChannelsWithObservability = [...allChannels, ...observabilityChannels];

    // Regular users can access most channels except system management
    if (user.role === 'user') {
      return allChannelsWithObservability.filter(channel => 
        !channel.startsWith('system:') || channel === 'system:health'
      );
    }

    // Readonly users can only access read events including observability
    return [
      'pattern:evolved',
      'agent:status',
      'metrics:update',
      'system:health',
      ...observabilityChannels,
    ];
  };

  /**
   * Handle client disconnection
   */
  private readonly handleDisconnection = (socket: Socket, reason: string): void => {
    const client = this.clients.get(socket.id);
    if (client) {
      this.logger?.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: client.user.userId,
        reason,
        duration: Date.now() - client.connectedAt.getTime(),
      });
      this.clients.delete(socket.id);
    }
  };

  /**
   * Start heartbeat to check connection health
   */
  private readonly startHeartbeat = (): void => {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [socketId, client] of this.clients.entries()) {
        const timeSinceActivity = now.getTime() - client.lastActivity.getTime();
        
        if (timeSinceActivity > staleThreshold) {
          this.logger?.warn('Disconnecting stale WebSocket client', {
            socketId,
            userId: client.user.userId,
            timeSinceActivity,
          });
          client.socket.disconnect(true);
          this.clients.delete(socketId);
        }
      }
    }, this.config.heartbeatInterval);
  };

  /**
   * Event broadcasting methods
   */
  public readonly broadcastPatternEvolved = (payload: PatternEvolvedPayload): void => {
    this.io.to('pattern:evolved').emit(WebSocketEvents.PATTERN_EVOLVED, payload);
    this.logger?.debug('Broadcasted pattern evolved event', { 
      parentDnaId: payload.parentDnaId,
      childDnaId: payload.childDnaId,
    });
  };

  public readonly broadcastAgentStatus = (payload: AgentStatusPayload): void => {
    this.io.to('agent:status').emit(WebSocketEvents.AGENT_STATUS, payload);
    this.logger?.debug('Broadcasted agent status event', { 
      agentId: payload.agentId,
      status: payload.status,
    });
  };

  public readonly broadcastLearningOutcome = (payload: LearningOutcomePayload): void => {
    this.io.to('learning:outcome').emit(WebSocketEvents.LEARNING_OUTCOME, payload);
    this.logger?.debug('Broadcasted learning outcome event', { 
      outcomeId: payload.outcomeId,
      agentId: payload.agentId,
    });
  };

  public readonly broadcastMetricsUpdate = (payload: MetricsUpdatePayload): void => {
    this.io.to('metrics:update').emit(WebSocketEvents.METRICS_UPDATE, payload);
    this.logger?.debug('Broadcasted metrics update event', { 
      timestamp: payload.timestamp,
      metricCount: Object.keys(payload.metrics).length,
    });
  };

  public readonly broadcastSystemHealth = (payload: SystemHealthPayload): void => {
    this.io.to('system:health').emit(WebSocketEvents.SYSTEM_HEALTH, payload);
    this.logger?.debug('Broadcasted system health event', { 
      status: payload.status,
      componentCount: Object.keys(payload.components).length,
    });
  };

  /**
   * Observability event broadcasting methods (Disler-style monitoring)
   */
  public readonly broadcastToolUsageStarted = (payload: ToolUsageStartedPayload): void => {
    this.io.to('observability:tool_started').emit(WebSocketEvents.TOOL_USAGE_STARTED, payload);
    this.logger?.debug('Broadcasted tool usage started event', {
      agentId: payload.agentId,
      toolName: payload.toolName,
      sessionId: payload.sessionId,
    });
  };

  public readonly broadcastToolUsageCompleted = (payload: ToolUsageCompletedPayload): void => {
    this.io.to('observability:tool_completed').emit(WebSocketEvents.TOOL_USAGE_COMPLETED, payload);
    this.logger?.debug('Broadcasted tool usage completed event', {
      agentId: payload.agentId,
      toolName: payload.toolName,
      duration: payload.duration,
      success: payload.success,
    });
  };

  public readonly broadcastAgentDecision = (payload: AgentDecisionPayload): void => {
    this.io.to('observability:agent_decision').emit(WebSocketEvents.AGENT_DECISION, payload);
    this.logger?.debug('Broadcasted agent decision event', {
      agentId: payload.agentId,
      decisionType: payload.decisionType,
      selectedOption: payload.selectedOption,
      confidence: payload.confidence,
    });
  };

  public readonly broadcastMemoryOperation = (payload: MemoryOperationPayload): void => {
    this.io.to('observability:memory_operation').emit(WebSocketEvents.AGENT_MEMORY_OPERATION, payload);
    this.logger?.debug('Broadcasted memory operation event', {
      agentId: payload.agentId,
      operation: payload.operation,
      memoryType: payload.memoryType,
      key: payload.key,
    });
  };

  public readonly broadcastCoordination = (payload: CoordinationPayload): void => {
    this.io.to('observability:coordination').emit(WebSocketEvents.AGENT_COORDINATION, payload);
    this.logger?.debug('Broadcasted coordination event', {
      initiatorId: payload.initiatorId,
      targetId: payload.targetId,
      coordinationType: payload.coordinationType,
      urgency: payload.urgency,
    });
  };

  public readonly broadcastPerformancePulse = (payload: PerformancePulsePayload): void => {
    this.io.to('observability:performance_pulse').emit(WebSocketEvents.PERFORMANCE_PULSE, payload);
    this.logger?.debug('Broadcasted performance pulse event', {
      agentId: payload.agentId,
      healthScore: payload.healthScore,
      cpuUsage: payload.pulse.cpuUsage,
      memoryUsage: payload.pulse.memoryUsage,
    });
  };

  public readonly broadcastLearningPattern = (payload: LearningPatternPayload): void => {
    this.io.to('observability:learning_pattern').emit(WebSocketEvents.LEARNING_PATTERN, payload);
    this.logger?.debug('Broadcasted learning pattern event', {
      agentId: payload.agentId,
      patternType: payload.patternType,
      confidence: payload.pattern.confidence,
      impact: payload.impact,
    });
  };

  public readonly broadcastBehaviorPattern = (payload: BehaviorPatternPayload): void => {
    this.io.to('observability:behavior_pattern').emit(WebSocketEvents.BEHAVIOR_PATTERN, payload);
    this.logger?.debug('Broadcasted behavior pattern event', {
      agentId: payload.agentId,
      type: payload.type,
      confidence: payload.confidence,
      impact: payload.impact,
    });
  };

  /**
   * Get connection statistics
   */
  public readonly getStats = () => {
    const stats = {
      totalConnections: this.clients.size,
      connectionsByRole: {} as Record<string, number>,
      subscriptionsByChannel: {} as Record<string, number>,
    };

    for (const client of this.clients.values()) {
      // Count by role
      stats.connectionsByRole[client.user.role] = 
        (stats.connectionsByRole[client.user.role] || 0) + 1;

      // Count subscriptions by channel
      for (const channel of client.subscriptions) {
        stats.subscriptionsByChannel[channel] = 
          (stats.subscriptionsByChannel[channel] || 0) + 1;
      }
    }

    return stats;
  };

  /**
   * Shutdown the WebSocket server
   */
  public readonly shutdown = (): void => {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Disconnect all clients
    for (const client of this.clients.values()) {
      client.socket.disconnect(true);
    }
    
    this.clients.clear();
    this.io.close();
    
    this.logger?.info('WebSocket server shutdown complete');
  };
}