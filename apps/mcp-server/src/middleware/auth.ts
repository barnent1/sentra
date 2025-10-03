/**
 * Authentication Middleware
 *
 * Ed25519 request signature verification middleware.
 */

import type { Response, NextFunction } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { apiKeys } from '../../db/schema/auth.js';
import { AppError } from './errorHandler.js';
import { logger } from './logger.js';
import type { AuthenticatedRequest, AuthHeaders } from '../types/auth.js';
import {
  verifyEd25519Signature,
  validateTimestamp,
  buildSignatureBase,
  stringifyRequestBody,
} from '../utils/crypto.js';

/**
 * Extract authentication headers from request
 *
 * @param req - Express request
 * @returns Authentication headers or null if missing
 */
function extractAuthHeaders(req: AuthenticatedRequest): Partial<AuthHeaders> | null {
  const userId = req.headers['x-user-id'];
  const timestamp = req.headers['x-signature-timestamp'];
  const signature = req.headers['x-signature-ed25519'];

  return {
    'x-user-id': typeof userId === 'string' ? userId : undefined,
    'x-signature-timestamp': typeof timestamp === 'string' ? timestamp : undefined,
    'x-signature-ed25519': typeof signature === 'string' ? signature : undefined,
  };
}

/**
 * Verify request signature
 *
 * @param req - Express request
 * @param publicKey - User's Ed25519 public key
 * @param timestamp - Request timestamp
 * @param signature - Request signature
 * @returns True if signature is valid
 */
function verifyRequestSignature(
  req: AuthenticatedRequest,
  publicKey: string,
  timestamp: string,
  signature: string
): { valid: boolean; error?: string } {
  try {
    // Build the signature base string
    const method = req.method.toUpperCase();
    const path = req.originalUrl || req.url;
    const body = stringifyRequestBody(req.body);

    const signatureBase = buildSignatureBase(method, path, timestamp, body);

    logger.debug(
      {
        method,
        path,
        timestamp,
        bodyLength: body.length,
        signatureBaseLength: signatureBase.length,
      },
      'Built signature base'
    );

    // Verify the signature
    const verification = verifyEd25519Signature(signatureBase, signature, publicKey);

    return verification;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      valid: false,
      error: `Signature verification failed: ${errorMessage}`,
    };
  }
}

/**
 * Authentication middleware
 *
 * Verifies Ed25519 signatures on incoming requests.
 * Adds authenticated user information to req.user.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract authentication headers
    const headers = extractAuthHeaders(req);

    if (!headers || !headers['x-user-id'] || !headers['x-signature-timestamp'] || !headers['x-signature-ed25519']) {
      throw new AppError(
        'Missing required authentication headers: x-user-id, x-signature-timestamp, x-signature-ed25519',
        401,
        'AUTH_MISSING_HEADERS'
      );
    }

    const { 'x-user-id': userIdStr, 'x-signature-timestamp': timestamp, 'x-signature-ed25519': signature } = headers;

    // Parse user ID
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID format', 401, 'AUTH_INVALID_USER_ID');
    }

    // Validate timestamp
    const timestampValidation = validateTimestamp(timestamp);
    if (!timestampValidation.valid) {
      throw new AppError(
        timestampValidation.error || 'Invalid timestamp',
        401,
        'AUTH_INVALID_TIMESTAMP'
      );
    }

    // Query database for user's public key
    const userKey = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        publicKey: apiKeys.publicKey,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          isNull(apiKeys.revokedAt)
        )
      )
      .limit(1);

    if (!userKey || userKey.length === 0) {
      logger.warn({ userId }, 'No active API key found for user');
      throw new AppError('Invalid or revoked API key', 401, 'AUTH_INVALID_KEY');
    }

    const { id: keyId, publicKey } = userKey[0];

    // Verify the signature
    const signatureVerification = verifyRequestSignature(req, publicKey, timestamp, signature);

    if (!signatureVerification.valid) {
      logger.warn(
        { userId, error: signatureVerification.error },
        'Signature verification failed'
      );
      throw new AppError(
        signatureVerification.error || 'Invalid signature',
        401,
        'AUTH_INVALID_SIGNATURE'
      );
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyId))
      .execute()
      .catch((error) => {
        logger.error({ error, keyId }, 'Failed to update API key last used timestamp');
      });

    // Attach authenticated user to request
    req.user = {
      userId,
      publicKey,
      keyId,
    };

    logger.debug({ userId, keyId }, 'Request authenticated successfully');

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error({ error }, 'Unexpected error in authentication middleware');
      next(new AppError('Authentication failed', 401, 'AUTH_ERROR'));
    }
  }
}

/**
 * Optional authentication middleware
 *
 * Attempts to authenticate the request but allows it to proceed even if authentication fails.
 * Useful for endpoints that support both authenticated and unauthenticated access.
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if authentication headers are present
    const headers = extractAuthHeaders(req);

    if (!headers || !headers['x-user-id'] || !headers['x-signature-timestamp'] || !headers['x-signature-ed25519']) {
      // No auth headers, proceed without authentication
      next();
      return;
    }

    // Attempt authentication
    await authenticate(req, _res, (error?: unknown) => {
      if (error) {
        // Log the error but don't fail the request
        logger.debug({ error }, 'Optional authentication failed, proceeding without auth');
      }
      next();
    });
  } catch (error) {
    // Log the error but don't fail the request
    logger.debug({ error }, 'Optional authentication error, proceeding without auth');
    next();
  }
}
