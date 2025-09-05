<template>
  <div class="space-y-4">
    <div v-if="events.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <BeakerIcon class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <p>No evolution events yet</p>
      <p class="text-sm">Events will appear here as agents evolve</p>
    </div>

    <div v-else class="flow-root">
      <ul role="list" class="-mb-8">
        <li
          v-for="(event, eventIdx) in events"
          :key="event.id"
          class="relative pb-8"
        >
          <!-- Timeline connector line -->
          <div
            v-if="eventIdx !== events.length - 1"
            class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
            aria-hidden="true"
          />

          <div class="relative flex items-start space-x-3">
            <!-- Timeline icon -->
            <div class="relative">
              <div :class="[
                'flex h-10 w-10 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-800',
                getEventColor(event.evolutionTrigger)
              ]">
                <component :is="getEventIcon(event.evolutionTrigger)" class="h-5 w-5 text-white" />
              </div>
            </div>

            <!-- Event content -->
            <div class="min-w-0 flex-1">
              <div class="text-sm">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ formatEventTitle(event.evolutionTrigger) }}
                </div>
                <div class="mt-1 text-gray-500 dark:text-gray-400">
                  Parent DNA: <code class="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{{ event.parentDnaId.slice(0, 8) }}</code>
                  →
                  Child DNA: <code class="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{{ event.childDnaId.slice(0, 8) }}</code>
                </div>
              </div>

              <!-- Evolution details -->
              <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="(change, key) in Object.entries(event.geneticChanges).slice(0, 3)"
                    :key="key"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                  >
                    {{ formatChangeKey(change[0]) }}
                  </span>
                  <span 
                    v-if="Object.keys(event.geneticChanges).length > 3"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    +{{ Object.keys(event.geneticChanges).length - 3 }} more
                  </span>
                </div>
              </div>

              <!-- Performance delta -->
              <div class="mt-2">
                <div class="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                  <div class="flex items-center">
                    <span>Success Rate:</span>
                    <span :class="[
                      'ml-1 font-medium',
                      event.performanceDelta.successRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    ]">
                      {{ event.performanceDelta.successRate >= 0 ? '+' : '' }}{{ (event.performanceDelta.successRate * 100).toFixed(1) }}%
                    </span>
                  </div>
                  <div class="flex items-center">
                    <span>Confidence:</span>
                    <span class="ml-1 font-medium">{{ (event.confidenceScore * 100).toFixed(0) }}%</span>
                  </div>
                </div>
              </div>

              <!-- Timestamp -->
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {{ formatTimestamp(event.createdAt) }}
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EvolutionEvent } from '@sentra/types'
import {
  BeakerIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

interface Props {
  events: readonly EvolutionEvent[]
}

defineProps<Props>()

const getEventIcon = (trigger: string) => {
  switch (trigger) {
    case 'performance_threshold':
      return ChartBarIcon
    case 'manual':
      return UserIcon
    case 'time_based':
      return ClockIcon
    case 'pattern_recognition':
      return EyeIcon
    default:
      return BeakerIcon
  }
}

const getEventColor = (trigger: string) => {
  switch (trigger) {
    case 'performance_threshold':
      return 'bg-green-500'
    case 'manual':
      return 'bg-blue-500'
    case 'time_based':
      return 'bg-purple-500'
    case 'pattern_recognition':
      return 'bg-amber-500'
    default:
      return 'bg-gray-500'
  }
}

const formatEventTitle = (trigger: string) => {
  return trigger.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') + ' Evolution'
}

const formatChangeKey = (key: string) => {
  return key.split(/(?=[A-Z])/).join(' ')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase())
}

const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}
</script>