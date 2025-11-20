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
 * - Global singleton pattern
 * - Lazy initialization (build-time safe)
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) {
    return _db;
  }

  // Validate DATABASE_URL environment variable
  const databaseUrl = process.env.DATABASE_URL;

  // During build time, return a mock to prevent errors
  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    // Return null during build/test - will be initialized at runtime
    return null as any;
  }

  // Create SQL client using Neon's HTTP driver (edge-compatible)
  const sql = neon(databaseUrl);

  // Create Drizzle instance with schema
  _db = drizzle(sql, { schema });

  return _db;
}

// Export lazy getter with direct access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) {
      throw new Error('Database not initialized - DATABASE_URL may be missing');
    }
    return (instance as any)[prop];
  },
});

// Type-safe database instance
export type Database = typeof db;
