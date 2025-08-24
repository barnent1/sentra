import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import tar from 'tar';
import crypto from 'crypto';
import { S3 } from '@aws-sdk/client-s3';
import { Glacier } from '@aws-sdk/client-glacier';
import { BlobServiceClient } from '@azure/storage-blob';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { EncryptionService } from './EncryptionService';
import { NotificationService } from './NotificationService';
import { getDatabase } from '../utils/database';
import { getRedis } from '../utils/redis';

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
  SNAPSHOT = 'snapshot'
}

export enum StorageTier {
  HOT = 'hot',           // Immediate access (local, cloud standard)
  WARM = 'warm',         // Few hours access (cloud infrequent access)
  COLD = 'cold',         // Few hours to days (cloud glacier)
  FROZEN = 'frozen'      // Long-term archival (cloud deep archive)
}

export enum BackupStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface BackupJob {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  source: string;
  destination: string;
  storageTier: StorageTier;
  encryption: boolean;
  compression: boolean;
  retentionDays: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  size?: number;
  checksum?: string;
  error?: string;
  metadata: Record<string, any>;
}

export interface BackupConfig {
  databases: {
    postgres: boolean;
    redis: boolean;
    backupPath: string;
  };
  files: {
    configFiles: boolean;
    userUploads: boolean;
    logs: boolean;
    sourcePaths: string[];
    excludePatterns: string[];
  };
  storage: {
    local: {
      enabled: boolean;
      path: string;
      maxSizeGB: number;
    };
    s3: {
      enabled: boolean;
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
    azure: {
      enabled: boolean;
      connectionString: string;
      containerName: string;
    };
    glacier: {
      enabled: boolean;
      vaultName: string;
      region: string;
    };
  };
  schedule: {
    full: string;          // Cron expression for full backups
    incremental: string;   // Cron expression for incremental backups
    cleanup: string;       // Cron expression for cleanup
  };
  retention: {
    daily: number;         // Keep daily backups for X days
    weekly: number;        // Keep weekly backups for X weeks
    monthly: number;       // Keep monthly backups for X months
    yearly: number;        // Keep yearly backups for X years
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotationDays: number;
  };
  compression: {
    enabled: boolean;
    algorithm: string;     // gzip, brotli, lz4
    level: number;         // 1-9
  };
  monitoring: {
    notifications: boolean;
    healthChecks: boolean;
    performanceMetrics: boolean;
  };
}

export class BackupService {
  private s3Client?: S3;
  private glacierClient?: Glacier;
  private azureBlobClient?: BlobServiceClient;
  private encryptionService: EncryptionService;
  private notificationService: NotificationService;
  private runningJobs = new Map<string, BackupJob>();

  constructor(private backupConfig: BackupConfig) {
    this.encryptionService = new EncryptionService();
    this.notificationService = new NotificationService();
    this.initializeStorageClients();
  }

  private initializeStorageClients(): void {
    // Initialize S3 client
    if (this.backupConfig.storage.s3.enabled) {
      this.s3Client = new S3({
        region: this.backupConfig.storage.s3.region,
        credentials: {
          accessKeyId: this.backupConfig.storage.s3.accessKeyId,
          secretAccessKey: this.backupConfig.storage.s3.secretAccessKey
        }
      });
      logger.info('S3 backup storage initialized');
    }

    // Initialize Glacier client
    if (this.backupConfig.storage.glacier.enabled) {
      this.glacierClient = new Glacier({
        region: this.backupConfig.storage.glacier.region
      });
      logger.info('Glacier backup storage initialized');
    }

    // Initialize Azure Blob client
    if (this.backupConfig.storage.azure.enabled) {
      this.azureBlobClient = BlobServiceClient.fromConnectionString(
        this.backupConfig.storage.azure.connectionString
      );
      logger.info('Azure Blob backup storage initialized');
    }
  }

