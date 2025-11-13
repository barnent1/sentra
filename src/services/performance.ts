/**
 * Performance Monitoring Service
 *
 * Tracks application performance metrics including:
 * - Render times
 * - API call latency
 * - Memory usage
 * - Slow operations (>100ms)
 *
 * Zero performance impact when disabled.
 */

export interface PerformanceMeasurement {
  name: string;
  duration: number;
  timestamp: Date;
}

export interface RenderMetrics {
  component: string;
  duration: number;
  timestamp: Date;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

export interface MemorySnapshot {
  usedHeapMB: number;
  totalHeapMB: number;
  heapLimitMB: number;
  timestamp: Date;
}

export interface SlowOperation {
  type: 'render' | 'api' | 'measure';
  name: string;
  duration: number;
  timestamp: Date;
}

export interface PerformanceMetrics {
  measurements: PerformanceMeasurement[];
  renders: RenderMetrics[];
  apiCalls: APIMetrics[];
  memorySnapshots: MemorySnapshot[];
}

export interface RenderStats {
  count: number;
  average: number;
  min: number;
  max: number;
}

export interface APIStats {
  count: number;
  averageLatency: number;
  errorRate: number;
}

export interface PerformanceExport {
  exportedAt: Date;
  metrics: PerformanceMetrics;
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  slowThreshold?: number;
}

const SLOW_THRESHOLD = 100; // ms

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;

  private enabled: boolean;
  private slowThreshold: number;
  private measurements: PerformanceMeasurement[] = [];
  private renders: RenderMetrics[] = [];
  private apiCalls: APIMetrics[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private startMarks: Map<string, number> = new Map();

  constructor(options: PerformanceMonitorOptions = {}) {
    // Default to enabled if not specified (NODE_ENV check happens at runtime)
    this.enabled = options.enabled ?? true;
    this.slowThreshold = options.slowThreshold ?? SLOW_THRESHOLD;
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  /**
   * Start measuring an operation
   */
  startMeasure(name: string): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    this.startMarks.set(name, startTime);
  }

  /**
   * End measuring an operation
   */
  endMeasure(name: string): void {
    if (!this.enabled) return;

    const endTime = performance.now();
    const startTime = this.startMarks.get(name);

    if (startTime === undefined) {
      throw new Error(`No start mark found for: ${name}`);
    }

    const duration = endTime - startTime;
    this.startMarks.delete(name);

    this.measurements.push({
      name,
      duration,
      timestamp: new Date(),
    });
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return operation();
    }

    this.startMeasure(name);
    try {
      const result = await operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Track component render time
   */
  trackRenderTime(component: string, duration: number): void {
    if (!this.enabled) return;

    this.renders.push({
      component,
      duration,
      timestamp: new Date(),
    });
  }

  /**
   * Track API call latency
   */
  trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number
  ): void {
    if (!this.enabled) return;

    this.apiCalls.push({
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
    });
  }

  /**
   * Capture memory snapshot
   */
  trackMemory(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      usedHeapMB: 0,
      totalHeapMB: 0,
      heapLimitMB: 0,
      timestamp: new Date(),
    };

    if (!this.enabled) return snapshot;

    // Check if performance.memory is available (Chrome only)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        snapshot.usedHeapMB = memory.usedJSHeapSize / (1024 * 1024);
        snapshot.totalHeapMB = memory.totalJSHeapSize / (1024 * 1024);
        snapshot.heapLimitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      }
    }

    this.memorySnapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get slow operations (> threshold)
   */
  getSlowOperations(limit: number = 50): SlowOperation[] {
    if (!this.enabled) return [];

    const slowOps: SlowOperation[] = [];

    // Add slow renders
    for (const render of this.renders) {
      if (render.duration >= this.slowThreshold) {
        slowOps.push({
          type: 'render',
          name: `render:${render.component}`,
          duration: render.duration,
          timestamp: render.timestamp,
        });
      }
    }

    // Add slow API calls
    for (const apiCall of this.apiCalls) {
      if (apiCall.duration >= this.slowThreshold) {
        slowOps.push({
          type: 'api',
          name: apiCall.endpoint,
          duration: apiCall.duration,
          timestamp: apiCall.timestamp,
        });
      }
    }

    // Add slow measurements
    for (const measurement of this.measurements) {
      if (measurement.duration >= this.slowThreshold) {
        slowOps.push({
          type: 'measure',
          name: measurement.name,
          duration: measurement.duration,
          timestamp: measurement.timestamp,
        });
      }
    }

    // Sort by duration descending
    slowOps.sort((a, b) => b.duration - a.duration);

    return slowOps.slice(0, limit);
  }

  /**
   * Calculate frames per second from render times
   */
  getFPS(): number {
    if (!this.enabled || this.renders.length === 0) return 0;

    // Calculate FPS from last second of renders
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    const recentRenders = this.renders.filter(
      r => r.timestamp.getTime() >= oneSecondAgo
    );

    if (recentRenders.length === 0) {
      // Fallback: calculate average frame time and derive FPS
      const avgFrameTime =
        this.renders.reduce((sum, r) => sum + r.duration, 0) / this.renders.length;
      return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }

    return recentRenders.length;
  }

  /**
   * Get render statistics for a component
   */
  getRenderStats(component: string): RenderStats {
    const componentRenders = this.renders.filter(r => r.component === component);

    if (componentRenders.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 };
    }

    const durations = componentRenders.map(r => r.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: componentRenders.length,
      average: sum / componentRenders.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    };
  }

  /**
   * Get API statistics for an endpoint
   */
  getAPIStats(endpoint: string): APIStats {
    const endpointCalls = this.apiCalls.filter(c => c.endpoint === endpoint);

    if (endpointCalls.length === 0) {
      return { count: 0, averageLatency: 0, errorRate: 0 };
    }

    const latencies = endpointCalls.map(c => c.duration);
    const errors = endpointCalls.filter(c => c.statusCode >= 400).length;

    return {
      count: endpointCalls.length,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      errorRate: errors / endpointCalls.length,
    };
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    if (!this.enabled) {
      return {
        measurements: [],
        renders: [],
        apiCalls: [],
        memorySnapshots: [],
      };
    }

    return {
      measurements: [...this.measurements],
      renders: [...this.renders],
      apiCalls: [...this.apiCalls],
      memorySnapshots: [...this.memorySnapshots],
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceExport {
    return {
      exportedAt: new Date(),
      metrics: this.getMetrics(),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.measurements = [];
    this.renders = [];
    this.apiCalls = [];
    this.memorySnapshots = [];
    this.startMarks.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
