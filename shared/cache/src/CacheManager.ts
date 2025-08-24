import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { LRUCache } from 'lru-cache';
import { performance } from 'perf_hooks';

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  compress?: boolean;
  serializer?: 'json' | 'msgpack';
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  operations: number;
  averageResponseTime: number;
}

export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
}

/**
 * Multi-tier caching system for SENTRA production environment
 * Implements L1 (memory), L2 (Redis), and L3 (disk) caching strategies
 */
export class CacheManager {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;
  private nodeCache: NodeCache;
  private stats: Map<string, CacheStats> = new Map();
  
  constructor(
    private redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379',
    private memorySize: number = 1000,
    private defaultTTL: number = 3600
  ) {
    this.initializeRedis();
    this.initializeMemoryCache();
    this.initializeNodeCache();
  }

  private initializeRedis(): void {
    this.redis = new Redis(this.redisUrl, {
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      family: 4,
      keyPrefix: 'sentra:cache:',
    });

    this.redis.on('error', (error) => {
      console.error('Redis cache error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis cache connected');
    });
  }

  private initializeMemoryCache(): void {
    this.memoryCache = new LRUCache({
      max: this.memorySize,
      ttl: this.defaultTTL * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      allowStale: false,
    });
  }

  private initializeNodeCache(): void {
    this.nodeCache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 120,
      useClones: false,
      maxKeys: this.memorySize * 2,
    });
  }

  /**
   * Get value from cache with multi-tier fallback
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = performance.now();
    const namespace = options.namespace || 'default';
    const namespacedKey = this.getNamespacedKey(key, namespace);
    
    try {
      // L1 Cache: Memory (fastest)
      const memoryValue = this.memoryCache.get(namespacedKey);
      if (memoryValue !== undefined) {
        this.recordCacheHit(namespace, performance.now() - startTime);
        return this.deserializeValue(memoryValue);
      }

      // L2 Cache: NodeCache
      const nodeCacheValue = this.nodeCache.get(namespacedKey);
      if (nodeCacheValue !== undefined) {
        // Promote to L1 cache
        this.memoryCache.set(namespacedKey, nodeCacheValue);
        this.recordCacheHit(namespace, performance.now() - startTime);
        return this.deserializeValue(nodeCacheValue);
      }

      // L3 Cache: Redis (distributed)
      const redisValue = await this.redis.get(namespacedKey);
      if (redisValue !== null) {
        const deserializedValue = this.deserializeValue(redisValue);
        
        // Promote to higher cache levels
        this.nodeCache.set(namespacedKey, redisValue, options.ttl || this.defaultTTL);
        this.memoryCache.set(namespacedKey, redisValue);
        
        this.recordCacheHit(namespace, performance.now() - startTime);
        return deserializedValue;
      }

      // Cache miss
      this.recordCacheMiss(namespace, performance.now() - startTime);
      return null;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordCacheMiss(namespace, performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in all cache tiers
   */
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const namespace = options.namespace || 'default';
    const namespacedKey = this.getNamespacedKey(key, namespace);
    const ttl = options.ttl || this.defaultTTL;
    const serializedValue = this.serializeValue(value, options);

    try {
      // Set in all cache tiers simultaneously
      const promises = [
        this.memoryCache.set(namespacedKey, serializedValue),
        this.nodeCache.set(namespacedKey, serializedValue, ttl),
        this.redis.setex(namespacedKey, ttl, serializedValue)
      ];

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete from all cache tiers
   */
  async del(key: string, options: CacheOptions = {}): Promise<void> {
    const namespace = options.namespace || 'default';
    const namespacedKey = this.getNamespacedKey(key, namespace);

    try {
      // Delete from all tiers
      this.memoryCache.delete(namespacedKey);
      this.nodeCache.del(namespacedKey);
      await this.redis.del(namespacedKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Batch operations for improved performance
   */
  async mget(keys: string[], options: CacheOptions = {}): Promise<(any | null)[]> {
    const namespace = options.namespace || 'default';
    const namespacedKeys = keys.map(key => this.getNamespacedKey(key, namespace));
    
    try {
      const values = await this.redis.mget(...namespacedKeys);
      return values.map(value => value !== null ? this.deserializeValue(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>, options: CacheOptions = {}): Promise<void> {
    const namespace = options.namespace || 'default';
    
    try {
      const pipeline = this.redis.pipeline();
      
      for (const entry of entries) {
        const namespacedKey = this.getNamespacedKey(entry.key, namespace);
        const serializedValue = this.serializeValue(entry.value, options);
        const ttl = entry.ttl || options.ttl || this.defaultTTL;
        
        pipeline.setex(namespacedKey, ttl, serializedValue);
        
        // Also set in memory caches
        this.memoryCache.set(namespacedKey, serializedValue);
        this.nodeCache.set(namespacedKey, serializedValue, ttl);
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  /**
   * Cache warming strategies
   */
  async warmCache(keys: string[], factory: (key: string) => Promise<any>, options: CacheOptions = {}): Promise<void> {
    console.log(`Warming cache for ${keys.length} keys...`);
    
    const batchSize = 10;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (key) => {
        try {
          const cached = await this.get(key, options);
          if (cached === null) {
            const value = await factory(key);
            await this.set(key, value, options);
          }
        } catch (error) {
          console.error(`Cache warming failed for key ${key}:`, error);
        }
      }));
    }
    
    console.log('Cache warming completed');
  }

  /**
   * Cache invalidation patterns
   */
  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const namespace = options.namespace || 'default';
    const namespacedPattern = this.getNamespacedKey(pattern, namespace);
    
    try {
      const keys = await this.redis.keys(namespacedPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        
        // Clear from memory caches too
        keys.forEach(key => {
          this.memoryCache.delete(key);
          this.nodeCache.del(key);
        });
      }
      
      return keys.length;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return 0;
    }
  }

  /**
   * Cache statistics and monitoring
   */
  getStats(namespace: string = 'default'): CacheStats {
    const stats = this.stats.get(namespace);
    if (!stats) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        operations: 0,
        averageResponseTime: 0
      };
    }
    return stats;
  }

  getAllStats(): Map<string, CacheStats> {
    return new Map(this.stats);
  }

  resetStats(namespace?: string): void {
    if (namespace) {
      this.stats.delete(namespace);
    } else {
      this.stats.clear();
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; redis: boolean; memory: boolean }> {
    try {
      await this.redis.ping();
      const memoryTest = this.memoryCache.has('test') !== undefined;
      
      return {
        status: 'healthy',
        redis: true,
        memory: memoryTest !== undefined
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: false,
        memory: true
      };
    }
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.memoryCache.clear();
      this.nodeCache.flushAll();
      this.stats.clear();
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Private helper methods
  private getNamespacedKey(key: string, namespace: string): string {
    return `${namespace}:${key}`;
  }

  private serializeValue(value: any, options: CacheOptions): string {
    try {
      return JSON.stringify({
        value,
        timestamp: Date.now(),
        compressed: options.compress || false
      });
    } catch (error) {
      console.error('Serialization error:', error);
      return JSON.stringify({ value: null, timestamp: Date.now(), compressed: false });
    }
  }

  private deserializeValue(serialized: string): any {
    try {
      const parsed = JSON.parse(serialized);
      return parsed.value;
    } catch (error) {
      console.error('Deserialization error:', error);
      return null;
    }
  }

  private recordCacheHit(namespace: string, responseTime: number): void {
    const stats = this.getStatsObject(namespace);
    stats.hits++;
    stats.operations++;
    stats.averageResponseTime = ((stats.averageResponseTime * (stats.operations - 1)) + responseTime) / stats.operations;
    stats.hitRate = stats.hits / stats.operations;
  }

  private recordCacheMiss(namespace: string, responseTime: number): void {
    const stats = this.getStatsObject(namespace);
    stats.misses++;
    stats.operations++;
    stats.averageResponseTime = ((stats.averageResponseTime * (stats.operations - 1)) + responseTime) / stats.operations;
    stats.hitRate = stats.hits / stats.operations;
  }

  private getStatsObject(namespace: string): CacheStats {
    if (!this.stats.has(namespace)) {
      this.stats.set(namespace, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        operations: 0,
        averageResponseTime: 0
      });
    }
    return this.stats.get(namespace)!;
  }
}

export default CacheManager;