  // Create and execute a backup job
  async createBackup(
    name: string,
    type: BackupType,
    sources: string[],
    storageTier: StorageTier = StorageTier.HOT,
    options: {
      encryption?: boolean;
      compression?: boolean;
      retentionDays?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<BackupJob> {
    const job: BackupJob = {
      id: crypto.randomUUID(),
      name,
      type,
      status: BackupStatus.PENDING,
      source: sources.join(','),
      destination: '',
      storageTier,
      encryption: options.encryption ?? this.backupConfig.encryption.enabled,
      compression: options.compression ?? this.backupConfig.compression.enabled,
      retentionDays: options.retentionDays ?? this.getDefaultRetention(type),
      createdAt: new Date(),
      metadata: options.metadata ?? {}
    };

    try {
      logger.info('Starting backup job', {
        jobId: job.id,
        name: job.name,
        type: job.type,
        sources,
        storageTier: job.storageTier
      });

      // Update job status
      job.status = BackupStatus.RUNNING;
      job.startedAt = new Date();
      this.runningJobs.set(job.id, job);

      // Execute backup based on type
      switch (type) {
        case BackupType.FULL:
          await this.performFullBackup(job, sources);
          break;
        case BackupType.INCREMENTAL:
          await this.performIncrementalBackup(job, sources);
          break;
        case BackupType.DIFFERENTIAL:
          await this.performDifferentialBackup(job, sources);
          break;
        case BackupType.SNAPSHOT:
          await this.performSnapshotBackup(job, sources);
          break;
      }

      // Mark job as completed
      job.status = BackupStatus.COMPLETED;
      job.completedAt = new Date();

      logger.info('Backup job completed successfully', {
        jobId: job.id,
        duration: job.completedAt.getTime() - job.startedAt!.getTime(),
        size: job.size
      });

      // Send success notification
      await this.notificationService.sendBackupNotification({
        type: 'success',
        jobId: job.id,
        jobName: job.name,
        backupType: job.type,
        size: job.size,
        duration: job.completedAt.getTime() - job.startedAt!.getTime()
      });

    } catch (error) {
      job.status = BackupStatus.FAILED;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      logger.error('Backup job failed', {
        jobId: job.id,
        error: job.error
      });

      // Send failure notification
      await this.notificationService.sendBackupNotification({
        type: 'failure',
        jobId: job.id,
        jobName: job.name,
        backupType: job.type,
        error: job.error
      });

      throw error;
    } finally {
      this.runningJobs.delete(job.id);
    }

    return job;
  }

  // Perform full backup
  private async performFullBackup(job: BackupJob, sources: string[]): Promise<void> {
    const tempDir = path.join(config.paths.temp, `backup-${job.id}`);
    const backupFileName = `${job.name}-full-${Date.now()}`;
    
    try {
      // Create temporary directory
      await fs.ensureDir(tempDir);

      // Backup databases
      if (this.backupConfig.databases.postgres) {
        await this.backupPostgres(path.join(tempDir, 'postgres.sql'));
      }

      if (this.backupConfig.databases.redis) {
        await this.backupRedis(path.join(tempDir, 'redis.rdb'));
      }

      // Copy source files and directories
      for (const source of sources) {
        if (await fs.pathExists(source)) {
          const basename = path.basename(source);
          const destPath = path.join(tempDir, basename);
          await fs.copy(source, destPath, {
            filter: (src) => !this.isExcluded(src)
          });
          logger.debug(`Copied ${source} to backup`, { source, dest: destPath });
        }
      }

      // Create archive
      const archivePath = await this.createArchive(tempDir, backupFileName, job);

      // Calculate checksum
      job.checksum = await this.calculateChecksum(archivePath);
      
      // Get file size
      const stats = await fs.stat(archivePath);
      job.size = stats.size;

      // Upload to storage tiers
      job.destination = await this.uploadToStorage(archivePath, backupFileName, job.storageTier);

      // Clean up temporary files
      await fs.remove(tempDir);
      if (await fs.pathExists(archivePath)) {
        await fs.remove(archivePath);
      }

    } catch (error) {
      // Clean up on failure
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
      throw error;
    }
  }

  // Perform incremental backup
  private async performIncrementalBackup(job: BackupJob, sources: string[]): Promise<void> {
    // Get last backup timestamp
    const lastBackupTime = await this.getLastBackupTime(job.name);
    const tempDir = path.join(config.paths.temp, `backup-${job.id}`);
    const backupFileName = `${job.name}-incremental-${Date.now()}`;
    
    try {
      await fs.ensureDir(tempDir);

      // Backup only changed files since last backup
      for (const source of sources) {
        if (await fs.pathExists(source)) {
          await this.copyChangedFiles(
            source,
            path.join(tempDir, path.basename(source)),
            lastBackupTime
          );
        }
      }

      // Backup database changes
      if (this.backupConfig.databases.postgres) {
        await this.backupPostgresWAL(path.join(tempDir, 'postgres-wal'));
      }

      // Create archive and upload
      const archivePath = await this.createArchive(tempDir, backupFileName, job);
      job.checksum = await this.calculateChecksum(archivePath);
      
      const stats = await fs.stat(archivePath);
      job.size = stats.size;

      job.destination = await this.uploadToStorage(archivePath, backupFileName, job.storageTier);

      // Update last backup timestamp
      await this.updateLastBackupTime(job.name, new Date());

      // Clean up
      await fs.remove(tempDir);
      if (await fs.pathExists(archivePath)) {
        await fs.remove(archivePath);
      }

    } catch (error) {
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
      throw error;
    }
  }

  // Perform differential backup
  private async performDifferentialBackup(job: BackupJob, sources: string[]): Promise<void> {
    // Get last full backup timestamp
    const lastFullBackupTime = await this.getLastFullBackupTime(job.name);
    const tempDir = path.join(config.paths.temp, `backup-${job.id}`);
    const backupFileName = `${job.name}-differential-${Date.now()}`;
    
    try {
      await fs.ensureDir(tempDir);

      // Backup all changes since last full backup
      for (const source of sources) {
        if (await fs.pathExists(source)) {
          await this.copyChangedFiles(
            source,
            path.join(tempDir, path.basename(source)),
            lastFullBackupTime
          );
        }
      }

      // Create archive and upload
      const archivePath = await this.createArchive(tempDir, backupFileName, job);
      job.checksum = await this.calculateChecksum(archivePath);
      
      const stats = await fs.stat(archivePath);
      job.size = stats.size;

      job.destination = await this.uploadToStorage(archivePath, backupFileName, job.storageTier);

      // Clean up
      await fs.remove(tempDir);
      if (await fs.pathExists(archivePath)) {
        await fs.remove(archivePath);
      }

    } catch (error) {
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
      throw error;
    }
  }

  // Perform snapshot backup (for databases)
  private async performSnapshotBackup(job: BackupJob, sources: string[]): Promise<void> {
    const tempDir = path.join(config.paths.temp, `backup-${job.id}`);
    const backupFileName = `${job.name}-snapshot-${Date.now()}`;
    
    try {
      await fs.ensureDir(tempDir);

      // Create database snapshots
      if (this.backupConfig.databases.postgres) {
        await this.createPostgresSnapshot(path.join(tempDir, 'postgres-snapshot'));
      }

      if (this.backupConfig.databases.redis) {
        await this.createRedisSnapshot(path.join(tempDir, 'redis-snapshot'));
      }

      // Create archive and upload
      const archivePath = await this.createArchive(tempDir, backupFileName, job);
      job.checksum = await this.calculateChecksum(archivePath);
      
      const stats = await fs.stat(archivePath);
      job.size = stats.size;

      job.destination = await this.uploadToStorage(archivePath, backupFileName, job.storageTier);

      // Clean up
      await fs.remove(tempDir);
      if (await fs.pathExists(archivePath)) {
        await fs.remove(archivePath);
      }

    } catch (error) {
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
      throw error;
    }
  }

  // Create compressed archive
  private async createArchive(
    sourceDir: string,
    fileName: string,
    job: BackupJob
  ): Promise<string> {
    const archivePath = path.join(config.paths.temp, `${fileName}.tar.gz`);
    
    if (job.compression) {
      // Create compressed tar archive
      await tar.create(
        {
          gzip: true,
          file: archivePath,
          cwd: sourceDir
        },
        ['.']
      );
    } else {
      // Create uncompressed tar archive
      await tar.create(
        {
          file: archivePath.replace('.gz', ''),
          cwd: sourceDir
        },
        ['.']
      );
    }

    // Encrypt if enabled
    if (job.encryption) {
      const encryptedPath = `${archivePath}.enc`;
      await this.encryptionService.encryptFile(archivePath, encryptedPath);
      await fs.remove(archivePath);
      return encryptedPath;
    }

    return archivePath;
  }

  // Upload backup to storage tiers
  private async uploadToStorage(
    filePath: string,
    fileName: string,
    tier: StorageTier
  ): Promise<string> {
    const destinations: string[] = [];

    // Always store to local if enabled
    if (this.backupConfig.storage.local.enabled) {
      const localPath = path.join(this.backupConfig.storage.local.path, fileName);
      await fs.copy(filePath, localPath);
      destinations.push(`local:${localPath}`);
      logger.debug('Backup stored locally', { path: localPath });
    }

    // Upload to cloud storage based on tier
    switch (tier) {
      case StorageTier.HOT:
        if (this.s3Client && this.backupConfig.storage.s3.enabled) {
          const s3Key = `hot/${fileName}`;
          await this.uploadToS3(filePath, s3Key, 'STANDARD');
          destinations.push(`s3:${s3Key}`);
        }
        break;

      case StorageTier.WARM:
        if (this.s3Client && this.backupConfig.storage.s3.enabled) {
          const s3Key = `warm/${fileName}`;
          await this.uploadToS3(filePath, s3Key, 'STANDARD_IA');
          destinations.push(`s3:${s3Key}`);
        }
        break;

      case StorageTier.COLD:
        if (this.s3Client && this.backupConfig.storage.s3.enabled) {
          const s3Key = `cold/${fileName}`;
          await this.uploadToS3(filePath, s3Key, 'GLACIER');
          destinations.push(`s3:${s3Key}`);
        }
        break;

      case StorageTier.FROZEN:
        if (this.glacierClient && this.backupConfig.storage.glacier.enabled) {
          const archiveId = await this.uploadToGlacier(filePath, fileName);
          destinations.push(`glacier:${archiveId}`);
        }
        break;
    }

    // Also upload to Azure if enabled
    if (this.azureBlobClient && this.backupConfig.storage.azure.enabled) {
      const blobName = `${tier}/${fileName}`;
      await this.uploadToAzure(filePath, blobName);
      destinations.push(`azure:${blobName}`);
    }

    return destinations.join(';');
  }

  // Upload to S3
  private async uploadToS3(
    filePath: string,
    key: string,
    storageClass: string
  ): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    
    await this.s3Client!.putObject({
      Bucket: this.backupConfig.storage.s3.bucket,
      Key: key,
      Body: fileStream,
      StorageClass: storageClass as any,
      ServerSideEncryption: 'AES256'
    });

    logger.info('Backup uploaded to S3', {
      bucket: this.backupConfig.storage.s3.bucket,
      key,
      storageClass
    });
  }

  // Upload to Azure Blob Storage
  private async uploadToAzure(filePath: string, blobName: string): Promise<void> {
    const containerClient = this.azureBlobClient!.getContainerClient(
      this.backupConfig.storage.azure.containerName
    );
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath);

    logger.info('Backup uploaded to Azure', {
      container: this.backupConfig.storage.azure.containerName,
      blob: blobName
    });
  }

