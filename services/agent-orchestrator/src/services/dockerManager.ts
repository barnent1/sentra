import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { RedisManager } from '../utils/redis';
import { MessageQueue } from '../utils/messageQueue';
import { MetricsCollector } from '../utils/metrics';

export interface ContainerConfig {
  agentId: string;
  agentType: string;
  imageName: string;
  environment: Record<string, string>;
  resourceLimits: {
    memory: string;
    cpu: string;
  };
  volumes?: string[];
  networks?: string[];
  healthCheck?: {
    test: string[];
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface ContainerInfo {
  containerId: string;
  agentId: string;
  agentType: string;
  status: 'creating' | 'running' | 'stopping' | 'stopped' | 'error';
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  ports: Record<string, number>;
  ipAddress?: string;
  healthStatus: 'starting' | 'healthy' | 'unhealthy' | 'unknown';
  resourceUsage: {
    cpu: number;
    memory: number;
  };
}

export class DockerManager extends EventEmitter {
  private docker: Docker;
  private containers = new Map<string, ContainerInfo>();
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.docker = new Docker({
      socketPath: config.docker.socketPath,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test Docker connection
      await this.docker.ping();
      logger.info('Docker connection established');

      // Ensure network exists
      await this.ensureNetwork();

      // Clean up orphaned containers
      await this.cleanupOrphanedContainers();

      // Start monitoring
      this.startMonitoring();

      logger.info('Docker manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Docker manager:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Docker manager...');

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    // Stop all managed containers
    const stopPromises = Array.from(this.containers.keys()).map(containerId =>
      this.stopContainer(containerId).catch(error =>
        logger.error('Error stopping container during shutdown:', { containerId, error })
      )
    );

    await Promise.all(stopPromises);

    logger.info('Docker manager shutdown complete');
  }

  private async ensureNetwork(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [config.docker.networkName] },
      });

      if (networks.length === 0) {
        logger.info(`Creating Docker network: ${config.docker.networkName}`);
        await this.docker.createNetwork({
          Name: config.docker.networkName,
          Driver: 'bridge',
          IPAM: {
            Config: [{
              Subnet: '172.25.0.0/16',
            }],
          },
        });
      }
    } catch (error) {
      logger.error('Failed to ensure Docker network:', error);
      throw error;
    }
  }

  private async cleanupOrphanedContainers(): Promise<void> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['sentra.managed=true'],
        },
      });

      for (const containerInfo of containers) {
        const container = this.docker.getContainer(containerInfo.Id);
        
        // Check if container is still tracked
        const agentId = containerInfo.Labels?.['sentra.agent.id'];
        if (agentId && !await RedisManager.getAgentStatus(agentId)) {
          logger.info('Cleaning up orphaned container', {
            containerId: containerInfo.Id,
            agentId,
          });

          try {
            if (containerInfo.State === 'running') {
              await container.stop({ t: 10 });
            }
            await container.remove({ force: true });
            MetricsCollector.recordContainerOperation('destroy', 'success');
          } catch (error) {
            logger.error('Failed to cleanup orphaned container:', {
              containerId: containerInfo.Id,
              error,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup orphaned containers:', error);
    }
  }

  async createContainer(containerConfig: ContainerConfig): Promise<string> {
    const timer = MetricsCollector.startTimer();
    const containerId = uuidv4();

    try {
      logger.info('Creating container', {
        containerId,
        agentId: containerConfig.agentId,
        agentType: containerConfig.agentType,
      });

      // Prepare container configuration
      const dockerConfig = {
        Image: `${config.docker.agentImageRegistry}/${containerConfig.imageName}`,
        name: `sentra-agent-${containerConfig.agentId}`,
        Env: Object.entries(containerConfig.environment).map(([key, value]) => `${key}=${value}`),
        Labels: {
          'sentra.managed': 'true',
          'sentra.agent.id': containerConfig.agentId,
          'sentra.agent.type': containerConfig.agentType,
          'sentra.container.id': containerId,
        },
        HostConfig: {
          Memory: this.parseMemoryLimit(containerConfig.resourceLimits.memory),
          CpuPeriod: 100000,
          CpuQuota: Math.floor(parseFloat(containerConfig.resourceLimits.cpu) * 100000),
          NetworkMode: config.docker.networkName,
          RestartPolicy: {
            Name: 'on-failure',
            MaximumRetryCount: 3,
          },
        },
        NetworkingConfig: {
          EndpointsConfig: {
            [config.docker.networkName]: {},
          },
        },
        Healthcheck: containerConfig.healthCheck ? {
          Test: containerConfig.healthCheck.test,
          Interval: containerConfig.healthCheck.interval * 1000000, // Convert to nanoseconds
          Timeout: containerConfig.healthCheck.timeout * 1000000,
          Retries: containerConfig.healthCheck.retries,
        } : undefined,
      };

      // Create container
      const container = await this.docker.createContainer(dockerConfig);
      const actualContainerId = container.id;

      // Initialize container info
      const containerInfo: ContainerInfo = {
        containerId: actualContainerId,
        agentId: containerConfig.agentId,
        agentType: containerConfig.agentType,
        status: 'creating',
        createdAt: new Date(),
        ports: {},
        healthStatus: 'unknown',
        resourceUsage: {
          cpu: 0,
          memory: 0,
        },
      };

      this.containers.set(actualContainerId, containerInfo);
      await RedisManager.setContainerInfo(actualContainerId, containerInfo);

      // Publish creation event
      await MessageQueue.publishContainerEvent('created', actualContainerId, {
        agentId: containerConfig.agentId,
        agentType: containerConfig.agentType,
      });

      timer.end('create_container', containerConfig.agentType, 'success');
      MetricsCollector.recordContainerOperation('create', 'success');

      logger.info('Container created successfully', {
        containerId: actualContainerId,
        agentId: containerConfig.agentId,
      });

      return actualContainerId;
    } catch (error) {
      timer.end('create_container', containerConfig.agentType, 'error');
      MetricsCollector.recordContainerOperation('create', 'error');
      logger.error('Failed to create container:', {
        containerId,
        agentId: containerConfig.agentId,
        error,
      });
      throw error;
    }
  }

  async startContainer(containerId: string): Promise<void> {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      throw new Error(`Container not found: ${containerId}`);
    }

    const timer = MetricsCollector.startTimer();

    try {
      logger.info('Starting container', { containerId, agentId: containerInfo.agentId });

      const container = this.docker.getContainer(containerId);
      await container.start();

      // Update container info
      containerInfo.status = 'running';
      containerInfo.startedAt = new Date();
      this.containers.set(containerId, containerInfo);
      await RedisManager.setContainerInfo(containerId, containerInfo);

      // Get container details
      const inspectData = await container.inspect();
      containerInfo.ipAddress = inspectData.NetworkSettings.Networks?.[config.docker.networkName]?.IPAddress;

      // Publish start event
      await MessageQueue.publishContainerEvent('started', containerId, {
        agentId: containerInfo.agentId,
        ipAddress: containerInfo.ipAddress,
      });

      timer.end('start_container', containerInfo.agentType, 'success');
      MetricsCollector.recordContainerOperation('start', 'success');
      MetricsCollector.recordAgentStartup(containerInfo.agentType, Date.now() - containerInfo.createdAt.getTime());

      logger.info('Container started successfully', {
        containerId,
        agentId: containerInfo.agentId,
        ipAddress: containerInfo.ipAddress,
      });

    } catch (error) {
      containerInfo.status = 'error';
      this.containers.set(containerId, containerInfo);

      timer.end('start_container', containerInfo.agentType, 'error');
      MetricsCollector.recordContainerOperation('start', 'error');

      logger.error('Failed to start container:', { containerId, error });
      throw error;
    }
  }

  async stopContainer(containerId: string, timeout: number = 30): Promise<void> {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      logger.warn('Container not found for stop operation:', { containerId });
      return;
    }

    const timer = MetricsCollector.startTimer();

    try {
      logger.info('Stopping container', { containerId, agentId: containerInfo.agentId });

      const container = this.docker.getContainer(containerId);
      
      // Try graceful shutdown first
      try {
        await container.stop({ t: timeout });
      } catch (error: any) {
        if (error.statusCode !== 304) { // 304 means already stopped
          throw error;
        }
      }

      // Update container info
      containerInfo.status = 'stopped';
      containerInfo.stoppedAt = new Date();
      this.containers.set(containerId, containerInfo);
      await RedisManager.setContainerInfo(containerId, containerInfo);

      // Publish stop event
      await MessageQueue.publishContainerEvent('stopped', containerId, {
        agentId: containerInfo.agentId,
      });

      timer.end('stop_container', containerInfo.agentType, 'success');
      MetricsCollector.recordContainerOperation('stop', 'success');

      logger.info('Container stopped successfully', {
        containerId,
        agentId: containerInfo.agentId,
      });

    } catch (error) {
      timer.end('stop_container', containerInfo.agentType || 'unknown', 'error');
      MetricsCollector.recordContainerOperation('stop', 'error');
      logger.error('Failed to stop container:', { containerId, error });
      throw error;
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    const containerInfo = this.containers.get(containerId);
    if (!containerInfo) {
      logger.warn('Container not found for remove operation:', { containerId });
      return;
    }

    try {
      logger.info('Removing container', { containerId, agentId: containerInfo.agentId });

      const container = this.docker.getContainer(containerId);
      
      // Ensure container is stopped
      if (containerInfo.status === 'running') {
        await this.stopContainer(containerId);
      }

      // Remove container
      await container.remove({ force: true });

      // Clean up tracking
      this.containers.delete(containerId);
      await RedisManager.removeContainerInfo(containerId);

      // Publish remove event
      await MessageQueue.publishContainerEvent('removed', containerId, {
        agentId: containerInfo.agentId,
      });

      MetricsCollector.recordContainerOperation('destroy', 'success');

      logger.info('Container removed successfully', {
        containerId,
        agentId: containerInfo.agentId,
      });

    } catch (error) {
      MetricsCollector.recordContainerOperation('destroy', 'error');
      logger.error('Failed to remove container:', { containerId, error });
      throw error;
    }
  }

  async getContainerInfo(containerId: string): Promise<ContainerInfo | null> {
    return this.containers.get(containerId) || null;
  }

  async getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });

      return stream.toString();
    } catch (error) {
      logger.error('Failed to get container logs:', { containerId, error });
      throw error;
    }
  }

  private startMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.updateContainerStats();
        await this.checkContainerHealth();
      } catch (error) {
        logger.error('Container monitoring error:', error);
      }
    }, config.docker.healthCheckInterval);

    logger.info('Container monitoring started');
  }

  private async updateContainerStats(): Promise<void> {
    for (const [containerId, containerInfo] of this.containers) {
      if (containerInfo.status !== 'running') continue;

      try {
        const container = this.docker.getContainer(containerId);
        const stats = await container.stats({ stream: false });

        // Calculate CPU usage percentage
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
        const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
        const cpuUsage = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;

        // Calculate memory usage
        const memoryUsage = stats.memory_stats.usage || 0;
        const memoryUsageMB = memoryUsage / 1024 / 1024;

        // Update container info
        containerInfo.resourceUsage = {
          cpu: Math.round(cpuUsage * 100) / 100,
          memory: Math.round(memoryUsageMB * 100) / 100,
        };

        // Update metrics
        MetricsCollector.updateDockerResourceUsage(containerId, containerInfo.agentType, 'cpu', cpuUsage);
        MetricsCollector.updateDockerResourceUsage(containerId, containerInfo.agentType, 'memory', memoryUsageMB);

      } catch (error) {
        logger.debug('Failed to update container stats:', { containerId, error: error });
      }
    }
  }

  private async checkContainerHealth(): Promise<void> {
    for (const [containerId, containerInfo] of this.containers) {
      if (containerInfo.status !== 'running') continue;

      try {
        const container = this.docker.getContainer(containerId);
        const inspectData = await container.inspect();

        const healthStatus = inspectData.State.Health?.Status || 'unknown';
        
        if (containerInfo.healthStatus !== healthStatus) {
          containerInfo.healthStatus = healthStatus as any;
          
          // Publish health status change
          await MessageQueue.publishContainerEvent('health_changed', containerId, {
            agentId: containerInfo.agentId,
            healthStatus,
            previousHealthStatus: containerInfo.healthStatus,
          });

          logger.info('Container health status changed', {
            containerId,
            agentId: containerInfo.agentId,
            healthStatus,
          });
        }

        // Update Redis info
        await RedisManager.setContainerInfo(containerId, containerInfo);

      } catch (error) {
        logger.debug('Failed to check container health:', { containerId, error: error });
      }
    }
  }

  private parseMemoryLimit(memoryLimit: string): number {
    const unit = memoryLimit.slice(-1).toLowerCase();
    const value = parseInt(memoryLimit.slice(0, -1));

    switch (unit) {
      case 'g':
        return value * 1024 * 1024 * 1024;
      case 'm':
        return value * 1024 * 1024;
      case 'k':
        return value * 1024;
      default:
        return value;
    }
  }

  async getContainersByAgent(agentId: string): Promise<ContainerInfo[]> {
    const containers = Array.from(this.containers.values()).filter(
      container => container.agentId === agentId
    );
    return containers;
  }

  async getAllContainers(): Promise<ContainerInfo[]> {
    return Array.from(this.containers.values());
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}