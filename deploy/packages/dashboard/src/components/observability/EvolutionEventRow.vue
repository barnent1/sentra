<template>
  <div
    :class="[
      'cursor-pointer rounded-lg border transition-all duration-150 hover:shadow-md p-3',
      isSelected 
        ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-light)] text-white border-[var(--theme-primary-dark)] shadow-lg' 
        : 'bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)] hover:border-[var(--theme-primary)] hover:bg-[var(--theme-bg-secondary)]'
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between">
      <!-- Event Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-1">
          <!-- Event Type Icon -->
          <span class="text-lg flex-shrink-0">{{ eventIcon }}</span>
          
          <!-- Event Type & Source -->
          <div class="flex items-center space-x-2 min-w-0">
            <span 
              :class="[
                'text-sm font-semibold',
                isSelected ? 'text-white' : 'text-[var(--theme-text-primary)]'
              ]"
            >
              {{ eventTypeLabel }}
            </span>
            <span 
              :class="[
                'px-2 py-0.5 text-xs font-medium rounded-full border',
                isSelected 
                  ? 'bg-white/20 text-white border-white/30' 
                  : 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] border-[var(--theme-border-secondary)]'
              ]"
            >
              {{ formatSourceApp(event.source_app) }}
            </span>
          </div>
        </div>

        <!-- Summary -->
        <p 
          v-if="event.summary"
          :class="[
            'text-sm mb-2 line-clamp-2',
            isSelected ? 'text-white/90' : 'text-[var(--theme-text-secondary)]'
          ]"
        >
          {{ event.summary }}
        </p>

        <!-- Payload Preview -->
        <div v-if="payloadPreview" class="mb-2">
          <div 
            :class="[
              'text-xs font-mono p-2 rounded border',
              isSelected 
                ? 'bg-white/10 border-white/20 text-white/80' 
                : 'bg-[var(--theme-bg-secondary)] border-[var(--theme-border-secondary)] text-[var(--theme-text-tertiary)]'
            ]"
          >
            {{ payloadPreview }}
          </div>
        </div>

        <!-- Evolution Metrics -->
        <div v-if="evolutionMetrics" class="grid grid-cols-2 gap-2 mb-2">
          <div
            v-for="metric in evolutionMetrics"
            :key="metric.label"
            :class="[
              'text-xs p-2 rounded border',
              isSelected 
                ? 'bg-white/10 border-white/20' 
                : 'bg-[var(--theme-bg-tertiary)] border-[var(--theme-border-secondary)]'
            ]"
          >
            <div :class="isSelected ? 'text-white/70' : 'text-[var(--theme-text-tertiary)]'">
              {{ metric.label }}
            </div>
            <div 
              :class="[
                'font-semibold',
                isSelected ? 'text-white' : 'text-[var(--theme-text-primary)]'
              ]"
            >
              {{ metric.value }}
            </div>
          </div>
        </div>

        <!-- Session & Timestamp -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <span 
              :class="[
                'font-medium',
                isSelected ? 'text-white/70' : 'text-[var(--theme-text-tertiary)]'
              ]"
            >
              Session: {{ formatSessionId(event.session_id) }}
            </span>
            <div 
              :class="[
                'w-2 h-2 rounded-full',
                getSessionColor(event.session_id)
              ]"
              :title="`Session ${event.session_id}`"
            ></div>
          </div>
          
          <time 
            :datetime="formattedTimestamp.iso"
            :class="[
              'font-medium',
              isSelected ? 'text-white/70' : 'text-[var(--theme-text-tertiary)]'
            ]"
            :title="formattedTimestamp.full"
          >
            {{ formattedTimestamp.relative }}
          </time>
        </div>
      </div>
      
      <!-- Status Indicator -->
      <div class="flex flex-col items-end space-y-1 ml-3">
        <div 
          :class="[
            'w-3 h-3 rounded-full',
            getEventStatusColor()
          ]"
          :title="getEventStatusTitle()"
        ></div>
        
        <!-- Chat indicator -->
        <div 
          v-if="event.chat && event.chat.length > 0"
          :class="[
            'px-1.5 py-0.5 text-xs font-medium rounded-full',
            isSelected 
              ? 'bg-white/20 text-white' 
              : 'bg-[var(--theme-primary)] text-white'
          ]"
          :title="`${event.chat.length} chat messages`"
        >
          💬 {{ event.chat.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EvolutionWebSocketEvent } from '../../composables/useEvolutionWebSocket'

const props = defineProps<{
  event: EvolutionWebSocketEvent
  isSelected?: boolean
}>()

defineEmits<{
  click: []
}>()

// Event type icons and labels
const eventTypeConfig: Record<string, { icon: string; label: string }> = {
  'evolution_event': { icon: '🧬', label: 'Evolution Event' },
  'dna_mutation': { icon: '🔬', label: 'DNA Mutation' },
  'agent_spawn': { icon: '🐣', label: 'Agent Spawn' },
  'agent_death': { icon: '💀', label: 'Agent Death' },
  'agent_update': { icon: '🤖', label: 'Agent Update' },
  'learning_outcome': { icon: '🎓', label: 'Learning Outcome' },
  'performance_update': { icon: '📊', label: 'Performance Update' }
}

const eventIcon = computed(() => {
  return eventTypeConfig[props.event.hook_event_type]?.icon || '⚡'
})

const eventTypeLabel = computed(() => {
  return eventTypeConfig[props.event.hook_event_type]?.label || 
         props.event.hook_event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
})

// Payload preview
const payloadPreview = computed(() => {
  if (!props.event.payload || typeof props.event.payload !== 'object') {
    return null
  }
  
  const payload = props.event.payload as Record<string, unknown>
  const preview: string[] = []
  
  // Show key-value pairs, truncated
  Object.entries(payload).forEach(([key, value]) => {
    if (preview.length >= 3) return // Limit to 3 items
    
    let displayValue: string
    if (typeof value === 'string') {
      displayValue = value.length > 30 ? `${value.slice(0, 30)}...` : value
    } else if (typeof value === 'number') {
      displayValue = value.toString()
    } else if (typeof value === 'boolean') {
      displayValue = value.toString()
    } else {
      displayValue = JSON.stringify(value).slice(0, 30) + '...'
    }
    
    preview.push(`${key}: ${displayValue}`)
  })
  
  return preview.length > 0 ? preview.join(', ') : null
})

// Evolution-specific metrics
const evolutionMetrics = computed(() => {
  if (!props.event.payload || typeof props.event.payload !== 'object') {
    return null
  }
  
  const payload = props.event.payload as Record<string, unknown>
  const metrics: Array<{ label: string; value: string }> = []
  
  // Extract evolution-specific metrics
  if (payload.fitness && typeof payload.fitness === 'number') {
    metrics.push({ label: 'Fitness', value: payload.fitness.toFixed(2) })
  }
  
  if (payload.generation && typeof payload.generation === 'number') {
    metrics.push({ label: 'Generation', value: payload.generation.toString() })
  }
  
  if (payload.species && typeof payload.species === 'string') {
    metrics.push({ label: 'Species', value: payload.species })
  }
  
  if (payload.mutation && typeof payload.mutation === 'string') {
    metrics.push({ label: 'Mutation', value: payload.mutation })
  }
  
  if (payload.performance && typeof payload.performance === 'number') {
    metrics.push({ label: 'Performance', value: `${(payload.performance * 100).toFixed(1)}%` })
  }
  
  if (payload.learningRate && typeof payload.learningRate === 'number') {
    metrics.push({ label: 'Learning Rate', value: payload.learningRate.toFixed(4) })
  }
  
  return metrics.length > 0 ? metrics : null
})

// Timestamp formatting
const formattedTimestamp = computed(() => {
  const timestamp = props.event.timestamp || Date.now()
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  let relative: string
  if (diffMs < 60000) { // Less than 1 minute
    relative = 'just now'
  } else if (diffMs < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diffMs / 60000)
    relative = `${minutes}m ago`
  } else if (diffMs < 86400000) { // Less than 1 day
    const hours = Math.floor(diffMs / 3600000)
    relative = `${hours}h ago`
  } else {
    const days = Math.floor(diffMs / 86400000)
    relative = `${days}d ago`
  }
  
  return {
    relative,
    full: date.toLocaleString(),
    iso: date.toISOString()
  }
})

