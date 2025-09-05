<template>
  <div class="relative">
    <div v-if="events.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <BeakerIcon class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <p>No evolution patterns to visualize</p>
      <p class="text-sm">Patterns will appear as agents evolve</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Evolution Flow Diagram -->
      <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-6">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolution Flow</h4>
        
        <!-- Flow visualization -->
        <div class="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
          <div 
            v-for="(node, index) in flowNodes" 
            :key="node.id"
            class="flex items-center"
          >
            <!-- Node -->
            <div class="flex flex-col items-center min-w-0">
              <div 
                :class="[
                  'w-12 h-12 rounded-full border-4 flex items-center justify-center text-white font-bold text-sm transition-all duration-300 hover:scale-110',
                  getNodeColor(node.trigger),
                  'border-white dark:border-gray-800'
                ]"
                :title="node.tooltip"
              >
                {{ node.generation }}
              </div>
              <div class="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 max-w-20">
                <div class="truncate">Gen {{ node.generation }}</div>
                <div class="truncate">{{ formatTrigger(node.trigger) }}</div>
              </div>
            </div>

            <!-- Arrow -->
            <div 
              v-if="index < flowNodes.length - 1"
              class="flex items-center justify-center mx-2"
            >
              <ArrowRightIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <!-- Genetic Changes Heatmap -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Genetic Changes Heatmap</h4>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div 
              v-for="change in topGeneticChanges"
              :key="change.property"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ change.property }}</span>
              <div class="flex items-center space-x-2">
                <div 
                  class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"
                  :style="{ width: '100px' }"
                >
                  <div 
                    class="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                    :style="{ width: `${change.intensity}%` }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 w-8">{{ change.count }}</span>
              </div>
            </div>
          </div>

          <!-- Performance Impact -->
          <div class="space-y-3">
            <h5 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance Impact</h5>
            <div 
              v-for="metric in performanceMetrics"
              :key="metric.name"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ metric.name }}</span>
              <div class="flex items-center space-x-2">
                <div :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  metric.change >= 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                ]">
                  {{ metric.change >= 0 ? '+' : '' }}{{ metric.change.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evolution Timeline Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Evolution Timeline</h4>
        <div class="h-32">
          <canvas ref="timelineChart" class="w-full h-full"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { BeakerIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import type { EvolutionEvent } from '@sentra/types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import { useThemeStore } from '../../stores/theme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface Props {
  events: readonly EvolutionEvent[]
}

const props = defineProps<Props>()
const timelineChart = ref<HTMLCanvasElement>()
const chart = ref<ChartJS | null>(null)
const themeStore = useThemeStore()

// Flow nodes for evolution visualization
const flowNodes = computed(() => {
  const nodes: Array<{
    id: string
    generation: number
    trigger: string
    tooltip: string
  }> = []

  // Group events by generation and get representative node for each
  const generationMap = new Map<number, EvolutionEvent>()
  
  props.events.forEach(event => {
    const generation = getGenerationFromDNA(event.childDnaId)
    if (!generationMap.has(generation) || 
        new Date(event.createdAt) > new Date(generationMap.get(generation)!.createdAt)) {
      generationMap.set(generation, event)
    }
  })

  // Convert to sorted nodes
  Array.from(generationMap.entries())
    .sort(([a], [b]) => a - b)
    .slice(0, 8) // Limit to 8 nodes for display
    .forEach(([generation, event]) => {
      nodes.push({
        id: event.id,
        generation,
        trigger: event.evolutionTrigger,
        tooltip: `Generation ${generation}: ${formatTrigger(event.evolutionTrigger)}`
      })
    })

  return nodes
})

// Top genetic changes analysis
const topGeneticChanges = computed(() => {
  const changeCounts: Record<string, number> = {}
  
  props.events.forEach(event => {
    Object.keys(event.geneticChanges).forEach(key => {
      changeCounts[key] = (changeCounts[key] || 0) + 1
    })
  })

  const maxCount = Math.max(...Object.values(changeCounts))
  
  return Object.entries(changeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([property, count]) => ({
      property: formatPropertyName(property),
      count,
      intensity: (count / maxCount) * 100
    }))
})

// Performance metrics analysis
const performanceMetrics = computed(() => {
  if (props.events.length === 0) return []

  const metrics = [
    { key: 'successRate', name: 'Success Rate' },
    { key: 'averageTaskCompletionTime', name: 'Completion Time' },
    { key: 'adaptationSpeed', name: 'Adaptation Speed' },
    { key: 'errorRecoveryRate', name: 'Error Recovery' }
  ]

  return metrics.map(metric => {
    const values = props.events.map(event => 
      event.performanceDelta[metric.key as keyof typeof event.performanceDelta] as number
    ).filter(value => typeof value === 'number')

    if (values.length === 0) {
      return { name: metric.name, change: 0 }
    }

    const avgChange = values.reduce((sum, val) => sum + val, 0) / values.length
    return {
      name: metric.name,
      change: avgChange * 100 // Convert to percentage
    }
  })
})

const getNodeColor = (trigger: string) => {
  const colors = {
    performance_threshold: 'bg-green-500',
    manual: 'bg-blue-500',
    time_based: 'bg-purple-500',
    pattern_recognition: 'bg-amber-500'
  }
  return colors[trigger as keyof typeof colors] || 'bg-gray-500'
}

const formatTrigger = (trigger: string) => {
  return trigger.split('_')[0].charAt(0).toUpperCase() + trigger.split('_')[0].slice(1)
}

const formatPropertyName = (property: string) => {
  return property.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
}

const getGenerationFromDNA = (dnaId: string) => {
  // Mock generation calculation - in real implementation this would come from DNA data
  return Math.floor(Math.random() * 10) + 1
}

// Create timeline chart
const createTimelineChart = async () => {
  if (!timelineChart.value || props.events.length === 0) return

  await nextTick()
  
  const ctx = timelineChart.value.getContext('2d')
  if (!ctx) return

  if (chart.value) {
    chart.value.destroy()
  }

  const isDark = themeStore.isDark
  const textColor = isDark ? '#e5e7eb' : '#374151'

  // Prepare data - group events by time intervals
  const sortedEvents = [...props.events].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const data = sortedEvents.map((event, index) => ({
    x: index,
    y: event.confidenceScore * 100
  }))

  chart.value = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels: sortedEvents.map((_, index) => `E${index + 1}`),
      datasets: [{
        label: 'Confidence Score',
        data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#8b5cf6',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? '#374151' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: true,
          min: 0,
          max: 100,
          ticks: {
            color: textColor,
            font: {
              size: 10
            }
          },
          grid: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        }
      }
    }
  })
}

onMounted(() => {
  createTimelineChart()
})

watch(() => props.events, () => {
  createTimelineChart()
}, { deep: true })

watch(() => themeStore.isDark, () => {
  createTimelineChart()
})
</script>