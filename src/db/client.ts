/**
 * Drizzle Database Client
 *
 * Edge-compatible database client for Vercel Edge Runtime.
 * Uses Neon's serverless driver for PostgreSQL.
 *
 * Features:
 * - Works in Vercel Edge Runtime
 * - Connection pooling
 * - HTTP-based protocol (no TCP)
 * - Lazy initialization (runtime safe)
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy database initialization
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: postgres.Sql | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) {
    return _db;
  }

  // Validate DATABASE_URL environment variable
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create postgres client with connection pooling (works with Supabase)
  _client = postgres(databaseUrl, {
    prepare: false, // Required for pgBouncer/Supabase pooler
  });

  // Create Drizzle instance with schema
  _db = drizzle(_client, { schema });

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
