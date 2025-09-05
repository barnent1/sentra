/**
 * Performance Monitoring Types for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive monitoring, metrics, and observability for agent performance tracking
 */

import type {
  AgentInstanceId,
  TaskId,
  ProjectContextId,
  EvolutionDnaId,
  Brand,
} from '@sentra/types';

// Remove unused import - PerformanceMetrics is re-exported in index

import type {
  AgentCapabilityTypeEnum,
} from './agents';

// ============================================================================
// BRANDED TYPES FOR MONITORING SUBSYSTEM
// ============================================================================

export type MetricId = Brand<string, 'MetricId'>;
export type AlertId = Brand<string, 'AlertId'>;
export type DashboardId = Brand<string, 'DashboardId'>;
export type MonitoringSessionId = Brand<string, 'MonitoringSessionId'>;
export type BenchmarkId = Brand<string, 'BenchmarkId'>;
export type ProfileId = Brand<string, 'ProfileId'>;

// ============================================================================
// METRIC DEFINITIONS
// ============================================================================

/**
 * Types of metrics we collect
 */
export const MetricType = {
  // Performance metrics
  LATENCY: 'latency',                     // Response time metrics
  THROUGHPUT: 'throughput',               // Tasks per unit time
  ERROR_RATE: 'error_rate',               // Error frequency
  SUCCESS_RATE: 'success_rate',           // Success frequency
  QUALITY_SCORE: 'quality_score',         // Output quality
  
  // Resource metrics  
  CPU_USAGE: 'cpu_usage',                 // CPU utilization
  MEMORY_USAGE: 'memory_usage',           // Memory utilization
  IO_OPERATIONS: 'io_operations',         // Input/output operations
  NETWORK_USAGE: 'network_usage',         // Network bandwidth usage
  
  // Learning metrics
  LEARNING_VELOCITY: 'learning_velocity', // Rate of skill acquisition
  KNOWLEDGE_RETENTION: 'knowledge_retention', // Knowledge persistence
  ADAPTATION_SPEED: 'adaptation_speed',   // Context switching speed
  TRANSFER_EFFICIENCY: 'transfer_efficiency', // Cross-domain transfer
  
  // Behavioral metrics
  COLLABORATION_INDEX: 'collaboration_index', // Team interaction quality
  COMMUNICATION_CLARITY: 'communication_clarity', // Message comprehension
  INITIATIVE_SCORE: 'initiative_score',   // Proactive behavior
  RELIABILITY_INDEX: 'reliability_index', // Consistency of performance
  
  // Evolution metrics
  MUTATION_SUCCESS_RATE: 'mutation_success_rate', // Beneficial mutations
  CROSSOVER_EFFECTIVENESS: 'crossover_effectiveness', // Crossover benefits
  GENETIC_DIVERSITY: 'genetic_diversity', // Population diversity
  EVOLUTION_CONVERGENCE: 'evolution_convergence', // Convergence rate
  
  // Business metrics
  USER_SATISFACTION: 'user_satisfaction', // User feedback scores
  TASK_COMPLETION_RATE: 'task_completion_rate', // Task success rate
  VALUE_DELIVERY: 'value_delivery',       // Business value generated
  COST_EFFICIENCY: 'cost_efficiency',     // Resource cost per output
} as const;

export type MetricTypeEnum = typeof MetricType[keyof typeof MetricType];

/**
 * Metric aggregation methods
 */
export const MetricAggregation = {
  SUM: 'sum',
  AVERAGE: 'average',
  MEDIAN: 'median',
  MIN: 'min',
  MAX: 'max',
  COUNT: 'count',
  PERCENTILE_90: 'percentile_90',
  PERCENTILE_95: 'percentile_95',
  PERCENTILE_99: 'percentile_99',
  STANDARD_DEVIATION: 'standard_deviation',
  RATE: 'rate',                          // Change over time
  MOVING_AVERAGE: 'moving_average',      // Moving window average
} as const;

export type MetricAggregationEnum = typeof MetricAggregation[keyof typeof MetricAggregation];

/**
 * Time windows for metric aggregation
 */
export const TimeWindow = {
  REAL_TIME: 'real_time',               // Current value
  MINUTE: 'minute',                     // Last minute
  FIVE_MINUTES: 'five_minutes',         // Last 5 minutes
  FIFTEEN_MINUTES: 'fifteen_minutes',   // Last 15 minutes
  HOUR: 'hour',                         // Last hour
  DAY: 'day',                           // Last 24 hours
  WEEK: 'week',                         // Last 7 days
  MONTH: 'month',                       // Last 30 days
  QUARTER: 'quarter',                   // Last 90 days
  YEAR: 'year',                         // Last 365 days
} as const;

export type TimeWindowEnum = typeof TimeWindow[keyof typeof TimeWindow];

