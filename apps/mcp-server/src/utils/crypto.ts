/**
 * Cryptographic Utilities
 *
 * Ed25519 signature verification and timestamp validation utilities.
 */

import { createPublicKey, verify } from 'crypto';
import type { SignatureVerification, TimestampConfig } from '../types/auth.js';

/**
 * Default timestamp validation configuration
 */
const DEFAULT_TIMESTAMP_CONFIG: TimestampConfig = {
  maxAgeSeconds: 60,
  clockSkewSeconds: 5,
};

/**
 * Verify Ed25519 signature
 *
 * @param message - The message that was signed
 * @param signature - Base64-encoded Ed25519 signature
 * @param publicKey - Base64-encoded Ed25519 public key (32 bytes raw)
 * @returns Verification result
 */
export function verifyEd25519Signature(
  message: string,
  signature: string,
  publicKey: string
): SignatureVerification {
  try {
    // Decode the base64-encoded signature
    const signatureBuffer = Buffer.from(signature, 'base64');

    // Decode the base64-encoded public key (raw 32 bytes)
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');

    // Validate public key length (Ed25519 public keys are 32 bytes)
    if (publicKeyBuffer.length !== 32) {
      return {
        valid: false,
        error: `Invalid public key length: expected 32 bytes, got ${publicKeyBuffer.length}`,
      };
    }

    // Create Ed25519 public key object from raw bytes
    const keyObject = createPublicKey({
      key: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: publicKeyBuffer.toString('base64url'),
      },
      format: 'jwk',
    });

    // Verify the signature using Node.js crypto
    const isValid = verify(
      null, // Ed25519 doesn't use a hash algorithm
      Buffer.from(message, 'utf8'),
      keyObject,
      signatureBuffer
    );

    return { valid: isValid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      valid: false,
      error: `Signature verification failed: ${errorMessage}`,
    };
  }
}

/**
 * Build the signature base string
 *
 * Format: METHOD\nPATH\nTIMESTAMP\nBODY
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Request path
 * @param timestamp - ISO 8601 timestamp
 * @param body - Request body (empty string for GET requests)
 * @returns Signature base string
 */
export function buildSignatureBase(
  method: string,
  path: string,
  timestamp: string,
  body: string
): string {
  return `${method}\n${path}\n${timestamp}\n${body}`;
}

/**
 * Validate timestamp
 *
 * Checks if the timestamp is within the allowed window accounting for clock skew.
 *
 * @param timestamp - ISO 8601 timestamp string
 * @param config - Timestamp validation configuration
 * @returns True if timestamp is valid
 */
export function validateTimestamp(
  timestamp: string,
  config: TimestampConfig = DEFAULT_TIMESTAMP_CONFIG
): { valid: boolean; error?: string } {
  try {
    const requestTime = new Date(timestamp);
    const now = new Date();

    // Check if timestamp is a valid date
    if (isNaN(requestTime.getTime())) {
      return {
        valid: false,
        error: 'Invalid timestamp format',
      };
    }

    // Calculate time difference in seconds
    const diffSeconds = Math.abs((now.getTime() - requestTime.getTime()) / 1000);

    // Allow for clock skew
    const maxAllowedDiff = config.maxAgeSeconds + config.clockSkewSeconds;

    if (diffSeconds > maxAllowedDiff) {
      return {
        valid: false,
        error: `Timestamp outside valid window: ${diffSeconds.toFixed(0)}s difference (max ${maxAllowedDiff}s)`,
      };
    }

    // Check if timestamp is too far in the future (beyond clock skew)
    const futureSeconds = (requestTime.getTime() - now.getTime()) / 1000;
    if (futureSeconds > config.clockSkewSeconds) {
      return {
        valid: false,
        error: `Timestamp is too far in the future: ${futureSeconds.toFixed(0)}s`,
      };
    }

    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      valid: false,
      error: `Timestamp validation failed: ${errorMessage}`,
    };
  }
}

/**
 * Extract request body as string for signature verification
 *
 * @param body - Request body (parsed JSON or raw)
 * @returns Stringified body for signature base
 */
export function stringifyRequestBody(body: unknown): string {
  if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
    return '';
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
}
