/**
 * Jest Test Setup for API Package
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('@sentra/core');
jest.mock('express');
jest.mock('socket.io');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['PORT'] = '3001';
  process.env['JWT_SECRET'] = 'test-jwt-secret';
  process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/sentra_test';
  process.env['OPENAI_API_KEY'] = 'test-api-key';
  process.env['QDRANT_URL'] = 'http://localhost:6333';
  
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

// Test server utilities
global.createTestServer = (): { server: any; request: any } => {
  const express = require('express');
  const request = require('supertest');
  const app = express();
  return { server: app, request: request(app) };
};

// API test helpers
global.createTestHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// WebSocket test utilities
global.createMockSocket = () => {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
  };
};

// Type declarations for global utilities
declare global {
  var createTestServer: () => { server: any; request: any };
  var createTestHeaders: (token?: string) => Record<string, string>;
  var createMockSocket: () => any;
}