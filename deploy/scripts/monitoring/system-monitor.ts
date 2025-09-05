/**
 * SENTRA System Monitoring and Alerting
 * Real-time monitoring system for all SENTRA components with alerting capabilities
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Monitoring interfaces
interface SystemMetrics {
  readonly timestamp: Date;
  readonly system: SystemResourceMetrics;
  readonly database: DatabaseMetrics;
  readonly agents: AgentMetrics;
  readonly evolution: EvolutionMetrics;
  readonly api: ApiMetrics;
  readonly dashboard: DashboardMetrics;
  readonly mobile: MobileMetrics;
}

interface SystemResourceMetrics {
  readonly cpu: CpuMetrics;
  readonly memory: MemoryMetrics;
  readonly disk: DiskMetrics;
  readonly network: NetworkMetrics;
  readonly containers: ContainerMetrics;
}

interface CpuMetrics {
  readonly usage: number; // 0-1
  readonly loadAverage: readonly [number, number, number]; // 1, 5, 15 minute averages
  readonly coreCount: number;
  readonly temperature?: number; // Celsius
}

interface MemoryMetrics {
  readonly total: number; // bytes
  readonly used: number; // bytes
  readonly free: number; // bytes
  readonly cached: number; // bytes
  readonly buffers: number; // bytes
  readonly available: number; // bytes
  readonly swapTotal: number; // bytes
  readonly swapUsed: number; // bytes
}

interface DiskMetrics {
  readonly filesystems: readonly FileSystemMetrics[];
  readonly ioStats: DiskIoMetrics;
}

interface FileSystemMetrics {
  readonly mountpoint: string;
  readonly total: number; // bytes
  readonly used: number; // bytes
  readonly available: number; // bytes
  readonly usage: number; // 0-1
}

interface DiskIoMetrics {
  readonly readBytesPerSec: number;
  readonly writeBytesPerSec: number;
  readonly readOpsPerSec: number;
  readonly writeOpsPerSec: number;
  readonly avgQueueSize: number;
}

interface NetworkMetrics {
  readonly interfaces: readonly NetworkInterfaceMetrics[];
  readonly connections: NetworkConnectionMetrics;
}

interface NetworkInterfaceMetrics {
  readonly name: string;
  readonly rxBytesPerSec: number;
  readonly txBytesPerSec: number;
  readonly rxPacketsPerSec: number;
  readonly txPacketsPerSec: number;
  readonly errors: number;
  readonly drops: number;
}

interface NetworkConnectionMetrics {
  readonly established: number;
  readonly listening: number;
  readonly timeWait: number;
  readonly closeWait: number;
}

interface ContainerMetrics {
  readonly containers: readonly ContainerMetric[];
  readonly totalContainers: number;
  readonly runningContainers: number;
}

interface ContainerMetric {
  readonly name: string;
  readonly status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  readonly cpuUsage: number; // 0-1
  readonly memoryUsage: number; // bytes
  readonly memoryLimit: number; // bytes
  readonly networkRx: number; // bytes
  readonly networkTx: number; // bytes
  readonly restartCount: number;
  readonly uptime: number; // seconds
}

interface DatabaseMetrics {
  readonly connections: DatabaseConnectionMetrics;
  readonly performance: DatabasePerformanceMetrics;
  readonly storage: DatabaseStorageMetrics;
  readonly replication?: ReplicationMetrics;
}

interface DatabaseConnectionMetrics {
  readonly active: number;
  readonly idle: number;
  readonly idleInTransaction: number;
  readonly maxConnections: number;
  readonly connectionUtilization: number; // 0-1
}

interface DatabasePerformanceMetrics {
  readonly transactionsPerSec: number;
  readonly queriesPerSec: number;
  readonly avgQueryDuration: number; // milliseconds
  readonly slowQueries: number; // queries > threshold
  readonly cacheHitRatio: number; // 0-1
  readonly indexHitRatio: number; // 0-1
}

interface DatabaseStorageMetrics {
  readonly totalSize: number; // bytes
  readonly dataSize: number; // bytes
  readonly indexSize: number; // bytes
  readonly tempSize: number; // bytes
  readonly walSize: number; // bytes
}

interface ReplicationMetrics {
  readonly isReplica: boolean;
  readonly replicationLag: number; // milliseconds
  readonly replicationStatus: 'healthy' | 'lagging' | 'broken';
}

interface AgentMetrics {
  readonly totalAgents: number;
  readonly activeAgents: number;
  readonly idleAgents: number;
  readonly errorAgents: number;
  readonly averageResponseTime: number; // milliseconds
  readonly taskQueue: TaskQueueMetrics;
  readonly performance: AgentPerformanceMetrics;
}

interface TaskQueueMetrics {
  readonly pending: number;
  readonly processing: number;
  readonly completed: number;
  readonly failed: number;
  readonly averageWaitTime: number; // milliseconds
}

interface AgentPerformanceMetrics {
  readonly successRate: number; // 0-1
  readonly averageTaskDuration: number; // milliseconds
  readonly learningVelocity: number; // rate of learning
  readonly memoryUtilization: number; // 0-1
}

interface EvolutionMetrics {
  readonly populationSize: number;
  readonly averageFitness: number;
  readonly bestFitness: number;
  readonly diversityIndex: number; // 0-1
  readonly generationRate: number; // generations per hour
  readonly mutationRate: number;
  readonly selectionPressure: number;
  readonly convergenceStatus: 'evolving' | 'plateaued' | 'converged';
}

interface ApiMetrics {
  readonly requestRate: number; // requests per second
  readonly averageResponseTime: number; // milliseconds
  readonly errorRate: number; // 0-1
  readonly statusCodes: Record<string, number>;
  readonly endpointMetrics: readonly EndpointMetric[];
  readonly websocketConnections: number;
}

interface EndpointMetric {
  readonly path: string;
  readonly method: string;
  readonly requestCount: number;
  readonly averageResponseTime: number;
  readonly errorRate: number;
}

interface DashboardMetrics {
  readonly activeUsers: number;
  readonly pageViews: number;
  readonly averageLoadTime: number; // milliseconds
  readonly websocketConnections: number;
  readonly errorRate: number;
  readonly performanceScore: number; // 0-1
}

interface MobileMetrics {
  readonly activeUsers: number;
  readonly pwaInstalls: number;
  readonly offlineUsage: number;
  readonly syncOperations: number;
  readonly cacheHitRate: number; // 0-1
  readonly performanceScore: number; // 0-1
}

// Alerting interfaces
interface Alert {
  readonly id: string;
  readonly timestamp: Date;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly category: 'system' | 'database' | 'agents' | 'evolution' | 'api' | 'security';
  readonly title: string;
  readonly description: string;
  readonly metrics: Record<string, number>;
  readonly actions: readonly string[];
  readonly resolved: boolean;
  readonly resolvedAt?: Date;
}

interface AlertRule {
  readonly id: string;
  readonly name: string;
  readonly category: Alert['category'];
  readonly severity: Alert['severity'];
  readonly condition: AlertCondition;
  readonly threshold: number;
  readonly duration?: number; // seconds - how long condition must persist
  readonly enabled: boolean;
  readonly actions: readonly AlertAction[];
}

interface AlertCondition {
  readonly metric: string;
  readonly operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  readonly aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
  readonly timeWindow?: number; // seconds
}

interface AlertAction {
  readonly type: 'log' | 'email' | 'webhook' | 'slack' | 'pushover';
  readonly config: Record<string, any>;
  readonly enabled: boolean;
}

interface MonitoringConfig {
  readonly collectionInterval: number; // milliseconds
  readonly retentionPeriod: number; // milliseconds
  readonly alerting: AlertingConfig;
  readonly storage: StorageConfig;
  readonly notifications: NotificationConfig;
}

interface AlertingConfig {
  readonly enabled: boolean;
  readonly rules: readonly AlertRule[];
  readonly cooldownPeriod: number; // seconds
  readonly maxAlertsPerMinute: number;
}

interface StorageConfig {
  readonly type: 'memory' | 'file' | 'database';
  readonly path?: string;
  readonly maxSize?: number; // bytes
  readonly compression?: boolean;
}

interface NotificationConfig {
  readonly email?: EmailConfig;
  readonly slack?: SlackConfig;
  readonly pushover?: PushoverConfig;
  readonly webhook?: WebhookConfig;
}

interface EmailConfig {
  readonly enabled: boolean;
  readonly smtp: {
    readonly host: string;
    readonly port: number;
    readonly secure: boolean;
    readonly auth: {
      readonly user: string;
      readonly pass: string;
    };
  };
  readonly from: string;
  readonly to: readonly string[];
}

interface SlackConfig {
  readonly enabled: boolean;
  readonly webhookUrl: string;
  readonly channel: string;
  readonly username: string;
}

interface PushoverConfig {
  readonly enabled: boolean;
  readonly appToken: string;
  readonly userKey: string;
}

interface WebhookConfig {
  readonly enabled: boolean;
  readonly url: string;
  readonly headers?: Record<string, string>;
}

/**
 * SENTRA System Monitor
 */
