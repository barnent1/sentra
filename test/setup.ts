/**
 * Global Vitest Setup for SENTRA Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { vi } from 'vitest';

// Mock external dependencies globally
vi.mock('@qdrant/js-client-rest');
vi.mock('openai');
vi.mock('postgres');
vi.mock('pg');

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/sentra_test';
process.env['QDRANT_URL'] = 'http://localhost:6333';
process.env['OPENAI_API_KEY'] = 'test-api-key';

// Global test utilities
global.createTestTimeout = (ms: number = 5000) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Performance test helpers
global.measurePerformance = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

// Suppress console logs in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Type declarations for global utilities
declare global {
  var createTestTimeout: (ms?: number) => Promise<void>;
  var measurePerformance: <T>(fn: () => Promise<T>) => Promise<{ result: T; duration: number }>;
}