/**
 * Agent Manager - Manages lifecycle and orchestration of evolutionary agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import type { AgentInstanceId, AgentType, AgentStatus } from '@sentra/types';
import { type TaskExecutionContext, type AgentExecutionResult } from './base-agent';
import { type AgentCreationConfig, type AgentSpawnResult } from './agent-factory';
/**
 * Agent pool configuration
 */
export interface AgentPoolConfig {
    readonly maxConcurrentAgents: number;
    readonly maxAgentsPerType: number;
    readonly idleTimeoutMs: number;
    readonly evolutionThreshold: number;
    readonly retirementAge: number;
}
/**
 * Task assignment result
 */
export interface TaskAssignmentResult {
    readonly success: boolean;
    readonly assignedAgent?: AgentInstanceId;
    readonly reason: string;
    readonly alternativeSuggestions?: readonly AgentType[];
}
/**
 * Agent performance summary
 */
export interface AgentPerformanceSummary {
    readonly agentId: AgentInstanceId;
    readonly type: AgentType;
    readonly status: AgentStatus;
    readonly performance: {
        readonly successRate: number;
        readonly averageExecutionTime: number;
        readonly tasksCompleted: number;
        readonly currentFitness: number;
    };
    readonly utilization: {
        readonly activeTime: number;
        readonly idleTime: number;
        readonly utilizationRate: number;
    };
    readonly evolution: {
        readonly generation: number;
        readonly adaptationCount: number;
        readonly lastEvolution: Date | null;
    };
}
/**
 * Agent Manager - Centralized agent lifecycle and task orchestration
 */
export declare class AgentManager extends EventEmitter {
    private readonly config;
    private readonly agentFactory;
    private readonly dnaEngine;
    private readonly activeAgents;
    private readonly agentsByType;
    private readonly taskAssignments;
    private readonly agentMetrics;
    private readonly taskQueue;
    private readonly waitingTasks;
    constructor(config?: Partial<AgentPoolConfig>);
    /**
     * Create and spawn a new agent
     */
    spawnAgent(config: AgentCreationConfig): Promise<AgentSpawnResult>;
    /**
     * Assign a task to the most suitable agent
     */
    assignTask(context: TaskExecutionContext): Promise<TaskAssignmentResult>;
    /**
     * Execute a task with automatic agent assignment
     */
    executeTask(context: TaskExecutionContext): Promise<AgentExecutionResult>;
    /**
     * Get agent performance summary
     */
    getAgentPerformance(agentId: AgentInstanceId): AgentPerformanceSummary | null;
    /**
     * Get all agent performance summaries
     */
    getAllAgentPerformance(): readonly AgentPerformanceSummary[];
    /**
     * Get manager statistics
     */
    getManagerStats(): {
        readonly activeAgents: number;
        readonly agentsByType: Record<AgentType, number>;
        readonly queuedTasks: number;
        readonly completedTasks: number;
        readonly averagePerformance: number;
    };
    /**
     * Terminate an agent
     */
    terminateAgent(agentId: AgentInstanceId, reason?: string): Promise<boolean>;
    /**
     * Shutdown manager and all agents
     */
    shutdown(): Promise<void>;
    /**
     * Register an agent in the manager
     */
    private registerAgent;
    /**
     * Unregister an agent from the manager
     */
    private unregisterAgent;
    /**
     * Assign task to specific agent
     */
    private assignTaskToAgent;
    /**
     * Select best agent for task
     */
    private selectBestAgent;
    /**
     * Determine best agent type for task
     */
    private determineBestAgentType;
    /**
     * Extract project context from task context
     */
    private extractProjectContext;
    /**
     * Update agent performance metrics
     */
    private updateAgentMetrics;
    /**
     * Check if agent needs evolution and trigger if necessary
     */
    private checkForEvolution;
    /**
     * Setup agent event listeners
     */
    private setupAgentEventListeners;
    /**
     * Setup manager event handlers
     */
    private setupEventHandlers;
    /**
     * Process queued tasks
     */
    private processTaskQueue;
    /**
     * Start maintenance loop for idle cleanup and optimization
     */
    private startMaintenanceLoop;
    /**
     * Perform routine maintenance
     */
    private performMaintenance;
    /**
     * Create failure metrics for error cases
     */
    private createFailureMetrics;
}
export default AgentManager;
//# sourceMappingURL=agent-manager.d.ts.map