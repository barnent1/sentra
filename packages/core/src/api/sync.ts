/**
 * Data Synchronization for Project State Management
 * 
 * Provides bidirectional synchronization between local CLI state and remote
 * FastAPI backend, ensuring consistency across all project interactions.
 * Handles conflict resolution, offline mode, and real-time updates.
 * 
 * @module DataSync
 */

import type {
  ProjectResponse,
  TaskResponse,
  AgentResponse,
  WebSocketMessage,
  ProjectUpdateMessage,
  TaskUpdateMessage,
  AgentUpdateMessage
} from './types';

import type { Brand } from '@sentra/types';

import { SentraAPIClient } from './client';
import { SentraWebSocketClient } from './websocket';

// ============================================================================
// SYNC TYPES
// ============================================================================

export type SyncId = Brand<string, 'SyncId'>;
export type VersionId = Brand<string, 'VersionId'>;

export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  SYNCING: 'syncing',
  CONFLICT: 'conflict',
  ERROR: 'error',
  OFFLINE: 'offline'
} as const;

export type SyncStatusType = typeof SyncStatus[keyof typeof SyncStatus];

export const ChangeType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
} as const;

export type ChangeTypeEnum = typeof ChangeType[keyof typeof ChangeType];

export const ConflictResolution = {
  LOCAL_WINS: 'local_wins',
  REMOTE_WINS: 'remote_wins',
  MANUAL: 'manual',
  MERGE: 'merge'
} as const;

export type ConflictResolutionType = typeof ConflictResolution[keyof typeof ConflictResolution];

// ============================================================================
// SYNC INTERFACES
// ============================================================================

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

// ============================================================================
// SYNC STATE STORAGE
// ============================================================================

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

// ============================================================================
// IN-MEMORY SYNC STORAGE
// ============================================================================

class MemorySyncStorage implements SyncStorage {
  private readonly entities = new Map<string, SyncedEntity>();
  private readonly pendingChanges = new Map<SyncId, SyncChange>();
  private readonly conflicts = new Map<string, SyncConflict>();

  async getEntity<T>(id: string): Promise<SyncedEntity<T> | null> {
    const entity = this.entities.get(id);
    return entity as SyncedEntity<T> | null;
  }

  async setEntity<T>(entity: SyncedEntity<T>): Promise<void> {
    this.entities.set(entity.id, entity);
  }

  async removeEntity(id: string): Promise<void> {
    this.entities.delete(id);
  }

  async getAllEntities(): Promise<readonly SyncedEntity[]> {
    return Array.from(this.entities.values());
  }

  async getPendingChanges(): Promise<readonly SyncChange[]> {
    return Array.from(this.pendingChanges.values());
  }

  async addPendingChange(change: SyncChange): Promise<void> {
    this.pendingChanges.set(change.syncId, change);
  }

  async removePendingChange(syncId: SyncId): Promise<void> {
    this.pendingChanges.delete(syncId);
  }

  async getConflicts(): Promise<readonly SyncConflict[]> {
    return Array.from(this.conflicts.values());
  }

  async addConflict(conflict: SyncConflict): Promise<void> {
    this.conflicts.set(conflict.conflictId, conflict);
  }

  async removeConflict(conflictId: string): Promise<void> {
    this.conflicts.delete(conflictId);
  }

  async clear(): Promise<void> {
    this.entities.clear();
    this.pendingChanges.clear();
    this.conflicts.clear();
  }
}

// ============================================================================
// DATA SYNCHRONIZATION MANAGER
// ============================================================================

export class DataSynchronizationManager {
  private readonly config: SyncConfiguration;
  private readonly apiClient: SentraAPIClient;
  private readonly wsClient: SentraWebSocketClient;
  private readonly storage: SyncStorage;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isOnline = true;
  private metrics: SyncMetrics;

