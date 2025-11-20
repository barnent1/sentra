/**
 * Run Drizzle migration manually
 * Applies the latest migration SQL file to the database
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables from .env (override=true to replace existing)
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

async function runMigration() {
  // Get DATABASE_URL from environment
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  console.log('DATABASE_URL:', databaseUrl.substring(0, 60) + '...');

  // Clean up Supabase-specific parameters
  databaseUrl = databaseUrl.replace('&supa=base-pooler.x', '');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../drizzle/0001_abnormal_alice.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Running migration: 0001_abnormal_alice.sql');

  // Create SQL client
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} statement(s)...`);

    for (const statement of statements) {
      console.log('\nExecuting:', statement.substring(0, 100) + '...');
      await sql.unsafe(statement);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
