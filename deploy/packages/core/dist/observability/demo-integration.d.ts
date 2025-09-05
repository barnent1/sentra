/**
 * Demo Integration Script - Test Disler-style observability system
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { AgentInstanceId } from '@sentra/types';
import { ObservabilityManager } from './observability-manager';
import { AgentMonitor } from './agent-monitor';
import { PerformanceTracker } from './performance-tracker';
import { MetricsCollector } from './metrics-collector';
declare const DEMO_CONFIG: {
    agentCount: number;
    simulationDuration: number;
    eventInterval: number;
    toolNames: string[];
    decisionTypes: readonly ["tool_selection", "approach_choice", "parameter_tuning", "strategy_pivot"];
};
/**
 * Simulate realistic agent behavior for observability testing
 */
export declare class ObservabilityDemoSimulator {
    private readonly observabilityManager;
    private readonly agentMonitor;
    private readonly performanceTracker;
    private readonly metricsCollector;
    private readonly logger;
    private simulationTimer?;
    private isRunning;
    private eventCount;
    private readonly demoAgents;
    constructor(observabilityManager: ObservabilityManager, agentMonitor: AgentMonitor, performanceTracker: PerformanceTracker, metricsCollector: MetricsCollector, logger?: any);
    /**
     * Setup demo agents with different characteristics
     */
    private setupDemoAgents;
    /**
     * Setup performance benchmarks for testing
     */
    private setupBenchmarks;
    /**
     * Start the observability demo simulation
     */
    startSimulation(): void;
    /**
     * Stop the simulation
     */
    stopSimulation(): void;
    /**
     * Simulate activity for a random agent
     */
    private simulateAgentActivity;
    /**
     * Simulate tool usage with realistic timing and success rates
     */
    private simulateToolUsage;
    /**
     * Simulate agent decision making
     */
    private simulateDecision;
    /**
     * Simulate memory operations
     */
    private simulateMemoryOperation;
    /**
     * Simulate coordination between agents
     */
    private simulateCoordination;
    /**
     * Get random agent (excluding specific agent if provided)
     */
    private getRandomAgent;
    /**
     * Choose random activity type weighted by frequency
     */
    private chooseActivityType;
    /**
     * Get random tool name
     */
    private getRandomTool;
    /**
     * Get random decision type
     */
    private getRandomDecisionType;
    /**
     * Generate tool parameters based on tool type
     */
    private generateToolParameters;
    /**
     * Calculate expected tool duration based on type and agent efficiency
     */
    private calculateExpectedDuration;
    /**
     * Calculate actual duration with some randomness
     */
    private calculateActualDuration;
    /**
     * Calculate decision confidence based on agent efficiency
     */
    private calculateDecisionConfidence;
    /**
     * Generate decision options
     */
    private generateDecisionOptions;
    /**
     * Generate associated concepts for memory operations
     */
    private generateAssociatedConcepts;
    /**
     * Generate task ID
     */
    private generateTaskId;
    /**
     * Print simulation summary
     */
    private printSimulationSummary;
    /**
     * Check if simulation is currently running
     */
    isSimulationRunning(): boolean;
    /**
     * Get current event count
     */
    getEventCount(): number;
    /**
     * Get demo agent information
     */
    getDemoAgents(): {
        id: AgentInstanceId;
        name: string;
        type: "developer" | "orchestrator" | "specialist";
        toolHistory: string[];
        decisionCount: number;
        errorRate: number;
        efficiency: number;
    }[];
}
/**
 * Run observability demo with mock event bus
 */
export declare function runObservabilityDemo(logger?: any): Promise<void>;
export { ObservabilityDemoSimulator, DEMO_CONFIG, };
//# sourceMappingURL=demo-integration.d.ts.map