// ============================================================================
// CORE MONITORING INTERFACES
// ============================================================================

/**
 * Individual metric data point
 */
export interface MetricDataPoint {
  readonly id: MetricId;
  readonly type: MetricTypeEnum;
  readonly value: number;
  readonly timestamp: Date;
  readonly source: MetricSource;
  readonly labels: Record<string, string>;    // Key-value labels for filtering
  readonly unit: string;                      // Unit of measurement
  readonly precision: number;                 // Number of decimal places
  readonly confidence: number;                // 0-1, confidence in measurement
  readonly context: MetricContext;
}

/**
 * Source of metric data
 */
export interface MetricSource {
  readonly type: 'agent' | 'system' | 'user' | 'external';
  readonly id: string;                        // ID of source
  readonly name: string;                      // Human-readable name
  readonly version?: string;                  // Source version
  readonly location?: string;                 // Physical/logical location
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
  readonly experimentId?: string;             // For A/B testing
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
  readonly dataPoints: number;                // Number of data points aggregated
  readonly startTime: Date;
  readonly endTime: Date;
  readonly labels: Record<string, string>;
  readonly confidence: number;                // 0-1, confidence in aggregation
}

/**
 * Metric series for trend analysis
 */
export interface MetricSeries {
  readonly metricType: MetricTypeEnum;
  readonly aggregation: MetricAggregationEnum;
  readonly interval: TimeWindowEnum;          // Interval between points
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
  readonly strength: number;                  // 0-1, strength of trend
  readonly changeRate: number;                // Rate of change per unit time
  readonly seasonality: SeasonalityPattern | null;
  readonly anomalies: readonly AnomalyDetection[];
  readonly forecast: readonly ForecastPoint[];
}

/**
 * Seasonality pattern detection
 */
export interface SeasonalityPattern {
  readonly type: 'daily' | 'weekly' | 'monthly' | 'custom';
  readonly period: number;                    // Period in time units
  readonly amplitude: number;                 // Strength of seasonal effect
  readonly confidence: number;                // 0-1, confidence in pattern
  readonly description: string;
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
  readonly timestamp: Date;
  readonly value: number;
  readonly expectedValue: number;
  readonly anomalyScore: number;              // 0-1, how anomalous
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
  readonly confidence: number;                // 0-1, prediction confidence
}

// ============================================================================
// PERFORMANCE DASHBOARDS
// ============================================================================

/**
 * Dashboard configuration
 */
export interface Dashboard {
  readonly id: DashboardId;
  readonly name: string;
  readonly description: string;
  readonly owner: string;                     // User or system component
  readonly widgets: readonly DashboardWidget[];
  readonly layout: DashboardLayout;
  readonly refreshInterval: number;           // Milliseconds
  readonly filters: Record<string, string>;   // Global dashboard filters
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
  readonly refreshRate: number;               // Milliseconds
  readonly isVisible: boolean;
}

/**
 * Types of dashboard widgets
 */
export const DashboardWidgetType = {
  LINE_CHART: 'line_chart',
  BAR_CHART: 'bar_chart',
  PIE_CHART: 'pie_chart',
  SCATTER_PLOT: 'scatter_plot',
  HEATMAP: 'heatmap',
  GAUGE: 'gauge',
  COUNTER: 'counter',
  TABLE: 'table',
  TEXT: 'text',
  ALERT_LIST: 'alert_list',
  LOG_STREAM: 'log_stream',
  HISTOGRAM: 'histogram',
  RADAR_CHART: 'radar_chart',
} as const;

export type DashboardWidgetTypeEnum = typeof DashboardWidgetType[keyof typeof DashboardWidgetType];

/**
 * Widget position on dashboard
 */
export interface WidgetPosition {
  readonly x: number;                         // Grid x position
  readonly y: number;                         // Grid y position
  readonly z?: number;                        // Layer (for overlays)
}

/**
 * Widget size
 */
export interface WidgetSize {
  readonly width: number;                     // Grid units
  readonly height: number;                    // Grid units
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
  readonly colors: readonly string[];         // Color scheme
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
  readonly query: string;                     // Query or filter
  readonly aggregation: MetricAggregationEnum;
  readonly timeWindow: TimeWindowEnum;
  readonly filters: Record<string, string>;
  readonly groupBy: readonly string[];        // Grouping dimensions
  readonly limit?: number;                    // Max results
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  readonly type: 'grid' | 'flow' | 'tabbed';
  readonly columns: number;                   // For grid layout
  readonly rowHeight: number;                 // Grid row height in pixels
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
  readonly start: Date | string;              // Date or relative string like "-1h"
  readonly end: Date | string;                // Date or relative string like "now"
  readonly timezone: string;                  // Timezone identifier
}

