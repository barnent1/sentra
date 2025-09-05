<template>
  <!-- Modal Overlay -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="$emit('close')"
  >
    <div class="flex min-h-screen items-end justify-center">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity"></div>
      
      <!-- Modal Content -->
      <div
        class="relative bg-white dark:bg-gray-800 w-full max-h-[90vh] overflow-hidden rounded-t-2xl shadow-xl transform transition-all"
        @click.stop
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white" data-testid="approval-details-title">
              Approval Details
            </h2>
            <div class="flex items-center mt-1">
              <div class="w-3 h-3 rounded-full mr-2" :class="priorityDotColor"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400 uppercase font-medium">
                {{ approval.priority }} PRIORITY
              </span>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            data-testid="close-details-modal"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto max-h-[60vh]">
          <!-- Title and Description -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {{ approval.title }}
            </h3>
            <p class="text-gray-700 dark:text-gray-300" data-testid="approval-description-full">
              {{ approval.description }}
            </p>
          </div>

          <!-- Agent Information -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700" data-testid="agent-information">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Agent Information</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Agent ID:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ agentName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Decision Type:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDecisionType(approval.decisionType) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Requested:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDateTime(approval.requestedAt) }}
                </span>
              </div>
              <div v-if="approval.expiresAt" class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Expires:</span>
                <span class="text-sm font-medium" :class="isExpired ? 'text-red-600' : 'text-gray-900 dark:text-white'">
                  {{ formatDateTime(approval.expiresAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Risk Assessment -->
          <div
            v-if="approval.context?.riskAssessment"
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-700"
            data-testid="risk-assessment"
          >
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Risk Assessment</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">Overall Risk:</span>
                <span class="px-2 py-1 text-xs rounded-full" :class="riskLevelClasses">
                  {{ formatRiskLevel(approval.context.riskAssessment.overallRisk) }}
                </span>
              </div>
              
              <div class="space-y-1">
                <div v-if="approval.context.riskAssessment.securityRisk" class="flex items-center text-xs text-red-600">
                  <ShieldExclamationIcon class="w-3 h-3 mr-1" />
                  Security Risk
                </div>
                <div v-if="approval.context.riskAssessment.dataLossRisk" class="flex items-center text-xs text-orange-600">
                  <ExclamationTriangleIcon class="w-3 h-3 mr-1" />
                  Data Loss Risk
                </div>
                <div v-if="approval.context.riskAssessment.performanceRisk" class="flex items-center text-xs text-yellow-600">
                  <BoltIcon class="w-3 h-3 mr-1" />
                  Performance Impact
                </div>
                <div v-if="approval.context.riskAssessment.availabilityRisk" class="flex items-center text-xs text-blue-600">
                  <SignalSlashIcon class="w-3 h-3 mr-1" />
                  Availability Risk
                </div>
              </div>

              <div v-if="approval.context.riskAssessment.mitigations.length > 0" class="mt-2">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Mitigations:</span>
                <ul class="mt-1 space-y-1">
                  <li v-for="mitigation in approval.context.riskAssessment.mitigations" :key="mitigation" class="text-xs text-gray-500">
                    • {{ mitigation }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Test Results -->
          <div
            v-if="approval.context?.testResults"
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-700"
            data-testid="test-results"
          >
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Test Results</h4>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="(suite, suiteName) in approval.context.testResults" :key="suiteName" class="space-y-1">
                <div class="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {{ suiteName.replace(/([A-Z])/g, ' $1').trim() }}
                </div>
                <div class="flex items-center space-x-2">
                  <div class="flex items-center">
                    <CheckIcon class="w-3 h-3 text-green-600 mr-1" />
                    <span class="text-xs text-green-600">{{ suite.passed }}</span>
                  </div>
                  <div v-if="suite.failed > 0" class="flex items-center">
                    <XMarkIcon class="w-3 h-3 text-red-600 mr-1" />
                    <span class="text-xs text-red-600">{{ suite.failed }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xs text-gray-500">{{ suite.coverage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- System Impact -->
          <div
            v-if="approval.context?.systemImpact"
            class="px-6 py-4 border-b border-gray-100 dark:border-gray-700"
            data-testid="affected-systems"
          >
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">System Impact</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">User Impact:</span>
                <span class="text-sm font-medium" :class="impactClasses">
                  {{ approval.context.systemImpact.userImpact.toUpperCase() }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Downtime:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ approval.context.systemImpact.downtime ? 'Yes' : 'No' }}
                </span>
              </div>
              <div v-if="approval.context.systemImpact.estimatedDuration" class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ approval.context.systemImpact.estimatedDuration }}m
                </span>
              </div>
              <div v-if="approval.context.systemImpact.affectedServices.length > 0">
                <span class="text-sm text-gray-600 dark:text-gray-400">Affected Services:</span>
                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="service in approval.context.systemImpact.affectedServices"
                    :key="service"
                    class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                  >
                    {{ service }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Code Changes -->
          <div
            v-if="approval.context?.codeChanges && approval.context.codeChanges.length > 0"
            class="px-6 py-4"
          >
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Code Changes</h4>
            <div class="space-y-2">
              <div v-for="change in approval.context.codeChanges" :key="change.filePath" class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ change.filePath }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {{ change.changeType.toUpperCase() }}
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-green-600">+{{ change.linesAdded }}</span>
                    <span class="text-xs text-red-600">-{{ change.linesRemoved }}</span>
                    <span class="px-1 py-0.5 text-xs rounded" :class="changeImpactClasses(change.impact)">
                      {{ change.impact }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div class="flex space-x-3">
            <button
              @click="handleApprove"
              :disabled="isProcessing"
              class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              data-testid="modal-approve-button"
            >
              <div v-if="isApproving" class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Approving...
              </div>
              <div v-else class="flex items-center justify-center">
                <CheckIcon class="w-4 h-4 mr-1" />
                Approve
              </div>
            </button>
            
            <button
              @click="handleReject"
              :disabled="isProcessing"
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              data-testid="modal-reject-button"
            >
              <div v-if="isRejecting" class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Rejecting...
              </div>
              <div v-else class="flex items-center justify-center">
                <XMarkIcon class="w-4 h-4 mr-1" />
                Reject
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  BoltIcon,
  SignalSlashIcon
} from '@heroicons/vue/24/solid'
import type { ApprovalRequest } from '../../types'

// Props
const props = defineProps({
  approval: {
    type: Object as PropType<ApprovalRequest>,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  isApproving: {
    type: Boolean,
    default: false
  },
  isRejecting: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  close: []
  approve: [approval: ApprovalRequest]
  reject: [approval: ApprovalRequest]
}>()

// Computed properties
const priorityDotColor = computed(() => {
  const priority = props.approval.priority
  switch (priority) {
    case 'emergency': return 'bg-red-500'
    case 'critical': return 'bg-orange-500'
    case 'high': return 'bg-yellow-500'
    case 'medium': return 'bg-blue-500'
    case 'low': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
})

const agentName = computed(() => {
  // In a real implementation, this would look up the agent name by ID
  return `Agent ${props.approval.agentId.slice(-6)}`
})

const isExpired = computed(() => {
  if (!props.approval.expiresAt) return false
  return new Date() > props.approval.expiresAt
})

const riskLevelClasses = computed(() => {
  if (!props.approval.context?.riskAssessment) return ''
  
  const risk = props.approval.context.riskAssessment.overallRisk
  switch (risk) {
    case 'very_high':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    case 'very_low':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const impactClasses = computed(() => {
  if (!props.approval.context?.systemImpact) return ''
  
  const impact = props.approval.context.systemImpact.userImpact
  switch (impact) {
    case 'critical':
      return 'text-red-600'
    case 'high':
      return 'text-orange-600'
    case 'medium':
      return 'text-yellow-600'
    case 'low':
      return 'text-blue-600'
    case 'none':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
})

// Methods
const formatDecisionType = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatDateTime = (date: Date): string => {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRiskLevel = (risk: string): string => {
  return risk.replace('_', ' ').toUpperCase()
}

const changeImpactClasses = (impact: string): string => {
  switch (impact) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const handleApprove = () => {
  emit('approve', props.approval)
}

const handleReject = () => {
  emit('reject', props.approval)
}
</script>