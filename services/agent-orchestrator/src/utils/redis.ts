import { createClient, RedisClientType } from 'redis';
import { config } from './config';
import { logger } from './logger';

class RedisManagerClass {
  private client: RedisClientType | null = null;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > config.redis.maxRetries) {
              logger.error('Redis max retries exceeded');
              return false;
            }
            return Math.min(retries * config.redis.retryDelayMs, 3000);
          },
        },
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      await this.client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis disconnected');
    }
  }

  private getKey(key: string): string {
    return `${config.redis.keyPrefix}${key}`;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const serialized = JSON.stringify(value);
    const redisKey = this.getKey(key);

    try {
      if (ttlSeconds) {
        await this.client.setEx(redisKey, ttlSeconds, serialized);
      } else {
        await this.client.set(redisKey, serialized);
      }
    } catch (error) {
      logger.error('Redis SET failed:', { key, error });
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const redisKey = this.getKey(key);
      const value = await this.client.get(redisKey);
      
      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis GET failed:', { key, error });
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const redisKey = this.getKey(key);
      return await this.client.del(redisKey);
    } catch (error) {
      logger.error('Redis DEL failed:', { key, error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const redisKey = this.getKey(key);
      const result = await this.client.exists(redisKey);
      return result > 0;
    } catch (error) {
      logger.error('Redis EXISTS failed:', { key, error });
      throw error;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const redisKey = this.getKey(key);
      const result = await this.client.expire(redisKey, ttlSeconds);
      return result;
    } catch (error) {
      logger.error('Redis EXPIRE failed:', { key, ttlSeconds, error });
      throw error;
    }
  }

  // Agent-specific Redis operations
  async setAgentStatus(agentId: string, status: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`agent:${agentId}:status`, status, ttlSeconds);
  }

  async getAgentStatus(agentId: string): Promise<any | null> {
    return await this.get(`agent:${agentId}:status`);
  }

  async setAgentTask(agentId: string, taskId: string, taskData: any, ttlSeconds: number = 3600): Promise<void> {
    await this.set(`agent:${agentId}:task:${taskId}`, taskData, ttlSeconds);
  }

  async getAgentTask(agentId: string, taskId: string): Promise<any | null> {
    return await this.get(`agent:${agentId}:task:${taskId}`);
  }

  async removeAgentTask(agentId: string, taskId: string): Promise<void> {
    await this.del(`agent:${agentId}:task:${taskId}`);
  }

  // Task queue operations
  async addTaskToQueue(priority: string, taskData: any): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const queueKey = this.getKey(`queue:${priority}`);
    await this.client.lPush(queueKey, JSON.stringify(taskData));
  }

  async getTaskFromQueue(priority: string): Promise<any | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const queueKey = this.getKey(`queue:${priority}`);
    const result = await this.client.rPop(queueKey);
    
    return result ? JSON.parse(result) : null;
  }

  async getQueueLength(priority: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const queueKey = this.getKey(`queue:${priority}`);
    return await this.client.lLen(queueKey);
  }

  // Agent discovery and load balancing
  async registerAgent(agentId: string, agentInfo: any, ttlSeconds: number = 60): Promise<void> {
    await this.set(`agent:${agentId}:info`, agentInfo, ttlSeconds);
    
    // Add to agent type set
    const typeKey = this.getKey(`agents:type:${agentInfo.type}`);
    await this.client?.sAdd(typeKey, agentId);
    await this.client?.expire(typeKey, ttlSeconds + 10);
  }

  async getAgentsByType(agentType: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const typeKey = this.getKey(`agents:type:${agentType}`);
    const agentIds = await this.client.sMembers(typeKey);
    return agentIds;
  }

  async unregisterAgent(agentId: string, agentType: string): Promise<void> {
    await this.del(`agent:${agentId}:info`);
    await this.del(`agent:${agentId}:status`);
    
    // Remove from agent type set
    const typeKey = this.getKey(`agents:type:${agentType}`);
    await this.client?.sRem(typeKey, agentId);
  }

  // Docker container tracking
  async setContainerInfo(containerId: string, containerInfo: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`container:${containerId}`, containerInfo, ttlSeconds);
  }

  async getContainerInfo(containerId: string): Promise<any | null> {
    return await this.get(`container:${containerId}`);
  }

  async removeContainerInfo(containerId: string): Promise<void> {
    await this.del(`container:${containerId}`);
  }

  // Documentation cache operations
  async setDocumentation(source: string, version: string, content: any, ttlSeconds: number = 86400): Promise<void> {
    const key = `doc:${source}:${version}`;
    await this.set(key, content, ttlSeconds);
  }

  async getDocumentation(source: string, version: string): Promise<any | null> {
    const key = `doc:${source}:${version}`;
    return await this.get(key);
  }

  async setDocumentationIndex(source: string, index: any, ttlSeconds: number = 86400): Promise<void> {
    const key = `doc:index:${source}`;
    await this.set(key, index, ttlSeconds);
  }

  async getDocumentationIndex(source: string): Promise<any | null> {
    const key = `doc:index:${source}`;
    return await this.get(key);
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  // Statistics
  async getStats(): Promise<{
    totalAgents: number;
    activeContainers: number;
    queueLengths: Record<string, number>;
  }> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const [criticalQueue, highQueue, mediumQueue, lowQueue] = await Promise.all([
        this.getQueueLength('critical'),
        this.getQueueLength('high'),
        this.getQueueLength('medium'),
        this.getQueueLength('low'),
      ]);

      // Count active agents and containers
      const agentKeys = await this.client.keys(this.getKey('agent:*:info'));
      const containerKeys = await this.client.keys(this.getKey('container:*'));

      return {
        totalAgents: agentKeys.length,
        activeContainers: containerKeys.length,
        queueLengths: {
          critical: criticalQueue,
          high: highQueue,
          medium: mediumQueue,
          low: lowQueue,
        },
      };
    } catch (error) {
      logger.error('Failed to get Redis stats:', error);
      return {
        totalAgents: 0,
        activeContainers: 0,
        queueLengths: { critical: 0, high: 0, medium: 0, low: 0 },
      };
    }
  }
}

export const RedisManager = new RedisManagerClass();