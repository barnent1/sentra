/**
 * TMUX Session Persistence Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages session persistence, recovery, and state management for TMUX sessions,
 * ensuring sessions can be recovered after system restarts or failures.
 */
import { EventEmitter } from 'events';
import type { SessionId, TMUXSession, SessionRecoveryInfo } from './types';
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
export declare class SessionPersistenceManager extends EventEmitter {
    private readonly config;
    private readonly persistedSessions;
    private readonly recoveryInfo;
    private readonly backupMetadata;
    private autoSaveInterval?;
    private backupInterval?;
    constructor(config: PersistenceConfig);
    private initialize;
    private ensureDataDirectory;
    private loadExistingBackups;
    private startAutoSave;
    private startBackupSchedule;
    private setupEventHandlers;
    /**
     * Save session state to persistent storage
     */
    saveSession(session: TMUXSession): Promise<void>;
    /**
     * Load session state from persistent storage
     */
    loadSession(sessionId: SessionId): Promise<TMUXSession | null>;
    /**
     * Save all sessions in cache
     */
    saveAllSessions(): Promise<void>;
    /**
     * Delete persisted session
     */
    deleteSession(sessionId: SessionId): Promise<void>;
    /**
     * Recover session using specified strategy
     */
    recoverSession(sessionId: SessionId, strategy: RecoveryStrategy): Promise<RecoveryResult>;
    /**
     * Perform full session restore
     */
    private performFullRestore;
    /**
     * Perform partial session restore
     */
    private performPartialRestore;
    /**
     * Perform manual restore (returns data for manual review)
     */
    private performManualRestore;
    /**
     * Rebuild session from scratch
     */
    private performRebuildFromScratch;
    /**
     * Create backup for session
     */
    createBackup(sessionId: SessionId, backupType?: 'full' | 'incremental'): Promise<BackupMetadata>;
    /**
     * Create backups for all sessions
     */
    createBackupsForAllSessions(): Promise<readonly BackupMetadata[]>;
    /**
     * Restore session from backup
     */
    restoreFromBackup(backup: BackupMetadata): Promise<TMUXSession>;
    /**
     * Find latest backup for session
     */
    findLatestBackup(sessionId: SessionId): Promise<BackupMetadata | null>;
    /**
     * Get all backups for session
     */
    getBackupsForSession(sessionId: SessionId): Promise<readonly BackupMetadata[]>;
    /**
     * Clean up old backups
     */
    private cleanupOldBackups;
    /**
     * Delete backup
     */
    private deleteBackup;
    /**
     * Create persisted session state
     */
    private createPersistedSessionState;
    /**
     * Create checkpoint for incremental backup
     */
    private createCheckpoint;
    /**
     * Calculate changes between session states
     */
    private calculateChanges;
    /**
     * Verify session integrity
     */
    private verifySessionIntegrity;
    /**
     * Assess session integrity
     */
    private assessSessionIntegrity;
    /**
     * Create minimal working session
     */
    private createMinimalSession;
    /**
     * Create fresh session with default configuration
     */
    private createFreshSession;
    /**
     * Create default panel
     */
    private createDefaultPanel;
    /**
     * Create default project activity
     */
    private createDefaultProjectActivity;
    /**
     * Get session file path
     */
    private getSessionPath;
    /**
     * Calculate checksum for data
     */
    private calculateChecksum;
    /**
     * Save backup metadata
     */
    private saveBackupMetadata;
    /**
     * Load backup metadata
     */
    private loadBackupMetadata;
    /**
     * Update recovery information
     */
    private updateRecoveryInfo;
    /**
     * Get recovery information for session
     */
    getRecoveryInfo(sessionId: SessionId): SessionRecoveryInfo | undefined;
    /**
     * List all persisted sessions
     */
    getPersistedSessions(): readonly SessionId[];
    /**
     * Get persistence statistics
     */
    getStats(): {
        readonly persistedSessions: number;
        readonly totalBackups: number;
        readonly totalStorageUsed: number;
        readonly oldestBackup: Date | null;
        readonly newestBackup: Date | null;
    };
    /**
     * Cleanup and shutdown
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=SessionPersistenceManager.d.ts.map