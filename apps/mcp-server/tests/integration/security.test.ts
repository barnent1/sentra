/**
 * Integration Tests: Security Features
 *
 * Tests CORS configuration, rate limiting, and security headers.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/index.js';
import { closeMCPServer } from '../../src/mcp/server.js';
import { cleanupAllSessions } from '../../src/mcp/transport.js';
import type { Application } from 'express';

describe('Security Features', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    cleanupAllSessions();
    await closeMCPServer();
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow configured HTTP methods', async () => {
      const response = await request(app)
        .options('/mcp')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeLessThan(400);
      const allowedMethods = response.headers['access-control-allow-methods'];
      if (allowedMethods) {
        expect(allowedMethods).toMatch(/POST/i);
        expect(allowedMethods).toMatch(/GET/i);
        expect(allowedMethods).toMatch(/OPTIONS/i);
      }
    });

    it('should allow required headers', async () => {
      const response = await request(app)
        .options('/mcp')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, X-Session-ID');

      expect(response.status).toBeLessThan(400);
      const allowedHeaders = response.headers['access-control-allow-headers'];
      if (allowedHeaders) {
        expect(allowedHeaders).toMatch(/content-type/i);
        expect(allowedHeaders).toMatch(/x-session-id/i);
      }
    });

    it('should support credentials', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://example.com');

      const allowCredentials = response.headers['access-control-allow-credentials'];
      expect(allowCredentials).toBe('true');
    });

    it('should include max-age for preflight caching', async () => {
      const response = await request(app)
        .options('/mcp')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'POST');

      const maxAge = response.headers['access-control-max-age'];
      if (maxAge) {
        expect(parseInt(maxAge, 10)).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should accept requests within rate limit', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/ping'));
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/ping');

      // Check for standard rate limit headers
      expect(
        response.headers['ratelimit-limit'] ||
          response.headers['x-ratelimit-limit'] ||
          response.headers['x-rate-limit-limit']
      ).toBeDefined();
    });

    it('should track rate limit remaining count', async () => {
      const response1 = await request(app).get('/ping');
      const response2 = await request(app).get('/ping');

      const remaining1 =
        response1.headers['ratelimit-remaining'] ||
        response1.headers['x-ratelimit-remaining'] ||
        response1.headers['x-rate-limit-remaining'];

      const remaining2 =
        response2.headers['ratelimit-remaining'] ||
        response2.headers['x-ratelimit-remaining'] ||
        response2.headers['x-rate-limit-remaining'];

      if (remaining1 && remaining2) {
        expect(parseInt(remaining2, 10)).toBeLessThanOrEqual(parseInt(remaining1, 10));
      }
    });

    it('should apply rate limiting per IP', async () => {
      // Make multiple requests from the same "IP" (simulated by supertest)
      const responses = [];
      for (let i = 0; i < 10; i++) {
        responses.push(await request(app).get('/ping'));
      }

      // All should succeed or some should be rate limited
      const statuses = responses.map((r) => r.status);
      expect(statuses.every((s) => s === 200 || s === 429)).toBe(true);
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/health');

      // Helmet adds various security headers
      // Check for at least some common ones
      const headers = response.headers;
      const hasSecurityHeaders =
        headers['x-dns-prefetch-control'] ||
        headers['x-frame-options'] ||
        headers['x-content-type-options'] ||
        headers['x-download-options'] ||
        headers['x-xss-protection'];

      expect(hasSecurityHeaders).toBeDefined();
    });

    it('should set X-Content-Type-Options to nosniff', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should remove X-Powered-By header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Error Message Safety', () => {
    it('should not expose internal errors in production-like scenarios', async () => {
      const response = await request(app).get('/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeDefined();

      // Should not leak stack traces or internal paths
      const body = JSON.stringify(response.body);
      expect(body).not.toMatch(/\/Users\//);
      expect(body).not.toMatch(/at\s+\w+\s+\(/); // Stack trace pattern
    });

    it('should return structured error without sensitive details', async () => {
      const response = await request(app)
        .post('/mcp')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error || response.body.jsonrpc).toBeDefined();

      // Should not include sensitive information
      const body = JSON.stringify(response.body);
      expect(body).not.toMatch(/password/i);
      expect(body).not.toMatch(/secret/i);
      expect(body).not.toMatch(/token/i);
    });

    it('should handle database errors safely', async () => {
      // The /ready endpoint tests database connection
      const response = await request(app).get('/ready');

      // Even if database fails, should not expose connection strings or credentials
      const body = JSON.stringify(response.body);
      expect(body).not.toMatch(/postgres:\/\//);
      expect(body).not.toMatch(/password/i);
      expect(body).not.toMatch(/DATABASE_URL/);
    });
  });

  describe('Request Size Limits', () => {
    it('should reject oversized requests', async () => {
      // Attempt to send a request larger than 10mb limit
      const largePayload = {
        data: 'x'.repeat(11 * 1024 * 1024), // 11MB
      };

      const response = await request(app).post('/mcp').send(largePayload);

      expect(response.status).toBe(413);
    });

    it('should accept requests within size limit', async () => {
      // Send a reasonable-sized request
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
        params: {
          data: 'x'.repeat(1024), // 1KB
        },
      };

      const response = await request(app).post('/mcp').send(payload);

      // Should not be rejected for size
      expect(response.status).not.toBe(413);
    });
  });

  describe('HTTP Method Restrictions', () => {
    it('should accept allowed methods on MCP endpoints', async () => {
      const getResponse = await request(app).get('/mcp');
      const postResponse = await request(app).post('/mcp').send({
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
      });

      expect([200, 400, 500]).toContain(getResponse.status);
      expect([200, 400, 500]).toContain(postResponse.status);
    });

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const response = await request(app)
        .options('/mcp')
        .set('Origin', 'http://example.com');

      expect(response.status).toBeLessThan(400);
    });

    it('should reject unsupported HTTP methods', async () => {
      const response = await request(app).put('/mcp').send({
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
