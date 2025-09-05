<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
    <div class="flex items-center">
      <div :class="[
        'flex-shrink-0 p-3 rounded-lg',
        iconBackgroundColor
      ]">
        <component :is="iconComponent" :class="[
          'w-6 h-6',
          iconColor
        ]" />
      </div>
      
      <div class="ml-4 flex-1">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {{ title }}
          </p>
          <div v-if="trend" :class="[
            'flex items-center text-xs font-medium',
            trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          ]">
            <ArrowUpIcon v-if="trend.direction === 'up'" class="w-3 h-3 mr-1" />
            <ArrowDownIcon v-else class="w-3 h-3 mr-1" />
            {{ trend.value }}%
          </div>
        </div>
        
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ value }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  UserGroupIcon,
  BeakerIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  value: string | number
  icon: 'UserGroupIcon' | 'BeakerIcon' | 'ChartBarIcon' | 'AcademicCapIcon'
  color: 'blue' | 'purple' | 'green' | 'amber'
  trend?: {
    direction: 'up' | 'down'
    value: number
  }
}

const props = defineProps<Props>()

const iconComponents = {
  UserGroupIcon,
  BeakerIcon,
  ChartBarIcon,
  AcademicCapIcon
}

const iconComponent = computed(() => iconComponents[props.icon])

const iconBackgroundColor = computed(() => {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/20',
    purple: 'bg-purple-100 dark:bg-purple-900/20',
    green: 'bg-green-100 dark:bg-green-900/20',
    amber: 'bg-amber-100 dark:bg-amber-900/20'
  }
  return colors[props.color]
})

const iconColor = computed(() => {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400'
  }
  return colors[props.color]
})
</script>