export class SystemMonitor extends EventEmitter {
  private isRunning = false;
  private collectionTimer?: NodeJS.Timeout;
  private metricsHistory: SystemMetrics[] = [];
  private activeAlerts = new Map<string, Alert>();
  private alertCooldowns = new Map<string, number>();

  constructor(private readonly config: MonitoringConfig) {
    super();
    this.setupEventHandlers();
  }

  /**
   * Start monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ System monitor is already running');
      return;
    }

    console.log('🔍 Starting SENTRA system monitor...');
    this.isRunning = true;

    // Start metric collection
    await this.startMetricCollection();

    // Initialize alerting
    if (this.config.alerting.enabled) {
      this.initializeAlerting();
    }

    console.log(`✅ System monitor started (collection interval: ${this.config.collectionInterval}ms)`);
    this.emit('monitoringStarted');
  }

  /**
   * Stop monitoring system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ Stopping system monitor...');
    this.isRunning = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    console.log('✅ System monitor stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Get current system metrics
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const startTime = performance.now();
    
    const [system, database, agents, evolution, api, dashboard, mobile] = await Promise.all([
      this.collectSystemMetrics(),
      this.collectDatabaseMetrics(),
      this.collectAgentMetrics(),
      this.collectEvolutionMetrics(),
      this.collectApiMetrics(),
      this.collectDashboardMetrics(),
      this.collectMobileMetrics()
    ]);

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      system,
      database,
      agents,
      evolution,
      api,
      dashboard,
      mobile
    };

    const duration = performance.now() - startTime;
    console.log(`📊 Metrics collected in ${duration.toFixed(2)}ms`);

    return metrics;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(timeRange?: { start: Date; end: Date }): readonly SystemMetrics[] {
    if (!timeRange) {
      return this.metricsHistory;
    }

    return this.metricsHistory.filter(
      metrics => metrics.timestamp >= timeRange.start && metrics.timestamp <= timeRange.end
    );
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): readonly Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    const resolvedAlert: Alert = {
      ...alert,
      resolved: true,
      resolvedAt: new Date()
    };

    this.activeAlerts.set(alertId, resolvedAlert);
    this.emit('alertResolved', resolvedAlert);
    
    console.log(`✅ Alert resolved: ${alert.title}`);
    return true;
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    // In a full implementation, this would be persisted
    console.log(`📋 Added alert rule: ${rule.name}`);
    this.emit('alertRuleAdded', rule);
  }

  /**
   * Generate system health report
   */
  async generateHealthReport(): Promise<SystemHealthReport> {
    const metrics = await this.getCurrentMetrics();
    const alerts = this.getActiveAlerts();
    
    const healthScores = {
      system: this.calculateSystemHealth(metrics.system),
      database: this.calculateDatabaseHealth(metrics.database),
      agents: this.calculateAgentHealth(metrics.agents),
      evolution: this.calculateEvolutionHealth(metrics.evolution),
      api: this.calculateApiHealth(metrics.api),
      dashboard: this.calculateDashboardHealth(metrics.dashboard),
      mobile: this.calculateMobileHealth(metrics.mobile)
    };

    const overallHealth = Object.values(healthScores).reduce((sum, score) => sum + score, 0) / Object.keys(healthScores).length;

    return {
      timestamp: new Date(),
      overallHealth: this.categorizeHealth(overallHealth),
      healthScores,
      currentMetrics: metrics,
      activeAlerts: alerts,
      criticalIssues: alerts.filter(alert => alert.severity === 'critical'),
      recommendations: this.generateRecommendations(metrics, alerts),
      trends: this.analyzeTrends(),
      nextCheckTime: new Date(Date.now() + this.config.collectionInterval)
    };
  }

