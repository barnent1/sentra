import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from './config';
import { logger } from './logger';

// Database schema
import * as schema from '../database/schema';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Create connection pool
    pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? {
        rejectUnauthorized: false
      } : false,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    // Initialize Drizzle ORM
    db = drizzle(pool, { schema });

    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = (): ReturnType<typeof drizzle> => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    logger.info('Database connection closed');
  }
};

// Health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!pool) return false;
    
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};