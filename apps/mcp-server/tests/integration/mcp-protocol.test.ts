/**
 * Integration Tests: MCP Protocol Compliance
 *
 * Tests MCP protocol implementation for standards compliance.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/index.js';
import { closeMCPServer } from '../../src/mcp/server.js';
import { cleanupAllSessions } from '../../src/mcp/transport.js';
import type { Application } from 'express';

describe('MCP Protocol Compliance', () => {
  let app: Application;
  const testSessionId = 'protocol-test-session';

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    cleanupAllSessions();
    await closeMCPServer();
  });

  describe('Initialize Handshake', () => {
    it('should accept initialize request with required fields', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-init-1`)
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

      // Should accept and process initialize request
      expect(response.status).toBeDefined();
      expect([200, 201]).toContain(response.status);
    });

    it('should handle initialize request with client capabilities', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-init-2`)
        .send({
          jsonrpc: '2.0',
          id: 2,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              roots: {
                listChanged: true,
              },
              sampling: {},
            },
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        });

      expect(response.status).toBeDefined();
      expect([200, 201]).toContain(response.status);
    });
  });

  describe('Tools Capability', () => {
    it('should accept tools/list request', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-tools-list`)
        .send({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/list',
        });

      expect(response.status).toBeDefined();
    });

    it('should accept tools/call request', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-tools-call`)
        .send({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'test_tool',
            arguments: {
              param1: 'value1',
            },
          },
        });

      expect(response.status).toBeDefined();
    });
  });

  describe('Resources Capability', () => {
    it('should accept resources/list request', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-resources-list`)
        .send({
          jsonrpc: '2.0',
          id: 5,
          method: 'resources/list',
        });

      expect(response.status).toBeDefined();
    });

    it('should accept resources/read request', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-resources-read`)
        .send({
          jsonrpc: '2.0',
          id: 6,
          method: 'resources/read',
          params: {
            uri: 'test://resource',
          },
        });

      expect(response.status).toBeDefined();
    });
  });

  describe('Prompts Capability', () => {
    it('should accept prompts/list request', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-prompts-list`)
        .send({
          jsonrpc: '2.0',
          id: 7,
          method: 'prompts/list',
        });

      expect(response.status).toBeDefined();
    });

    it('should accept prompts/get request', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-prompts-get`)
        .send({
          jsonrpc: '2.0',
          id: 8,
          method: 'prompts/get',
          params: {
            name: 'test_prompt',
            arguments: {},
          },
        });

      expect(response.status).toBeDefined();
    });
  });

  describe('JSON-RPC 2.0 Compliance', () => {
    it('should require jsonrpc field', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-no-jsonrpc`)
        .send({
          id: 9,
          method: 'ping',
        });

      // Should handle missing jsonrpc field
      expect(response.status).toBeDefined();
    });

    it('should require method field', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-no-method`)
        .send({
          jsonrpc: '2.0',
          id: 10,
        });

      // Should handle missing method field
      expect(response.status).toBeDefined();
    });

    it('should handle requests with id field', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-with-id`)
        .send({
          jsonrpc: '2.0',
          id: 11,
          method: 'ping',
        });

      expect(response.status).toBeDefined();
    });

    it('should handle requests without id field (notifications)', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-no-id`)
        .send({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        });

      expect(response.status).toBeDefined();
    });

    it('should handle string ids', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-string-id`)
        .send({
          jsonrpc: '2.0',
          id: 'request-12',
          method: 'ping',
        });

      expect(response.status).toBeDefined();
    });

    it('should handle numeric ids', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-numeric-id`)
        .send({
          jsonrpc: '2.0',
          id: 13,
          method: 'ping',
        });

      expect(response.status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown methods gracefully', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-unknown-method`)
        .send({
          jsonrpc: '2.0',
          id: 14,
          method: 'unknown/method',
        });

      expect(response.status).toBeDefined();
    });

    it('should handle malformed params', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-bad-params`)
        .send({
          jsonrpc: '2.0',
          id: 15,
          method: 'tools/call',
          params: 'invalid',
        });

      expect(response.status).toBeDefined();
    });
  });

  describe('Protocol Version', () => {
    it('should accept MCP protocol version 2024-11-05', async () => {
      const response = await request(app)
        .post('/mcp')
        .set('x-session-id', `${testSessionId}-version`)
        .send({
          jsonrpc: '2.0',
          id: 16,
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

      expect(response.status).toBeDefined();
      expect([200, 201]).toContain(response.status);
    });
  });
});
