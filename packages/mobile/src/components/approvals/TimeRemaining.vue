<template>
  <div class="flex items-center text-xs" :class="textColorClass">
    <ClockIcon class="w-3 h-3 mr-1" />
    <span class="font-medium">{{ timeText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, type PropType } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'
import type { ApprovalRequest } from '../../types'

// Props
const props = defineProps({
  approval: {
    type: Object as PropType<ApprovalRequest>,
    required: true
  }
})

// Reactive time for live updates
const currentTime = ref(new Date())
let timeInterval: NodeJS.Timeout | null = null

// Computed properties
const timeRemaining = computed(() => {
  if (!props.approval.expiresAt) return null
  
  const remaining = props.approval.expiresAt.getTime() - currentTime.value.getTime()
  return Math.max(0, remaining)
})

const isExpired = computed(() => {
  return timeRemaining.value === 0
})

const isUrgent = computed(() => {
  if (!timeRemaining.value) return false
  const oneHour = 60 * 60 * 1000
  return timeRemaining.value <= oneHour && timeRemaining.value > 0
})

const isCritical = computed(() => {
  if (!timeRemaining.value) return false
  const fifteenMinutes = 15 * 60 * 1000
  return timeRemaining.value <= fifteenMinutes && timeRemaining.value > 0
})

const timeText = computed(() => {
  if (!props.approval.expiresAt) {
    return 'No expiry'
  }
  
  if (isExpired.value) {
    return 'EXPIRED'
  }
  
  const remaining = timeRemaining.value!
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
})

const textColorClass = computed(() => {
  if (isExpired.value) {
    return 'text-red-600 dark:text-red-400'
  } else if (isCritical.value) {
    return 'text-red-500 dark:text-red-400'
  } else if (isUrgent.value) {
    return 'text-orange-500 dark:text-orange-400'
  } else {
    return 'text-gray-500 dark:text-gray-400'
  }
})

// Lifecycle hooks
onMounted(() => {
  // Update time every second if there's an expiration
  if (props.approval.expiresAt) {
    timeInterval = setInterval(() => {
      currentTime.value = new Date()
    }, 1000)
  }
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>