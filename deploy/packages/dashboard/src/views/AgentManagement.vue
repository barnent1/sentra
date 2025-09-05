<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Agent Management
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Monitor and manage your evolutionary agent pool
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <select
          v-model="selectedView"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pool">Pool Overview</option>
          <option value="individual">Individual Agents</option>
          <option value="performance">Performance Analysis</option>
        </select>
        
        <button
          @click="spawnNewAgent"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-150"
        >
          Spawn Agent
        </button>
      </div>
    </div>

    <!-- Pool Overview View -->
    <div v-if="selectedView === 'pool'" class="space-y-6">
      <AgentPoolOverview
        :agents="agentsStore.agents"
        :stats="agentsStore.poolStats"
        :agent-metrics="agentMetricsMap"
        :is-connected="webSocketStore.isConnected"
        @select-agent="selectAgent"
        @refresh-pool="refreshAgentPool"
        @spawn-agent="spawnNewAgent"
        @manage-pool="managePool"
      />
    </div>

    <!-- Individual Agents View -->
    <div v-if="selectedView === 'individual'" class="space-y-6">
      <!-- Agent Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AgentStatusCard
          v-for="agent in agentsStore.agents"
          :key="agent.id"
          :agent="agent"
          :metrics="agentsStore.getAgentMetrics(agent.id)"
          :dna="agentsStore.getAgentDna(agent.id)"
          :current-task="getCurrentTask(agent.id)"
          :task-progress="getTaskProgress(agent.id)"
          @view-details="viewAgentDetails"
          @manage-agent="manageAgent"
        />
      </div>
      
      <!-- Empty State -->
      <div v-if="agentsStore.agents.length === 0" class="text-center py-12">
        <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No agents</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by spawning your first evolutionary agent.
        </p>
        <div class="mt-6">
          <button
            @click="spawnNewAgent"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
          >
            Spawn First Agent
          </button>
        </div>
      </div>
    </div>

    <!-- Performance Analysis View -->
    <div v-if="selectedView === 'performance'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Performance Comparison -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Agent Performance Comparison
            </h3>
            <select
              v-model="selectedMetric"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="successRate">Success Rate</option>
              <option value="averageCompletionTime">Completion Time</option>
              <option value="tasksCompleted">Tasks Completed</option>
              <option value="codeQualityScore">Code Quality</option>
            </select>
          </div>
          <div class="h-80">
            <AgentComparisonChart
              :agents="comparisonData"
              :metric="selectedMetric"
              :show-comparison="true"
              :max-agents="8"
            />
          </div>
        </div>
        
        <!-- Performance Timeline -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Timeline
            </h3>
            <select
              v-model="selectedTimeRange"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hour">Last Hour</option>
              <option value="day">Last Day</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
          <div class="h-80">
            <PerformanceTimelineChart
              :data="performanceTimelineData"
              :time-range="selectedTimeRange"
              :selected-metrics="['successRate', 'codeQualityScore', 'errorRecoveryRate']"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Spawn Agent Modal -->
    <div
      v-if="showSpawnModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showSpawnModal = false"></div>
        
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Spawn New Agent
              </h3>
              <button
                @click="showSpawnModal = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form @submit.prevent="handleAgentSpawn" class="space-y-4">
              <div>
                <label for="agent-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Name
                </label>
                <input
                  id="agent-name"
                  v-model="newAgentForm.name"
                  type="text"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label for="specialization" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Specialization
                </label>
                <select
                  id="specialization"
                  v-model="newAgentForm.specialization"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select specialization</option>
                  <option value="developer">Developer</option>
                  <option value="tester">Tester</option>
                  <option value="reviewer">Code Reviewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="designer">Designer</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Capabilities
                </label>
                <div class="mt-2 space-y-2">
                  <label v-for="capability in availableCapabilities" :key="capability" class="flex items-center">
                    <input
                      v-model="newAgentForm.capabilities"
                      :value="capability"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ capability }}</span>
                  </label>
                </div>
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="showSpawnModal = false"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Spawn Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import { useWebSocketStore } from '../stores/websocket'
import { useAgentsStore } from '../stores/agents'
import { useEvolutionStore } from '../stores/evolution'

// Components
import AgentPoolOverview from '../components/agents/AgentPoolOverview.vue'
import AgentStatusCard from '../components/agents/AgentStatusCard.vue'
import AgentComparisonChart from '../components/charts/AgentComparisonChart.vue'
import PerformanceTimelineChart from '../components/charts/PerformanceTimelineChart.vue'

