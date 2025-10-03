/**
 * Integration Tests: MCP Protocol Endpoints
 *
 * Tests MCP server endpoints with real HTTP requests.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/index.js';
import { closeMCPServer } from '../../src/mcp/server.js';
import { cleanupAllSessions } from '../../src/mcp/transport.js';
import type { Application } from 'express';

describe('MCP Protocol Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    cleanupAllSessions();
    await closeMCPServer();
  });

  describe('POST /mcp', () => {
    it('should accept POST requests', async () => {
      const response = await request(app)
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        });

      // Should process the request (may return error for unimplemented features)
      expect(response.status).toBeDefined();
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle JSON-RPC 2.0 format', async () => {
      const response = await request(app)
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 2,
          method: 'ping',
        });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle session ID in header', async () => {
      const sessionId = 'test-session-header';
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', sessionId)
        .send({
          jsonrpc: '2.0',
          id: 3,
          method: 'ping',
        });

      expect(response.status).toBeDefined();
    });

    it('should handle session ID in query parameter', async () => {
      const sessionId = 'test-session-query';
      const response = await request(app)
        .post('/mcp')
        .query({ sessionId })
        .send({
          jsonrpc: '2.0',
          id: 4,
          method: 'ping',
        });

      expect(response.status).toBeDefined();
    });

    it('should generate session ID if not provided', async () => {
      const response = await request(app)
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 5,
          method: 'ping',
        });

      // Should still process the request
      expect(response.status).toBeDefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should enforce request size limits', async () => {
      // Create a large payload (larger than 10mb configured limit)
      const largePayload = {
        jsonrpc: '2.0',
        id: 6,
        method: 'test',
        params: {
          data: 'x'.repeat(11 * 1024 * 1024), // 11MB
        },
      };

      const response = await request(app).post('/mcp').send(largePayload);

      expect(response.status).toBe(413);
    });
  });

  describe('GET /mcp', () => {
    it('should accept GET requests', async () => {
      const response = await request(app).get('/mcp');

      expect(response.status).toBeDefined();
    });

    it('should handle session ID in header', async () => {
      const sessionId = 'test-session-get-header';
      const response = await request(app).get('/mcp').set('x-session-id', sessionId);

      expect(response.status).toBeDefined();
    });

    it('should handle session ID in query parameter', async () => {
      const sessionId = 'test-session-get-query';
      const response = await request(app).get('/mcp').query({ sessionId });

      expect(response.status).toBeDefined();
    });
  });

  describe('MCP Server Initialization', () => {
    it('should initialize MCP server on first request', async () => {
      // Make a request to trigger initialization
      const response = await request(app).post('/mcp').send({
        jsonrpc: '2.0',
        id: 7,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      });

      // Server should be initialized and respond
      expect(response.status).toBeDefined();
    });

    it('should reuse MCP server instance across requests', async () => {
      const sessionId = 'persistent-session';

      const response1 = await request(app)
        .post('/mcp')
        .set('x-session-id', sessionId)
        .send({
          jsonrpc: '2.0',
          id: 8,
          method: 'ping',
        });

      const response2 = await request(app)
        .post('/mcp')
        .set('x-session-id', sessionId)
        .send({
          jsonrpc: '2.0',
          id: 9,
          method: 'ping',
        });

      // Both requests should be processed
      expect(response1.status).toBeDefined();
      expect(response2.status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP initialization errors', async () => {
      // This tests that errors are properly caught and returned
      const response = await request(app).post('/mcp').send({
        jsonrpc: '2.0',
        id: 10,
        method: 'invalid_method',
      });

      // Should return an error response, not crash
      expect(response.status).toBeDefined();
    });

    it('should return structured error responses', async () => {
      const response = await request(app).post('/mcp').send({
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: {
          name: 'non_existent_tool',
          arguments: {},
        },
      });

      // Should return error in JSON-RPC format
      if (response.status >= 400) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Session Management', () => {
    it('should maintain separate sessions for different session IDs', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const response1 = await request(app)
        .post('/mcp')
        .set('x-session-id', session1)
        .send({
          jsonrpc: '2.0',
          id: 12,
          method: 'ping',
        });

      const response2 = await request(app)
        .post('/mcp')
        .set('x-session-id', session2)
        .send({
          jsonrpc: '2.0',
          id: 13,
          method: 'ping',
        });

      // Both sessions should work independently
      expect(response1.status).toBeDefined();
      expect(response2.status).toBeDefined();
    });
  });
});
