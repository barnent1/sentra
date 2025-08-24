import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Project, Agent, Task } from '@/types';

// Performance Testing Types
export interface PerformanceTestSuite {
  id: string;
  name: string;
  description: string;
  category: PerformanceCategory;
  tests: PerformanceTest[];
  configuration: PerformanceConfiguration;
  baseline: PerformanceBaseline;
  thresholds: PerformanceThresholds;
  metadata: PerformanceMetadata;
}

export type PerformanceCategory = 
  | 'load_testing'
  | 'stress_testing'
  | 'spike_testing'
  | 'volume_testing'
  | 'endurance_testing'
  | 'scalability_testing'
  | 'memory_profiling'
  | 'cpu_profiling'
  | 'network_testing'
  | 'database_performance';

export interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  type: TestType;
  scenario: TestScenario;
  loadPattern: LoadPattern;
  duration: TestDuration;
  resources: ResourceTargets;
  validation: ValidationCriteria;
  monitoring: MonitoringConfig;
}

export type TestType = 
  | 'load'
  | 'stress'
  | 'spike'
  | 'volume'
  | 'endurance'
  | 'scalability'
  | 'breakpoint'
  | 'soak'
  | 'configuration'
  | 'component';

export interface TestScenario {
  name: string;
  description: string;
  steps: ScenarioStep[];
  userProfiles: UserProfile[];
  dataGeneration: DataGenerationConfig;
  environmentSetup: EnvironmentSetup;
}

export interface ScenarioStep {
  id: string;
  name: string;
  action: ActionDefinition;
  weight: number; // Probability weight for random selection
  thinkTime: ThinkTimeConfig;
  validation: StepValidation[];
  errorHandling: ErrorHandlingConfig;
}

export interface ActionDefinition {
  type: 'api_call' | 'ui_interaction' | 'database_query' | 'file_operation' | 'claude_request' | 'agent_task';
  target: string;
  method?: string;
  parameters: Record<string, any>;
  payload?: any;
  headers?: Record<string, string>;
  timeout: number;
}

export interface ThinkTimeConfig {
  min: number; // milliseconds
  max: number;
  distribution: 'uniform' | 'normal' | 'exponential' | 'fixed';
  parameters?: Record<string, number>;
}

export interface StepValidation {
  type: 'response_time' | 'status_code' | 'response_body' | 'resource_usage';
  condition: ValidationCondition;
  severity: 'critical' | 'major' | 'minor';
}

export interface ValidationCondition {
  operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than' | 'contains' | 'matches';
  value: any;
  tolerance?: number;
}

export interface ErrorHandlingConfig {
  retryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number;
  continueOnError: boolean;
  errorThreshold: number; // Percentage of errors to abort test
}

export interface UserProfile {
  name: string;
  description: string;
  behavior: UserBehavior;
  weight: number; // Distribution percentage
  rampUpTime: number;
  sustainTime: number;
  rampDownTime: number;
}

export interface UserBehavior {
  sessionDuration: TimeRange;
  actionsPerSession: NumberRange;
  pauseBetweenSessions: TimeRange;
  errorTolerance: number;
  adaptiveBehavior: boolean;
}

export interface TimeRange {
  min: number;
  max: number;
  unit: 'ms' | 's' | 'm' | 'h';
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface DataGenerationConfig {
  strategy: 'static' | 'dynamic' | 'realistic' | 'synthetic';
  parameters: DataGenerationParameters;
  volume: DataVolumeConfig;
  relationships: DataRelationship[];
}

export interface DataGenerationParameters {
  seed?: number;
  templates: DataTemplate[];
  constraints: DataConstraint[];
  distributions: DataDistribution[];
}

export interface DataTemplate {
  name: string;
  schema: Record<string, FieldDefinition>;
  relationships: string[];
  constraints: string[];
}

export interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'uuid' | 'reference';
  generator: GeneratorConfig;
  validation?: FieldValidation;
}

export interface GeneratorConfig {
  type: string;
  parameters: Record<string, any>;
  distribution?: string;
}

export interface FieldValidation {
  required: boolean;
  unique: boolean;
  pattern?: string;
  range?: NumberRange;
  length?: NumberRange;
}

export interface DataConstraint {
  field: string;
  constraint: string;
  parameters: Record<string, any>;
}

export interface DataDistribution {
  field: string;
  distribution: 'uniform' | 'normal' | 'exponential' | 'power_law' | 'custom';
  parameters: Record<string, number>;
}

export interface DataVolumeConfig {
  initialRecords: number;
  growthRate: number;
  maxRecords: number;
  partitioning: PartitioningStrategy;
}

export interface PartitioningStrategy {
  enabled: boolean;
  strategy: 'time_based' | 'hash_based' | 'range_based' | 'custom';
  parameters: Record<string, any>;
}

export interface DataRelationship {
  from: string;
  to: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  cascading: boolean;
}

export interface EnvironmentSetup {
  infrastructure: InfrastructureConfig;
  services: ServiceConfig[];
  databases: DatabaseConfig[];
  monitoring: MonitoringSetup;
  cleanup: CleanupConfig;
}

export interface InfrastructureConfig {
  resources: ResourceAllocation;
  networking: NetworkConfig;
  storage: StorageConfig;
  containers: ContainerConfig[];
}

export interface ResourceAllocation {
  cpu: ResourceSpec;
  memory: ResourceSpec;
  storage: ResourceSpec;
  network: ResourceSpec;
}

export interface ResourceSpec {
  min: number;
  max: number;
  unit: string;
  autoScale: boolean;
}

export interface NetworkConfig {
  bandwidth: BandwidthConfig;
  latency: LatencyConfig;
  reliability: ReliabilityConfig;
}

export interface BandwidthConfig {
  upload: number;
  download: number;
  unit: 'kbps' | 'mbps' | 'gbps';
  variability: number;
}

export interface LatencyConfig {
  base: number;
  jitter: number;
  unit: 'ms' | 's';
  distribution: string;
}

