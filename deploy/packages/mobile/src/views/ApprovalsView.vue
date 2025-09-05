<template>
  <div class="approvals-view" data-testid="approvals-view">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-medium text-gray-900">Pending Approvals</h1>
          <p class="text-sm text-gray-500">Swipe right to approve, left to reject</p>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Filter Button -->
          <button
            @click="showFilters = !showFilters"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            data-testid="filter-menu-button"
          >
            <AdjustmentsVerticalIcon class="w-5 h-5" />
          </button>
          <!-- Stats -->
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900">{{ filteredApprovals.length }}</div>
            <div class="text-xs text-gray-500">pending</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Menu -->
    <div 
      v-if="showFilters" 
      class="bg-white border-b border-gray-200 px-4 py-3"
      data-testid="filter-menu"
    >
      <div class="flex items-center space-x-2 flex-wrap">
        <button
          v-for="priority in availablePriorities"
          :key="priority"
          @click="togglePriorityFilter(priority)"
          :class="[
            'px-3 py-1 rounded-full text-xs font-medium',
            selectedPriorities.includes(priority)
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-600'
          ]"
          :data-testid="`filter-${priority}`"
        >
          {{ priority.toUpperCase() }}
        </button>
        <button
          v-if="selectedPriorities.length > 0"
          @click="clearFilters"
          class="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
          data-testid="clear-filters"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="approvalsStore.isLoading" class="p-8">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading approvals...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="approvalsStore.error" class="p-4">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading approvals</h3>
            <div class="mt-2 text-sm text-red-700">
              {{ approvalsStore.error }}
            </div>
            <div class="mt-3">
              <button
                @click="approvalsStore.fetchApprovals"
                class="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredApprovals.length === 0" class="p-8">
      <div class="text-center">
        <CheckCircleIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ selectedPriorities.length > 0 ? 'No approvals match the selected filters' : 'All caught up! No approvals need your attention.' }}
        </p>
        <div v-if="selectedPriorities.length > 0" class="mt-3">
          <button
            @click="clearFilters"
            class="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>

    <!-- Approvals List -->
    <div v-else class="p-4 space-y-4 pb-20">
      <ApprovalCard
        v-for="approval in filteredApprovals"
        :key="approval.id"
        :approval="approval"
        :is-processing="approvalsStore.isDecisionProcessing(approval.id)"
        :is-approving="approvalsStore.isDecisionProcessing(approval.id) && (pendingDecision?.decision === 'approved' || false)"
        :is-rejecting="approvalsStore.isDecisionProcessing(approval.id) && (pendingDecision?.decision === 'rejected' || false)"
        data-testid="approval-card"
        @approve="handleApprove(approval)"
        @reject="handleReject(approval)"
        @view-details="handleViewDetails(approval)"
      />
    </div>

    <!-- Pull to Refresh -->
    <div 
      v-if="isRefreshing"
      class="absolute top-16 left-0 right-0 flex justify-center z-10"
    >
      <div class="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
        <div class="flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Refreshing...
        </div>
      </div>
    </div>

    <!-- Success/Error Notifications -->
    <div
      v-if="notification"
      class="fixed bottom-20 left-4 right-4 z-50"
      data-testid="notification-banner"
    >
      <div
        :class="[
          'p-4 rounded-lg shadow-lg',
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        ]"
      >
        <div class="flex items-center">
          <CheckCircleIcon v-if="notification.type === 'success'" class="h-5 w-5 mr-2" />
          <ExclamationTriangleIcon v-else class="h-5 w-5 mr-2" />
          <span class="flex-1">{{ notification.message }}</span>
          <button
            @click="notification = null"
            class="ml-2 text-white/80 hover:text-white"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Confirmation Modal -->
    <ConfirmationModal
      :show="showRejectModal"
      :action="rejectionAction"
      :requires-reason="true"
      @confirm="confirmRejection"
      @cancel="cancelRejection"
      data-testid="reject-confirmation-modal"
    />

    <!-- Approval Details Modal -->
    <ApprovalDetailsModal
      v-if="selectedApproval"
      :approval="selectedApproval"
      :show="showDetailsModal"
      @close="closeDetailsModal"
      @approve="handleApprove"
      @reject="handleReject"
      data-testid="approval-details-modal"
    />

    <!-- Statistics -->
    <div class="hidden">
      <span data-testid="approved-count">{{ approvedCount }}</span>
      <span data-testid="rejected-count">{{ rejectedCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon, 
  AdjustmentsVerticalIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'
import type { ApprovalRequest, ApprovalPriority, EmergencyControl, ApprovalDecision } from '../types'
import { useApprovalsStore } from '../stores'
import ApprovalCard from '../components/approvals/ApprovalCard.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import ApprovalDetailsModal from '../components/approvals/ApprovalDetailsModal.vue'

// Store
const approvalsStore = useApprovalsStore()

// Local state
const showFilters = ref(false)
const selectedPriorities = ref<ApprovalPriority[]>([])
const isRefreshing = ref(false)
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// Rejection modal state
const showRejectModal = ref(false)
const pendingRejection = ref<ApprovalRequest | null>(null)
const rejectionAction = computed((): EmergencyControl | null => {
  if (!pendingRejection.value) return null
  return {
    action: 'escalate_to_human',
    description: `Reject approval: ${pendingRejection.value.title}`,
    confirmationRequired: true,
    irreversible: false,
    estimatedImpact: 'The approval will be rejected and may require manual review',
    enabled: true
  }
})

// Details modal state  
const showDetailsModal = ref(false)
const selectedApproval = ref<ApprovalRequest | null>(null)

// Computed properties
const availablePriorities: ApprovalPriority[] = ['emergency', 'critical', 'high', 'medium', 'low']

const filteredApprovals = computed(() => {
  let approvals = approvalsStore.pendingApprovals
  
  if (selectedPriorities.value.length > 0) {
    approvals = approvals.filter(approval => 
      selectedPriorities.value.includes(approval.priority)
    )
  }
  
  // Sort by priority and time
  return approvals.sort((a, b) => {
    const priorityOrder = { emergency: 0, critical: 1, high: 2, medium: 3, low: 4 }
    const aPriority = priorityOrder[a.priority] || 5
    const bPriority = priorityOrder[b.priority] || 5
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
  })
})

const pendingDecision = computed((): { decision: ApprovalDecision } | null => {
  // Get the current processing decision for UI state
  return null // Implementation would track current processing decision
})

const approvedCount = computed(() => {
  return 0 // Placeholder - would use actual store data
})

const rejectedCount = computed(() => {
  return 0 // Placeholder - would use actual store data
})

// Methods
const togglePriorityFilter = (priority: ApprovalPriority) => {
  const index = selectedPriorities.value.indexOf(priority)
  if (index > -1) {
    selectedPriorities.value.splice(index, 1)
  } else {
    selectedPriorities.value.push(priority)
  }
}

const clearFilters = () => {
  selectedPriorities.value = []
  showFilters.value = false
}

const handleApprove = async (approval: ApprovalRequest) => {
  try {
    const success = await approvalsStore.makeDecision({
      approvalId: approval.id,
      decision: 'approved',
      decidedBy: 'mobile-user', // In real implementation, get from auth store
      timestamp: new Date()
    })
    
    if (success) {
      showNotification('success', 'Approved successfully')
    } else {
      showNotification('error', 'Failed to approve request')
    }
  } catch (error) {
    showNotification('error', 'Network error - approval queued for retry')
  }
}

const handleReject = (approval: ApprovalRequest) => {
  pendingRejection.value = approval
  showRejectModal.value = true
}

const confirmRejection = async (reason?: string) => {
  if (!pendingRejection.value) return
  
  try {
    const success = await approvalsStore.makeDecision({
      approvalId: pendingRejection.value.id,
      decision: 'rejected',
      decidedBy: 'mobile-user',
      timestamp: new Date(),
      reason: reason || 'Rejected via mobile app'
    })
    
    if (success) {
      showNotification('success', 'Rejected successfully')
    } else {
      showNotification('error', 'Failed to reject request')
    }
  } catch (error) {
    showNotification('error', 'Network error - rejection queued for retry')
  } finally {
    cancelRejection()
  }
}

const cancelRejection = () => {
  showRejectModal.value = false
  pendingRejection.value = null
}

const handleViewDetails = (approval: ApprovalRequest) => {
  selectedApproval.value = approval
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedApproval.value = null
}

const showNotification = (type: 'success' | 'error', message: string) => {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const handlePullToRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await approvalsStore.fetchApprovals()
    showNotification('success', 'Refreshed successfully')
  } catch (error) {
    showNotification('error', 'Failed to refresh')
  } finally {
    isRefreshing.value = false
  }
}

// Touch handling for pull-to-refresh
let startY = 0
let pullDistance = 0

const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0]?.clientY || 0
}

const handleTouchMove = (e: TouchEvent) => {
  if (window.scrollY > 0) return
  
  const currentY = e.touches[0]?.clientY || 0
  pullDistance = Math.max(0, currentY - startY)
  
  if (pullDistance > 100) {
    e.preventDefault()
  }
}

const handleTouchEnd = () => {
  if (pullDistance > 100 && window.scrollY === 0) {
    handlePullToRefresh()
  }
  pullDistance = 0
}

// Lifecycle
onMounted(() => {
  // Initial load
  approvalsStore.fetchApprovals()
  
  // Set up pull-to-refresh
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })  
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>