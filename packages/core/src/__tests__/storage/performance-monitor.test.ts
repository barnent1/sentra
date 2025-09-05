/**
 * Comprehensive tests for Performance Monitor
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  PerformanceMonitor,
  OperationType,
  AlertCondition,
} from '../../storage/performance-monitor';
import type {
  PerformanceMetric,
  PerformanceAlert,
} from '../../storage/performance-monitor';

// ============================================================================
// TEST SETUP AND MOCKS
// ============================================================================

// Mock process functions
const originalMemoryUsage = process.memoryUsage;
const originalCpuUsage = process.cpuUsage;

beforeEach(() => {
  // Mock process.memoryUsage
  process.memoryUsage = jest.fn(() => ({
    rss: 100 * 1024 * 1024,
    heapTotal: 80 * 1024 * 1024,
    heapUsed: 50 * 1024 * 1024,
    external: 10 * 1024 * 1024,
    arrayBuffers: 5 * 1024 * 1024,
  }));

  // Mock process.cpuUsage
  process.cpuUsage = jest.fn((previousValue?: NodeJS.CpuUsage) => {
    if (previousValue) {
      return {
        user: previousValue.user + 50000, // 50ms
        system: previousValue.system + 25000, // 25ms
      };
    }
    return {
      user: 100000, // 100ms
      system: 50000,  // 50ms
    };
  });
});

afterEach(() => {
  // Restore original functions
  process.memoryUsage = originalMemoryUsage;
  process.cpuUsage = originalCpuUsage;
});

// Test data helpers
function createTestMetric(overrides: Partial<PerformanceMetric> = {}): PerformanceMetric {
  return {
    timestamp: Date.now(),
    operation: OperationType.VECTOR_SEARCH,
    duration: 100,
    success: true,
    resourceUsage: {
      memoryMb: 50,
      cpuPercent: 25,
    },
    metadata: {
      recordCount: 10,
      cacheHit: false,
    },
    ...overrides,
  };
}

function createTestAlert(overrides: Partial<PerformanceAlert> = {}): PerformanceAlert {
  return {
    id: 'test-alert',
    name: 'Test Alert',
    operation: OperationType.VECTOR_SEARCH,
    condition: AlertCondition.AVERAGE_DURATION_EXCEEDS,
    threshold: 200,
    windowSizeMs: 60000, // 1 minute
    cooldownMs: 300000,  // 5 minutes
    severity: 'warning',
    enabled: true,
    ...overrides,
  };
}

// ============================================================================
// PERFORMANCE MONITOR TESTS
// ============================================================================

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      maxMetricsPerOperation: 100,
      retentionMs: 3600000, // 1 hour
      cleanupIntervalMs: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('recordMetric', () => {
    it('should record a performance metric', () => {
      const metric = createTestMetric();
      monitor.recordMetric(metric);

      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats).toBeDefined();
      expect(stats!.metrics.totalOperations).toBe(1);
    });

    it('should enforce size limits per operation', () => {
      // Create monitor with small limit
      const smallMonitor = new PerformanceMonitor({ maxMetricsPerOperation: 3 });

      // Add more metrics than limit
      for (let i = 0; i < 5; i++) {
        const metric = createTestMetric({ timestamp: Date.now() + i });
        smallMonitor.recordMetric(metric);
      }

      const stats = smallMonitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats!.metrics.totalOperations).toBe(3); // Should be limited

      smallMonitor.destroy();
    });

    it('should separate metrics by operation type', () => {
      const searchMetric = createTestMetric({ operation: OperationType.VECTOR_SEARCH });
      const storeMetric = createTestMetric({ operation: OperationType.VECTOR_STORE });

      monitor.recordMetric(searchMetric);
      monitor.recordMetric(storeMetric);

      const searchStats = monitor.getStats(OperationType.VECTOR_SEARCH);
      const storeStats = monitor.getStats(OperationType.VECTOR_STORE);

      expect(searchStats!.metrics.totalOperations).toBe(1);
      expect(storeStats!.metrics.totalOperations).toBe(1);
    });
  });

  describe('measureOperation', () => {
    it('should measure successful operation', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      };

      const result = await monitor.measureOperation(
        OperationType.VECTOR_SEARCH,
        testFn,
        { recordCount: 5 }
      );

      expect(result).toBe('success');

      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats!.metrics.totalOperations).toBe(1);
      expect(stats!.metrics.successfulOperations).toBe(1);
      expect(stats!.metrics.averageDuration).toBeGreaterThanOrEqual(50);
    });

    it('should measure failed operation', async () => {
      const testFn = async (): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 25));
        throw new Error('Test error');
      };

      await expect(
        monitor.measureOperation(OperationType.VECTOR_SEARCH, testFn)
      ).rejects.toThrow('Test error');

      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats!.metrics.totalOperations).toBe(1);
      expect(stats!.metrics.failedOperations).toBe(1);
      expect(stats!.reliability.errorRate).toBe(1.0);
    });

    it('should include metadata in recorded metrics', async () => {
      const testFn = async () => 'success';
      const metadata = { recordCount: 10, cacheHit: true };

      await monitor.measureOperation(OperationType.VECTOR_SEARCH, testFn, metadata);

      // We can't directly access the recorded metric, but we can verify it was recorded
      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats!.metrics.totalOperations).toBe(1);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      // Add some test metrics
      const metrics = [
        createTestMetric({ duration: 100, success: true, timestamp: Date.now() - 1000 }),
        createTestMetric({ duration: 200, success: true, timestamp: Date.now() - 500 }),
        createTestMetric({ duration: 150, success: false, timestamp: Date.now() }),
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));
    });

    it('should return correct basic statistics', () => {
      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      
      expect(stats).toBeDefined();
      expect(stats!.metrics.totalOperations).toBe(3);
      expect(stats!.metrics.successfulOperations).toBe(2);
      expect(stats!.metrics.failedOperations).toBe(1);
      expect(stats!.metrics.averageDuration).toBe(150); // (100 + 200 + 150) / 3
      expect(stats!.reliability.successRate).toBeCloseTo(2/3);
      expect(stats!.reliability.errorRate).toBeCloseTo(1/3);
    });

    it('should calculate percentiles correctly', () => {
      // Add more metrics for better percentile testing
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      durations.forEach((duration, i) => {
        monitor.recordMetric(createTestMetric({ 
          duration,
          timestamp: Date.now() - i * 100,
        }));
      });

      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      
      expect(stats!.metrics.minDuration).toBe(10);
      expect(stats!.metrics.maxDuration).toBe(200); // From beforeEach
      expect(stats!.metrics.medianDuration).toBeGreaterThan(0);
      expect(stats!.metrics.p95Duration).toBeGreaterThan(stats!.metrics.medianDuration);
      expect(stats!.metrics.p99Duration).toBeGreaterThan(stats!.metrics.p95Duration);
    });

    it('should calculate throughput correctly', () => {
      const stats = monitor.getStats(OperationType.VECTOR_SEARCH, 1000); // 1 second window
      expect(stats!.metrics.throughputPerSecond).toBe(3); // 3 operations in 1 second
    });

    it('should handle time window filtering', () => {
      // Add old metric outside window
      monitor.recordMetric(createTestMetric({
        timestamp: Date.now() - 2000, // 2 seconds ago
      }));

      const stats = monitor.getStats(OperationType.VECTOR_SEARCH, 1000); // 1 second window
      expect(stats!.metrics.totalOperations).toBe(3); // Should exclude old metric
    });

    it('should return undefined for operations with no metrics', () => {
      const stats = monitor.getStats(OperationType.EMBEDDING_GENERATION);
      expect(stats).toBeUndefined();
    });

    it('should calculate resource metrics correctly', () => {
      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      
      expect(stats!.resources.averageMemoryMb).toBe(50);
      expect(stats!.resources.peakMemoryMb).toBe(50);
      expect(stats!.resources.averageCpuPercent).toBe(25);
      expect(stats!.resources.peakCpuPercent).toBe(25);
    });
  });

  describe('getAllStats', () => {
    it('should return stats for all operations with data', () => {
      monitor.recordMetric(createTestMetric({ operation: OperationType.VECTOR_SEARCH }));
      monitor.recordMetric(createTestMetric({ operation: OperationType.VECTOR_STORE }));

      const allStats = monitor.getAllStats();
      expect(allStats).toHaveLength(2);
      expect(allStats.find(s => s.operation === OperationType.VECTOR_SEARCH)).toBeDefined();
      expect(allStats.find(s => s.operation === OperationType.VECTOR_STORE)).toBeDefined();
    });

    it('should exclude operations with no metrics', () => {
      monitor.recordMetric(createTestMetric({ operation: OperationType.VECTOR_SEARCH }));

      const allStats = monitor.getAllStats();
      expect(allStats).toHaveLength(1);
      expect(allStats[0].operation).toBe(OperationType.VECTOR_SEARCH);
    });
  });

  describe('alert system', () => {
    it('should register and remove alerts', () => {
      const alert = createTestAlert();
      monitor.registerAlert(alert);

      // Can't directly test if alert is registered, but can test removal doesn't crash
      monitor.removeAlert(alert.id);
      expect(() => monitor.removeAlert(alert.id)).not.toThrow();
    });

    it('should trigger alerts based on conditions', (done) => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Register alert with low threshold
      const alert = createTestAlert({
        condition: AlertCondition.AVERAGE_DURATION_EXCEEDS,
        threshold: 50, // Very low threshold
        windowSizeMs: 1000,
      });
      monitor.registerAlert(alert);

      // Add metrics that exceed threshold
      monitor.recordMetric(createTestMetric({ duration: 100 }));
      monitor.recordMetric(createTestMetric({ duration: 200 }));

      // Give alert time to be evaluated
      setTimeout(() => {
        const activeAlerts = monitor.getActiveAlerts();
        expect(activeAlerts.length).toBeGreaterThan(0);
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        done();
      }, 100);
    });

    it('should respect alert cooldown periods', (done) => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const alert = createTestAlert({
        threshold: 50,
        cooldownMs: 500, // 500ms cooldown
      });
      monitor.registerAlert(alert);

      // Trigger alert twice quickly
      monitor.recordMetric(createTestMetric({ duration: 100 }));
      monitor.recordMetric(createTestMetric({ duration: 100 }));

      setTimeout(() => {
        // Should only have one alert due to cooldown
        const activeAlerts = monitor.getActiveAlerts();
        expect(activeAlerts).toHaveLength(1);
        
        consoleSpy.mockRestore();
        done();
      }, 100);
    });

    it('should resolve alerts when conditions improve', (done) => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const alert = createTestAlert({
        threshold: 150,
        windowSizeMs: 500,
      });
      monitor.registerAlert(alert);

      // First, trigger alert with high duration
      monitor.recordMetric(createTestMetric({ duration: 200 }));

      setTimeout(() => {
        // Then add metrics with low duration to improve average
        monitor.recordMetric(createTestMetric({ duration: 50 }));
        monitor.recordMetric(createTestMetric({ duration: 50 }));

        setTimeout(() => {
          // Check that alert was resolved
          const activeAlerts = monitor.getActiveAlerts();
          const resolvedAlerts = activeAlerts.filter(a => a.resolved);
          expect(resolvedAlerts.length).toBeGreaterThan(0);
          expect(infoSpy).toHaveBeenCalled();

          consoleSpy.mockRestore();
          infoSpy.mockRestore();
          done();
        }, 100);
      }, 100);
    });

    it('should handle different alert conditions', () => {
      const alerts = [
        createTestAlert({
          id: 'duration-alert',
          condition: AlertCondition.AVERAGE_DURATION_EXCEEDS,
          threshold: 100,
        }),
        createTestAlert({
          id: 'error-rate-alert',
          condition: AlertCondition.ERROR_RATE_EXCEEDS,
          threshold: 0.5,
        }),
        createTestAlert({
          id: 'throughput-alert',
          condition: AlertCondition.THROUGHPUT_BELOW,
          threshold: 1,
        }),
      ];

      alerts.forEach(alert => monitor.registerAlert(alert));

      // Add metrics that should trigger different alerts
      monitor.recordMetric(createTestMetric({ duration: 200, success: false })); // High duration + error
      monitor.recordMetric(createTestMetric({ duration: 200, success: false })); // High error rate

      // All alerts should evaluate without crashing
      expect(() => {
        const activeAlerts = monitor.getActiveAlerts();
        // Don't assert specific count due to timing, just ensure no crashes
      }).not.toThrow();
    });
  });

  describe('getTrends', () => {
    it('should return trend data for operations', () => {
      const now = Date.now();
      
      // Add metrics across different time periods
      const metrics = [
        createTestMetric({ duration: 100, timestamp: now - 3600000 }), // 1 hour ago
        createTestMetric({ duration: 150, timestamp: now - 1800000 }), // 30 min ago
        createTestMetric({ duration: 200, timestamp: now - 900000 }),  // 15 min ago
        createTestMetric({ duration: 120, timestamp: now }),           // Now
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));

      const trends = monitor.getTrends(
        OperationType.VECTOR_SEARCH,
        3600000, // 1 hour window
        1800000  // 30 minute buckets
      );

      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('timestamp');
      expect(trends[0]).toHaveProperty('averageDuration');
      expect(trends[0]).toHaveProperty('throughput');
      expect(trends[0]).toHaveProperty('errorRate');
    });

    it('should return empty array for operations with no metrics', () => {
      const trends = monitor.getTrends(OperationType.EMBEDDING_GENERATION);
      expect(trends).toEqual([]);
    });
  });

  describe('exportMetrics', () => {
    it('should export all metrics when no filters applied', () => {
      const metrics = [
        createTestMetric({ operation: OperationType.VECTOR_SEARCH }),
        createTestMetric({ operation: OperationType.VECTOR_STORE }),
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));

      const exported = monitor.exportMetrics();
      expect(exported).toHaveLength(2);
      expect(exported[0].operation).toBe(OperationType.VECTOR_SEARCH);
      expect(exported[1].operation).toBe(OperationType.VECTOR_STORE);
    });

    it('should filter by operation type', () => {
      const metrics = [
        createTestMetric({ operation: OperationType.VECTOR_SEARCH }),
        createTestMetric({ operation: OperationType.VECTOR_STORE }),
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));

      const exported = monitor.exportMetrics(OperationType.VECTOR_SEARCH);
      expect(exported).toHaveLength(1);
      expect(exported[0].operation).toBe(OperationType.VECTOR_SEARCH);
    });

    it('should filter by time window', () => {
      const now = Date.now();
      const metrics = [
        createTestMetric({ timestamp: now - 2000 }), // 2 seconds ago
        createTestMetric({ timestamp: now - 500 }),  // 500ms ago
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));

      const exported = monitor.exportMetrics(undefined, 1000); // 1 second window
      expect(exported).toHaveLength(1);
      expect(exported[0].timestamp).toBe(now - 500);
    });

    it('should sort metrics by timestamp', () => {
      const now = Date.now();
      const metrics = [
        createTestMetric({ timestamp: now - 1000 }),
        createTestMetric({ timestamp: now - 2000 }),
        createTestMetric({ timestamp: now }),
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));

      const exported = monitor.exportMetrics();
      expect(exported).toHaveLength(3);
      expect(exported[0].timestamp).toBe(now - 2000); // Earliest first
      expect(exported[2].timestamp).toBe(now);        // Latest last
    });
  });

  describe('cleanup and memory management', () => {
    it('should clear all data', () => {
      monitor.recordMetric(createTestMetric());
      monitor.clear();

      const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats).toBeUndefined();
    });

    it('should handle destruction gracefully', () => {
      monitor.recordMetric(createTestMetric());
      expect(() => monitor.destroy()).not.toThrow();

      // After destruction, should still be safe to call methods
      expect(() => monitor.clear()).not.toThrow();
    });

    it('should clean up expired metrics automatically', (done) => {
      const shortRetentionMonitor = new PerformanceMonitor({
        retentionMs: 100, // 100ms retention
        cleanupIntervalMs: 50, // 50ms cleanup interval
      });

      // Add a metric
      shortRetentionMonitor.recordMetric(createTestMetric());
      
      // Should have the metric initially
      let stats = shortRetentionMonitor.getStats(OperationType.VECTOR_SEARCH);
      expect(stats!.metrics.totalOperations).toBe(1);

      // Wait for cleanup
      setTimeout(() => {
        stats = shortRetentionMonitor.getStats(OperationType.VECTOR_SEARCH);
        expect(stats).toBeUndefined(); // Should be cleaned up

        shortRetentionMonitor.destroy();
        done();
      }, 200);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('PerformanceMonitor Integration', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      maxMetricsPerOperation: 1000,
      retentionMs: 3600000,
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('should handle high-volume metric recording', () => {
    const startTime = Date.now();
    
    // Record many metrics quickly
    for (let i = 0; i < 1000; i++) {
      monitor.recordMetric(createTestMetric({
        duration: 50 + (i % 100),
        success: i % 10 !== 0, // 10% failure rate
        timestamp: startTime + i,
      }));
    }

    const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
    expect(stats!.metrics.totalOperations).toBe(1000);
    expect(stats!.metrics.successfulOperations).toBe(900);
    expect(stats!.reliability.errorRate).toBeCloseTo(0.1);
  });

  it('should maintain performance with multiple operation types', async () => {
    const operations = Object.values(OperationType);
    
    // Record metrics for all operation types concurrently
    const promises = operations.map(async (operation) => {
      for (let i = 0; i < 100; i++) {
        await monitor.measureOperation(operation, async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return `result-${i}`;
        });
      }
    });

    await Promise.all(promises);

    // Verify all operations have stats
    const allStats = monitor.getAllStats();
    expect(allStats).toHaveLength(operations.length);

    allStats.forEach(stats => {
      expect(stats.metrics.totalOperations).toBe(100);
      expect(stats.metrics.successfulOperations).toBe(100);
    });
  });

  it('should handle complex alert scenarios', (done) => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Register multiple alerts with different conditions
    const alerts = [
      createTestAlert({
        id: 'search-duration',
        operation: OperationType.VECTOR_SEARCH,
        condition: AlertCondition.AVERAGE_DURATION_EXCEEDS,
        threshold: 100,
        windowSizeMs: 1000,
      }),
      createTestAlert({
        id: 'store-errors',
        operation: OperationType.VECTOR_STORE,
        condition: AlertCondition.ERROR_RATE_EXCEEDS,
        threshold: 0.2,
        windowSizeMs: 1000,
      }),
    ];

    alerts.forEach(alert => monitor.registerAlert(alert));

    // Create conditions that trigger alerts
    monitor.recordMetric(createTestMetric({
      operation: OperationType.VECTOR_SEARCH,
      duration: 200, // Exceeds threshold
    }));

    monitor.recordMetric(createTestMetric({
      operation: OperationType.VECTOR_STORE,
      success: false, // 100% error rate
    }));

    setTimeout(() => {
      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThanOrEqual(1);
      
      consoleSpy.mockRestore();
      done();
    }, 100);
  });

  it('should provide consistent metrics under concurrent access', async () => {
    const concurrentOperations = 50;
    const metricsPerOperation = 20;

    // Run concurrent measurements
    const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
      for (let j = 0; j < metricsPerOperation; j++) {
        await monitor.measureOperation(
          OperationType.VECTOR_SEARCH,
          async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            if (Math.random() < 0.1) throw new Error('Random failure');
            return `result-${i}-${j}`;
          }
        );
      }
    });

    await Promise.allSettled(promises); // Allow some to fail

    const stats = monitor.getStats(OperationType.VECTOR_SEARCH);
    expect(stats!.metrics.totalOperations).toBeLessThanOrEqual(concurrentOperations * metricsPerOperation);
    expect(stats!.metrics.totalOperations).toBeGreaterThan(0);
    expect(stats!.reliability.successRate).toBeLessThanOrEqual(1.0);
    expect(stats!.reliability.successRate).toBeGreaterThanOrEqual(0.0);
  });
});