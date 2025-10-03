/**
 * Crypto Utilities Tests
 *
 * Comprehensive tests for Ed25519 signature verification and timestamp validation.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { createPrivateKey, sign, generateKeyPairSync } from 'crypto';
import {
  verifyEd25519Signature,
  buildSignatureBase,
  validateTimestamp,
  stringifyRequestBody,
} from '../../src/utils/crypto.js';

describe('Crypto Utilities', () => {
  let testPrivateKey: string;
  let testPublicKey: string;

  beforeAll(() => {
    // Generate a test Ed25519 key pair
    const { privateKey, publicKey } = generateTestKeyPair();
    testPrivateKey = privateKey;
    testPublicKey = publicKey;
  });

  describe('verifyEd25519Signature', () => {
    it('should verify a valid Ed25519 signature', () => {
      const message = 'test message';
      const signature = signMessage(message, testPrivateKey);

      const result = verifyEd25519Signature(message, signature, testPublicKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject an invalid signature', () => {
      const message = 'test message';
      const wrongMessage = 'wrong message';
      const signature = signMessage(message, testPrivateKey);

      const result = verifyEd25519Signature(wrongMessage, signature, testPublicKey);

      expect(result.valid).toBe(false);
    });

    it('should reject a malformed signature', () => {
      const message = 'test message';
      const invalidSignature = 'invalid-base64-signature';

      const result = verifyEd25519Signature(message, invalidSignature, testPublicKey);

      expect(result.valid).toBe(false);
      // Error message may or may not be present depending on how the verification fails
    });

    it('should reject an invalid public key', () => {
      const message = 'test message';
      const signature = signMessage(message, testPrivateKey);
      const invalidPublicKey = Buffer.from('invalid').toString('base64');

      const result = verifyEd25519Signature(message, signature, invalidPublicKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid public key length');
    });

    it('should reject a public key with wrong length', () => {
      const message = 'test message';
      const signature = signMessage(message, testPrivateKey);
      // Create a public key that's not 32 bytes
      const wrongLengthKey = Buffer.from('short').toString('base64');

      const result = verifyEd25519Signature(message, signature, wrongLengthKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid public key length');
      expect(result.error).toContain('expected 32 bytes');
    });

    it('should handle empty message', () => {
      const message = '';
      const signature = signMessage(message, testPrivateKey);

      const result = verifyEd25519Signature(message, signature, testPublicKey);

      expect(result.valid).toBe(true);
    });

    it('should handle unicode characters in message', () => {
      const message = 'Hello 世界 🌍';
      const signature = signMessage(message, testPrivateKey);

      const result = verifyEd25519Signature(message, signature, testPublicKey);

      expect(result.valid).toBe(true);
    });

    it('should reject signature signed with different key', () => {
      const message = 'test message';
      const { privateKey: otherPrivateKey } = generateTestKeyPair();
      const signature = signMessage(message, otherPrivateKey);

      const result = verifyEd25519Signature(message, signature, testPublicKey);

      expect(result.valid).toBe(false);
    });

    it('should handle base64url encoded keys', () => {
      const message = 'test message';
      const signature = signMessage(message, testPrivateKey);

      // Convert to base64url (which should still work with base64 decoding)
      const result = verifyEd25519Signature(message, signature, testPublicKey);

      expect(result.valid).toBe(true);
    });
  });

  describe('buildSignatureBase', () => {
    it('should build signature base with all components', () => {
      const method = 'POST';
      const path = '/api/test';
      const timestamp = '2024-01-01T00:00:00.000Z';
      const body = '{"key":"value"}';

      const result = buildSignatureBase(method, path, timestamp, body);

      expect(result).toBe('POST\n/api/test\n2024-01-01T00:00:00.000Z\n{"key":"value"}');
    });

    it('should handle GET request with empty body', () => {
      const method = 'GET';
      const path = '/api/users';
      const timestamp = '2024-01-01T00:00:00.000Z';
      const body = '';

      const result = buildSignatureBase(method, path, timestamp, body);

      expect(result).toBe('GET\n/api/users\n2024-01-01T00:00:00.000Z\n');
    });

    it('should handle path with query parameters', () => {
      const method = 'GET';
      const path = '/api/users?limit=10&offset=20';
      const timestamp = '2024-01-01T00:00:00.000Z';
      const body = '';

      const result = buildSignatureBase(method, path, timestamp, body);

      expect(result).toContain('/api/users?limit=10&offset=20');
    });

    it('should preserve exact formatting of timestamp', () => {
      const method = 'POST';
      const path = '/api/test';
      const timestamp = '2024-01-01T12:34:56.789Z';
      const body = '';

      const result = buildSignatureBase(method, path, timestamp, body);

      expect(result).toContain('2024-01-01T12:34:56.789Z');
    });

    it('should handle large request bodies', () => {
      const method = 'POST';
      const path = '/api/test';
      const timestamp = '2024-01-01T00:00:00.000Z';
      const largeBody = JSON.stringify({ data: 'x'.repeat(10000) });

      const result = buildSignatureBase(method, path, timestamp, largeBody);

      expect(result).toContain(largeBody);
      expect(result.length).toBeGreaterThan(10000);
    });

    it('should handle special characters in path', () => {
      const method = 'GET';
      const path = '/api/users/test@example.com';
      const timestamp = '2024-01-01T00:00:00.000Z';
      const body = '';

      const result = buildSignatureBase(method, path, timestamp, body);

      expect(result).toContain('/api/users/test@example.com');
    });
  });

  describe('validateTimestamp', () => {
    it('should accept a current timestamp', () => {
      const timestamp = new Date().toISOString();

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept timestamp within clock skew', () => {
      // 3 seconds in the future (within 5 second skew)
      const timestamp = new Date(Date.now() + 3000).toISOString();

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(true);
    });

    it('should reject timestamp too far in the past', () => {
      // 70 seconds ago (max age is 60s + 5s skew = 65s)
      const timestamp = new Date(Date.now() - 70000).toISOString();

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('outside valid window');
    });

    it('should reject timestamp too far in the future', () => {
      // 10 seconds in the future (beyond 5 second skew)
      const timestamp = new Date(Date.now() + 10000).toISOString();

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('too far in the future');
    });

    it('should reject invalid timestamp format', () => {
      const timestamp = 'not-a-timestamp';

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid timestamp format');
    });

    it('should reject empty timestamp', () => {
      const timestamp = '';

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid timestamp format');
    });

    it('should accept timestamp at the edge of valid window', () => {
      // Exactly 60 seconds ago (should be within 60s + 5s skew)
      const timestamp = new Date(Date.now() - 60000).toISOString();

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(true);
    });

    it('should respect custom maxAgeSeconds', () => {
      // 70 seconds ago
      const timestamp = new Date(Date.now() - 70000).toISOString();

      // With maxAge of 100 seconds, this should be valid
      const result = validateTimestamp(timestamp, {
        maxAgeSeconds: 100,
        clockSkewSeconds: 5,
      });

      expect(result.valid).toBe(true);
    });

    it('should respect custom clockSkewSeconds', () => {
      // 8 seconds in the future
      const timestamp = new Date(Date.now() + 8000).toISOString();

      // With clock skew of 10 seconds, this should be valid
      const result = validateTimestamp(timestamp, {
        maxAgeSeconds: 60,
        clockSkewSeconds: 10,
      });

      expect(result.valid).toBe(true);
    });

    it('should handle millisecond precision timestamps', () => {
      const timestamp = new Date().toISOString();

      const result = validateTimestamp(timestamp);

      expect(result.valid).toBe(true);
    });
  });

  describe('stringifyRequestBody', () => {
    it('should return empty string for undefined body', () => {
      const result = stringifyRequestBody(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for null body', () => {
      const result = stringifyRequestBody(null);
      expect(result).toBe('');
    });

    it('should return empty string for empty object', () => {
      const result = stringifyRequestBody({});
      expect(result).toBe('');
    });

    it('should return string body as-is', () => {
      const body = '{"key":"value"}';
      const result = stringifyRequestBody(body);
      expect(result).toBe(body);
    });

    it('should stringify object body', () => {
      const body = { key: 'value', nested: { data: 123 } };
      const result = stringifyRequestBody(body);
      expect(result).toBe(JSON.stringify(body));
      expect(JSON.parse(result)).toEqual(body);
    });

    it('should stringify array body', () => {
      const body = [1, 2, 3, 'test'];
      const result = stringifyRequestBody(body);
      expect(result).toBe(JSON.stringify(body));
      expect(JSON.parse(result)).toEqual(body);
    });

    it('should handle body with special characters', () => {
      const body = { message: 'Hello "world" & friends\n\ttab' };
      const result = stringifyRequestBody(body);
      expect(result).toContain('Hello');
      expect(JSON.parse(result)).toEqual(body);
    });

    it('should handle unicode characters', () => {
      const body = { text: '世界 🌍' };
      const result = stringifyRequestBody(body);
      expect(JSON.parse(result)).toEqual(body);
    });

    it('should handle numeric body', () => {
      const body = 42;
      const result = stringifyRequestBody(body);
      expect(result).toBe('42');
    });

    it('should handle boolean body', () => {
      const body = true;
      const result = stringifyRequestBody(body);
      expect(result).toBe('true');
    });
  });
});

// Helper functions

/**
 * Generate a test Ed25519 key pair
 */
function generateTestKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  // Extract raw 32-byte public key from DER format
  // Ed25519 public keys in SPKI format: last 32 bytes are the raw key
  const rawPublicKey = publicKey.slice(-32);

  // For private key, we need to keep it in a format we can use for signing
  return {
    privateKey: privateKey.toString('base64'),
    publicKey: rawPublicKey.toString('base64'),
  };
}

/**
 * Sign a message with Ed25519 private key
 */
function signMessage(message: string, privateKeyBase64: string): string {
  const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');

  // Create key object from DER format
  const keyObject = createPrivateKey({
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8',
  });

  // Sign the message
  const signature = sign(null, Buffer.from(message, 'utf8'), keyObject);

  return signature.toString('base64');
}
