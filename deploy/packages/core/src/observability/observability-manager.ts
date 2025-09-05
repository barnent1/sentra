/**
 * Observability Manager - Central coordinator for Disler-style agent monitoring
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import type {
  AgentInstanceId,
  TaskId,
} from '@sentra/types';

import type {
  BaseEvent,
  EventBus,
  ToolUsageStartedEvent,
  ToolUsageCompletedEvent,
  AgentDecisionEvent,
  AgentMemoryOperationEvent,
  AgentCoordinationEvent,
  PerformancePulseEvent,
  AgentLearningPatternEvent,
  EventId,
  EventCategory,
  EventPriority,
  EventSource,
  EventMetadata,
} from '../types/events';

import {
  EventHookManager,
  type SessionId,
  type HookId,
  type PreToolHookData,
  type PostToolHookData,
  type AgentDecisionHookData,
  type MemoryOperationHookData,
  type PerformancePulseHookData,
  createSessionId,
  createHookId,
} from './event-hooks';

// ============================================================================
// OBSERVABILITY MANAGER
// ============================================================================

/**
 * Configuration for observability manager
 */
export interface ObservabilityConfig {
  readonly enabled: boolean;
  readonly realTimeStreaming: boolean;
  readonly performancePulseInterval: number;  // milliseconds
  readonly metricsRetentionDays: number;
  readonly maxSessionsInMemory: number;
  readonly eventBufferSize: number;
}

/**
 * Active session tracking
 */
export interface ActiveSession {
  readonly sessionId: SessionId;
  readonly agentId: AgentInstanceId;
  readonly startTime: Date;
  readonly taskId?: TaskId;
  readonly toolsUsed: readonly string[];
  readonly decisionsCount: number;
  readonly memoryOperations: number;
  readonly lastActivity: Date;
}

/**
 * Central observability manager coordinating all monitoring activities
 */
export class ObservabilityManager {
  private readonly hookManager: EventHookManager;
  private readonly eventBus?: EventBus;
  private readonly config: ObservabilityConfig;
  private readonly logger: any; // TODO: Type when logger is configured

  // Session tracking
  private readonly activeSessions = new Map<SessionId, ActiveSession>();
  private readonly sessionsByAgent = new Map<AgentInstanceId, Set<SessionId>>();

  // Performance monitoring
  private performancePulseTimer?: NodeJS.Timeout;

  // Event buffer for real-time streaming
  private eventBuffer: BaseEvent[] = [];

  private readonly defaultConfig: ObservabilityConfig = {
    enabled: true,
    realTimeStreaming: true,
    performancePulseInterval: 5000, // 5 seconds
    metricsRetentionDays: 30,
    maxSessionsInMemory: 1000,
    eventBufferSize: 10000,
  };