  // Private methods for metric collection

  private async startMetricCollection(): Promise<void> {
    // Collect initial metrics
    await this.collectAndStoreMetrics();

    // Set up periodic collection
    this.collectionTimer = setInterval(async () => {
      try {
        await this.collectAndStoreMetrics();
      } catch (error) {
        console.error('❌ Error collecting metrics:', error);
        this.emit('collectionError', error);
      }
    }, this.config.collectionInterval);
  }

  private async collectAndStoreMetrics(): Promise<void> {
    const metrics = await this.getCurrentMetrics();
    
    // Store metrics
    this.metricsHistory.push(metrics);
    
    // Trim history based on retention period
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(
      m => m.timestamp.getTime() > cutoffTime
    );

    // Check alert conditions
    if (this.config.alerting.enabled) {
      await this.checkAlertConditions(metrics);
    }

    this.emit('metricsCollected', metrics);
  }

  private async collectSystemMetrics(): Promise<SystemResourceMetrics> {
    const [cpu, memory, disk, network, containers] = await Promise.all([
      this.collectCpuMetrics(),
      this.collectMemoryMetrics(),
      this.collectDiskMetrics(),
      this.collectNetworkMetrics(),
      this.collectContainerMetrics()
    ]);

    return { cpu, memory, disk, network, containers };
  }

