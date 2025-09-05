<template>
  <button
    :disabled="!control.enabled || isProcessing"
    class="emergency-action-button w-full p-4 rounded-lg border-2 border-dashed transition-all duration-200 text-left"
    :class="[
      buttonClasses,
      { 'cursor-wait': isProcessing }
    ]"
    @click="$emit('execute', control)"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <component :is="actionIcon" class="w-5 h-5 mr-2" />
          <span class="font-semibold text-base">
            {{ formatActionName(control.action) }}
          </span>
          <span v-if="control.irreversible" class="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
            Irreversible
          </span>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {{ control.description }}
        </p>
        
        <p class="text-xs text-gray-500 dark:text-gray-400">
          <span class="font-medium">Impact:</span> {{ control.estimatedImpact }}
        </p>
      </div>
      
      <div class="flex items-center ml-4">
        <div
          v-if="isProcessing"
          class="animate-spin rounded-full w-5 h-5 border-2 border-current border-t-transparent"
        ></div>
        <ChevronRightIcon v-else class="w-5 h-5" />
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import {
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowUturnLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import type { EmergencyControl } from '../../types'

// Props
const props = defineProps({
  control: {
    type: Object as PropType<EmergencyControl>,
    required: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits<{
  execute: [control: EmergencyControl]
}>()

// Computed properties
const buttonClasses = computed(() => {
  if (!props.control.enabled) {
    return 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
  }
  
  if (props.control.irreversible) {
    return 'border-red-300 bg-red-50 hover:bg-red-100 text-red-900 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-200'
  }
  
  return 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-900 dark:border-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-200'
})

const actionIcon = computed(() => {
  switch (props.control.action) {
    case 'pause_all_agents':
      return PauseIcon
    case 'emergency_stop':
      return StopIcon
    case 'rollback_deployment':
      return ArrowUturnLeftIcon
    case 'escalate_to_human':
      return ExclamationTriangleIcon
    case 'activate_failsafe':
      return ShieldCheckIcon
    case 'force_agent_restart':
      return ArrowPathIcon
    default:
      return ExclamationTriangleIcon
  }
})

// Helper functions
const formatActionName = (action: string): string => {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.emergency-action-button:active:not(:disabled) {
  transform: scale(0.98);
}

.emergency-action-button:disabled {
  transform: none;
}
</style>