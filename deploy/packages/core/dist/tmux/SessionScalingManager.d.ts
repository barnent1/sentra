/**
 * TMUX Session Scaling Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages automatic scaling of TMUX sessions based on project load,
 * handling creation, destruction, and load balancing of multiple sessions.
 */
import { EventEmitter } from 'events';
import type { SessionId, SessionScalingConfig } from './types';
import type { ProjectContextId } from '@sentra/types';
import type { TMUXSessionManager } from './TMUXSessionManager';
/**
 * Scaling metrics for decision making
 */
export interface ScalingMetrics {
    readonly timestamp: Date;
    readonly totalProjects: number;
    readonly activeProjects: number;
    readonly idleProjects: number;
    readonly errorProjects: number;
    readonly completedProjects: number;
    readonly totalSessions: number;
    readonly activeSessions: number;
    readonly averageProjectsPerSession: number;
    readonly systemLoad: {
        readonly cpu: number;
        readonly memory: number;
        readonly activePanels: number;
    };
}
/**
 * Scaling decision result
 */
export interface ScalingDecision {
    readonly action: 'scale_up' | 'scale_down' | 'maintain' | 'rebalance';
    readonly reason: string;
    readonly targetSessionCount: number;
    readonly projectsToMove?: readonly {
        readonly projectId: ProjectContextId;
        readonly fromSessionId: SessionId;
        readonly toSessionId: SessionId;
    }[];
    readonly sessionsToCreate: number;
    readonly sessionsToDestroy: readonly SessionId[];
    readonly confidence: number;
    readonly expectedImpact: {
        readonly performanceImprovement: number;
        readonly resourceSavings: number;
        readonly downtime: number;
    };
}
/**
 * Session load information
 */
export interface SessionLoad {
    readonly sessionId: SessionId;
    readonly projectCount: number;
    readonly activeProjects: number;
    readonly totalCpuUsage: number;
    readonly totalMemoryUsage: number;
    readonly averageResponseTime: number;
    readonly errorRate: number;
    readonly utilizationScore: number;
    readonly canAcceptMoreProjects: boolean;
    readonly healthScore: number;
}
/**
 * Load balancing strategy configuration
 */
export interface LoadBalancingConfig {
    readonly strategy: 'round_robin' | 'least_loaded' | 'performance_based' | 'hybrid';
    readonly rebalanceThreshold: number;
    readonly maxProjectsPerSession: number;
    readonly minProjectsPerSession: number;
    readonly healthThreshold: number;
    readonly performanceThreshold: number;
}
/**
 * Session scaling manager
 */
export declare class SessionScalingManager extends EventEmitter {
    private readonly sessionManager;
    private readonly scalingConfig;
    private readonly loadBalancingConfig;
    private readonly scalingMetrics;
    private scalingInterval?;
    private metricsCollectionInterval?;
    private lastScalingAction;
    private readonly cooldownPeriod;
    constructor(sessionManager: TMUXSessionManager, scalingConfig: SessionScalingConfig, loadBalancingConfig?: Partial<LoadBalancingConfig>);
    private initialize;
    private startAutoScaling;
    private startMetricsCollection;
    private setupEventHandlers;
    /**
     * Perform scaling check and make decisions
     */
    performScalingCheck(): Promise<ScalingDecision>;
    /**
     * Make scaling decision based on metrics
     */
    private makeScalingDecision;
    /**
     * Check if system should scale up
     */
    private shouldScaleUp;
    /**
     * Check if system should scale down
     */
    private shouldScaleDown;
    /**
     * Check if system needs rebalancing
     */
    private shouldRebalance;
    /**
     * Create scale up decision
     */
    private createScaleUpDecision;
    /**
     * Create scale down decision
     */
    private createScaleDownDecision;
    /**
     * Create rebalance decision
     */
    private createRebalanceDecision;
    /**
     * Execute scaling decision
     */
    private executeScalingDecision;
    /**
     * Execute scale up operation
     */
    private executeScaleUp;
    /**
     * Execute scale down operation
     */
    private executeScaleDown;
    /**
     * Execute rebalance operation
     */
    private executeRebalance;
    /**
     * Migrate all projects from a session to other sessions
     */
    private migrateProjectsFromSession;
    /**
     * Find the best session for a project based on load balancing strategy
     */
    private findBestSessionForProject;
    /**
     * Move project from one session to another
     */
    private moveProject;
    /**
     * Collect current scaling metrics
     */
    private collectScalingMetrics;
    /**
     * Calculate load for each session
     */
    private calculateSessionLoads;
    /**
     * Get all project activities from sessions
     */
    private getAllProjectActivities;
    /**
     * Get system load information
     */
    private getSystemLoad;
    /**
     * Calculate utilization variance across sessions
     */
    private calculateUtilizationVariance;
    /**
     * Calculate optimal project distribution for rebalancing
     */
    private calculateOptimalProjectDistribution;
    /**
     * Check if we're in cooldown period
     */
    private isInCooldownPeriod;
    /**
     * Create session parameters for scaling
     */
    private createSessionParamsForScaling;
    /**
     * Merge default load balancing configuration
     */
    private mergeLoadBalancingConfig;
    /**
     * Get current scaling metrics
     */
    getCurrentMetrics(): Promise<ScalingMetrics>;
    /**
     * Get historical scaling metrics
     */
    getHistoricalMetrics(limit?: number): readonly ScalingMetrics[];
    /**
     * Get current session loads
     */
    getCurrentSessionLoads(): Promise<readonly SessionLoad[]>;
    /**
     * Force scaling check
     */
    forceScalingCheck(): Promise<ScalingDecision>;
    /**
     * Update scaling configuration
     */
    updateScalingConfig(newConfig: Partial<SessionScalingConfig>): void;
    /**
     * Update load balancing configuration
     */
    updateLoadBalancingConfig(newConfig: Partial<LoadBalancingConfig>): void;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
//# sourceMappingURL=SessionScalingManager.d.ts.map