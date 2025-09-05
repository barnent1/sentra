<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Evolution Monitor
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Real-time tracking of evolutionary patterns and DNA mutations
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <button
          @click="toggleAutoRefresh"
          :class="[
            'px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150',
            autoRefresh 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          {{ autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off' }}
        </button>
        
        <button
          @click="clearFilters"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-150"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Evolution Trigger
          </label>
          <select 
            v-model="filters.trigger"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Triggers</option>
            <option value="performance_threshold">Performance Threshold</option>
            <option value="manual">Manual</option>
            <option value="time_based">Time Based</option>
            <option value="pattern_recognition">Pattern Recognition</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Range
          </label>
          <select 
            v-model="filters.timeRange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Confidence
          </label>
          <input
            v-model.number="filters.minConfidence"
            type="range"
            min="0"
            max="100"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          >
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ filters.minConfidence }}%
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Results
          </label>
          <div class="text-sm text-gray-600 dark:text-gray-400 py-2">
            {{ filteredEvents.length }} events found
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Evolution Timeline (2/3 width) -->
      <div class="xl:col-span-2 space-y-6">
        <!-- DNA Evolution Lineage Tree -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            DNA Evolution Lineage Tree
          </h3>
          <div class="h-96">
            <EvolutionLineageTree
              :dna-patterns="evolutionStore.getDnaPattern as any"
              :lineages="evolutionStore.getLineage as any"
              :fitness-scores="evolutionStore.getFitnessHistory as any"
              :selected-node="selectedDnaNode"
              @select-node="selectDnaNode"
            />
          </div>
        </div>

        <!-- Evolution Timeline -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Evolution Timeline
            </h3>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {{ formatTime(lastUpdate) }}
            </div>
          </div>
          <EvolutionTimeline :events="filteredEvents" />
        </div>
      </div>

      <!-- Sidebar (1/3 width) -->
      <div class="space-y-6">
        <!-- Genetic Markers Radar Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Genetic Markers Analysis
          </h3>
          <div class="h-80">
            <GeneticMarkersChart
              :markers="selectedDnaMarkers"
              :labels="selectedDnaLabels"
              :width="350"
              :height="300"
            />
          </div>
        </div>

        <!-- Evolution Stats -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evolution Statistics
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Events</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ evolutionStats.totalEvents }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ evolutionStats.avgConfidence }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
              <span class="font-semibold text-green-600 dark:text-green-400">{{ evolutionStats.successRate }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400">Most Active Trigger</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ evolutionStats.mostActiveTrigger }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Genetic Changes -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Genetic Changes
          </h3>
          <div class="space-y-3">
            <div 
              v-for="change in recentGeneticChanges"
              :key="change.eventId"
              class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ change.property }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ change.from }} → {{ change.to }}
              </div>
            </div>
            
            <div v-if="recentGeneticChanges.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
              No recent genetic changes
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocketStore } from '../stores/websocket'
import { useEvolutionStore } from '../stores/evolution'
import EvolutionTimeline from '../components/evolution/EvolutionTimeline.vue'
import EvolutionLineageTree from '../components/evolution/EvolutionLineageTree.vue'
import GeneticMarkersChart from '../components/evolution/GeneticMarkersChart.vue'
import type { EvolutionDnaId, GeneticMarkers } from '@sentra/types'

const webSocketStore = useWebSocketStore()
const evolutionStore = useEvolutionStore()
const lastUpdate = ref(new Date())
const autoRefresh = ref(true)
const selectedDnaNode = ref<EvolutionDnaId | undefined>()

const filters = ref({
  trigger: '',
  timeRange: '24h',
  minConfidence: 0
})

const filteredEvents = computed(() => {
  let events = [...((webSocketStore.evolutionEvents as any[]) || [])]

  // Filter by trigger
  if (filters.value.trigger) {
    events = events.filter(event => event.evolutionTrigger === filters.value.trigger)
  }

  // Filter by time range
  const now = new Date()
  const timeRangeMs = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    'all': Infinity
  }[filters.value.timeRange] || Infinity

  if (timeRangeMs !== Infinity) {
    const cutoffTime = new Date(now.getTime() - timeRangeMs)
    events = events.filter(event => new Date(event.createdAt) >= cutoffTime)
  }

  // Filter by confidence
  events = events.filter(event => event.confidenceScore * 100 >= filters.value.minConfidence)

  return events
})

const evolutionStats = computed(() => {
  const events = filteredEvents.value
  
  if (events.length === 0) {
    return {
      totalEvents: 0,
      avgConfidence: 0,
      successRate: 0,
      mostActiveTrigger: 'N/A'
    }
  }

  const avgConfidence = Math.round(
    events.reduce((sum, event) => sum + event.confidenceScore, 0) / events.length * 100
  )

  // Calculate success rate based on positive performance deltas
  const successfulEvents = events.filter(
    event => event.performanceDelta.successRate > 0
  ).length
  const successRate = Math.round((successfulEvents / events.length) * 100)

  // Find most active trigger
  const triggerCounts: Record<string, number> = {}
  events.forEach(event => {
    triggerCounts[event.evolutionTrigger] = (triggerCounts[event.evolutionTrigger] || 0) + 1
  })
  
  const mostActiveTrigger = Object.entries(triggerCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

  return {
    totalEvents: events.length,
    avgConfidence,
    successRate,
    mostActiveTrigger: mostActiveTrigger.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
})

const recentGeneticChanges = computed(() => {
  const changes: Array<{
    eventId: string
    property: string
    from: string
    to: string
  }> = []

  filteredEvents.value.slice(0, 5).forEach((event: any) => {
    Object.entries((event.geneticChanges || {})).slice(0, 2).forEach(([key, change]: [string, any]) => {
      changes.push({
        eventId: event.id,
        property: key.replace(/([A-Z])/g, ' $1').trim(),
        from: String((change as any)?.from || ''),
        to: String((change as any)?.to || '')
      })
    })
  })

  return changes.slice(0, 6)
})

// Selected DNA data for charts
const selectedDnaMarkers = computed((): GeneticMarkers[] => {
  if (!selectedDnaNode.value) {
    // Show top 3 performers if no specific node selected
    return evolutionStore.topPerformers.slice(0, 3).map(dna => dna.genetics)
  }
  
  const selectedDna = evolutionStore.getDnaPattern(selectedDnaNode.value)
  return selectedDna ? [selectedDna.genetics] : []
})

const selectedDnaLabels = computed((): string[] => {
  if (!selectedDnaNode.value) {
    return evolutionStore.topPerformers.slice(0, 3).map(dna => `Gen ${dna.generation}`)
  }
  
  const selectedDna = evolutionStore.getDnaPattern(selectedDnaNode.value)
  return selectedDna ? [`Generation ${selectedDna.generation}`] : []
})

const selectDnaNode = (nodeId: EvolutionDnaId) => {
  selectedDnaNode.value = nodeId
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
}

const clearFilters = () => {
  filters.value = {
    trigger: '',
    timeRange: '24h',
    minConfidence: 0
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Auto refresh functionality
let refreshInterval: NodeJS.Timeout | undefined

onMounted(() => {
  if (autoRefresh.value) {
    refreshInterval = setInterval(() => {
      lastUpdate.value = new Date()
    }, 30000) // Update every 30 seconds
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>