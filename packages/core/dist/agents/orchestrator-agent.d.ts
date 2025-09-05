/**
 * Master Orchestrator Agent - Coordinates all other agents and ensures quality
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This agent:
 * - Never compromises on quality (100% test coverage, current docs, etc.)
 * - Coordinates multiple sub-agents for complex tasks
 * - Manages context to never exceed 50% window
 * - Routes tasks to appropriate specialized agents
 */
import { BaseEvolutionaryAgent, type TaskExecutionContext, type AgentExecutionResult } from './base-agent';
import type { AgentInstanceId, CodeDNA, AgentCapabilities, AgentType } from '@sentra/types';
/**
 * Master Orchestrator Agent - The quality guardian and task coordinator
 */
export declare class OrchestratorAgent extends BaseEvolutionaryAgent {
    private readonly maxContextUsage;
    constructor(id: AgentInstanceId, dna: CodeDNA);
    get type(): AgentType;
    get capabilities(): AgentCapabilities;
    /**
     * Check if orchestrator can handle a task (it can handle any task by delegation)
     */
    canHandleTask(_context: TaskExecutionContext): boolean;
    /**
     * Execute task by orchestrating sub-agents
     */
    executeTask(context: TaskExecutionContext): Promise<AgentExecutionResult>;
    /**
     * Decompose complex task into manageable sub-tasks
     */
    private decomposeTask;
    /**
     * Execute sub-tasks with parallel optimization
     */
    private executeSubTasks;
    /**
     * Perform comprehensive quality assessment
     */
    private assessQuality;
    /**
     * Validate GOLDEN RULES compliance
     */
    private validateGoldenRules;
    /**
     * Create error result for failed executions
     */
    private createErrorResult;
    /**
     * Create rejection result for quality failures
     */
    private createRejectionResult;
    private isCodeTask;
    private isUITask;
    private identifyParallelTasks;
    private estimateTotalDuration;
    private determineOutputFormat;
    private executeViaSpecializedAgent;
    private compileFinalResult;
    private calculatePerformanceMetrics;
    private estimateContextLimit;
    private estimateMemoryUsage;
    private isCurrentDocumentation;
}
export default OrchestratorAgent;
//# sourceMappingURL=orchestrator-agent.d.ts.map