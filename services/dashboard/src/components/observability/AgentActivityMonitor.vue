<template>
  <div class="agent-activity-monitor">
    <div class="monitor-header">
      <h2 class="monitor-title">
        <i class="icon-activity"></i>
        Agent Activity Monitor
        <span class="live-indicator" :class="{ active: isConnected }">
          {{ isConnected ? 'LIVE' : 'OFFLINE' }}
        </span>
      </h2>
      <div class="monitor-controls">
        <button 
          class="btn btn-primary btn-sm"
          @click="toggleConnection"
          :disabled="connecting"
        >
          {{ connecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect' }}
        </button>
        <button class="btn btn-secondary btn-sm" @click="clearEvents">
          Clear Events
        </button>
      </div>
    </div>

    <div class="monitor-stats">
      <div class="stat-card">
        <div class="stat-value">{{ activeAgents }}</div>
        <div class="stat-label">Active Agents</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalEvents }}</div>
        <div class="stat-label">Total Events</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ eventsPerSecond.toFixed(1) }}</div>
        <div class="stat-label">Events/sec</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ averageResponseTime }}ms</div>
        <div class="stat-label">Avg Response</div>
      </div>
    </div>

    <div class="monitor-content">
      <div class="agents-panel">
        <h3>Agents</h3>
        <div class="agent-list">
          <div 
            v-for="agent in agents" 
            :key="agent.id"
            class="agent-item"
            :class="getAgentStatusClass(agent)"
            @click="selectAgent(agent.id)"
          >
            <div class="agent-avatar">
              <i :class="getAgentIcon(agent.type)"></i>
            </div>
            <div class="agent-info">
              <div class="agent-name">{{ agent.name }}</div>
              <div class="agent-status">{{ agent.status }}</div>
              <div class="agent-activity">
                <span class="pulse-indicator" :class="getPulseClass(agent.healthScore)"></span>
                Health: {{ (agent.healthScore * 100).toFixed(0) }}%
              </div>
            </div>
            <div class="agent-metrics">
              <div class="metric">
                <span class="metric-value">{{ agent.responseTime }}ms</span>
                <span class="metric-label">Response</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ agent.toolsActive }}</span>
                <span class="metric-label">Tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="events-panel">
        <h3>
          Live Event Stream
          <span v-if="selectedAgent" class="selected-agent">
            (Filtered: {{ getAgentName(selectedAgent) }})
          </span>
        </h3>
        
        <div class="event-stream" ref="eventStream">
          <div 
            v-for="event in filteredEvents" 
            :key="event.id"
            class="event-item"
            :class="getEventClass(event)"
          >
            <div class="event-timestamp">
              {{ formatTime(event.timestamp) }}
            </div>
            <div class="event-icon">
              <i :class="getEventIcon(event.type)"></i>
            </div>
            <div class="event-content">
              <div class="event-header">
                <span class="event-type">{{ event.type }}</span>
                <span class="event-agent">{{ getAgentName(event.agentId) }}</span>
                <span class="event-confidence" v-if="event.confidence">
                  {{ (event.confidence * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="event-details">
                <span v-if="event.toolName" class="event-detail">
                  Tool: {{ event.toolName }}
                </span>
                <span v-if="event.duration" class="event-detail">
                  Duration: {{ event.duration }}ms
                </span>
                <span v-if="event.decisionType" class="event-detail">
                  Decision: {{ event.decisionType }}
                </span>
                <span v-if="event.selectedOption" class="event-detail">
                  Selected: {{ event.selectedOption }}
                </span>
              </div>
              <div v-if="event.reasoning" class="event-reasoning">
                {{ event.reasoning }}
              </div>
            </div>
          </div>
          <div v-if="filteredEvents.length === 0" class="no-events">
            <i class="icon-info"></i>
            <p>No events to display. Waiting for agent activity...</p>
          </div>
        </div>
      </div>
    </div>

    <div class="performance-charts">
      <div class="chart-container">
        <h4>Response Time Trend</h4>
        <canvas ref="responseTimeChart" width="400" height="200"></canvas>
      </div>
      <div class="chart-container">
        <h4>Tool Usage Distribution</h4>
        <canvas ref="toolUsageChart" width="400" height="200"></canvas>
      </div>
      <div class="chart-container">
        <h4>Agent Health Scores</h4>
        <canvas ref="healthChart" width="400" height="200"></canvas>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { io, Socket } from 'socket.io-client'

interface AgentData {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'error' | 'offline'
  healthScore: number
  responseTime: number
  toolsActive: number
  lastSeen: Date
}

interface EventData {
  id: string
  type: string
  agentId: string
  timestamp: Date
  toolName?: string
  duration?: number
  success?: boolean
  confidence?: number
  decisionType?: string
  selectedOption?: string
  reasoning?: string
  sessionId?: string
}

export default defineComponent({
  name: 'AgentActivityMonitor',
  setup() {
    // WebSocket connection
    const socket = ref<Socket | null>(null)
    const isConnected = ref(false)
    const connecting = ref(false)

    // Data
    const agents = ref<AgentData[]>([])
    const events = ref<EventData[]>([])
    const selectedAgent = ref<string | null>(null)

    // Statistics
    const totalEvents = ref(0)
    const eventsPerSecond = ref(0)
    const eventRateHistory = ref<number[]>([])

    // Computed properties
    const activeAgents = computed(() => 
      agents.value.filter(agent => agent.status === 'active').length
    )

    const averageResponseTime = computed(() => {
      const activeAgentsList = agents.value.filter(agent => agent.status === 'active')
      if (activeAgentsList.length === 0) return 0
      const total = activeAgentsList.reduce((sum, agent) => sum + agent.responseTime, 0)
      return Math.round(total / activeAgentsList.length)
    })

    const filteredEvents = computed(() => {
      if (!selectedAgent.value) return events.value.slice(0, 100) // Show last 100 events
      return events.value
        .filter(event => event.agentId === selectedAgent.value)
        .slice(0, 100)
    })

    // Chart references
    const responseTimeChart = ref<HTMLCanvasElement | null>(null)
    const toolUsageChart = ref<HTMLCanvasElement | null>(null)
    const healthChart = ref<HTMLCanvasElement | null>(null)

    // Methods
    const connectWebSocket = async () => {
      if (socket.value) return

      connecting.value = true
      
      try {
        socket.value = io('http://localhost:3001', {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        socket.value.on('connect', () => {
          isConnected.value = true
          connecting.value = false
          console.log('Connected to observability WebSocket')

          // Subscribe to observability channels
          socket.value?.emit('subscribe', {
            type: 'subscribe',
            channels: [
              'observability:tool_started',
              'observability:tool_completed',
              'observability:agent_decision',
              'observability:memory_operation',
              'observability:coordination',
              'observability:performance_pulse',
              'observability:learning_pattern',
              'observability:behavior_pattern',
            ],
          })
        })

        socket.value.on('disconnect', () => {
          isConnected.value = false
          console.log('Disconnected from observability WebSocket')
        })

        socket.value.on('connect_error', (error) => {
          connecting.value = false
          console.error('WebSocket connection error:', error)
        })

        // Event handlers
        socket.value.on('observability:tool_started', handleToolStarted)
        socket.value.on('observability:tool_completed', handleToolCompleted)
        socket.value.on('observability:agent_decision', handleAgentDecision)
        socket.value.on('observability:performance_pulse', handlePerformancePulse)
        socket.value.on('observability:learning_pattern', handleLearningPattern)
        socket.value.on('observability:behavior_pattern', handleBehaviorPattern)

      } catch (error) {
        connecting.value = false
        console.error('Failed to connect WebSocket:', error)
      }
    }

    const disconnectWebSocket = () => {
      if (socket.value) {
        socket.value.disconnect()
        socket.value = null
        isConnected.value = false
      }
    }

    const toggleConnection = () => {
      if (isConnected.value) {
        disconnectWebSocket()
      } else {
        connectWebSocket()
      }
    }

    // Event handlers
    const handleToolStarted = (data: any) => {
      addEvent({
        id: `tool_started_${Date.now()}_${Math.random()}`,
        type: 'tool_started',
        agentId: data.agentId,
        timestamp: new Date(data.timestamp),
        toolName: data.toolName,
        sessionId: data.sessionId,
      })
      updateAgentActivity(data.agentId)
    }

    const handleToolCompleted = (data: any) => {
      addEvent({
        id: `tool_completed_${Date.now()}_${Math.random()}`,
        type: 'tool_completed',
        agentId: data.agentId,
        timestamp: new Date(data.timestamp),
        toolName: data.toolName,
        duration: data.duration,
        success: data.success,
        sessionId: data.sessionId,
      })
      updateAgentActivity(data.agentId, data.duration)
    }

    const handleAgentDecision = (data: any) => {
      addEvent({
        id: `decision_${Date.now()}_${Math.random()}`,
        type: 'agent_decision',
        agentId: data.agentId,
        timestamp: new Date(data.timestamp),
        decisionType: data.decisionType,
        selectedOption: data.selectedOption,
        confidence: data.confidence,
        reasoning: data.reasoning,
        sessionId: data.sessionId,
      })
    }

    const handlePerformancePulse = (data: any) => {
      updateAgentPulse(data.agentId, {
        healthScore: data.healthScore,
        responseTime: data.pulse.responseTime,
        status: data.healthScore > 0.7 ? 'active' : data.healthScore > 0.3 ? 'idle' : 'error',
      })
    }

    const handleLearningPattern = (data: any) => {
      addEvent({
        id: `learning_${Date.now()}_${Math.random()}`,
        type: 'learning_pattern',
        agentId: data.agentId,
        timestamp: new Date(data.timestamp),
        confidence: data.pattern.confidence,
        reasoning: data.pattern.description,
      })
    }

    const handleBehaviorPattern = (data: any) => {
      addEvent({
        id: `behavior_${Date.now()}_${Math.random()}`,
        type: 'behavior_pattern',
        agentId: data.agentId,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        reasoning: data.description,
      })
    }

    const addEvent = (event: EventData) => {
      events.value.unshift(event)
      
      // Keep only last 1000 events
      if (events.value.length > 1000) {
        events.value = events.value.slice(0, 1000)
      }
      
      totalEvents.value++
      updateEventRate()
      
      // Auto-scroll to top of event stream
      nextTick(() => {
        const streamEl = document.querySelector('.event-stream')
        if (streamEl) {
          streamEl.scrollTop = 0
        }
      })
    }

    const updateAgentActivity = (agentId: string, responseTime?: number) => {
      const agent = agents.value.find(a => a.id === agentId)
      if (agent) {
        agent.lastSeen = new Date()
        agent.status = 'active'
        if (responseTime) {
          agent.responseTime = responseTime
        }
      } else {
        // Create new agent
        agents.value.push({
          id: agentId,
          name: `Agent-${agentId.substring(0, 8)}`,
          type: 'evolutionary',
          status: 'active',
          healthScore: 0.8,
          responseTime: responseTime || 150,
          toolsActive: 1,
          lastSeen: new Date(),
        })
      }
    }

    const updateAgentPulse = (agentId: string, pulse: Partial<AgentData>) => {
      const agent = agents.value.find(a => a.id === agentId)
      if (agent) {
        Object.assign(agent, pulse)
        agent.lastSeen = new Date()
      }
    }

    const updateEventRate = () => {
      const now = Date.now()
      eventRateHistory.value.push(now)
      
      // Keep only events from last 10 seconds
      eventRateHistory.value = eventRateHistory.value.filter(time => now - time < 10000)
      
      eventsPerSecond.value = eventRateHistory.value.length / 10
    }

    const selectAgent = (agentId: string) => {
      selectedAgent.value = selectedAgent.value === agentId ? null : agentId
    }

    const clearEvents = () => {
      events.value = []
      totalEvents.value = 0
      eventRateHistory.value = []
      eventsPerSecond.value = 0
    }

    // Utility methods
    const getAgentName = (agentId: string) => {
      const agent = agents.value.find(a => a.id === agentId)
      return agent ? agent.name : `Agent-${agentId.substring(0, 8)}`
    }

    const getAgentStatusClass = (agent: AgentData) => {
      return {
        'agent-active': agent.status === 'active',
        'agent-idle': agent.status === 'idle',
        'agent-error': agent.status === 'error',
        'agent-offline': agent.status === 'offline',
        'selected': selectedAgent.value === agent.id,
      }
    }

    const getAgentIcon = (type: string) => {
      switch (type) {
        case 'evolutionary': return 'icon-dna'
        case 'developer': return 'icon-code'
        case 'orchestrator': return 'icon-network'
        default: return 'icon-user'
      }
    }

    const getPulseClass = (healthScore: number) => {
      if (healthScore > 0.8) return 'pulse-healthy'
      if (healthScore > 0.5) return 'pulse-warning'
      return 'pulse-critical'
    }

    const getEventClass = (event: EventData) => {
      return {
        'event-tool': event.type.includes('tool'),
        'event-decision': event.type.includes('decision'),
        'event-pattern': event.type.includes('pattern'),
        'event-pulse': event.type.includes('pulse'),
        'event-success': event.success === true,
        'event-error': event.success === false,
      }
    }

    const getEventIcon = (type: string) => {
      if (type.includes('tool_started')) return 'icon-play'
      if (type.includes('tool_completed')) return 'icon-check'
      if (type.includes('decision')) return 'icon-branch'
      if (type.includes('pattern')) return 'icon-search'
      if (type.includes('pulse')) return 'icon-activity'
      return 'icon-circle'
    }

    const formatTime = (timestamp: Date) => {
      return timestamp.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      })
    }

    // Lifecycle
    onMounted(() => {
      // Add some mock agents for demo
      agents.value = [
        {
          id: 'agent-001',
          name: 'Developer Agent',
          type: 'developer',
          status: 'active',
          healthScore: 0.92,
          responseTime: 145,
          toolsActive: 2,
          lastSeen: new Date(),
        },
        {
          id: 'agent-002',
          name: 'Orchestrator Agent',
          type: 'orchestrator',
          status: 'active',
          healthScore: 0.87,
          responseTime: 203,
          toolsActive: 1,
          lastSeen: new Date(),
        },
      ]

      // Auto-connect
      connectWebSocket()
    })

    onUnmounted(() => {
      disconnectWebSocket()
    })

    return {
      // WebSocket
      isConnected,
      connecting,
      toggleConnection,
      
      // Data
      agents,
      events,
      selectedAgent,
      filteredEvents,
      
      // Statistics
      activeAgents,
      totalEvents,
      eventsPerSecond,
      averageResponseTime,
      
      // Methods
      selectAgent,
      clearEvents,
      getAgentName,
      getAgentStatusClass,
      getAgentIcon,
      getPulseClass,
      getEventClass,
      getEventIcon,
      formatTime,
      
      // Refs
      responseTimeChart,
      toolUsageChart,
      healthChart,
    }
  },
})
</script>

<style scoped>
.agent-activity-monitor {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.monitor-title {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.live-indicator {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #dc3545;
  color: white;
}

.live-indicator.active {
  background: #28a745;
}

.monitor-controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.monitor-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  color: #6c757d;
  font-size: 14px;
}

.monitor-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.agents-panel, .events-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.agents-panel h3, .events-panel h3 {
  margin: 0 0 15px 0;
  padding: 20px 20px 0 20px;
  color: #2c3e50;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 15px;
}

.selected-agent {
  font-size: 14px;
  color: #007bff;
  font-weight: normal;
}

.agent-list {
  padding: 0 10px 10px 10px;
  max-height: 600px;
  overflow-y: auto;
}

.agent-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  margin: 5px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.agent-item:hover {
  background: #f8f9fa;
}

.agent-item.selected {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.agent-item.agent-active {
  border-left: 4px solid #28a745;
}

.agent-item.agent-idle {
  border-left: 4px solid #ffc107;
}

.agent-item.agent-error {
  border-left: 4px solid #dc3545;
}

.agent-item.agent-offline {
  border-left: 4px solid #6c757d;
  opacity: 0.7;
}

.agent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.agent-status {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.agent-activity {
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.pulse-healthy {
  background: #28a745;
}

.pulse-warning {
  background: #ffc107;
}

.pulse-critical {
  background: #dc3545;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.agent-metrics {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-end;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.metric-value {
  font-weight: bold;
  font-size: 12px;
  color: #2c3e50;
}

.metric-label {
  font-size: 10px;
  color: #6c757d;
}

.event-stream {
  height: 600px;
  overflow-y: auto;
  padding: 0 10px 10px 10px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  margin: 5px 0;
  border-radius: 6px;
  border-left: 4px solid #dee2e6;
  background: #fafafa;
  transition: all 0.2s ease;
}

.event-item.event-tool {
  border-left-color: #17a2b8;
}

.event-item.event-decision {
  border-left-color: #6f42c1;
}

.event-item.event-pattern {
  border-left-color: #fd7e14;
}

.event-item.event-success {
  background: #d4edda;
}

.event-item.event-error {
  background: #f8d7da;
}

.event-timestamp {
  font-size: 11px;
  color: #6c757d;
  white-space: nowrap;
  margin-right: 10px;
  font-family: monospace;
  min-width: 90px;
}

.event-icon {
  margin-right: 10px;
  color: #6c757d;
  min-width: 20px;
}

.event-content {
  flex: 1;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.event-type {
  font-weight: bold;
  font-size: 12px;
  color: #2c3e50;
  text-transform: uppercase;
}

.event-agent {
  font-size: 12px;
  color: #007bff;
  background: #e7f3ff;
  padding: 2px 6px;
  border-radius: 3px;
}

.event-confidence {
  font-size: 11px;
  color: #28a745;
  font-weight: bold;
}

.event-details {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.event-detail {
  font-size: 11px;
  color: #6c757d;
}

.event-reasoning {
  font-size: 12px;
  color: #495057;
  font-style: italic;
  margin-top: 5px;
  line-height: 1.4;
}

.no-events {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.no-events i {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.performance-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-container h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

/* Icon classes (would be replaced with actual icon font) */
.icon-activity::before { content: '📊'; }
.icon-dna::before { content: '🧬'; }
.icon-code::before { content: '💻'; }
.icon-network::before { content: '🕸️'; }
.icon-user::before { content: '👤'; }
.icon-play::before { content: '▶️'; }
.icon-check::before { content: '✅'; }
.icon-branch::before { content: '🔀'; }
.icon-search::before { content: '🔍'; }
.icon-circle::before { content: '⭕'; }
.icon-info::before { content: 'ℹ️'; }
</style>