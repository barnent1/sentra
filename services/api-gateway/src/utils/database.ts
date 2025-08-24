import { Pool, PoolClient } from 'pg';
import { config } from './config';
import { logger } from './logger';

export class DatabaseManager {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: config.database.url,
            max: config.database.poolSize,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Handle pool errors
        this.pool.on('error', (err) => {
            logger.error('Unexpected error on idle client', err);
        });
    }

    async connect(): Promise<void> {
        try {
            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            logger.info('Database connected successfully');
        } catch (error) {
            logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.pool.end();
            logger.info('Database disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from database:', error);
            throw error;
        }
    }

    async query(text: string, params?: any[]): Promise<any> {
        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }
}