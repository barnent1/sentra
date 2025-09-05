/**
 * Performance Monitoring Types for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive monitoring, metrics, and observability for agent performance tracking
 */
// ============================================================================
// METRIC DEFINITIONS
// ============================================================================
/**
 * Types of metrics we collect
 */
export const MetricType = {
    // Performance metrics
    LATENCY: 'latency', // Response time metrics
    THROUGHPUT: 'throughput', // Tasks per unit time
    ERROR_RATE: 'error_rate', // Error frequency
    SUCCESS_RATE: 'success_rate', // Success frequency
    QUALITY_SCORE: 'quality_score', // Output quality
    // Resource metrics  
    CPU_USAGE: 'cpu_usage', // CPU utilization
    MEMORY_USAGE: 'memory_usage', // Memory utilization
    IO_OPERATIONS: 'io_operations', // Input/output operations
    NETWORK_USAGE: 'network_usage', // Network bandwidth usage
    // Learning metrics
    LEARNING_VELOCITY: 'learning_velocity', // Rate of skill acquisition
    KNOWLEDGE_RETENTION: 'knowledge_retention', // Knowledge persistence
    ADAPTATION_SPEED: 'adaptation_speed', // Context switching speed
    TRANSFER_EFFICIENCY: 'transfer_efficiency', // Cross-domain transfer
    // Behavioral metrics
    COLLABORATION_INDEX: 'collaboration_index', // Team interaction quality
    COMMUNICATION_CLARITY: 'communication_clarity', // Message comprehension
    INITIATIVE_SCORE: 'initiative_score', // Proactive behavior
    RELIABILITY_INDEX: 'reliability_index', // Consistency of performance
    // Evolution metrics
    MUTATION_SUCCESS_RATE: 'mutation_success_rate', // Beneficial mutations
    CROSSOVER_EFFECTIVENESS: 'crossover_effectiveness', // Crossover benefits
    GENETIC_DIVERSITY: 'genetic_diversity', // Population diversity
    EVOLUTION_CONVERGENCE: 'evolution_convergence', // Convergence rate
    // Business metrics
    USER_SATISFACTION: 'user_satisfaction', // User feedback scores
    TASK_COMPLETION_RATE: 'task_completion_rate', // Task success rate
    VALUE_DELIVERY: 'value_delivery', // Business value generated
    COST_EFFICIENCY: 'cost_efficiency', // Resource cost per output
};
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
    RATE: 'rate', // Change over time
    MOVING_AVERAGE: 'moving_average', // Moving window average
};
/**
 * Time windows for metric aggregation
 */
export const TimeWindow = {
    REAL_TIME: 'real_time', // Current value
    MINUTE: 'minute', // Last minute
    FIVE_MINUTES: 'five_minutes', // Last 5 minutes
    FIFTEEN_MINUTES: 'fifteen_minutes', // Last 15 minutes
    HOUR: 'hour', // Last hour
    DAY: 'day', // Last 24 hours
    WEEK: 'week', // Last 7 days
    MONTH: 'month', // Last 30 days
    QUARTER: 'quarter', // Last 90 days
    YEAR: 'year', // Last 365 days
};
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
};
/**
 * Alert severity levels
 */
export const AlertSeverity = {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical',
    EMERGENCY: 'emergency',
};
/**
 * Alert status
 */
export const AlertStatus = {
    OK: 'ok',
    PENDING: 'pending',
    ALERTING: 'alerting',
    NO_DATA: 'no_data',
    PAUSED: 'paused',
};
//# sourceMappingURL=monitoring.js.map