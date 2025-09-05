<template>
  <div class="bg-gradient-to-r from-[var(--theme-bg-secondary)] to-[var(--theme-bg-tertiary)] border-b border-[var(--theme-border-primary)] px-3 py-4 mobile:py-3 shadow-sm">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mobile:gap-3">
      <!-- Source App Filter -->
      <div class="space-y-2">
        <label for="source-app-filter" class="block text-sm font-semibold text-[var(--theme-text-primary)]">
          Source Application
        </label>
        <select
          id="source-app-filter"
          v-model="filters.sourceApp"
          @change="updateFilters"
          class="w-full px-3 py-2 text-sm border border-[var(--theme-border-primary)] rounded-lg bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-150 hover:border-[var(--theme-primary)]"
        >
          <option value="">All Applications</option>
          <option v-for="app in sourceApps" :key="app" :value="app">
            {{ formatSourceApp(app) }}
          </option>
        </select>
      </div>

      <!-- Session Filter -->
      <div class="space-y-2">
        <label for="session-filter" class="block text-sm font-semibold text-[var(--theme-text-primary)]">
          Evolution Session
        </label>
        <select
          id="session-filter"
          v-model="filters.sessionId"
          @change="updateFilters"
          class="w-full px-3 py-2 text-sm border border-[var(--theme-border-primary)] rounded-lg bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-150 hover:border-[var(--theme-primary)]"
        >
          <option value="">All Sessions</option>
          <option v-for="session in sessionIds" :key="session" :value="session">
            {{ formatSessionId(session) }}
          </option>
        </select>
      </div>

      <!-- Event Type Filter -->
      <div class="space-y-2">
        <label for="event-type-filter" class="block text-sm font-semibold text-[var(--theme-text-primary)]">
          Event Type
        </label>
        <select
          id="event-type-filter"
          v-model="filters.eventType"
          @change="updateFilters"
          class="w-full px-3 py-2 text-sm border border-[var(--theme-border-primary)] rounded-lg bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all duration-150 hover:border-[var(--theme-primary)]"
        >
          <option value="">All Event Types</option>
          <option v-for="eventType in eventTypes" :key="eventType" :value="eventType">
            {{ formatEventType(eventType) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Filter Summary -->
    <div v-if="hasActiveFilters" class="mt-4 pt-3 border-t border-[var(--theme-border-secondary)]">
      <div class="flex flex-wrap gap-2">
        <span class="text-sm font-medium text-[var(--theme-text-secondary)]">Active Filters:</span>
        <div v-if="filters.sourceApp" class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--theme-primary)] text-white text-xs font-medium rounded-full">
          <span>App: {{ formatSourceApp(filters.sourceApp) }}</span>
          <button
            @click="clearFilter('sourceApp')"
            class="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove source app filter"
          >
            <span class="w-3 h-3 inline-block text-center leading-none">×</span>
          </button>
        </div>
        <div v-if="filters.sessionId" class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--theme-primary)] text-white text-xs font-medium rounded-full">
          <span>Session: {{ formatSessionId(filters.sessionId) }}</span>
          <button
            @click="clearFilter('sessionId')"
            class="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove session filter"
          >
            <span class="w-3 h-3 inline-block text-center leading-none">×</span>
          </button>
        </div>
        <div v-if="filters.eventType" class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--theme-primary)] text-white text-xs font-medium rounded-full">
          <span>Type: {{ formatEventType(filters.eventType) }}</span>
          <button
            @click="clearFilter('eventType')"
            class="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove event type filter"
          >
            <span class="w-3 h-3 inline-block text-center leading-none">×</span>
          </button>
        </div>
        <button
          @click="clearAllFilters"
          class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--theme-bg-quaternary)] text-[var(--theme-text-secondary)] text-xs font-medium rounded-full hover:bg-[var(--theme-bg-tertiary)] transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EvolutionWebSocketEvent } from '../../composables/useEvolutionWebSocket'

interface FilterOptions {
  readonly sourceApp: string
  readonly sessionId: string
  readonly eventType: string
}

const props = defineProps<{
  filters: FilterOptions
  events?: readonly EvolutionWebSocketEvent[]
}>()

const emit = defineEmits<{
  'update:filters': [filters: FilterOptions]
}>()

const filters = ref<FilterOptions>({ ...props.filters })

// Extract unique values from events
const sourceApps = computed(() => {
  if (!props.events) return []
  return [...new Set(props.events.map(e => e.source_app))].sort()
})

const sessionIds = computed(() => {
  if (!props.events) return []
  return [...new Set(props.events.map(e => e.session_id))].sort()
})

const eventTypes = computed(() => {
  if (!props.events) return []
  return [...new Set(props.events.map(e => e.hook_event_type))].sort()
})

const hasActiveFilters = computed(() => {
  return filters.value.sourceApp !== '' || 
         filters.value.sessionId !== '' || 
         filters.value.eventType !== ''
})

// Format functions for display
const formatSourceApp = (app: string): string => {
  return app.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatSessionId = (sessionId: string): string => {
  // Truncate long session IDs for display
  return sessionId.length > 12 ? `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}` : sessionId
}

const formatEventType = (eventType: string): string => {
  const eventTypeLabels: Record<string, string> = {
    'evolution_event': '🧬 Evolution Event',
    'dna_mutation': '🔬 DNA Mutation',
    'agent_spawn': '🐣 Agent Spawn',
    'agent_death': '💀 Agent Death',
    'agent_update': '🤖 Agent Update',
    'learning_outcome': '🎓 Learning Outcome',
    'performance_update': '📊 Performance Update'
  }
  
  return eventTypeLabels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const updateFilters = () => {
  emit('update:filters', { ...filters.value })
}

const clearFilter = (filterKey: keyof FilterOptions) => {
  filters.value = {
    ...filters.value,
    [filterKey]: ''
  }
  updateFilters()
}

const clearAllFilters = () => {
  filters.value = {
    sourceApp: '',
    sessionId: '',
    eventType: ''
  }
  updateFilters()
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  filters.value = { ...newFilters }
}, { deep: true })
</script>