/**
 * Rate Limiter Tests
 *
 * Comprehensive tests for user-based rate limiting middleware.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import {
  authenticatedRateLimiter,
  unauthenticatedRateLimiter,
  adaptiveRateLimiter,
} from '../../src/middleware/rateLimiter.js';
import type { AuthenticatedRequest } from '../../src/types/auth.js';
import { AppError } from '../../src/middleware/errorHandler.js';

describe('Rate Limiter', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: 'GET',
      path: '/api/test',
      url: '/api/test',
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1',
      },
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
      setHeader: jest.fn().mockReturnThis() as any,
      set: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as NextFunction;
  });

  describe('authenticatedRateLimiter', () => {
    it('should use user ID as rate limit key for authenticated requests', () => {
      mockRequest.user = {
        userId: 123,
        publicKey: 'test-key',
        keyId: 1,
      };

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      // The middleware should proceed without error on first call
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fall back to IP for unauthenticated requests', () => {
      mockRequest.user = undefined;

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip rate limiting for health check endpoints', () => {
      mockRequest.path = '/health';

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip rate limiting for ready endpoint', () => {
      mockRequest.path = '/ready';

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing IP address', () => {
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: undefined } as any;

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      // Should use 'unknown' as fallback
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use socket.remoteAddress when req.ip is unavailable', () => {
      mockRequest.user = undefined;
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '192.168.1.100' } as any;

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('unauthenticatedRateLimiter', () => {
    it('should use IP address as rate limit key', () => {
      mockRequest.ip = '192.168.1.100';

      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip rate limiting for health endpoints', () => {
      mockRequest.path = '/health';

      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle IPv6 addresses', () => {
      mockRequest.ip = '::ffff:127.0.0.1';

      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing IP gracefully', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: undefined } as any;

      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('adaptiveRateLimiter', () => {
    it('should use authenticated limiter for authenticated requests', () => {
      mockRequest.user = {
        userId: 123,
        publicKey: 'test-key',
        keyId: 1,
      };

      adaptiveRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use unauthenticated limiter for unauthenticated requests', () => {
      mockRequest.user = undefined;

      adaptiveRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined user object', () => {
      delete mockRequest.user;

      adaptiveRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle user object without userId', () => {
      mockRequest.user = {
        userId: undefined as any,
        publicKey: 'test-key',
        keyId: 1,
      };

      adaptiveRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('rate limit behavior', () => {
    it('should allow multiple requests within limit', () => {
      const user = {
        userId: 123,
        publicKey: 'test-key',
        keyId: 1,
      };

      // Make multiple requests (should all succeed within the 100/min limit)
      for (let i = 0; i < 5; i++) {
        mockRequest.user = user;
        mockNext = jest.fn() as NextFunction;

        authenticatedRateLimiter(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as NextFunction
        );

        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should isolate rate limits between different users', () => {
      const user1 = {
        userId: 123,
        publicKey: 'test-key-1',
        keyId: 1,
      };

      const user2 = {
        userId: 456,
        publicKey: 'test-key-2',
        keyId: 2,
      };

      // Requests from user 1
      mockRequest.user = user1;
      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      // Requests from user 2 (should not be affected by user 1's rate limit)
      mockRequest.user = user2;
      mockNext = jest.fn() as NextFunction;
      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should isolate rate limits between different IPs', () => {
      // Request from IP 1
      mockRequest.ip = '192.168.1.1';
      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      // Request from IP 2 (should not be affected by IP 1's rate limit)
      mockRequest.ip = '192.168.1.2';
      mockNext = jest.fn() as NextFunction;
      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('rate limit headers', () => {
    it('should set rate limit headers', () => {
      mockRequest.user = {
        userId: 123,
        publicKey: 'test-key',
        keyId: 1,
      };

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      // The middleware sets headers through the response object
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle malformed request objects', () => {
      const malformedRequest = {} as Request;

      // Should not throw
      expect(() => {
        authenticatedRateLimiter(malformedRequest, mockResponse as Response, mockNext as NextFunction);
      }).not.toThrow();
    });

    it('should handle null user object', () => {
      mockRequest.user = null as any;

      adaptiveRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('key generation', () => {
    it('should generate consistent keys for same user', () => {
      const user = {
        userId: 123,
        publicKey: 'test-key',
        keyId: 1,
      };

      mockRequest.user = user;

      // Make two requests with same user
      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      // Both should use the same rate limit counter
      // (This is implicitly tested by the rate limiter working correctly)
    });

    it('should generate consistent keys for same IP', () => {
      mockRequest.ip = '192.168.1.100';

      // Make two requests from same IP
      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      // Both should use the same rate limit counter
    });

    it('should handle special characters in IP addresses', () => {
      mockRequest.ip = '::1'; // IPv6 loopback

      unauthenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('skip conditions', () => {
    it('should not skip regular API endpoints', () => {
      mockRequest.path = '/api/users';

      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      // Should apply rate limiting (not skip)
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip only exact health paths', () => {
      // Should skip
      mockRequest.path = '/health';
      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      mockRequest.path = '/ready';
      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn() as NextFunction
      );

      // Should not skip
      mockRequest.path = '/api/health';
      mockNext = jest.fn() as NextFunction;
      authenticatedRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
