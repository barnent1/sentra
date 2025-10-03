/**
 * Integration Tests: Health Check Endpoints
 *
 * Tests /ping, /health, and /ready endpoints with real HTTP requests.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/index.js';
import type { Application } from 'express';
import { db } from '../../db/index.js';
import { sql } from 'drizzle-orm';

describe('Health Check Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /ping', () => {
    it('should return pong message', async () => {
      const response = await request(app).get('/ping');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'pong' });
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      await request(app).get('/ping');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });

    it('should return health status object', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should return positive uptime', async () => {
      const response = await request(app).get('/health');

      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should have uptime that increases over time', async () => {
      const response1 = await request(app).get('/health');
      await new Promise((resolve) => setTimeout(resolve, 100));
      const response2 = await request(app).get('/health');

      expect(response2.body.uptime).toBeGreaterThan(response1.body.uptime);
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/ready');

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(ok|error)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        database: expect.objectContaining({
          connected: expect.any(Boolean),
        }),
      });
    });

    it('should include database latency when connected', async () => {
      const response = await request(app).get('/ready');

      if (response.body.database.connected) {
        expect(response.body.database.latency).toBeDefined();
        expect(typeof response.body.database.latency).toBe('number');
        expect(response.body.database.latency).toBeGreaterThan(0);
      }
    });

    it('should return 200 when database is connected', async () => {
      // First verify database is actually connected
      let dbConnected = false;
      try {
        await db.execute(sql`SELECT 1`);
        dbConnected = true;
      } catch (error) {
        // Database not available
      }

      const response = await request(app).get('/ready');

      if (dbConnected) {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.database.connected).toBe(true);
      } else {
        expect(response.status).toBe(503);
        expect(response.body.status).toBe('error');
        expect(response.body.database.connected).toBe(false);
      }
    });

    it('should measure database latency accurately', async () => {
      const response = await request(app).get('/ready');

      if (response.body.database.connected) {
        // Latency should be reasonable (less than 1 second for local DB)
        expect(response.body.database.latency).toBeLessThan(1000);
      }
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const response = await request(app).get('/ready');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should handle database check failure gracefully', async () => {
      const response = await request(app).get('/ready');

      // Should always return a valid response structure
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toHaveProperty('connected');
    });
  });

  describe('Health Endpoints - Common Behavior', () => {
    it('should return JSON content type', async () => {
      const endpoints = ['/ping', '/health', '/ready'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });

    it('should not require authentication', async () => {
      const endpoints = ['/ping', '/health', '/ready'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        // Should not return 401 or 403
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      }
    });
  });
});
