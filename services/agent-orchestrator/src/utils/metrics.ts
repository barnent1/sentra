import { register, Histogram, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import express from 'express';
import { config } from './config';
import { logger } from './logger';

class MetricsCollectorClass {
  private metricsServer: any = null;

  // Agent orchestration metrics
  private agentOperationDuration = new Histogram({
    name: 'agent_operation_duration_seconds',
    help: 'Duration of agent operations in seconds',
    labelNames: ['operation', 'agent_type', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  });

  private activeAgents = new Gauge({
    name: 'active_agents_total',
    help: 'Total number of active agents',
    labelNames: ['agent_type', 'status'],
  });

  private taskQueue = new Gauge({
    name: 'task_queue_length',
    help: 'Number of tasks in queue by priority',
    labelNames: ['priority'],
  });

  private taskProcessingDuration = new Histogram({
    name: 'task_processing_duration_seconds',
    help: 'Duration of task processing',
    labelNames: ['task_type', 'agent_type', 'status'],
    buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
  });

  private containerOperations = new Counter({
    name: 'container_operations_total',
    help: 'Total number of container operations',
    labelNames: ['operation', 'status'],
  });

  private dockerResourceUsage = new Gauge({
    name: 'docker_resource_usage',
    help: 'Docker container resource usage',
    labelNames: ['container_id', 'agent_type', 'resource_type'],
  });

  private agentStartupTime = new Histogram({
    name: 'agent_startup_duration_seconds',
    help: 'Time taken for agent startup',
    labelNames: ['agent_type'],
    buckets: [1, 5, 10, 20, 30, 60, 120],
  });

  private contextInjectionRequests = new Counter({
    name: 'context_injection_requests_total',
    help: 'Total number of context injection requests',
    labelNames: ['agent_type', 'status'],
  });

  private qualityGateChecks = new Counter({
    name: 'quality_gate_checks_total',
    help: 'Total number of quality gate checks',
    labelNames: ['check_type', 'result'],
  });

  private documentationCacheHits = new Counter({
    name: 'documentation_cache_hits_total',
    help: 'Total number of documentation cache hits',
    labelNames: ['source'],
  });

  private documentationCacheMisses = new Counter({
    name: 'documentation_cache_misses_total',
    help: 'Total number of documentation cache misses',
    labelNames: ['source'],
  });

  initialize(): void {
    if (!config.monitoring.enableMetrics) {
      logger.info('Metrics collection disabled');
      return;
    }

    // Collect default Node.js metrics
    collectDefaultMetrics({
      register,
      prefix: 'orchestrator_',
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

  // Agent metrics
  recordAgentOperation(operation: string, agentType: string, duration: number, status: 'success' | 'error'): void {
    this.agentOperationDuration
      .labels({ operation, agent_type: agentType, status })
      .observe(duration / 1000);
  }

  updateActiveAgents(agentType: string, status: string, count: number): void {
    this.activeAgents.labels({ agent_type: agentType, status }).set(count);
  }

  updateTaskQueue(priority: string, count: number): void {
    this.taskQueue.labels({ priority }).set(count);
  }

  recordTaskProcessing(taskType: string, agentType: string, duration: number, status: 'success' | 'error' | 'timeout'): void {
    this.taskProcessingDuration
      .labels({ task_type: taskType, agent_type: agentType, status })
      .observe(duration / 1000);
  }

  recordContainerOperation(operation: 'start' | 'stop' | 'create' | 'destroy', status: 'success' | 'error'): void {
    this.containerOperations.labels({ operation, status }).inc();
  }

  updateDockerResourceUsage(containerId: string, agentType: string, resourceType: 'cpu' | 'memory', value: number): void {
    this.dockerResourceUsage.labels({ container_id: containerId, agent_type: agentType, resource_type: resourceType }).set(value);
  }

  recordAgentStartup(agentType: string, duration: number): void {
    this.agentStartupTime.labels({ agent_type: agentType }).observe(duration / 1000);
  }

  recordContextInjectionRequest(agentType: string, status: 'success' | 'error'): void {
    this.contextInjectionRequests.labels({ agent_type: agentType, status }).inc();
  }

  recordQualityGateCheck(checkType: string, result: 'pass' | 'fail'): void {
    this.qualityGateChecks.labels({ check_type: checkType, result }).inc();
  }

  recordDocumentationCacheHit(source: string): void {
    this.documentationCacheHits.labels({ source }).inc();
  }

  recordDocumentationCacheMiss(source: string): void {
    this.documentationCacheMisses.labels({ source }).inc();
  }

  // Helper method to time operations
  startTimer() {
    const start = Date.now();
    return {
      end: (operation: string, agentType: string, status: 'success' | 'error' = 'success') => {
        const duration = Date.now() - start;
        this.recordAgentOperation(operation, agentType, duration, status);
        return duration;
      },
    };
  }

  // Get current metrics summary
  async getMetricsSummary(): Promise<any> {
    try {
      const metrics = await register.getMetricsAsJSON();
      return {
        agentOperations: metrics.find(m => m.name === 'agent_operation_duration_seconds'),
        activeAgents: metrics.find(m => m.name === 'active_agents_total'),
        taskQueue: metrics.find(m => m.name === 'task_queue_length'),
        containerOperations: metrics.find(m => m.name === 'container_operations_total'),
        qualityGateChecks: metrics.find(m => m.name === 'quality_gate_checks_total'),
      };
    } catch (error) {
      logger.error('Error getting metrics summary:', error);
      return null;
    }
  }
}

export const MetricsCollector = new MetricsCollectorClass();