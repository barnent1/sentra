import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createHead } from '@vueuse/head'
// import VueTouchEvents from 'vue-touch-events' // Removed due to compatibility issues
import App from './App.vue'
import './style.css'

// Import views
import ApprovalsView from './views/ApprovalsView.vue'
import AlertsView from './views/AlertsView.vue'
import AgentsView from './views/AgentsView.vue'
import ControlsView from './views/ControlsView.vue'
import NotificationsView from './views/NotificationsView.vue'
import SettingsView from './views/SettingsView.vue'

// Router configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'approvals',
      component: ApprovalsView,
      meta: {
        title: 'Approvals',
        icon: 'check-circle',
        showInNav: true
      }
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: AlertsView,
      meta: {
        title: 'Alerts',
        icon: 'exclamation-triangle',
        showInNav: true
      }
    },
    {
      path: '/agents',
      name: 'agents',
      component: AgentsView,
      meta: {
        title: 'Agents',
        icon: 'users',
        showInNav: true
      }
    },
    {
      path: '/controls',
      name: 'controls',
      component: ControlsView,
      meta: {
        title: 'Controls',
        icon: 'cog',
        showInNav: true
      }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: {
        title: 'Notifications',
        icon: 'bell',
        showInNav: false
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        title: 'Settings',
        icon: 'cog-6-tooth',
        showInNav: false
      }
    },
    // Catch-all redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Global navigation guards
router.beforeEach((to, _from, next) => {
  // Set page title
  const title = to.meta?.['title'] ? `${to.meta['title']} - Sentra Mobile` : 'Sentra Mobile'
  document.title = title
  
  next()
})

// Error handling for router
router.onError((error) => {
  console.error('Router error:', error)
})

// Create Vue app
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Create head manager
const head = createHead()

// Use plugins
app.use(pinia)
app.use(router)
app.use(head)
// app.use(VueTouchEvents) // Removed due to compatibility issues

// Global error handler
app.config.errorHandler = (error, _instance, info) => {
  console.error('Vue error:', error, info)
  // Could send to error reporting service
}

// Global warning handler (development only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, _instance, trace) => {
    console.warn('Vue warning:', msg, trace)
  }
}

// Mount the app
app.mount('#app')

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Handle PWA update available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // New service worker has taken control
    console.log('New service worker activated')
    window.location.reload()
  })
}