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
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create SQL client using Neon's HTTP driver (edge-compatible)
  const sql = neon(process.env.DATABASE_URL);

  // Create Drizzle instance with schema
  _db = drizzle(sql, { schema });

  return _db;
}

// Export lazy getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

// Type-safe database instance
export type Database = typeof db;