export interface ReliabilityConfig {
  packetLoss: number;
  errorRate: number;
  intermittentFailures: boolean;
}

export interface StorageConfig {
  type: 'local' | 'network' | 'cloud';
  capacity: number;
  iops: number;
  throughput: number;
  consistency: 'strong' | 'eventual' | 'weak';
}

export interface ContainerConfig {
  name: string;
  image: string;
  resources: ResourceAllocation;
  replicas: number;
  healthCheck: HealthCheckConfig;
}

export interface HealthCheckConfig {
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
}

export interface ServiceConfig {
  name: string;
  url: string;
  type: 'api' | 'database' | 'cache' | 'queue' | 'cdn';
  configuration: Record<string, any>;
  monitoring: ServiceMonitoring;
}

export interface ServiceMonitoring {
  healthCheck: boolean;
  metricsCollection: boolean;
  logAggregation: boolean;
  alerting: boolean;
}

export interface DatabaseConfig {
  name: string;
  type: 'postgresql' | 'mongodb' | 'redis' | 'elasticsearch';
  configuration: DatabaseConfiguration;
  performance: DatabasePerformance;
}

export interface DatabaseConfiguration {
  connectionPool: PoolConfig;
  caching: CacheConfig;
  indexing: IndexConfig;
  replication: ReplicationConfig;
}

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeout: number;
  acquireTimeout: number;
}

