<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <!-- Agent Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div :class="statusIndicatorClass" class="w-3 h-3 rounded-full"></div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ agent.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ agent.role }} • Gen {{ generation }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <span :class="statusBadgeClass" class="px-2 py-1 text-xs font-medium rounded-full">
          {{ agent.status.charAt(0).toUpperCase() + agent.status.slice(1) }}
        </span>
      </div>
    </div>

    <!-- Current Task -->
    <div class="mb-4" v-if="currentTask">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Current Task</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ taskProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${taskProgress}%` }"
        ></div>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ currentTask.title }}</p>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ Math.round((metrics?.successRate ?? 0) * 100) }}%
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ metrics?.tasksCompleted || 0 }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Tasks Done</div>
      </div>
    </div>

    <!-- DNA Genetics Overview -->
    <div class="space-y-2" v-if="dna">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Complexity</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ (dna.genetics.complexity * 100).toFixed(1) }}%
        </span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Adaptability</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ (dna.genetics.adaptability * 100).toFixed(1) }}%
        </span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Stability</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ (dna.genetics.stability * 100).toFixed(1) }}%
        </span>
      </div>
    </div>

    <!-- Last Activity -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Last Active</span>
        <span class="text-gray-900 dark:text-white">{{ formatLastActive() }}</span>
      </div>
    </div>

    <!-- Action Menu -->
    <div class="mt-4 flex space-x-2">
      <button
        @click="$emit('view-details', agent.id)"
        class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
      >
        View Details
      </button>
      <button
        @click="$emit('manage-agent', agent.id)"
        class="flex-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-150"
      >
        Manage
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { 
  AgentInstance, 
  AgentInstanceId,
  EvolutionDna,
  Task
} from '@sentra/types'
import type { AgentMetrics } from '../../stores/agents'

interface Props {
  agent: AgentInstance
  metrics?: AgentMetrics
  dna?: EvolutionDna
  currentTask?: Task
  taskProgress?: number
}

const props = defineProps<Props>()

defineEmits<{
  'view-details': [agentId: AgentInstanceId]
  'manage-agent': [agentId: AgentInstanceId]
}>()

const generation = computed(() => {
  return props.dna?.generation || 1
})

const statusIndicatorClass = computed(() => {
  switch (props.agent.status) {
    case 'active':
      return 'bg-green-500'
    case 'inactive':
      return 'bg-yellow-500'
    case 'archived':
      return 'bg-gray-500'
    default:
      return 'bg-red-500'
  }
})

const statusBadgeClass = computed(() => {
  switch (props.agent.status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
})

const formatLastActive = () => {
  const now = new Date()
  const lastActive = new Date(props.agent.lastActiveAt)
  const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000)
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
  return `${Math.floor(diffMinutes / 1440)}d ago`
}
</script>