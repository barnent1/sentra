<template>
  <div class="flex-1 flex flex-col bg-[var(--theme-bg-primary)] border-t border-[var(--theme-border-primary)]">
    <!-- Timeline Header -->
    <div class="flex items-center justify-between px-3 py-3 border-b border-[var(--theme-border-secondary)] bg-gradient-to-r from-[var(--theme-bg-secondary)] to-[var(--theme-bg-tertiary)]">
      <div class="flex items-center space-x-2">
        <h3 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center">
          <span class="mr-2 text-lg">🌊</span>
          Evolution Timeline
        </h3>
        <span class="px-2 py-1 text-xs font-semibold text-white bg-[var(--theme-primary)] rounded-full">
          {{ filteredEvents.length }}
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Auto-scroll toggle -->
        <button
          @click="toggleAutoScroll"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 border',
            autoScroll
              ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary-dark)] shadow-sm'
              : 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] border-[var(--theme-border-primary)] hover:bg-[var(--theme-bg-quaternary)]'
          ]"
          title="Toggle auto-scroll to latest events"
        >
          <span class="mr-1">{{ autoScroll ? '📌' : '📍' }}</span>
          Auto-scroll
        </button>
        
        <!-- Clear events -->
        <button
          @click="$emit('clear-events')"
          class="px-3 py-1.5 text-sm font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-tertiary)] border border-[var(--theme-border-primary)] rounded-lg hover:bg-[var(--theme-bg-quaternary)] hover:text-[var(--theme-text-primary)] transition-all duration-150"
          title="Clear all events"
        >
          🗑️ Clear
        </button>
      </div>
    </div>

    <!-- Timeline Container -->
    <div 
      ref="timelineContainer"
      class="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-[var(--theme-bg-secondary)] scrollbar-thumb-[var(--theme-border-primary)] scrollbar-thumb-rounded"
      @scroll="handleScroll"
    >
      <div class="space-y-1 p-2">
        <div
          v-for="event in filteredEvents"
          :key="`${event.id}-${event.timestamp}`"
          class="group"
        >
          <EvolutionEventRow
            :event="event"
            @click="handleEventClick(event)"
          />
        </div>
        
        <!-- Loading indicator -->
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-4"
        >
          <div class="flex items-center space-x-2 text-[var(--theme-text-tertiary)]">
            <div class="w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm">Loading events...</span>
          </div>
        </div>
        
        <!-- Empty state -->
        <div
          v-if="!isLoading && filteredEvents.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="text-4xl mb-4">🔬</div>
          <h4 class="text-lg font-semibold text-[var(--theme-text-primary)] mb-2">
            No Evolution Events
          </h4>
          <p class="text-[var(--theme-text-tertiary)] max-w-md">
            Start your evolutionary agents to see real-time events, DNA mutations, and learning outcomes here.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { EvolutionWebSocketEvent } from '../../composables/useEvolutionWebSocket'
import EvolutionEventRow from './EvolutionEventRow.vue'

const props = defineProps<{
  events: readonly EvolutionWebSocketEvent[]
  filters: {
    readonly sourceApp: string
    readonly sessionId: string
    readonly eventType: string
  }
  stickToBottom?: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'update:stickToBottom': [value: boolean]
  'event-click': [event: EvolutionWebSocketEvent]
  'clear-events': []
}>()

const timelineContainer = ref<HTMLDivElement>()
const autoScroll = ref(props.stickToBottom ?? true)
const isUserScrolling = ref(false)

// Filter events based on current filters
const filteredEvents = computed(() => {
  let filtered = Array.from(props.events)
  
  if (props.filters.sourceApp) {
    filtered = filtered.filter(event => event.source_app === props.filters.sourceApp)
  }
  
  if (props.filters.sessionId) {
    filtered = filtered.filter(event => event.session_id === props.filters.sessionId)
  }
  
  if (props.filters.eventType) {
    filtered = filtered.filter(event => event.hook_event_type === props.filters.eventType)
  }
  
  // Sort by timestamp (newest first)
  return filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
})

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
  emit('update:stickToBottom', autoScroll.value)
  
  if (autoScroll.value) {
    scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (timelineContainer.value) {
    timelineContainer.value.scrollTop = timelineContainer.value.scrollHeight
  }
}

const scrollToTop = async () => {
  await nextTick()
  if (timelineContainer.value) {
    timelineContainer.value.scrollTop = 0
  }
}

const handleScroll = () => {
  if (!timelineContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = timelineContainer.value
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10 // 10px threshold
  
  // Update auto-scroll based on user position
  if (!isAtBottom && autoScroll.value) {
    autoScroll.value = false
    emit('update:stickToBottom', false)
  } else if (isAtBottom && !autoScroll.value) {
    autoScroll.value = true
    emit('update:stickToBottom', true)
  }
}

const handleEventClick = (event: EvolutionWebSocketEvent) => {
  emit('event-click', event)
}

// Watch for new events and auto-scroll if enabled
watch(() => props.events.length, async () => {
  if (autoScroll.value) {
    await nextTick()
    scrollToBottom()
  }
})

// Watch for filter changes and scroll to top
watch(() => props.filters, async () => {
  await nextTick()
  scrollToTop()
}, { deep: true })

// Watch for external stickToBottom changes
watch(() => props.stickToBottom, (newValue) => {
  if (newValue !== undefined && newValue !== autoScroll.value) {
    autoScroll.value = newValue
    if (newValue) {
      scrollToBottom()
    }
  }
})

onMounted(() => {
  // Initial scroll to bottom if auto-scroll is enabled
  if (autoScroll.value) {
    scrollToBottom()
  }
})

onUnmounted(() => {
  // Clean up any pending scroll operations
})
</script>

<style>
/* Custom scrollbar styles */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: var(--theme-bg-secondary);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--theme-border-primary);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--theme-primary);
}
</style>