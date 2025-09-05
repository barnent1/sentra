import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  ApprovalRequest,
  ApprovalRequestId,
  ApprovalDecision,
  ApprovalPriority,
  DecisionType
} from '../types'

export interface ApprovalDecisionPayload {
  readonly approvalId: ApprovalRequestId
  readonly decision: ApprovalDecision
  readonly reason?: string
  readonly conditions?: readonly string[]
  readonly decidedBy: string
  readonly timestamp?: Date
}

export interface ApprovalFilter {
  readonly priority?: ApprovalPriority[]
  readonly decisionType?: DecisionType[]
  readonly status?: Array<'pending' | 'approved' | 'rejected' | 'expired'>
  readonly agentId?: string
  readonly dateRange?: {
    readonly from: Date
    readonly to: Date
  }
}

export const useApprovalsStore = defineStore('approvals', () => {
  // Core approval data
  const approvals = ref<ApprovalRequest[]>([])
  const currentFilter = ref<ApprovalFilter>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Decision tracking
  const pendingDecisions = ref<Map<ApprovalRequestId, ApprovalDecisionPayload>>(new Map())
  const processingDecisions = ref<Set<ApprovalRequestId>>(new Set())

  // Computed values
  const pendingApprovals = computed(() => 
    filteredApprovals.value.filter(approval => !approval.decision)
  )

  const approvedRequests = computed(() =>
    filteredApprovals.value.filter(approval => approval.decision === 'approved')
  )

  const rejectedRequests = computed(() =>
    filteredApprovals.value.filter(approval => approval.decision === 'rejected')
  )

  const expiredRequests = computed(() => {
    const now = new Date()
    return filteredApprovals.value.filter(approval => 
      approval.expiresAt && approval.expiresAt < now && !approval.decision
    )
  })

  const criticalApprovals = computed(() =>
    pendingApprovals.value.filter(approval => 
      approval.priority === 'critical' || approval.priority === 'emergency'
    )
  )

  const urgentApprovals = computed(() => {
    const now = new Date()
    const oneHour = 60 * 60 * 1000
    
    return pendingApprovals.value.filter(approval => {
      if (approval.expiresAt) {
        const timeRemaining = approval.expiresAt.getTime() - now.getTime()
        return timeRemaining <= oneHour && timeRemaining > 0
      }
      return false
    })
  })

  const filteredApprovals = computed(() => {
    let filtered = approvals.value

    const filter = currentFilter.value

    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter(approval => 
        filter.priority!.includes(approval.priority)
      )
    }

    if (filter.decisionType && filter.decisionType.length > 0) {
      filtered = filtered.filter(approval =>
        filter.decisionType!.includes(approval.decisionType)
      )
    }

    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(approval => {
        if (filter.status!.includes('pending') && !approval.decision) return true
        if (filter.status!.includes('approved') && approval.decision === 'approved') return true
        if (filter.status!.includes('rejected') && approval.decision === 'rejected') return true
        if (filter.status!.includes('expired') && approval.expiresAt && approval.expiresAt < new Date() && !approval.decision) return true
        return false
      })
    }

    if (filter.agentId) {
      filtered = filtered.filter(approval => approval.agentId === filter.agentId)
    }

    if (filter.dateRange) {
      filtered = filtered.filter(approval => 
        approval.requestedAt >= filter.dateRange!.from && 
        approval.requestedAt <= filter.dateRange!.to
      )
    }

    return filtered
  })

  const approvalStats = computed(() => {
    const total = approvals.value.length
    const pending = pendingApprovals.value.length
    const approved = approvedRequests.value.length
    const rejected = rejectedRequests.value.length
    const expired = expiredRequests.value.length
    const critical = criticalApprovals.value.length

    return {
      total,
      pending,
      approved,
      rejected,
      expired,
      critical,
      approvalRate: total > 0 ? (approved / (approved + rejected)) * 100 : 0
    }
  })

  // Actions
  const addApproval = (approval: ApprovalRequest) => {
    const existingIndex = approvals.value.findIndex(a => a.id === approval.id)
    if (existingIndex >= 0) {
      approvals.value[existingIndex] = approval
    } else {
      approvals.value.unshift(approval)
    }

    // Sort by priority and request time
    approvals.value.sort((a, b) => {
      const priorityOrder = { 'emergency': 5, 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
      const aPriority = priorityOrder[a.priority] || 0
      const bPriority = priorityOrder[b.priority] || 0
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return b.requestedAt.getTime() - a.requestedAt.getTime()
    })
  }

  const updateApproval = (approvalId: ApprovalRequestId, updates: Partial<ApprovalRequest>) => {
    const index = approvals.value.findIndex(approval => approval.id === approvalId)
    if (index >= 0) {
      const currentApproval = approvals.value[index]
      if (currentApproval) {
        approvals.value[index] = { 
          ...currentApproval, 
          ...updates,
          id: approvalId, // Ensure ID doesn't change
          agentId: currentApproval.agentId, // Ensure required fields are preserved
          decisionType: currentApproval.decisionType
        } as ApprovalRequest
      }
    }
  }

  const makeDecision = async (decisionPayload: ApprovalDecisionPayload): Promise<boolean> => {
    try {
      processingDecisions.value.add(decisionPayload.approvalId)
      error.value = null

      // Store pending decision
      pendingDecisions.value.set(decisionPayload.approvalId, decisionPayload)

      // Update local state immediately for responsive UI
      const approval = approvals.value.find(a => a.id === decisionPayload.approvalId)
      if (approval) {
        const updatedApproval: ApprovalRequest = {
          ...approval,
          decision: decisionPayload.decision,
          decidedAt: new Date(),
          decidedBy: decisionPayload.decidedBy,
          ...(decisionPayload.decision === 'rejected' && decisionPayload.reason && {
            rejectionReason: decisionPayload.reason
          })
        }
        updateApproval(decisionPayload.approvalId, updatedApproval)
      }

      // In a real implementation, this would call the API
      // For now, simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Remove from pending decisions on success
      pendingDecisions.value.delete(decisionPayload.approvalId)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to make approval decision'
      
      // Revert local state on error
      const approval = approvals.value.find(a => a.id === decisionPayload.approvalId)
      if (approval) {
        const revertedApproval = {
          ...approval
        } as ApprovalRequest
        updateApproval(decisionPayload.approvalId, revertedApproval)
      }
      
      pendingDecisions.value.delete(decisionPayload.approvalId)
      return false
    } finally {
      processingDecisions.value.delete(decisionPayload.approvalId)
    }
  }

  const batchApprove = async (approvalIds: ApprovalRequestId[], decidedBy: string): Promise<number> => {
    let successCount = 0
    
    for (const approvalId of approvalIds) {
      const success = await makeDecision({
        approvalId,
        decision: 'approved',
        decidedBy
      })
      
      if (success) {
        successCount++
      }
    }
    
    return successCount
  }

  const batchReject = async (approvalIds: ApprovalRequestId[], reason: string, decidedBy: string): Promise<number> => {
    let successCount = 0
    
    for (const approvalId of approvalIds) {
      const success = await makeDecision({
        approvalId,
        decision: 'rejected',
        reason,
        decidedBy
      })
      
      if (success) {
        successCount++
      }
    }
    
    return successCount
  }

  const setFilter = (filter: ApprovalFilter) => {
    currentFilter.value = filter
  }

  const clearFilter = () => {
    currentFilter.value = {}
  }

  const getApproval = (approvalId: ApprovalRequestId): ApprovalRequest | undefined => {
    return approvals.value.find(approval => approval.id === approvalId)
  }

  const isDecisionPending = (approvalId: ApprovalRequestId): boolean => {
    return pendingDecisions.value.has(approvalId)
  }

  const isDecisionProcessing = (approvalId: ApprovalRequestId): boolean => {
    return processingDecisions.value.has(approvalId)
  }

  const getTimeRemaining = (approval: ApprovalRequest): number | null => {
    if (!approval.expiresAt) return null
    
    const now = new Date()
    const remaining = approval.expiresAt.getTime() - now.getTime()
    return Math.max(0, remaining)
  }

  const formatTimeRemaining = (approval: ApprovalRequest): string => {
    const remaining = getTimeRemaining(approval)
    if (remaining === null) return 'No expiration'
    if (remaining === 0) return 'Expired'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const fetchApprovals = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      // In a real implementation, this would call the API
      // For now, simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // This would be replaced with actual API call results
      console.log('Fetching approvals...')
      
      isLoading.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch approvals'
      isLoading.value = false
    }
  }

  const clearData = () => {
    approvals.value = []
    pendingDecisions.value.clear()
    processingDecisions.value.clear()
    currentFilter.value = {}
    error.value = null
  }

  return {
    // State
    approvals: readonly(approvals),
    currentFilter: readonly(currentFilter),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    pendingApprovals,
    approvedRequests,
    rejectedRequests,
    expiredRequests,
    criticalApprovals,
    urgentApprovals,
    filteredApprovals,
    approvalStats,
    
    // Actions
    addApproval,
    updateApproval,
    makeDecision,
    batchApprove,
    batchReject,
    setFilter,
    clearFilter,
    fetchApprovals,
    
    // Getters
    getApproval,
    isDecisionPending,
    isDecisionProcessing,
    getTimeRemaining,
    formatTimeRemaining,
    
    // Utilities
    clearData
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}