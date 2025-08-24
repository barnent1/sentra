import crypto from 'crypto';
import * as argon2 from 'argon2';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  SECRET = 'secret'
}

export enum DataType {
  GENERAL = 'general',
  SOURCE_CODE = 'source_code',
  ENVIRONMENT_VARIABLES = 'environment_variables',
  API_KEYS = 'api_keys',
  DATABASE_CREDENTIALS = 'database_credentials',
  CLIENT_DATA = 'client_data',
  AGENT_CONTEXT = 'agent_context',
  USER_DATA = 'user_data'
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  checksum: string;
  algorithm: string;
  keyDerivation: string;
  dataType: DataType;
  classification: DataClassification;
  timestamp: string;
  version: string;
}

export interface StorageEncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  encryptedDEK: string;
  keyId: string;
  classification: DataClassification;
  algorithm: string;
  timestamp: string;
}

export interface EncryptedSecret {
  value: string;
  iv: string;
  authTag: string;
  algorithm: string;
  encryptedAt: string;
  keyVersion: number;
}

export interface EncryptedSecrets {
  projectId: string;
  userId: string;
  secrets: Record<string, EncryptedSecret>;
  keyVersion: number;
  timestamp: string;
}

export interface DataEncryptionKey {
  keyId: string;
  key: Buffer;
  classification: DataClassification;
  createdAt: string;
  algorithm: string;
  expiresAt?: string;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationAlgorithm = 'argon2id';
  private readonly masterKey: Buffer;
  
  constructor() {
    // Initialize master key from environment or generate one
    const masterKeyString = process.env.MASTER_KEY || this.generateMasterKey();
    this.masterKey = Buffer.from(masterKeyString, 'base64');
    
    if (this.masterKey.length !== 32) {
      throw new Error('Master key must be 256 bits (32 bytes)');
    }
  }

  // Generate a secure master key
  private generateMasterKey(): string {
    const key = crypto.randomBytes(32);
    const base64Key = key.toString('base64');
    
    logger.warn('Generated new master key', {
      note: 'Store this key securely: ' + base64Key
    });
    
    return base64Key;
  }

