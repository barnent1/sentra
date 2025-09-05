/**
 * Performance Monitoring Types for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive monitoring, metrics, and observability for agent performance tracking
 */
import type { AgentInstanceId, TaskId, ProjectContextId, EvolutionDnaId, Brand } from '@sentra/types';
import type { AgentCapabilityTypeEnum } from './agents';
export type MetricId = Brand<string, 'MetricId'>;
export type AlertId = Brand<string, 'AlertId'>;
export type DashboardId = Brand<string, 'DashboardId'>;
export type MonitoringSessionId = Brand<string, 'MonitoringSessionId'>;
export type BenchmarkId = Brand<string, 'BenchmarkId'>;
export type ProfileId = Brand<string, 'ProfileId'>;
/**
 * Types of metrics we collect
 */
export declare const MetricType: {
    readonly LATENCY: "latency";
    readonly THROUGHPUT: "throughput";
    readonly ERROR_RATE: "error_rate";
    readonly SUCCESS_RATE: "success_rate";
    readonly QUALITY_SCORE: "quality_score";
    readonly CPU_USAGE: "cpu_usage";
    readonly MEMORY_USAGE: "memory_usage";
    readonly IO_OPERATIONS: "io_operations";
    readonly NETWORK_USAGE: "network_usage";
    readonly LEARNING_VELOCITY: "learning_velocity";
    readonly KNOWLEDGE_RETENTION: "knowledge_retention";
    readonly ADAPTATION_SPEED: "adaptation_speed";
    readonly TRANSFER_EFFICIENCY: "transfer_efficiency";
    readonly COLLABORATION_INDEX: "collaboration_index";
    readonly COMMUNICATION_CLARITY: "communication_clarity";
    readonly INITIATIVE_SCORE: "initiative_score";
    readonly RELIABILITY_INDEX: "reliability_index";
    readonly MUTATION_SUCCESS_RATE: "mutation_success_rate";
    readonly CROSSOVER_EFFECTIVENESS: "crossover_effectiveness";
    readonly GENETIC_DIVERSITY: "genetic_diversity";
    readonly EVOLUTION_CONVERGENCE: "evolution_convergence";
    readonly USER_SATISFACTION: "user_satisfaction";
    readonly TASK_COMPLETION_RATE: "task_completion_rate";
    readonly VALUE_DELIVERY: "value_delivery";
    readonly COST_EFFICIENCY: "cost_efficiency";
};
export type MetricTypeEnum = typeof MetricType[keyof typeof MetricType];
/**
 * Metric aggregation methods
 */
export declare const MetricAggregation: {
    readonly SUM: "sum";
    readonly AVERAGE: "average";
    readonly MEDIAN: "median";
    readonly MIN: "min";
    readonly MAX: "max";
    readonly COUNT: "count";
    readonly PERCENTILE_90: "percentile_90";
    readonly PERCENTILE_95: "percentile_95";
    readonly PERCENTILE_99: "percentile_99";
    readonly STANDARD_DEVIATION: "standard_deviation";
    readonly RATE: "rate";
    readonly MOVING_AVERAGE: "moving_average";
};
export type MetricAggregationEnum = typeof MetricAggregation[keyof typeof MetricAggregation];
/**
 * Time windows for metric aggregation
 */
export declare const TimeWindow: {
    readonly REAL_TIME: "real_time";
    readonly MINUTE: "minute";
    readonly FIVE_MINUTES: "five_minutes";
    readonly FIFTEEN_MINUTES: "fifteen_minutes";
    readonly HOUR: "hour";
    readonly DAY: "day";
    readonly WEEK: "week";
    readonly MONTH: "month";
    readonly QUARTER: "quarter";
    readonly YEAR: "year";
};
export type TimeWindowEnum = typeof TimeWindow[keyof typeof TimeWindow];
/**
 * Individual metric data point
 */
export interface MetricDataPoint {
    readonly id: MetricId;
    readonly type: MetricTypeEnum;
    readonly value: number;
    readonly timestamp: Date;
    readonly source: MetricSource;
    readonly labels: Record<string, string>;
    readonly unit: string;
    readonly precision: number;
    readonly confidence: number;
    readonly context: MetricContext;
}
/**
 * Source of metric data
 */
