/**
 * Drizzle Database Client
 *
 * Database client for Supabase PostgreSQL.
 * Uses postgres-js for reliable connection pooling.
 *
 * Features:
 * - Works with Supabase PostgreSQL
 * - Connection pooling
 * - SSL support
 * - Lazy initialization (runtime safe)
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy database initialization
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) {
    return _db;
  }

  // Validate DATABASE_URL environment variable
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create postgres-js client (works with Supabase)
  _sql = postgres(databaseUrl, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Create Drizzle instance with schema
  _db = drizzle(_sql, { schema });

  return _db;
}

// Export lazy getter that initializes on first use
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const dbInstance = getDb();
    const value = (dbInstance as any)[prop];
    // Bind methods to maintain context
    return typeof value === 'function' ? value.bind(dbInstance) : value;
  },
});

// Type-safe database instance
export type Database = typeof db;
