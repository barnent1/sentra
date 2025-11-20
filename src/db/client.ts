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
 * - Conditional initialization (build-time safe)
 */

import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Conditionally initialize database connection
// During build: DATABASE_URL may not be set, so we create a placeholder
// During runtime: DATABASE_URL must be set, connection is created
let _db: NeonHttpDatabase<typeof schema> | null = null;

try {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const sql = neon(databaseUrl);
    _db = drizzle(sql, { schema });
  }
} catch (error) {
  // Ignore errors during build time
  console.warn('Database initialization skipped (build time)');
}

// Export database instance
// Will be null during build, but initialized at runtime
export const db = _db as NeonHttpDatabase<typeof schema>;

// Type-safe database instance
export type Database = typeof db;
