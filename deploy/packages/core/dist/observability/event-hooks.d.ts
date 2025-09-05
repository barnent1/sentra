/**
 * Event Hooks System - Disler-style monitoring hooks for agent activities
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { AgentInstanceId, TaskId, Brand } from '@sentra/types';
export type SessionId = Brand<string, 'SessionId'>;
export type HookId = Brand<string, 'HookId'>;
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
/**
 * Event hook manager for registering and triggering observability hooks
 */
export declare class EventHookManager {
    private readonly preToolHooks;
    private readonly postToolHooks;
    private readonly decisionHooks;
    private readonly memoryHooks;
    private readonly pulseHooks;
    private readonly defaultConfig;
    private readonly logger;
    private readonly config;
    constructor(config?: Partial<HookConfig>, logger?: any);
    /**
     * Register pre-tool execution hook
     */
    registerPreToolHook(id: HookId, handler: HookHandler<PreToolHookData>): void;
    /**
     * Register post-tool execution hook
     */
    registerPostToolHook(id: HookId, handler: HookHandler<PostToolHookData>): void;
    /**
     * Register agent decision hook
     */
    registerDecisionHook(id: HookId, handler: HookHandler<AgentDecisionHookData>): void;
    /**
     * Register memory operation hook
     */
    registerMemoryHook(id: HookId, handler: HookHandler<MemoryOperationHookData>): void;
    /**
     * Register performance pulse hook
     */
    registerPulseHook(id: HookId, handler: HookHandler<PerformancePulseHookData>): void;
    /**
     * Unregister hook by ID
     */
    unregisterHook(id: HookId): boolean;
    /**
     * Clear all hooks
     */
    clearAllHooks(): void;
    /**
     * Trigger pre-tool hooks
     */
    triggerPreToolHooks(data: PreToolHookData): Promise<void>;
    /**
     * Trigger post-tool hooks
     */
    triggerPostToolHooks(data: PostToolHookData): Promise<void>;
    /**
     * Trigger decision hooks
     */
    triggerDecisionHooks(data: AgentDecisionHookData): Promise<void>;
    /**
     * Trigger memory operation hooks
     */
    triggerMemoryHooks(data: MemoryOperationHookData): Promise<void>;
    /**
     * Trigger performance pulse hooks
     */
    triggerPulseHooks(data: PerformancePulseHookData): Promise<void>;
    /**
     * Execute hooks with error handling and retry logic
     */
    private executeHooks;
    /**
     * Execute a single hook with retry logic
     */
    private executeHookWithRetry;
    /**
     * Get hook statistics
     */
    getStats(): {
        preToolHooks: number;
        postToolHooks: number;
        decisionHooks: number;
        memoryHooks: number;
        pulseHooks: number;
        totalHooks: number;
        enabled: boolean;
    };
    /**
     * Enable/disable hooks
     */
    setEnabled(enabled: boolean): void;
}
/**
 * Create a new session ID
 */
export declare const createSessionId: () => SessionId;
/**
 * Create a new hook ID
 */
export declare const createHookId: (name: string) => HookId;
/**
 * Measure function execution time
 */
export declare const measureExecutionTime: <T>(fn: () => Promise<T> | T) => Promise<{
    result: T;
    duration: number;
}>;
/**
 * Memory usage tracker
 */
export declare const getMemoryUsage: () => {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
};
//# sourceMappingURL=event-hooks.d.ts.map