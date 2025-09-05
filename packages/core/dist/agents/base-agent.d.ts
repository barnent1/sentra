/**
 * Base Evolutionary Agent - Abstract foundation for all specialized agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import type { AgentInstanceId, TaskId, EvolutionDnaId, CodeDNA, ProjectContext, EnhancedPerformanceMetrics as PerformanceMetrics, AgentCapabilities, AgentType, AgentStatus } from '@sentra/types';
/**
 * Agent learning outcome interface
 */
export interface LearningOutcome {
    readonly taskId: TaskId;
    readonly success: boolean;
    readonly performanceMetrics: PerformanceMetrics;
    readonly lessonsLearned: readonly string[];
    readonly contextFactors: readonly string[];
    readonly timestamp: Date;
}
/**
 * Agent task execution context
 */
export interface TaskExecutionContext {
    readonly taskId: TaskId;
    readonly projectContext: ProjectContext;
    readonly requirements: readonly string[];
    readonly constraints: readonly string[];
    readonly expectedOutputFormat: string;
    readonly timeoutMs?: number;
    readonly priority: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Agent execution result interface
 */
export interface AgentExecutionResult {
    readonly success: boolean;
    readonly output: unknown;
    readonly performanceMetrics: PerformanceMetrics;
    readonly resourcesUsed: {
        readonly tokensConsumed: number;
        readonly executionTime: number;
        readonly memoryUsed: number;
    };
    readonly errors?: readonly string[];
    readonly warnings?: readonly string[];
    readonly metadata?: Record<string, unknown>;
}
/**
 * Abstract base class for all evolutionary agents
 */
export declare abstract class BaseEvolutionaryAgent extends EventEmitter {
    protected readonly id: AgentInstanceId;
    protected readonly dnaId: EvolutionDnaId;
    protected dna: CodeDNA;
    protected status: AgentStatus;
    protected readonly spawnedAt: Date;
    protected lastActiveAt: Date;
    protected performanceHistory: readonly PerformanceMetrics[];
    protected currentTaskId?: TaskId;
    protected learningOutcomes: readonly LearningOutcome[];
    protected adaptationCount: number;
    protected totalTasksCompleted: number;
    constructor(id: AgentInstanceId, dna: CodeDNA, capabilities: AgentCapabilities);
    abstract get type(): AgentType;
    abstract get capabilities(): AgentCapabilities;
    abstract executeTask(context: TaskExecutionContext): Promise<AgentExecutionResult>;
    abstract canHandleTask(context: TaskExecutionContext): boolean;
    /**
     * Get agent identifier
     */
    getId(): AgentInstanceId;
    /**
     * Get current agent status
     */
    getStatus(): AgentStatus;
    /**
     * Get agent DNA
     */
    getDNA(): CodeDNA;
    /**
     * Update agent DNA (evolutionary process)
     */
    evolveDNA(newDNA: CodeDNA): Promise<void>;
    /**
     * Learn from task execution outcome
     */
    learn(outcome: LearningOutcome): Promise<void>;
    /**
     * Adapt behavior based on project context
     */
    adaptToContext(context: ProjectContext): Promise<void>;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        readonly averageSuccessRate: number;
        readonly averageExecutionTime: number;
        readonly totalTasksCompleted: number;
        readonly adaptationCount: number;
        readonly recentPerformanceTrend: 'improving' | 'stable' | 'declining';
        readonly contextFitScore: number;
    };
    /**
     * Activate agent for task execution
     */
    activate(taskId: TaskId): Promise<void>;
    /**
     * Deactivate agent after task completion
     */
    deactivate(): Promise<void>;
    /**
     * Terminate agent (mark as archived)
     */
    terminate(reason: string): Promise<void>;
    /**
     * Validate agent capabilities against requirements
     */
    protected validateCapabilities(capabilities: AgentCapabilities): void;
    /**
     * Set up learning event handlers
     */
    protected setupLearningHandlers(): void;
    /**
     * Handle task completion event
     */
    protected handleTaskCompletion(event: {
        taskId: TaskId;
        result: AgentExecutionResult;
    }): Promise<void>;
    /**
     * Handle task failure event
     */
    protected handleTaskFailure(event: {
        taskId: TaskId;
        errors: readonly string[];
    }): Promise<void>;
    /**
     * Calculate how well agent fits a project context
     */
    protected calculateContextFit(context: ProjectContext): number;
    /**
     * Calculate current context fit (if context is available)
     */
    protected calculateCurrentContextFit(): number;
    /**
     * Analyze learning patterns and trigger adaptations
     */
    protected analyzeLearningPatterns(): Promise<void>;
    /**
     * Generate evolution recommendations based on learning outcomes
     */
    protected generateEvolutionRecommendations(outcomes: readonly LearningOutcome[]): readonly string[];
    /**
     * Create failure performance metrics
     */
    protected createFailureMetrics(): PerformanceMetrics;
}
export default BaseEvolutionaryAgent;
//# sourceMappingURL=base-agent.d.ts.map