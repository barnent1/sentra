<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Agent Pool</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ stats.totalAgents }} agents • {{ stats.activeAgents }} active
          </p>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Connection Status -->
          <div class="flex items-center space-x-2">
            <div :class="connectionIndicatorClass" class="w-2 h-2 rounded-full"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ isConnected ? 'Live' : 'Offline' }}
            </span>
          </div>
          
          <!-- Filter Toggle -->
          <button
            @click="showOnlyActive = !showOnlyActive"
            :class="[
              'px-3 py-1 text-sm rounded-lg transition-colors duration-150',
              showOnlyActive 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            ]"
          >
            {{ showOnlyActive ? 'All Agents' : 'Active Only' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.activeAgents }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Active</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ stats.inactiveAgents }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Inactive</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.spawnedToday }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Spawned Today</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">
            {{ (stats.averagePerformance * 100).toFixed(1) }}%
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Avg Performance</div>
        </div>
      </div>
    </div>

    <!-- Task Statistics -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Task Execution</h3>
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ stats.tasksCompleted }} Completed
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ stats.tasksInProgress }} In Progress
          </span>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="bg-green-600 h-2 rounded-full transition-all duration-300"
          :style="{ 
            width: `${totalTasks > 0 ? (stats.tasksCompleted / totalTasks) * 100 : 0}%` 
          }"
        ></div>
      </div>
    </div>

    <!-- Agent List -->
    <div class="p-6">
      <div class="space-y-3 max-h-96 overflow-y-auto">
        <div
          v-for="agent in filteredAgents"
          :key="agent.id"
          class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 cursor-pointer"
          @click="$emit('select-agent', agent.id)"
        >
          <div class="flex items-center space-x-3">
            <div :class="getStatusColor(agent.status)" class="w-2 h-2 rounded-full"></div>
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ agent.name }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ agent.role }} • {{ getTimeSince(agent.lastActiveAt) }}
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <!-- Performance Indicator -->
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getAgentPerformance(agent.id) }}%
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Performance</div>
            </div>
            
            <!-- Current Task -->
            <div v-if="agent.currentTaskId" class="flex items-center space-x-1">
              <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span class="text-xs text-blue-600 dark:text-blue-400">Working</span>
            </div>
          </div>
        </div>
        
        <div v-if="filteredAgents.length === 0" class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">
            {{ showOnlyActive ? 'No active agents found' : 'No agents in pool' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Footer -->
    <div class="p-6 border-t border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('refresh-pool')"
          class="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
        >
          Refresh Pool
        </button>
        
        <div class="flex space-x-2">
          <button
            @click="$emit('spawn-agent')"
            class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150"
          >
            Spawn Agent
          </button>
          <button
            @click="$emit('manage-pool')"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
          >
            Manage Pool
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AgentInstance, AgentInstanceId } from '@sentra/types'
import type { AgentPoolStats, AgentMetrics } from '../../stores/agents'

interface Props {
  agents: readonly AgentInstance[]
  stats: AgentPoolStats
  agentMetrics: Map<AgentInstanceId, AgentMetrics>
  isConnected: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'select-agent': [agentId: AgentInstanceId]
  'refresh-pool': []
  'spawn-agent': []
  'manage-pool': []
}>()

const showOnlyActive = ref(false)

const filteredAgents = computed(() => {
  if (showOnlyActive.value) {
    return props.agents.filter(agent => agent.status === 'active')
  }
  return props.agents
})

const totalTasks = computed(() => {
  return props.stats.tasksCompleted + props.stats.tasksInProgress
})

const connectionIndicatorClass = computed(() => {
  return props.isConnected ? 'bg-green-500' : 'bg-red-500'
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'inactive':
      return 'bg-yellow-500'
    case 'archived':
      return 'bg-gray-500'
    default:
      return 'bg-red-500'
  }
}

const getTimeSince = (date: Date) => {
  const now = new Date()
  const past = new Date(date)
  const diffMinutes = Math.floor((now.getTime() - past.getTime()) / 60000)
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`
  return `${Math.floor(diffMinutes / 1440)}d`
}

const getAgentPerformance = (agentId: AgentInstanceId) => {
  const metrics = props.agentMetrics.get(agentId)
  return metrics ? Math.round(metrics.successRate * 100) : 0
}
</script>