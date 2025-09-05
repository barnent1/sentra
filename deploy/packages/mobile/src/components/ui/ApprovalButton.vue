<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="approval-button inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variantClasses,
      sizeClasses,
      { 'cursor-wait': loading }
    ]"
    @click="$emit('click', $event)"
  >
    <!-- Loading Spinner -->
    <div
      v-if="loading"
      class="animate-spin rounded-full border-2 border-current border-t-transparent mr-2"
      :class="spinnerSizeClass"
    ></div>
    
    <!-- Button Content -->
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

// Props
const props = defineProps({
  variant: {
    type: String as PropType<'approve' | 'reject' | 'primary' | 'secondary' | 'danger'>,
    default: 'primary'
  },
  size: {
    type: String as PropType<'sm' | 'md' | 'lg'>,
    default: 'md'
  },
  type: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits<{
  click: [event: MouseEvent]
}>()

// Computed classes
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'approve':
      return 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-sm'
    case 'reject':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm'
    case 'primary':
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm'
    case 'secondary':
      return 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 text-gray-900 border border-gray-300'
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm'
    default:
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm min-h-[32px]'
    case 'md':
      return 'px-4 py-2 text-sm min-h-[40px]'
    case 'lg':
      return 'px-6 py-3 text-base min-h-[48px]'
    default:
      return 'px-4 py-2 text-sm min-h-[40px]'
  }
})

const spinnerSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3 h-3'
    case 'md':
      return 'w-4 h-4'
    case 'lg':
      return 'w-5 h-5'
    default:
      return 'w-4 h-4'
  }
})
</script>

<style scoped>
.approval-button {
  /* Touch-friendly minimum target size */
  min-height: 44px;
}

.approval-button:active {
  transform: scale(0.98);
}

/* Dark mode styles */
.dark .approval-button {
  @apply focus:ring-offset-gray-800;
}

.dark .approval-button.bg-gray-200 {
  @apply bg-gray-700 text-white border-gray-600 hover:bg-gray-600;
}
</style>