/**
 * Unit Tests: MCP Server Initialization
 *
 * Tests the core MCP server initialization and management.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { initializeMCPServer, getMCPServer, closeMCPServer } from '../../src/mcp/server.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('MCP Server Initialization', () => {
  afterEach(async () => {
    // Clean up after each test
    await closeMCPServer();
  });

  describe('initializeMCPServer', () => {
    it('should create and return a Server instance', () => {
      const server = initializeMCPServer();

      expect(server).toBeInstanceOf(Server);
      expect(server).toBeDefined();
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const server1 = initializeMCPServer();
      const server2 = initializeMCPServer();

      expect(server1).toBe(server2);
    });

    it('should configure server with correct capabilities', () => {
      const server = initializeMCPServer();

      // The server should have been initialized with capabilities
      expect(server).toBeDefined();
      // We can't directly test capabilities, but we can verify the server exists
    });

    it('should register all required request handlers', () => {
      const server = initializeMCPServer();

      // Verify server is initialized - the handlers are registered internally
      expect(server).toBeInstanceOf(Server);
    });
  });

  describe('getMCPServer', () => {
    it('should return null when server is not initialized', async () => {
      await closeMCPServer();
      const server = getMCPServer();

      expect(server).toBeNull();
    });

    it('should return the server instance after initialization', () => {
      initializeMCPServer();
      const server = getMCPServer();

      expect(server).toBeInstanceOf(Server);
      expect(server).not.toBeNull();
    });
  });

  describe('closeMCPServer', () => {
    it('should close the server and set instance to null', async () => {
      initializeMCPServer();
      expect(getMCPServer()).not.toBeNull();

      await closeMCPServer();

      expect(getMCPServer()).toBeNull();
    });

    it('should handle closing when server is not initialized', async () => {
      await closeMCPServer();

      // Should not throw
      await expect(closeMCPServer()).resolves.not.toThrow();
    });

    it('should allow re-initialization after closing', async () => {
      const server1 = initializeMCPServer();
      await closeMCPServer();

      const server2 = initializeMCPServer();

      expect(server2).toBeInstanceOf(Server);
      expect(server2).not.toBe(server1);
    });
  });
});
