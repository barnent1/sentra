"use strict";
/**
 * Jest Test Setup for API Package
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock external dependencies
globals_1.jest.mock('@sentra/core');
globals_1.jest.mock('express');
globals_1.jest.mock('socket.io');
globals_1.jest.mock('jsonwebtoken');
globals_1.jest.mock('bcryptjs');
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
        log: globals_1.jest.fn(),
        debug: globals_1.jest.fn(),
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
    };
});
afterAll(() => {
    // Cleanup
    globals_1.jest.clearAllMocks();
});
// Test server utilities
global.createTestServer = () => {
    const express = require('express');
    const request = require('supertest');
    const app = express();
    return { server: app, request: request(app) };
};
// API test helpers
global.createTestHeaders = (token) => {
    const headers = {
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
        emit: globals_1.jest.fn(),
        on: globals_1.jest.fn(),
        join: globals_1.jest.fn(),
        leave: globals_1.jest.fn(),
        disconnect: globals_1.jest.fn(),
    };
};
//# sourceMappingURL=setup.js.map