import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MobileAgentStatus,
  MobileTaskStatus,
  AgentInstanceId,
  TaskId,
  EmergencyAction,
  EmergencyControl
} from '../types'

export interface AgentControlAction {
  readonly agentId: AgentInstanceId
  readonly action: 'pause' | 'resume' | 'restart' | 'terminate'
  readonly reason?: string
  readonly timestamp: Date
}

export interface SystemMetrics {
  readonly cpuUsage: number
  readonly memoryUsage: number
  readonly activeConnections: number
  readonly errorRate: number
  readonly responseTime: number
  readonly timestamp: Date
}

export const useMobileAgentsStore = defineStore('mobile-agents', () => {
  // Core agent data
  const agentStatuses = ref<MobileAgentStatus[]>([])
  const taskStatuses = ref<MobileTaskStatus[]>([])
  const systemMetrics = ref<SystemMetrics[]>([])
  const emergencyControls = ref<EmergencyControl[]>([])
  
  // Control state
  const controlActions = ref<AgentControlAction[]>([])
  const processingActions = ref<Set<string>>(new Set())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const systemStatus = ref<'normal' | 'warning' | 'critical' | 'emergency'>('normal')

  // Computed values
  const activeAgents = computed(() =>
    agentStatuses.value.filter(agent => agent.status === 'active')
  )

  const inactiveAgents = computed(() =>
    agentStatuses.value.filter(agent => agent.status === 'inactive')
  )

  const errorAgents = computed(() =>
    agentStatuses.value.filter(agent => agent.status === 'error')
  )

  const spawningAgents = computed(() =>
    agentStatuses.value.filter(agent => agent.status === 'spawning')
  )

  const criticalAgents = computed(() =>
    agentStatuses.value.filter(agent => 
      agent.alertCount > 0 || agent.performanceScore < 0.3 || agent.status === 'error'
    )
  )

  const activeTasks = computed(() =>
    taskStatuses.value.filter(task => 
      task.status === 'in_progress' || task.status === 'pending'
    )
  )

  const completedTasks = computed(() =>
    taskStatuses.value.filter(task => task.status === 'completed')
  )

  const failedTasks = computed(() =>
    taskStatuses.value.filter(task => task.status === 'failed')
  )

  const blockedTasks = computed(() =>
    taskStatuses.value.filter(task => task.status === 'blocked')
  )

  const criticalTasks = computed(() =>
    taskStatuses.value.filter(task => task.priority === 'critical')
  )

  const overdueTasks = computed(() => {
    const now = new Date()
    return taskStatuses.value.filter(task => 
      task.estimatedCompletion && 
      task.estimatedCompletion < now && 
      task.status === 'in_progress'
    )
  })

  const agentSummary = computed(() => {
    const total = agentStatuses.value.length
    const active = activeAgents.value.length
    const inactive = inactiveAgents.value.length
    const errors = errorAgents.value.length
    const critical = criticalAgents.value.length

    const avgPerformance = total > 0 
      ? agentStatuses.value.reduce((sum, agent) => sum + agent.performanceScore, 0) / total
      : 0

    const totalAlerts = agentStatuses.value.reduce((sum, agent) => sum + agent.alertCount, 0)

    return {
      total,
      active,
      inactive,
      errors,
      critical,
      avgPerformance,
      totalAlerts,
      healthScore: total > 0 ? (active / total) * 100 : 0
    }
  })

  const taskSummary = computed(() => {
    const total = taskStatuses.value.length
    const active = activeTasks.value.length
    const completed = completedTasks.value.length
    const failed = failedTasks.value.length
    const blocked = blockedTasks.value.length
    const overdue = overdueTasks.value.length

    const completionRate = (completed + failed) > 0 
      ? (completed / (completed + failed)) * 100 
      : 0

    return {
      total,
      active,
      completed,
      failed,
      blocked,
      overdue,
      completionRate
    }
  })

  const currentSystemMetrics = computed(() => {
    if (systemMetrics.value.length === 0) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        activeConnections: 0,
        errorRate: 0,
        responseTime: 0,
        timestamp: new Date()
      }
    }
    return systemMetrics.value[0]
  })

  // Initialize emergency controls
  const initializeEmergencyControls = () => {
    emergencyControls.value = [
      {
        action: 'pause_all_agents',
        description: 'Pause all active agents immediately',
        confirmationRequired: true,
        irreversible: false,
        estimatedImpact: 'All agent operations will be suspended',
        enabled: true
      },
      {
        action: 'emergency_stop',
        description: 'Emergency stop all system operations',
        confirmationRequired: true,
        irreversible: true,
        estimatedImpact: 'Complete system shutdown - requires manual restart',
        enabled: true
      },
      {
        action: 'rollback_deployment',
        description: 'Rollback to last known good deployment',
        confirmationRequired: true,
        irreversible: false,
        estimatedImpact: 'System will revert to previous stable state',
        enabled: systemStatus.value === 'critical' || systemStatus.value === 'emergency'
      },
      {
        action: 'escalate_to_human',
        description: 'Escalate to human operators immediately',
        confirmationRequired: false,
        irreversible: false,
        estimatedImpact: 'Human operators will be notified urgently',
        enabled: true
      },
      {
        action: 'activate_failsafe',
        description: 'Activate system failsafe protocols',
        confirmationRequired: true,
        irreversible: true,
        estimatedImpact: 'System enters safe mode - limited functionality',
        enabled: systemStatus.value === 'emergency'
      },
      {
        action: 'force_agent_restart',
        description: 'Force restart all agents',
        confirmationRequired: true,
        irreversible: false,
        estimatedImpact: 'All agents will be restarted - temporary service interruption',
        enabled: true
      }
    ]
  }

  // Actions
  const updateAgentStatus = (agentStatus: MobileAgentStatus) => {
    const existingIndex = agentStatuses.value.findIndex(a => a.agentId === agentStatus.agentId)
    if (existingIndex >= 0) {
      agentStatuses.value[existingIndex] = agentStatus
    } else {
      agentStatuses.value.push(agentStatus)
    }

    // Sort by status priority and last activity
    agentStatuses.value.sort((a, b) => {
      const statusPriority = { 'error': 4, 'spawning': 3, 'active': 2, 'inactive': 1, 'terminating': 0 }
      const aPriority = statusPriority[a.status] || 0
      const bPriority = statusPriority[b.status] || 0
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return b.lastActivity.getTime() - a.lastActivity.getTime()
    })
  }

  const updateTaskStatus = (taskStatus: MobileTaskStatus) => {
    const existingIndex = taskStatuses.value.findIndex(t => t.taskId === taskStatus.taskId)
    if (existingIndex >= 0) {
      taskStatuses.value[existingIndex] = taskStatus
    } else {
      taskStatuses.value.push(taskStatus)
    }

    // Sort by priority and status
    taskStatuses.value.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
      const aPriority = priorityOrder[a.priority] || 0
      const bPriority = priorityOrder[b.priority] || 0
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      const statusOrder = { 'failed': 4, 'blocked': 3, 'in_progress': 2, 'pending': 1, 'completed': 0 }
      const aStatus = statusOrder[a.status] || 0
      const bStatus = statusOrder[b.status] || 0
      
      return bStatus - aStatus
    })
  }

  const addSystemMetrics = (metrics: SystemMetrics) => {
    systemMetrics.value.unshift(metrics)
    
    // Keep only last 100 metrics
    if (systemMetrics.value.length > 100) {
      systemMetrics.value = systemMetrics.value.slice(0, 100)
    }

    // Update system status based on metrics
    updateSystemStatus(metrics)
  }

  const updateSystemStatus = (metrics: SystemMetrics) => {
    if (metrics.cpuUsage > 90 || metrics.memoryUsage > 90 || metrics.errorRate > 10) {
      systemStatus.value = 'emergency'
    } else if (metrics.cpuUsage > 80 || metrics.memoryUsage > 80 || metrics.errorRate > 5) {
      systemStatus.value = 'critical'
    } else if (metrics.cpuUsage > 70 || metrics.memoryUsage > 70 || metrics.errorRate > 2) {
      systemStatus.value = 'warning'
    } else {
      systemStatus.value = 'normal'
    }

    // Update emergency controls based on system status
    initializeEmergencyControls()
  }

  const executeAgentAction = async (action: AgentControlAction): Promise<boolean> => {
    try {
      const actionKey = `${action.agentId}-${action.action}`
      processingActions.value.add(actionKey)
      error.value = null

      // Add to control actions history
      controlActions.value.unshift(action)

      // In a real implementation, this would call the API
      // For now, simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update local agent status based on action
      const agent = agentStatuses.value.find(a => a.agentId === action.agentId)
      if (agent) {
        let newStatus = agent.status
        
        switch (action.action) {
          case 'pause':
            newStatus = 'inactive'
            break
          case 'resume':
            newStatus = 'active'
            break
          case 'restart':
            newStatus = 'spawning'
            // After a delay, set to active
            setTimeout(() => {
              updateAgentStatus({ ...agent, status: 'active' })
            }, 3000)
            break
          case 'terminate':
            newStatus = 'terminating'
            break
        }
        
        updateAgentStatus({ ...agent, status: newStatus })
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to execute agent action'
      return false
    } finally {
      const actionKey = `${action.agentId}-${action.action}`
      processingActions.value.delete(actionKey)
    }
  }

  const executeEmergencyAction = async (emergencyAction: EmergencyAction, _reason?: string): Promise<boolean> => {
    try {
      processingActions.value.add(emergencyAction)
      error.value = null

      // In a real implementation, this would call the emergency API
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate effects of emergency actions
      switch (emergencyAction) {
        case 'pause_all_agents':
          agentStatuses.value.forEach(agent => {
            if (agent.status === 'active') {
              updateAgentStatus({ ...agent, status: 'inactive' })
            }
          })
          break
        
        case 'emergency_stop':
          agentStatuses.value.forEach(agent => {
            updateAgentStatus({ ...agent, status: 'inactive' })
          })
          systemStatus.value = 'critical'
          break
        
        case 'force_agent_restart':
          agentStatuses.value.forEach(agent => {
            if (agent.status === 'active') {
              updateAgentStatus({ ...agent, status: 'spawning' })
              // After delay, set back to active
              setTimeout(() => {
                updateAgentStatus({ ...agent, status: 'active' })
              }, 5000)
            }
          })
          break
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to execute emergency action'
      return false
    } finally {
      processingActions.value.delete(emergencyAction)
    }
  }

  const isActionProcessing = (agentId: AgentInstanceId, action: string): boolean => {
    return processingActions.value.has(`${agentId}-${action}`)
  }

  const isEmergencyActionProcessing = (action: EmergencyAction): boolean => {
    return processingActions.value.has(action)
  }

  const getAgent = (agentId: AgentInstanceId): MobileAgentStatus | undefined => {
    return agentStatuses.value.find(agent => agent.agentId === agentId)
  }

  const getTask = (taskId: TaskId): MobileTaskStatus | undefined => {
    return taskStatuses.value.find(task => task.taskId === taskId)
  }

  const getAgentTasks = (agentId: AgentInstanceId): MobileTaskStatus[] => {
    return taskStatuses.value.filter(task => task.assignedAgent === agentId)
  }

  const clearData = () => {
    agentStatuses.value = []
    taskStatuses.value = []
    systemMetrics.value = []
    controlActions.value = []
    processingActions.value.clear()
    error.value = null
    systemStatus.value = 'normal'
  }

  // Initialize emergency controls on store creation
  initializeEmergencyControls()

  return {
    // State
    agentStatuses: readonly(agentStatuses),
    taskStatuses: readonly(taskStatuses),
    systemMetrics: readonly(systemMetrics),
    emergencyControls: readonly(emergencyControls),
    controlActions: readonly(controlActions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    systemStatus: readonly(systemStatus),
    
    // Computed
    activeAgents,
    inactiveAgents,
    errorAgents,
    spawningAgents,
    criticalAgents,
    activeTasks,
    completedTasks,
    failedTasks,
    blockedTasks,
    criticalTasks,
    overdueTasks,
    agentSummary,
    taskSummary,
    currentSystemMetrics,
    
    // Actions
    updateAgentStatus,
    updateTaskStatus,
    addSystemMetrics,
    executeAgentAction,
    executeEmergencyAction,
    
    // Getters
    isActionProcessing,
    isEmergencyActionProcessing,
    getAgent,
    getTask,
    getAgentTasks,
    
    // Utilities
    clearData
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}