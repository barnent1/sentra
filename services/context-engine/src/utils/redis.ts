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

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const redisPattern = this.getKey(pattern);
      const keys = await this.client.keys(redisPattern);
      // Remove prefix from returned keys
      return keys.map(key => key.substring(config.redis.keyPrefix.length));
    } catch (error) {
      logger.error('Redis KEYS failed:', { pattern, error });
      throw error;
    }
  }

  // Context-specific Redis operations
  async setContextHot(contextId: string, data: any, ttlSeconds: number = 7200): Promise<void> {
    await this.set(`hot:${contextId}`, data, ttlSeconds);
  }

  async getContextHot(contextId: string): Promise<any | null> {
    return await this.get(`hot:${contextId}`);
  }

  async setContextWarm(contextId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    await this.set(`warm:${contextId}`, data, ttlSeconds);
  }

  async getContextWarm(contextId: string): Promise<any | null> {
    return await this.get(`warm:${contextId}`);
  }

  async moveContextHotToWarm(contextId: string): Promise<void> {
    const hotData = await this.getContextHot(contextId);
    if (hotData) {
      await this.setContextWarm(contextId, hotData);
      await this.del(`hot:${contextId}`);
    }
  }

  async removeContextFromCache(contextId: string): Promise<void> {
    await Promise.all([
      this.del(`hot:${contextId}`),
      this.del(`warm:${contextId}`),
    ]);
  }

  // Context search and indexing
  async indexContextForSearch(contextId: string, searchableText: string): Promise<void> {
    const words = searchableText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const uniqueWords = [...new Set(words)];
    
    for (const word of uniqueWords) {
      await this.client?.sAdd(this.getKey(`search:${word}`), contextId);
    }
  }

  async searchContexts(query: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    if (words.length === 0) return [];

    const searchKeys = words.map(word => this.getKey(`search:${word}`));
    
    if (searchKeys.length === 1) {
      return Array.from(await this.client.sMembers(searchKeys[0]!));
    } else {
      return Array.from(await this.client.sInter(searchKeys));
    }
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

  // Cache statistics
  async getCacheStats(): Promise<{
    hotContexts: number;
    warmContexts: number;
    totalMemoryUsage: string;
  }> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const [hotKeys, warmKeys, info] = await Promise.all([
        this.keys('hot:*'),
        this.keys('warm:*'),
        this.client.info('memory'),
      ]);

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1]!.trim() : 'unknown';

      return {
        hotContexts: hotKeys.length,
        warmContexts: warmKeys.length,
        totalMemoryUsage: memoryUsage,
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        hotContexts: 0,
        warmContexts: 0,
        totalMemoryUsage: 'unknown',
      };
    }
  }
}

export const RedisManager = new RedisManagerClass();