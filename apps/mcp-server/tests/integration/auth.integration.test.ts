/**
 * Authentication Integration Tests
 *
 * End-to-end tests for Ed25519 authentication system with real database and signatures.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createPrivateKey, sign, generateKeyPairSync } from 'crypto';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/users.js';
import { apiKeys } from '../../db/schema/auth.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../../src/types/auth.js';
import type { Response, NextFunction } from 'express';
import { authenticate } from '../../src/middleware/auth.js';
import { buildSignatureBase } from '../../src/utils/crypto.js';

describe('Authentication Integration Tests', () => {
  let testUserId: number;
  let testKeyId: number;
  let testPublicKey: string;
  let testPrivateKey: string;

  beforeAll(async () => {
    // Generate Ed25519 key pair for testing
    const keyPair = generateEd25519KeyPair();
    testPublicKey = keyPair.publicKey;
    testPrivateKey = keyPair.privateKey;

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
      })
      .returning();

    testUserId = user.id;

    // Create API key for test user
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        userId: testUserId,
        publicKey: testPublicKey,
        name: 'Test API Key',
      })
      .returning();

    testKeyId = apiKey.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db.delete(apiKeys).where(eq(apiKeys.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('End-to-End Authentication Flow', () => {
    it('should successfully authenticate a valid signed request', async () => {
      const timestamp = new Date().toISOString();
      const method = 'POST';
      const path = '/api/test';
      const body = JSON.stringify({ data: 'test' });

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: JSON.parse(body),
      };

      const mockResponse = {} as Response;
      let nextCalled = false;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextCalled = true;
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextCalled).toBe(true);
      expect(nextError).toBeUndefined();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(testUserId);
      expect(mockRequest.user?.publicKey).toBe(testPublicKey);
      expect(mockRequest.user?.keyId).toBe(testKeyId);
    });

    it('should reject request with invalid signature', async () => {
      const timestamp = new Date().toISOString();
      const method = 'POST';
      const path = '/api/test';
      const body = JSON.stringify({ data: 'test' });

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      // Sign with a different key
      const { privateKey: wrongPrivateKey } = generateEd25519KeyPair();
      const signature = signMessageWithPrivateKey(signatureBase, wrongPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: JSON.parse(body),
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_INVALID_SIGNATURE');
    });

    it('should reject request with expired timestamp', async () => {
      // Timestamp 2 minutes ago (beyond 60s + 5s skew)
      const timestamp = new Date(Date.now() - 120000).toISOString();
      const method = 'GET';
      const path = '/api/test';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_INVALID_TIMESTAMP');
    });

    it('should reject request with missing headers', async () => {
      const mockRequest: Partial<AuthenticatedRequest> = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        body: {},
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_MISSING_HEADERS');
    });

    it('should reject request with invalid user ID', async () => {
      const timestamp = new Date().toISOString();
      const method = 'GET';
      const path = '/api/test';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': 'not-a-number',
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_INVALID_USER_ID');
    });

    it('should reject request for non-existent user', async () => {
      const timestamp = new Date().toISOString();
      const method = 'GET';
      const path = '/api/test';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': '999999', // Non-existent user
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_INVALID_KEY');
    });
  });

  describe('Signature Base Construction', () => {
    it('should handle GET request with query parameters', async () => {
      const timestamp = new Date().toISOString();
      const method = 'GET';
      const path = '/api/users?limit=10&offset=20';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextCalled = false;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextCalled = true;
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextCalled).toBe(true);
      expect(nextError).toBeUndefined();
    });

    it('should handle POST request with complex JSON body', async () => {
      const timestamp = new Date().toISOString();
      const method = 'POST';
      const path = '/api/data';
      const body = JSON.stringify({
        name: 'Test',
        nested: {
          value: 123,
          array: [1, 2, 3],
        },
        unicode: '世界 🌍',
      });

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: JSON.parse(body),
      };

      const mockResponse = {} as Response;
      let nextCalled = false;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextCalled = true;
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextCalled).toBe(true);
      expect(nextError).toBeUndefined();
    });

    it('should fail if body is modified after signing', async () => {
      const timestamp = new Date().toISOString();
      const method = 'POST';
      const path = '/api/test';
      const originalBody = JSON.stringify({ data: 'original' });

      const signatureBase = buildSignatureBase(method, path, timestamp, originalBody);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      // Send different body than what was signed
      const modifiedBody = { data: 'modified' };

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: modifiedBody,
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_INVALID_SIGNATURE');
    });
  });

  describe('API Key Management', () => {
    it('should reject revoked API key', async () => {
      // Revoke the API key
      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, testKeyId));

      const timestamp = new Date().toISOString();
      const method = 'GET';
      const path = '/api/test';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.statusCode).toBe(401);
      expect(nextError.code).toBe('AUTH_INVALID_KEY');

      // Un-revoke for other tests
      await db
        .update(apiKeys)
        .set({ revokedAt: null })
        .where(eq(apiKeys.id, testKeyId));
    });

    it('should update lastUsedAt timestamp on successful authentication', async () => {
      // Get current lastUsedAt
      const [keyBefore] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, testKeyId));

      const lastUsedBefore = keyBefore.lastUsedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const timestamp = new Date().toISOString();
      const method = 'GET';
      const path = '/api/test';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, timestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': timestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextCalled = false;

      const mockNext: NextFunction = () => {
        nextCalled = true;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextCalled).toBe(true);

      // Wait for fire-and-forget update to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check that lastUsedAt was updated
      const [keyAfter] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, testKeyId));

      const lastUsedAfter = keyAfter.lastUsedAt;

      if (lastUsedBefore === null) {
        expect(lastUsedAfter).not.toBeNull();
      } else {
        expect(lastUsedAfter).not.toBe(lastUsedBefore);
        expect(lastUsedAfter!.getTime()).toBeGreaterThan(lastUsedBefore.getTime());
      }
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject replayed request with old timestamp', async () => {
      // Create a request with an old timestamp (2 minutes ago)
      const oldTimestamp = new Date(Date.now() - 120000).toISOString();
      const method = 'POST';
      const path = '/api/test';
      const body = JSON.stringify({ data: 'test' });

      const signatureBase = buildSignatureBase(method, path, oldTimestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': oldTimestamp,
          'x-signature-ed25519': signature,
        },
        body: JSON.parse(body),
      };

      const mockResponse = {} as Response;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextError).toBeDefined();
      expect(nextError.code).toBe('AUTH_INVALID_TIMESTAMP');
    });

    it('should accept timestamp within valid window', async () => {
      // Create a request with a timestamp 30 seconds ago (within valid window)
      const recentTimestamp = new Date(Date.now() - 30000).toISOString();
      const method = 'GET';
      const path = '/api/test';
      const body = '';

      const signatureBase = buildSignatureBase(method, path, recentTimestamp, body);
      const signature = signMessageWithPrivateKey(signatureBase, testPrivateKey);

      const mockRequest: Partial<AuthenticatedRequest> = {
        method,
        url: path,
        originalUrl: path,
        headers: {
          'x-user-id': testUserId.toString(),
          'x-signature-timestamp': recentTimestamp,
          'x-signature-ed25519': signature,
        },
        body: {},
      };

      const mockResponse = {} as Response;
      let nextCalled = false;
      let nextError: any = undefined;

      const mockNext: NextFunction = (error?: any) => {
        nextCalled = true;
        nextError = error;
      };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse, mockNext);

      expect(nextCalled).toBe(true);
      expect(nextError).toBeUndefined();
    });
  });
});

// Helper functions

/**
 * Generate Ed25519 key pair
 */
function generateEd25519KeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  // Extract raw 32-byte public key from DER format
  const rawPublicKey = publicKey.slice(-32);

  return {
    privateKey: privateKey.toString('base64'),
    publicKey: rawPublicKey.toString('base64'),
  };
}

/**
 * Sign a message with Ed25519 private key
 */
function signMessageWithPrivateKey(message: string, privateKeyBase64: string): string {
  const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');

  const keyObject = createPrivateKey({
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8',
  });

  const signature = sign(null, Buffer.from(message, 'utf8'), keyObject);

  return signature.toString('base64');
}