export interface MetricSource {
    readonly type: 'agent' | 'system' | 'user' | 'external';
    readonly id: string;
    readonly name: string;
    readonly version?: string;
    readonly location?: string;
}
/**
 * Context for metric collection
 */
export interface MetricContext {
    readonly agentId?: AgentInstanceId;
    readonly taskId?: TaskId;
    readonly projectId?: ProjectContextId;
    readonly dnaId?: EvolutionDnaId;
    readonly environment: 'development' | 'test' | 'production';
    readonly sessionId?: string;
    readonly experimentId?: string;
    readonly additionalContext: Record<string, unknown>;
}
/**
 * Aggregated metric over time window
 */
export interface AggregatedMetric {
    readonly metricType: MetricTypeEnum;
    readonly aggregation: MetricAggregationEnum;
    readonly timeWindow: TimeWindowEnum;
    readonly value: number;
    readonly unit: string;
    readonly dataPoints: number;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly labels: Record<string, string>;
    readonly confidence: number;
}
/**
 * Metric series for trend analysis
 */
export interface MetricSeries {
    readonly metricType: MetricTypeEnum;
    readonly aggregation: MetricAggregationEnum;
    readonly interval: TimeWindowEnum;
    readonly dataPoints: readonly {
        readonly timestamp: Date;
        readonly value: number;
        readonly confidence: number;
    }[];
    readonly startTime: Date;
    readonly endTime: Date;
    readonly labels: Record<string, string>;
    readonly trend: TrendAnalysis;
}
/**
 * Trend analysis results
 */
export interface TrendAnalysis {
    readonly direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    readonly strength: number;
    readonly changeRate: number;
    readonly seasonality: SeasonalityPattern | null;
    readonly anomalies: readonly AnomalyDetection[];
    readonly forecast: readonly ForecastPoint[];
}
/**
 * Seasonality pattern detection
 */
export interface SeasonalityPattern {
    readonly type: 'daily' | 'weekly' | 'monthly' | 'custom';
    readonly period: number;
    readonly amplitude: number;
    readonly confidence: number;
    readonly description: string;
}
/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
    readonly timestamp: Date;
    readonly value: number;
    readonly expectedValue: number;
    readonly anomalyScore: number;
    readonly type: 'spike' | 'drop' | 'plateau' | 'oscillation';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly possibleCauses: readonly string[];
}
/**
 * Forecast point for prediction
 */
export interface ForecastPoint {
    readonly timestamp: Date;
    readonly predictedValue: number;
    readonly confidenceInterval: {
        readonly lower: number;
        readonly upper: number;
    };
    readonly confidence: number;
}
/**
 * Dashboard configuration
 */