// ============================================================================
// ALERTING SYSTEM
// ============================================================================

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
  readonly evaluationInterval: number;        // Milliseconds
  readonly evaluationTimeout: number;         // Milliseconds
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
  readonly requireConsecutive: number;        // Number of consecutive failures
  readonly missingDataTreatment: 'ignore' | 'treat_as_zero' | 'treat_as_missing';
}

/**
 * Alert severity levels
 */
export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
} as const;

export type AlertSeverityEnum = typeof AlertSeverity[keyof typeof AlertSeverity];

/**
 * Alert status
 */
export const AlertStatus = {
  OK: 'ok',
  PENDING: 'pending',
  ALERTING: 'alerting',
  NO_DATA: 'no_data',
  PAUSED: 'paused',
} as const;

export type AlertStatusEnum = typeof AlertStatus[keyof typeof AlertStatus];

/**
 * Alert notification target
 */
export interface AlertTarget {
  readonly type: 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard';
  readonly address: string;                   // Email, URL, phone, etc.
  readonly configuration: Record<string, unknown>;
  readonly isEnabled: boolean;
  readonly retryPolicy: RetryPolicy;
}

/**
 * Retry policy for alert delivery
 */
export interface RetryPolicy {
  readonly maxRetries: number;
  readonly retryInterval: number;             // Milliseconds
  readonly backoffMultiplier: number;
  readonly maxInterval: number;               // Maximum retry interval
}

/**
 * Suppression rule to prevent alert spam
 */
export interface SuppressionRule {
  readonly condition: string;                 // Condition expression
  readonly duration: number;                  // Suppression duration in milliseconds
  readonly reason: string;                    // Human-readable reason
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
  readonly relatedInstances: readonly string[]; // Related alert instances
  readonly historicalData: readonly number[];   // Recent metric values
  readonly possibleCauses: readonly string[];
  readonly suggestedActions: readonly string[];
}

/**
 * Alert acknowledgement
 */
export interface AlertAcknowledgement {
  readonly acknowledgedBy: string;            // User or system
  readonly acknowledgedAt: Date;
  readonly reason: string;
  readonly expectedResolution?: Date;
  readonly notes?: string;
}

// ============================================================================
// MONITORING SESSIONS AND PROFILING
// ============================================================================

/**
 * Monitoring session for detailed analysis
 */
export interface MonitoringSession {
  readonly id: MonitoringSessionId;
  readonly name: string;
  readonly description: string;
  readonly targets: readonly MonitoringTarget[];
  readonly metrics: readonly MetricTypeEnum[];
  readonly samplingRate: number;              // 0-1, percentage of data to sample
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
  readonly collectionInterval: number;        // Milliseconds
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
  readonly confidence: number;                // 0-1
  readonly supportingData: readonly MetricDataPoint[];
  readonly actionable: boolean;
  readonly suggestedActions: readonly string[];
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  readonly completeness: number;              // 0-1, percentage of expected data points
  readonly accuracy: number;                  // 0-1, estimated accuracy
  readonly consistency: number;               // 0-1, consistency across sources
  readonly timeliness: number;                // 0-1, how up-to-date data is
  readonly validity: number;                  // 0-1, percentage of valid data points
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
  readonly averageDuration: number;           // Milliseconds
  readonly successRate: number;               // 0-1
  readonly qualityScore: number;              // 0-1
  readonly resourceEfficiency: number;        // 0-1
  readonly learningCurve: readonly number[]; // Performance over time
}

/**
 * Error pattern analysis
 */
export interface ErrorPattern {
  readonly type: string;
  readonly frequency: number;
  readonly context: readonly string[];        // Common contexts where error occurs
  readonly impact: 'low' | 'medium' | 'high';
  readonly resolution: string;                // How to resolve
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
  readonly average: number;                   // 0-1
  readonly peak: number;                      // 0-1
  readonly minimum: number;                   // 0-1
  readonly distribution: readonly number[];   // Histogram of usage
  readonly trends: TrendAnalysis;
  readonly anomalies: readonly AnomalyDetection[];
}

/**
 * IO operations profile
 */
export interface IOProfile {
  readonly readOperations: number;
  readonly writeOperations: number;
  readonly readBandwidth: number;             // Bytes per second
  readonly writeBandwidth: number;            // Bytes per second
  readonly averageLatency: number;            // Milliseconds
  readonly patterns: readonly string[];       // Common IO patterns
}

/**
 * Network usage profile
 */
export interface NetworkProfile {
  readonly inboundTraffic: number;            // Bytes
  readonly outboundTraffic: number;           // Bytes
  readonly requestCount: number;
  readonly averageLatency: number;            // Milliseconds
  readonly errorRate: number;                 // 0-1
  readonly protocols: Record<string, number>; // Usage by protocol
}