  constructor(
    eventBus?: EventBus,
    config?: Partial<ObservabilityConfig>,
    logger?: any
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.eventBus = eventBus;
    this.logger = logger;

    // Initialize hook manager with observability event handlers
    this.hookManager = new EventHookManager({
      enabled: this.config.enabled,
      async: true,
      maxRetries: 2,
      retryDelay: 500,
      timeout: 3000,
    }, this.logger);

    this.setupObservabilityHooks();

    if (this.config.enabled) {
      this.startPerformanceMonitoring();
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Start a new observability session for an agent
   */
  startSession(agentId: AgentInstanceId, taskId?: TaskId): SessionId {
    const sessionId = createSessionId();
    const session: ActiveSession = {
      sessionId,
      agentId,
      startTime: new Date(),
      taskId,
      toolsUsed: [],
      decisionsCount: 0,
      memoryOperations: 0,
      lastActivity: new Date(),
    };

    this.activeSessions.set(sessionId, session);

    // Track sessions by agent
    if (!this.sessionsByAgent.has(agentId)) {
      this.sessionsByAgent.set(agentId, new Set());
    }
    this.sessionsByAgent.get(agentId)!.add(sessionId);

    // Clean up old sessions if we exceed limit
    this.cleanupOldSessions();

    this.logger?.debug('Started observability session', {
      sessionId,
      agentId,
      taskId,
    });

    return sessionId;
  }

  /**
   * End an observability session
   */
  endSession(sessionId: SessionId): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Remove from agent tracking
    const agentSessions = this.sessionsByAgent.get(session.agentId);
    agentSessions?.delete(sessionId);
    if (agentSessions?.size === 0) {
      this.sessionsByAgent.delete(session.agentId);
    }

    // Remove session
    this.activeSessions.delete(sessionId);

    const duration = Date.now() - session.startTime.getTime();
    this.logger?.info('Ended observability session', {
      sessionId,
      agentId: session.agentId,
      duration,
      toolsUsed: session.toolsUsed.length,
      decisions: session.decisionsCount,
      memoryOps: session.memoryOperations,
    });
  }

  /**
   * Get active session for agent
   */
  getActiveSession(agentId: AgentInstanceId): SessionId | undefined {
    const sessions = this.sessionsByAgent.get(agentId);
    if (!sessions || sessions.size === 0) return undefined;

    // Return the most recent session
    const sessionArray = Array.from(sessions);
    return sessionArray[sessionArray.length - 1];
  }

  // ============================================================================
  // OBSERVABILITY EVENT TRIGGERS
  // ============================================================================

  /**
   * Track tool usage start
   */
  async trackToolStart(data: Omit<PreToolHookData, 'sessionId'>): Promise<void> {
    const sessionId = this.getActiveSession(data.agentId) || this.startSession(data.agentId, data.taskId);
    
    const hookData: PreToolHookData = { ...data, sessionId };
    await this.hookManager.triggerPreToolHooks(hookData);

    this.updateSessionActivity(sessionId, {
      toolsUsed: [data.toolName],
    });
  }

  /**
   * Track tool usage completion
   */
  async trackToolComplete(data: Omit<PostToolHookData, 'sessionId'>): Promise<void> {
    const sessionId = this.getActiveSession(data.agentId);
    if (!sessionId) return;

    const hookData: PostToolHookData = { ...data, sessionId };
    await this.hookManager.triggerPostToolHooks(hookData);

    this.updateSessionActivity(sessionId);
  }

  /**
   * Track agent decision
   */
  async trackDecision(data: Omit<AgentDecisionHookData, 'sessionId'>): Promise<void> {
    const sessionId = this.getActiveSession(data.agentId) || this.startSession(data.agentId, data.taskId);
    
    const hookData: AgentDecisionHookData = { ...data, sessionId };
    await this.hookManager.triggerDecisionHooks(hookData);

    this.updateSessionActivity(sessionId, {
      decisionsCount: 1,
    });
  }

  /**
   * Track memory operation
   */
  async trackMemoryOperation(data: Omit<MemoryOperationHookData, 'sessionId'>): Promise<void> {
    const sessionId = this.getActiveSession(data.agentId) || this.startSession(data.agentId);
    
    const hookData: MemoryOperationHookData = { ...data, sessionId };
    await this.hookManager.triggerMemoryHooks(hookData);

    this.updateSessionActivity(sessionId, {
      memoryOperations: 1,
    });
  }

  /**
   * Track agent coordination
   */
  async trackCoordination(
    initiatorId: AgentInstanceId,
    targetId: AgentInstanceId,
    data: {
      readonly coordinationType: 'delegation' | 'collaboration' | 'information_sharing' | 'conflict_resolution';
      readonly topic: string;
      readonly urgency: 'low' | 'medium' | 'high' | 'critical';
      readonly expectedOutcome: string;
      readonly context: {
        readonly sharedTaskId?: TaskId;
        readonly sharedResources: readonly string[];
        readonly dependencies: readonly string[];
      };
    }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const event = await this.createAgentCoordinationEvent(initiatorId, targetId, data);
    await this.publishEvent(event);
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  /**
   * Start performance monitoring with periodic pulses
   */
  private startPerformanceMonitoring(): void {
    if (this.performancePulseTimer) {
      clearInterval(this.performancePulseTimer);
    }

    this.performancePulseTimer = setInterval(() => {
      this.generatePerformancePulses();
    }, this.config.performancePulseInterval);

    this.logger?.info('Started performance monitoring', {
      pulseInterval: this.config.performancePulseInterval,
    });
  }

  /**
   * Generate performance pulses for all active sessions
   */
  private async generatePerformancePulses(): Promise<void> {
    for (const session of this.activeSessions.values()) {
      try {
        const pulseData: PerformancePulseHookData = {
          agentId: session.agentId,
          sessionId: session.sessionId,
          pulse: {
            cpuUsage: process.cpuUsage().user / 1_000_000, // Convert to percentage
            memoryUsage: process.memoryUsage().heapUsed,
            activeConnections: this.activeSessions.size,
            queueDepth: this.eventBuffer.length,
            responseTime: this.calculateAverageResponseTime(session.agentId),
            errorRate: 0, // TODO: Track actual error rate
          },
          healthScore: this.calculateHealthScore(session),
          activities: this.getCurrentActivities(session),
        };

        await this.hookManager.triggerPulseHooks(pulseData);
      } catch (error) {
        this.logger?.warn('Failed to generate performance pulse', {
          agentId: session.agentId,
          sessionId: session.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Calculate health score for an agent session
   */
  private calculateHealthScore(session: ActiveSession): number {
    let score = 1.0;

    // Decrease score based on inactivity
    const inactiveTime = Date.now() - session.lastActivity.getTime();
    if (inactiveTime > 60000) { // 1 minute
      score -= 0.2;
    }
    if (inactiveTime > 300000) { // 5 minutes
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get current activities for an agent
   */
  private getCurrentActivities(session: ActiveSession): readonly {
    readonly activity: string;
    readonly progress: number;
    readonly estimatedCompletion: number;
  }[] {
    // This would be enhanced with actual task tracking
    return [
      {
        activity: `Processing task ${session.taskId || 'unknown'}`,
        progress: 0.5, // Would be calculated based on actual progress
        estimatedCompletion: 30000, // 30 seconds estimate
      },
    ];
  }

  /**
   * Calculate average response time for an agent
   */
  private calculateAverageResponseTime(agentId: AgentInstanceId): number {
    // This would be calculated from historical data
    return 150; // Mock 150ms average response time
  }

  // ============================================================================
  // EVENT PUBLISHING
  // ============================================================================

  /**
   * Setup observability hooks to publish events
   */
  private setupObservabilityHooks(): void {
    // Pre-tool hook
    this.hookManager.registerPreToolHook(
      createHookId('pre-tool-event'),
      async (data: PreToolHookData) => {
        const event = await this.createToolUsageStartedEvent(data);
        await this.publishEvent(event);
      }
    );

    // Post-tool hook
    this.hookManager.registerPostToolHook(
      createHookId('post-tool-event'),
      async (data: PostToolHookData) => {
        const event = await this.createToolUsageCompletedEvent(data);
        await this.publishEvent(event);
      }
    );

    // Decision hook
    this.hookManager.registerDecisionHook(
      createHookId('decision-event'),
      async (data: AgentDecisionHookData) => {
        const event = await this.createAgentDecisionEvent(data);
        await this.publishEvent(event);
      }
    );

    // Memory operation hook
    this.hookManager.registerMemoryHook(
      createHookId('memory-event'),
      async (data: MemoryOperationHookData) => {
        const event = await this.createAgentMemoryOperationEvent(data);
        await this.publishEvent(event);
      }
    );

    // Performance pulse hook
    this.hookManager.registerPulseHook(
      createHookId('pulse-event'),
      async (data: PerformancePulseHookData) => {
        const event = await this.createPerformancePulseEvent(data);
        await this.publishEvent(event);
      }
    );

    this.logger?.debug('Observability hooks setup complete');
  }

  // ============================================================================
  // EVENT CREATION
  // ============================================================================

  /**
   * Create base event structure
   */
  private createBaseEvent<T extends string>(
    type: T,
    category: keyof typeof EventCategory,
    agentId: AgentInstanceId
  ): Omit<BaseEvent, 'data'> {
    return {
      id: this.generateEventId(),
      type,
      category: EventCategory[category] as any,
      priority: EventPriority.NORMAL,
      timestamp: new Date(),
      source: {
        type: 'agent',
        id: agentId,
        name: `Agent-${agentId}`,
      },
      metadata: this.createEventMetadata(),
      version: 1,
    };
  }

  /**
   * Create tool usage started event
   */
  private async createToolUsageStartedEvent(data: PreToolHookData): Promise<ToolUsageStartedEvent> {
    return {
      ...this.createBaseEvent('tool_usage_started', 'AUDIT', data.agentId),
      data: {
        agentId: data.agentId,
        taskId: data.taskId,
        toolName: data.toolName,
        toolVersion: data.toolVersion,
        parameters: data.parameters,
        sessionId: data.sessionId,
        expectedDuration: data.expectedDuration,
        context: {
          userQuery: data.userQuery,
          previousTools: data.previousTools,
          chainOfThought: data.chainOfThought,
        },
      },
    };
  }

  /**
   * Create tool usage completed event
   */
  private async createToolUsageCompletedEvent(data: PostToolHookData): Promise<ToolUsageCompletedEvent> {
    return {
      ...this.createBaseEvent('tool_usage_completed', 'AUDIT', data.agentId),
      data: {
        agentId: data.agentId,
        taskId: data.taskId,
        toolName: data.toolName,
        sessionId: data.sessionId,
        duration: data.duration,
        success: data.success,
        result: data.result,
        tokensUsed: data.tokensUsed,
        errorCount: data.errorCount,
        warnings: data.warnings,
        performanceMetrics: data.performanceMetrics,
      },
    };
  }

  /**
   * Create agent decision event
   */
  private async createAgentDecisionEvent(data: AgentDecisionHookData): Promise<AgentDecisionEvent> {
    return {
      ...this.createBaseEvent('agent_decision', 'AUDIT', data.agentId),
      data: {
        agentId: data.agentId,
        taskId: data.taskId,
        sessionId: data.sessionId,
        decisionType: data.decisionType,
        context: data.context,
        options: data.options,
        selectedOption: data.selectedOption,
        confidence: data.confidence,
        reasoning: data.reasoning,
        factors: data.factors,
      },
    };
  }

  /**
   * Create agent memory operation event
   */
  private async createAgentMemoryOperationEvent(data: MemoryOperationHookData): Promise<AgentMemoryOperationEvent> {
    return {
      ...this.createBaseEvent('agent_memory_operation', 'AUDIT', data.agentId),
      data: {
        agentId: data.agentId,
        sessionId: data.sessionId,
        operation: data.operation,
        memoryType: data.memoryType,
        key: data.key,
        dataSize: data.dataSize,
        relevanceScore: data.relevanceScore,
        retentionPriority: data.retentionPriority,
        associatedConcepts: data.associatedConcepts,
      },
    };
  }

  /**
   * Create agent coordination event
   */
  private async createAgentCoordinationEvent(
    initiatorId: AgentInstanceId,
    targetId: AgentInstanceId,
    data: {
      readonly coordinationType: 'delegation' | 'collaboration' | 'information_sharing' | 'conflict_resolution';
      readonly topic: string;
      readonly urgency: 'low' | 'medium' | 'high' | 'critical';
      readonly expectedOutcome: string;
      readonly context: {
        readonly sharedTaskId?: TaskId;
        readonly sharedResources: readonly string[];
        readonly dependencies: readonly string[];
      };
    }
  ): Promise<AgentCoordinationEvent> {
    return {
      ...this.createBaseEvent('agent_coordination', 'COMMUNICATION', initiatorId),
      data: {
        initiatorId,
        targetId,
        coordinationType: data.coordinationType,
        topic: data.topic,
        urgency: data.urgency,
        expectedOutcome: data.expectedOutcome,
        context: data.context,
      },
    };
  }

  /**
   * Create performance pulse event
   */
  private async createPerformancePulseEvent(data: PerformancePulseHookData): Promise<PerformancePulseEvent> {
    return {
      ...this.createBaseEvent('performance_pulse', 'PERFORMANCE', data.agentId),
      data: {
        agentId: data.agentId,
        sessionId: data.sessionId,
        pulse: data.pulse,
        healthScore: data.healthScore,
        activities: data.activities,
      },
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Publish event to event bus and buffer
   */
  private async publishEvent(event: BaseEvent): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Publish to event bus if available
      if (this.eventBus) {
        await this.eventBus.publish(event);
      }

      // Add to buffer for real-time streaming
      if (this.config.realTimeStreaming) {
        this.eventBuffer.push(event);

        // Trim buffer if it exceeds max size
        if (this.eventBuffer.length > this.config.eventBufferSize) {
          this.eventBuffer = this.eventBuffer.slice(-this.config.eventBufferSize);
        }
      }

      this.logger?.debug('Published observability event', {
        type: event.type,
        category: event.category,
        agentId: (event as any).data?.agentId,
      });

    } catch (error) {
      this.logger?.error('Failed to publish observability event', {
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): EventId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `evt_${timestamp}_${random}` as EventId;
  }

  /**
   * Create event metadata
   */
  private createEventMetadata(): EventMetadata {
    return {
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      sessionId: undefined,
      requestId: undefined,
      userId: undefined,
      projectId: undefined,
      tags: ['observability', 'monitoring'],
      retentionPolicy: 'medium',
    };
  }

  /**
   * Update session activity
   */
  private updateSessionActivity(
    sessionId: SessionId,
    updates?: {
      readonly toolsUsed?: readonly string[];
      readonly decisionsCount?: number;
      readonly memoryOperations?: number;
    }
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const updatedSession: ActiveSession = {
      ...session,
      lastActivity: new Date(),
      toolsUsed: updates?.toolsUsed ? [...session.toolsUsed, ...updates.toolsUsed] : session.toolsUsed,
      decisionsCount: session.decisionsCount + (updates?.decisionsCount || 0),
      memoryOperations: session.memoryOperations + (updates?.memoryOperations || 0),
    };

    this.activeSessions.set(sessionId, updatedSession);
  }

  /**
   * Cleanup old sessions
   */
  private cleanupOldSessions(): void {
    if (this.activeSessions.size <= this.config.maxSessionsInMemory) return;

    // Sort sessions by last activity and remove oldest
    const sessions = Array.from(this.activeSessions.entries());
    sessions.sort((a, b) => a[1].lastActivity.getTime() - b[1].lastActivity.getTime());

    const sessionsToRemove = sessions.slice(0, sessions.length - this.config.maxSessionsInMemory);
    
    for (const [sessionId, session] of sessionsToRemove) {
      this.endSession(sessionId);
    }

    this.logger?.debug('Cleaned up old sessions', {
      removed: sessionsToRemove.length,
      remaining: this.activeSessions.size,
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current observability statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      activeSessions: this.activeSessions.size,
      eventBufferSize: this.eventBuffer.length,
      hookStats: this.hookManager.getStats(),
      sessionsByAgent: Object.fromEntries(
        Array.from(this.sessionsByAgent.entries()).map(([agentId, sessions]) => [
          agentId,
          sessions.size,
        ])
      ),
    };
  }

  /**
   * Get recent events from buffer
   */
  getRecentEvents(limit = 100): BaseEvent[] {
    return this.eventBuffer.slice(-limit);
  }

  /**
   * Enable/disable observability
   */
  setEnabled(enabled: boolean): void {
    (this.config as any).enabled = enabled;
    this.hookManager.setEnabled(enabled);
    
    if (enabled && !this.performancePulseTimer) {
      this.startPerformanceMonitoring();
    } else if (!enabled && this.performancePulseTimer) {
      clearInterval(this.performancePulseTimer);
      this.performancePulseTimer = undefined;
    }

    this.logger?.info('Observability enabled status changed', { enabled });
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.performancePulseTimer) {
      clearInterval(this.performancePulseTimer);
    }

    this.hookManager.clearAllHooks();
    this.activeSessions.clear();
    this.sessionsByAgent.clear();
    this.eventBuffer = [];

    this.logger?.info('Observability manager shutdown complete');
  }
}