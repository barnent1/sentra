/**
 * Database connection utility for Sentra Evolutionary Agent System
 * Manages PostgreSQL connections with pgvector support using Drizzle ORM
 */
import type { DatabaseConfig } from '@sentra/types';
import * as schema from '../schema';
/**
 * Create a database connection pool
 */
export declare const createConnection: (config?: Partial<DatabaseConfig>) => import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema>;
/**
 * Get the global database instance (singleton pattern)
 */
export declare const getDatabase: (config?: Partial<DatabaseConfig>) => import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema>;
/**
 * Test database connection
 */
export declare const testConnection: (config?: Partial<DatabaseConfig>) => Promise<boolean>;
/**
 * Close database connection
 */
export declare const closeConnection: () => Promise<void>;
//# sourceMappingURL=connection.d.ts.map