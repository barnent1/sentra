<template>
  <div 
    class="approval-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
    :class="[
      priorityClasses,
      { 'opacity-60': isProcessing }
    ]"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Priority Indicator -->
    <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full" :class="priorityDotColor"></div>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ approval.decisionType.replace('_', ' ').toUpperCase() }}
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <TimeRemaining :approval="approval" />
        <MoreOptions :approval="approval" />
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ approval.title }}
      </h3>
      
      <p class="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {{ approval.description }}
      </p>

      <!-- Context Summary -->
      <div v-if="approval.context" class="mb-4">
        <ContextSummary :context="approval.context" />
      </div>

      <!-- Agent Info -->
      <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        <UserIcon class="w-4 h-4 mr-1" />
        <span>Agent: {{ agentName }}</span>
        <ClockIcon class="w-4 h-4 ml-4 mr-1" />
        <span>{{ formatRelativeTime(approval.requestedAt) }}</span>
      </div>

      <!-- Risk Indicators -->
      <div v-if="approval.context?.riskAssessment" class="mb-4">
        <RiskIndicators :risk-assessment="approval.context.riskAssessment" />
      </div>
    </div>

    <!-- Actions -->
    <div class="px-4 pb-4">
      <div class="flex space-x-2">
        <ApprovalButton
          variant="approve"
          :disabled="isProcessing"
          :loading="isApproving"
          @click="$emit('approve')"
          class="flex-1"
        >
          <CheckIcon class="w-4 h-4 mr-1" />
          Approve
        </ApprovalButton>
        
        <ApprovalButton
          variant="reject"
          :disabled="isProcessing"
          :loading="isRejecting"
          @click="$emit('reject')"
          class="flex-1"
        >
          <XMarkIcon class="w-4 h-4 mr-1" />
          Reject
        </ApprovalButton>
        
        <ApprovalButton
          variant="secondary"
          :disabled="isProcessing"
          @click="$emit('view-details')"
          class="px-3"
        >
          <EyeIcon class="w-4 h-4" />
        </ApprovalButton>
      </div>
    </div>

    <!-- Swipe Actions Overlay -->
    <div 
      v-if="swipeAction"
      class="absolute inset-0 flex items-center justify-center rounded-lg transition-all duration-200"
      :class="swipeActionClasses"
    >
      <div class="text-white font-semibold text-lg">
        {{ swipeActionText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import { 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  UserIcon, 
  ClockIcon 
} from '@heroicons/vue/24/solid'
import type { ApprovalRequest } from '../../types'
import TimeRemaining from './TimeRemaining.vue'
import MoreOptions from './MoreOptions.vue'
import ContextSummary from './ContextSummary.vue'
import RiskIndicators from './RiskIndicators.vue'
import ApprovalButton from '../ui/ApprovalButton.vue'

// Props
const props = defineProps({
  approval: {
    type: Object as PropType<ApprovalRequest>,
    required: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  isApproving: {
    type: Boolean,
    default: false
  },
  isRejecting: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  approve: []
  reject: []
  'view-details': []
}>()

// Touch gesture state
const swipeAction = ref<'approve' | 'reject' | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const isTouching = ref(false)

// Computed properties
const priorityClasses = computed(() => {
  const priority = props.approval.priority
  return {
    'border-l-4 border-red-500': priority === 'emergency',
    'border-l-4 border-orange-500': priority === 'critical',
    'border-l-4 border-yellow-500': priority === 'high',
    'border-l-4 border-blue-500': priority === 'medium',
    'border-l-4 border-gray-400': priority === 'low'
  }
})

const priorityDotColor = computed(() => {
  const priority = props.approval.priority
  switch (priority) {
    case 'emergency': return 'bg-red-500'
    case 'critical': return 'bg-orange-500'
    case 'high': return 'bg-yellow-500'
    case 'medium': return 'bg-blue-500'
    case 'low': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
})

const agentName = computed(() => {
  // In a real implementation, this would look up the agent name by ID
  return `Agent ${props.approval.agentId.slice(-6)}`
})

const swipeActionClasses = computed(() => {
  if (!swipeAction.value) return ''
  
  return {
    'bg-green-500': swipeAction.value === 'approve',
    'bg-red-500': swipeAction.value === 'reject'
  }
})

const swipeActionText = computed(() => {
  switch (swipeAction.value) {
    case 'approve': return 'Release to Approve'
    case 'reject': return 'Release to Reject'
    default: return ''
  }
})

// Touch gesture handlers
const onTouchStart = (event: TouchEvent) => {
  if (props.isProcessing) return
  
  const touch = event.touches[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isTouching.value = true
}

const onTouchMove = (event: TouchEvent) => {
  if (!isTouching.value || props.isProcessing) return
  
  const touch = event.touches[0]
  if (!touch) return
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  
  // Only handle horizontal swipes
  if (Math.abs(deltaY) > Math.abs(deltaX)) return
  
  const threshold = 100
  
  if (deltaX > threshold) {
    swipeAction.value = 'approve'
  } else if (deltaX < -threshold) {
    swipeAction.value = 'reject'
  } else {
    swipeAction.value = null
  }
}

const onTouchEnd = () => {
  if (!isTouching.value || props.isProcessing) return
  
  if (swipeAction.value === 'approve') {
    // Emit approve after a short delay for visual feedback
    setTimeout(() => {
      emit('approve')
    }, 150)
  } else if (swipeAction.value === 'reject') {
    setTimeout(() => {
      emit('reject')
    }, 150)
  }
  
  // Reset state
  setTimeout(() => {
    swipeAction.value = null
  }, 200)
  
  isTouching.value = false
}

// Utility functions
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
</script>

<style scoped>
.approval-card {
  position: relative;
  transition: all 0.2s ease-in-out;
  touch-action: pan-y;
}

.approval-card:active {
  transform: scale(0.98);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Swipe action animation */
.approval-card {
  overflow: hidden;
}
</style>