export interface Dashboard {
    readonly id: DashboardId;
    readonly name: string;
    readonly description: string;
    readonly owner: string;
    readonly widgets: readonly DashboardWidget[];
    readonly layout: DashboardLayout;
    readonly refreshInterval: number;
    readonly filters: Record<string, string>;
    readonly timeRange: TimeRange;
    readonly isPublic: boolean;
    readonly tags: readonly string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
/**
 * Individual dashboard widget
 */
export interface DashboardWidget {
    readonly id: string;
    readonly type: DashboardWidgetTypeEnum;
    readonly title: string;
    readonly position: WidgetPosition;
    readonly size: WidgetSize;
    readonly configuration: WidgetConfiguration;
    readonly datasource: WidgetDatasource;
    readonly refreshRate: number;
    readonly isVisible: boolean;
}
/**
 * Types of dashboard widgets
 */
export declare const DashboardWidgetType: {
    readonly LINE_CHART: "line_chart";
    readonly BAR_CHART: "bar_chart";
    readonly PIE_CHART: "pie_chart";
    readonly SCATTER_PLOT: "scatter_plot";
    readonly HEATMAP: "heatmap";
    readonly GAUGE: "gauge";
    readonly COUNTER: "counter";
    readonly TABLE: "table";
    readonly TEXT: "text";
    readonly ALERT_LIST: "alert_list";
    readonly LOG_STREAM: "log_stream";
    readonly HISTOGRAM: "histogram";
    readonly RADAR_CHART: "radar_chart";
};
export type DashboardWidgetTypeEnum = typeof DashboardWidgetType[keyof typeof DashboardWidgetType];
/**
 * Widget position on dashboard
 */
export interface WidgetPosition {
    readonly x: number;
    readonly y: number;
    readonly z?: number;
}
/**
 * Widget size
 */
export interface WidgetSize {
    readonly width: number;
    readonly height: number;
    readonly minWidth?: number;
    readonly minHeight?: number;
    readonly maxWidth?: number;
    readonly maxHeight?: number;
}
/**
 * Widget configuration
 */
export interface WidgetConfiguration {
    readonly title?: string;
    readonly showTitle: boolean;
    readonly showLegend: boolean;
    readonly colors: readonly string[];
    readonly thresholds: readonly Threshold[];
    readonly axes: {
        readonly x: AxisConfiguration;
        readonly y: AxisConfiguration;
    };
    readonly displayOptions: Record<string, unknown>;
    readonly interactivity: InteractivityOptions;
}
/**
 * Threshold for alerts and visual indicators
 */
export interface Threshold {
    readonly value: number;
    readonly comparison: 'greater_than' | 'less_than' | 'equal_to' | 'not_equal_to';
    readonly color: string;
    readonly label: string;
    readonly action?: ThresholdAction;
}
/**
 * Action to take when threshold is crossed
 */
export interface ThresholdAction {
    readonly type: 'alert' | 'notification' | 'webhook' | 'script';
    readonly configuration: Record<string, unknown>;
    readonly enabled: boolean;
}
/**
 * Axis configuration for charts
 */
export interface AxisConfiguration {
    readonly label: string;
    readonly unit: string;
    readonly scale: 'linear' | 'logarithmic' | 'time';
    readonly min?: number;
    readonly max?: number;
    readonly showGrid: boolean;
    readonly showTicks: boolean;
}
/**
 * Interactivity options for widgets
 */
export interface InteractivityOptions {
    readonly clickable: boolean;
    readonly zoomable: boolean;
    readonly pannable: boolean;
    readonly selectable: boolean;
    readonly drillDown: boolean;
    readonly exportable: boolean;
}
/**
 * Widget data source
 */
export interface WidgetDatasource {
    readonly type: 'metrics' | 'logs' | 'events' | 'external';
    readonly query: string;
    readonly aggregation: MetricAggregationEnum;
    readonly timeWindow: TimeWindowEnum;
    readonly filters: Record<string, string>;
    readonly groupBy: readonly string[];
    readonly limit?: number;
}
/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
    readonly type: 'grid' | 'flow' | 'tabbed';
    readonly columns: number;
    readonly rowHeight: number;
    readonly margin: LayoutMargin;
    readonly responsive: boolean;
    readonly theme: 'light' | 'dark' | 'auto';
}
/**
 * Layout margin settings
 */
export interface LayoutMargin {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
}
/**
 * Time range for dashboard data
 */
export interface TimeRange {
    readonly type: 'relative' | 'absolute';
    readonly start: Date | string;
    readonly end: Date | string;
    readonly timezone: string;
}
/**
 * Alert definition
 */
export interface Alert {
    readonly id: AlertId;
    readonly name: string;
    readonly description: string;
    readonly condition: AlertCondition;
    readonly severity: AlertSeverityEnum;
    readonly status: AlertStatusEnum;
    readonly targets: readonly AlertTarget[];
    readonly suppressionRules: readonly SuppressionRule[];
    readonly evaluationInterval: number;
    readonly evaluationTimeout: number;
    readonly noDataPolicy: 'no_data' | 'alerting' | 'keep_state';
    readonly tags: readonly string[];
    readonly isEnabled: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly lastEvaluated?: Date;
    readonly lastTriggered?: Date;
}
/**
 * Alert condition
 */
export interface AlertCondition {
    readonly metricType: MetricTypeEnum;
    readonly aggregation: MetricAggregationEnum;
    readonly timeWindow: TimeWindowEnum;
    readonly threshold: number;
    readonly comparison: 'greater_than' | 'less_than' | 'equal_to' | 'not_equal_to';
    readonly filters: Record<string, string>;
    readonly groupBy: readonly string[];
    readonly requireConsecutive: number;
    readonly missingDataTreatment: 'ignore' | 'treat_as_zero' | 'treat_as_missing';
}
/**
 * Alert severity levels
 */
