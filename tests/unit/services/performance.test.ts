/**
 * Performance Service Tests
 *
 * This file tests the performance monitoring and profiling system.
 * Following TDD approach - tests written FIRST before implementation.
 *
 * Coverage requirement: 90%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PerformanceMonitor,
  PerformanceMetrics,
  SlowOperation,
  MemorySnapshot,
  RenderMetrics,
  APIMetrics,
} from '@/services/performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset performance API mocks
    vi.clearAllMocks();
    monitor = new PerformanceMonitor({ enabled: true });
  });

  afterEach(() => {
    monitor.disable();
  });

  describe('constructor', () => {
    it('should initialize with enabled state', () => {
      const enabled = new PerformanceMonitor({ enabled: true });
      expect(enabled.isEnabled()).toBe(true);
    });

    it('should initialize with disabled state', () => {
      const disabled = new PerformanceMonitor({ enabled: false });
      expect(disabled.isEnabled()).toBe(false);
    });

    it('should default to enabled in development', () => {
      const defaultMonitor = new PerformanceMonitor();
      expect(defaultMonitor.isEnabled()).toBe(true);
    });

    it('should not track when disabled', () => {
      const disabled = new PerformanceMonitor({ enabled: false });
      disabled.startMeasure('test');
      disabled.endMeasure('test');

      const metrics = disabled.getMetrics();
      expect(metrics.measurements.length).toBe(0);
    });
  });

  describe('startMeasure/endMeasure', () => {
    it('should measure operation duration', () => {
      monitor.startMeasure('test-operation');
      monitor.endMeasure('test-operation');

      const metrics = monitor.getMetrics();
      expect(metrics.measurements.length).toBe(1);
      expect(metrics.measurements[0].name).toBe('test-operation');
      expect(metrics.measurements[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple operations', () => {
      monitor.startMeasure('op1');
      monitor.startMeasure('op2');
      monitor.endMeasure('op1');
      monitor.endMeasure('op2');

      const metrics = monitor.getMetrics();
      expect(metrics.measurements.length).toBe(2);
    });

    it('should support nested operations', () => {
      monitor.startMeasure('outer');
      monitor.startMeasure('inner');
      monitor.endMeasure('inner');
      monitor.endMeasure('outer');

      const metrics = monitor.getMetrics();
      const inner = metrics.measurements.find(m => m.name === 'inner');
      const outer = metrics.measurements.find(m => m.name === 'outer');

      expect(inner).toBeDefined();
      expect(outer).toBeDefined();
      expect(outer!.duration).toBeGreaterThanOrEqual(inner!.duration);
    });

    it('should throw error if endMeasure called without startMeasure', () => {
      expect(() => {
        monitor.endMeasure('non-existent');
      }).toThrow('No start mark found for: non-existent');
    });

    it('should include timestamp for each measurement', () => {
      const before = Date.now();
      monitor.startMeasure('test');
      monitor.endMeasure('test');
      const after = Date.now();

      const metrics = monitor.getMetrics();
      const timestamp = metrics.measurements[0].timestamp.getTime();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('measureAsync', () => {
    it('should measure async operation duration', async () => {
      const result = await monitor.measureAsync('async-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });

      expect(result).toBe('result');

      const metrics = monitor.getMetrics();
      expect(metrics.measurements.length).toBe(1);
      expect(metrics.measurements[0].name).toBe('async-op');
      expect(metrics.measurements[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should handle async errors and still record measurement', async () => {
      await expect(
        monitor.measureAsync('failing-op', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      const metrics = monitor.getMetrics();
      expect(metrics.measurements.length).toBe(1);
      expect(metrics.measurements[0].name).toBe('failing-op');
    });

    it('should return promise result', async () => {
      const result = await monitor.measureAsync('data-fetch', async () => {
        return { data: 'test' };
      });

      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('trackRenderTime', () => {
    it('should track component render duration', () => {
      monitor.trackRenderTime('MyComponent', 16.5);

      const metrics = monitor.getMetrics();
      expect(metrics.renders.length).toBe(1);
      expect(metrics.renders[0].component).toBe('MyComponent');
      expect(metrics.renders[0].duration).toBe(16.5);
    });

    it('should detect slow renders (>100ms)', () => {
      monitor.trackRenderTime('SlowComponent', 150);

      const slowOps = monitor.getSlowOperations();
      expect(slowOps.length).toBe(1);
      expect(slowOps[0].name).toBe('render:SlowComponent');
      expect(slowOps[0].duration).toBe(150);
    });

    it('should not flag fast renders as slow', () => {
      monitor.trackRenderTime('FastComponent', 10);

      const slowOps = monitor.getSlowOperations();
      expect(slowOps.length).toBe(0);
    });

    it('should aggregate renders for same component', () => {
      monitor.trackRenderTime('MyComponent', 10);
      monitor.trackRenderTime('MyComponent', 20);
      monitor.trackRenderTime('MyComponent', 15);

      const stats = monitor.getRenderStats('MyComponent');
      expect(stats.count).toBe(3);
      expect(stats.average).toBeCloseTo(15, 1);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(20);
    });
  });

  describe('trackAPICall', () => {
    it('should track API call latency', () => {
      monitor.trackAPICall('/api/users', 'GET', 245, 200);

      const metrics = monitor.getMetrics();
      expect(metrics.apiCalls.length).toBe(1);
      expect(metrics.apiCalls[0].endpoint).toBe('/api/users');
      expect(metrics.apiCalls[0].method).toBe('GET');
      expect(metrics.apiCalls[0].duration).toBe(245);
      expect(metrics.apiCalls[0].statusCode).toBe(200);
    });

    it('should detect slow API calls (>100ms)', () => {
      monitor.trackAPICall('/api/slow', 'POST', 350, 200);

      const slowOps = monitor.getSlowOperations();
      expect(slowOps.length).toBe(1);
      expect(slowOps[0].type).toBe('api');
      expect(slowOps[0].duration).toBe(350);
    });

    it('should track failed API calls', () => {
      monitor.trackAPICall('/api/error', 'GET', 100, 500);

      const metrics = monitor.getMetrics();
      expect(metrics.apiCalls[0].statusCode).toBe(500);
    });

    it('should calculate average latency per endpoint', () => {
      monitor.trackAPICall('/api/users', 'GET', 100, 200);
      monitor.trackAPICall('/api/users', 'GET', 200, 200);
      monitor.trackAPICall('/api/users', 'GET', 150, 200);

      const stats = monitor.getAPIStats('/api/users');
      expect(stats.count).toBe(3);
      expect(stats.averageLatency).toBeCloseTo(150, 1);
      expect(stats.errorRate).toBe(0);
    });

    it('should calculate error rate', () => {
      monitor.trackAPICall('/api/test', 'GET', 100, 200);
      monitor.trackAPICall('/api/test', 'GET', 100, 500);
      monitor.trackAPICall('/api/test', 'GET', 100, 200);

      const stats = monitor.getAPIStats('/api/test');
      expect(stats.errorRate).toBeCloseTo(0.333, 2);
    });
  });

  describe('trackMemory', () => {
    it('should capture memory snapshot', () => {
      // Mock performance.memory API
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2048 * 1024 * 1024, // 2GB
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
        configurable: true,
      });

      const snapshot = monitor.trackMemory();

      expect(snapshot.usedHeapMB).toBeCloseTo(50, 0);
      expect(snapshot.totalHeapMB).toBeCloseTo(100, 0);
      expect(snapshot.heapLimitMB).toBeCloseTo(2048, 0);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });

    it('should detect memory increase', () => {
      const mockMemory = { usedJSHeapSize: 50 * 1024 * 1024 };
      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
        configurable: true,
      });

      const snapshot1 = monitor.trackMemory();

      // Increase memory usage
      mockMemory.usedJSHeapSize = 150 * 1024 * 1024;
      const snapshot2 = monitor.trackMemory();

      expect(snapshot2.usedHeapMB).toBeGreaterThan(snapshot1.usedHeapMB);
    });

    it('should handle missing memory API gracefully', () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const snapshot = monitor.trackMemory();

      expect(snapshot.usedHeapMB).toBe(0);
      expect(snapshot.totalHeapMB).toBe(0);
    });
  });

  describe('getSlowOperations', () => {
    it('should return operations slower than threshold', () => {
      monitor.trackRenderTime('SlowComponent', 150);
      monitor.trackRenderTime('FastComponent', 10);
      monitor.trackAPICall('/api/slow', 'GET', 200, 200);

      const slowOps = monitor.getSlowOperations();

      expect(slowOps.length).toBe(2);
      expect(slowOps.every(op => op.duration >= 100)).toBe(true);
    });

    it('should sort by duration descending', () => {
      monitor.trackRenderTime('Component1', 150);
      monitor.trackRenderTime('Component2', 250);
      monitor.trackRenderTime('Component3', 180);

      const slowOps = monitor.getSlowOperations();

      expect(slowOps[0].duration).toBe(250);
      expect(slowOps[1].duration).toBe(180);
      expect(slowOps[2].duration).toBe(150);
    });

    it('should limit results to specified count', () => {
      for (let i = 0; i < 10; i++) {
        monitor.trackRenderTime(`Component${i}`, 150);
      }

      const slowOps = monitor.getSlowOperations(5);
      expect(slowOps.length).toBe(5);
    });

    it('should include operation type and name', () => {
      monitor.trackRenderTime('MyComponent', 150);

      const slowOps = monitor.getSlowOperations();

      expect(slowOps[0]).toHaveProperty('type');
      expect(slowOps[0]).toHaveProperty('name');
      expect(slowOps[0]).toHaveProperty('duration');
      expect(slowOps[0]).toHaveProperty('timestamp');
    });
  });

  describe('getFPS', () => {
    it('should calculate frames per second', () => {
      // Simulate 60 FPS (16.67ms per frame)
      for (let i = 0; i < 60; i++) {
        monitor.trackRenderTime('Frame', 16.67);
      }

      const fps = monitor.getFPS();
      expect(fps).toBeCloseTo(60, 0);
    });

    it('should return 0 if no renders tracked', () => {
      const fps = monitor.getFPS();
      expect(fps).toBe(0);
    });

    it('should detect low FPS', () => {
      // Simulate 30 FPS (33.33ms per frame)
      for (let i = 0; i < 30; i++) {
        monitor.trackRenderTime('Frame', 33.33);
      }

      const fps = monitor.getFPS();
      expect(fps).toBeCloseTo(30, 0);
    });
  });

  describe('getMetrics', () => {
    it('should return all tracked metrics', () => {
      monitor.startMeasure('test');
      monitor.endMeasure('test');
      monitor.trackRenderTime('Component', 20);
      monitor.trackAPICall('/api/test', 'GET', 100, 200);
      monitor.trackMemory();

      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('measurements');
      expect(metrics).toHaveProperty('renders');
      expect(metrics).toHaveProperty('apiCalls');
      expect(metrics).toHaveProperty('memorySnapshots');
      expect(metrics.measurements.length).toBeGreaterThan(0);
      expect(metrics.renders.length).toBeGreaterThan(0);
      expect(metrics.apiCalls.length).toBeGreaterThan(0);
      expect(metrics.memorySnapshots.length).toBeGreaterThan(0);
    });

    it('should return empty metrics when disabled', () => {
      const disabled = new PerformanceMonitor({ enabled: false });
      disabled.trackRenderTime('Component', 20);

      const metrics = disabled.getMetrics();

      expect(metrics.measurements.length).toBe(0);
      expect(metrics.renders.length).toBe(0);
      expect(metrics.apiCalls.length).toBe(0);
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics in JSON format', () => {
      monitor.trackRenderTime('Component', 20);
      monitor.trackAPICall('/api/test', 'GET', 100, 200);

      const exported = monitor.exportMetrics();

      expect(exported).toHaveProperty('exportedAt');
      expect(exported).toHaveProperty('metrics');
      expect(exported.metrics).toHaveProperty('renders');
      expect(exported.metrics).toHaveProperty('apiCalls');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const exported = monitor.exportMetrics();
      const after = Date.now();

      const exportTime = new Date(exported.exportedAt).getTime();
      expect(exportTime).toBeGreaterThanOrEqual(before);
      expect(exportTime).toBeLessThanOrEqual(after);
    });
  });

  describe('clear', () => {
    it('should remove all tracked metrics', () => {
      monitor.trackRenderTime('Component', 20);
      monitor.trackAPICall('/api/test', 'GET', 100, 200);

      monitor.clear();

      const metrics = monitor.getMetrics();
      expect(metrics.measurements.length).toBe(0);
      expect(metrics.renders.length).toBe(0);
      expect(metrics.apiCalls.length).toBe(0);
      expect(metrics.memorySnapshots.length).toBe(0);
    });
  });

  describe('enable/disable', () => {
    it('should enable monitoring', () => {
      const disabled = new PerformanceMonitor({ enabled: false });
      expect(disabled.isEnabled()).toBe(false);

      disabled.enable();
      expect(disabled.isEnabled()).toBe(true);
    });

    it('should disable monitoring', () => {
      monitor.disable();
      expect(monitor.isEnabled()).toBe(false);
    });

    it('should not track when disabled', () => {
      monitor.disable();
      monitor.trackRenderTime('Component', 20);

      const metrics = monitor.getMetrics();
      expect(metrics.renders.length).toBe(0);
    });

    it('should resume tracking when re-enabled', () => {
      monitor.disable();
      monitor.trackRenderTime('Component1', 20);

      monitor.enable();
      monitor.trackRenderTime('Component2', 25);

      const metrics = monitor.getMetrics();
      expect(metrics.renders.length).toBe(1);
      expect(metrics.renders[0].component).toBe('Component2');
    });
  });

  describe('zero performance impact when disabled', () => {
    it('should have minimal overhead when disabled', () => {
      const disabled = new PerformanceMonitor({ enabled: false });

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        disabled.trackRenderTime('Component', 20);
      }
      const duration = performance.now() - start;

      // Should complete very quickly (< 10ms) when disabled
      expect(duration).toBeLessThan(10);
    });

    it('should not allocate memory when disabled', () => {
      const disabled = new PerformanceMonitor({ enabled: false });

      disabled.trackRenderTime('Component', 20);
      disabled.trackAPICall('/api/test', 'GET', 100, 200);

      const metrics = disabled.getMetrics();
      expect(metrics.renders.length).toBe(0);
      expect(metrics.apiCalls.length).toBe(0);
    });
  });
});
