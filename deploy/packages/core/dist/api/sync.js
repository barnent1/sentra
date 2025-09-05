/**
 * Data Synchronization for Project State Management
 *
 * Provides bidirectional synchronization between local CLI state and remote
 * FastAPI backend, ensuring consistency across all project interactions.
 * Handles conflict resolution, offline mode, and real-time updates.
 *
 * @module DataSync
 */
export const SyncStatus = {
    SYNCED: 'synced',
    PENDING: 'pending',
    SYNCING: 'syncing',
    CONFLICT: 'conflict',
    ERROR: 'error',
    OFFLINE: 'offline'
};
export const ChangeType = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete'
};
export const ConflictResolution = {
    LOCAL_WINS: 'local_wins',
    REMOTE_WINS: 'remote_wins',
    MANUAL: 'manual',
    MERGE: 'merge'
};
// ============================================================================
// IN-MEMORY SYNC STORAGE
// ============================================================================
class MemorySyncStorage {
    entities = new Map();
    pendingChanges = new Map();
    conflicts = new Map();
    async getEntity(id) {
        const entity = this.entities.get(id);
        return entity;
    }
    async setEntity(entity) {
        this.entities.set(entity.id, entity);
    }
    async removeEntity(id) {
        this.entities.delete(id);
    }
    async getAllEntities() {
        return Array.from(this.entities.values());
    }
    async getPendingChanges() {
        return Array.from(this.pendingChanges.values());
    }
    async addPendingChange(change) {
        this.pendingChanges.set(change.syncId, change);
    }
    async removePendingChange(syncId) {
        this.pendingChanges.delete(syncId);
    }
    async getConflicts() {
        return Array.from(this.conflicts.values());
    }
    async addConflict(conflict) {
        this.conflicts.set(conflict.conflictId, conflict);
    }
    async removeConflict(conflictId) {
        this.conflicts.delete(conflictId);
    }
    async clear() {
        this.entities.clear();
        this.pendingChanges.clear();
        this.conflicts.clear();
    }
}
// ============================================================================
// DATA SYNCHRONIZATION MANAGER
// ============================================================================
export class DataSynchronizationManager {
    config;
    apiClient;
    wsClient;
    storage;
    syncTimer = null;
    isSyncing = false;
    isOnline = true;
    metrics;
    constructor(config, apiClient, wsClient, storage) {
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
    async initialize() {
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
        }
        catch (error) {
            this.log('error', 'Failed to initialize sync:', error);
            throw error;
        }
    }
    async shutdown() {
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
    async syncProject(project) {
        const entity = {
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
    async syncTask(task) {
        const entity = {
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
    async syncAgent(agent) {
        const entity = {
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
    async markForSync(entityId, entityType, changeType, localData) {
        const syncId = this.generateSyncId();
        const change = {
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
    async performFullSync() {
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
        }
        catch (error) {
            this.metrics = {
                ...this.metrics,
                syncErrors: this.metrics.syncErrors + 1
            };
            this.log('error', 'Full sync failed:', error);
        }
        finally {
            this.isSyncing = false;
        }
    }
    async syncPendingChanges() {
        const pendingChanges = await this.storage.getPendingChanges();
        if (pendingChanges.length === 0) {
            return;
        }
        this.log('info', `Syncing ${pendingChanges.length} pending changes`);
        for (const change of pendingChanges) {
            try {
                await this.syncSingleChange(change);
                await this.storage.removePendingChange(change.syncId);
            }
            catch (error) {
                this.log('error', `Failed to sync change ${change.syncId}:`, error);
                // Leave change in pending state for retry
            }
        }
        this.updateMetrics();
    }
    async syncSingleChange(change) {
        switch (change.entityType) {
            case 'project':
                await this.syncProjectChange(change);
                break;
            case 'task':
                await this.syncTaskChange(change);
                break;
            case 'agent':
                await this.syncAgentChange(change);
                break;
            default:
                throw new Error(`Unknown entity type: ${change.entityType}`);
        }
    }
    async syncProjectChange(change) {
        switch (change.changeType) {
            case ChangeType.CREATE:
                if (change.localData) {
                    const requestData = {
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
    async syncTaskChange(change) {
        switch (change.changeType) {
            case ChangeType.CREATE:
                if (change.localData) {
                    const response = await this.apiClient.createTask({
                        project_name: change.localData.project_name,
                        title: change.localData.title,
                        spec: change.localData.spec,
                        priority: change.localData.priority,
                        assigned_agent_role: change.localData.assigned_agent_name,
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
    async syncAgentChange(change) {
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
    async pullRemoteChanges() {
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
        }
        catch (error) {
            this.log('error', 'Failed to pull remote changes:', error);
        }
    }
    async mergeRemoteTask(remoteTask) {
        const localEntity = await this.storage.getEntity(remoteTask.id);
        if (!localEntity) {
            // New remote task
            await this.syncTask(remoteTask);
            return;
        }
        // Check for conflicts
        if (this.hasConflict(localEntity, remoteTask)) {
            await this.handleConflict(localEntity, remoteTask);
        }
        else {
            // No conflict, update local with remote data
            const updatedEntity = {
                ...localEntity,
                data: remoteTask,
                remoteVersion: this.generateVersion(),
                status: SyncStatus.SYNCED,
                lastSynced: new Date(),
            };
            await this.storage.setEntity(updatedEntity);
        }
    }
    async mergeRemoteAgent(remoteAgent) {
        const localEntity = await this.storage.getEntity(remoteAgent.id);
        if (!localEntity) {
            // New remote agent
            await this.syncAgent(remoteAgent);
            return;
        }
        // Check for conflicts
        if (this.hasConflict(localEntity, remoteAgent)) {
            await this.handleConflict(localEntity, remoteAgent);
        }
        else {
            // No conflict, update local with remote data
            const updatedEntity = {
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
    hasConflict(localEntity, remoteData) {
        if (localEntity.status !== SyncStatus.PENDING) {
            return false;
        }
        // Simple conflict detection based on update timestamps
        const localUpdated = new Date(localEntity.lastModified);
        const remoteUpdated = new Date(remoteData.updated_at);
        // If local changes are newer and remote has also been updated
        return localUpdated > localEntity.lastSynced && remoteUpdated > localEntity.lastSynced;
    }
    async handleConflict(localEntity, remoteData) {
        const conflict = {
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
    async resolveConflict(conflictId, resolution) {
        const conflict = (await this.storage.getConflicts()).find(c => c.conflictId === conflictId);
        if (!conflict) {
            throw new Error(`Conflict ${conflictId} not found`);
        }
        const entity = await this.storage.getEntity(conflict.entityId);
        if (!entity) {
            throw new Error(`Entity ${conflict.entityId} not found`);
        }
        let resolvedData;
        let resolvedVersion;
        switch (resolution) {
            case ConflictResolution.LOCAL_WINS:
                resolvedData = conflict.localData;
                resolvedVersion = conflict.localVersion;
                break;
            case ConflictResolution.REMOTE_WINS:
                resolvedData = conflict.remoteData;
                resolvedVersion = conflict.remoteVersion;
                break;
            case ConflictResolution.MERGE:
                resolvedData = this.mergeData(conflict.localData, conflict.remoteData);
                resolvedVersion = this.generateVersion();
                break;
            default:
                throw new Error(`Unsupported conflict resolution: ${resolution}`);
        }
        // Update entity with resolved data
        const updatedEntity = {
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
    mergeData(localData, remoteData) {
        // Simple merge strategy - in practice, this would be more sophisticated
        if (typeof localData === 'object' && typeof remoteData === 'object') {
            return { ...remoteData, ...localData };
        }
        return localData; // Default to local
    }
    // ============================================================================
    // WEBSOCKET HANDLERS
    // ============================================================================
    setupWebSocketHandlers() {
        if (!this.config.enableRealTime) {
            return;
        }
        this.wsClient.setMessageHandlers({
            onProjectUpdate: async (message) => {
                await this.handleRealTimeProjectUpdate(message.data);
            },
            onTaskUpdate: async (message) => {
                await this.handleRealTimeTaskUpdate(message.data);
            },
            onAgentUpdate: async (message) => {
                await this.handleRealTimeAgentUpdate(message.data);
            },
        });
    }
    async handleRealTimeProjectUpdate(update) {
        this.log('debug', `Real-time project update: ${update.project_id}`);
        // Trigger sync for affected project
        const entity = await this.storage.getEntity(update.project_id);
        if (entity) {
            await this.performEntitySync(entity);
        }
    }
    async handleRealTimeTaskUpdate(update) {
        this.log('debug', `Real-time task update: ${update.task_id}`);
        // Trigger sync for affected task
        const entity = await this.storage.getEntity(update.task_id);
        if (entity) {
            await this.performEntitySync(entity);
        }
    }
    async handleRealTimeAgentUpdate(update) {
        this.log('debug', `Real-time agent update: ${update.agent_id}`);
        // Trigger sync for affected agent
        const entity = await this.storage.getEntity(update.agent_id);
        if (entity) {
            await this.performEntitySync(entity);
        }
    }
    async performEntitySync(entity) {
        // Implementation would fetch latest data for the entity
        this.log('debug', `Syncing entity: ${entity.type} ${entity.id}`);
    }
    // ============================================================================
    // PERIODIC SYNC
    // ============================================================================
    startPeriodicSync() {
        this.syncTimer = setInterval(async () => {
            if (!this.isSyncing && this.isOnline) {
                await this.performFullSync();
            }
        }, this.config.syncInterval);
    }
    stopPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    async loadSyncState() {
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
    updateMetrics() {
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
    updateAvgSyncDuration(duration) {
        const totalSyncs = this.metrics.syncedEntities + 1;
        this.metrics = {
            ...this.metrics,
            avgSyncDuration: (this.metrics.avgSyncDuration * (totalSyncs - 1) + duration) / totalSyncs
        };
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    generateSyncId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateVersion() {
        return `v${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    log(level, message, ...args) {
        if (this.config.logging.enabled &&
            ['debug', 'info', 'warn', 'error'].indexOf(level) >=
                ['debug', 'info', 'warn', 'error'].indexOf(this.config.logging.level)) {
            const logFn = console[level] || console.log;
            logFn(`[Sync] ${message}`, ...args);
        }
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    getMetrics() {
        return { ...this.metrics };
    }
    async getConflicts() {
        return await this.storage.getConflicts();
    }
    async getPendingChanges() {
        return await this.storage.getPendingChanges();
    }
    async getEntity(id) {
        return await this.storage.getEntity(id);
    }
    isOnlineMode() {
        return this.isOnline;
    }
    isSynchronizing() {
        return this.isSyncing;
    }
    async forcePull() {
        await this.pullRemoteChanges();
    }
    async forcePush() {
        await this.syncPendingChanges();
    }
    async clearAllData() {
        await this.storage.clear();
        this.updateMetrics();
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export const createDataSyncManager = (config, apiClient, wsClient, storage) => {
    return new DataSynchronizationManager(config, apiClient, wsClient, storage);
};
export const createDefaultSyncManager = (apiClient, wsClient) => {
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
//# sourceMappingURL=sync.js.map