export declare const AlertSeverity: {
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly CRITICAL: "critical";
    readonly EMERGENCY: "emergency";
};
export type AlertSeverityEnum = typeof AlertSeverity[keyof typeof AlertSeverity];
/**
 * Alert status
 */
export declare const AlertStatus: {
    readonly OK: "ok";
    readonly PENDING: "pending";
    readonly ALERTING: "alerting";
    readonly NO_DATA: "no_data";
    readonly PAUSED: "paused";
};
export type AlertStatusEnum = typeof AlertStatus[keyof typeof AlertStatus];
/**
 * Alert notification target
 */
export interface AlertTarget {
    readonly type: 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard';
    readonly address: string;
    readonly configuration: Record<string, unknown>;
    readonly isEnabled: boolean;
    readonly retryPolicy: RetryPolicy;
}
/**
 * Retry policy for alert delivery
 */
export interface RetryPolicy {
    readonly maxRetries: number;
    readonly retryInterval: number;
    readonly backoffMultiplier: number;
    readonly maxInterval: number;
}
/**
 * Suppression rule to prevent alert spam
 */
export interface SuppressionRule {
    readonly condition: string;
    readonly duration: number;
    readonly reason: string;
    readonly isActive: boolean;
}
/**
 * Alert instance (fired alert)
 */
export interface AlertInstance {
    readonly id: string;
    readonly alertId: AlertId;
    readonly agentId?: AgentInstanceId;
    readonly firedAt: Date;
    readonly resolvedAt?: Date;
    readonly severity: AlertSeverityEnum;
    readonly message: string;
    readonly details: Record<string, unknown>;
    readonly metricValue: number;
    readonly threshold: number;
    readonly context: AlertContext;
    readonly acknowledgements: readonly AlertAcknowledgement[];
}
/**
 * Context for alert instance
 */
export interface AlertContext {
    readonly agentId?: AgentInstanceId;
    readonly taskId?: TaskId;
    readonly projectId?: ProjectContextId;
    readonly dnaId?: EvolutionDnaId;
    readonly relatedInstances: readonly string[];
    readonly historicalData: readonly number[];
    readonly possibleCauses: readonly string[];
    readonly suggestedActions: readonly string[];
}
/**
 * Alert acknowledgement
 */
export interface AlertAcknowledgement {
    readonly acknowledgedBy: string;
    readonly acknowledgedAt: Date;
    readonly reason: string;
    readonly expectedResolution?: Date;
    readonly notes?: string;
}
/**
 * Monitoring session for detailed analysis
 */
export interface MonitoringSession {
    readonly id: MonitoringSessionId;
    readonly name: string;
    readonly description: string;
    readonly targets: readonly MonitoringTarget[];
    readonly metrics: readonly MetricTypeEnum[];
    readonly samplingRate: number;
    readonly startTime: Date;
    readonly endTime?: Date;
    readonly status: 'active' | 'paused' | 'completed' | 'error';
    readonly configuration: MonitoringConfiguration;
    readonly results: MonitoringResults;
}
/**
 * Target for monitoring
 */
export interface MonitoringTarget {
    readonly type: 'agent' | 'task' | 'project' | 'system';
    readonly id: string;
    readonly filters: Record<string, string>;
    readonly includeSubcomponents: boolean;
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfiguration {
    readonly collectionInterval: number;
    readonly storagePolicy: 'memory' | 'disk' | 'external';
    readonly compressionEnabled: boolean;
    readonly encryptionEnabled: boolean;
    readonly maxDataPoints: number;
    readonly alertsEnabled: boolean;
    readonly profilingEnabled: boolean;
    readonly detailedLogging: boolean;
}
/**
 * Monitoring session results
 */
export interface MonitoringResults {
    readonly dataPointsCollected: number;
    readonly anomaliesDetected: number;
    readonly alertsTriggered: number;
    readonly averageMetrics: Record<MetricTypeEnum, number>;
    readonly peakMetrics: Record<MetricTypeEnum, number>;
    readonly insights: readonly MonitoringInsight[];
    readonly recommendations: readonly string[];
    readonly dataQuality: DataQualityMetrics;
}
/**
 * Insight from monitoring analysis
 */
export interface MonitoringInsight {
    readonly type: 'performance' | 'behavioral' | 'resource' | 'quality';
    readonly description: string;
    readonly importance: 'low' | 'medium' | 'high' | 'critical';
    readonly confidence: number;
    readonly supportingData: readonly MetricDataPoint[];
    readonly actionable: boolean;
    readonly suggestedActions: readonly string[];
}
/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
    readonly completeness: number;
    readonly accuracy: number;
    readonly consistency: number;
    readonly timeliness: number;
    readonly validity: number;
    readonly anomalousDataPoints: number;
    readonly missingDataPoints: number;
    readonly duplicateDataPoints: number;
}
/**
 * Performance profile for detailed analysis
 */
