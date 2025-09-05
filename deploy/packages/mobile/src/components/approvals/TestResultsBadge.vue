<template>
  <div class="flex flex-wrap gap-1">
    <span 
      v-for="(result, testType) in testResults" 
      :key="testType"
      class="inline-flex items-center px-2 py-1 rounded text-xs"
      :class="getTestStatusClass(result)"
    >
      {{ formatTestType(testType) }}: {{ result.passed }}/{{ result.passed + result.failed }}
      <span v-if="result.coverage" class="ml-1 opacity-75">
        ({{ result.coverage }}%)
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import type { TestResults } from '../../types'

// Props - used in template
defineProps({
  testResults: {
    type: Object as PropType<TestResults>,
    required: true
  }
})

// Remove unused computed - using direct Object.entries in template instead

// Helper functions
const getTestStatusClass = (result: { passed: number; failed: number; coverage?: number }) => {
  const totalTests = result.passed + result.failed
  if (totalTests === 0) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  
  const successRate = result.passed / totalTests
  if (successRate === 1) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  } else if (successRate >= 0.8) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
}

const formatTestType = (testType: string): string => {
  return testType.replace(/Tests$/, '').replace(/([A-Z])/g, ' $1').trim()
}
</script>