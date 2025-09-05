/**
 * Data Synchronization for Project State Management
 *
 * Provides bidirectional synchronization between local CLI state and remote
 * FastAPI backend, ensuring consistency across all project interactions.
 * Handles conflict resolution, offline mode, and real-time updates.
 *
 * @module DataSync
 */
import type { ProjectResponse, TaskResponse, AgentResponse } from './types';
import type { Brand } from '@sentra/types';
import { SentraAPIClient } from './client';
import { SentraWebSocketClient } from './websocket';
export type SyncId = Brand<string, 'SyncId'>;
export type VersionId = Brand<string, 'VersionId'>;
export declare const SyncStatus: {
    readonly SYNCED: "synced";
    readonly PENDING: "pending";
    readonly SYNCING: "syncing";
    readonly CONFLICT: "conflict";
    readonly ERROR: "error";
    readonly OFFLINE: "offline";
};
export type SyncStatusType = typeof SyncStatus[keyof typeof SyncStatus];
export declare const ChangeType: {
    readonly CREATE: "create";
    readonly UPDATE: "update";
    readonly DELETE: "delete";
};
export type ChangeTypeEnum = typeof ChangeType[keyof typeof ChangeType];
export declare const ConflictResolution: {
    readonly LOCAL_WINS: "local_wins";
    readonly REMOTE_WINS: "remote_wins";
    readonly MANUAL: "manual";
    readonly MERGE: "merge";
};
export type ConflictResolutionType = typeof ConflictResolution[keyof typeof ConflictResolution];
export interface SyncedEntity<T = unknown> {
    readonly id: string;
    readonly type: 'project' | 'task' | 'agent';
    readonly data: T;
    readonly version: VersionId;
    readonly localVersion: VersionId;
    readonly remoteVersion: VersionId;
    readonly status: SyncStatusType;
    readonly lastSynced: Date;
    readonly lastModified: Date;
    readonly changeType?: ChangeTypeEnum;
}
export interface SyncChange<T = unknown> {
    readonly syncId: SyncId;
    readonly entityId: string;
    readonly entityType: 'project' | 'task' | 'agent';
    readonly changeType: ChangeTypeEnum;
    readonly localData?: T | undefined;
    readonly remoteData?: T | undefined;
    readonly timestamp: Date;
    readonly conflictResolution?: ConflictResolutionType | undefined;
}
export interface SyncConflict<T = unknown> {
    readonly conflictId: string;
    readonly entityId: string;
    readonly entityType: 'project' | 'task' | 'agent';
    readonly localData: T;
    readonly remoteData: T;
    readonly localVersion: VersionId;
    readonly remoteVersion: VersionId;
    readonly detectedAt: Date;
    readonly resolvedAt?: Date;
    readonly resolution?: ConflictResolutionType;
}
export interface SyncConfiguration {
    readonly syncInterval: number;
    readonly conflictResolution: ConflictResolutionType;
    readonly enableOfflineMode: boolean;
    readonly maxOfflineChanges: number;
    readonly retryAttempts: number;
    readonly retryDelay: number;
    readonly batchSize: number;
    readonly enableRealTime: boolean;
    readonly logging: {
        readonly enabled: boolean;
        readonly level: 'debug' | 'info' | 'warn' | 'error';
    };
}
export interface SyncMetrics {
    readonly totalEntities: number;
    readonly syncedEntities: number;
    readonly pendingChanges: number;
    readonly conflicts: number;
    readonly lastSyncTime?: Date;
    readonly avgSyncDuration: number;
    readonly syncErrors: number;
    readonly offlineChanges: number;
}
export interface SyncStorage {
    getEntity<T>(id: string): Promise<SyncedEntity<T> | null>;
    setEntity<T>(entity: SyncedEntity<T>): Promise<void>;
    removeEntity(id: string): Promise<void>;
    getAllEntities(): Promise<readonly SyncedEntity[]>;
    getPendingChanges(): Promise<readonly SyncChange[]>;
    addPendingChange(change: SyncChange): Promise<void>;
    removePendingChange(syncId: SyncId): Promise<void>;
    getConflicts(): Promise<readonly SyncConflict[]>;
    addConflict(conflict: SyncConflict): Promise<void>;
    removeConflict(conflictId: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class DataSynchronizationManager {
    private readonly config;
    private readonly apiClient;
    private readonly wsClient;
    private readonly storage;
    private syncTimer;
    private isSyncing;
    private isOnline;
    private metrics;
    constructor(config: SyncConfiguration, apiClient: SentraAPIClient, wsClient: SentraWebSocketClient, storage?: SyncStorage);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    syncProject(project: ProjectResponse): Promise<void>;
    syncTask(task: TaskResponse): Promise<void>;
    syncAgent(agent: AgentResponse): Promise<void>;
    markForSync<T>(entityId: string, entityType: 'project' | 'task' | 'agent', changeType: ChangeTypeEnum, localData?: T): Promise<void>;
    performFullSync(): Promise<void>;
    syncPendingChanges(): Promise<void>;
    private syncSingleChange;
    private syncProjectChange;
    private syncTaskChange;
    private syncAgentChange;
    private pullRemoteChanges;
    private mergeRemoteTask;
    private mergeRemoteAgent;
    private hasConflict;
    private handleConflict;
    resolveConflict<T>(conflictId: string, resolution: ConflictResolutionType): Promise<void>;
    private mergeData;
    private setupWebSocketHandlers;
    private handleRealTimeProjectUpdate;
    private handleRealTimeTaskUpdate;
    private handleRealTimeAgentUpdate;
    private performEntitySync;
    private startPeriodicSync;
    private stopPeriodicSync;
    private loadSyncState;
    private updateMetrics;
    private updateAvgSyncDuration;
    private generateSyncId;
    private generateVersion;
    private log;
    getMetrics(): SyncMetrics;
    getConflicts(): Promise<readonly SyncConflict[]>;
    getPendingChanges(): Promise<readonly SyncChange[]>;
    getEntity<T>(id: string): Promise<SyncedEntity<T> | null>;
    isOnlineMode(): boolean;
    isSynchronizing(): boolean;
    forcePull(): Promise<void>;
    forcePush(): Promise<void>;
    clearAllData(): Promise<void>;
}
export declare const createDataSyncManager: (config: SyncConfiguration, apiClient: SentraAPIClient, wsClient: SentraWebSocketClient, storage?: SyncStorage) => DataSynchronizationManager;
export declare const createDefaultSyncManager: (apiClient: SentraAPIClient, wsClient: SentraWebSocketClient) => DataSynchronizationManager;
//# sourceMappingURL=sync.d.ts.map