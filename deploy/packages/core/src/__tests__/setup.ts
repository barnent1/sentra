/**
 * Jest Test Setup for Core Package
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('@qdrant/js-client-rest');
jest.mock('openai');
jest.mock('postgres');

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/sentra_test';
  process.env['QDRANT_URL'] = 'http://localhost:6333';
  process.env['OPENAI_API_KEY'] = 'test-api-key';
  
  // Suppress console logs in tests
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  // Cleanup
  jest.clearAllMocks();
});

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

// Type declarations for global utilities
declare global {
  var createTestTimeout: (ms?: number) => Promise<void>;
  var measurePerformance: <T>(fn: () => Promise<T>) => Promise<{ result: T; duration: number }>;
}