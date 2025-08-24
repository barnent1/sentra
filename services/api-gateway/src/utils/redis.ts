import { createClient, RedisClientType } from 'redis';
import { config } from './config';
import { logger } from './logger';

export class RedisManager {
    private client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: config.redis.url,
            password: config.redis.password || undefined,
        });

        // Handle Redis errors
        this.client.on('error', (err) => {
            logger.error('Redis client error:', err);
        });

        this.client.on('connect', () => {
            logger.info('Connected to Redis');
        });

        this.client.on('disconnect', () => {
            logger.warn('Disconnected from Redis');
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.disconnect();
            logger.info('Redis disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            logger.error('Redis GET error:', error);
            throw error;
        }
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        try {
            if (ttl) {
                await this.client.setEx(key, ttl, value);
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            logger.error('Redis SET error:', error);
            throw error;
        }
    }

    async del(key: string): Promise<number> {
        try {
            return await this.client.del(key);
        } catch (error) {
            logger.error('Redis DEL error:', error);
            throw error;
        }
    }

    async ping(): Promise<string> {
        try {
            return await this.client.ping();
        } catch (error) {
            logger.error('Redis PING error:', error);
            throw error;
        }
    }
}