<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header with Primary Theme Colors -->
    <header class="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 shadow-lg border-b-2 border-blue-700 dark:border-blue-800">
      <div class="px-3 py-4 mobile:py-2 mobile:flex-col mobile:space-y-2 flex items-center justify-between">
        <!-- Title Section -->
        <div class="mobile:w-full mobile:text-center">
          <h1 class="text-2xl mobile:text-lg font-bold text-white drop-shadow-lg">
            Evolution Observability
          </h1>
          <p class="text-sm text-white/80 mt-1">
            Real-time monitoring of evolutionary agents and DNA mutations
          </p>
        </div>
        
        <!-- Connection Status -->
        <div class="mobile:w-full mobile:justify-center flex items-center space-x-1.5">
          <div v-if="isConnected" class="flex items-center space-x-1.5">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span class="text-base mobile:text-sm text-white font-semibold drop-shadow-md">Connected</span>
          </div>
          <div v-else class="flex items-center space-x-1.5">
            <span class="relative flex h-3 w-3">
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span class="text-base mobile:text-sm text-white font-semibold drop-shadow-md">Disconnected</span>
          </div>
        </div>
        
        <!-- Event Count and Controls -->
        <div class="mobile:w-full mobile:justify-center flex items-center space-x-2">
          <span class="text-base mobile:text-sm text-white font-semibold drop-shadow-md bg-blue-800 dark:bg-blue-900 px-3 py-1.5 rounded-full border border-white/30">
            {{ (events as any)?.length || 0 }} events
          </span>
          
          <!-- Filters Toggle Button -->
          <button
            @click="showFilters = !showFilters"
            class="p-3 mobile:p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            :title="showFilters ? 'Hide filters' : 'Show filters'"
          >
            <span class="text-2xl mobile:text-lg">📊</span>
          </button>
          
          <!-- Theme Manager Button -->
          <button
            @click="handleThemeManagerClick"
            class="p-3 mobile:p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            title="Open theme manager"
          >
            <span class="text-2xl mobile:text-lg">🎨</span>
          </button>
          
          <!-- WebSocket Connect/Disconnect -->
          <button
            @click="toggleConnection"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            :class="isConnected ? 'bg-red-500/20 hover:bg-red-500/30 text-white' : 'bg-green-500/20 hover:bg-green-500/30 text-white'"
          >
            {{ isConnected ? 'Disconnect' : 'Connect' }}
          </button>
        </div>
      </div>
    </header>
    
    <!-- Filters -->
    <FilterPanel
      v-if="showFilters"
      :filters="filters"
      :events="events as any"
      @update:filters="filters = $event"
    />
    
    <!-- Live Pulse Chart -->
    <EvolutionPulseChart
      :events="events as any"
      :filters="filters"
    />
    
    <!-- Timeline -->
    <EvolutionEventTimeline
      :events="events as any"
      :filters="filters"
      :stick-to-bottom="stickToBottom"
      :is-loading="isLoading"
      @update:stick-to-bottom="stickToBottom = $event"
      @event-click="handleEventClick"
      @clear-events="handleClearEvents"
    />
    
    <!-- Stick to bottom button -->
    <StickScrollButton
      :stick-to-bottom="stickToBottom"
      @toggle="stickToBottom = !stickToBottom"
    />
    
    <!-- Error message -->
    <div
      v-if="error"
      class="fixed bottom-4 left-4 mobile:bottom-3 mobile:left-3 mobile:right-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 mobile:px-2 mobile:py-1.5 rounded mobile:text-xs z-50"
    >
      {{ error }}
    </div>
    
    <!-- Theme Manager -->
    <ThemeManager 
      :is-open="showThemeManager"
      @close="showThemeManager = false"
    />
    
    <!-- Event Detail Modal (Future Enhancement) -->
    <div
      v-if="selectedEvent"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      @click.self="selectedEvent = null"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              Event Details
            </h2>
            <button
              @click="selectedEvent = null"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span class="text-xl text-gray-500 dark:text-gray-400">×</span>
            </button>
          </div>
        </div>
        <div class="p-6">
          <pre class="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4 rounded border border-gray-200 dark:border-gray-600 overflow-auto">{{ JSON.stringify(selectedEvent, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEvolutionWebSocket, type EvolutionWebSocketEvent } from '../composables/useEvolutionWebSocket'
import { useThemes } from '../composables/useThemes'
import EvolutionPulseChart from '../components/observability/EvolutionPulseChart.vue'
import FilterPanel from '../components/observability/FilterPanel.vue'
import EvolutionEventTimeline from '../components/observability/EvolutionEventTimeline.vue'
import ThemeManager from '../components/observability/ThemeManager.vue'
import StickScrollButton from '../components/observability/StickScrollButton.vue'
// WebSocket connection - will connect to sentra's evolution WebSocket
const wsUrl = (import.meta as any).env.VITE_EVOLUTION_WS_URL || 'ws://localhost:3001/socket.io'

const { 
  events, 
  isConnected, 
  error, 
  connect, 
  disconnect, 
  clearEvents 
} = useEvolutionWebSocket(wsUrl)

// Theme management
const { state: themeState } = useThemes()

// UI state
const showFilters = ref(false)
const showThemeManager = ref(false)
const stickToBottom = ref(true)
const selectedEvent = ref<EvolutionWebSocketEvent | null>(null)
const isLoading = ref(false)

// Filters
const filters = ref({
  sourceApp: '',
  sessionId: '',
  eventType: ''
})

// Computed properties
const _isDark = computed(() => {
  return (themeState as any).value?.currentTheme === 'dark' || 
         ((themeState as any).value?.isCustomTheme && 
          (themeState as any).value?.customThemes?.find((t: any) => t?.id === (themeState as any).value?.currentTheme)?.name?.includes('dark'))
})

// Event handlers
const handleThemeManagerClick = () => {
  console.log('Theme manager button clicked!')
  showThemeManager.value = true
}

const toggleConnection = () => {
  if ((isConnected as any)?.value) {
    disconnect()
  } else {
    isLoading.value = true
    connect(wsUrl)
    // Clear loading state after connection attempt
    setTimeout(() => {
      isLoading.value = false
    }, 3000)
  }
}

const handleEventClick = (event: EvolutionWebSocketEvent) => {
  selectedEvent.value = event
}

const handleClearEvents = () => {
  clearEvents()
  selectedEvent.value = null
}

// Lifecycle
onMounted(() => {
  // Auto-connect on mount
  if (!(isConnected as any)?.value) {
    isLoading.value = true
    connectToRealWebSocket()
    setTimeout(() => {
      isLoading.value = false
    }, 5000)
  }
  
  // Set up retry interval
  const retryInterval = setInterval(() => {
    retryConnection()
  }, 10000) // Retry every 10 seconds
  
  // Clean up retry interval on unmount
  onUnmounted(() => {
    clearInterval(retryInterval)
  })
})

onUnmounted(() => {
  // Clean disconnect
  if ((isConnected as any)?.value) {
    disconnect()
  }
})

// Connection management
const connectToRealWebSocket = () => {
  console.log('Connecting to real evolution WebSocket at:', wsUrl)
  connect(wsUrl)
}

// Retry connection logic
const retryConnection = () => {
  if (!(isConnected as any)?.value) {
    console.log('Retrying WebSocket connection...')
    connectToRealWebSocket()
  }
}
</script>

<style>
/* Mobile responsive utilities */
@media (max-width: 768px) {
  .mobile\:text-lg {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
  
  .mobile\:text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .mobile\:text-base {
    font-size: 1rem;
    line-height: 1.5rem;
  }
  
  .mobile\:text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  
  .mobile\:py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  
  .mobile\:py-3 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
  
  .mobile\:px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  
  .mobile\:px-3 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .mobile\:px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .mobile\:p-1\.5 {
    padding: 0.375rem;
  }
  
  .mobile\:py-1\.5 {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
  }
  
  .mobile\:flex-col {
    flex-direction: column;
  }
  
  .mobile\:space-y-2 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem;
  }
  
  .mobile\:w-full {
    width: 100%;
  }
  
  .mobile\:text-center {
    text-align: center;
  }
  
  .mobile\:justify-center {
    justify-content: center;
  }
  
  .mobile\:bottom-3 {
    bottom: 0.75rem;
  }
  
  .mobile\:left-3 {
    left: 0.75rem;
  }
  
  .mobile\:right-3 {
    right: 0.75rem;
  }
  
  .mobile\:gap-3 {
    gap: 0.75rem;
  }
  
  .mobile\:gap-1 {
    gap: 0.25rem;
  }
  
  .mobile\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>