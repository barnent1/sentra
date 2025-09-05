/**
 * Event Hooks System - Disler-style monitoring hooks for agent activities
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import type {
  AgentInstanceId,
  TaskId,
  Brand,
} from '@sentra/types';

import type {
  ToolUsageStartedEvent,
  ToolUsageCompletedEvent,
  AgentDecisionEvent,
  AgentMemoryOperationEvent,
  AgentCoordinationEvent,
  PerformancePulseEvent,
  AgentLearningPatternEvent,
  EventId,
  BaseEvent,
} from '../types/events';

// ============================================================================
// BRANDED TYPES FOR OBSERVABILITY HOOKS
// ============================================================================

export type SessionId = Brand<string, 'SessionId'>;
export type HookId = Brand<string, 'HookId'>;

// ============================================================================
// HOOK INTERFACES
// ============================================================================

/**
 * Pre-tool execution hook data
 */
export interface PreToolHookData {
  readonly agentId: AgentInstanceId;
  readonly sessionId: SessionId;
  readonly taskId?: TaskId;
  readonly toolName: string;
  readonly toolVersion?: string;
  readonly parameters: Record<string, unknown>;
  readonly userQuery?: string;
  readonly previousTools: readonly string[];
  readonly chainOfThought?: string;
  readonly expectedDuration?: number;
}

/**
 * Post-tool execution hook data
 */
export interface PostToolHookData {
  readonly agentId: AgentInstanceId;
  readonly sessionId: SessionId;
  readonly taskId?: TaskId;
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
}

/**
 * Agent decision hook data
 */
export interface AgentDecisionHookData {
  readonly agentId: AgentInstanceId;
  readonly sessionId: SessionId;
  readonly taskId?: TaskId;
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
}

/**
 * Memory operation hook data
 */
export interface MemoryOperationHookData {
  readonly agentId: AgentInstanceId;
  readonly sessionId: SessionId;
  readonly operation: 'store' | 'retrieve' | 'update' | 'forget';
  readonly memoryType: 'working' | 'episodic' | 'semantic' | 'procedural';
  readonly key: string;
  readonly dataSize: number;
  readonly relevanceScore?: number;
  readonly retentionPriority: 'high' | 'medium' | 'low';
  readonly associatedConcepts: readonly string[];
}

/**
 * Performance pulse hook data
 */
export interface PerformancePulseHookData {
  readonly agentId: AgentInstanceId;
  readonly sessionId: SessionId;
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
}

/**
 * Hook handler function type
 */
export type HookHandler<T> = (data: T) => Promise<void> | void;

/**
 * Hook configuration
 */
export interface HookConfig {
  readonly enabled: boolean;
  readonly async: boolean;
  readonly maxRetries: number;
  readonly retryDelay: number;
  readonly timeout: number;
}

// ============================================================================
// EVENT HOOK MANAGER
// ============================================================================

/**
 * Event hook manager for registering and triggering observability hooks
 */
export class EventHookManager {
  private readonly preToolHooks = new Map<HookId, HookHandler<PreToolHookData>>();
  private readonly postToolHooks = new Map<HookId, HookHandler<PostToolHookData>>();
  private readonly decisionHooks = new Map<HookId, HookHandler<AgentDecisionHookData>>();
  private readonly memoryHooks = new Map<HookId, HookHandler<MemoryOperationHookData>>();
  private readonly pulseHooks = new Map<HookId, HookHandler<PerformancePulseHookData>>();

  private readonly defaultConfig: HookConfig = {
    enabled: true,
    async: true,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 5000,
  };

  private readonly logger: any; // TODO: Type when logger is configured
  private readonly config: HookConfig;

  constructor(config?: Partial<HookConfig>, logger?: any) {
    this.config = { ...this.defaultConfig, ...config };
    this.logger = logger;
  }

  // ============================================================================
  // HOOK REGISTRATION
  // ============================================================================

  /**
   * Register pre-tool execution hook
   */
  registerPreToolHook(id: HookId, handler: HookHandler<PreToolHookData>): void {
    this.preToolHooks.set(id, handler);
    this.logger?.debug('Registered pre-tool hook', { hookId: id });
  }

  /**
   * Register post-tool execution hook
   */
  registerPostToolHook(id: HookId, handler: HookHandler<PostToolHookData>): void {
    this.postToolHooks.set(id, handler);
    this.logger?.debug('Registered post-tool hook', { hookId: id });
  }

  /**
   * Register agent decision hook
   */
  registerDecisionHook(id: HookId, handler: HookHandler<AgentDecisionHookData>): void {
    this.decisionHooks.set(id, handler);
    this.logger?.debug('Registered decision hook', { hookId: id });
  }

  /**
   * Register memory operation hook
   */
  registerMemoryHook(id: HookId, handler: HookHandler<MemoryOperationHookData>): void {
    this.memoryHooks.set(id, handler);
    this.logger?.debug('Registered memory hook', { hookId: id });
  }

