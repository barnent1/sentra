import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  ApprovalRequest,
  SystemAlert,
  MobileNotification,
  NotificationId,
  ApprovalRequestId,
  SyncStatus
} from '../types'

export type MobileConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

export interface MobileWebSocketMessage {
  readonly type: 'approval_request' | 'system_alert' | 'agent_status_update' | 'task_update' | 'emergency_alert'
  readonly data: ApprovalRequest | SystemAlert | MobileNotification | unknown
  readonly timestamp: Date
  readonly priority?: 'low' | 'medium' | 'high' | 'critical' | 'emergency'
}

export const useMobileWebSocketStore = defineStore('mobile-websocket', () => {
  // Connection state
  const socket = ref<WebSocket | null>(null)
  const status = ref<MobileConnectionStatus>('disconnected')
  const lastMessage = ref<MobileWebSocketMessage | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null)
  const lastHeartbeat = ref<Date | null>(null)

  // Mobile-specific data streams
  const approvalRequests = ref<ApprovalRequest[]>([])
  const systemAlerts = ref<SystemAlert[]>([])
  const notifications = ref<MobileNotification[]>([])
  const emergencyAlerts = ref<SystemAlert[]>([])

  // Sync status for offline capabilities
  const syncStatus = ref<SyncStatus>('offline')
  const lastSyncTime = ref<Date | null>(null)
  const pendingActions = ref<Array<{ action: string; data: unknown; timestamp: Date }>>([])

  // Computed values
  const isConnected = computed(() => status.value === 'connected')
  const isConnecting = computed(() => status.value === 'connecting' || status.value === 'reconnecting')
  const isOffline = computed(() => !isConnected.value)

  const pendingApprovals = computed(() => 
    approvalRequests.value.filter(request => !request.decision)
  )

  const criticalAlerts = computed(() =>
    systemAlerts.value.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'emergency'
    )
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter(notification => !notification.read)
  )

  // Connection management
  const connect = (url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/mobile-ws') => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      try {
        status.value = reconnectAttempts.value > 0 ? 'reconnecting' : 'connecting'
        socket.value = new WebSocket(url)

        const connectionTimeout = setTimeout(() => {
          if (socket.value?.readyState !== WebSocket.OPEN) {
            socket.value?.close()
            reject(new Error('Connection timeout'))
          }
        }, 10000) // 10 second timeout

        socket.value.onopen = () => {
          clearTimeout(connectionTimeout)
          status.value = 'connected'
          syncStatus.value = 'synced'
          reconnectAttempts.value = 0
          startHeartbeat()
          syncPendingActions()
          console.log('Mobile WebSocket connected')
          resolve()
        }

        socket.value.onmessage = (event) => {
          try {
            const rawMessage = JSON.parse(event.data)
            
            // Handle heartbeat responses
            if (rawMessage.type === 'heartbeat') {
              lastHeartbeat.value = new Date()
              return
            }

            const message: MobileWebSocketMessage = {
              ...rawMessage,
              timestamp: new Date(rawMessage.timestamp || Date.now())
            }
            
            lastMessage.value = message
            handleMessage(message)
          } catch (error) {
            console.error('Failed to parse mobile WebSocket message:', error)
          }
        }

        socket.value.onclose = () => {
          clearTimeout(connectionTimeout)
          stopHeartbeat()
          status.value = 'disconnected'
          syncStatus.value = 'offline'
          socket.value = null
          
          // Attempt to reconnect if not at max attempts
          if (reconnectAttempts.value < maxReconnectAttempts) {
            const delay = Math.min(Math.pow(2, reconnectAttempts.value) * 1000, 30000) // Cap at 30 seconds
            setTimeout(() => {
              reconnectAttempts.value++
              connect(url).catch(console.error)
            }, delay)
          } else {
            reject(new Error('Max reconnection attempts reached'))
          }
        }

        socket.value.onerror = (error) => {
          clearTimeout(connectionTimeout)
          status.value = 'error'
          syncStatus.value = 'failed'
          console.error('Mobile WebSocket error:', error)
          reject(error)
        }

      } catch (error) {
        status.value = 'error'
        syncStatus.value = 'failed'
        console.error('Failed to create mobile WebSocket connection:', error)
        reject(error)
      }
    })
  }

  // Handle incoming messages with mobile-specific logic
  const handleMessage = (message: MobileWebSocketMessage) => {
    switch (message.type) {
      case 'approval_request':
        const approvalRequest = message.data as ApprovalRequest
        addApprovalRequest(approvalRequest)
        
        // Create mobile notification for approval request
        createNotification({
          type: 'approval_request',
          title: 'New Approval Required',
          body: approvalRequest.title,
          data: { approvalId: approvalRequest.id },
          actionable: true,
          actions: [
            { action: 'approve', title: 'Approve' },
            { action: 'reject', title: 'Reject' },
            { action: 'view', title: 'View Details' }
          ]
        })
        break
      
      case 'system_alert':
        const alert = message.data as SystemAlert
        addSystemAlert(alert)
        
        // Create notification for critical alerts
        if (alert.severity === 'critical' || alert.severity === 'emergency') {
          createNotification({
            type: 'system_alert',
            title: `${alert.severity.toUpperCase()} Alert`,
            body: alert.message,
            data: { alertId: alert.id },
            actionable: true,
            actions: [
              { action: 'acknowledge', title: 'Acknowledge' },
              { action: 'view', title: 'View Details' }
            ]
          })
        }
        break
      
      case 'emergency_alert':
        const emergencyAlert = message.data as SystemAlert
        addEmergencyAlert(emergencyAlert)
        
        // Always create high-priority notification for emergency alerts
        createNotification({
          type: 'system_alert',
          title: 'EMERGENCY ALERT',
          body: emergencyAlert.message,
          data: { alertId: emergencyAlert.id },
          actionable: true,
          actions: [
            { action: 'acknowledge', title: 'Acknowledge' },
            { action: 'emergency_controls', title: 'Emergency Controls' }
          ]
        })
        break
      
      case 'agent_status_update':
      case 'task_update':
        // Handle other update types as needed
        console.log('Received update:', message.type, message.data)
        break
    }
  }

  // Heartbeat management for connection health
  const startHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
    }
    
    heartbeatInterval.value = setInterval(() => {
      if (socket.value?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'heartbeat', timestamp: new Date().toISOString() })
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  // Data management methods
  const addApprovalRequest = (request: ApprovalRequest) => {
    const existingIndex = approvalRequests.value.findIndex(r => r.id === request.id)
    if (existingIndex >= 0) {
      approvalRequests.value[existingIndex] = request
    } else {
      approvalRequests.value.unshift(request)
    }
    
    // Keep only last 50 approval requests
    if (approvalRequests.value.length > 50) {
      approvalRequests.value = approvalRequests.value.slice(0, 50)
    }
  }

  const addSystemAlert = (alert: SystemAlert) => {
    const existingIndex = systemAlerts.value.findIndex(a => a.id === alert.id)
    if (existingIndex >= 0) {
      systemAlerts.value[existingIndex] = alert
    } else {
      systemAlerts.value.unshift(alert)
    }
    
    // Keep only last 100 alerts
    if (systemAlerts.value.length > 100) {
      systemAlerts.value = systemAlerts.value.slice(0, 100)
    }
  }

  const addEmergencyAlert = (alert: SystemAlert) => {
    emergencyAlerts.value.unshift(alert)
    
    // Keep only last 20 emergency alerts
    if (emergencyAlerts.value.length > 20) {
      emergencyAlerts.value = emergencyAlerts.value.slice(0, 20)
    }
  }

  const createNotification = (notificationData: Omit<MobileNotification, 'id' | 'timestamp' | 'read'>) => {
    const notification: MobileNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as NotificationId,
      timestamp: new Date(),
      read: false,
      ...notificationData
    }
    
    notifications.value.unshift(notification)
    
    // Keep only last 100 notifications
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
    
    return notification
  }

  // Action methods
  const sendMessage = (message: Record<string, unknown>) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
      return true
    } else {
      // Queue action for when connection is restored
      pendingActions.value.push({
        action: 'send_message',
        data: message,
        timestamp: new Date()
      })
      syncStatus.value = 'pending'
      return false
    }
  }

  const syncPendingActions = async () => {
    if (pendingActions.value.length === 0) {
      return
    }

    syncStatus.value = 'syncing'
    
    for (const action of pendingActions.value) {
      try {
        if (action.action === 'send_message') {
          sendMessage(action.data as Record<string, unknown>)
        }
      } catch (error) {
        console.error('Failed to sync action:', action, error)
      }
    }
    
    pendingActions.value = []
    syncStatus.value = 'synced'
    lastSyncTime.value = new Date()
  }

  const markNotificationAsRead = (notificationId: NotificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      const index = notifications.value.indexOf(notification)
      notifications.value[index] = { ...notification, read: true }
    }
  }

  const acknowledgeAlert = (alertId: NotificationId) => {
    const alert = systemAlerts.value.find(a => a.id === alertId)
    if (alert) {
      const index = systemAlerts.value.indexOf(alert)
      systemAlerts.value[index] = {
        ...alert,
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: 'mobile-user' // Would be actual user ID in real app
      }
      
      sendMessage({
        type: 'acknowledge_alert',
        alertId,
        timestamp: new Date().toISOString()
      })
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    stopHeartbeat()
    status.value = 'disconnected'
    syncStatus.value = 'offline'
  }

  const clearData = () => {
    approvalRequests.value = []
    systemAlerts.value = []
    notifications.value = []
    emergencyAlerts.value = []
    pendingActions.value = []
    lastMessage.value = null
    lastSyncTime.value = null
  }

  return {
    // State
    status: readonly(status),
    syncStatus: readonly(syncStatus),
    lastSyncTime: readonly(lastSyncTime),
    approvalRequests: readonly(approvalRequests),
    systemAlerts: readonly(systemAlerts),
    notifications: readonly(notifications),
    emergencyAlerts: readonly(emergencyAlerts),
    
    // Computed
    isConnected,
    isConnecting,
    isOffline,
    pendingApprovals,
    criticalAlerts,
    unreadNotifications,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    syncPendingActions,
    markNotificationAsRead,
    acknowledgeAlert,
    clearData
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}