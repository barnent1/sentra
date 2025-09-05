<template>
  <div class="context-summary">
    <!-- Code Changes -->
    <div v-if="context.codeChanges && context.codeChanges.length > 0" class="mb-2">
      <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
        <CodeBracketIcon class="w-3 h-3 mr-1" />
        <span>{{ context.codeChanges.length }} file{{ context.codeChanges.length > 1 ? 's' : '' }} changed</span>
      </div>
      <div class="flex space-x-2">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          +{{ totalLinesAdded }}
        </span>
        <span class="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          -{{ totalLinesRemoved }}
        </span>
      </div>
    </div>

    <!-- System Impact -->
    <div v-if="context.systemImpact" class="mb-2">
      <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
        <ServerIcon class="w-3 h-3 mr-1" />
        <span>System Impact</span>
      </div>
      <div class="flex flex-wrap gap-1">
        <span 
          v-if="context.systemImpact.downtime"
          class="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          Downtime: {{ context.systemImpact.estimatedDuration }}m
        </span>
        <span 
          class="inline-flex items-center px-2 py-1 rounded text-xs"
          :class="userImpactClasses"
        >
          Impact: {{ context.systemImpact.userImpact }}
        </span>
      </div>
    </div>

    <!-- Risk Assessment -->
    <div v-if="context.riskAssessment" class="mb-2">
      <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
        <ShieldExclamationIcon class="w-3 h-3 mr-1" />
        <span>Risk Level</span>
      </div>
      <span 
        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
        :class="riskLevelClasses"
      >
        {{ formatRiskLevel(context.riskAssessment.overallRisk) }}
      </span>
    </div>

    <!-- Resource Requirements -->
    <div v-if="context.resourceRequirements" class="mb-2">
      <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
        <CpuChipIcon class="w-3 h-3 mr-1" />
        <span>Resources</span>
      </div>
      <div class="grid grid-cols-2 gap-1 text-xs">
        <span class="text-gray-600 dark:text-gray-300">
          CPU: {{ context.resourceRequirements.cpu }}%
        </span>
        <span class="text-gray-600 dark:text-gray-300">
          Memory: {{ formatBytes(context.resourceRequirements.memory * 1024 * 1024) }}
        </span>
      </div>
    </div>

    <!-- Test Results -->
    <div v-if="context.testResults" class="mb-2">
      <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
        <BeakerIcon class="w-3 h-3 mr-1" />
        <span>Test Results</span>
      </div>
      <div class="flex space-x-2">
        <TestResultsBadge :test-results="context.testResults" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import {
  CodeBracketIcon,
  ServerIcon,
  ShieldExclamationIcon,
  CpuChipIcon,
  BeakerIcon
} from '@heroicons/vue/24/outline'
import type { ApprovalContext } from '../../types'
import TestResultsBadge from './TestResultsBadge.vue'

// Props
const props = defineProps({
  context: {
    type: Object as PropType<ApprovalContext>,
    required: true
  }
})

// Computed properties
const totalLinesAdded = computed(() => {
  return props.context.codeChanges?.reduce((total, change) => total + change.linesAdded, 0) || 0
})

const totalLinesRemoved = computed(() => {
  return props.context.codeChanges?.reduce((total, change) => total + change.linesRemoved, 0) || 0
})

const userImpactClasses = computed(() => {
  if (!props.context.systemImpact) return ''
  
  const impact = props.context.systemImpact.userImpact
  switch (impact) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'none':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
})

const riskLevelClasses = computed(() => {
  if (!props.context.riskAssessment) return ''
  
  const risk = props.context.riskAssessment.overallRisk
  switch (risk) {
    case 'very_high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'very_low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
})

// Utility functions
const formatRiskLevel = (risk: string): string => {
  return risk.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.context-summary {
  @apply space-y-2;
}
</style>