/**
 * Resource efficiency metrics
 */
export interface ResourceEfficiencyMetrics {
  readonly cpuEfficiency: number;             // 0-1, useful work per CPU cycle
  readonly memoryEfficiency: number;          // 0-1, useful work per memory byte
  readonly energyEfficiency: number;          // 0-1, useful work per energy unit
  readonly costEfficiency: number;            // 0-1, useful work per cost unit
  readonly wasteDetected: readonly string[];  // Types of resource waste
  readonly optimizationPotential: number;     // 0-1, potential for improvement
}

/**
 * Learning performance profile
 */
export interface LearningProfile {
  readonly learningVelocity: number;          // Rate of improvement
  readonly knowledgeRetention: number;        // 0-1, retention rate
  readonly adaptationSpeed: number;           // Context switching speed
  readonly transferEfficiency: number;        // Cross-domain transfer
  readonly learningMethods: Record<string, number>; // Effectiveness by method
  readonly knowledgeGaps: readonly string[];  // Identified gaps
  readonly strengths: readonly string[];      // Learning strengths
}

/**
 * Collaboration performance profile
 */
export interface CollaborationProfile {
  readonly communicationQuality: number;      // 0-1, message clarity
  readonly responseTime: number;              // Average response time
  readonly helpfulness: number;               // 0-1, how helpful to others
  readonly knowledgeSharing: number;          // 0-1, sharing frequency
  readonly conflictResolution: number;        // 0-1, conflict handling
  readonly teamwork: TeamworkMetrics;
}

/**
 * Teamwork metrics
 */
export interface TeamworkMetrics {
  readonly participationRate: number;         // 0-1, participation in team activities
  readonly leadershipShown: number;           // 0-1, leadership behaviors
  readonly supportProvided: number;           // 0-1, support to teammates
  readonly feedbackQuality: number;           // 0-1, quality of feedback given
  readonly adaptabilityToTeam: number;        // 0-1, adaptation to team style
}

/**
 * Overall profile assessment
 */
export interface ProfileAssessment {
  readonly overallScore: number;              // 0-1, overall performance score
  readonly strengths: readonly string[];      // Key strengths identified
  readonly weaknesses: readonly string[];     // Areas needing improvement
  readonly evolutionRecommendations: readonly EvolutionRecommendation[];
  readonly riskFactors: readonly string[];    // Performance risk factors
  readonly potentialImpact: number;          // 0-1, potential for improvement
  readonly benchmarkComparison: BenchmarkComparison;
}

/**
 * Evolution recommendation based on profiling
 */
export interface EvolutionRecommendation {
  readonly type: 'genetic_adjustment' | 'capability_enhancement' | 'training_focus' | 'context_optimization';
  readonly description: string;
  readonly expectedImpact: number;            // 0-1, expected improvement
  readonly implementation: string;            // How to implement
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly timeframe: string;                 // Expected time to see results
}

/**
 * Benchmark comparison
 */
export interface BenchmarkComparison {
  readonly benchmarkId: BenchmarkId;
  readonly comparisonType: 'peer_agents' | 'historical_self' | 'theoretical_optimum';
  readonly scoreVsBenchmark: number;          // -1 to 1, relative performance
  readonly rankingPercentile: number;         // 0-100, percentile ranking
  readonly improvementNeeded: number;         // 0-1, improvement to reach benchmark
  readonly strengthsVsBenchmark: readonly string[];
  readonly gapsVsBenchmark: readonly string[];
}

// ============================================================================
// MONITORING SERVICE INTERFACES
// ============================================================================

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
  queryMetrics(
    metricType: MetricTypeEnum,
    timeWindow: TimeWindowEnum,
    aggregation: MetricAggregationEnum,
    filters?: Record<string, string>
  ): Promise<readonly AggregatedMetric[]>;
  
  /**
   * Get metric time series
   */
  getMetricSeries(
    metricType: MetricTypeEnum,
    startTime: Date,
    endTime: Date,
    interval: TimeWindowEnum,
    filters?: Record<string, string>
  ): Promise<MetricSeries>;
  
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
  generatePerformanceProfile(
    agentId: AgentInstanceId,
    startTime: Date,
    endTime: Date
  ): Promise<PerformanceProfile>;
  
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
    readonly storageUsage: number;           // Bytes
    readonly queryLatency: number;           // Milliseconds
    readonly alertLatency: number;           // Milliseconds
  };
  readonly issues: readonly string[];
  readonly uptime: number;                   // Milliseconds
}

/**
 * Component health status
 */
export interface ComponentHealth {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly lastCheck: Date;
  readonly errorCount: number;
  readonly performance: number;                // 0-1
  readonly details: Record<string, unknown>;
}