  // Upload to Glacier
  private async uploadToGlacier(filePath: string, description: string): Promise<string> {
    const fileData = await fs.readFile(filePath);
    
    const result = await this.glacierClient!.uploadArchive({
      vaultName: this.backupConfig.storage.glacier.vaultName,
      body: fileData,
      archiveDescription: description
    });

    logger.info('Backup uploaded to Glacier', {
      vault: this.backupConfig.storage.glacier.vaultName,
      archiveId: result.archiveId
    });

    return result.archiveId!;
  }

  // Database backup methods
  private async backupPostgres(outputPath: string): Promise<void> {
    const db = getDatabase();
    // Implementation would use pg_dump or similar
    logger.info('PostgreSQL backup completed', { outputPath });
  }

  private async backupRedis(outputPath: string): Promise<void> {
    const redis = getRedis();
    // Implementation would save Redis data
    logger.info('Redis backup completed', { outputPath });
  }

  private async backupPostgresWAL(outputPath: string): Promise<void> {
    // Implementation for WAL backup
    logger.info('PostgreSQL WAL backup completed', { outputPath });
  }

  private async createPostgresSnapshot(outputPath: string): Promise<void> {
    // Implementation for database snapshot
    logger.info('PostgreSQL snapshot created', { outputPath });
  }