  constructor(
    config: SyncConfiguration,
    apiClient: SentraAPIClient,
    wsClient: SentraWebSocketClient,
    storage?: SyncStorage
  ) {
    this.config = config;
    this.apiClient = apiClient;
    this.wsClient = wsClient;
    this.storage = storage || new MemorySyncStorage();
    
    this.metrics = {
      totalEntities: 0,
      syncedEntities: 0,
      pendingChanges: 0,
      conflicts: 0,
      avgSyncDuration: 0,
      syncErrors: 0,
      offlineChanges: 0,
    };

    this.setupWebSocketHandlers();
  }

  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      // Load existing sync state
      await this.loadSyncState();
      
      // Start periodic sync if enabled
      if (this.config.syncInterval > 0) {
        this.startPeriodicSync();
      }

      // Perform initial sync
      await this.performFullSync();

      this.log('info', 'Data synchronization initialized');
      
    } catch (error) {
      this.log('error', 'Failed to initialize sync:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.stopPeriodicSync();
    
    // Attempt final sync of pending changes
    if (this.isOnline) {
      await this.syncPendingChanges();
    }

    this.log('info', 'Data synchronization shut down');
  }

  // ============================================================================
  // ENTITY MANAGEMENT
  // ============================================================================

  async syncProject(project: ProjectResponse): Promise<void> {
    const entity: SyncedEntity<ProjectResponse> = {
      id: project.id,
      type: 'project',
      data: project,
      version: this.generateVersion(),
      localVersion: this.generateVersion(),
      remoteVersion: this.generateVersion(),
      status: SyncStatus.SYNCED,
      lastSynced: new Date(),
      lastModified: new Date(),
    };

    await this.storage.setEntity(entity);
    this.updateMetrics();
  }

  async syncTask(task: TaskResponse): Promise<void> {
    const entity: SyncedEntity<TaskResponse> = {
      id: task.id,
      type: 'task',
      data: task,
      version: this.generateVersion(),
      localVersion: this.generateVersion(),
      remoteVersion: this.generateVersion(),
      status: SyncStatus.SYNCED,
      lastSynced: new Date(),
      lastModified: new Date(),
    };

    await this.storage.setEntity(entity);
    this.updateMetrics();
  }

  async syncAgent(agent: AgentResponse): Promise<void> {
    const entity: SyncedEntity<AgentResponse> = {
      id: agent.id,
      type: 'agent',
      data: agent,
      version: this.generateVersion(),
      localVersion: this.generateVersion(),
      remoteVersion: this.generateVersion(),
      status: SyncStatus.SYNCED,
      lastSynced: new Date(),
      lastModified: new Date(),
    };

    await this.storage.setEntity(entity);
    this.updateMetrics();
  }

  async markForSync<T>(
    entityId: string,
    entityType: 'project' | 'task' | 'agent',
    changeType: ChangeTypeEnum,
    localData?: T
  ): Promise<void> {
    const syncId = this.generateSyncId();
    const change: SyncChange<T> = {
      syncId,
      entityId,
      entityType,
      changeType,
      localData,
      timestamp: new Date(),
    };

    await this.storage.addPendingChange(change);
    
    // Update entity status
    const entity = await this.storage.getEntity(entityId);
    if (entity) {
      const updatedEntity = {
        ...entity,
        status: SyncStatus.PENDING,
        changeType,
        lastModified: new Date(),
      };
      await this.storage.setEntity(updatedEntity);
    }

    this.updateMetrics();
    
    // Trigger immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncPendingChanges(), 100);
    }
  }

  // ============================================================================
  // SYNCHRONIZATION OPERATIONS
  // ============================================================================

  async performFullSync(): Promise<void> {
    if (this.isSyncing) {
      this.log('debug', 'Sync already in progress, skipping full sync');
      return;
    }

    const startTime = Date.now();
    this.isSyncing = true;

    try {
      this.log('info', 'Starting full synchronization');

      // Check connectivity
      const healthCheck = await this.apiClient.healthCheck();
      this.isOnline = healthCheck.success;

      if (!this.isOnline) {
        this.log('warn', 'API unavailable, entering offline mode');
        return;
      }

      // Sync pending changes first
      await this.syncPendingChanges();

      // Pull remote changes
      await this.pullRemoteChanges();

      // Update sync timestamp
      this.metrics = {
        ...this.metrics,
        lastSyncTime: new Date()
      };
      
      const duration = Date.now() - startTime;
      this.updateAvgSyncDuration(duration);
      
      this.log('info', `Full synchronization completed in ${duration}ms`);

    } catch (error) {
      this.metrics = {
        ...this.metrics,
        syncErrors: this.metrics.syncErrors + 1
      };
      this.log('error', 'Full sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncPendingChanges(): Promise<void> {
    const pendingChanges = await this.storage.getPendingChanges();
    
    if (pendingChanges.length === 0) {
      return;
    }

    this.log('info', `Syncing ${pendingChanges.length} pending changes`);

    for (const change of pendingChanges) {
      try {
        await this.syncSingleChange(change);
        await this.storage.removePendingChange(change.syncId);
      } catch (error) {
        this.log('error', `Failed to sync change ${change.syncId}:`, error);
        // Leave change in pending state for retry
      }
    }

    this.updateMetrics();
  }

  private async syncSingleChange(change: SyncChange): Promise<void> {
    switch (change.entityType) {
      case 'project':
        await this.syncProjectChange(change as SyncChange<ProjectResponse>);
        break;
      case 'task':
        await this.syncTaskChange(change as SyncChange<TaskResponse>);
        break;
      case 'agent':
        await this.syncAgentChange(change as SyncChange<AgentResponse>);
        break;
      default:
        throw new Error(`Unknown entity type: ${change.entityType}`);
    }
  }

  private async syncProjectChange(change: SyncChange<ProjectResponse>): Promise<void> {
    switch (change.changeType) {
      case ChangeType.CREATE:
        if (change.localData) {
          const requestData: { name: string; description?: string } = {
            name: change.localData.name
          };
          if (change.localData.description !== undefined) {
            requestData.description = change.localData.description;
          }
          const response = await this.apiClient.createProject(requestData);
          if (response.success) {
            await this.syncProject(response.data);
          }
        }
        break;
        
      case ChangeType.UPDATE:
        // Would need an update project endpoint
        this.log('warn', 'Project updates not yet implemented');
        break;
        
      case ChangeType.DELETE:
        // Would need a delete project endpoint
        this.log('warn', 'Project deletion not yet implemented');
        break;
    }
  }

  private async syncTaskChange(change: SyncChange<TaskResponse>): Promise<void> {
    switch (change.changeType) {
      case ChangeType.CREATE:
        if (change.localData) {
          const response = await this.apiClient.createTask({
            project_name: change.localData.project_name,
            title: change.localData.title,
            spec: change.localData.spec,
            priority: change.localData.priority,
            assigned_agent_role: change.localData.assigned_agent_name as any,
          });
          if (response.success) {
            await this.syncTask(response.data);
          }
        }
        break;
        
      case ChangeType.UPDATE:
        // Would need an update task endpoint
        this.log('warn', 'Task updates not yet implemented');
        break;
        
      case ChangeType.DELETE:
        // Would need a delete task endpoint
        this.log('warn', 'Task deletion not yet implemented');
        break;
    }
  }

  private async syncAgentChange(change: SyncChange<AgentResponse>): Promise<void> {
    switch (change.changeType) {
      case ChangeType.CREATE:
        if (change.localData) {
          const response = await this.apiClient.createAgent({
            name: change.localData.name,
            role: change.localData.role,
            prompt: change.localData.prompt,
            config: change.localData.config,
          });
          if (response.success) {
            await this.syncAgent(response.data);
          }
        }
        break;
        
      case ChangeType.UPDATE:
        // Would need an update agent endpoint
        this.log('warn', 'Agent updates not yet implemented');
        break;
        
      case ChangeType.DELETE:
        // Would need a delete agent endpoint
        this.log('warn', 'Agent deletion not yet implemented');
        break;
    }
  }

  // ============================================================================
  // REMOTE SYNC OPERATIONS
  // ============================================================================

  private async pullRemoteChanges(): Promise<void> {
    try {
      // Pull projects
      // Note: Need to implement list projects endpoint
      
      // Pull tasks
      const tasksResponse = await this.apiClient.listTasks();
      if (tasksResponse.success) {
        for (const task of tasksResponse.data) {
          await this.mergeRemoteTask(task);
        }
      }

      // Pull agents
      const agentsResponse = await this.apiClient.listAgents();
      if (agentsResponse.success) {
        for (const agent of agentsResponse.data) {
          await this.mergeRemoteAgent(agent);
        }
      }

    } catch (error) {
      this.log('error', 'Failed to pull remote changes:', error);
    }
  }

  private async mergeRemoteTask(remoteTask: TaskResponse): Promise<void> {
    const localEntity = await this.storage.getEntity<TaskResponse>(remoteTask.id);
    
    if (!localEntity) {
      // New remote task
      await this.syncTask(remoteTask);
      return;
    }

    // Check for conflicts
    if (this.hasConflict(localEntity, remoteTask)) {
      await this.handleConflict(localEntity, remoteTask);
    } else {
      // No conflict, update local with remote data
      const updatedEntity: SyncedEntity<TaskResponse> = {
        ...localEntity,
        data: remoteTask,
        remoteVersion: this.generateVersion(),
        status: SyncStatus.SYNCED,
        lastSynced: new Date(),
      };
      await this.storage.setEntity(updatedEntity);
    }
  }

  private async mergeRemoteAgent(remoteAgent: AgentResponse): Promise<void> {
    const localEntity = await this.storage.getEntity<AgentResponse>(remoteAgent.id);
    
    if (!localEntity) {
      // New remote agent
      await this.syncAgent(remoteAgent);
      return;
    }

    // Check for conflicts
    if (this.hasConflict(localEntity, remoteAgent)) {
      await this.handleConflict(localEntity, remoteAgent);
    } else {
      // No conflict, update local with remote data
      const updatedEntity: SyncedEntity<AgentResponse> = {
        ...localEntity,
        data: remoteAgent,
        remoteVersion: this.generateVersion(),
        status: SyncStatus.SYNCED,
        lastSynced: new Date(),
      };
      await this.storage.setEntity(updatedEntity);
    }
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  private hasConflict<T>(localEntity: SyncedEntity<T>, remoteData: T): boolean {
    if (localEntity.status !== SyncStatus.PENDING) {
      return false;
    }

    // Simple conflict detection based on update timestamps
    const localUpdated = new Date(localEntity.lastModified);
    const remoteUpdated = new Date((remoteData as any).updated_at);
    
    // If local changes are newer and remote has also been updated
    return localUpdated > localEntity.lastSynced && remoteUpdated > localEntity.lastSynced;
  }

  private async handleConflict<T>(localEntity: SyncedEntity<T>, remoteData: T): Promise<void> {
    const conflict: SyncConflict<T> = {
      conflictId: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId: localEntity.id,
      entityType: localEntity.type,
      localData: localEntity.data,
      remoteData,
      localVersion: localEntity.localVersion,
      remoteVersion: this.generateVersion(),
      detectedAt: new Date(),
    };

    await this.storage.addConflict(conflict);
    
    // Update entity status
    const updatedEntity = {
      ...localEntity,
      status: SyncStatus.CONFLICT,
    };
    await this.storage.setEntity(updatedEntity);

    this.metrics = {
      ...this.metrics,
      conflicts: this.metrics.conflicts + 1
    };
    this.log('warn', `Conflict detected for ${localEntity.type} ${localEntity.id}`);

    // Auto-resolve based on configuration
    if (this.config.conflictResolution !== ConflictResolution.MANUAL) {
      await this.resolveConflict(conflict.conflictId, this.config.conflictResolution);
    }
  }

  async resolveConflict<T>(
    conflictId: string, 
    resolution: ConflictResolutionType
  ): Promise<void> {
    const conflict = (await this.storage.getConflicts()).find(c => c.conflictId === conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const entity = await this.storage.getEntity(conflict.entityId);
    if (!entity) {
      throw new Error(`Entity ${conflict.entityId} not found`);
    }

    let resolvedData: T;
    let resolvedVersion: VersionId;

    switch (resolution) {
      case ConflictResolution.LOCAL_WINS:
        resolvedData = conflict.localData as T;
        resolvedVersion = conflict.localVersion;
        break;
        
      case ConflictResolution.REMOTE_WINS:
        resolvedData = conflict.remoteData as T;
        resolvedVersion = conflict.remoteVersion;
        break;
        
      case ConflictResolution.MERGE:
        resolvedData = this.mergeData(conflict.localData as T, conflict.remoteData as T);
        resolvedVersion = this.generateVersion();
        break;
        
      default:
        throw new Error(`Unsupported conflict resolution: ${resolution}`);
    }

    // Update entity with resolved data
    const updatedEntity: SyncedEntity<T> = {
      ...entity,
      data: resolvedData,
      version: resolvedVersion,
      localVersion: resolvedVersion,
      remoteVersion: resolvedVersion,
      status: SyncStatus.SYNCED,
      lastSynced: new Date(),
    };

    await this.storage.setEntity(updatedEntity);
    await this.storage.removeConflict(conflictId);
    
    this.metrics = {
      ...this.metrics,
      conflicts: this.metrics.conflicts - 1
    };
    this.log('info', `Resolved conflict ${conflictId} using ${resolution}`);
  }

  private mergeData<T>(localData: T, remoteData: T): T {
    // Simple merge strategy - in practice, this would be more sophisticated
    if (typeof localData === 'object' && typeof remoteData === 'object') {
      return { ...remoteData, ...localData };
    }
    return localData; // Default to local
  }

  // ============================================================================
  // WEBSOCKET HANDLERS
  // ============================================================================

  private setupWebSocketHandlers(): void {
    if (!this.config.enableRealTime) {
      return;
    }

    this.wsClient.setMessageHandlers({
      onProjectUpdate: async (message: WebSocketMessage<ProjectUpdateMessage>) => {
        await this.handleRealTimeProjectUpdate(message.data);
      },
      onTaskUpdate: async (message: WebSocketMessage<TaskUpdateMessage>) => {
        await this.handleRealTimeTaskUpdate(message.data);
      },
      onAgentUpdate: async (message: WebSocketMessage<AgentUpdateMessage>) => {
        await this.handleRealTimeAgentUpdate(message.data);
      },
    });
  }

  private async handleRealTimeProjectUpdate(update: ProjectUpdateMessage): Promise<void> {
    this.log('debug', `Real-time project update: ${update.project_id}`);
    // Trigger sync for affected project
    const entity = await this.storage.getEntity(update.project_id);
    if (entity) {
      await this.performEntitySync(entity);
    }
  }

  private async handleRealTimeTaskUpdate(update: TaskUpdateMessage): Promise<void> {
    this.log('debug', `Real-time task update: ${update.task_id}`);
    // Trigger sync for affected task
    const entity = await this.storage.getEntity(update.task_id);
    if (entity) {
      await this.performEntitySync(entity);
    }
  }

  private async handleRealTimeAgentUpdate(update: AgentUpdateMessage): Promise<void> {
    this.log('debug', `Real-time agent update: ${update.agent_id}`);
    // Trigger sync for affected agent
    const entity = await this.storage.getEntity(update.agent_id);
    if (entity) {
      await this.performEntitySync(entity);
    }
  }

  private async performEntitySync(entity: SyncedEntity): Promise<void> {
    // Implementation would fetch latest data for the entity
    this.log('debug', `Syncing entity: ${entity.type} ${entity.id}`);
  }

  // ============================================================================
  // PERIODIC SYNC
  // ============================================================================

  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      if (!this.isSyncing && this.isOnline) {
        await this.performFullSync();
      }
    }, this.config.syncInterval);
  }

  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  private async loadSyncState(): Promise<void> {
    const entities = await this.storage.getAllEntities();
    const pendingChanges = await this.storage.getPendingChanges();
    const conflicts = await this.storage.getConflicts();

    this.metrics = {
      ...this.metrics,
      totalEntities: entities.length,
      syncedEntities: entities.filter(e => e.status === SyncStatus.SYNCED).length,
      pendingChanges: pendingChanges.length,
      conflicts: conflicts.length,
      offlineChanges: pendingChanges.filter(() => !this.isOnline).length
    };

    this.log('info', `Loaded sync state: ${entities.length} entities, ${pendingChanges.length} pending changes, ${conflicts.length} conflicts`);
  }

  private updateMetrics(): void {
    // Update metrics asynchronously
    setTimeout(async () => {
      const entities = await this.storage.getAllEntities();
      const pendingChanges = await this.storage.getPendingChanges();
      const conflicts = await this.storage.getConflicts();

      this.metrics = {
        ...this.metrics,
        totalEntities: entities.length,
        syncedEntities: entities.filter(e => e.status === SyncStatus.SYNCED).length,
        pendingChanges: pendingChanges.length,
        conflicts: conflicts.length,
        offlineChanges: this.isOnline ? 0 : pendingChanges.length
      };
    }, 0);
  }

  private updateAvgSyncDuration(duration: number): void {
    const totalSyncs = this.metrics.syncedEntities + 1;
    this.metrics = {
      ...this.metrics,
      avgSyncDuration: (this.metrics.avgSyncDuration * (totalSyncs - 1) + duration) / totalSyncs
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateSyncId(): SyncId {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as SyncId;
  }

  private generateVersion(): VersionId {
    return `v${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as VersionId;
  }

  private log(level: string, message: string, ...args: unknown[]): void {
    if (this.config.logging.enabled &&
        ['debug', 'info', 'warn', 'error'].indexOf(level) >= 
        ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
      const logFn = (console as any)[level] || console.log;
      logFn(`[Sync] ${message}`, ...args);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  async getConflicts(): Promise<readonly SyncConflict[]> {
    return await this.storage.getConflicts();
  }

  async getPendingChanges(): Promise<readonly SyncChange[]> {
    return await this.storage.getPendingChanges();
  }

  async getEntity<T>(id: string): Promise<SyncedEntity<T> | null> {
    return await this.storage.getEntity<T>(id);
  }

  isOnlineMode(): boolean {
    return this.isOnline;
  }

  isSynchronizing(): boolean {
    return this.isSyncing;
  }

  async forcePull(): Promise<void> {
    await this.pullRemoteChanges();
  }

  async forcePush(): Promise<void> {
    await this.syncPendingChanges();
  }

  async clearAllData(): Promise<void> {
    await this.storage.clear();
    this.updateMetrics();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export const createDataSyncManager = (
  config: SyncConfiguration,
  apiClient: SentraAPIClient,
  wsClient: SentraWebSocketClient,
  storage?: SyncStorage
): DataSynchronizationManager => {
  return new DataSynchronizationManager(config, apiClient, wsClient, storage);
};

export const createDefaultSyncManager = (
  apiClient: SentraAPIClient,
  wsClient: SentraWebSocketClient
): DataSynchronizationManager => {
  return createDataSyncManager({
    syncInterval: 30000, // 30 seconds
    conflictResolution: ConflictResolution.REMOTE_WINS,
    enableOfflineMode: true,
    maxOfflineChanges: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    batchSize: 10,
    enableRealTime: true,
    logging: {
      enabled: true,
      level: 'info',
    },
  }, apiClient, wsClient);
};