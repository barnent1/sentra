<template>
  <!-- Modal Overlay -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="onBackdropClick"
  >
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity"></div>
      
      <!-- Modal Content -->
      <div
        class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <ExclamationTriangleIcon 
              class="w-6 h-6 mr-3"
              :class="irreversible ? 'text-red-600' : 'text-orange-500'"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-4">
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            {{ message }}
          </p>

          <!-- Warning for irreversible actions -->
          <div 
            v-if="irreversible" 
            class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md mb-4"
          >
            <div class="flex items-center">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-600 mr-2" />
              <p class="text-sm font-medium text-red-800 dark:text-red-200">
                This action cannot be undone
              </p>
            </div>
          </div>

          <!-- Reason Input -->
          <div v-if="requiresReason" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason (optional)
            </label>
            <textarea
              v-model="reason"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows="2"
              placeholder="Enter reason for this action..."
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex space-x-3">
            <ApprovalButton
              variant="secondary"
              size="sm"
              @click="$emit('cancel')"
              class="flex-1"
            >
              Cancel
            </ApprovalButton>
            <ApprovalButton
              :variant="irreversible ? 'danger' : 'primary'"
              size="sm"
              @click="onConfirm"
              class="flex-1"
            >
              {{ confirmText }}
            </ApprovalButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import type { EmergencyControl } from '../../types'
import ApprovalButton from './ApprovalButton.vue'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  action: {
    type: Object as PropType<EmergencyControl | null>,
    default: null
  },
  irreversible: {
    type: Boolean,
    default: false
  },
  requiresReason: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  confirm: [reason?: string]
  cancel: []
}>()

// Local state
const reason = ref('')

// Computed properties
const title = computed(() => {
  if (!props.action) return 'Confirm Action'
  return `Confirm ${formatActionName(props.action.action)}`
})

const message = computed(() => {
  if (!props.action) return 'Are you sure you want to perform this action?'
  return `${props.action.description}\n\nEstimated Impact: ${props.action.estimatedImpact}`
})

const confirmText = computed(() => {
  if (props.irreversible) return 'Execute Anyway'
  return 'Execute'
})

// Methods
const onConfirm = () => {
  emit('confirm', reason.value || undefined)
}

const onBackdropClick = () => {
  emit('cancel')
}

const formatActionName = (action: string): string => {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Watch for modal visibility changes to reset reason
watch(() => props.show, (newValue) => {
  if (!newValue) {
    reason.value = ''
  }
})
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>