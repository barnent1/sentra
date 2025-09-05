/**
 * Performance Monitoring for Vector Database Operations
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * Provides comprehensive monitoring and metrics for:
 * - Vector store operations (store, search, batch)
 * - Search engine performance and cache efficiency
 * - Resource utilization and bottleneck detection
 * - Real-time alerts and performance trends
 */

// ============================================================================
// PERFORMANCE METRICS AND TYPES
// ============================================================================

/**
 * Operation types for performance tracking
 */
export enum OperationType {
  VECTOR_STORE = 'vector_store',
  VECTOR_SEARCH = 'vector_search',
  BATCH_STORE = 'batch_store',
  EMBEDDING_GENERATION = 'embedding_generation',
  CACHE_LOOKUP = 'cache_lookup',
  PATTERN_RANKING = 'pattern_ranking',
}

/**
 * Performance metric data point
 */
export interface PerformanceMetric {
  readonly timestamp: number;
  readonly operation: OperationType;
  readonly duration: number;           // milliseconds
  readonly success: boolean;
  readonly resourceUsage: {
    readonly memoryMb: number;
    readonly cpuPercent: number;
  };
  readonly metadata: {
    readonly recordCount?: number;
    readonly cacheHit?: boolean;
    readonly retryAttempts?: number;
    readonly errorCode?: string;
    readonly batchSize?: number;
    readonly filterComplexity?: number;
  };
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  readonly operation: OperationType;
  readonly timeWindow: {
    readonly startTime: number;
    readonly endTime: number;
    readonly windowSizeMs: number;
  };
  readonly metrics: {
    readonly totalOperations: number;
    readonly successfulOperations: number;
    readonly failedOperations: number;
    readonly averageDuration: number;
    readonly medianDuration: number;
    readonly p95Duration: number;
    readonly p99Duration: number;
    readonly minDuration: number;
    readonly maxDuration: number;
    readonly throughputPerSecond: number;
  };
  readonly resources: {
    readonly averageMemoryMb: number;
    readonly peakMemoryMb: number;
    readonly averageCpuPercent: number;
    readonly peakCpuPercent: number;
  };
  readonly reliability: {
    readonly successRate: number;
    readonly errorRate: number;
    readonly averageRetryAttempts: number;
  };
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
  readonly id: string;
  readonly name: string;
  readonly operation: OperationType;
  readonly condition: AlertCondition;
  readonly threshold: number;
  readonly windowSizeMs: number;      // Time window to evaluate
  readonly cooldownMs: number;        // Minimum time between alerts
  readonly severity: 'info' | 'warning' | 'critical';
  readonly enabled: boolean;
}

/**
 * Alert condition types
 */
export enum AlertCondition {
  AVERAGE_DURATION_EXCEEDS = 'avg_duration_exceeds',
  P95_DURATION_EXCEEDS = 'p95_duration_exceeds',
  ERROR_RATE_EXCEEDS = 'error_rate_exceeds',
  THROUGHPUT_BELOW = 'throughput_below',
  MEMORY_USAGE_EXCEEDS = 'memory_usage_exceeds',
  CPU_USAGE_EXCEEDS = 'cpu_usage_exceeds',
  CACHE_HIT_RATE_BELOW = 'cache_hit_rate_below',
}

/**
 * Triggered alert instance
 */
export interface AlertInstance {
  readonly alertId: string;
  readonly triggeredAt: number;
  readonly value: number;
  readonly threshold: number;
  readonly message: string;
  readonly severity: PerformanceAlert['severity'];
  readonly resolved: boolean;
  readonly resolvedAt?: number;
}

// ============================================================================
// PERFORMANCE MONITOR IMPLEMENTATION
// ============================================================================

/**
 * High-performance monitoring system for vector operations
 */
