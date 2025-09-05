<template>
  <button
    @click="toggle"
    :class="[
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      modelValue ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
    ]"
    type="button"
    role="switch"
    :aria-checked="modelValue"
  >
    <span
      :class="[
        'inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
        modelValue ? 'translate-x-6' : 'translate-x-1'
      ]"
    />
  </button>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>