export interface PerformanceProfile {
    readonly id: ProfileId;
    readonly agentId: AgentInstanceId;
    readonly dnaId: EvolutionDnaId;
    readonly profiledPeriod: {
        readonly start: Date;
        readonly end: Date;
    };
    readonly executionProfile: ExecutionProfile;
    readonly resourceProfile: ResourceProfile;
    readonly learningProfile: LearningProfile;
    readonly collaborationProfile: CollaborationProfile;
    readonly overallAssessment: ProfileAssessment;
}
/**
 * Execution performance profile
 */
export interface ExecutionProfile {
    readonly taskTypes: Record<AgentCapabilityTypeEnum, TaskTypeProfile>;
    readonly responseTimeDistribution: readonly number[];
    readonly throughputByHour: readonly number[];
    readonly errorPatterns: readonly ErrorPattern[];
    readonly successFactors: readonly string[];
    readonly optimizationOpportunities: readonly string[];
}
/**
 * Task type specific profile
 */
export interface TaskTypeProfile {
    readonly taskCount: number;
    readonly averageDuration: number;
    readonly successRate: number;
    readonly qualityScore: number;
    readonly resourceEfficiency: number;
    readonly learningCurve: readonly number[];
}
/**
 * Error pattern analysis
 */
export interface ErrorPattern {
    readonly type: string;
    readonly frequency: number;
    readonly context: readonly string[];
    readonly impact: 'low' | 'medium' | 'high';
    readonly resolution: string;
    readonly preventionStrategy: string;
}
/**
 * Resource usage profile
 */
export interface ResourceProfile {
    readonly cpuUtilization: ResourceUtilizationProfile;
    readonly memoryUtilization: ResourceUtilizationProfile;
    readonly ioOperations: IOProfile;
    readonly networkUsage: NetworkProfile;
    readonly efficiency: ResourceEfficiencyMetrics;
}
/**
 * Resource utilization profile
 */
export interface ResourceUtilizationProfile {
    readonly average: number;
    readonly peak: number;
    readonly minimum: number;
    readonly distribution: readonly number[];
    readonly trends: TrendAnalysis;
    readonly anomalies: readonly AnomalyDetection[];
}
/**
 * IO operations profile
 */
export interface IOProfile {
    readonly readOperations: number;
    readonly writeOperations: number;
    readonly readBandwidth: number;
    readonly writeBandwidth: number;
    readonly averageLatency: number;
    readonly patterns: readonly string[];
}
/**
 * Network usage profile
 */
export interface NetworkProfile {
    readonly inboundTraffic: number;
    readonly outboundTraffic: number;
    readonly requestCount: number;
    readonly averageLatency: number;
    readonly errorRate: number;
    readonly protocols: Record<string, number>;
}
/**
 * Resource efficiency metrics
 */
export interface ResourceEfficiencyMetrics {
    readonly cpuEfficiency: number;
    readonly memoryEfficiency: number;
    readonly energyEfficiency: number;
    readonly costEfficiency: number;
    readonly wasteDetected: readonly string[];
    readonly optimizationPotential: number;
}
/**
 * Learning performance profile
 */
export interface LearningProfile {
    readonly learningVelocity: number;
    readonly knowledgeRetention: number;
    readonly adaptationSpeed: number;
    readonly transferEfficiency: number;
    readonly learningMethods: Record<string, number>;
    readonly knowledgeGaps: readonly string[];
    readonly strengths: readonly string[];
}
/**
 * Collaboration performance profile
 */
export interface CollaborationProfile {
    readonly communicationQuality: number;
    readonly responseTime: number;
    readonly helpfulness: number;
    readonly knowledgeSharing: number;
    readonly conflictResolution: number;
    readonly teamwork: TeamworkMetrics;
}
/**
 * Teamwork metrics
 */
