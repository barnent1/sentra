/**
 * TMUX Session Persistence Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This class manages session persistence, recovery, and state management for TMUX sessions,
 * ensuring sessions can be recovered after system restarts or failures.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import type {
  SessionId,
  TMUXSession,
  SessionRecoveryInfo,
  ProjectActivity,
} from './types';
import {
  TMUXSessionStatus,
} from './types';
import type { AgentInstanceId, ProjectContextId } from '@sentra/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  readonly dataDirectory: string;
  readonly enableCompression: boolean;
  readonly encryptionEnabled: boolean;
  readonly encryptionKey?: string;
  readonly maxBackups: number;
  readonly backupInterval: number;
  readonly autoSaveInterval: number;
  readonly recoveryTimeout: number;
  readonly enableIncrementalBackups: boolean;
}

/**
 * Persisted session state
 */
export interface PersistedSessionState {
  readonly sessionId: SessionId;
  readonly sessionData: TMUXSession;
  readonly checkpoints: readonly SessionCheckpoint[];
  readonly metadata: {
    readonly version: string;
    readonly createdAt: Date;
    readonly lastSaved: Date;
    readonly saveCount: number;
    readonly compressionEnabled: boolean;
    readonly checksumVerification: string;
  };
}

/**
 * Session checkpoint for incremental backups
 */
export interface SessionCheckpoint {
  readonly checkpointId: string;
  readonly timestamp: Date;
  readonly changes: readonly {
    readonly path: string;
    readonly oldValue: unknown;
    readonly newValue: unknown;
    readonly changeType: 'create' | 'update' | 'delete';
  }[];
  readonly triggerEvent: string;
  readonly size: number;
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  readonly strategy: 'full_restore' | 'partial_restore' | 'manual_restore' | 'rebuild_from_scratch';
  readonly priority: 'high' | 'medium' | 'low';
  readonly autoRetry: boolean;
  readonly maxRetryAttempts: number;
  readonly retryDelay: number;
  readonly verifyIntegrity: boolean;
  readonly backupFallback: boolean;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  readonly backupId: string;
  readonly sessionId: SessionId;
  readonly timestamp: Date;
  readonly size: number;
  readonly compressed: boolean;
  readonly encrypted: boolean;
  readonly checksumSHA256: string;
  readonly backupType: 'full' | 'incremental';
  readonly parentBackupId?: string | undefined;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  readonly sessionId: SessionId;
  readonly success: boolean;
  readonly strategy: RecoveryStrategy['strategy'];
  readonly recoveredSession?: TMUXSession | undefined;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly recoveryTime: number;
  readonly dataIntegrity: 'perfect' | 'good' | 'partial' | 'corrupted';
  readonly recoveredFromBackup: boolean;
  readonly backupUsed?: BackupMetadata | undefined;
}

/**
 * Session persistence manager
 */
export class SessionPersistenceManager extends EventEmitter {
  private readonly config: PersistenceConfig;
  private readonly persistedSessions: Map<SessionId, PersistedSessionState> = new Map();
  private readonly recoveryInfo: Map<SessionId, SessionRecoveryInfo> = new Map();
  private readonly backupMetadata: Map<string, BackupMetadata> = new Map();
  private autoSaveInterval?: NodeJS.Timeout;
  private backupInterval?: NodeJS.Timeout;