// Types
import type { 
  AgentInstanceId, 
  PerformanceMetrics, 
  Task
} from '@sentra/types'
import type { AgentMetrics } from '../stores/agents'

const webSocketStore = useWebSocketStore()
const agentsStore = useAgentsStore()
const evolutionStore = useEvolutionStore()

// View state
const selectedView = ref<'pool' | 'individual' | 'performance'>('pool')
const showSpawnModal = ref(false)
const selectedMetric = ref<keyof PerformanceMetrics | keyof Pick<AgentMetrics, 'successRate' | 'averageCompletionTime' | 'tasksCompleted'>>('successRate')
const selectedTimeRange = ref<'hour' | 'day' | 'week' | 'month'>('hour')

// Form state
const newAgentForm = ref({
  name: '',
  specialization: '',
  capabilities: [] as string[]
})

const availableCapabilities = [
  'TypeScript',
  'Vue.js',
  'Node.js',
  'Testing',
  'Code Review',
  'API Design',
  'Database Design',
  'DevOps'
]

// Computed data
const agentMetricsMap = computed(() => {
  const map = new Map()
  ;(agentsStore.agents as any[])?.forEach((agent: any) => {
    const metrics = agentsStore.getAgentMetrics(agent.id)
    if (metrics) {
      map.set(agent.id, metrics)
    }
  })
  return map
})

const comparisonData = computed(() => {
  return ((agentsStore.agents as any[]) || []).map((agent: any) => ({
    agentId: agent.id,
    name: agent.name,
    metrics: agentsStore.getAgentMetrics(agent.id) || createDefaultMetrics(agent.id),
    currentPerformance: agent.performanceHistory[agent.performanceHistory.length - 1] || createDefaultPerformance()
  }))
})

const performanceTimelineData = computed(() => {
  const data: Array<{
    timestamp: Date
    agentId: AgentInstanceId
    metrics: PerformanceMetrics
  }> = []

  ;((agentsStore.agents as any[]) || []).forEach((agent: any) => {
    ;(agent.performanceHistory || []).forEach((metrics: any) => {
      data.push({
        timestamp: new Date(), // In real implementation, this would have actual timestamp
        agentId: agent.id,
        metrics
      })
    })
  })

  return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
})

// Helper functions
const createDefaultMetrics = (agentId: AgentInstanceId): AgentMetrics => ({
  agentId,
  tasksCompleted: 0,
  averageCompletionTime: 0,
  successRate: 0,
  currentPerformance: createDefaultPerformance(),
  lastActive: new Date(),
  evolutionGeneration: 1
})

const createDefaultPerformance = (): PerformanceMetrics => ({
  successRate: 0,
  averageTaskCompletionTime: 0,
  codeQualityScore: 0,
  userSatisfactionRating: 0,
  adaptationSpeed: 0,
  errorRecoveryRate: 0
})

const getCurrentTask = (_agentId: AgentInstanceId): Task | undefined => {
  // In real implementation, this would fetch from task store
  return undefined
}

const getTaskProgress = (_agentId: AgentInstanceId): number => {
  // In real implementation, this would calculate actual progress
  return Math.floor(Math.random() * 100)
}

// Event handlers
const selectAgent = (agentId: AgentInstanceId) => {
  console.log('Selected agent:', agentId)
}

const viewAgentDetails = (agentId: AgentInstanceId) => {
  console.log('View agent details:', agentId)
}

const manageAgent = (agentId: AgentInstanceId) => {
  // Open agent management interface
  console.log('Managing agent:', agentId)
}

const refreshAgentPool = () => {
  agentsStore.fetchAgents()
}

const spawnNewAgent = () => {
  showSpawnModal.value = true
}

const managePool = () => {
  // Open pool management interface
  console.log('Managing agent pool')
}

const handleAgentSpawn = () => {
  // In real implementation, this would call the agent spawning API
  console.log('Spawning new agent:', newAgentForm.value)
  showSpawnModal.value = false
  
  // Reset form
  newAgentForm.value = {
    name: '',
    specialization: '',
    capabilities: []
  }
  
  // Simulate agent creation
  setTimeout(() => {
    // This would be replaced with actual API call
    console.log('Agent spawned successfully')
  }, 1000)
}

// Lifecycle
onMounted(() => {
  // Connect to WebSocket if not already connected
  if (!webSocketStore.isConnected) {
    webSocketStore.connect()
  }
  
  // Fetch initial data
  agentsStore.fetchAgents()
  evolutionStore.fetchEvolutionData()
})
</script>