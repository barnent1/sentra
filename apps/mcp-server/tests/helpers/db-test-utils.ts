import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as schema from '../../db/schema/index';
import { sql } from 'drizzle-orm';

dotenv.config();

const { Pool } = pg;

// Create a test database connection pool
export function createTestPool(): pg.Pool {
  const poolConfig: pg.PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sentra',
    min: 1,
    max: 5,
  };

  return new Pool(poolConfig);
}

// Create test database instance
export function createTestDb(pool: pg.Pool) {
  return drizzle(pool, { schema });
}

// Clean all tables
export async function cleanDatabase(db: ReturnType<typeof createTestDb>) {
  await db.execute(sql`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
      LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
}

// Check if table exists
export async function tableExists(pool: pg.Pool, tableName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );`,
    [tableName]
  );
  return result.rows[0].exists;
}

// Check if column exists
export async function columnExists(
  pool: pg.Pool,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    );`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

// Get column type
export async function getColumnType(
  pool: pg.Pool,
  tableName: string,
  columnName: string
): Promise<string | null> {
  const result = await pool.query(
    `SELECT data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
     AND table_name = $1
     AND column_name = $2;`,
    [tableName, columnName]
  );

  if (result.rows.length === 0) return null;

  // For custom types like vector, return udt_name
  if (result.rows[0].data_type === 'USER-DEFINED') {
    return result.rows[0].udt_name;
  }

  return result.rows[0].data_type;
}

// Check foreign key constraint
export async function foreignKeyExists(
  pool: pg.Pool,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = $1
        AND kcu.column_name = $2
        AND tc.constraint_type = 'FOREIGN KEY'
    );`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

// Get foreign key details
export async function getForeignKeyDetails(
  pool: pg.Pool,
  tableName: string,
  columnName: string
): Promise<{
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
} | null> {
  const result = await pool.query(
    `SELECT
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule AS on_delete
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON rc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = $1
      AND kcu.column_name = $2
      AND tc.constraint_type = 'FOREIGN KEY';`,
    [tableName, columnName]
  );

  if (result.rows.length === 0) return null;

  return {
    referencedTable: result.rows[0].referenced_table,
    referencedColumn: result.rows[0].referenced_column,
    onDelete: result.rows[0].on_delete,
  };
}

// Check if pgvector extension is available
export async function isVectorExtensionAvailable(pool: pg.Pool): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
      );`
    );
    return result.rows[0].exists;
  } catch {
    return false;
  }
}

// Check if pgvector extension is enabled
export async function isVectorExtensionEnabled(pool: pg.Pool): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      );`
    );
    return result.rows[0].exists;
  } catch {
    return false;
  }
}
