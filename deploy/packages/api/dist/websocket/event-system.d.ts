/**
 * WebSocket event system for real-time Evolution API updates
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { AgentInstance, LearningOutcome, PerformanceMetrics, EvolutionDnaId, AgentInstanceId } from '@sentra/types';
import { AuthService, type JwtPayload } from '../middleware/auth';
/**
 * WebSocket event types
 */
export declare const WebSocketEvents: {
    readonly CONNECTION: "connection";
    readonly DISCONNECT: "disconnect";
    readonly ERROR: "error";
    readonly AUTHENTICATE: "authenticate";
    readonly AUTHENTICATED: "authenticated";
    readonly SUBSCRIBE: "subscribe";
    readonly UNSUBSCRIBE: "unsubscribe";
    readonly SUBSCRIBED: "subscribed";
    readonly UNSUBSCRIBED: "unsubscribed";
    readonly PATTERN_EVOLVED: "pattern:evolved";
    readonly PATTERN_CREATED: "pattern:created";
    readonly PATTERN_UPDATED: "pattern:updated";
    readonly PATTERN_DELETED: "pattern:deleted";
    readonly AGENT_STATUS: "agent:status";
    readonly AGENT_SPAWNED: "agent:spawned";
    readonly AGENT_UPDATED: "agent:updated";
    readonly AGENT_ARCHIVED: "agent:archived";
    readonly LEARNING_OUTCOME: "learning:outcome";
    readonly LEARNING_PATTERN_DISCOVERED: "learning:pattern_discovered";
    readonly METRICS_UPDATE: "metrics:update";
    readonly PERFORMANCE_ALERT: "performance:alert";
    readonly SYSTEM_HEALTH: "system:health";
    readonly SYSTEM_MAINTENANCE: "system:maintenance";
    readonly TOOL_USAGE_STARTED: "observability:tool_started";
    readonly TOOL_USAGE_COMPLETED: "observability:tool_completed";
    readonly AGENT_DECISION: "observability:agent_decision";
    readonly AGENT_MEMORY_OPERATION: "observability:memory_operation";
    readonly AGENT_COORDINATION: "observability:coordination";
    readonly PERFORMANCE_PULSE: "observability:performance_pulse";
    readonly LEARNING_PATTERN: "observability:learning_pattern";
    readonly BEHAVIOR_PATTERN: "observability:behavior_pattern";
};
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
export declare class EvolutionEventBroadcaster {
    private readonly io;
    private readonly authService;
    private readonly clients;
    private readonly config;
    private readonly logger;
    private heartbeatInterval?;
    constructor(httpServer: HTTPServer, authService: AuthService, config: WebSocketConfig, logger?: any);
    /**
     * Setup WebSocket event handlers
     */
    private readonly setupEventHandlers;
    /**
     * Handle new WebSocket connection
     */
    private readonly handleConnection;
    /**
     * Handle client authentication
     */
    private readonly handleAuthentication;
    /**
     * Setup event handlers for authenticated clients
     */
    private readonly setupAuthenticatedHandlers;
    /**
     * Handle subscription/unsubscription requests
     */
    private readonly handleSubscription;
    /**
     * Get allowed channels based on user permissions
     */
    private readonly getAllowedChannels;
    /**
     * Handle client disconnection
     */
    private readonly handleDisconnection;
    /**
     * Start heartbeat to check connection health
     */
    private readonly startHeartbeat;
    /**
     * Event broadcasting methods
     */
    readonly broadcastPatternEvolved: (payload: PatternEvolvedPayload) => void;
    readonly broadcastAgentStatus: (payload: AgentStatusPayload) => void;
    readonly broadcastLearningOutcome: (payload: LearningOutcomePayload) => void;
    readonly broadcastMetricsUpdate: (payload: MetricsUpdatePayload) => void;
    readonly broadcastSystemHealth: (payload: SystemHealthPayload) => void;
    /**
     * Observability event broadcasting methods (Disler-style monitoring)
     */
    readonly broadcastToolUsageStarted: (payload: ToolUsageStartedPayload) => void;
    readonly broadcastToolUsageCompleted: (payload: ToolUsageCompletedPayload) => void;
    readonly broadcastAgentDecision: (payload: AgentDecisionPayload) => void;
    readonly broadcastMemoryOperation: (payload: MemoryOperationPayload) => void;
    readonly broadcastCoordination: (payload: CoordinationPayload) => void;
    readonly broadcastPerformancePulse: (payload: PerformancePulsePayload) => void;
    readonly broadcastLearningPattern: (payload: LearningPatternPayload) => void;
    readonly broadcastBehaviorPattern: (payload: BehaviorPatternPayload) => void;
    /**
     * Get connection statistics
     */
    readonly getStats: () => {
        totalConnections: number;
        connectionsByRole: Record<string, number>;
        subscriptionsByChannel: Record<string, number>;
    };
    /**
     * Shutdown the WebSocket server
     */
    readonly shutdown: () => void;
}
//# sourceMappingURL=event-system.d.ts.map