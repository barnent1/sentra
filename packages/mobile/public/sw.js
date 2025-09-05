// Sentra Mobile PWA Service Worker
// Implements offline functionality, caching, and push notifications

const CACHE_NAME = 'sentra-mobile-v1'
const STATIC_CACHE = 'sentra-static-v1'
const DYNAMIC_CACHE = 'sentra-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
]

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.sentra\.dev\/mobile\//,
  /^https:\/\/api\.sentra\.dev\/agents\//,
  /^https:\/\/api\.sentra\.dev\/approvals\//
]

// Cache strategies for different types of requests
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== CACHE_NAME
            })
            .map((cacheName) => caches.delete(cacheName))
        )
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip WebSocket requests
  if (request.url.includes('/ws') || request.url.startsWith('ws://') || request.url.startsWith('wss://')) {
    return
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request))
  } else {
    event.respondWith(handleGenericRequest(request))
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const data = event.data ? event.data.json() : {}
  const options = {
    body: data.body || 'New notification from Sentra',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    timestamp: data.timestamp || Date.now(),
    tag: data.tag || 'sentra-notification'
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Sentra Mobile', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.data)
  
  event.notification.close()

  const data = event.notification.data || {}
  const action = event.action

  // Handle notification actions
  if (action === 'approve') {
    handleApprovalAction(data, 'approved')
  } else if (action === 'reject') {
    handleApprovalAction(data, 'rejected')
  } else if (action === 'acknowledge') {
    handleAlertAction(data)
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if none exists
        if (clients.openWindow) {
          const targetUrl = getTargetUrl(data)
          return clients.openWindow(targetUrl)
        }
      })
    )
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-approvals') {
    event.waitUntil(syncApprovals())
  } else if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts())
  }
})

// Message handling from client
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME })
      break
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(data.urls))
      break
    default:
      console.log('[SW] Unknown message type:', type)
  }
})

// Helper functions

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/) ||
         STATIC_ASSETS.includes(url.pathname)
}

function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

async function handleStaticAsset(request) {
  // Cache first strategy for static assets
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network error for static asset:', error)
    // Return offline fallback if available
    return new Response('Asset not available offline', { status: 503 })
  }
}

async function handleAPIRequest(request) {
  // Network first strategy for API requests
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network error for API request:', error)
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      // Add offline header to indicate cached response
      const headers = new Headers(cachedResponse.headers)
      headers.set('X-Served-By', 'sw-cache')
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      })
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'This request is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleNavigationRequest(request) {
  // Try network first, fall back to cached shell
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('[SW] Network error for navigation:', error)
    
    // Return cached shell (index.html)
    const cache = await caches.open(STATIC_CACHE)
    const cachedShell = await cache.match('/index.html')
    
    if (cachedShell) {
      return cachedShell
    }
    
    // Last resort offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sentra Mobile - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: sans-serif;">
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function handleGenericRequest(request) {
  // Stale while revalidate for other requests
  const cachedResponse = await caches.match(request)
  
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE)
      cache.then(c => c.put(request, response.clone()))
    }
    return response
  }).catch(() => null)

  return cachedResponse || await networkResponsePromise || 
    new Response('Content not available offline', { status: 503 })
}

async function handleApprovalAction(data, decision) {
  // Handle approval/rejection from notification
  try {
    const response = await fetch('/api/approvals/decide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvalId: data.approvalId,
        decision,
        source: 'push-notification'
      })
    })

    if (response.ok) {
      // Notify all clients of the action
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({
          type: 'approval-action',
          data: { approvalId: data.approvalId, decision }
        })
      })
    }
  } catch (error) {
    console.error('[SW] Failed to handle approval action:', error)
  }
}

async function handleAlertAction(data) {
  // Handle alert acknowledgment from notification
  try {
    const response = await fetch('/api/alerts/acknowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alertId: data.alertId,
        source: 'push-notification'
      })
    })

    if (response.ok) {
      // Notify all clients of the action
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({
          type: 'alert-acknowledged',
          data: { alertId: data.alertId }
        })
      })
    }
  } catch (error) {
    console.error('[SW] Failed to handle alert action:', error)
  }
}

function getTargetUrl(data) {
  // Determine which page to open based on notification data
  if (data.approvalId) {
    return `/?approval=${data.approvalId}`
  } else if (data.alertId) {
    return `/alerts?alert=${data.alertId}`
  } else {
    return '/'
  }
}

async function syncApprovals() {
  // Sync pending approval decisions when back online
  try {
    const response = await fetch('/api/approvals/sync', {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('[SW] Failed to sync approvals:', error)
    throw error
  }
}

async function syncAlerts() {
  // Sync alert acknowledgments when back online
  try {
    const response = await fetch('/api/alerts/sync', {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('[SW] Failed to sync alerts:', error)
    throw error
  }
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE)
  return cache.addAll(urls)
}