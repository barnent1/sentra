#!/usr/bin/env tsx

/**
 * Supabase Migration Script
 * Runs Drizzle migrations against Supabase database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../src/db/schema';

async function runMigration() {
  console.log('🚀 Quetrex - Database Migration');
  console.log('================================\n');

  // Check for DATABASE_URL
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set\n');
    console.log('Please set your Supabase connection string:');
    console.log('export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"\n');
    console.log('To get your connection string:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings > Database');
    console.log('4. Copy the "Connection string" (URI format)');
    console.log('5. Replace [password] with your database password\n');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is set');
  console.log(`📍 Host: ${new URL(connectionString).hostname}\n`);

  try {
    // Create postgres client for migration
    console.log('🔌 Connecting to database...');
    const migrationClient = postgres(connectionString, {
      max: 1,
      onnotice: () => {}, // Suppress notices during migration
    });

    const db = drizzle(migrationClient, { schema });
    console.log('✅ Connected to database\n');

    // Run migrations
    console.log('📝 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await migrationClient`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('📊 Tables created:');
    result.forEach((row: any) => {
      console.log(`  - ${row.tablename}`);
    });
    console.log('');

    // Check table counts
    console.log('📈 Table statistics:');
    const users = await migrationClient`SELECT COUNT(*) FROM users`;
    const projects = await migrationClient`SELECT COUNT(*) FROM projects`;
    const agents = await migrationClient`SELECT COUNT(*) FROM agents`;
    const costs = await migrationClient`SELECT COUNT(*) FROM costs`;
    const activities = await migrationClient`SELECT COUNT(*) FROM activities`;

    console.log(`  - users: ${users[0].count} rows`);
    console.log(`  - projects: ${projects[0].count} rows`);
    console.log(`  - agents: ${agents[0].count} rows`);
    console.log(`  - costs: ${costs[0].count} rows`);
    console.log(`  - activities: ${activities[0].count} rows`);
    console.log('');

    // Close connection
    await migrationClient.end();
    console.log('✅ Database connection closed\n');

    console.log('🎉 Migration complete!\n');
    console.log('Next steps:');
    console.log('1. Update Vercel environment variables with DATABASE_URL');
    console.log('2. Redeploy to Vercel: vercel --prod');
    console.log('3. Test your application\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:\n');
    console.error(error);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your DATABASE_URL is correct');
    console.log('2. Check your database password');
    console.log('3. Ensure Supabase project is active');
    console.log('4. Check network connectivity\n');
    process.exit(1);
  }
}

// Run migration
runMigration();
