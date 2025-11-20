/**
 * Encryption Service
 *
 * Provides AES-256-GCM encryption for sensitive data like API keys.
 * Uses crypto module (Node.js standard library) for cryptographic operations.
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2 key derivation
 * - Random IV per encryption
 * - Authentication tag for integrity
 *
 * Environment variables required:
 * - ENCRYPTION_SECRET: Master secret for key derivation
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

// Static salt for PBKDF2 (in production, consider per-user salts)
const SALT = 'sentra-encryption-salt-v1';

/**
 * Get encryption key from environment
 * Uses PBKDF2 to derive a strong encryption key from the secret
 */
const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable not set');
  }

  // Derive key using PBKDF2
  return crypto.pbkdf2Sync(secret, SALT, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
};

/**
 * Encrypt a string value
 * Returns format: iv:authTag:encrypted (all hex encoded)
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format "iv:authTag:ciphertext"
 * @throws Error if encryption fails
 */
export const encryptValue = (text: string): string => {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Decrypt an encrypted string
 * Expects format: iv:authTag:encrypted (all hex encoded)
 *
 * @param encryptedText - Encrypted string in format "iv:authTag:ciphertext"
 * @returns Decrypted plain text
 * @throws Error if decryption fails or format is invalid
 */
export const decryptValue = (encryptedText: string): string => {
  try {
    // Parse the encrypted format
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format. Expected format: iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert from hex
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    if (authTag.length !== TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${TAG_LENGTH}, got ${authTag.length}`);
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Test if encryption is configured correctly
 * @returns true if encryption secret is set
 */
export const isEncryptionConfigured = (): boolean => {
  return !!process.env.ENCRYPTION_SECRET;
};
