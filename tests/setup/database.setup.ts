/**
 * Database Test Setup
 *
 * Creates a fresh test database for each test run.
 * Uses in-memory SQLite for fast, isolated tests.
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB_PATH = path.join(__dirname, '../../prisma/test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

/**
 * Setup test database before tests run
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  // Remove existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Set environment variable for test database
  process.env.DATABASE_URL = TEST_DB_URL;

  // Run migrations on test database
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Failed to run migrations on test database:', error);
    throw error;
  }

  // Create Prisma client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DB_URL,
      },
    },
  });

  await prisma.$connect();

  return prisma;
}

/**
 * Cleanup test database after tests
 */
export async function teardownTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();

  // Remove test database file
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

/**
 * Clear all data from test database
 */
export async function clearTestDatabase(prisma: PrismaClient): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.activity.deleteMany();
  await prisma.cost.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}
