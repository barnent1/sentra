/**
 * Database connection utility for Sentra Evolutionary Agent System
 * Manages PostgreSQL connections with pgvector support using Drizzle ORM
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../schema';
// Default database configuration
const defaultConfig = {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'sentra_evolution',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'postgres',
    ssl: process.env['DB_SSL'] === 'true',
    maxConnections: parseInt(process.env['DB_MAX_CONNECTIONS'] || '20'),
};
/**
 * Create a database connection pool
 */
export const createConnection = (config = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    const connectionString = `postgresql://${finalConfig.username}:${finalConfig.password}@${finalConfig.host}:${finalConfig.port}/${finalConfig.database}${finalConfig.ssl ? '?sslmode=require' : ''}`;
    const client = postgres(connectionString, {
        max: finalConfig.maxConnections || 20,
        idle_timeout: 20,
        connect_timeout: 10,
    });
    return drizzle(client, {
        schema,
        logger: process.env['NODE_ENV'] === 'development',
    });
};
// Global database instance
let db = null;
/**
 * Get the global database instance (singleton pattern)
 */
export const getDatabase = (config) => {
    if (!db) {
        db = createConnection(config);
    }
    return db;
};
/**
 * Test database connection
 */
export const testConnection = async (config) => {
    try {
        const testDb = createConnection(config);
        await testDb.execute(sql `SELECT 1`);
        return true;
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
};
/**
 * Close database connection
 */
export const closeConnection = async () => {
    if (db) {
        // The postgres client doesn't have a direct close method in this setup
        // But the connection will be cleaned up automatically
        db = null;
    }
};
//# sourceMappingURL=connection.js.map