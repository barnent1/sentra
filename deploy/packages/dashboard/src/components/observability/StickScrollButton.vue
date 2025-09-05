<template>
  <button
    v-if="!stickToBottom"
    @click="$emit('toggle')"
    class="fixed bottom-6 right-6 z-40 p-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-2 border-white/20"
    :title="stickToBottom ? 'Disable auto-scroll' : 'Enable auto-scroll to latest events'"
    aria-label="Toggle auto-scroll to bottom"
  >
    <svg 
      class="w-5 h-5" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      :class="{ 'animate-bounce': !stickToBottom }"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
    
    <!-- Pulse indicator for new events -->
    <div 
      v-if="hasNewEvents"
      class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"
    ></div>
    <div 
      v-if="hasNewEvents"
      class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
    ></div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  stickToBottom: boolean
  hasNewEvents?: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>