<template>
  <div class="risk-indicators">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Risk Assessment
      </span>
      <span class="px-2 py-1 text-xs rounded-full" :class="overallRiskClasses">
        {{ formatRiskLevel(riskAssessment.overallRisk) }}
      </span>
    </div>
    
    <div class="space-y-1">
      <div v-if="riskAssessment.securityRisk" class="flex items-center text-xs text-red-600">
        <ShieldExclamationIcon class="w-3 h-3 mr-1" />
        Security Risk
      </div>
      <div v-if="riskAssessment.dataLossRisk" class="flex items-center text-xs text-orange-600">
        <ExclamationTriangleIcon class="w-3 h-3 mr-1" />
        Data Loss Risk
      </div>
      <div v-if="riskAssessment.performanceRisk" class="flex items-center text-xs text-yellow-600">
        <BoltIcon class="w-3 h-3 mr-1" />
        Performance Impact
      </div>
      <div v-if="riskAssessment.availabilityRisk" class="flex items-center text-xs text-blue-600">
        <SignalSlashIcon class="w-3 h-3 mr-1" />
        Availability Risk
      </div>
    </div>

    <div v-if="riskAssessment.mitigations.length > 0" class="mt-2">
      <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Mitigations:</span>
      <ul class="mt-1 space-y-1">
        <li v-for="mitigation in riskAssessment.mitigations.slice(0, 2)" :key="mitigation" class="text-xs text-gray-500">
          • {{ mitigation }}
        </li>
        <li v-if="riskAssessment.mitigations.length > 2" class="text-xs text-gray-400">
          +{{ riskAssessment.mitigations.length - 2 }} more...
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { 
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  SignalSlashIcon
} from '@heroicons/vue/24/solid'
import type { RiskAssessment } from '../../types'

// Props
const props = defineProps({
  riskAssessment: {
    type: Object as PropType<RiskAssessment>,
    required: true
  }
})

// Computed
const overallRiskClasses = computed(() => {
  const risk = props.riskAssessment.overallRisk
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

// Methods
const formatRiskLevel = (risk: string): string => {
  return risk.replace('_', ' ').toUpperCase()
}
</script>