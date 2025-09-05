<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Evolution Dashboard
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Real-time monitoring of evolutionary agents and their performance
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <button
          @click="webSocketStore.connect()"
          v-if="!webSocketStore.isConnected"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
        >
          Connect WebSocket
        </button>
        
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {{ formatTime(lastUpdate) }}
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Agents"
        :value="stats.activeAgents"
        icon="UserGroupIcon"
        color="blue"
        :trend="stats.agentsTrend"
      />
      <StatCard
        title="Evolution Events"
        :value="stats.evolutionEvents"
        icon="BeakerIcon"
        color="purple"
        :trend="stats.evolutionTrend"
      />
      <StatCard
        title="Success Rate"
        :value="`${stats.successRate}%`"
        icon="ChartBarIcon"
        color="green"
        :trend="stats.successTrend"
      />
      <StatCard
        title="Learning Outcomes"
        :value="stats.learningOutcomes"
        icon="AcademicCapIcon"
        color="amber"
        :trend="stats.learningTrend"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Timeline
        </h3>
        <PerformanceChart :data="performanceData" />
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agent Activity
        </h3>
        <AgentActivityChart :data="activityData" />
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Evolution Events
        </h3>
      </div>
      <div class="p-6">
        <EvolutionTimeline :events="recentEvents" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocketStore } from '../stores/websocket'
import { useAgentsStore } from '../stores/agents'
import { useEvolutionStore } from '../stores/evolution'
import StatCard from '../components/dashboard/StatCard.vue'
import PerformanceChart from '../components/charts/PerformanceChart.vue'
import AgentActivityChart from '../components/charts/AgentActivityChart.vue'
import EvolutionTimeline from '../components/evolution/EvolutionTimeline.vue'

const webSocketStore = useWebSocketStore()
const agentsStore = useAgentsStore()
const evolutionStore = useEvolutionStore()
const lastUpdate = ref(new Date())

// Real-time stats from our stores
const stats = computed(() => ({
  activeAgents: agentsStore.poolStats.activeAgents,
  evolutionEvents: (evolutionStore.evolutionEvents as any[])?.length || 0,
  successRate: Math.round(agentsStore.poolStats.averagePerformance * 100),
  learningOutcomes: (webSocketStore.learningOutcomes as any[])?.length || 0,
  agentsTrend: { direction: 'up' as const, value: agentsStore.poolStats.spawnedToday },
  evolutionTrend: { direction: 'up' as const, value: evolutionStore.evolutionRate },
  successTrend: { direction: 'up' as const, value: 3 },
  learningTrend: { direction: 'up' as const, value: (webSocketStore.learningOutcomes as any[])?.length || 0 }
}))

const performanceData = computed(() => {
  // Convert performance updates to chart data
  return ((webSocketStore.performanceUpdates as any[]) || []).slice(0, 20).reverse().map((perf: any, index: number) => ({
    x: index,
    y: perf.successRate * 100,
    label: `Success Rate: ${(perf.successRate * 100).toFixed(1)}%`
  }))
})

const activityData = computed(() => {
  // Group agent updates by hour for activity chart
  const hourCounts: Record<string, number> = {}
  
  ;((webSocketStore.agentUpdates as any[]) || []).forEach((agent: any) => {
    const hour = new Date(agent.lastActiveAt).getHours()
    const hourKey = `${hour}:00`
    hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1
  })
  
  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour,
    count
  }))
})

const recentEvents = computed(() => {
  return ((webSocketStore.evolutionEvents as any[]) || []).slice(0, 10)
})

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Update timestamp every minute
let updateInterval: NodeJS.Timeout | undefined

onMounted(() => {
  // Connect to WebSocket if not already connected
  if (!webSocketStore.isConnected) {
    webSocketStore.connect()
  }

  updateInterval = setInterval(() => {
    lastUpdate.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>