// Helper functions
const formatSourceApp = (app: string): string => {
  return app.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatSessionId = (sessionId: string): string => {
  return sessionId.length > 8 ? `${sessionId.slice(0, 8)}...` : sessionId
}

const getSessionColor = (sessionId: string): string => {
  // Generate consistent color for session ID
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `background-color: hsl(${hue}, 65%, 55%)`
}

const getEventStatusColor = (): string => {
  switch (props.event.hook_event_type) {
    case 'evolution_event':
    case 'dna_mutation':
      return 'bg-blue-500'
    case 'agent_spawn':
      return 'bg-green-500'
    case 'agent_death':
      return 'bg-red-500'
    case 'learning_outcome':
      return 'bg-purple-500'
    case 'performance_update':
      return 'bg-cyan-500'
    default:
      return 'bg-gray-500'
  }
}

const getEventStatusTitle = (): string => {
  switch (props.event.hook_event_type) {
    case 'evolution_event':
      return 'Evolution in progress'
    case 'dna_mutation':
      return 'Genetic mutation occurred'
    case 'agent_spawn':
      return 'New agent created'
    case 'agent_death':
      return 'Agent terminated'
    case 'learning_outcome':
      return 'Learning completed'
    case 'performance_update':
      return 'Performance measured'
    default:
      return 'Event status'
  }
}
</script>

<style>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>