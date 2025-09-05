#!/usr/bin/env tsx
/**
 * Database migration runner for Sentra Evolutionary Agent System
 * Applies database migrations and creates necessary indexes
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createConnection } from './utils/connection';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';

async function runMigrations() {
  console.log('🚀 Starting database migration...');
  
  try {
    const db = createConnection();
    
    // Run migrations from the migrations directory
    await migrate(db, { 
      migrationsFolder: './src/db/migrations'
    });
    
    console.log('✅ Core migrations completed successfully!');
    
    // Run post-migration script for indexes and functions
    console.log('🔧 Running post-migration setup...');
    const postMigrationSQL = readFileSync(
      join(__dirname, 'migrations', 'post-migration.sql'), 
      'utf8'
    );
    
    await db.execute(sql.raw(postMigrationSQL));
    console.log('✅ Post-migration setup completed successfully!');
    
    console.log('🎉 Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}