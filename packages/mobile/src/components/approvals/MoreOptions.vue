<template>
  <div class="relative inline-block text-left">
    <button
      @click="showMenu = !showMenu"
      class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
    >
      <EllipsisVerticalIcon class="w-4 h-4" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showMenu"
      class="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      @click.stop
    >
      <div class="py-1">
        <button
          @click="handleViewDetails"
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <EyeIcon class="w-4 h-4 inline mr-2" />
          View Details
        </button>
        <button
          @click="handleDefer"
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <ClockIcon class="w-4 h-4 inline mr-2" />
          Defer Decision
        </button>
        <button
          @click="handleEscalate"
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <ExclamationTriangleIcon class="w-4 h-4 inline mr-2" />
          Escalate
        </button>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showMenu"
      class="fixed inset-0 z-0"
      @click="showMenu = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import { 
  EllipsisVerticalIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'
import type { ApprovalRequest } from '../../types'

// Props
defineProps({
  approval: {
    type: Object as PropType<ApprovalRequest>,
    required: true
  }
})

// Emits
const emit = defineEmits<{
  'view-details': []
  defer: []
  escalate: []
}>()

// State
const showMenu = ref(false)

// Methods
const handleViewDetails = () => {
  showMenu.value = false
  emit('view-details')
}

const handleDefer = () => {
  showMenu.value = false
  emit('defer')
}

const handleEscalate = () => {
  showMenu.value = false
  emit('escalate')
}
</script>