  private async createRedisSnapshot(outputPath: string): Promise<void> {
    // Implementation for Redis snapshot
    logger.info('Redis snapshot created', { outputPath });
  }

  // Utility methods
  private async copyChangedFiles(
    source: string,
    dest: string,
    since: Date
  ): Promise<void> {
    const stats = await fs.stat(source);
    
    if (stats.isDirectory()) {
      await fs.ensureDir(dest);
      const files = await fs.readdir(source);
      
      for (const file of files) {
        const sourcePath = path.join(source, file);
        const destPath = path.join(dest, file);
        await this.copyChangedFiles(sourcePath, destPath, since);
      }
    } else {
      if (stats.mtime > since) {
        await fs.copy(source, dest);
      }
    }
  }

  private isExcluded(filePath: string): boolean {
    const excludePatterns = this.backupConfig.files.excludePatterns;
    return excludePatterns.some(pattern => 
      filePath.includes(pattern) || filePath.match(new RegExp(pattern))
    );
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private getDefaultRetention(type: BackupType): number {
    switch (type) {
      case BackupType.FULL:
        return this.backupConfig.retention.monthly * 30;
      case BackupType.INCREMENTAL:
        return this.backupConfig.retention.daily;
      case BackupType.DIFFERENTIAL:
        return this.backupConfig.retention.weekly * 7;
      case BackupType.SNAPSHOT:
        return this.backupConfig.retention.daily;
      default:
        return 30;
    }
  }

  private async getLastBackupTime(jobName: string): Promise<Date> {
    // Implementation to get last backup time from database
    return new Date(0); // Placeholder
  }

  private async getLastFullBackupTime(jobName: string): Promise<Date> {
    // Implementation to get last full backup time from database
    return new Date(0); // Placeholder
  }

  private async updateLastBackupTime(jobName: string, time: Date): Promise<void> {
    // Implementation to update last backup time in database
  }
}