  constructor(config: PersistenceConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION AND LIFECYCLE
  // ============================================================================

  private async initialize(): Promise<void> {
    await this.ensureDataDirectory();
    await this.loadExistingBackups();
    this.startAutoSave();
    this.startBackupSchedule();
    this.setupEventHandlers();
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.dataDirectory, { recursive: true });
      await fs.mkdir(join(this.config.dataDirectory, 'sessions'), { recursive: true });
      await fs.mkdir(join(this.config.dataDirectory, 'backups'), { recursive: true });
      await fs.mkdir(join(this.config.dataDirectory, 'recovery'), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadExistingBackups(): Promise<void> {
    try {
      const backupDir = join(this.config.dataDirectory, 'backups');
      const files = await fs.readdir(backupDir);
      
      for (const file of files) {
        if (file.endsWith('.backup.json')) {
          try {
            const backupPath = join(backupDir, file);
            const backupData = await this.loadBackupMetadata(backupPath);
            this.backupMetadata.set(backupData.backupId, backupData);
          } catch (error) {
            console.warn(`Failed to load backup metadata from ${file}: ${error}`);
          }
        }
      }

      this.emit('backups-loaded', { count: this.backupMetadata.size });
    } catch (error) {
      console.error('Failed to load existing backups:', error);
    }
  }

  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(async () => {
      await this.saveAllSessions();
    }, this.config.autoSaveInterval);
  }

  private startBackupSchedule(): void {
    this.backupInterval = setInterval(async () => {
      await this.createBackupsForAllSessions();
    }, this.config.backupInterval);
  }

  private setupEventHandlers(): void {
    this.on('session-saved', (sessionId: SessionId) => {
      this.updateRecoveryInfo(sessionId);
    });
  }

  // ============================================================================
  // SESSION PERSISTENCE
  // ============================================================================

  /**
   * Save session state to persistent storage
   */
  async saveSession(session: TMUXSession): Promise<void> {
    try {
      const sessionState = this.createPersistedSessionState(session);
      const sessionPath = this.getSessionPath(session.id);
      
      // Create checkpoint if incremental backups are enabled
      let updatedSessionState = sessionState;
      if (this.config.enableIncrementalBackups) {
        const checkpoint = await this.createCheckpoint(session);
        updatedSessionState = {
          ...sessionState,
          checkpoints: [...sessionState.checkpoints, checkpoint],
        };
      }

      // Save to file
      const serializedData = JSON.stringify(updatedSessionState, null, 2);
      await fs.writeFile(sessionPath, serializedData, 'utf8');

      // Update in-memory cache
      this.persistedSessions.set(session.id, updatedSessionState);

      this.emit('session-saved', session.id);
    } catch (error) {
      this.emit('session-save-failed', { sessionId: session.id, error });
      throw error;
    }
  }

  /**
   * Load session state from persistent storage
   */
  async loadSession(sessionId: SessionId): Promise<TMUXSession | null> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      
      // Check if file exists
      try {
        await fs.access(sessionPath);
      } catch {
        return null; // File doesn't exist
      }

      // Load and parse session data
      const serializedData = await fs.readFile(sessionPath, 'utf8');
      const sessionState: PersistedSessionState = JSON.parse(serializedData);

      // Verify checksum if available
      if (sessionState.metadata.checksumVerification) {
        const isValid = await this.verifySessionIntegrity(sessionState);
        if (!isValid) {
          throw new Error('Session data integrity check failed');
        }
      }

      // Update in-memory cache
      this.persistedSessions.set(sessionId, sessionState);

      this.emit('session-loaded', sessionId);
      return sessionState.sessionData;
    } catch (error) {
      this.emit('session-load-failed', { sessionId, error });
      return null;
    }
  }

  /**
   * Save all sessions in cache
   */
  async saveAllSessions(): Promise<void> {
    const savePromises = Array.from(this.persistedSessions.values()).map(sessionState =>
      this.saveSession(sessionState.sessionData)
    );

    const results = await Promise.allSettled(savePromises);
    const failures = results.filter(result => result.status === 'rejected').length;

    if (failures > 0) {
      this.emit('bulk-save-completed', { total: savePromises.length, failures });
    }
  }

  /**
   * Delete persisted session
   */
  async deleteSession(sessionId: SessionId): Promise<void> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      await fs.unlink(sessionPath);
      
      this.persistedSessions.delete(sessionId);
      this.recoveryInfo.delete(sessionId);

      this.emit('session-deleted', sessionId);
    } catch (error) {
      this.emit('session-delete-failed', { sessionId, error });
      throw error;
    }
  }

  // ============================================================================
  // SESSION RECOVERY
  // ============================================================================

  /**
   * Recover session using specified strategy
   */
  async recoverSession(
    sessionId: SessionId,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      this.emit('recovery-started', { sessionId, strategy });

      let result: RecoveryResult;
      
      switch (strategy.strategy) {
        case 'full_restore':
          result = await this.performFullRestore(sessionId, strategy);
          break;
        case 'partial_restore':
          result = await this.performPartialRestore(sessionId, strategy);
          break;
        case 'manual_restore':
          result = await this.performManualRestore(sessionId, strategy);
          break;
        case 'rebuild_from_scratch':
          result = await this.performRebuildFromScratch(sessionId, strategy);
          break;
        default:
          throw new Error(`Unknown recovery strategy: ${strategy.strategy}`);
      }

      result = {
        ...result,
        recoveryTime: Date.now() - startTime,
      };

      this.emit('recovery-completed', result);
      return result;
    } catch (error) {
      const result: RecoveryResult = {
        sessionId,
        success: false,
        strategy: strategy.strategy,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        recoveryTime: Date.now() - startTime,
        dataIntegrity: 'corrupted',
        recoveredFromBackup: false,
      };

      this.emit('recovery-failed', result);
      return result;
    }
  }

  /**
   * Perform full session restore
   */
  private async performFullRestore(
    sessionId: SessionId,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    // Try to load from primary storage
    let session = await this.loadSession(sessionId);
    let recoveredFromBackup = false;
    let backupUsed: BackupMetadata | undefined;

    if (!session && strategy.backupFallback) {
      // Try to restore from backup
      const backup = await this.findLatestBackup(sessionId);
      if (backup) {
        session = await this.restoreFromBackup(backup);
        recoveredFromBackup = true;
        backupUsed = backup;
      }
    }

    if (!session) {
      return {
        sessionId,
        success: false,
        strategy: strategy.strategy,
        recoveredSession: undefined,
        errors: ['No valid session data found'],
        warnings: [],
        recoveryTime: 0,
        dataIntegrity: 'corrupted',
        recoveredFromBackup,
        backupUsed: backupUsed || undefined,
      };
    }

    // Verify session integrity
    const integrity = await this.assessSessionIntegrity(session);

    return {
      sessionId,
      success: true,
      strategy: strategy.strategy,
      recoveredSession: session,
      errors: [],
      warnings: integrity === 'partial' ? ['Some session data may be incomplete'] : [],
      recoveryTime: 0,
      dataIntegrity: integrity,
      recoveredFromBackup,
      backupUsed: backupUsed || undefined,
    };
  }

  /**
   * Perform partial session restore
   */
  private async performPartialRestore(
    sessionId: SessionId,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      return await this.performFullRestore(sessionId, strategy);
    }

    // Create a minimal working session from whatever data is available
    const partialSession = this.createMinimalSession(session, sessionId);
    const integrity = await this.assessSessionIntegrity(partialSession);

    return {
      sessionId,
      success: true,
      strategy: strategy.strategy,
      recoveredSession: partialSession,
      errors: [],
      warnings: ['Session restored with minimal configuration', 'Some data may be missing'],
      recoveryTime: 0,
      dataIntegrity: integrity,
      recoveredFromBackup: false,
      backupUsed: undefined,
    };
  }

  /**
   * Perform manual restore (returns data for manual review)
   */
  private async performManualRestore(
    sessionId: SessionId,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const sessionData = await this.loadSession(sessionId);
    const backups = await this.getBackupsForSession(sessionId);

    return {
      sessionId,
      success: false, // Requires manual intervention
      strategy: strategy.strategy,
      recoveredSession: undefined,
      errors: [],
      warnings: [
        'Manual restore required',
        `Found ${backups.length} backup(s) for this session`,
        sessionData ? 'Primary session data available' : 'Primary session data missing',
      ],
      recoveryTime: 0,
      dataIntegrity: sessionData ? 'partial' : 'corrupted',
      recoveredFromBackup: false,
      backupUsed: undefined,
    };
  }

  /**
   * Rebuild session from scratch
   */
  private async performRebuildFromScratch(
    sessionId: SessionId,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    // Create a completely new session with default configuration
    const newSession = this.createFreshSession(sessionId);

    return {
      sessionId,
      success: true,
      strategy: strategy.strategy,
      recoveredSession: newSession,
      errors: [],
      warnings: [
        'Session rebuilt from scratch',
        'All previous configuration and data lost',
        'Default configuration applied',
      ],
      recoveryTime: 0,
      dataIntegrity: 'perfect',
      recoveredFromBackup: false,
      backupUsed: undefined,
    };
  }

  // ============================================================================
  // BACKUP MANAGEMENT
  // ============================================================================

  /**
   * Create backup for session
   */
  async createBackup(sessionId: SessionId, backupType: 'full' | 'incremental' = 'full'): Promise<BackupMetadata> {
    const session = this.persistedSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in cache`);
    }

    const backupId = uuidv4();
    const timestamp = new Date();
    const backupPath = join(this.config.dataDirectory, 'backups', `${sessionId}-${backupId}.backup`);

    // Create backup data
    const backupData = {
      sessionState: session,
      backupMetadata: {
        backupId,
        sessionId,
        timestamp,
        backupType,
      },
    };

    // Serialize and optionally compress
    let serializedData = JSON.stringify(backupData, null, 2);
    if (this.config.enableCompression) {
      // In a real implementation, would use zlib or similar
      // serializedData = await compress(serializedData);
    }

    // Write backup file
    await fs.writeFile(backupPath, serializedData, 'utf8');

    // Create backup metadata
    const metadata: BackupMetadata = {
      backupId,
      sessionId,
      timestamp,
      size: Buffer.byteLength(serializedData, 'utf8'),
      compressed: this.config.enableCompression,
      encrypted: this.config.encryptionEnabled,
      checksumSHA256: await this.calculateChecksum(serializedData),
      backupType,
    };

    // Save metadata
    await this.saveBackupMetadata(metadata);
    this.backupMetadata.set(backupId, metadata);

    this.emit('backup-created', metadata);
    return metadata;
  }

  /**
   * Create backups for all sessions
   */
  async createBackupsForAllSessions(): Promise<readonly BackupMetadata[]> {
    const sessionIds = Array.from(this.persistedSessions.keys());
    const backupPromises = sessionIds.map(sessionId => 
      this.createBackup(sessionId).catch(error => {
        console.error(`Failed to create backup for session ${sessionId}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(backupPromises);
    const backups = results
      .filter((result): result is PromiseFulfilledResult<BackupMetadata | null> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter((backup): backup is BackupMetadata => backup !== null);

    // Clean up old backups
    await this.cleanupOldBackups();

    return backups;
  }

  /**
   * Restore session from backup
   */
  async restoreFromBackup(backup: BackupMetadata): Promise<TMUXSession> {
    const backupPath = join(this.config.dataDirectory, 'backups', `${backup.sessionId}-${backup.backupId}.backup`);
    
    // Load backup data
    let serializedData = await fs.readFile(backupPath, 'utf8');
    
    // Decompress if necessary
    if (backup.compressed) {
      // In a real implementation, would decompress
      // serializedData = await decompress(serializedData);
    }

    // Verify checksum
    const currentChecksum = await this.calculateChecksum(serializedData);
    if (currentChecksum !== backup.checksumSHA256) {
      throw new Error('Backup data integrity check failed');
    }

    // Parse backup data
    const backupData = JSON.parse(serializedData);
    return backupData.sessionState.sessionData;
  }

  /**
   * Find latest backup for session
   */
  async findLatestBackup(sessionId: SessionId): Promise<BackupMetadata | null> {
    const sessionBackups = Array.from(this.backupMetadata.values())
      .filter(backup => backup.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return sessionBackups[0] || null;
  }

  /**
   * Get all backups for session
   */
  async getBackupsForSession(sessionId: SessionId): Promise<readonly BackupMetadata[]> {
    return Array.from(this.backupMetadata.values())
      .filter(backup => backup.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    const allBackups = Array.from(this.backupMetadata.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Group by session
    const backupsBySession = new Map<SessionId, BackupMetadata[]>();
    for (const backup of allBackups) {
      const existing = backupsBySession.get(backup.sessionId) || [];
      existing.push(backup);
      backupsBySession.set(backup.sessionId, existing);
    }

    // Remove excess backups per session
    for (const backups of Array.from(backupsBySession.values())) {
      if (backups.length > this.config.maxBackups) {
        const backupsToDelete = backups.slice(this.config.maxBackups);
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup);
        }
      }
    }
  }

  /**
   * Delete backup
   */
  private async deleteBackup(backup: BackupMetadata): Promise<void> {
    const backupPath = join(this.config.dataDirectory, 'backups', `${backup.sessionId}-${backup.backupId}.backup`);
    
    try {
      await fs.unlink(backupPath);
      this.backupMetadata.delete(backup.backupId);
      this.emit('backup-deleted', backup);
    } catch (error) {
      console.error(`Failed to delete backup ${backup.backupId}:`, error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Create persisted session state
   */
  private createPersistedSessionState(session: TMUXSession): PersistedSessionState {
    const existing = this.persistedSessions.get(session.id);
    
    return {
      sessionId: session.id,
      sessionData: session,
      checkpoints: existing?.checkpoints || [],
      metadata: {
        version: '1.0.0',
        createdAt: existing?.metadata.createdAt || new Date(),
        lastSaved: new Date(),
        saveCount: (existing?.metadata.saveCount || 0) + 1,
        compressionEnabled: this.config.enableCompression,
        checksumVerification: '', // Would be calculated
      },
    };
  }

  /**
   * Create checkpoint for incremental backup
   */
  private async createCheckpoint(session: TMUXSession): Promise<SessionCheckpoint> {
    const existing = this.persistedSessions.get(session.id);
    const changes = existing ? await this.calculateChanges(existing.sessionData, session) : [];

    return {
      checkpointId: uuidv4(),
      timestamp: new Date(),
      changes,
      triggerEvent: 'auto_save',
      size: JSON.stringify(changes).length,
    };
  }

  /**
   * Calculate changes between session states
   */
  private async calculateChanges(
    oldSession: TMUXSession,
    newSession: TMUXSession
  ): Promise<SessionCheckpoint['changes']> {
    const changes: SessionCheckpoint['changes'][number][] = [];

    // Compare session properties
    if (oldSession.status !== newSession.status) {
      changes.push({
        path: 'status',
        oldValue: oldSession.status,
        newValue: newSession.status,
        changeType: 'update',
      });
    }

    if (oldSession.lastActivityAt.getTime() !== newSession.lastActivityAt.getTime()) {
      changes.push({
        path: 'lastActivityAt',
        oldValue: oldSession.lastActivityAt,
        newValue: newSession.lastActivityAt,
        changeType: 'update',
      });
    }

    // Compare panel activities
    for (let i = 0; i < newSession.window.panels.length; i++) {
      const oldPanel = oldSession.window.panels[i];
      const newPanel = newSession.window.panels[i];
      
      if (oldPanel && newPanel) {
        if (oldPanel.projectActivity.status !== newPanel.projectActivity.status) {
          changes.push({
            path: `window.panels.${i}.projectActivity.status`,
            oldValue: oldPanel.projectActivity.status,
            newValue: newPanel.projectActivity.status,
            changeType: 'update',
          });
        }
      }
    }

    return changes;
  }

  /**
   * Verify session integrity
   */
  private async verifySessionIntegrity(_sessionState: PersistedSessionState): Promise<boolean> {
    // In a real implementation, would perform comprehensive integrity checks
    return true; // Placeholder
  }

  /**
   * Assess session integrity
   */
  private async assessSessionIntegrity(session: TMUXSession): Promise<RecoveryResult['dataIntegrity']> {
    // Check if all required fields are present
    if (!session.id || !session.name || !session.window) {
      return 'corrupted';
    }

    if (session.window.panels.length !== 4) {
      return 'partial';
    }

    // Check if all panels have valid project activities
    for (const panel of session.window.panels) {
      if (!panel.projectActivity || !panel.projectActivity.projectId) {
        return 'partial';
      }
    }

    return 'perfect';
  }

  /**
   * Create minimal working session
   */
  private createMinimalSession(baseSession: TMUXSession, sessionId: SessionId): TMUXSession {
    return {
      ...baseSession,
      id: sessionId,
      status: TMUXSessionStatus.ACTIVE,
      lastActivityAt: new Date(),
      // Ensure all panels have basic project activities
      window: {
        ...baseSession.window,
        panels: baseSession.window.panels.map((panel, index) => ({
          ...panel,
          projectActivity: panel.projectActivity || this.createDefaultProjectActivity(index),
        })) as [any, any, any, any],
      },
    };
  }

  /**
   * Create fresh session with default configuration
   */
  private createFreshSession(sessionId: SessionId): TMUXSession {
    const now = new Date();
    
    return {
      id: sessionId,
      name: `recovered-session-${sessionId}`,
      status: TMUXSessionStatus.ACTIVE,
      window: {
        id: uuidv4() as any,
        sessionId,
        name: `${sessionId}-main`,
        panels: [
          this.createDefaultPanel(0, 'top-left' as any),
          this.createDefaultPanel(1, 'top-right' as any),
          this.createDefaultPanel(2, 'bottom-left' as any),
          this.createDefaultPanel(3, 'bottom-right' as any),
        ] as [any, any, any, any],
        isActive: true,
        createdAt: now,
      },
      projectRange: { start: 1, end: 4 },
      websocketConnections: [],
      persistenceConfig: {
        enabled: true,
        saveInterval: 30000,
        lastSave: now,
      },
      createdAt: now,
      lastActivityAt: now,
    };
  }

  /**
   * Create default panel
   */
  private createDefaultPanel(index: number, position: any): any {
    return {
      id: uuidv4(),
      position,
      projectActivity: this.createDefaultProjectActivity(index),
      dimensions: { width: 40, height: 12 },
      isActive: index === 0,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };
  }

  /**
   * Create default project activity
   */
  private createDefaultProjectActivity(index: number): ProjectActivity {
    return {
      projectId: `recovered-project-${index + 1}` as ProjectContextId,
      agentId: `recovered-agent-${index + 1}` as AgentInstanceId,
      status: 'idle' as any,
      lastUpdate: new Date(),
      progressPercentage: 0,
      outputBuffer: [],
      errorBuffer: [],
      resourceUsage: { cpu: 0, memory: 0, networkIO: 0 },
    };
  }

  /**
   * Get session file path
   */
  private getSessionPath(sessionId: SessionId): string {
    return join(this.config.dataDirectory, 'sessions', `${sessionId}.json`);
  }

  /**
   * Calculate checksum for data
   */
  private async calculateChecksum(data: string): Promise<string> {
    // In a real implementation, would use crypto module
    return `checksum-${data.length}-${Date.now()}`;
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = join(
      this.config.dataDirectory,
      'backups',
      `${metadata.sessionId}-${metadata.backupId}.backup.json`
    );
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  /**
   * Load backup metadata
   */
  private async loadBackupMetadata(metadataPath: string): Promise<BackupMetadata> {
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Update recovery information
   */
  private updateRecoveryInfo(sessionId: SessionId): void {
    const existing = this.recoveryInfo.get(sessionId);
    const sessionState = this.persistedSessions.get(sessionId);
    
    if (sessionState) {
      const recoveryInfo: SessionRecoveryInfo = {
        sessionId,
        lastKnownState: sessionState.sessionData,
        recoveryAttempts: existing?.recoveryAttempts || 0,
        lastAttempt: new Date(),
        canRecover: true,
        recoveryStrategy: 'restart',
      };
      
      this.recoveryInfo.set(sessionId, recoveryInfo);
    }
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Get recovery information for session
   */
  getRecoveryInfo(sessionId: SessionId): SessionRecoveryInfo | undefined {
    return this.recoveryInfo.get(sessionId);
  }

  /**
   * List all persisted sessions
   */
  getPersistedSessions(): readonly SessionId[] {
    return Array.from(this.persistedSessions.keys());
  }

  /**
   * Get persistence statistics
   */
  getStats(): {
    readonly persistedSessions: number;
    readonly totalBackups: number;
    readonly totalStorageUsed: number;
    readonly oldestBackup: Date | null;
    readonly newestBackup: Date | null;
  } {
    const backups = Array.from(this.backupMetadata.values());
    
    return {
      persistedSessions: this.persistedSessions.size,
      totalBackups: backups.length,
      totalStorageUsed: backups.reduce((sum, backup) => sum + backup.size, 0),
      oldestBackup: backups.length > 0 ? new Date(Math.min(...backups.map(b => b.timestamp.getTime()))) : null,
      newestBackup: backups.length > 0 ? new Date(Math.max(...backups.map(b => b.timestamp.getTime()))) : null,
    };
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Final save of all sessions
    await this.saveAllSessions();
    
    this.emit('cleanup-completed');
  }
}