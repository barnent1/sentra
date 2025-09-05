<template>
  <div class="flex items-center space-x-2">
    <div
      :class="[
        'w-2 h-2 rounded-full',
        statusColor,
        { 'animate-pulse': webSocketStore.isConnecting }
      ]"
    ></div>
    <span class="text-xs font-medium" :class="textColor">
      {{ statusText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWebSocketStore } from '../../stores/websocket'

const webSocketStore = useWebSocketStore()

const statusColor = computed(() => {
  switch (webSocketStore.status) {
    case 'connected':
      return 'bg-green-400'
    case 'connecting':
      return 'bg-yellow-400'
    case 'error':
      return 'bg-red-400'
    case 'disconnected':
    default:
      return 'bg-gray-400'
  }
})

const textColor = computed(() => {
  switch (webSocketStore.status) {
    case 'connected':
      return 'text-green-600 dark:text-green-400'
    case 'connecting':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'disconnected':
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
})

const statusText = computed(() => {
  switch (webSocketStore.status) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting...'
    case 'error':
      return 'Error'
    case 'disconnected':
    default:
      return 'Disconnected'
  }
})
</script>