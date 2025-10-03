/**
 * Authentication Middleware Tests
 *
 * Comprehensive tests for Ed25519 authentication middleware.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from '../../src/middleware/auth.js';
import type { AuthenticatedRequest } from '../../src/types/auth.js';
import { AppError } from '../../src/middleware/errorHandler.js';

// Import before mocking
import { db } from '../../db/index.js';
import * as crypto from '../../src/utils/crypto.js';

// Mock dependencies
jest.mock('../../db/index.js');
jest.mock('../../src/middleware/logger.js');
jest.mock('../../src/utils/crypto.js');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockDbSelect: any;
  let mockDbUpdate: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      method: 'POST',
      url: '/api/test',
      originalUrl: '/api/test',
      headers: {},
      body: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    // Setup mock next function
    mockNext = jest.fn() as NextFunction;

    // Setup mock db chain
    mockDbUpdate = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: (jest.fn() as any).mockResolvedValue(undefined),
    } as any;

    mockDbSelect = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: (jest.fn() as any).mockResolvedValue([
        {
          id: 1,
          userId: 123,
          publicKey: 'test-public-key',
          revokedAt: null,
        },
      ]),
    } as any;

    (db.select as jest.Mock).mockReturnValue(mockDbSelect);
    (db.update as jest.Mock).mockReturnValue(mockDbUpdate);

    // Setup default crypto mock responses
    (crypto.validateTimestamp as jest.Mock).mockReturnValue({ valid: true });
    (crypto.buildSignatureBase as jest.Mock).mockReturnValue('signature-base');
    (crypto.stringifyRequestBody as jest.Mock).mockReturnValue('{}');
    (crypto.verifyEd25519Signature as jest.Mock).mockReturnValue({ valid: true });
  });

  describe('authenticate', () => {
    it('should successfully authenticate valid request', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.user).toEqual({
        userId: 123,
        publicKey: 'test-public-key',
        keyId: 1,
      });
    });

    it('should reject request with missing x-user-id header', async () => {
      mockRequest.headers = {
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_MISSING_HEADERS');
      expect(error.message).toContain('Missing required authentication headers');
    });

    it('should reject request with missing timestamp header', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-ed25519': 'valid-signature',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.code).toBe('AUTH_MISSING_HEADERS');
    });

    it('should reject request with missing signature header', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.code).toBe('AUTH_MISSING_HEADERS');
    });

    it('should reject request with invalid user ID format', async () => {
      mockRequest.headers = {
        'x-user-id': 'not-a-number',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_INVALID_USER_ID');
    });

    it('should reject request with invalid timestamp', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      (crypto.validateTimestamp as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Timestamp expired',
      });

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_INVALID_TIMESTAMP');
      expect(error.message).toContain('Timestamp expired');
    });

    it('should reject request when user has no API key', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      mockDbSelect.limit.mockResolvedValue([]);

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_INVALID_KEY');
    });

    it('should reject request with revoked API key', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      mockDbSelect.limit.mockResolvedValue([
        {
          id: 1,
          userId: 123,
          publicKey: 'test-public-key',
          revokedAt: new Date(),
        },
      ]);

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject request with invalid signature', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'invalid-signature',
      };

      (crypto.verifyEd25519Signature as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Invalid signature',
      });

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_INVALID_SIGNATURE');
    });

    it('should build correct signature base for POST request', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };
      mockRequest.method = 'POST';
      mockRequest.originalUrl = '/api/test';
      mockRequest.body = { data: 'test' };

      (crypto.stringifyRequestBody as jest.Mock).mockReturnValue('{"data":"test"}');

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(crypto.buildSignatureBase).toHaveBeenCalledWith(
        'POST',
        '/api/test',
        '2024-01-01T00:00:00.000Z',
        '{"data":"test"}'
      );
    });

    it('should build correct signature base for GET request', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };
      mockRequest.method = 'GET';
      mockRequest.originalUrl = '/api/users?limit=10';
      mockRequest.body = {};

      (crypto.stringifyRequestBody as jest.Mock).mockReturnValue('');

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(crypto.buildSignatureBase).toHaveBeenCalledWith(
        'GET',
        '/api/users?limit=10',
        '2024-01-01T00:00:00.000Z',
        ''
      );
    });

    it('should update API key lastUsedAt timestamp', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Wait a bit for the fire-and-forget update
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(db.update).toHaveBeenCalled();
      expect(mockDbUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastUsedAt: expect.any(Date),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      mockDbSelect.limit.mockRejectedValue(new Error('Database connection failed'));

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_ERROR');
    });

    it('should handle array headers correctly', async () => {
      mockRequest.headers = {
        'x-user-id': ['123', '456'], // Sometimes headers can be arrays
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Should reject array headers
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle uppercase HTTP methods', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };
      mockRequest.method = 'post'; // lowercase

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(crypto.buildSignatureBase).toHaveBeenCalledWith(
        'POST', // Should be uppercase
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('optionalAuthenticate', () => {
    it('should proceed without error when no auth headers present', async () => {
      mockRequest.headers = {};

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should authenticate when valid auth headers present', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
    });

    it('should proceed without error when auth fails', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'invalid-signature',
      };

      (crypto.verifyEd25519Signature as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Invalid signature',
      });

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Should not throw or call next with error
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should proceed when only some auth headers present', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        // Missing other headers
      };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };

      mockDbSelect.limit.mockRejectedValue(new Error('Database error'));

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Should not throw, just proceed without auth
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('signature base construction', () => {
    it('should handle complex request paths', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };
      mockRequest.originalUrl = '/api/v2/users/test@example.com?filter=active&sort=name';

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(crypto.buildSignatureBase).toHaveBeenCalledWith(
        expect.any(String),
        '/api/v2/users/test@example.com?filter=active&sort=name',
        expect.any(String),
        expect.any(String)
      );
    });

    it('should prefer originalUrl over url', async () => {
      mockRequest.headers = {
        'x-user-id': '123',
        'x-signature-timestamp': '2024-01-01T00:00:00.000Z',
        'x-signature-ed25519': 'valid-signature',
      };
      mockRequest.url = '/api/test';
      mockRequest.originalUrl = '/api/original';

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(crypto.buildSignatureBase).toHaveBeenCalledWith(
        expect.any(String),
        '/api/original',
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
