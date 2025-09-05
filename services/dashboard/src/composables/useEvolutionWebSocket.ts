import { ref, computed } from 'vue'
import type { 
  EvolutionEvent, 
  AgentInstance, 
  PerformanceMetrics,
  LearningOutcome 
} from '@sentra/types'

export interface EvolutionWebSocketEvent {
  readonly id?: number
  readonly source_app: string
  readonly session_id: string
  readonly hook_event_type: 'evolution_event' | 'agent_update' | 'performance_update' | 'learning_outcome' | 'dna_mutation' | 'agent_spawn' | 'agent_death'
  readonly payload: EvolutionEvent | AgentInstance | PerformanceMetrics | LearningOutcome | Record<string, unknown>
  readonly chat?: readonly unknown[]
  readonly summary?: string
  readonly timestamp?: number
}

export interface WebSocketMessage {
  readonly type: 'initial' | 'event'
  readonly data: EvolutionWebSocketEvent | readonly EvolutionWebSocketEvent[]
}

export function useEvolutionWebSocket(url: string) {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const events = ref<EvolutionWebSocketEvent[]>([])
  
  // Reconnection state
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = ref(1000)

  const evolutionEvents = computed(() => 
    events.value.filter(e => e.hook_event_type === 'evolution_event')
  )

  const agentEvents = computed(() => 
    events.value.filter(e => ['agent_spawn', 'agent_death', 'agent_update'].includes(e.hook_event_type))
  )

  const performanceEvents = computed(() => 
    events.value.filter(e => e.hook_event_type === 'performance_update')
  )

  const learningEvents = computed(() => 
    events.value.filter(e => e.hook_event_type === 'learning_outcome')
  )

  const dnaEvents = computed(() => 
    events.value.filter(e => e.hook_event_type === 'dna_mutation')
  )

  const connect = (wsUrl?: string) => {
    const targetUrl = wsUrl || url
    
    if (socket.value?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    if (socket.value?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting')
      return
    }

    cleanup()
    error.value = null

    try {
      console.log('Connecting to WebSocket:', targetUrl)
      socket.value = new WebSocket(targetUrl)

      socket.value.onopen = () => {
        console.log('WebSocket connected successfully')
        isConnected.value = true
        reconnectAttempts.value = 0
        reconnectDelay.value = 1000
        error.value = null
      }

      socket.value.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
          error.value = 'Failed to parse incoming message'
        }
      }

      socket.value.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        isConnected.value = false
        
        if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
          // Attempt reconnection with exponential backoff
          setTimeout(() => {
            reconnectAttempts.value++
            reconnectDelay.value = Math.min(reconnectDelay.value * 2, 30000)
            connect(targetUrl)
          }, reconnectDelay.value)
        }
      }

      socket.value.onerror = (err) => {
        console.error('WebSocket error:', err)
        error.value = 'WebSocket connection failed'
        isConnected.value = false
      }

    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      error.value = 'Failed to create WebSocket connection'
    }
  }

  const handleMessage = (message: WebSocketMessage) => {
    try {
      if (message.type === 'initial') {
        // Handle initial data load
        const data = Array.isArray(message.data) ? message.data : [message.data]
        events.value = [...data].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      } else if (message.type === 'event') {
        // Handle new event
        const event = message.data as EvolutionWebSocketEvent
        
        // Add timestamp if not present
        if (!event.timestamp) {
          (event as any).timestamp = Date.now()
        }
        
        // Add to events (prepend to show newest first)
        events.value.unshift(event)
        
        // Limit total events to prevent memory issues
        if (events.value.length > 1000) {
          events.value = events.value.slice(0, 1000)
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err)
      error.value = 'Error processing incoming data'
    }
  }

  const disconnect = () => {
    cleanup()
    reconnectAttempts.value = maxReconnectAttempts // Prevent reconnection
  }

  const cleanup = () => {
    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
      socket.value = null
    }
    isConnected.value = false
  }

  // Send message to server
  const sendMessage = (message: unknown) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }

  // Clear all events
  const clearEvents = () => {
    events.value = []
  }

  return {
    // Connection state
    isConnected: readonly(isConnected),
    error: readonly(error),
    
    // Event streams
    events: readonly(events),
    evolutionEvents,
    agentEvents,
    performanceEvents,
    learningEvents,
    dnaEvents,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    clearEvents
  }
}

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}