import Redis from 'ioredis';
import { config } from './config';
import { logger } from './logger';

let redis: Redis | null = null;

export const initializeRedis = async (): Promise<void> => {
  try {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: config.redis.maxRetries,
      retryDelayOnFailover: config.redis.retryDelayOnFailover,
      enableReadyCheck: true,
      lazyConnect: true,
      
      // Connection timeout
      connectTimeout: 10000,
      commandTimeout: 5000,
      
      // Reconnection options
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
      
      // Health check
      keepAlive: 30000,
      
      // Security
      family: 4, // Use IPv4
    });

    // Event handlers
    redis.on('connect', () => {
      logger.info('Redis connection established');
    });

    redis.on('ready', () => {
      logger.info('Redis ready for commands');
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });

    // Connect
    await redis.connect();
    
    // Test connection
    await redis.ping();
    
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
};

export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redis;
};

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
};

// Session management utilities
export class SessionManager {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private static readonly PENDING_AUTH_PREFIX = 'pending_auth:';

  static async createSession(sessionId: string, sessionData: any, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    
    await redis.setex(key, ttlSeconds, JSON.stringify({
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString()
    }));

    // Track user sessions
    if (sessionData.userId) {
      await redis.sadd(`${this.USER_SESSIONS_PREFIX}${sessionData.userId}`, sessionId);
      await redis.expire(`${this.USER_SESSIONS_PREFIX}${sessionData.userId}`, ttlSeconds);
    }
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const redis = getRedis();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    
    const sessionData = await redis.get(key);
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData);
    } catch (error) {
      logger.error('Failed to parse session data:', error);
      await redis.del(key);
      return null;
    }
  }

  static async updateSession(sessionId: string, updates: any): Promise<boolean> {
    const redis = getRedis();
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    
    const existing = await this.getSession(sessionId);
    if (!existing) return false;
    
    const ttl = await redis.ttl(key);
    if (ttl <= 0) return false;
    
    const updatedSession = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await redis.setex(key, ttl, JSON.stringify(updatedSession));
    return true;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const redis = getRedis();
    const session = await this.getSession(sessionId);
    
    await redis.del(`${this.SESSION_PREFIX}${sessionId}`);
    
    // Remove from user sessions
    if (session?.userId) {
      await redis.srem(`${this.USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
    }
  }

  static async deleteUserSessions(userId: string): Promise<void> {
    const redis = getRedis();
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    
    const sessionIds = await redis.smembers(userSessionsKey);
    
    if (sessionIds.length > 0) {
      const pipeline = redis.pipeline();
      
      for (const sessionId of sessionIds) {
        pipeline.del(`${this.SESSION_PREFIX}${sessionId}`);
      }
      
      pipeline.del(userSessionsKey);
      await pipeline.exec();
    }
  }

  static async createPendingAuthSession(sessionId: string, authData: any, ttlSeconds: number = 300): Promise<void> {
    const redis = getRedis();
    const key = `${this.PENDING_AUTH_PREFIX}${sessionId}`;
    
    await redis.setex(key, ttlSeconds, JSON.stringify({
      ...authData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString()
    }));
  }

  static async getPendingAuthSession(sessionId: string): Promise<any | null> {
    const redis = getRedis();
    const key = `${this.PENDING_AUTH_PREFIX}${sessionId}`;
    
    const authData = await redis.get(key);
    if (!authData) return null;
    
    try {
      return JSON.parse(authData);
    } catch (error) {
      logger.error('Failed to parse pending auth data:', error);
      await redis.del(key);
      return null;
    }
  }

  static async deletePendingAuthSession(sessionId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`${this.PENDING_AUTH_PREFIX}${sessionId}`);
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static readonly RATE_LIMIT_PREFIX = 'rate_limit:';

  static async checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const redis = getRedis();
    const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    
    const pipeline = redis.pipeline();
    pipeline.incr(rateLimitKey);
    pipeline.expire(rateLimitKey, windowSeconds);
    
    const results = await pipeline.exec();
    const currentCount = results?.[0]?.[1] as number || 0;
    
    const allowed = currentCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount);
    const resetTime = Date.now() + (windowSeconds * 1000);
    
    return {
      allowed,
      remaining,
      resetTime
    };
  }

  static async resetRateLimit(key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`${this.RATE_LIMIT_PREFIX}${key}`);
  }
}

// Health check
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (!redis) return false;
    
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};