export interface CacheConfig {
  enabled: boolean;
  size: number;
  ttl: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

export interface IndexConfig {
  strategy: 'automatic' | 'manual' | 'optimized';
  maintenance: boolean;
  monitoring: boolean;
}

export interface ReplicationConfig {
  enabled: boolean;
  replicas: number;
  consistency: 'strong' | 'eventual';
  failover: boolean;
}

export interface DatabasePerformance {
  queryOptimization: boolean;
  connectionPooling: boolean;
  caching: boolean;
  partitioning: boolean;
}

export interface MonitoringSetup {
  metrics: MetricsCollection;
  logging: LoggingConfig;
  tracing: TracingConfig;
  profiling: ProfilingConfig;
}

export interface MetricsCollection {
  system: SystemMetrics;
  application: ApplicationMetrics;
  custom: CustomMetrics;
  retention: MetricsRetention;
}

export interface SystemMetrics {
  cpu: boolean;
  memory: boolean;
  disk: boolean;
  network: boolean;
  processes: boolean;
}

export interface ApplicationMetrics {
  responseTime: boolean;
  throughput: boolean;
  errorRate: boolean;
  activeUsers: boolean;
  businessMetrics: boolean;
}

export interface CustomMetrics {
  enabled: boolean;
  definitions: MetricDefinition[];
  aggregation: AggregationConfig;
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  buckets?: number[];
}

export interface AggregationConfig {
  intervals: string[];
  functions: string[];
  retention: string;
}

export interface MetricsRetention {
  raw: string;
  aggregated: string;
  storage: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text' | 'structured';
  sampling: SamplingConfig;
  aggregation: LogAggregation;
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number;
  strategy: 'random' | 'rate_limit' | 'priority_based';
}

export interface LogAggregation {
  enabled: boolean;
  interval: number;
  fields: string[];
  retention: string;
}

export interface TracingConfig {
  enabled: boolean;
  samplingRate: number;
  maxSpans: number;
  timeout: number;
}

export interface ProfilingConfig {
  enabled: boolean;
  cpuProfiling: boolean;
  memoryProfiling: boolean;
  blockProfiling: boolean;
  goroutineProfiling: boolean;
}

export interface CleanupConfig {
  automated: boolean;
  schedule: string;
  retention: RetentionPolicy;
  verification: boolean;
}

export interface RetentionPolicy {
  data: string;
  logs: string;
  metrics: string;
  artifacts: string;
}

export interface LoadPattern {
  type: LoadPatternType;
  configuration: LoadConfiguration;
  phases: LoadPhase[];
  distribution: LoadDistribution;
}

export type LoadPatternType = 
  | 'constant'
  | 'ramp_up'
  | 'ramp_down' 
  | 'spike'
  | 'wave'
  | 'step'
  | 'random'
  | 'realistic'
  | 'custom';

export interface LoadConfiguration {
  virtualUsers: VirtualUserConfig;
  requestRate: RequestRateConfig;
  concurrency: ConcurrencyConfig;
  arrival: ArrivalConfig;
}

export interface VirtualUserConfig {
  initial: number;
  target: number;
  maximum: number;
  scaling: ScalingConfig;
}

export interface ScalingConfig {
  strategy: 'linear' | 'exponential' | 'logarithmic' | 'step' | 'custom';
  parameters: Record<string, number>;
}

export interface RequestRateConfig {
  initial: number;
  target: number;
  maximum: number;
  unit: 'per_second' | 'per_minute' | 'per_hour';
}

export interface ConcurrencyConfig {
  level: number;
  timeout: number;
  queueing: QueueingConfig;
}

export interface QueueingConfig {
  enabled: boolean;
  maxSize: number;
  strategy: 'fifo' | 'lifo' | 'priority';
}

export interface ArrivalConfig {
  pattern: 'poisson' | 'uniform' | 'burst' | 'realistic';
  parameters: Record<string, number>;
}

export interface LoadPhase {
  name: string;
  duration: number;
  virtualUsers: number;
  requestRate: number;
  rampUpTime?: number;
  rampDownTime?: number;
}

export interface LoadDistribution {
  geographic: GeographicDistribution[];
  temporal: TemporalDistribution[];
  device: DeviceDistribution[];
  network: NetworkDistribution[];
}

export interface GeographicDistribution {
  region: string;
  percentage: number;
  latency: number;
  bandwidth: number;
}

export interface TemporalDistribution {
  timeSlot: string;
  loadMultiplier: number;
  pattern: string;
}

export interface DeviceDistribution {
  type: 'desktop' | 'mobile' | 'tablet';
  percentage: number;
  capabilities: DeviceCapabilities;
}

export interface DeviceCapabilities {
  cpu: number;
  memory: number;
  network: string;
  browser?: string;
}

export interface NetworkDistribution {
  type: '5g' | '4g' | 'wifi' | 'ethernet' | 'satellite';
  percentage: number;
  characteristics: NetworkCharacteristics;
}

export interface NetworkCharacteristics {
  bandwidth: number;
  latency: number;
  reliability: number;
  jitter: number;
}

export interface TestDuration {
  total: number;
  warmUp: number;
  measurement: number;
  coolDown: number;
  unit: 'seconds' | 'minutes' | 'hours';
}

export interface ResourceTargets {
  cpu: ResourceTarget;
  memory: ResourceTarget;
  disk: ResourceTarget;
  network: ResourceTarget;
  database: DatabaseTarget;
}

export interface ResourceTarget {
  utilization: number;
  capacity: number;
  alerts: AlertConfig[];
}

export interface DatabaseTarget {
  connections: number;
  queryTime: number;
  throughput: number;
  cacheHitRatio: number;
}

export interface AlertConfig {
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  action: 'log' | 'notify' | 'scale' | 'abort';
}

export interface ValidationCriteria {
  performance: PerformanceValidation;
  reliability: ReliabilityValidation;
  scalability: ScalabilityValidation;
  resource: ResourceValidation;
}

export interface PerformanceValidation {
  responseTime: ResponseTimeValidation;
  throughput: ThroughputValidation;
  latency: LatencyValidation;
  availability: AvailabilityValidation;
}

export interface ResponseTimeValidation {
  mean: ThresholdValidation;
  median: ThresholdValidation;
  p95: ThresholdValidation;
  p99: ThresholdValidation;
  max: ThresholdValidation;
}

export interface ThresholdValidation {
  value: number;
  unit: string;
  operator: 'less_than' | 'greater_than' | 'equals' | 'between';
  tolerance?: number;
}

export interface ThroughputValidation {
  minimum: number;
  target: number;
  maximum: number;
  unit: 'rps' | 'rpm' | 'rph';
}

export interface LatencyValidation {
  network: ThresholdValidation;
  database: ThresholdValidation;
  application: ThresholdValidation;
  endToEnd: ThresholdValidation;
}

export interface AvailabilityValidation {
  uptime: number;
  errorRate: number;
  sla: SLAValidation;
}

export interface SLAValidation {
  availability: number;
  responseTime: number;
  errorBudget: number;
}

export interface ReliabilityValidation {
  errorRate: ThresholdValidation;
  failureRecovery: RecoveryValidation;
  dataIntegrity: IntegrityValidation;
}

export interface RecoveryValidation {
  meanTimeToRecover: number;
  maxDowntime: number;
  automaticRecovery: boolean;
}

export interface IntegrityValidation {
  consistency: boolean;
  durability: boolean;
  atomicity: boolean;
}

export interface ScalabilityValidation {
  horizontal: ScaleValidation;
  vertical: ScaleValidation;
  elasticity: ElasticityValidation;
}

export interface ScaleValidation {
  factor: number;
  efficiency: number;
  bottlenecks: BottleneckValidation[];
}

export interface BottleneckValidation {
  component: string;
  threshold: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ElasticityValidation {
  scaleUpTime: number;
  scaleDownTime: number;
  costEfficiency: number;
}

export interface ResourceValidation {
  cpu: ResourceThreshold;
  memory: ResourceThreshold;
  disk: ResourceThreshold;
  network: ResourceThreshold;
}

export interface ResourceThreshold {
  maximum: number;
  average: number;
  sustained: number;
  unit: string;
}

export interface MonitoringConfig {
  realTime: RealTimeMonitoring;
  collection: DataCollection;
  analysis: AnalysisConfig;
  alerting: AlertingConfig;
}

export interface RealTimeMonitoring {
  dashboard: boolean;
  streaming: boolean;
  frequency: number;
  retention: number;
}

export interface DataCollection {
  metrics: string[];
  logs: string[];
  traces: boolean;
  profiles: boolean;
}

export interface AnalysisConfig {
  statistical: boolean;
  trending: boolean;
  correlation: boolean;
  prediction: boolean;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: string[];
  rules: AlertRule[];
}

export interface AlertRule {
  metric: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: string;
}

export interface PerformanceConfiguration {
  execution: ExecutionConfig;
  reporting: ReportingConfig;
  optimization: OptimizationConfig;
  integration: IntegrationConfig;
}

export interface ExecutionConfig {
  parallel: boolean;
  distribution: DistributionConfig;
  isolation: IsolationConfig;
  recovery: RecoveryConfig;
}

export interface DistributionConfig {
  strategy: 'single_node' | 'multi_node' | 'cloud' | 'hybrid';
  nodes: NodeConfig[];
  loadBalancing: LoadBalancingConfig;
}

export interface NodeConfig {
  id: string;
  capacity: ResourceAllocation;
  location: string;
  capabilities: string[];
}

export interface LoadBalancingConfig {
  algorithm: 'round_robin' | 'weighted' | 'least_connections' | 'response_time';
  healthCheck: boolean;
  failover: boolean;
}

export interface IsolationConfig {
  network: boolean;
  process: boolean;
  container: boolean;
  namespace: boolean;
}

export interface RecoveryConfig {
  checkpoints: boolean;
  rollback: boolean;
  resume: boolean;
  cleanup: boolean;
}

export interface ReportingConfig {
  formats: ReportFormat[];
  delivery: DeliveryConfig;
  customization: CustomizationConfig;
}

export interface ReportFormat {
  type: 'html' | 'pdf' | 'json' | 'csv' | 'xml';
  template: string;
  sections: string[];
}

export interface DeliveryConfig {
  immediate: boolean;
  scheduled: boolean;
  channels: string[];
  recipients: string[];
}

export interface CustomizationConfig {
  branding: boolean;
  themes: string[];
  charts: ChartConfig[];
}

export interface ChartConfig {
  type: string;
  metrics: string[];
  aggregation: string;
  timeRange: string;
}

export interface OptimizationConfig {
  automatic: boolean;
  algorithms: string[];
  parameters: OptimizationParameters;
}

export interface OptimizationParameters {
  objectives: string[];
  constraints: Record<string, any>;
  tolerance: number;
}

export interface IntegrationConfig {
  ci_cd: CICDIntegration;
  monitoring: MonitoringIntegration;
  apm: APMIntegration;
}

export interface CICDIntegration {
  enabled: boolean;
  pipeline: string;
  triggers: string[];
  gates: QualityGate[];
}

export interface QualityGate {
  metric: string;
  threshold: number;
  action: 'pass' | 'warn' | 'fail';
}

export interface MonitoringIntegration {
  platform: string;
  endpoint: string;
  metrics: string[];
  alerts: boolean;
}

export interface APMIntegration {
  platform: string;
  instrumentation: boolean;
  correlation: boolean;
  tracing: boolean;
}

export interface PerformanceBaseline {
  version: string;
  timestamp: string;
  environment: string;
  metrics: BaselineMetrics;
  conditions: BaselineConditions;
}

export interface BaselineMetrics {
  responseTime: StatisticalSummary;
  throughput: StatisticalSummary;
  errorRate: StatisticalSummary;
  resourceUtilization: ResourceUtilizationSummary;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  stddev: number;
  unit: string;
}

export interface ResourceUtilizationSummary {
  cpu: StatisticalSummary;
  memory: StatisticalSummary;
  disk: StatisticalSummary;
  network: StatisticalSummary;
}

export interface BaselineConditions {
  load: LoadConfiguration;
  environment: EnvironmentSnapshot;
  configuration: ConfigurationSnapshot;
}

export interface EnvironmentSnapshot {
  infrastructure: Record<string, any>;
  services: Record<string, any>;
  network: Record<string, any>;
}

export interface ConfigurationSnapshot {
  application: Record<string, any>;
  database: Record<string, any>;
  system: Record<string, any>;
}

export interface PerformanceThresholds {
  sla: SLAThresholds;
  alerts: AlertThresholds;
  degradation: DegradationThresholds;
}

export interface SLAThresholds {
  availability: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export interface AlertThresholds {
  warning: ThresholdSet;
  critical: ThresholdSet;
  emergency: ThresholdSet;
}

export interface ThresholdSet {
  responseTime: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: number;
}

export interface DegradationThresholds {
  minor: number;
  major: number;
  severe: number;
  critical: number;
}

export interface PerformanceMetadata {
  author: string;
  version: string;
  created: string;
  updated: string;
  tags: string[];
  description: string;
  requirements: string[];
  assumptions: string[];
}

export interface PerformanceTestExecution {
  id: string;
  suiteId: string;
  testId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  results: PerformanceResults;
  analysis: PerformanceAnalysis;
  recommendations: Recommendation[];
  artifacts: ExecutionArtifact[];
}

export type ExecutionStatus = 
  | 'queued'
  | 'initializing'
  | 'running'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface PerformanceResults {
  summary: ResultSummary;
  metrics: DetailedMetrics;
  trends: TrendAnalysis;
  bottlenecks: BottleneckAnalysis;
  comparison: BaselineComparison;
}

export interface ResultSummary {
  overall: OverallResult;
  categories: CategoryResults;
  validation: ValidationResults;
}

export interface OverallResult {
  status: 'pass' | 'fail' | 'warning';
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

export interface CategoryResults {
  performance: CategoryResult;
  scalability: CategoryResult;
  reliability: CategoryResult;
  efficiency: CategoryResult;
}

export interface CategoryResult {
  score: number;
  status: string;
  metrics: Record<string, number>;
  issues: Issue[];
}

export interface Issue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface ValidationResults {
  thresholds: ThresholdResult[];
  sla: SLAResult;
  regression: RegressionResult;
}

export interface ThresholdResult {
  metric: string;
  actual: number;
  expected: number;
  status: 'pass' | 'fail' | 'warning';
  deviation: number;
}

export interface SLAResult {
  availability: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  compliance: number;
}

export interface RegressionResult {
  detected: boolean;
  severity: string;
  affectedMetrics: string[];
  impact: number;
}

export interface DetailedMetrics {
  response: ResponseMetrics;
  throughput: ThroughputMetrics;
  resource: ResourceMetrics;
  error: ErrorMetrics;
  custom: Record<string, any>;
}

export interface ResponseMetrics {
  times: TimeSeriesData;
  distribution: DistributionData;
  percentiles: PercentileData;
  trends: TrendData;
}

export interface TimeSeriesData {
  timestamps: number[];
  values: number[];
  unit: string;
}

export interface DistributionData {
  buckets: number[];
  counts: number[];
  percentages: number[];
}

export interface PercentileData {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
}

export interface TrendData {
  slope: number;
  correlation: number;
  forecast: ForecastData;
}

export interface ForecastData {
  predictions: number[];
  confidence: number[];
  horizon: number;
}

export interface ThroughputMetrics {
  rates: TimeSeriesData;
  capacity: CapacityData;
  efficiency: EfficiencyData;
}

export interface CapacityData {
  theoretical: number;
  practical: number;
  utilization: number;
  saturation: number;
}

export interface EfficiencyData {
  score: number;
  factors: EfficiencyFactor[];
  optimization: OptimizationPotential;
}

export interface EfficiencyFactor {
  name: string;
  impact: number;
  category: string;
}

export interface OptimizationPotential {
  improvement: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface ResourceMetrics {
  cpu: ResourceTimeSeries;
  memory: ResourceTimeSeries;
  disk: ResourceTimeSeries;
  network: ResourceTimeSeries;
}

export interface ResourceTimeSeries {
  utilization: TimeSeriesData;
  saturation: TimeSeriesData;
  errors: TimeSeriesData;
}

export interface ErrorMetrics {
  rates: TimeSeriesData;
  types: ErrorTypeBreakdown;
  patterns: ErrorPattern[];
}

export interface ErrorTypeBreakdown {
  client: number;
  server: number;
  network: number;
  timeout: number;
  other: number;
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  impact: number;
  correlation: string[];
}

export interface TrendAnalysis {
  performance: PerformanceTrend;
  scalability: ScalabilityTrend;
  stability: StabilityTrend;
}

export interface PerformanceTrend {
  direction: 'improving' | 'stable' | 'degrading';
  magnitude: number;
  confidence: number;
  factors: string[];
}

export interface ScalabilityTrend {
  linearRegion: LinearRegion;
  bottleneckPoint: BottleneckPoint;
  efficiency: EfficiencyTrend;
}

export interface LinearRegion {
  start: number;
  end: number;
  slope: number;
  correlation: number;
}

export interface BottleneckPoint {
  load: number;
  response: number;
  resource: string;
  severity: number;
}

export interface EfficiencyTrend {
  current: number;
  predicted: number;
  degradation: number;
}

export interface StabilityTrend {
  variance: number;
  consistency: number;
  anomalies: Anomaly[];
}

export interface Anomaly {
  timestamp: number;
  metric: string;
  value: number;
  severity: number;
  cause?: string;
}

export interface BottleneckAnalysis {
  identified: Bottleneck[];
  ranking: BottleneckRanking;
  impact: ImpactAssessment;
}

export interface Bottleneck {
  component: string;
  type: string;
  severity: number;
  saturation: number;
  queue: QueueAnalysis;
  recommendations: string[];
}

export interface QueueAnalysis {
  depth: number;
  waitTime: number;
  serviceTime: number;
  utilization: number;
}

export interface BottleneckRanking {
  critical: string[];
  major: string[];
  minor: string[];
}

export interface ImpactAssessment {
  performance: number;
  scalability: number;
  cost: number;
  risk: number;
}

export interface BaselineComparison {
  summary: ComparisonSummary;
  metrics: MetricComparison[];
  regression: RegressionAnalysis;
}

export interface ComparisonSummary {
  overall: 'better' | 'same' | 'worse';
  improvement: number;
  degradation: number;
  significance: number;
}

export interface MetricComparison {
  name: string;
  baseline: number;
  current: number;
  change: number;
  percentage: number;
  significant: boolean;
}

export interface RegressionAnalysis {
  detected: boolean;
  confidence: number;
  impact: string;
  causes: RegressionCause[];
}

export interface RegressionCause {
  factor: string;
  contribution: number;
  certainty: number;
}

export interface PerformanceAnalysis {
  statistical: StatisticalAnalysis;
  correlation: CorrelationAnalysis;
  causation: CausationAnalysis;
  prediction: PredictionAnalysis;
}

export interface StatisticalAnalysis {
  distribution: DistributionAnalysis;
  outliers: OutlierAnalysis;
  significance: SignificanceTest[];
}

export interface DistributionAnalysis {
  type: string;
  parameters: Record<string, number>;
  goodness: number;
  skewness: number;
  kurtosis: number;
}

export interface OutlierAnalysis {
  method: string;
  outliers: OutlierPoint[];
  threshold: number;
}

export interface OutlierPoint {
  timestamp: number;
  value: number;
  severity: number;
  cause?: string;
}

export interface SignificanceTest {
  test: string;
  statistic: number;
  pValue: number;
  significant: boolean;
}

export interface CorrelationAnalysis {
  matrix: CorrelationMatrix;
  significant: CorrelationPair[];
  network: CorrelationNetwork;
}

export interface CorrelationMatrix {
  variables: string[];
  values: number[][];
}

export interface CorrelationPair {
  variable1: string;
  variable2: string;
  correlation: number;
  significance: number;
}

export interface CorrelationNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkNode {
  id: string;
  label: string;
  type: string;
  importance: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

export interface CausationAnalysis {
  relationships: CausalRelationship[];
  pathways: CausalPathway[];
  interventions: InterventionAnalysis[];
}

export interface CausalRelationship {
  cause: string;
  effect: string;
  strength: number;
  confidence: number;
  mechanism: string;
}

export interface CausalPathway {
  path: string[];
  strength: number;
  significance: number;
}

export interface InterventionAnalysis {
  intervention: string;
  expectedImpact: number;
  confidence: number;
  cost: number;
  risk: number;
}

export interface PredictionAnalysis {
  models: PredictionModel[];
  forecasts: Forecast[];
  scenarios: ScenarioAnalysis[];
}

export interface PredictionModel {
  type: string;
  accuracy: number;
  features: string[];
  parameters: Record<string, any>;
}

export interface Forecast {
  metric: string;
  horizon: number;
  values: number[];
  confidence: number[];
  accuracy: number;
}

export interface ScenarioAnalysis {
  scenario: string;
  conditions: Record<string, any>;
  predictions: Record<string, number>;
  probability: number;
}

export interface Recommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  implementation: Implementation;
  impact: Impact;
  effort: Effort;
  risk: Risk;
}

export interface Implementation {
  steps: string[];
  timeframe: string;
  resources: string[];
  dependencies: string[];
  alternatives: string[];
}

export interface Impact {
  performance: number;
  cost: number;
  reliability: number;
  maintainability: number;
  confidence: number;
}

export interface Effort {
  development: number;
  testing: number;
  deployment: number;
  maintenance: number;
  total: number;
}

export interface Risk {
  technical: number;
  operational: number;
  business: number;
  mitigation: string[];
  contingency: string[];
}

export interface ExecutionArtifact {
  id: string;
  type: 'report' | 'data' | 'chart' | 'log' | 'profile';
  name: string;
  path: string;
  size: number;
  format: string;
  metadata: Record<string, any>;
}

export const usePerformanceTesting = () => {
  const [testSuites, setTestSuites] = useState<Map<string, PerformanceTestSuite>>(new Map());
  const [executions, setExecutions] = useState<Map<string, PerformanceTestExecution>>(new Map());
  const [activeExecutions, setActiveExecutions] = useState<Set<string>>(new Set());
  const [baselines, setBaselines] = useState<Map<string, PerformanceBaseline>>(new Map());
  const metricsCollector = useRef<MetricsCollector | null>(null);
  
  const { projects, agents, addNotification } = useDashboardStore();

  // Initialize performance testing framework
  const initialize = useCallback(async () => {
    try {
      // Initialize metrics collection
      metricsCollector.current = new MetricsCollector();
      
      // Load built-in performance test suites
      await loadBuiltInSuites();
      
      // Load existing baselines
      await loadBaselines();
      
      // Setup monitoring infrastructure
      await setupMonitoringInfrastructure();

      addNotification({
        id: 'perf_testing_init',
        type: 'success',
        title: 'Performance Testing Initialized',
        message: `Loaded ${testSuites.size} performance test suites`,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        ttsEnabled: false,
        crossDeviceSync: true,
      });

    } catch (error) {
      console.error('Failed to initialize performance testing:', error);
      addNotification({
        id: 'perf_testing_error',
        type: 'error',
        title: 'Performance Testing Error',
        message: 'Failed to initialize performance testing framework',
        timestamp: new Date().toISOString(),
        priority: 'high',
        ttsEnabled: true,
        crossDeviceSync: true,
      });
    }
  }, [addNotification]);

  // Execute performance test
  const executePerformanceTest = useCallback(async (
    testId: string,
    configuration?: Partial<PerformanceConfiguration>
  ): Promise<PerformanceTestExecution> => {
    // Implementation for executing performance tests
    const executionId = `perf_exec_${Date.now()}`;
    
    const execution: PerformanceTestExecution = {
      id: executionId,
      suiteId: '',
      testId,
      status: 'queued',
      startTime: new Date().toISOString(),
      results: {
        summary: {
          overall: { status: 'pass', score: 0, grade: 'A', summary: '' },
          categories: {
            performance: { score: 0, status: 'pass', metrics: {}, issues: [] },
            scalability: { score: 0, status: 'pass', metrics: {}, issues: [] },
            reliability: { score: 0, status: 'pass', metrics: {}, issues: [] },
            efficiency: { score: 0, status: 'pass', metrics: {}, issues: [] },
          },
          validation: {
            thresholds: [],
            sla: { availability: 0, responseTime: 0, throughput: 0, errorRate: 0, compliance: 0 },
            regression: { detected: false, severity: 'low', affectedMetrics: [], impact: 0 },
          },
        },
        metrics: {} as DetailedMetrics,
        trends: {} as TrendAnalysis,
        bottlenecks: { identified: [], ranking: { critical: [], major: [], minor: [] }, impact: { performance: 0, scalability: 0, cost: 0, risk: 0 } },
        comparison: {} as BaselineComparison,
      },
      analysis: {} as PerformanceAnalysis,
      recommendations: [],
      artifacts: [],
    };

    executions.set(executionId, execution);
    activeExecutions.add(executionId);
    
    // Start execution process
    executeTestAsync(execution);
    
    return execution;
  }, [executions, activeExecutions]);

  // Load built-in test suites
  const loadBuiltInSuites = async () => {
    // Implementation for loading built-in performance test suites
    const builtInSuites: PerformanceTestSuite[] = [
      {
        id: 'claude_integration_load_test',
        name: 'Claude Integration Load Test',
        description: 'Test Claude API integration under various load conditions',
        category: 'load_testing',
        tests: [
          {
            id: 'claude_api_load',
            name: 'Claude API Load Test',
            description: 'Test Claude API performance under increasing load',
            type: 'load',
            scenario: {
              name: 'Claude API Usage Simulation',
              description: 'Simulate realistic Claude API usage patterns',
              steps: [
                {
                  id: 'code_generation_request',
                  name: 'Code Generation Request',
                  action: {
                    type: 'claude_request',
                    target: '/api/claude/generate',
                    method: 'POST',
                    parameters: {
                      prompt: 'Generate a TypeScript function for data validation',
                      language: 'typescript',
                      context: 'web application',
                    },
                    timeout: 30000,
                  },
                  weight: 40,
                  thinkTime: { min: 1000, max: 5000, distribution: 'normal' },
                  validation: [
                    {
                      type: 'response_time',
                      condition: { operator: 'less_than', value: 10000 },
                      severity: 'critical',
                    },
                    {
                      type: 'status_code',
                      condition: { operator: 'equals', value: 200 },
                      severity: 'critical',
                    },
                  ],
                  errorHandling: {
                    retryOnFailure: true,
                    maxRetries: 3,
                    retryDelay: 1000,
                    continueOnError: false,
                    errorThreshold: 5,
                  },
                },
              ],
              userProfiles: [
                {
                  name: 'Heavy User',
                  description: 'Users who make frequent Claude API requests',
                  behavior: {
                    sessionDuration: { min: 30, max: 120, unit: 'm' },
                    actionsPerSession: { min: 20, max: 100 },
                    pauseBetweenSessions: { min: 5, max: 30, unit: 'm' },
                    errorTolerance: 0.05,
                    adaptiveBehavior: true,
                  },
                  weight: 30,
                  rampUpTime: 300,
                  sustainTime: 1200,
                  rampDownTime: 300,
                },
              ],
              dataGeneration: {
                strategy: 'realistic',
                parameters: {
                  templates: [],
                  constraints: [],
                  distributions: [],
                },
                volume: {
                  initialRecords: 1000,
                  growthRate: 1.2,
                  maxRecords: 10000,
                  partitioning: { enabled: false, strategy: 'hash_based', parameters: {} },
                },
                relationships: [],
              },
              environmentSetup: {
                infrastructure: {
                  resources: {
                    cpu: { min: 2, max: 8, unit: 'cores', autoScale: true },
                    memory: { min: 4, max: 16, unit: 'GB', autoScale: true },
                    storage: { min: 10, max: 100, unit: 'GB', autoScale: false },
                    network: { min: 100, max: 1000, unit: 'Mbps', autoScale: false },
                  },
                  networking: {
                    bandwidth: { upload: 100, download: 1000, unit: 'mbps', variability: 0.1 },
                    latency: { base: 50, jitter: 10, unit: 'ms', distribution: 'normal' },
                    reliability: { packetLoss: 0.01, errorRate: 0.001, intermittentFailures: false },
                  },
                  storage: {
                    type: 'local',
                    capacity: 100,
                    iops: 1000,
                    throughput: 100,
                    consistency: 'strong',
                  },
                  containers: [],
                },
                services: [],
                databases: [],
                monitoring: {
                  metrics: {
                    system: { cpu: true, memory: true, disk: true, network: true, processes: true },
                    application: { responseTime: true, throughput: true, errorRate: true, activeUsers: true, businessMetrics: true },
                    custom: { enabled: true, definitions: [], aggregation: { intervals: ['1m', '5m'], functions: ['avg', 'max'], retention: '24h' } },
                    retention: { raw: '1h', aggregated: '7d', storage: '30d' },
                  },
                  logging: {
                    level: 'info',
                    format: 'json',
                    sampling: { enabled: true, rate: 0.1, strategy: 'random' },
                    aggregation: { enabled: true, interval: 60, fields: ['level', 'message'], retention: '7d' },
                  },
                  tracing: { enabled: true, samplingRate: 0.1, maxSpans: 1000, timeout: 30 },
                  profiling: { enabled: false, cpuProfiling: false, memoryProfiling: false, blockProfiling: false, goroutineProfiling: false },
                },
                cleanup: {
                  automated: true,
                  schedule: '0 2 * * *',
                  retention: { data: '7d', logs: '30d', metrics: '90d', artifacts: '30d' },
                  verification: true,
                },
              },
            },
            loadPattern: {
              type: 'ramp_up',
              configuration: {
                virtualUsers: { initial: 1, target: 100, maximum: 200, scaling: { strategy: 'linear', parameters: {} } },
                requestRate: { initial: 1, target: 50, maximum: 100, unit: 'per_second' },
                concurrency: { level: 10, timeout: 30000, queueing: { enabled: true, maxSize: 100, strategy: 'fifo' } },
                arrival: { pattern: 'poisson', parameters: { lambda: 2 } },
              },
              phases: [
                { name: 'ramp_up', duration: 300, virtualUsers: 50, requestRate: 25, rampUpTime: 300 },
                { name: 'sustained', duration: 600, virtualUsers: 100, requestRate: 50 },
                { name: 'peak', duration: 300, virtualUsers: 200, requestRate: 100, rampUpTime: 60 },
                { name: 'ramp_down', duration: 300, virtualUsers: 0, requestRate: 0, rampDownTime: 300 },
              ],
              distribution: {
                geographic: [],
                temporal: [],
                device: [],
                network: [],
              },
            },
            duration: { total: 1500, warmUp: 60, measurement: 1200, coolDown: 240, unit: 'seconds' },
            resources: {
              cpu: { utilization: 80, capacity: 100, alerts: [] },
              memory: { utilization: 70, capacity: 100, alerts: [] },
              disk: { utilization: 50, capacity: 100, alerts: [] },
              network: { utilization: 60, capacity: 100, alerts: [] },
              database: { connections: 50, queryTime: 100, throughput: 1000, cacheHitRatio: 0.9 },
            },
            validation: {
              performance: {
                responseTime: {
                  mean: { value: 2000, unit: 'ms', operator: 'less_than' },
                  median: { value: 1500, unit: 'ms', operator: 'less_than' },
                  p95: { value: 5000, unit: 'ms', operator: 'less_than' },
                  p99: { value: 10000, unit: 'ms', operator: 'less_than' },
                  max: { value: 30000, unit: 'ms', operator: 'less_than' },
                },
                throughput: { minimum: 10, target: 50, maximum: 100, unit: 'rps' },
                latency: {
                  network: { value: 100, unit: 'ms', operator: 'less_than' },
                  database: { value: 50, unit: 'ms', operator: 'less_than' },
                  application: { value: 1000, unit: 'ms', operator: 'less_than' },
                  endToEnd: { value: 2000, unit: 'ms', operator: 'less_than' },
                },
                availability: { uptime: 99.9, errorRate: 0.1, sla: { availability: 99.5, responseTime: 2000, errorBudget: 0.5 } },
              },
              reliability: {
                errorRate: { value: 1, unit: '%', operator: 'less_than' },
                failureRecovery: { meanTimeToRecover: 300, maxDowntime: 600, automaticRecovery: true },
                dataIntegrity: { consistency: true, durability: true, atomicity: true },
              },
              scalability: {
                horizontal: { factor: 2, efficiency: 0.8, bottlenecks: [] },
                vertical: { factor: 2, efficiency: 0.9, bottlenecks: [] },
                elasticity: { scaleUpTime: 300, scaleDownTime: 600, costEfficiency: 0.8 },
              },
              resource: {
                cpu: { maximum: 90, average: 70, sustained: 80, unit: '%' },
                memory: { maximum: 85, average: 65, sustained: 75, unit: '%' },
                disk: { maximum: 70, average: 40, sustained: 60, unit: '%' },
                network: { maximum: 80, average: 50, sustained: 70, unit: '%' },
              },
            },
            monitoring: {
              realTime: { dashboard: true, streaming: true, frequency: 5, retention: 3600 },
              collection: { metrics: ['response_time', 'throughput', 'error_rate'], logs: ['error', 'warn'], traces: true, profiles: false },
              analysis: { statistical: true, trending: true, correlation: true, prediction: false },
              alerting: { enabled: true, channels: ['email', 'webhook'], rules: [] },
            },
          },
        ],
        configuration: {
          execution: {
            parallel: false,
            distribution: {
              strategy: 'single_node',
              nodes: [],
              loadBalancing: { algorithm: 'round_robin', healthCheck: true, failover: true },
            },
            isolation: { network: false, process: true, container: false, namespace: false },
            recovery: { checkpoints: true, rollback: false, resume: true, cleanup: true },
          },
          reporting: {
            formats: [{ type: 'html', template: 'standard', sections: ['summary', 'metrics', 'analysis'] }],
            delivery: { immediate: true, scheduled: false, channels: ['email'], recipients: ['team@example.com'] },
            customization: { branding: false, themes: ['default'], charts: [] },
          },
          optimization: { automatic: false, algorithms: ['gradient_descent'], parameters: { objectives: ['minimize_response_time'], constraints: {}, tolerance: 0.1 } },
          integration: {
            ci_cd: { enabled: true, pipeline: 'main', triggers: ['commit'], gates: [] },
            monitoring: { platform: 'prometheus', endpoint: 'http://prometheus:9090', metrics: ['response_time'], alerts: true },
            apm: { platform: 'jaeger', instrumentation: true, correlation: true, tracing: true },
          },
        },
        baseline: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          environment: 'production',
          metrics: {
            responseTime: { mean: 1500, median: 1200, p95: 3000, p99: 5000, min: 100, max: 10000, stddev: 500, unit: 'ms' },
            throughput: { mean: 45, median: 50, p95: 60, p99: 70, min: 10, max: 80, stddev: 15, unit: 'rps' },
            errorRate: { mean: 0.5, median: 0.3, p95: 1.0, p99: 2.0, min: 0, max: 5, stddev: 0.8, unit: '%' },
            resourceUtilization: {
              cpu: { mean: 65, median: 60, p95: 85, p99: 95, min: 10, max: 100, stddev: 20, unit: '%' },
              memory: { mean: 60, median: 55, p95: 80, p99: 90, min: 20, max: 95, stddev: 18, unit: '%' },
              disk: { mean: 35, median: 30, p95: 60, p99: 75, min: 5, max: 85, stddev: 15, unit: '%' },
              network: { mean: 45, median: 40, p95: 70, p99: 85, min: 10, max: 95, stddev: 22, unit: '%' },
            },
          },
          conditions: {
            load: {
              virtualUsers: { initial: 1, target: 100, maximum: 200, scaling: { strategy: 'linear', parameters: {} } },
              requestRate: { initial: 1, target: 50, maximum: 100, unit: 'per_second' },
              concurrency: { level: 10, timeout: 30000, queueing: { enabled: true, maxSize: 100, strategy: 'fifo' } },
              arrival: { pattern: 'poisson', parameters: { lambda: 2 } },
            },
            environment: { infrastructure: {}, services: {}, network: {} },
            configuration: { application: {}, database: {}, system: {} },
          },
        },
        thresholds: {
          sla: { availability: 99.5, responseTime: 2000, throughput: 40, errorRate: 1 },
          alerts: {
            warning: { responseTime: 3000, throughput: 30, errorRate: 2, resourceUtilization: 80 },
            critical: { responseTime: 5000, throughput: 20, errorRate: 5, resourceUtilization: 90 },
            emergency: { responseTime: 10000, throughput: 10, errorRate: 10, resourceUtilization: 95 },
          },
          degradation: { minor: 10, major: 25, severe: 50, critical: 75 },
        },
        metadata: {
          author: 'Performance Testing Team',
          version: '1.0.0',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tags: ['claude', 'api', 'load', 'critical'],
          description: 'Performance testing for Claude API integration under various load conditions',
          requirements: ['Claude API access', 'Load testing infrastructure'],
          assumptions: ['Stable network conditions', 'Representative load patterns'],
        },
      },
    ];

    for (const suite of builtInSuites) {
      testSuites.set(suite.id, suite);
    }
    
    setTestSuites(new Map(testSuites));
  };

