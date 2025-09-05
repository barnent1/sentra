<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Configure your evolution dashboard preferences
      </p>
    </div>

    <!-- Settings Sections -->
    <div class="space-y-6">
      <!-- Appearance -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Appearance
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select 
              :value="themeStore.mode" 
              @change="handleThemeChange"
              class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred color scheme
            </p>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notifications
        </h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Evolution Events
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Get notified when agents evolve
              </p>
            </div>
            <ToggleSwitch v-model="notifications.evolutionEvents" />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Performance Alerts
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Alerts for significant performance changes
              </p>
            </div>
            <ToggleSwitch v-model="notifications.performanceAlerts" />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Agent Status
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Notifications for agent state changes
              </p>
            </div>
            <ToggleSwitch v-model="notifications.agentStatus" />
          </div>
        </div>
      </div>

      <!-- Connection -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connection
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WebSocket URL
            </label>
            <input
              v-model="connectionSettings.websocketUrl"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ws://localhost:8080/ws"
            >
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              WebSocket server URL for real-time updates
            </p>
          </div>
          
          <div class="flex items-center space-x-4">
            <button
              @click="testConnection"
              :disabled="testing"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
            >
              {{ testing ? 'Testing...' : 'Test Connection' }}
            </button>
            
            <div class="flex items-center space-x-2">
              <ConnectionStatus />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        @click="saveSettings"
        class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-150"
      >
        Save Settings
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore, type ThemeMode } from '../stores/theme'
import { useWebSocketStore } from '../stores/websocket'
import ConnectionStatus from '../components/ui/ConnectionStatus.vue'
import ToggleSwitch from '../components/ui/ToggleSwitch.vue'

const themeStore = useThemeStore()
const webSocketStore = useWebSocketStore()

const testing = ref(false)

const notifications = ref({
  evolutionEvents: true,
  performanceAlerts: true,
  agentStatus: false
})

const connectionSettings = ref({
  websocketUrl: 'ws://localhost:3001/socket.io'
})

const handleThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  themeStore.setTheme(target.value as ThemeMode)
}

const testConnection = async () => {
  testing.value = true
  try {
    // Disconnect current connection
    webSocketStore.disconnect()
    // Test new connection
    webSocketStore.connect(connectionSettings.value.websocketUrl)
    await new Promise(resolve => setTimeout(resolve, 2000))
  } finally {
    testing.value = false
  }
}

const saveSettings = () => {
  // Save to localStorage
  localStorage.setItem('sentra-notifications', JSON.stringify(notifications.value))
  localStorage.setItem('sentra-connection', JSON.stringify(connectionSettings.value))
  
  // Show success message (in real app, use toast/notification)
  console.log('Settings saved!')
}
</script>