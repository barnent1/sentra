/**
 * Jest Test Setup for Dashboard Package
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { jest } from '@jest/globals';
import { config } from '@vue/test-utils';

// Vue Test Utils global configuration
config.global.config.warnHandler = () => null;

// Mock external dependencies
jest.mock('@sentra/core');
jest.mock('vue-router');
jest.mock('chart.js');
jest.mock('socket.io-client');

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['VITE_API_BASE_URL'] = 'http://localhost:3001/api';
  process.env['VITE_WS_URL'] = 'http://localhost:3001';
  
  // Mock ResizeObserver for Chart.js
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as jest.MockedClass<typeof ResizeObserver>;
  
  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as jest.MockedClass<typeof IntersectionObserver>;
  
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

// Vue component test utilities
global.createMountOptions = (overrides = {}) => {
  return {
    global: {
      plugins: [],
      mocks: {
        $router: {
          push: jest.fn(),
          replace: jest.fn(),
          go: jest.fn(),
          back: jest.fn(),
          forward: jest.fn(),
        },
        $route: {
          path: '/',
          name: 'Home',
          params: {},
          query: {},
          meta: {},
        },
      },
    },
    ...overrides,
  };
};

// Mock API responses
global.createMockEvolutionData = () => {
  return {
    patterns: [
      {
        id: 'pattern-1',
        generation: 1,
        genetics: {
          successRate: 0.85,
          adaptationRate: 0.72,
          complexityIndex: 0.65,
        },
        performance: {
          responseTime: 150,
          throughput: 100,
          errorRate: 0.02,
        },
      },
    ],
    metrics: {
      totalEvolutions: 1000,
      successfulEvolutions: 850,
      averageGeneration: 5.2,
    },
  };
};

// Type declarations for global utilities
declare global {
  var createMountOptions: (overrides?: any) => any;
  var createMockEvolutionData: () => any;
}