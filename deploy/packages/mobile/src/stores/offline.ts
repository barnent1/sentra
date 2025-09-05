import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'
import type { 
  OfflineData,
  SyncStatus,
  ApprovalRequest,
  SystemAlert,
  MobileAgentStatus,
  MobileTaskStatus
} from '../types'

// IndexedDB schema version
const DB_VERSION = 1
const DB_NAME = 'sentra-mobile-offline'

// Store names
const STORES = {
  APPROVAL_REQUESTS: 'approvalRequests',
  SYSTEM_ALERTS: 'systemAlerts',
  AGENT_STATUSES: 'agentStatuses',
  TASK_STATUSES: 'taskStatuses',
  PENDING_ACTIONS: 'pendingActions',
  SYNC_METADATA: 'syncMetadata'
} as const

export interface PendingAction {
  readonly id: string
  readonly type: 'approve' | 'reject' | 'acknowledge_alert' | 'agent_control' | 'emergency_action'
  readonly data: unknown
  readonly timestamp: Date
  readonly retryCount: number
  readonly maxRetries: number
}

export interface SyncMetadata {
  readonly key: string
  readonly lastSync: Date
  readonly version: number
  readonly checksum?: string
}

export const useOfflineStore = defineStore('offline', () => {
  // Core offline state
  const isOnline = ref(navigator.onLine)
  const syncStatus = ref<SyncStatus>('offline')
  const isInitialized = ref(false)
  const db = ref<IDBPDatabase | null>(null)
  
  // Offline data cache
  const cachedData = ref<OfflineData>({
    approvalRequests: [],
    systemAlerts: [],
    agentStatuses: [],
    taskStatuses: [],
    lastSync: new Date(),
    syncStatus: 'offline'
  })
  
  // Pending actions queue
  const pendingActions = ref<PendingAction[]>([])
  const syncingActions = ref<Set<string>>(new Set())
  const syncProgress = ref(0)
  const syncErrors = ref<string[]>([])

  // Computed values
  const hasPendingActions = computed(() => pendingActions.value.length > 0)
  const hasCachedData = computed(() => 
    cachedData.value.approvalRequests.length > 0 ||
    cachedData.value.systemAlerts.length > 0 ||
    cachedData.value.agentStatuses.length > 0 ||
    cachedData.value.taskStatuses.length > 0
  )

  const syncStatusMessage = computed(() => {
    switch (syncStatus.value) {
      case 'synced': return 'All data synchronized'
      case 'pending': return `${pendingActions.value.length} actions pending`
      case 'syncing': return `Synchronizing... ${syncProgress.value}%`
      case 'failed': return 'Sync failed - will retry'
      case 'offline': return 'Offline - data cached locally'
      default: return 'Unknown sync status'
    }
  })

  // Initialize IndexedDB
  const initializeDB = async (): Promise<void> => {
    try {
      db.value = await openDB(DB_NAME, DB_VERSION, {
        upgrade(database) {
          // Approval requests store
          if (!database.objectStoreNames.contains(STORES.APPROVAL_REQUESTS)) {
            const approvalStore = database.createObjectStore(STORES.APPROVAL_REQUESTS, { 
              keyPath: 'id' 
            })
            approvalStore.createIndex('priority', 'priority')
            approvalStore.createIndex('decisionType', 'decisionType')
            approvalStore.createIndex('requestedAt', 'requestedAt')
          }

          // System alerts store
          if (!database.objectStoreNames.contains(STORES.SYSTEM_ALERTS)) {
            const alertStore = database.createObjectStore(STORES.SYSTEM_ALERTS, { 
              keyPath: 'id' 
            })
            alertStore.createIndex('severity', 'severity')
            alertStore.createIndex('timestamp', 'timestamp')
            alertStore.createIndex('acknowledged', 'acknowledged')
          }

          // Agent statuses store
          if (!database.objectStoreNames.contains(STORES.AGENT_STATUSES)) {
            const agentStore = database.createObjectStore(STORES.AGENT_STATUSES, { 
              keyPath: 'agentId' 
            })
            agentStore.createIndex('status', 'status')
            agentStore.createIndex('lastActivity', 'lastActivity')
          }

          // Task statuses store
          if (!database.objectStoreNames.contains(STORES.TASK_STATUSES)) {
            const taskStore = database.createObjectStore(STORES.TASK_STATUSES, { 
              keyPath: 'taskId' 
            })
            taskStore.createIndex('status', 'status')
            taskStore.createIndex('priority', 'priority')
          }

          // Pending actions store
          if (!database.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
            const actionStore = database.createObjectStore(STORES.PENDING_ACTIONS, { 
              keyPath: 'id' 
            })
            actionStore.createIndex('type', 'type')
            actionStore.createIndex('timestamp', 'timestamp')
          }

          // Sync metadata store
          if (!database.objectStoreNames.contains(STORES.SYNC_METADATA)) {
            database.createObjectStore(STORES.SYNC_METADATA, { 
              keyPath: 'key' 
            })
          }
        }
      })

      isInitialized.value = true
      await loadCachedData()
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      throw error
    }
  }

  // Load cached data from IndexedDB
  const loadCachedData = async (): Promise<void> => {
    if (!db.value) return

    try {
      const [approvals, alerts, agents, tasks, actions] = await Promise.all([
        db.value.getAll(STORES.APPROVAL_REQUESTS),
        db.value.getAll(STORES.SYSTEM_ALERTS),
        db.value.getAll(STORES.AGENT_STATUSES),
        db.value.getAll(STORES.TASK_STATUSES),
        db.value.getAll(STORES.PENDING_ACTIONS)
      ])

      cachedData.value = {
        approvalRequests: approvals as ApprovalRequest[],
        systemAlerts: alerts as SystemAlert[],
        agentStatuses: agents as MobileAgentStatus[],
        taskStatuses: tasks as MobileTaskStatus[],
        lastSync: cachedData.value.lastSync,
        syncStatus: syncStatus.value
      }

      pendingActions.value = actions as PendingAction[]
      
      // Update sync status based on cached data
      if (pendingActions.value.length > 0) {
        syncStatus.value = 'pending'
      } else if (hasCachedData.value) {
        syncStatus.value = isOnline.value ? 'synced' : 'offline'
      }

    } catch (error) {
      console.error('Failed to load cached data:', error)
    }
  }

  // Save data to IndexedDB
  const saveToCache = async <T>(storeName: string, data: T[]): Promise<void> => {
    if (!db.value) return

    try {
      const tx = db.value.transaction(storeName, 'readwrite')
      await tx.objectStore(storeName).clear()
      
      for (const item of data) {
        await tx.objectStore(storeName).put(item)
      }
      
      await tx.done
    } catch (error) {
      console.error(`Failed to save ${storeName} to cache:`, error)
    }
  }

  // Cache approval requests
  const cacheApprovalRequests = async (approvals: ApprovalRequest[]): Promise<void> => {
    cachedData.value = { ...cachedData.value, approvalRequests: approvals }
    await saveToCache(STORES.APPROVAL_REQUESTS, approvals)
  }

  // Cache system alerts
  const cacheSystemAlerts = async (alerts: SystemAlert[]): Promise<void> => {
    cachedData.value = { ...cachedData.value, systemAlerts: alerts }
    await saveToCache(STORES.SYSTEM_ALERTS, alerts)
  }

  // Cache agent statuses
  const cacheAgentStatuses = async (agents: MobileAgentStatus[]): Promise<void> => {
    cachedData.value = { ...cachedData.value, agentStatuses: agents }
    await saveToCache(STORES.AGENT_STATUSES, agents)
  }

  // Cache task statuses
  const cacheTaskStatuses = async (tasks: MobileTaskStatus[]): Promise<void> => {
    cachedData.value = { ...cachedData.value, taskStatuses: tasks }
    await saveToCache(STORES.TASK_STATUSES, tasks)
  }

  // Queue action for offline execution
  const queueAction = async (action: Omit<PendingAction, 'id' | 'retryCount'>): Promise<string> => {
    const pendingAction: PendingAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0
    }

    pendingActions.value.push(pendingAction)
    syncStatus.value = 'pending'

    if (db.value) {
      try {
        await db.value.put(STORES.PENDING_ACTIONS, pendingAction)
      } catch (error) {
        console.error('Failed to queue action:', error)
      }
    }

    // Try to sync immediately if online
    if (isOnline.value) {
      syncPendingActions().catch(console.error)
    }

    return pendingAction.id
  }

  // Sync pending actions with server
  const syncPendingActions = async (): Promise<void> => {
    if (!isOnline.value || pendingActions.value.length === 0) {
      return
    }

    syncStatus.value = 'syncing'
    syncProgress.value = 0
    syncErrors.value = []

    const actionsToSync = [...pendingActions.value]
    const total = actionsToSync.length

    for (let i = 0; i < actionsToSync.length; i++) {
      const action = actionsToSync[i]
      if (!action) continue
      
      if (syncingActions.value.has(action.id)) {
        continue
      }

      syncingActions.value.add(action.id)

      try {
        // In a real implementation, this would call the appropriate API
        await simulateAPICall(action)

        // Remove from pending actions on success
        const actionIndex = pendingActions.value.findIndex(a => a.id === action.id)
        if (actionIndex >= 0) {
          pendingActions.value.splice(actionIndex, 1)
        }

        if (db.value) {
          await db.value.delete(STORES.PENDING_ACTIONS, action.id)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        syncErrors.value.push(`${action.type}: ${errorMessage}`)

        // Increment retry count
        const actionIndex = pendingActions.value.findIndex(a => a.id === action.id)
        if (actionIndex >= 0) {
          const currentAction = pendingActions.value[actionIndex]
          if (!currentAction) continue
          const updatedAction: PendingAction = {
            ...currentAction,
            retryCount: currentAction.retryCount + 1
          }

          if (updatedAction.retryCount >= (updatedAction.maxRetries || 3)) {
            // Remove action if max retries exceeded
            pendingActions.value.splice(actionIndex, 1)
            if (db.value) {
              await db.value.delete(STORES.PENDING_ACTIONS, action.id)
            }
          } else {
            // Update retry count
            pendingActions.value[actionIndex] = updatedAction
            if (db.value) {
              await db.value.put(STORES.PENDING_ACTIONS, updatedAction)
            }
          }
        }
      } finally {
        syncingActions.value.delete(action.id)
        syncProgress.value = Math.round(((i + 1) / total) * 100)
      }
    }

    // Update sync status
    if (pendingActions.value.length === 0) {
      syncStatus.value = 'synced'
      cachedData.value = { ...cachedData.value, lastSync: new Date(), syncStatus: 'synced' }
    } else if (syncErrors.value.length > 0) {
      syncStatus.value = 'failed'
    } else {
      syncStatus.value = 'pending'
    }

    syncProgress.value = 100
  }

  // Simulate API call for pending action
  const simulateAPICall = async (action: PendingAction): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error(`Simulated API error for ${action.type}`)
    }
  }

  // Handle online/offline state changes
  const handleOnlineStatusChange = () => {
    isOnline.value = navigator.onLine
    
    if (isOnline.value) {
      // When coming back online, try to sync
      syncPendingActions().catch(console.error)
    } else {
      // When going offline, update sync status
      if (syncStatus.value === 'synced') {
        syncStatus.value = 'offline'
      }
    }
  }

  // Get cached data for specific type
  const getCachedApprovals = (): ApprovalRequest[] => [...cachedData.value.approvalRequests]
  const getCachedAlerts = (): SystemAlert[] => [...cachedData.value.systemAlerts]  
  const getCachedAgents = (): MobileAgentStatus[] => [...cachedData.value.agentStatuses]
  const getCachedTasks = (): MobileTaskStatus[] => [...cachedData.value.taskStatuses]

  // Clear all cached data
  const clearCache = async (): Promise<void> => {
    if (db.value) {
      const storeNames = [
        STORES.APPROVAL_REQUESTS,
        STORES.SYSTEM_ALERTS,
        STORES.AGENT_STATUSES,
        STORES.TASK_STATUSES,
        STORES.PENDING_ACTIONS
      ]

      for (const storeName of storeNames) {
        await db.value.clear(storeName)
      }
    }

    cachedData.value = {
      approvalRequests: [],
      systemAlerts: [],
      agentStatuses: [],
      taskStatuses: [],
      lastSync: new Date(),
      syncStatus: 'offline'
    }

    pendingActions.value = []
    syncStatus.value = 'offline'
  }

  // Cleanup and close database
  const cleanup = () => {
    if (db.value) {
      db.value.close()
      db.value = null
    }
    isInitialized.value = false
  }

  // Set up online/offline event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)
  }

  return {
    // State
    isOnline: readonly(isOnline),
    syncStatus: readonly(syncStatus),
    isInitialized: readonly(isInitialized),
    cachedData: readonly(cachedData),
    pendingActions: readonly(pendingActions),
    syncProgress: readonly(syncProgress),
    syncErrors: readonly(syncErrors),
    
    // Computed
    hasPendingActions,
    hasCachedData,
    syncStatusMessage,
    
    // Actions
    initializeDB,
    cacheApprovalRequests,
    cacheSystemAlerts,
    cacheAgentStatuses,
    cacheTaskStatuses,
    queueAction,
    syncPendingActions,
    
    // Getters
    getCachedApprovals,
    getCachedAlerts,
    getCachedAgents,
    getCachedTasks,
    
    // Utilities
    clearCache,
    cleanup
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}