export interface TeamworkMetrics {
    readonly participationRate: number;
    readonly leadershipShown: number;
    readonly supportProvided: number;
    readonly feedbackQuality: number;
    readonly adaptabilityToTeam: number;
}
/**
 * Overall profile assessment
 */
export interface ProfileAssessment {
    readonly overallScore: number;
    readonly strengths: readonly string[];
    readonly weaknesses: readonly string[];
    readonly evolutionRecommendations: readonly EvolutionRecommendation[];
    readonly riskFactors: readonly string[];
    readonly potentialImpact: number;
    readonly benchmarkComparison: BenchmarkComparison;
}
/**
 * Evolution recommendation based on profiling
 */
export interface EvolutionRecommendation {
    readonly type: 'genetic_adjustment' | 'capability_enhancement' | 'training_focus' | 'context_optimization';
    readonly description: string;
    readonly expectedImpact: number;
    readonly implementation: string;
    readonly priority: 'low' | 'medium' | 'high' | 'critical';
    readonly riskLevel: 'low' | 'medium' | 'high';
    readonly timeframe: string;
}
/**
 * Benchmark comparison
 */
export interface BenchmarkComparison {
    readonly benchmarkId: BenchmarkId;
    readonly comparisonType: 'peer_agents' | 'historical_self' | 'theoretical_optimum';
    readonly scoreVsBenchmark: number;
    readonly rankingPercentile: number;
    readonly improvementNeeded: number;
    readonly strengthsVsBenchmark: readonly string[];
    readonly gapsVsBenchmark: readonly string[];
}
/**
 * Main monitoring service interface
 */
export interface MonitoringService {
    /**
     * Collect a metric data point
     */
    collectMetric(metric: MetricDataPoint): Promise<void>;
    /**
     * Collect multiple metrics in batch
     */
    collectMetricsBatch(metrics: readonly MetricDataPoint[]): Promise<void>;
    /**
     * Query metrics with aggregation
     */
    queryMetrics(metricType: MetricTypeEnum, timeWindow: TimeWindowEnum, aggregation: MetricAggregationEnum, filters?: Record<string, string>): Promise<readonly AggregatedMetric[]>;
    /**
     * Get metric time series
     */
    getMetricSeries(metricType: MetricTypeEnum, startTime: Date, endTime: Date, interval: TimeWindowEnum, filters?: Record<string, string>): Promise<MetricSeries>;
    /**
     * Start monitoring session
     */
    startMonitoringSession(configuration: Omit<MonitoringSession, 'id' | 'startTime' | 'status' | 'results'>): Promise<MonitoringSessionId>;
    /**
     * Stop monitoring session
     */
    stopMonitoringSession(sessionId: MonitoringSessionId): Promise<MonitoringResults>;
    /**
     * Generate performance profile
     */
    generatePerformanceProfile(agentId: AgentInstanceId, startTime: Date, endTime: Date): Promise<PerformanceProfile>;
    /**
     * Create alert
     */
    createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertId>;
    /**
     * Evaluate alerts
     */
    evaluateAlerts(): Promise<readonly AlertInstance[]>;
    /**
     * Get monitoring health
     */
    getHealth(): Promise<MonitoringHealth>;
}
/**
 * Monitoring service health
 */
export interface MonitoringHealth {
    readonly overall: 'healthy' | 'degraded' | 'unhealthy';
    readonly components: {
        readonly collector: ComponentHealth;
        readonly storage: ComponentHealth;
        readonly analytics: ComponentHealth;
        readonly alerting: ComponentHealth;
    };
    readonly metrics: {
        readonly dataPointsPerSecond: number;
        readonly storageUsage: number;
        readonly queryLatency: number;
        readonly alertLatency: number;
    };
    readonly issues: readonly string[];
    readonly uptime: number;
}
/**
 * Component health status
 */
export interface ComponentHealth {
    readonly status: 'healthy' | 'degraded' | 'unhealthy';
    readonly lastCheck: Date;
    readonly errorCount: number;
    readonly performance: number;
    readonly details: Record<string, unknown>;
}
//# sourceMappingURL=monitoring.d.ts.map