  // Async execution function
  const executeTestAsync = async (execution: PerformanceTestExecution) => {
    try {
      execution.status = 'initializing';
      
      // Initialize test environment
      await initializeTestEnvironment(execution);
      
      execution.status = 'running';
      
      // Run the actual performance test
      await runPerformanceTest(execution);
      
      execution.status = 'analyzing';
      
      // Analyze results
      await analyzeResults(execution);
      
      // Generate recommendations
      await generateRecommendations(execution);
      
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.duration = Date.now() - new Date(execution.startTime).getTime();
      
    } catch (error) {
      execution.status = 'failed';
      console.error('Performance test execution failed:', error);
    } finally {
      activeExecutions.delete(execution.id);
      setActiveExecutions(new Set(activeExecutions));
    }
  };

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // Test management
    testSuites: Array.from(testSuites.values()),
    executions: Array.from(executions.values()),
    activeExecutions: Array.from(activeExecutions),
    baselines: Array.from(baselines.values()),
    
    // Execution methods
    executePerformanceTest,
    
    // Status
    isInitialized: testSuites.size > 0,
  };
};

// Helper classes and functions
class MetricsCollector {
  private metrics: Map<string, any[]> = new Map();
  
  collect(metric: string, value: any, timestamp?: number) {
    const ts = timestamp || Date.now();
    const values = this.metrics.get(metric) || [];
    values.push({ value, timestamp: ts });
    this.metrics.set(metric, values);
  }
  
  getMetrics(metric: string): any[] {
    return this.metrics.get(metric) || [];
  }
  
  getAllMetrics(): Record<string, any[]> {
    return Object.fromEntries(this.metrics.entries());
  }
  
  clear() {
    this.metrics.clear();
  }
}

// Implementation stubs for key functions
async function loadBaselines(): Promise<void> {
  // Load existing performance baselines
}

async function setupMonitoringInfrastructure(): Promise<void> {
  // Setup monitoring infrastructure for performance testing
}

async function initializeTestEnvironment(execution: PerformanceTestExecution): Promise<void> {
  // Initialize the test environment
}

async function runPerformanceTest(execution: PerformanceTestExecution): Promise<void> {
  // Execute the actual performance test
}

async function analyzeResults(execution: PerformanceTestExecution): Promise<void> {
  // Analyze performance test results
}

async function generateRecommendations(execution: PerformanceTestExecution): Promise<void> {
  // Generate performance improvement recommendations
}