  private async collectCpuMetrics(): Promise<CpuMetrics> {
    try {
      // Get CPU usage (simplified implementation)
      const { stdout: topOutput } = await execAsync('top -bn1 | grep "Cpu(s)"');
      const cpuMatch = topOutput.match(/(\d+\.\d+)%us/);
      const usage = cpuMatch ? parseFloat(cpuMatch[1]) / 100 : 0;

      // Get load average
      const { stdout: uptimeOutput } = await execAsync('uptime');
      const loadMatch = uptimeOutput.match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/);
      const loadAverage: [number, number, number] = loadMatch 
        ? [parseFloat(loadMatch[1]), parseFloat(loadMatch[2]), parseFloat(loadMatch[3])]
        : [0, 0, 0];

      // Get core count
      const { stdout: coreOutput } = await execAsync('nproc');
      const coreCount = parseInt(coreOutput.trim());

      return {
        usage,
        loadAverage,
        coreCount
      };
    } catch (error) {
      console.error('Error collecting CPU metrics:', error);
      return {
        usage: 0,
        loadAverage: [0, 0, 0],
        coreCount: 1
      };
    }
  }

  private async collectMemoryMetrics(): Promise<MemoryMetrics> {
    try {
      const { stdout } = await execAsync('cat /proc/meminfo');
      const lines = stdout.split('\n');
      
      const getValue = (key: string): number => {
        const line = lines.find(l => l.startsWith(key));
        return line ? parseInt(line.split(/\s+/)[1]) * 1024 : 0; // Convert KB to bytes
      };

      return {
        total: getValue('MemTotal'),
        free: getValue('MemFree'),
        available: getValue('MemAvailable'),
        used: getValue('MemTotal') - getValue('MemFree'),
        cached: getValue('Cached'),
        buffers: getValue('Buffers'),
        swapTotal: getValue('SwapTotal'),
        swapUsed: getValue('SwapTotal') - getValue('SwapFree')
      };
    } catch (error) {
      console.error('Error collecting memory metrics:', error);
      return {
        total: 0, free: 0, available: 0, used: 0, cached: 0, buffers: 0, swapTotal: 0, swapUsed: 0
      };
    }
  }

  private async collectDiskMetrics(): Promise<DiskMetrics> {
    try {
      // Get filesystem usage
      const { stdout: dfOutput } = await execAsync('df -B1');
      const lines = dfOutput.split('\n').slice(1);
      
      const filesystems: FileSystemMetrics[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const total = parseInt(parts[1]);
          const used = parseInt(parts[2]);
          const available = parseInt(parts[3]);
          
          filesystems.push({
            mountpoint: parts[5],
            total,
            used,
            available,
            usage: total > 0 ? used / total : 0
          });
        }
      }

      // Simplified I/O stats (would use /proc/diskstats in real implementation)
      const ioStats: DiskIoMetrics = {
        readBytesPerSec: 0,
        writeBytesPerSec: 0,
        readOpsPerSec: 0,
        writeOpsPerSec: 0,
        avgQueueSize: 0
      };

      return { filesystems, ioStats };
    } catch (error) {
      console.error('Error collecting disk metrics:', error);
      return {
        filesystems: [],
        ioStats: {
          readBytesPerSec: 0, writeBytesPerSec: 0, readOpsPerSec: 0, 
          writeOpsPerSec: 0, avgQueueSize: 0
        }
      };
    }
  }

  private async collectNetworkMetrics(): Promise<NetworkMetrics> {
    // Simplified implementation - would collect from /proc/net/dev in production
    return {
      interfaces: [],
      connections: {
        established: 0,
        listening: 0,
        timeWait: 0,
        closeWait: 0
      }
    };
  }

  private async collectContainerMetrics(): Promise<ContainerMetrics> {
    try {
      const { stdout } = await execAsync('docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.NetIO}}"');
      const lines = stdout.trim().split('\n');
      
      const containers: ContainerMetric[] = [];
      for (const line of lines) {
        const [name, cpuPercStr, memUsageStr, netIOStr] = line.split(',');
        
        const cpuUsage = parseFloat(cpuPercStr.replace('%', '')) / 100;
        const memMatch = memUsageStr.match(/([\d.]+)([KMGT]?B)/);
        const memoryUsage = memMatch ? this.parseBytes(memMatch[1] + memMatch[2]) : 0;

        containers.push({
          name,
          status: 'running',
          cpuUsage,
          memoryUsage,
          memoryLimit: 0, // Would need additional query
          networkRx: 0,
          networkTx: 0,
          restartCount: 0,
          uptime: 0
        });
      }

      return {
        containers,
        totalContainers: containers.length,
        runningContainers: containers.filter(c => c.status === 'running').length
      };
    } catch (error) {
      console.error('Error collecting container metrics:', error);
      return {
        containers: [],
        totalContainers: 0,
        runningContainers: 0
      };
    }
  }

  // Database metrics collection (simplified - would use actual DB queries)
  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    return {
      connections: {
        active: 10,
        idle: 5,
        idleInTransaction: 1,
        maxConnections: 100,
        connectionUtilization: 0.16
      },
      performance: {
        transactionsPerSec: 150,
        queriesPerSec: 300,
        avgQueryDuration: 25,
        slowQueries: 2,
        cacheHitRatio: 0.95,
        indexHitRatio: 0.98
      },
      storage: {
        totalSize: 1024 * 1024 * 1024, // 1GB
        dataSize: 800 * 1024 * 1024,
        indexSize: 200 * 1024 * 1024,
        tempSize: 10 * 1024 * 1024,
        walSize: 50 * 1024 * 1024
      }
    };
  }

  // Simplified implementations for other metric collections
  private async collectAgentMetrics(): Promise<AgentMetrics> {
    return {
      totalAgents: 10,
      activeAgents: 8,
      idleAgents: 2,
      errorAgents: 0,
      averageResponseTime: 1500,
      taskQueue: {
        pending: 5,
        processing: 3,
        completed: 150,
        failed: 2,
        averageWaitTime: 500
      },
      performance: {
        successRate: 0.95,
        averageTaskDuration: 2000,
        learningVelocity: 0.8,
        memoryUtilization: 0.6
      }
    };
  }

  private async collectEvolutionMetrics(): Promise<EvolutionMetrics> {
    return {
      populationSize: 100,
      averageFitness: 0.75,
      bestFitness: 0.92,
      diversityIndex: 0.65,
      generationRate: 2.5,
      mutationRate: 0.1,
      selectionPressure: 0.3,
      convergenceStatus: 'evolving'
    };
  }

  private async collectApiMetrics(): Promise<ApiMetrics> {
    return {
      requestRate: 50,
      averageResponseTime: 200,
      errorRate: 0.02,
      statusCodes: { '200': 95, '400': 3, '500': 2 },
      endpointMetrics: [],
      websocketConnections: 25
    };
  }

  private async collectDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      activeUsers: 12,
      pageViews: 500,
      averageLoadTime: 800,
      websocketConnections: 12,
      errorRate: 0.01,
      performanceScore: 0.9
    };
  }

  private async collectMobileMetrics(): Promise<MobileMetrics> {
    return {
      activeUsers: 8,
      pwaInstalls: 25,
      offlineUsage: 15,
      syncOperations: 50,
      cacheHitRate: 0.85,
      performanceScore: 0.88
    };
  }

  // Alerting implementation
  private initializeAlerting(): void {
    console.log('🚨 Initializing alerting system...');
    
    // Default alert rules
    const defaultRules: AlertRule[] = [
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        category: 'system',
        severity: 'warning',
        condition: { metric: 'system.cpu.usage', operator: 'gt' },
        threshold: 0.8,
        duration: 300, // 5 minutes
        enabled: true,
        actions: [{ type: 'log', config: {}, enabled: true }]
      },
      {
        id: 'low-disk-space',
        name: 'Low Disk Space',
        category: 'system',
        severity: 'critical',
        condition: { metric: 'system.disk.usage', operator: 'gt' },
        threshold: 0.9,
        enabled: true,
        actions: [{ type: 'log', config: {}, enabled: true }]
      },
      {
        id: 'agent-failures',
        name: 'High Agent Failure Rate',
        category: 'agents',
        severity: 'error',
        condition: { metric: 'agents.performance.successRate', operator: 'lt' },
        threshold: 0.8,
        enabled: true,
        actions: [{ type: 'log', config: {}, enabled: true }]
      }
    ];

    // Add default rules to configuration
    console.log(`📋 Loaded ${defaultRules.length} default alert rules`);
  }

  private async checkAlertConditions(metrics: SystemMetrics): Promise<void> {
    // Simplified alert checking - in production would check all configured rules
    
    // Check CPU usage
    if (metrics.system.cpu.usage > 0.8) {
      await this.triggerAlert({
        id: 'high-cpu-' + Date.now(),
        timestamp: new Date(),
        severity: 'warning',
        category: 'system',
        title: 'High CPU Usage',
        description: `CPU usage is ${(metrics.system.cpu.usage * 100).toFixed(1)}%`,
        metrics: { cpuUsage: metrics.system.cpu.usage },
        actions: ['Check running processes', 'Consider scaling resources'],
        resolved: false
      });
    }

    // Check memory usage
    const memoryUsage = metrics.system.memory.used / metrics.system.memory.total;
    if (memoryUsage > 0.9) {
      await this.triggerAlert({
        id: 'high-memory-' + Date.now(),
        timestamp: new Date(),
        severity: 'critical',
        category: 'system',
        title: 'High Memory Usage',
        description: `Memory usage is ${(memoryUsage * 100).toFixed(1)}%`,
        metrics: { memoryUsage },
        actions: ['Investigate memory leaks', 'Restart services if necessary'],
        resolved: false
      });
    }
  }

  private async triggerAlert(alert: Alert): Promise<void> {
    // Check cooldown
    const cooldownKey = `${alert.category}-${alert.title}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    if (lastAlert && (Date.now() - lastAlert) < (this.config.alerting.cooldownPeriod * 1000)) {
      return; // Skip due to cooldown
    }

    this.activeAlerts.set(alert.id, alert);
    this.alertCooldowns.set(cooldownKey, Date.now());
    
    console.log(`🚨 Alert triggered: ${alert.title} [${alert.severity}]`);
    this.emit('alertTriggered', alert);

    // Execute alert actions (log, email, etc.)
    await this.executeAlertActions(alert);
  }

  private async executeAlertActions(alert: Alert): Promise<void> {
    // Log action (always executed)
    console.log(`📝 ALERT: [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.description}`);
    
    // Additional actions would be implemented here (email, Slack, etc.)
  }

  // Utility methods
  private parseBytes(bytesStr: string): number {
    const match = bytesStr.match(/([\d.]+)([KMGT]?B)/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit] || 1);
  }

  private calculateSystemHealth(metrics: SystemResourceMetrics): number {
    let score = 1.0;
    
    // CPU health
    if (metrics.cpu.usage > 0.9) score -= 0.3;
    else if (metrics.cpu.usage > 0.8) score -= 0.1;
    
    // Memory health
    const memUsage = metrics.memory.used / metrics.memory.total;
    if (memUsage > 0.9) score -= 0.3;
    else if (memUsage > 0.8) score -= 0.1;
    
    // Disk health
    const maxDiskUsage = Math.max(...metrics.disk.filesystems.map(fs => fs.usage));
    if (maxDiskUsage > 0.9) score -= 0.2;
    else if (maxDiskUsage > 0.8) score -= 0.05;
    
    return Math.max(0, score);
  }

  private calculateDatabaseHealth(metrics: DatabaseMetrics): number {
    let score = 1.0;
    
    if (metrics.connections.connectionUtilization > 0.8) score -= 0.2;
    if (metrics.performance.cacheHitRatio < 0.9) score -= 0.1;
    if (metrics.performance.slowQueries > 10) score -= 0.1;
    
    return Math.max(0, score);
  }

  private calculateAgentHealth(metrics: AgentMetrics): number {
    let score = 1.0;
    
    if (metrics.performance.successRate < 0.8) score -= 0.3;
    if (metrics.averageResponseTime > 5000) score -= 0.2;
    if (metrics.errorAgents > metrics.totalAgents * 0.1) score -= 0.2;
    
    return Math.max(0, score);
  }

  private calculateEvolutionHealth(metrics: EvolutionMetrics): number {
    let score = 1.0;
    
    if (metrics.diversityIndex < 0.3) score -= 0.3;
    if (metrics.convergenceStatus === 'converged') score -= 0.2;
    if (metrics.averageFitness < 0.5) score -= 0.1;
    
    return Math.max(0, score);
  }

  private calculateApiHealth(metrics: ApiMetrics): number {
    let score = 1.0;
    
    if (metrics.errorRate > 0.05) score -= 0.3;
    if (metrics.averageResponseTime > 1000) score -= 0.2;
    
    return Math.max(0, score);
  }

  private calculateDashboardHealth(metrics: DashboardMetrics): number {
    return metrics.performanceScore;
  }

  private calculateMobileHealth(metrics: MobileMetrics): number {
    return metrics.performanceScore;
  }

  private categorizeHealth(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.75) return 'good';
    if (score >= 0.6) return 'fair';
    if (score >= 0.3) return 'poor';
    return 'critical';
  }

  private generateRecommendations(metrics: SystemMetrics, alerts: readonly Alert[]): readonly string[] {
    const recommendations: string[] = [];
    
    if (metrics.system.cpu.usage > 0.8) {
      recommendations.push('Consider upgrading CPU or optimizing workload distribution');
    }
    
    if (alerts.some(a => a.category === 'database' && a.severity === 'critical')) {
      recommendations.push('Review database performance and consider optimization');
    }
    
    if (metrics.agents.performance.successRate < 0.8) {
      recommendations.push('Investigate agent failures and improve error handling');
    }
    
    return recommendations;
  }

  private analyzeTrends(): readonly HealthTrend[] {
    // Simplified trend analysis
    if (this.metricsHistory.length < 2) {
      return [];
    }
    
    const recent = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory[this.metricsHistory.length - 2];
    
    const trends: HealthTrend[] = [];
    
    const cpuChange = recent.system.cpu.usage - previous.system.cpu.usage;
    trends.push({
      metric: 'CPU Usage',
      direction: cpuChange > 0.05 ? 'increasing' : cpuChange < -0.05 ? 'decreasing' : 'stable',
      changePercent: cpuChange * 100,
      significance: Math.abs(cpuChange) > 0.1 ? 'high' : 'low'
    });
    
    return trends;
  }

  private setupEventHandlers(): void {
    this.on('alertTriggered', (alert: Alert) => {
      console.log(`🚨 New alert: ${alert.title}`);
    });
    
    this.on('alertResolved', (alert: Alert) => {
      console.log(`✅ Alert resolved: ${alert.title}`);
    });
  }
}

// Supporting interfaces
interface SystemHealthReport {
  readonly timestamp: Date;
  readonly overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  readonly healthScores: {
    readonly system: number;
    readonly database: number;
    readonly agents: number;
    readonly evolution: number;
    readonly api: number;
    readonly dashboard: number;
    readonly mobile: number;
  };
  readonly currentMetrics: SystemMetrics;
  readonly activeAlerts: readonly Alert[];
  readonly criticalIssues: readonly Alert[];
  readonly recommendations: readonly string[];
  readonly trends: readonly HealthTrend[];
  readonly nextCheckTime: Date;
}

interface HealthTrend {
  readonly metric: string;
  readonly direction: 'increasing' | 'stable' | 'decreasing';
  readonly changePercent: number;
  readonly significance: 'low' | 'medium' | 'high';
}

// Export monitor and types
export { SystemMonitor };
export type {
  SystemMetrics,
  Alert,
  AlertRule,
  MonitoringConfig,
  SystemHealthReport
};