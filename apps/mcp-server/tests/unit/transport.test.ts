/**
 * Unit Tests: MCP Transport Layer
 *
 * Tests session management and transport creation.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createTransport,
  getTransport,
  cleanupAllSessions,
  getActiveSessionCount,
} from '../../src/mcp/transport.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

describe('MCP Transport Layer', () => {
  afterEach(() => {
    // Clean up all sessions after each test
    cleanupAllSessions();
  });

  describe('createTransport', () => {
    it('should create a new transport instance', () => {
      const sessionId = 'test-session-1';
      const transport = createTransport(sessionId);

      expect(transport).toBeInstanceOf(StreamableHTTPServerTransport);
      expect(transport).toBeDefined();
    });

    it('should store the transport in the sessions map', () => {
      const sessionId = 'test-session-2';
      createTransport(sessionId);

      const retrieved = getTransport(sessionId);
      expect(retrieved).toBeInstanceOf(StreamableHTTPServerTransport);
    });

    it('should increment active session count', () => {
      const initialCount = getActiveSessionCount();
      createTransport('session-1');
      createTransport('session-2');

      expect(getActiveSessionCount()).toBe(initialCount + 2);
    });

    it('should create different instances for different session IDs', () => {
      const transport1 = createTransport('session-a');
      const transport2 = createTransport('session-b');

      expect(transport1).not.toBe(transport2);
    });
  });

  describe('getTransport', () => {
    it('should return undefined for non-existent session', () => {
      const transport = getTransport('non-existent-session');

      expect(transport).toBeUndefined();
    });

    it('should return existing transport for valid session ID', () => {
      const sessionId = 'test-session-3';
      const created = createTransport(sessionId);
      const retrieved = getTransport(sessionId);

      expect(retrieved).toBe(created);
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return 0 when no sessions exist', () => {
      cleanupAllSessions();
      expect(getActiveSessionCount()).toBe(0);
    });

    it('should return correct count of active sessions', () => {
      createTransport('session-1');
      createTransport('session-2');
      createTransport('session-3');

      expect(getActiveSessionCount()).toBe(3);
    });
  });

  describe('cleanupAllSessions', () => {
    it('should remove all sessions', () => {
      createTransport('session-1');
      createTransport('session-2');
      createTransport('session-3');

      expect(getActiveSessionCount()).toBeGreaterThan(0);

      cleanupAllSessions();

      expect(getActiveSessionCount()).toBe(0);
    });

    it('should not throw when cleaning up empty sessions', () => {
      cleanupAllSessions();

      expect(() => cleanupAllSessions()).not.toThrow();
    });

    it('should make previously valid sessions unavailable', () => {
      const sessionId = 'session-to-cleanup';
      createTransport(sessionId);
      expect(getTransport(sessionId)).toBeDefined();

      cleanupAllSessions();

      expect(getTransport(sessionId)).toBeUndefined();
    });
  });
});
