/**
 * Performance Monitor Component
 *
 * Visual dashboard showing performance metrics in development mode.
 * Hidden in production. Toggle with Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux).
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor, SlowOperation } from '@/services/performance';

interface PerformanceStats {
  fps: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  memoryPercentage: number;
  slowOperations: SlowOperation[];
}

export function PerformanceMonitorComponent() {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    memoryUsedMB: 0,
    memoryTotalMB: 0,
    memoryPercentage: 0,
    slowOperations: [],
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Update stats every second
  useEffect(() => {
    const updateStats = () => {
      const monitor = PerformanceMonitor.getInstance();

      if (!monitor.isEnabled()) return;

      const fps = monitor.getFPS();
      const metrics = monitor.getMetrics();
      const slowOps = monitor.getSlowOperations(10);

      // Get latest memory snapshot
      const latestMemory =
        metrics.memorySnapshots.length > 0
          ? metrics.memorySnapshots[metrics.memorySnapshots.length - 1]
          : null;

      setStats({
        fps,
        memoryUsedMB: latestMemory?.usedHeapMB ?? 0,
        memoryTotalMB: latestMemory?.totalHeapMB ?? 0,
        memoryPercentage: latestMemory
          ? (latestMemory.usedHeapMB / latestMemory.totalHeapMB) * 100
          : 0,
        slowOperations: slowOps,
      });
    };

    // Update immediately
    updateStats();

    // Then update every second
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track memory every 5 seconds
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();

    const trackMemory = () => {
      if (monitor.isEnabled()) {
        monitor.trackMemory();
      }
    };

    trackMemory();
    const interval = setInterval(trackMemory, 5000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd+Shift+P or Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'p' &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        setExpanded(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = useCallback(() => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.clear();
    setStats({
      fps: 0,
      memoryUsedMB: 0,
      memoryTotalMB: 0,
      memoryPercentage: 0,
      slowOperations: [],
    });
  }, []);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // FPS color coding
  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Memory color coding
  const getMemoryColor = (percentage: number): string => {
    if (percentage < 70) return 'text-green-400';
    if (percentage < 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Hide in production
  if (isProduction) {
    return null;
  }

  return (
    <div
      data-testid="performance-monitor"
      role="complementary"
      aria-label="performance monitor"
      className={`
        fixed bottom-4 right-4 z-50
        bg-zinc-900 bg-opacity-95
        border border-zinc-700
        rounded-lg shadow-xl
        transition-all duration-300
        ${expanded ? 'w-96 expanded' : 'w-32 collapsed'}
      `}
    >
      {/* Header - Always visible */}
      <div
        className="p-3 cursor-pointer hover:bg-zinc-800 rounded-t-lg"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            {expanded ? 'Performance' : 'Perf'}
          </span>
          <div
            data-testid="fps-value"
            className={`text-sm font-bold font-mono ${getFPSColor(stats.fps)}`}
          >
            {Math.round(stats.fps)} FPS
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Memory Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">Memory</span>
              <div
                data-testid="memory-value"
                className={`text-sm font-bold font-mono ${getMemoryColor(
                  stats.memoryPercentage
                )}`}
              >
                {stats.memoryUsedMB.toFixed(0)} MB
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>{stats.memoryPercentage.toFixed(0)}%</span>
              <span>{stats.memoryTotalMB.toFixed(0)} MB total</span>
            </div>
          </div>

          {/* Slow Operations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">
                Slow Operations
              </span>
              <button
                onClick={handleClear}
                className="text-xs text-violet-400 hover:text-violet-300 font-mono"
              >
                Clear
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {stats.slowOperations.length === 0 ? (
                <div className="text-xs text-zinc-500 font-mono py-2">
                  No slow operations
                </div>
              ) : (
                stats.slowOperations.map((op, index) => (
                  <div
                    key={`${op.name}-${index}`}
                    data-testid={`slow-operation-${index}`}
                    className="text-xs font-mono bg-zinc-800 rounded p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300 truncate flex-1">
                        {op.name}
                      </span>
                      <span className="text-red-400 ml-2">
                        {op.duration.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="text-zinc-500 text-[10px] mt-1">
                      {op.type} · {op.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="text-[10px] text-zinc-600 font-mono text-center pt-2 border-t border-zinc-800">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+P to
            toggle
          </div>
        </div>
      )}
    </div>
  );
}
