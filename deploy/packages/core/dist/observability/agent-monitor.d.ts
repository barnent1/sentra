/**
 * Agent Monitor - Real-time agent behavior tracking and analysis
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import type { AgentInstanceId, TaskId } from '@sentra/types';
import type { SessionId } from './event-hooks';
import type { ObservabilityManager } from './observability-manager';
/**
 * Real-time agent metrics
 */
export interface AgentMetrics {
    readonly agentId: AgentInstanceId;
    readonly sessionId?: SessionId;
    readonly status: 'active' | 'idle' | 'error' | 'offline';
    readonly currentTask?: TaskId;
    readonly toolsInUse: readonly string[];
    readonly performance: {
        readonly responseTime: number;
        readonly throughput: number;
        readonly successRate: number;
        readonly errorRate: number;
    };
    readonly resources: {
        readonly cpuUsage: number;
        readonly memoryUsage: number;
        readonly networkUsage: number;
    };
    readonly activity: {
        readonly lastSeen: Date;
        readonly totalDecisions: number;
        readonly totalToolUses: number;
        readonly memoryOperations: number;
    };
}
/**
 * Agent behavior pattern
 */
export interface AgentBehaviorPattern {
    readonly patternId: string;
    readonly agentId: AgentInstanceId;
    readonly type: 'efficiency' | 'error_prone' | 'learning' | 'collaboration';
    readonly confidence: number;
    readonly description: string;
    readonly detectedAt: Date;
    readonly evidence: readonly string[];
    readonly recommendations: readonly string[];
    readonly impact: 'low' | 'medium' | 'high';
}
/**
 * Agent health assessment
 */
export interface AgentHealthAssessment {
    readonly agentId: AgentInstanceId;
    readonly overallHealth: number;
    readonly assessmentTime: Date;
    readonly components: {
        readonly performance: number;
        readonly reliability: number;
        readonly efficiency: number;
        readonly learning: number;
        readonly collaboration: number;
    };
    readonly alerts: readonly {
        readonly level: 'info' | 'warning' | 'critical';
        readonly message: string;
        readonly metric?: string;
        readonly value?: number;
        readonly threshold?: number;
    }[];
    readonly recommendations: readonly string[];
}
/**
 * Monitor for tracking and analyzing agent behavior in real-time
 */
export declare class AgentMonitor {
    private readonly observabilityManager;
    private readonly logger;
    private readonly agentMetrics;
    private readonly behaviorPatterns;
    private readonly healthAssessments;
    private metricsUpdateTimer?;
    private healthCheckTimer?;
    private patternAnalysisTimer?;
    private readonly config;
    constructor(observabilityManager: ObservabilityManager, logger?: any);
    /**
     * Start monitoring all active agents
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Update metrics for all active agents
     */
    private updateAgentMetrics;
    /**
     * Update metrics for a specific agent
     */
    private updateAgentMetric;
    /**
     * Perform health checks on all monitored agents
     */
    private performHealthChecks;
    /**
     * Perform health check for a specific agent
     */
    private performHealthCheck;
    /**
     * Analyze behavior patterns for all monitored agents
     */
    private analyzeBehaviorPatterns;
    /**
     * Analyze behavior patterns for a specific agent
     */
    private analyzeBehaviorPattern;
    /**
     * Detect efficiency patterns
     */
    private detectEfficiencyPattern;
    /**
     * Detect error patterns
     */
    private detectErrorPattern;
    /**
     * Detect learning patterns
     */
    private detectLearningPattern;
    /**
     * Detect collaboration patterns
     */
    private detectCollaborationPattern;
    /**
     * Determine current agent status
     */
    private determineAgentStatus;
    private getCurrentTask;
    private getActiveTools;
    private calculateResponseTime;
    private calculateThroughput;
    private calculateSuccessRate;
    private calculateErrorRate;
    private calculateCpuUsage;
    private calculateMemoryUsage;
    private calculateNetworkUsage;
    private getTotalDecisions;
    private getTotalToolUses;
    private getTotalMemoryOperations;
    private isSignificantChange;
    private assessPerformanceHealth;
    private assessReliabilityHealth;
    private assessEfficiencyHealth;
    private assessLearningHealth;
    private assessCollaborationHealth;
    private generateHealthAlerts;
    private generateHealthRecommendations;
    private findCommonErrors;
    private emitMetricsUpdate;
    private emitBehaviorPattern;
    /**
     * Get current metrics for an agent
     */
    getAgentMetrics(agentId: AgentInstanceId): AgentMetrics | undefined;
    /**
     * Get all monitored agents metrics
     */
    getAllAgentMetrics(): Map<AgentInstanceId, AgentMetrics>;
    /**
     * Get behavior patterns for an agent
     */
    getAgentBehaviorPatterns(agentId: AgentInstanceId): AgentBehaviorPattern[];
    /**
     * Get health assessment for an agent
     */
    getAgentHealthAssessment(agentId: AgentInstanceId): AgentHealthAssessment | undefined;
    /**
     * Force metrics update for an agent
     */
    forceMetricsUpdate(agentId: AgentInstanceId): void;
    /**
     * Force health check for an agent
     */
    forceHealthCheck(agentId: AgentInstanceId): void;
    /**
     * Get monitoring statistics
     */
    getMonitoringStats(): {
        monitoredAgents: number;
        totalBehaviorPatterns: number;
        healthyAgents: number;
        criticalAgents: number;
    };
    /**
     * Cleanup monitoring data for an agent
     */
    cleanupAgent(agentId: AgentInstanceId): void;
    /**
     * Shutdown the monitor
     */
    shutdown(): void;
}
//# sourceMappingURL=agent-monitor.d.ts.map