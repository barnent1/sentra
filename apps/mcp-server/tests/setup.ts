import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { jest, beforeAll, afterAll } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.test if exists, otherwise .env
config({ path: join(__dirname, '..', '.env.test') });
config({ path: join(__dirname, '..', '.env') });

// Set test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting database tests...');
});

afterAll(() => {
  console.log('✅ Database tests completed');
});