  // Client-side encryption for sensitive data
  async encryptClientSide(
    data: any,
    userPassword: string,
    totpToken: string,
    dataType: DataType = DataType.GENERAL,
    classification: DataClassification = DataClassification.CONFIDENTIAL
  ): Promise<EncryptedData> {
    try {
      // Derive user-specific encryption key
      const userKey = await this.deriveUserKey(userPassword, totpToken, dataType);
      
      // Serialize data
      const serializedData = JSON.stringify(data);
      
      // Generate random IV
      const iv = crypto.randomBytes(16);
      
      // Encrypt using AES-256-GCM
      const cipher = crypto.createCipher(this.algorithm, userKey);
      cipher.setAAD(Buffer.from(dataType, 'utf8')); // Additional authenticated data
      
      let encrypted = cipher.update(serializedData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Create checksum for integrity verification
      const checksum = crypto
        .createHash('sha256')
        .update(encrypted + iv.toString('hex') + authTag.toString('hex'))
        .digest('hex');
      
      const result: EncryptedData = {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        checksum,
        algorithm: this.algorithm,
        keyDerivation: this.keyDerivationAlgorithm,
        dataType,
        classification,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // Log encryption event (without sensitive data)
      logger.info('Data encrypted', {
        dataType,
        classification,
        algorithm: this.algorithm,
        keyDerivation: this.keyDerivationAlgorithm,
        size: serializedData.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Client-side encryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataType,
        classification
      });
      throw new Error('Encryption failed');
    }
  }

  // Client-side decryption
  async decryptClientSide(
    encryptedData: EncryptedData,
    userPassword: string,
    totpToken: string
  ): Promise<any> {
    try {
      // Verify integrity
      const computedChecksum = crypto
        .createHash('sha256')
        .update(encryptedData.encryptedData + encryptedData.iv + encryptedData.authTag)
        .digest('hex');
      
      if (computedChecksum !== encryptedData.checksum) {
        logger.error('Data integrity violation detected', {
          dataType: encryptedData.dataType,
          expected: encryptedData.checksum,
          computed: computedChecksum
        });
        throw new Error('Data integrity violation');
      }
      
      // Derive user-specific encryption key
      const userKey = await this.deriveUserKey(
        userPassword,
        totpToken,
        encryptedData.dataType
      );
      
      // Decrypt using AES-256-GCM
      const decipher = crypto.createDecipher(this.algorithm, userKey);
      decipher.setAAD(Buffer.from(encryptedData.dataType, 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Log decryption event
      logger.info('Data decrypted', {
        dataType: encryptedData.dataType,
        classification: encryptedData.classification,
        algorithm: encryptedData.algorithm
      });
      
      return JSON.parse(decrypted);
      
    } catch (error) {
      logger.error('Client-side decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataType: encryptedData.dataType
      });
      throw new Error('Decryption failed');
    }
  }

  // Server-side encryption for database storage
  async encryptForStorage(
    data: any,
    classification: DataClassification = DataClassification.CONFIDENTIAL
  ): Promise<StorageEncryptedData> {
    try {
      // Generate data encryption key (DEK)
      const dataKey = await this.generateDataEncryptionKey(classification);
      
      // Serialize data
      const serializedData = JSON.stringify(data);
      
      // Encrypt data with DEK
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, dataKey.key);
      
      let encrypted = cipher.update(serializedData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Encrypt DEK with KEK (master key)
      const encryptedDEK = this.encryptKey(dataKey.key, dataKey.keyId);
      
      const result: StorageEncryptedData = {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encryptedDEK: encryptedDEK.ciphertext,
        keyId: dataKey.keyId,
        classification,
        algorithm: this.algorithm,
        timestamp: new Date().toISOString()
      };
      
      logger.info('Data encrypted for storage', {
        classification,
        keyId: dataKey.keyId,
        size: serializedData.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Storage encryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        classification
      });
      throw new Error('Storage encryption failed');
    }
  }

  // Server-side decryption from storage
  async decryptFromStorage(storageData: StorageEncryptedData): Promise<any> {
    try {
      // Decrypt DEK using master key
      const dataKey = this.decryptKey(storageData.encryptedDEK, storageData.keyId);
      
      // Decrypt data using DEK
      const decipher = crypto.createDecipher(this.algorithm, dataKey);
      decipher.setAuthTag(Buffer.from(storageData.authTag, 'hex'));
      
      let decrypted = decipher.update(storageData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.info('Data decrypted from storage', {
        classification: storageData.classification,
        keyId: storageData.keyId
      });
      
      return JSON.parse(decrypted);
      
    } catch (error) {
      logger.error('Storage decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: storageData.keyId
      });
      throw new Error('Storage decryption failed');
    }
  }

  // Environment variable and secrets encryption
  async encryptSecrets(
    secrets: Record<string, string>,
    projectId: string,
    userId: string
  ): Promise<EncryptedSecrets> {
    try {
      const secretsKey = await this.deriveSecretsKey(projectId, userId);
      const encryptedSecrets: Record<string, EncryptedSecret> = {};
      const keyVersion = 1;
      
      for (const [key, value] of Object.entries(secrets)) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, secretsKey);
        
        // Use secret name as additional authenticated data
        cipher.setAAD(Buffer.from(key, 'utf8'));
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        encryptedSecrets[key] = {
          value: encrypted,
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
          algorithm: this.algorithm,
          encryptedAt: new Date().toISOString(),
          keyVersion
        };
      }
      
      const result: EncryptedSecrets = {
        projectId,
        userId,
        secrets: encryptedSecrets,
        keyVersion,
        timestamp: new Date().toISOString()
      };
      
      logger.info('Secrets encrypted', {
        projectId,
        userId,
        secretCount: Object.keys(secrets).length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Secrets encryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId,
        userId
      });
      throw new Error('Secrets encryption failed');
    }
  }

  // Decrypt environment variables and secrets
  async decryptSecrets(
    encryptedSecrets: EncryptedSecrets,
    projectId: string,
    userId: string
  ): Promise<Record<string, string>> {
    try {
      const secretsKey = await this.deriveSecretsKey(
        projectId,
        userId,
        encryptedSecrets.keyVersion
      );
      
      const decryptedSecrets: Record<string, string> = {};
      
      for (const [key, encryptedSecret] of Object.entries(encryptedSecrets.secrets)) {
        const decipher = crypto.createDecipher(this.algorithm, secretsKey);
        decipher.setAAD(Buffer.from(key, 'utf8'));
        decipher.setAuthTag(Buffer.from(encryptedSecret.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedSecret.value, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        decryptedSecrets[key] = decrypted;
      }
      
      logger.info('Secrets decrypted', {
        projectId,
        userId,
        secretCount: Object.keys(decryptedSecrets).length
      });
      
      return decryptedSecrets;
      
    } catch (error) {
      logger.error('Secrets decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId,
        userId
      });
      throw new Error('Secrets decryption failed');
    }
  }

  // Hash password using Argon2
  async hashPassword(password: string): Promise<{
    hash: string;
    salt: string;
    algorithm: string;
  }> {
    try {
      const salt = crypto.randomBytes(32);
      
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
        hashLength: 32,
        salt
      });
      
      return {
        hash,
        salt: salt.toString('hex'),
        algorithm: 'argon2id'
      };
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Password hashing failed');
    }
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      logger.error('Password verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  // Derive user-specific encryption key
  private async deriveUserKey(
    password: string,
    totpToken: string,
    dataType: DataType,
    iterations: number = config.encryption.keyDerivationIterations
  ): Promise<Buffer> {
    try {
      // Create deterministic salt from TOTP token and data type
      const saltInput = `${totpToken}:${dataType}:sentra-v1`;
      const salt = crypto.createHash('sha256').update(saltInput).digest();
      
      // Use PBKDF2 with high iteration count
      return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    } catch (error) {
      logger.error('User key derivation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataType
      });
      throw new Error('Key derivation failed');
    }
  }

  // Derive project-specific secrets key
  private async deriveSecretsKey(
    projectId: string,
    userId: string,
    keyVersion: number = 1
  ): Promise<Buffer> {
    try {
      const keyMaterial = `${userId}:${projectId}:secrets:v${keyVersion}`;
      const salt = crypto.createHash('sha256').update('sentra-secrets-salt').digest();
      
      return crypto.pbkdf2Sync(keyMaterial, salt, 100000, 32, 'sha256');
    } catch (error) {
      logger.error('Secrets key derivation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId,
        userId
      });
      throw new Error('Secrets key derivation failed');
    }
  }

