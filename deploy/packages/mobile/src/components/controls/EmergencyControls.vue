<template>
  <div class="emergency-controls bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700 shadow-lg">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
      <div class="flex items-center">
        <ExclamationTriangleIcon class="w-6 h-6 text-red-600 dark:text-red-400 mr-2" />
        <h3 class="text-lg font-semibold text-red-900 dark:text-red-200">
          Emergency Controls
        </h3>
      </div>
      <p class="text-sm text-red-700 dark:text-red-300 mt-1">
        Use these controls in critical situations only
      </p>
    </div>

    <!-- System Status -->
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          System Status
        </span>
        <StatusBadge :status="systemStatus" />
      </div>
    </div>

    <!-- Emergency Actions -->
    <div class="p-4 space-y-3">
      <EmergencyActionButton
        v-for="control in emergencyControls"
        :key="control.action"
        :control="control"
        :is-processing="isActionProcessing(control.action)"
        @execute="onExecuteAction"
      />
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="showConfirmation"
      :action="pendingAction"
      :irreversible="pendingAction?.irreversible || false"
      @confirm="onConfirmAction"
      @cancel="onCancelAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import type { EmergencyControl, EmergencyAction } from '../../types'
import { useMobileAgentsStore } from '../../stores'
import StatusBadge from '../ui/StatusBadge.vue'
import EmergencyActionButton from './EmergencyActionButton.vue'
import ConfirmationModal from '../ui/ConfirmationModal.vue'

// Props
defineProps({
  emergencyControls: {
    type: Array as PropType<EmergencyControl[]>,
    required: true
  }
})

// Store
const agentsStore = useMobileAgentsStore()

// Local state
const showConfirmation = ref(false)
const pendingAction = ref<EmergencyControl | null>(null)
const confirmationReason = ref('')

// Computed properties
const systemStatus = computed(() => {
  const status = agentsStore.systemStatus
  return status as 'normal' | 'warning' | 'critical' | 'emergency' | 'offline' | 'active' | 'inactive' | 'error'
})

// Methods
const isActionProcessing = (action: EmergencyAction): boolean => {
  return agentsStore.isEmergencyActionProcessing(action)
}

const onExecuteAction = (control: EmergencyControl) => {
  if (control.confirmationRequired) {
    pendingAction.value = control
    showConfirmation.value = true
  } else {
    executeAction(control.action)
  }
}

const onConfirmAction = (reason?: string) => {
  if (pendingAction.value) {
    executeAction(pendingAction.value.action, reason)
  }
  onCancelAction()
}

const onCancelAction = () => {
  pendingAction.value = null
  showConfirmation.value = false
  confirmationReason.value = ''
}

const executeAction = async (action: EmergencyAction, reason?: string) => {
  try {
    await agentsStore.executeEmergencyAction(action, reason)
    
    // Show success feedback
    showNotification({
      type: 'success',
      title: 'Emergency Action Executed',
      message: `${action.replace('_', ' ')} has been executed successfully`
    })
  } catch (error) {
    // Show error feedback
    showNotification({
      type: 'error',
      title: 'Emergency Action Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

// Mock notification function (would be replaced with actual implementation)
const showNotification = (notification: { type: string; title: string; message: string }) => {
  console.log('Notification:', notification)
}
</script>

<style scoped>
.emergency-controls {
  max-width: 100%;
}

/* Pulse animation for critical status */
.status-critical {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}
</style>