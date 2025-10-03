/**
 * Authentication Type Definitions
 *
 * Type definitions for Ed25519 request authentication.
 */

import type { Request } from 'express';

/**
 * Authentication headers required for signed requests
 */
export interface AuthHeaders {
  'x-user-id': string;
  'x-signature-timestamp': string;
  'x-signature-ed25519': string;
}

/**
 * Authenticated user information
 */
export interface AuthenticatedUser {
  userId: number;
  publicKey: string;
  keyId: number;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Signature verification result
 */
export interface SignatureVerification {
  valid: boolean;
  error?: string;
}

/**
 * Timestamp validation configuration
 */
export interface TimestampConfig {
  maxAgeSeconds: number;
  clockSkewSeconds: number;
}