  // Generate data encryption key (DEK)
  private async generateDataEncryptionKey(
    classification: DataClassification
  ): Promise<DataEncryptionKey> {
    const keyId = crypto.randomUUID();
    const key = crypto.randomBytes(32); // 256-bit key
    
    // Set expiration based on classification
    const expirationHours = this.getKeyExpirationHours(classification);
    const expiresAt = expirationHours 
      ? new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString()
      : undefined;
    
    return {
      keyId,
      key,
      classification,
      createdAt: new Date().toISOString(),
      algorithm: this.algorithm,
      expiresAt
    };
  }

  // Get key expiration hours based on classification
  private getKeyExpirationHours(classification: DataClassification): number | null {
    switch (classification) {
      case DataClassification.SECRET:
        return 24; // 1 day
      case DataClassification.RESTRICTED:
        return 168; // 1 week
      case DataClassification.CONFIDENTIAL:
        return 720; // 30 days
      case DataClassification.INTERNAL:
        return 2160; // 90 days
      case DataClassification.PUBLIC:
        return null; // No expiration
      default:
        return 720; // Default 30 days
    }
  }

  // Encrypt key with master key (KEK)
  private encryptKey(key: Buffer, keyId: string): { ciphertext: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.masterKey);
    cipher.setAAD(Buffer.from(keyId, 'utf8'));
    
    let encrypted = cipher.update(key, null, 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  // Decrypt key with master key (KEK)
  private decryptKey(ciphertext: string, keyId: string): Buffer {
    const [encryptedKey, authTagHex] = ciphertext.split(':');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
    decipher.setAAD(Buffer.from(keyId, 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedKey, 'hex');
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }
}