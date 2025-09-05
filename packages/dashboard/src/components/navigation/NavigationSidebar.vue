<template>
  <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform lg:translate-x-0 transition-transform duration-200 ease-in-out">
    <!-- Logo and title -->
    <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">S</span>
        </div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          Sentra
        </h1>
      </div>
      
      <!-- Theme toggle -->
      <ThemeToggle />
    </div>

    <!-- Navigation links -->
    <nav class="mt-6 px-3">
      <div class="space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.to"
          :class="[
            'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
            $route.name === item.name
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          <component
            :is="item.icon"
            :class="[
              'mr-3 h-5 w-5 flex-shrink-0',
              $route.name === item.name
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            ]"
            aria-hidden="true"
          />
          {{ item.label }}
        </router-link>
      </div>

      <!-- Connection status -->
      <div class="mt-8 px-3">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>WebSocket</span>
          <ConnectionStatus />
        </div>
      </div>

      <!-- Recent activity -->
      <div class="mt-6 px-3">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent Activity
        </h3>
        <div class="mt-3 space-y-2">
          <div
            v-for="event in recentEvents.slice(0, 3)"
            :key="event.id"
            class="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div class="flex-1 min-w-0">
              <p class="truncate">{{ event.description }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">
                {{ formatTime(event.timestamp) }}
              </p>
            </div>
          </div>
          
          <div v-if="recentEvents.length === 0" class="text-xs text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  HomeIcon,
  EyeIcon,
  BeakerIcon, 
  UserGroupIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/vue/24/outline'
import ThemeToggle from '../ui/ThemeToggle.vue'
import ConnectionStatus from '../ui/ConnectionStatus.vue'
import { useWebSocketStore } from '../../stores/websocket'

const route = useRoute()
const webSocketStore = useWebSocketStore()

const navigation = [
  { name: 'Dashboard', label: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'ObservabilityDashboard', label: 'Evolution Observability', to: '/observability', icon: EyeIcon },
  { name: 'EvolutionMonitor', label: 'Evolution Monitor', to: '/evolution', icon: BeakerIcon },
  { name: 'AgentManagement', label: 'Agent Management', to: '/agents', icon: UserGroupIcon },
  { name: 'Analytics', label: 'Analytics', to: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', label: 'Settings', to: '/settings', icon: CogIcon }
]

const recentEvents = computed(() => {
  return webSocketStore.evolutionEvents.map(event => ({
    id: event.id,
    description: `Evolution: ${event.evolutionTrigger.replace('_', ' ')}`,
    timestamp: event.createdAt
  }))
})

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>