import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  AgentInstance, 
  AgentInstanceId,
  AgentConfig,
  EvolutionDna,
  Task,
  TaskId,
  PerformanceMetrics,
  LearningOutcome,
  AgentStatus,
  TaskStatusType
} from '@sentra/types'

export interface AgentTaskExecution {
  readonly taskId: TaskId
  readonly agentId: AgentInstanceId
  readonly startTime: Date
  readonly endTime?: Date
  readonly status: TaskStatusType
  readonly progress: number // 0-100
  readonly metrics?: PerformanceMetrics
}

export interface AgentPoolStats {
  readonly totalAgents: number
  readonly activeAgents: number
  readonly inactiveAgents: number
  readonly spawnedToday: number
  readonly averagePerformance: number
  readonly tasksCompleted: number
  readonly tasksInProgress: number
}

export interface AgentMetrics {
  readonly agentId: AgentInstanceId
  readonly currentTask?: TaskId
  readonly tasksCompleted: number
  readonly averageCompletionTime: number
  readonly successRate: number
  readonly currentPerformance: PerformanceMetrics
  readonly lastActive: Date
  readonly evolutionGeneration: number
}

export const useAgentsStore = defineStore('agents', () => {
  // Core agent data
  const agents = ref<AgentInstance[]>([])
  const agentConfigs = ref<Map<AgentInstanceId, AgentConfig>>(new Map())
  const agentDna = ref<Map<AgentInstanceId, EvolutionDna>>(new Map())
  
  // Task execution tracking
  const taskExecutions = ref<Map<TaskId, AgentTaskExecution>>(new Map())
  const agentTasks = ref<Map<AgentInstanceId, TaskId[]>>(new Map())
  
  // Performance metrics
  const agentMetrics = ref<Map<AgentInstanceId, AgentMetrics>>(new Map())
  const performanceHistory = ref<Map<AgentInstanceId, PerformanceMetrics[]>>(new Map())
  
  // Learning outcomes
  const learningOutcomes = ref<LearningOutcome[]>([])
  
  // Loading states
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed values
  const activeAgents = computed(() => 
    agents.value.filter(agent => agent.status === 'active')
  )
  
  const inactiveAgents = computed(() => 
    agents.value.filter(agent => agent.status === 'inactive')
  )
  
  const poolStats = computed((): AgentPoolStats => {
    const total = agents.value.length
    const active = activeAgents.value.length
    const inactive = inactiveAgents.value.length
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const spawnedToday = agents.value.filter(agent => 
      agent.spawnedAt >= today
    ).length
    
    const completedTasks = Array.from(taskExecutions.value.values())
      .filter(exec => exec.status === 'completed').length
    
    const inProgressTasks = Array.from(taskExecutions.value.values())
      .filter(exec => exec.status === 'in_progress').length
    
    const avgPerformance = agents.value.length > 0 
      ? agents.value.reduce((sum, agent) => {
          const metrics = agentMetrics.value.get(agent.id)
          return sum + (metrics?.successRate || 0)
        }, 0) / agents.value.length
      : 0
    
    return {
      totalAgents: total,
      activeAgents: active,
      inactiveAgents: inactive,
      spawnedToday,
      averagePerformance: avgPerformance,
      tasksCompleted: completedTasks,
      tasksInProgress: inProgressTasks
    }
  })

  const topPerformers = computed(() => 
    Array.from(agentMetrics.value.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
  )

  // Actions
  const fetchAgents = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      // In a real implementation, this would call the API
      // For now, we'll simulate with sample data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // This would be replaced with actual API calls
      console.log('Fetching agents from API...')
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch agents'
    } finally {
      isLoading.value = false
    }
  }

  const addAgent = (agent: AgentInstance): void => {
    const existingIndex = agents.value.findIndex(a => a.id === agent.id)
    if (existingIndex >= 0) {
      agents.value[existingIndex] = agent
    } else {
      agents.value.push(agent)
    }
    
    // Initialize agent tasks array if not exists
    if (!agentTasks.value.has(agent.id)) {
      agentTasks.value.set(agent.id, [])
    }
  }

  const updateAgent = (agentId: AgentInstanceId, updates: Partial<Omit<AgentInstance, 'id'>> & { id: AgentInstanceId }): void => {
    const index = agents.value.findIndex(agent => agent.id === agentId)
    if (index >= 0) {
      agents.value[index] = { ...agents.value[index], ...updates }
    }
  }

  const removeAgent = (agentId: AgentInstanceId): void => {
    agents.value = agents.value.filter(agent => agent.id !== agentId)
    agentConfigs.value.delete(agentId)
    agentDna.value.delete(agentId)
    agentTasks.value.delete(agentId)
    agentMetrics.value.delete(agentId)
    performanceHistory.value.delete(agentId)
  }

  const updateAgentConfig = (agentId: AgentInstanceId, config: AgentConfig): void => {
    agentConfigs.value.set(agentId, config)
  }

  const updateAgentDna = (agentId: AgentInstanceId, dna: EvolutionDna): void => {
    agentDna.value.set(agentId, dna)
  }

  const addTaskExecution = (execution: AgentTaskExecution): void => {
    taskExecutions.value.set(execution.taskId, execution)
    
    // Add task to agent's task list
    const agentTaskList = agentTasks.value.get(execution.agentId) || []
    if (!agentTaskList.includes(execution.taskId)) {
      agentTaskList.push(execution.taskId)
      agentTasks.value.set(execution.agentId, agentTaskList)
    }
  }

  const updateTaskExecution = (taskId: TaskId, updates: Partial<AgentTaskExecution>): void => {
    const execution = taskExecutions.value.get(taskId)
    if (execution) {
      taskExecutions.value.set(taskId, { ...execution, ...updates })
    }
  }

  const updateAgentMetrics = (agentId: AgentInstanceId, metrics: Partial<AgentMetrics>): void => {
    const existing = agentMetrics.value.get(agentId)
    if (existing) {
      agentMetrics.value.set(agentId, { ...existing, ...metrics })
    } else {
      // Create default metrics if none exist
      const defaultMetrics: AgentMetrics = {
        agentId,
        tasksCompleted: 0,
        averageCompletionTime: 0,
        successRate: 0,
        currentPerformance: {
          successRate: 0,
          averageTaskCompletionTime: 0,
          codeQualityScore: 0,
          userSatisfactionRating: 0,
          adaptationSpeed: 0,
          errorRecoveryRate: 0
        },
        lastActive: new Date(),
        evolutionGeneration: 1,
        ...metrics
      }
      agentMetrics.value.set(agentId, defaultMetrics)
    }
  }

  const addPerformanceMetrics = (agentId: AgentInstanceId, metrics: PerformanceMetrics): void => {
    const history = performanceHistory.value.get(agentId) || []
    history.push(metrics)
    
    // Keep only last 100 metrics to prevent memory issues
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
    
    performanceHistory.value.set(agentId, history)
  }

  const addLearningOutcome = (outcome: LearningOutcome): void => {
    learningOutcomes.value.unshift(outcome)
    
    // Keep only last 100 outcomes
    if (learningOutcomes.value.length > 100) {
      learningOutcomes.value = learningOutcomes.value.slice(0, 100)
    }
  }

  const getAgent = (agentId: AgentInstanceId): AgentInstance | undefined => {
    return agents.value.find(agent => agent.id === agentId)
  }

  const getAgentConfig = (agentId: AgentInstanceId): AgentConfig | undefined => {
    return agentConfigs.value.get(agentId)
  }

  const getAgentDna = (agentId: AgentInstanceId): EvolutionDna | undefined => {
    return agentDna.value.get(agentId)
  }

  const getAgentTasks = (agentId: AgentInstanceId): TaskId[] => {
    return agentTasks.value.get(agentId) || []
  }

  const getAgentMetrics = (agentId: AgentInstanceId): AgentMetrics | undefined => {
    return agentMetrics.value.get(agentId)
  }

  const getPerformanceHistory = (agentId: AgentInstanceId): PerformanceMetrics[] => {
    return performanceHistory.value.get(agentId) || []
  }

  const clearData = (): void => {
    agents.value = []
    agentConfigs.value.clear()
    agentDna.value.clear()
    taskExecutions.value.clear()
    agentTasks.value.clear()
    agentMetrics.value.clear()
    performanceHistory.value.clear()
    learningOutcomes.value = []
    error.value = null
  }

  return {
    // State
    agents: readonly(agents),
    isLoading: readonly(isLoading),
    error: readonly(error),
    learningOutcomes: readonly(learningOutcomes),
    
    // Computed
    activeAgents,
    inactiveAgents,
    poolStats,
    topPerformers,
    
    // Actions
    fetchAgents,
    addAgent,
    updateAgent,
    removeAgent,
    updateAgentConfig,
    updateAgentDna,
    addTaskExecution,
    updateTaskExecution,
    updateAgentMetrics,
    addPerformanceMetrics,
    addLearningOutcome,
    
    // Getters
    getAgent,
    getAgentConfig,
    getAgentDna,
    getAgentTasks,
    getAgentMetrics,
    getPerformanceHistory,
    
    // Utilities
    clearData
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}