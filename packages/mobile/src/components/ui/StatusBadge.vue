<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClasses"
  >
    <div class="w-2 h-2 rounded-full mr-1.5" :class="dotClasses"></div>
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

// Props
const props = defineProps({
  status: {
    type: String as PropType<'normal' | 'warning' | 'critical' | 'emergency' | 'offline' | 'active' | 'inactive' | 'error'>,
    required: true
  }
})

// Computed properties
const badgeClasses = computed(() => {
  switch (props.status) {
    case 'normal':
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'critical':
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'emergency':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse'
    case 'offline':
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
})

const dotClasses = computed(() => {
  switch (props.status) {
    case 'normal':
    case 'active':
      return 'bg-green-400'
    case 'warning':
      return 'bg-yellow-400'
    case 'critical':
    case 'error':
      return 'bg-red-400'
    case 'emergency':
      return 'bg-red-500 animate-ping'
    case 'offline':
    case 'inactive':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
})

const statusText = computed(() => {
  return props.status.charAt(0).toUpperCase() + props.status.slice(1)
})
</script>