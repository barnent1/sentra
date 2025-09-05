import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MobileNotification,
  NotificationId,
  NotificationSettings
} from '../types'

export interface PushSubscription {
  readonly endpoint: string
  readonly keys: {
    readonly p256dh: string
    readonly auth: string
  }
}

export interface NotificationPermission {
  readonly granted: boolean
  readonly denied: boolean
  readonly prompt: boolean
}

export const useNotificationsStore = defineStore('notifications', () => {
  // Core notification state
  const notifications = ref<MobileNotification[]>([])
  const isSupported = ref('serviceWorker' in navigator && 'PushManager' in window)
  const permission = ref<NotificationPermission>({
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
    prompt: Notification.permission === 'default'
  })
  
  // Push notification state
  const pushSubscription = ref<PushSubscription | null>(null)
  const vapidPublicKey = ref(import.meta.env.VITE_VAPID_PUBLIC_KEY || '')
  const isSubscribed = ref(false)
  const isSubscribing = ref(false)
  
  // Settings
  const settings = ref<NotificationSettings>({
    approvalRequests: true,
    systemAlerts: true,
    agentUpdates: false,
    taskCompletions: false,
    emergencyOnly: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  })

  // Service worker registration
  const serviceWorkerRegistration = ref<ServiceWorkerRegistration | null>(null)

  // Computed values
  const unreadNotifications = computed(() => 
    notifications.value.filter(notification => !notification.read)
  )

  const criticalNotifications = computed(() =>
    notifications.value.filter(notification => 
      notification.type === 'system_alert' && 
      (notification.data && typeof notification.data === 'object' && 'severity' in notification.data && 
       (notification.data['severity'] === 'critical' || notification.data['severity'] === 'emergency'))
    )
  )

  const actionableNotifications = computed(() =>
    notifications.value.filter(notification => notification.actionable)
  )

  const isQuietHours = computed(() => {
    if (!settings.value.quietHours.enabled) return false
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = settings.value.quietHours.startTime.split(':').map(Number)
    const [endHour, endMin] = settings.value.quietHours.endTime.split(':').map(Number)
    
    const startTime = (startHour || 0) * 60 + (startMin || 0)
    const endTime = (endHour || 0) * 60 + (endMin || 0)
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime
    }
  })

  const canShowNotification = computed(() => {
    if (settings.value.emergencyOnly) {
      return false // Will be overridden for emergency notifications
    }
    
    return permission.value.granted && !isQuietHours.value
  })

  // Initialize service worker and push notifications
  const initializeServiceWorker = async (): Promise<void> => {
    if (!isSupported.value) {
      console.warn('Service Worker or Push Manager not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      serviceWorkerRegistration.value = registration
      
      // Check for existing push subscription
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        pushSubscription.value = {
          endpoint: existingSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
          }
        }
        isSubscribed.value = true
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    } catch (error) {
      console.error('Failed to initialize service worker:', error)
    }
  }

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      
      permission.value = {
        granted: result === 'granted',
        denied: result === 'denied', 
        prompt: result === 'default'
      }

      return result === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  // Subscribe to push notifications
  const subscribeToPush = async (): Promise<boolean> => {
    if (!serviceWorkerRegistration.value || !permission.value.granted || !vapidPublicKey.value) {
      return false
    }

    try {
      isSubscribing.value = true

      const subscription = await serviceWorkerRegistration.value.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey.value) as BufferSource
      })

      pushSubscription.value = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }

      isSubscribed.value = true

      // Send subscription to server
      await sendSubscriptionToServer(pushSubscription.value)

      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    } finally {
      isSubscribing.value = false
    }
  }

  // Unsubscribe from push notifications  
  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!serviceWorkerRegistration.value) {
      return false
    }

    try {
      const subscription = await serviceWorkerRegistration.value.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remove subscription from server
        if (pushSubscription.value) {
          await removeSubscriptionFromServer(pushSubscription.value)
        }
      }

      pushSubscription.value = null
      isSubscribed.value = false

      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Add notification to local store
  const addNotification = (notification: MobileNotification): void => {
    notifications.value.unshift(notification)
    
    // Keep only last 100 notifications
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }

    // Show browser notification if conditions are met
    showBrowserNotification(notification)
  }

  // Show browser notification
  const showBrowserNotification = (notification: MobileNotification): void => {
    if (!permission.value.granted) return

    // Check if notification should be shown based on settings
    if (!shouldShowNotification(notification)) return

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: notification.id,
        requireInteraction: notification.actionable,
        data: notification.data
      })

      browserNotification.onclick = () => {
        handleNotificationClick(notification.id)
        browserNotification.close()
      }

      // Auto-close non-actionable notifications after 5 seconds
      if (!notification.actionable) {
        setTimeout(() => {
          browserNotification.close()
        }, 5000)
      }

    } catch (error) {
      console.error('Failed to show browser notification:', error)
    }
  }

  // Check if notification should be shown based on settings
  const shouldShowNotification = (notification: MobileNotification): boolean => {
    // Always show emergency notifications
    if (notification.data && typeof notification.data === 'object' && 'severity' in notification.data && notification.data['severity'] === 'emergency') {
      return true
    }

    // Check emergency only mode
    if (settings.value.emergencyOnly && (!notification.data || typeof notification.data !== 'object' || !('severity' in notification.data) || notification.data['severity'] !== 'critical')) {
      return false
    }

    // Check quiet hours (except for critical/emergency)
    if (isQuietHours.value && (!notification.data || typeof notification.data !== 'object' || !('severity' in notification.data) || (notification.data['severity'] !== 'critical' && notification.data['severity'] !== 'emergency'))) {
      return false
    }

    // Check specific notification type settings
    switch (notification.type) {
      case 'approval_request':
        return settings.value.approvalRequests
      case 'system_alert':
        return settings.value.systemAlerts
      case 'agent_update':
        return settings.value.agentUpdates
      case 'task_completion':
        return settings.value.taskCompletions
      default:
        return true
    }
  }

  // Handle notification click
  const handleNotificationClick = (notificationId: NotificationId): void => {
    markAsRead(notificationId)
    
    // Focus window if available
    if (typeof self !== 'undefined' && 'clients' in self) {
      // This runs in service worker context
      const clients = (self as any).clients
      if (clients && typeof clients.openWindow === 'function') {
        clients.openWindow('/')
      }
    } else if (typeof window !== 'undefined') {
      window.focus()
    }
  }

  // Handle service worker messages
  const handleServiceWorkerMessage = (event: MessageEvent): void => {
    const { type, data } = event.data

    switch (type) {
      case 'notification-click':
        handleNotificationClick(data.notificationId)
        break
      case 'push-received':
        // Handle push notification received in background
        if (data.notification) {
          addNotification(data.notification)
        }
        break
    }
  }

  // Mark notification as read
  const markAsRead = (notificationId: NotificationId): void => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      const index = notifications.value.indexOf(notification)
      notifications.value[index] = { ...notification, read: true }
    }
  }

  // Mark all notifications as read
  const markAllAsRead = (): void => {
    notifications.value = notifications.value.map(notification => ({
      ...notification,
      read: true
    }))
  }

  // Remove notification
  const removeNotification = (notificationId: NotificationId): void => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index >= 0) {
      notifications.value.splice(index, 1)
    }
  }

  // Clear all notifications
  const clearAllNotifications = (): void => {
    notifications.value = []
  }

  // Update notification settings
  const updateSettings = (newSettings: Partial<NotificationSettings>): void => {
    settings.value = { ...settings.value, ...newSettings }
    
    // Save to localStorage
    localStorage.setItem('sentra-notification-settings', JSON.stringify(settings.value))
  }

  // Load settings from localStorage
  const loadSettings = (): void => {
    try {
      const saved = localStorage.getItem('sentra-notification-settings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        settings.value = { ...settings.value, ...parsedSettings }
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  // Send subscription to server
  const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
    try {
      // In a real implementation, this would call the API to register the subscription
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  // Remove subscription from server
  const removeSubscriptionFromServer = async (subscription: PushSubscription): Promise<void> => {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
    }
  }

  // Utility functions for base64 conversion
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i] || 0)
    }
    return btoa(binary)
  }

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Initialize on store creation
  loadSettings()

  return {
    // State
    notifications: readonly(notifications),
    isSupported: readonly(isSupported),
    permission: readonly(permission),
    pushSubscription: readonly(pushSubscription),
    isSubscribed: readonly(isSubscribed),
    isSubscribing: readonly(isSubscribing),
    settings: readonly(settings),
    
    // Computed
    unreadNotifications,
    criticalNotifications,
    actionableNotifications,
    isQuietHours,
    canShowNotification,
    
    // Actions
    initializeServiceWorker,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateSettings,
    
    // Utilities
    loadSettings
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}