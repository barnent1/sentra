/**
 * Real-time Evolution Metrics Service for Sentra Evolutionary Agent System
 *
 * This service provides real-time monitoring and metrics collection for DNA evolution,
 * cross-project learning, and agent performance across the system.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import type { EvolutionDnaId, AgentInstanceId, ProjectContextId, TaskId, PerformanceMetrics, FitnessScore, Brand } from '../types';
export type MetricsServiceId = Brand<string, 'MetricsServiceId'>;
export type MetricId = Brand<string, 'MetricId'>;
export interface EvolutionMetricPoint {
    readonly id: MetricId;
    readonly timestamp: Date;
    readonly agentId?: AgentInstanceId;
    readonly projectId?: ProjectContextId;
    readonly dnaId?: EvolutionDnaId;
    readonly taskId?: TaskId;
    readonly metricType: EvolutionMetricType;
    readonly value: number;
    readonly metadata: Record<string, unknown>;
}
export declare const EvolutionMetricType: {
    readonly FITNESS_SCORE: "fitness_score";
    readonly GENERATION_COUNT: "generation_count";
    readonly MUTATION_RATE: "mutation_rate";
    readonly EVOLUTION_SUCCESS_RATE: "evolution_success_rate";
    readonly TASK_SUCCESS_RATE: "task_success_rate";
    readonly COMPLETION_TIME: "completion_time";
    readonly CODE_QUALITY: "code_quality";
    readonly ERROR_RECOVERY: "error_recovery";
    readonly ADAPTATION_SPEED: "adaptation_speed";
    readonly KNOWLEDGE_RETENTION: "knowledge_retention";
    readonly CROSS_DOMAIN_TRANSFER: "cross_domain_transfer";
    readonly PATTERN_RECOGNITION: "pattern_recognition";
    readonly ACTIVE_AGENTS: "active_agents";
    readonly TOTAL_PATTERNS: "total_patterns";
    readonly DIVERSITY_INDEX: "diversity_index";
    readonly CROSS_PROJECT_TRANSFERS: "cross_project_transfers";
    readonly TEAM_INTEGRATION: "team_integration";
    readonly COMMUNICATION_EFFECTIVENESS: "communication_effectiveness";
    readonly CONFLICT_RESOLUTION: "conflict_resolution";
    readonly COMPUTATIONAL_EFFICIENCY: "computational_efficiency";
    readonly MEMORY_USAGE: "memory_usage";
    readonly RESPONSE_LATENCY: "response_latency";
    readonly THROUGHPUT: "throughput";
};
export type EvolutionMetricType = typeof EvolutionMetricType[keyof typeof EvolutionMetricType];
export interface MetricsAggregation {
    readonly metricType: EvolutionMetricType;
    readonly timeWindow: 'hour' | 'day' | 'week' | 'month';
    readonly aggregationType: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'percentile';
    readonly value: number;
    readonly count: number;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly percentile?: number;
}
export interface EvolutionTrend {
    readonly metricType: EvolutionMetricType;
    readonly direction: 'increasing' | 'decreasing' | 'stable';
    readonly rate: number;
    readonly confidence: number;
    readonly significance: 'high' | 'medium' | 'low';
    readonly dataPoints: number;
    readonly timeSpan: number;
}
export interface EvolutionAlert {
    readonly id: string;
    readonly timestamp: Date;
    readonly severity: 'info' | 'warning' | 'error' | 'critical';
    readonly metricType: EvolutionMetricType;
    readonly message: string;
    readonly threshold: number;
    readonly actualValue: number;
    readonly projectId?: ProjectContextId;
    readonly agentId?: AgentInstanceId;
    readonly dnaId?: EvolutionDnaId;
    readonly recommended_actions: readonly string[];
}
export interface RealTimeEvolutionDashboard {
    readonly timestamp: Date;
    readonly overview: {
        readonly totalAgents: number;
        readonly activeEvolutions: number;
        readonly avgFitness: number;
        readonly diversityIndex: number;
        readonly crossProjectTransfers: number;
    };
    readonly topPerformers: readonly {
        readonly agentId: AgentInstanceId;
        readonly dnaId: EvolutionDnaId;
        readonly fitness: FitnessScore;
        readonly generation: number;
        readonly projectContext: string;
    }[];
    readonly recentEvolutions: readonly {
        readonly agentId: AgentInstanceId;
        readonly dnaId: EvolutionDnaId;
        readonly parentDnaId?: EvolutionDnaId;
        readonly fitnessImprovement: number;
        readonly timestamp: Date;
        readonly evolutionType: string;
    }[];
    readonly trends: readonly EvolutionTrend[];
    readonly alerts: readonly EvolutionAlert[];
    readonly projectBreakdown: readonly {
        readonly projectId: ProjectContextId;
        readonly name: string;
        readonly activeAgents: number;
        readonly avgFitness: number;
        readonly recentActivity: number;
    }[];
}
export interface MetricsServiceConfig {
    readonly retention: {
        readonly raw: number;
        readonly hourly: number;
        readonly daily: number;
    };
    readonly aggregation: {
        readonly enabled: boolean;
        readonly intervals: readonly number[];
        readonly batchSize: number;
    };
    readonly alerts: {
        readonly enabled: boolean;
        readonly thresholds: Record<string, {
            min?: number;
            max?: number;
            rate?: number;
        }>;
        readonly suppressionTime: number;
    };
    readonly realtime: {
        readonly enabled: boolean;
        readonly updateInterval: number;
        readonly maxDataPoints: number;
    };
}
export declare class EvolutionMetricsService extends EventEmitter {
    private readonly config;
    private readonly rawMetrics;
    private readonly aggregatedMetrics;
    private readonly alertHistory;
    private metricsTimer?;
    private aggregationTimer?;
    private cleanupTimer?;
    constructor(config?: Partial<MetricsServiceConfig>);
    /**
     * Record a new evolution metric point
     */
    recordMetric(metricType: EvolutionMetricType, value: number, context?: {
        readonly agentId?: AgentInstanceId;
        readonly projectId?: ProjectContextId;
        readonly dnaId?: EvolutionDnaId;
        readonly taskId?: TaskId;
        readonly metadata?: Record<string, unknown>;
    }): MetricId;
    /**
     * Record DNA evolution event metrics
     */
    recordEvolutionEvent(agentId: AgentInstanceId, dnaId: EvolutionDnaId, parentDnaId: EvolutionDnaId | undefined, projectId: ProjectContextId, fitnessImprovement: number, generation: number, evolutionType: string): void;
    /**
     * Record agent performance metrics
     */
    recordAgentPerformance(agentId: AgentInstanceId, dnaId: EvolutionDnaId, projectId: ProjectContextId, taskId: TaskId, performance: PerformanceMetrics): void;
    /**
     * Record system-level metrics
     */
    recordSystemMetrics(activeAgents: number, totalPatterns: number, diversityIndex: number, crossProjectTransfers: number): void;
    /**
     * Get metrics within a time range
     */
    getMetrics(metricType: EvolutionMetricType, startTime: Date, endTime: Date, filters?: {
        readonly agentId?: AgentInstanceId;
        readonly projectId?: ProjectContextId;
        readonly dnaId?: EvolutionDnaId;
    }): readonly EvolutionMetricPoint[];
    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(metricType: EvolutionMetricType, timeWindow: 'hour' | 'day' | 'week' | 'month', aggregationType: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'percentile'): readonly MetricsAggregation[];
    /**
     * Calculate evolution trends
     */
    calculateTrends(metricTypes: readonly EvolutionMetricType[], timeSpan?: number): readonly EvolutionTrend[];
    /**
     * Get real-time dashboard data
     */
    generateDashboard(): RealTimeEvolutionDashboard;
    /**
     * Get evolution health score (0-1)
     */
    getSystemHealthScore(): number;
    private startTimers;
    private checkAlerts;
    private determineSeverity;
    private getRecommendedActions;
    private calculateTrend;
    private getLatestMetric;
    private getTopPerformers;
    private getRecentEvolutions;
    private getActiveAlerts;
    private getProjectBreakdown;
    private performAggregation;
    private cleanup;
    /**
     * Stop all timers and clean up
     */
    destroy(): void;
}
export default EvolutionMetricsService;
//# sourceMappingURL=metrics-service.d.ts.map