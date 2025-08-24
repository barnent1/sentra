import { register, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import express from 'express';
import { config } from './config';
import { logger } from './logger';

class MetricsCollectorClass {
  private metricsServer: any = null;

  // Context Engine metrics
  private contextOperationDuration = new Histogram({
    name: 'context_operation_duration_seconds',
    help: 'Duration of context operations in seconds',
    labelNames: ['operation', 'status'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5, 15, 30],
  });

  private contextCacheHits = new Counter({
    name: 'context_cache_hits_total',
    help: 'Total number of context cache hits',
    labelNames: ['cache_type'],
  });

  private contextCacheMisses = new Counter({
    name: 'context_cache_misses_total',
    help: 'Total number of context cache misses',
    labelNames: ['cache_type'],
  });

  private contextSize = new Histogram({
    name: 'context_size_bytes',
    help: 'Size of context data in bytes',
    labelNames: ['context_type'],
    buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600], // 1KB to 100MB
  });

  private activeContexts = new Gauge({
    name: 'active_contexts_total',
    help: 'Total number of active contexts',
    labelNames: ['context_type', 'storage_tier'],
  });

  private contextCompressionRatio = new Histogram({
    name: 'context_compression_ratio',
    help: 'Compression ratio for context data',
    buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  });

  private contextInjectionDuration = new Histogram({
    name: 'context_injection_duration_seconds',
    help: 'Duration of context injection operations',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  });

  private messageQueueOperations = new Counter({
    name: 'message_queue_operations_total',
    help: 'Total number of message queue operations',
    labelNames: ['operation', 'status'],
  });

  private databaseConnections = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
  });

  initialize(): void {
    if (!config.monitoring.enableMetrics) {
      logger.info('Metrics collection disabled');
      return;
    }

    // Collect default Node.js metrics
    collectDefaultMetrics({
      register,
      prefix: 'context_engine_',
    });

    // Start metrics server
    this.startMetricsServer();

    logger.info('Metrics collection initialized');
  }

  private startMetricsServer(): void {
    const app = express();

    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        logger.error('Error generating metrics:', error);
        res.status(500).end('Error generating metrics');
      }
    });

    this.metricsServer = app.listen(config.monitoring.metricsPort, () => {
      logger.info(`Metrics server running on port ${config.monitoring.metricsPort}`);
    });
  }

  async shutdown(): Promise<void> {
    if (this.metricsServer) {
      this.metricsServer.close();
      logger.info('Metrics server stopped');
    }
  }

  // Context operation metrics
  recordContextOperation(operation: string, duration: number, status: 'success' | 'error'): void {
    this.contextOperationDuration
      .labels({ operation, status })
      .observe(duration / 1000); // Convert to seconds
  }

  recordCacheHit(cacheType: 'hot' | 'warm'): void {
    this.contextCacheHits.labels({ cache_type: cacheType }).inc();
  }

  recordCacheMiss(cacheType: 'hot' | 'warm' | 'cold'): void {
    this.contextCacheMisses.labels({ cache_type: cacheType }).inc();
  }

  recordContextSize(contextType: string, sizeBytes: number): void {
    this.contextSize.labels({ context_type: contextType }).observe(sizeBytes);
  }

  updateActiveContexts(contextType: string, storageTier: 'hot' | 'warm' | 'cold', count: number): void {
    this.activeContexts.labels({ context_type: contextType, storage_tier: storageTier }).set(count);
  }

  recordCompressionRatio(ratio: number): void {
    this.contextCompressionRatio.observe(ratio);
  }

  recordContextInjection(duration: number): void {
    this.contextInjectionDuration.observe(duration / 1000);
  }

  recordMessageQueueOperation(operation: 'publish' | 'consume', status: 'success' | 'error'): void {
    this.messageQueueOperations.labels({ operation, status }).inc();
  }

  updateDatabaseConnections(count: number): void {
    this.databaseConnections.set(count);
  }

  // Helper method to time operations
  startTimer() {
    const start = Date.now();
    return {
      end: (operation: string, status: 'success' | 'error' = 'success') => {
        const duration = Date.now() - start;
        this.recordContextOperation(operation, duration, status);
        return duration;
      },
    };
  }

  // Get current metrics summary
  async getMetricsSummary(): Promise<any> {
    try {
      const metrics = await register.getMetricsAsJSON();
      return {
        contextOperations: metrics.find(m => m.name === 'context_operation_duration_seconds'),
        cacheHits: metrics.find(m => m.name === 'context_cache_hits_total'),
        cacheMisses: metrics.find(m => m.name === 'context_cache_misses_total'),
        activeContexts: metrics.find(m => m.name === 'active_contexts_total'),
        databaseConnections: metrics.find(m => m.name === 'database_connections_active'),
      };
    } catch (error) {
      logger.error('Error getting metrics summary:', error);
      return null;
    }
  }
}

export const MetricsCollector = new MetricsCollectorClass();