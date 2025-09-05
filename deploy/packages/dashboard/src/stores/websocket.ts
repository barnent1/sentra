import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  EvolutionEvent, 
  AgentInstance, 
  PerformanceMetrics,
  LearningOutcome 
} from '@sentra/types'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  readonly type: 'evolution_event' | 'agent_update' | 'performance_update' | 'learning_outcome'
  readonly data: EvolutionEvent | AgentInstance | PerformanceMetrics | LearningOutcome
  readonly timestamp: Date
}

export const useWebSocketStore = defineStore('websocket', () => {
  const socket = ref<WebSocket | null>(null)
  const status = ref<ConnectionStatus>('disconnected')
  const lastMessage = ref<WebSocketMessage | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  // Real-time data streams
  const evolutionEvents = ref<EvolutionEvent[]>([])
  const agentUpdates = ref<AgentInstance[]>([])
  const performanceUpdates = ref<PerformanceMetrics[]>([])
  const learningOutcomes = ref<LearningOutcome[]>([])

  const isConnected = computed(() => status.value === 'connected')
  const isConnecting = computed(() => status.value === 'connecting')

  // Connect to WebSocket server
  const connect = (url: string = 'ws://localhost:8080/ws') => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    status.value = 'connecting'
    
    try {
      socket.value = new WebSocket(url)

      socket.value.onopen = () => {
        status.value = 'connected'
        reconnectAttempts.value = 0
        console.log('WebSocket connected')
      }

      socket.value.onmessage = (event) => {
        try {
          const rawMessage = JSON.parse(event.data)
          const message: WebSocketMessage = {
            ...rawMessage,
            timestamp: new Date(rawMessage.timestamp)
          }
          
          lastMessage.value = message
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      socket.value.onclose = () => {
        status.value = 'disconnected'
        socket.value = null
        
        // Attempt to reconnect if not at max attempts
        if (reconnectAttempts.value < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.value++
            connect(url)
          }, Math.pow(2, reconnectAttempts.value) * 1000) // Exponential backoff
        }
      }

      socket.value.onerror = (error) => {
        status.value = 'error'
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      status.value = 'error'
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  // Handle incoming messages and sync with other stores
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'evolution_event':
        evolutionEvents.value.unshift(message.data as EvolutionEvent)
        // Keep only last 100 events
        if (evolutionEvents.value.length > 100) {
          evolutionEvents.value = evolutionEvents.value.slice(0, 100)
        }
        break
      
      case 'agent_update':
        const agentUpdate = message.data as AgentInstance
        const existingIndex = agentUpdates.value.findIndex(agent => agent.id === agentUpdate.id)
        if (existingIndex >= 0) {
          agentUpdates.value[existingIndex] = agentUpdate
        } else {
          agentUpdates.value.unshift(agentUpdate)
        }
        break
      
      case 'performance_update':
        performanceUpdates.value.unshift(message.data as PerformanceMetrics)
        // Keep only last 50 performance updates
        if (performanceUpdates.value.length > 50) {
          performanceUpdates.value = performanceUpdates.value.slice(0, 50)
        }
        break
      
      case 'learning_outcome':
        learningOutcomes.value.unshift(message.data as LearningOutcome)
        // Keep only last 50 learning outcomes
        if (learningOutcomes.value.length > 50) {
          learningOutcomes.value = learningOutcomes.value.slice(0, 50)
        }
        break
    }
  }

  // Send message to server
  const sendMessage = (message: any) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
    }
  }

  // Disconnect from WebSocket
  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    status.value = 'disconnected'
  }

  // Clear all data
  const clearData = () => {
    evolutionEvents.value = []
    agentUpdates.value = []
    performanceUpdates.value = []
    learningOutcomes.value = []
    lastMessage.value = null
  }

  return {
    status: readonly(status),
    isConnected,
    isConnecting,
    lastMessage: readonly(lastMessage),
    evolutionEvents: readonly(evolutionEvents),
    agentUpdates: readonly(agentUpdates),
    performanceUpdates: readonly(performanceUpdates),
    learningOutcomes: readonly(learningOutcomes),
    connect,
    disconnect,
    sendMessage,
    clearData
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}