  /**
   * Register performance pulse hook
   */
  registerPulseHook(id: HookId, handler: HookHandler<PerformancePulseHookData>): void {
    this.pulseHooks.set(id, handler);
    this.logger?.debug('Registered pulse hook', { hookId: id });
  }

  // ============================================================================
  // HOOK UNREGISTRATION
  // ============================================================================

  /**
   * Unregister hook by ID
   */
  unregisterHook(id: HookId): boolean {
    const removed = 
      this.preToolHooks.delete(id) ||
      this.postToolHooks.delete(id) ||
      this.decisionHooks.delete(id) ||
      this.memoryHooks.delete(id) ||
      this.pulseHooks.delete(id);

    if (removed) {
      this.logger?.debug('Unregistered hook', { hookId: id });
    }

    return removed;
  }

  /**
   * Clear all hooks
   */
  clearAllHooks(): void {
    this.preToolHooks.clear();
    this.postToolHooks.clear();
    this.decisionHooks.clear();
    this.memoryHooks.clear();
    this.pulseHooks.clear();
    this.logger?.debug('Cleared all hooks');
  }

  // ============================================================================
  // HOOK TRIGGERS
  // ============================================================================

  /**
   * Trigger pre-tool hooks
   */
  async triggerPreToolHooks(data: PreToolHookData): Promise<void> {
    if (!this.config.enabled) return;

    await this.executeHooks(this.preToolHooks, data, 'pre-tool');
  }

  /**
   * Trigger post-tool hooks
   */
  async triggerPostToolHooks(data: PostToolHookData): Promise<void> {
    if (!this.config.enabled) return;

    await this.executeHooks(this.postToolHooks, data, 'post-tool');
  }

  /**
   * Trigger decision hooks
   */
  async triggerDecisionHooks(data: AgentDecisionHookData): Promise<void> {
    if (!this.config.enabled) return;

    await this.executeHooks(this.decisionHooks, data, 'decision');
  }

  /**
   * Trigger memory operation hooks
   */
  async triggerMemoryHooks(data: MemoryOperationHookData): Promise<void> {
    if (!this.config.enabled) return;

    await this.executeHooks(this.memoryHooks, data, 'memory');
  }

  /**
   * Trigger performance pulse hooks
   */
  async triggerPulseHooks(data: PerformancePulseHookData): Promise<void> {
    if (!this.config.enabled) return;

    await this.executeHooks(this.pulseHooks, data, 'pulse');
  }

  // ============================================================================
  // HOOK EXECUTION
  // ============================================================================

  /**
   * Execute hooks with error handling and retry logic
   */
  private async executeHooks<T>(
    hooks: Map<HookId, HookHandler<T>>,
    data: T,
    hookType: string
  ): Promise<void> {
    if (hooks.size === 0) return;

    const executions = Array.from(hooks.entries()).map(([hookId, handler]) =>
      this.executeHookWithRetry(hookId, handler, data, hookType)
    );

    if (this.config.async) {
      // Execute all hooks concurrently
      await Promise.allSettled(executions);
    } else {
      // Execute hooks sequentially
      for (const execution of executions) {
        await execution;
      }
    }
  }

  /**
   * Execute a single hook with retry logic
   */
  private async executeHookWithRetry<T>(
    hookId: HookId,
    handler: HookHandler<T>,
    data: T,
    hookType: string
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Hook execution timeout')), this.config.timeout)
        );

        await Promise.race([
          Promise.resolve(handler(data)),
          timeoutPromise,
        ]);

        this.logger?.debug('Hook executed successfully', {
          hookId,
          hookType,
          attempt,
        });

        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.logger?.warn('Hook execution failed', {
          hookId,
          hookType,
          attempt,
          error: lastError.message,
        });

        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    // All retries failed
    this.logger?.error('Hook execution failed after all retries', {
      hookId,
      hookType,
      maxRetries: this.config.maxRetries,
      error: lastError?.message,
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get hook statistics
   */
  getStats() {
    return {
      preToolHooks: this.preToolHooks.size,
      postToolHooks: this.postToolHooks.size,
      decisionHooks: this.decisionHooks.size,
      memoryHooks: this.memoryHooks.size,
      pulseHooks: this.pulseHooks.size,
      totalHooks: this.preToolHooks.size + this.postToolHooks.size + 
                  this.decisionHooks.size + this.memoryHooks.size + 
                  this.pulseHooks.size,
      enabled: this.config.enabled,
    };
  }

  /**
   * Enable/disable hooks
   */
  setEnabled(enabled: boolean): void {
    (this.config as any).enabled = enabled;
    this.logger?.info('Hook system enabled status changed', { enabled });
  }
}

// ============================================================================
// HOOK DECORATORS AND UTILITIES
// ============================================================================

/**
 * Create a new session ID
 */
export const createSessionId = (): SessionId => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `session_${timestamp}_${random}` as SessionId;
};

/**
 * Create a new hook ID
 */
export const createHookId = (name: string): HookId => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${name}_${timestamp}_${random}` as HookId;
};

/**
 * Measure function execution time
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1_000_000; // Convert to milliseconds

  return { result, duration };
};

/**
 * Memory usage tracker
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
  };
};