export class PerformanceMonitor {
  private readonly metrics: Map<OperationType, PerformanceMetric[]> = new Map();
  private readonly alerts: Map<string, PerformanceAlert> = new Map();
  private readonly activeAlerts: Map<string, AlertInstance> = new Map();
  private readonly maxMetricsPerOperation: number;
  private readonly retentionMs: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: {
    readonly maxMetricsPerOperation?: number;
    readonly retentionMs?: number;
    readonly cleanupIntervalMs?: number;
  } = {}) {
    this.maxMetricsPerOperation = options.maxMetricsPerOperation || 10000;
    this.retentionMs = options.retentionMs || 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize metric arrays for each operation type
    Object.values(OperationType).forEach(operation => {
      this.metrics.set(operation, []);
    });

    // Setup default alerts
    this.setupDefaultAlerts();

    // Start cleanup timer
    const cleanupInterval = options.cleanupIntervalMs || 5 * 60 * 1000; // 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const operationMetrics = this.metrics.get(metric.operation);
    if (!operationMetrics) return;

    // Add metric
    operationMetrics.push(metric);

    // Enforce size limit
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift(); // Remove oldest
    }

    // Check alerts
    this.checkAlerts(metric.operation);
  }

  /**
   * Record operation with automatic timing
   */
  async measureOperation<T>(
    operation: OperationType,
    fn: () => Promise<T>,
    metadata: PerformanceMetric['metadata'] = {}
  ): Promise<T> {
    const startTime = Date.now();
    const startCpuUsage = process.cpuUsage();

    let success = true;
    let result: T;

    try {
      result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      
      // Calculate CPU percentage (rough estimate)
      const cpuPercent = ((endCpuUsage.user + endCpuUsage.system) / 1000000) * 100 / (endTime - startTime);

      this.recordMetric({
        timestamp: startTime,
        operation,
        duration: endTime - startTime,
        success,
        resourceUsage: {
          memoryMb: endMemory,
          cpuPercent: Math.min(cpuPercent, 100), // Cap at 100%
        },
        metadata,
      });
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(
    operation: OperationType,
    windowMs: number = 60 * 60 * 1000 // 1 hour default
  ): PerformanceStats | undefined {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) return undefined;

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filter metrics within time window
    const windowMetrics = operationMetrics.filter(
      metric => metric.timestamp >= windowStart
    );

    if (windowMetrics.length === 0) return undefined;

    // Calculate basic metrics
    const totalOperations = windowMetrics.length;
    const successfulOperations = windowMetrics.filter(m => m.success).length;
    const failedOperations = totalOperations - successfulOperations;
    
    const durations = windowMetrics.map(m => m.duration).sort((a, b) => a - b);
    const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
    const medianDuration = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0;
    const p95Duration = durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0;
    const p99Duration = durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0;
    const minDuration = durations.length > 0 ? durations[0] : 0;
    const maxDuration = durations.length > 0 ? durations[durations.length - 1] : 0;
    
    const throughputPerSecond = (totalOperations / (windowMs / 1000));

    // Resource metrics
    const memoryUsages = windowMetrics.map(m => m.resourceUsage.memoryMb);
    const cpuUsages = windowMetrics.map(m => m.resourceUsage.cpuPercent);
    const averageMemoryMb = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length;
    const peakMemoryMb = Math.max(...memoryUsages);
    const averageCpuPercent = cpuUsages.reduce((sum, c) => sum + c, 0) / cpuUsages.length;
    const peakCpuPercent = Math.max(...cpuUsages);

    // Reliability metrics
    const successRate = successfulOperations / totalOperations;
    const errorRate = failedOperations / totalOperations;
    const retryMetrics = windowMetrics
      .map(m => m.metadata.retryAttempts || 0)
      .filter(r => r > 0);
    const averageRetryAttempts = retryMetrics.length > 0
      ? retryMetrics.reduce((sum, r) => sum + r, 0) / retryMetrics.length
      : 0;

    return {
      operation,
      timeWindow: {
        startTime: windowStart,
        endTime: now,
        windowSizeMs: windowMs,
      },
      metrics: {
        totalOperations,
        successfulOperations,
        failedOperations,
        averageDuration: averageDuration ?? 0,
        medianDuration: medianDuration ?? 0,
        p95Duration: p95Duration ?? 0,
        p99Duration: p99Duration ?? 0,
        minDuration: minDuration ?? 0,
        maxDuration: maxDuration ?? 0,
        throughputPerSecond,
      },
      resources: {
        averageMemoryMb,
        peakMemoryMb,
        averageCpuPercent,
        peakCpuPercent,
      },
      reliability: {
        successRate,
        errorRate,
        averageRetryAttempts,
      },
    };
  }

  /**
   * Get statistics for all operations
   */
  getAllStats(windowMs: number = 60 * 60 * 1000): readonly PerformanceStats[] {
    const stats: PerformanceStats[] = [];
    
    for (const operation of Object.values(OperationType)) {
      const operationStats = this.getStats(operation, windowMs);
      if (operationStats) {
        stats.push(operationStats);
      }
    }

    return stats;
  }

  /**
   * Register a performance alert
   */
  registerAlert(alert: PerformanceAlert): void {
    this.alerts.set(alert.id, alert);
  }

  /**
   * Remove an alert
   */
  removeAlert(alertId: string): void {
    this.alerts.delete(alertId);
    this.activeAlerts.delete(alertId);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): readonly AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get performance trends over time
   */
  getTrends(
    operation: OperationType,
    windowMs: number = 24 * 60 * 60 * 1000, // 24 hours
    bucketMs: number = 60 * 60 * 1000 // 1 hour buckets
  ): readonly {
    readonly timestamp: number;
    readonly averageDuration: number;
    readonly throughput: number;
    readonly errorRate: number;
  }[] {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) return [];

    const now = Date.now();
    const windowStart = now - windowMs;
    const windowMetrics = operationMetrics.filter(m => m.timestamp >= windowStart);
    
    // Group metrics into time buckets
    const buckets = new Map<number, PerformanceMetric[]>();
    
    for (const metric of windowMetrics) {
      const bucketTime = Math.floor(metric.timestamp / bucketMs) * bucketMs;
      const bucketMetrics = buckets.get(bucketTime) || [];
      bucketMetrics.push(metric);
      buckets.set(bucketTime, bucketMetrics);
    }

    // Calculate trends for each bucket
    const trends: {
      timestamp: number;
      averageDuration: number;
      throughput: number;
      errorRate: number;
    }[] = [];

    for (const [bucketTime, bucketMetrics] of buckets.entries()) {
      const averageDuration = bucketMetrics.reduce((sum, m) => sum + m.duration, 0) / bucketMetrics.length;
      const throughput = bucketMetrics.length / (bucketMs / 1000);
      const errorRate = bucketMetrics.filter(m => !m.success).length / bucketMetrics.length;
      
      trends.push({
        timestamp: bucketTime,
        averageDuration,
        throughput,
        errorRate,
      });
    }

    return trends.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(
    operation?: OperationType,
    windowMs?: number
  ): readonly PerformanceMetric[] {
    const now = Date.now();
    const cutoff = windowMs ? now - windowMs : 0;
    const allMetrics: PerformanceMetric[] = [];

    const operations = operation ? [operation] : Object.values(OperationType);
    
    for (const op of operations) {
      const operationMetrics = this.metrics.get(op) || [];
      const filteredMetrics = windowMs 
        ? operationMetrics.filter(m => m.timestamp >= cutoff)
        : operationMetrics;
      
      allMetrics.push(...filteredMetrics);
    }

    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Clear all metrics and alerts
   */
  clear(): void {
    this.metrics.clear();
    this.activeAlerts.clear();
    
    // Reinitialize metric arrays
    Object.values(OperationType).forEach(operation => {
      this.metrics.set(operation, []);
    });
  }

  /**
   * Cleanup expired data and resolved alerts
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.retentionMs;

    // Clean up old metrics
    for (const [operation, operationMetrics] of this.metrics.entries()) {
      const validMetrics = operationMetrics.filter(m => m.timestamp >= cutoff);
      this.metrics.set(operation, validMetrics);
    }

    // Clean up resolved alerts older than 1 hour
    const alertCutoff = now - (60 * 60 * 1000);
    for (const [alertId, alertInstance] of this.activeAlerts.entries()) {
      if (alertInstance.resolved && alertInstance.resolvedAt && alertInstance.resolvedAt < alertCutoff) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  /**
   * Setup default performance alerts
   */
  private setupDefaultAlerts(): void {
    const defaultAlerts: PerformanceAlert[] = [
      {
        id: 'vector_search_slow',
        name: 'Vector Search Performance Degradation',
        operation: OperationType.VECTOR_SEARCH,
        condition: AlertCondition.P95_DURATION_EXCEEDS,
        threshold: 200, // 200ms
        windowSizeMs: 5 * 60 * 1000, // 5 minutes
        cooldownMs: 15 * 60 * 1000, // 15 minutes
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'vector_store_error_rate',
        name: 'High Vector Store Error Rate',
        operation: OperationType.VECTOR_STORE,
        condition: AlertCondition.ERROR_RATE_EXCEEDS,
        threshold: 0.05, // 5%
        windowSizeMs: 10 * 60 * 1000, // 10 minutes
        cooldownMs: 30 * 60 * 1000, // 30 minutes
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'batch_store_throughput',
        name: 'Low Batch Store Throughput',
        operation: OperationType.BATCH_STORE,
        condition: AlertCondition.THROUGHPUT_BELOW,
        threshold: 0.5, // 0.5 operations per second
        windowSizeMs: 15 * 60 * 1000, // 15 minutes
        cooldownMs: 30 * 60 * 1000, // 30 minutes
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'memory_usage_high',
        name: 'High Memory Usage',
        operation: OperationType.EMBEDDING_GENERATION,
        condition: AlertCondition.MEMORY_USAGE_EXCEEDS,
        threshold: 500, // 500MB
        windowSizeMs: 5 * 60 * 1000, // 5 minutes
        cooldownMs: 10 * 60 * 1000, // 10 minutes
        severity: 'warning',
        enabled: true,
      },
    ];

    defaultAlerts.forEach(alert => this.registerAlert(alert));
  }

  /**
   * Check if any alerts should be triggered
   */
  private checkAlerts(operation: OperationType): void {
    const operationAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.operation === operation && alert.enabled);

    for (const alert of operationAlerts) {
      // Check cooldown
      const existingAlert = this.activeAlerts.get(alert.id);
      if (existingAlert && !existingAlert.resolved) {
        const timeSinceTriggered = Date.now() - existingAlert.triggeredAt;
        if (timeSinceTriggered < alert.cooldownMs) {
          continue;
        }
      }

      // Get stats for alert window
      const stats = this.getStats(operation, alert.windowSizeMs);
      if (!stats) continue;

      const shouldTrigger = this.evaluateAlertCondition(alert, stats);
      
      if (shouldTrigger.shouldTrigger) {
        this.triggerAlert(alert, shouldTrigger.value);
      } else if (existingAlert && !existingAlert.resolved) {
        // Resolve alert if condition no longer met
        this.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Evaluate if alert condition is met
   */
  private evaluateAlertCondition(
    alert: PerformanceAlert,
    stats: PerformanceStats
  ): { shouldTrigger: boolean; value: number } {
    let value: number;
    let shouldTrigger: boolean;

    switch (alert.condition) {
      case AlertCondition.AVERAGE_DURATION_EXCEEDS:
        value = stats.metrics.averageDuration;
        shouldTrigger = value > alert.threshold;
        break;
      
      case AlertCondition.P95_DURATION_EXCEEDS:
        value = stats.metrics.p95Duration;
        shouldTrigger = value > alert.threshold;
        break;
      
      case AlertCondition.ERROR_RATE_EXCEEDS:
        value = stats.reliability.errorRate;
        shouldTrigger = value > alert.threshold;
        break;
      
      case AlertCondition.THROUGHPUT_BELOW:
        value = stats.metrics.throughputPerSecond;
        shouldTrigger = value < alert.threshold;
        break;
      
      case AlertCondition.MEMORY_USAGE_EXCEEDS:
        value = stats.resources.peakMemoryMb;
        shouldTrigger = value > alert.threshold;
        break;
      
      case AlertCondition.CPU_USAGE_EXCEEDS:
        value = stats.resources.peakCpuPercent;
        shouldTrigger = value > alert.threshold;
        break;
      
      default:
        return { shouldTrigger: false, value: 0 };
    }

    return { shouldTrigger, value };
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: PerformanceAlert, value: number): void {
    const alertInstance: AlertInstance = {
      alertId: alert.id,
      triggeredAt: Date.now(),
      value,
      threshold: alert.threshold,
      message: `${alert.name}: ${alert.condition} = ${value}, threshold = ${alert.threshold}`,
      severity: alert.severity,
      resolved: false,
    };

    this.activeAlerts.set(alert.id, alertInstance);
    
    // Log alert (in production, you'd send to monitoring system)
    console.warn(`[ALERT] ${alertInstance.message}`);
  }

  /**
   * Resolve an active alert
   */
  private resolveAlert(alertId: string): void {
    const alertInstance = this.activeAlerts.get(alertId);
    if (alertInstance && !alertInstance.resolved) {
      const resolvedAlert: AlertInstance = {
        ...alertInstance,
        resolved: true,
        resolvedAt: Date.now(),
      };
      
      this.activeAlerts.set(alertId, resolvedAlert);
      console.info(`[ALERT RESOLVED] ${alertInstance.message}`);
    }
  }

  /**
   * Cleanup on destruction
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }
    this.clear();
  }
}

// Export statement removed - enums and types are already exported with their declarations