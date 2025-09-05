<template>
  <div class="w-full h-full">
    <canvas ref="chartCanvas" class="w-full h-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration
} from 'chart.js'
import type { PerformanceMetrics, AgentInstanceId } from '@sentra/types'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface PerformanceDataPoint {
  readonly timestamp: Date
  readonly agentId: AgentInstanceId
  readonly metrics: PerformanceMetrics
}

interface Props {
  data: readonly PerformanceDataPoint[]
  selectedMetrics?: readonly (keyof PerformanceMetrics)[]
  timeRange?: 'hour' | 'day' | 'week' | 'month'
  showAgentBreakdown?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedMetrics: () => ['successRate', 'averageTaskCompletionTime', 'codeQualityScore'],
  timeRange: 'hour',
  showAgentBreakdown: false
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

// Define metric configurations
const metricConfigs = {
  successRate: {
    label: 'Success Rate (%)',
    color: 'rgb(34, 197, 94)',
    scale: (val: number) => val * 100,
    unit: '%'
  },
  averageTaskCompletionTime: {
    label: 'Avg Completion Time (min)',
    color: 'rgb(59, 130, 246)',
    scale: (val: number) => val / 60000, // Convert ms to minutes
    unit: 'min'
  },
  codeQualityScore: {
    label: 'Code Quality Score',
    color: 'rgb(168, 85, 247)',
    scale: (val: number) => val,
    unit: ''
  },
  userSatisfactionRating: {
    label: 'User Satisfaction',
    color: 'rgb(249, 115, 22)',
    scale: (val: number) => val,
    unit: ''
  },
  adaptationSpeed: {
    label: 'Adaptation Speed',
    color: 'rgb(236, 72, 153)',
    scale: (val: number) => val,
    unit: ''
  },
  errorRecoveryRate: {
    label: 'Error Recovery Rate (%)',
    color: 'rgb(14, 165, 233)',
    scale: (val: number) => val * 100,
    unit: '%'
  }
}

// Filter and aggregate data based on time range
const processedData = computed(() => {
  const sortedData = [...props.data].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  const now = new Date()
  let startTime: Date

  switch (props.timeRange) {
    case 'hour':
      startTime = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case 'day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'week':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startTime = new Date(0)
  }

  return sortedData.filter(point => point.timestamp >= startTime)
})

// Generate time labels based on range
const generateTimeLabels = () => {
  if (processedData.value.length === 0) return []
  
  const labels: string[] = []
  const timeFormat = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    ...(props.timeRange === 'week' || props.timeRange === 'month' ? { 
      month: 'short', 
      day: 'numeric' 
    } : {})
  })

  // Group data points by time intervals
  const intervalMs = getIntervalMs()
  const startTime = processedData.value[0]?.timestamp.getTime() || 0
  const endTime = processedData.value[processedData.value.length - 1]?.timestamp.getTime() || 0

  for (let time = startTime; time <= endTime; time += intervalMs) {
    labels.push(timeFormat.format(new Date(time)))
  }

  return labels.slice(0, 50) // Limit to 50 labels for readability
}

const getIntervalMs = (): number => {
  switch (props.timeRange) {
    case 'hour':
      return 5 * 60 * 1000 // 5 minutes
    case 'day':
      return 30 * 60 * 1000 // 30 minutes
    case 'week':
      return 4 * 60 * 60 * 1000 // 4 hours
    case 'month':
      return 24 * 60 * 60 * 1000 // 1 day
    default:
      return 60 * 60 * 1000 // 1 hour
  }
}

// Aggregate data by time intervals
const aggregateData = () => {
  if (processedData.value.length === 0) return []
  
  const intervalMs = getIntervalMs()
  const startTime = processedData.value[0]?.timestamp.getTime() || 0
  const aggregated: Array<{
    timestamp: Date
    metrics: Record<keyof PerformanceMetrics, number>
    count: number
  }> = []

  // Group data points by intervals
  const groups = new Map<number, PerformanceDataPoint[]>()
  
  processedData.value.forEach(point => {
    const intervalIndex = Math.floor((point.timestamp.getTime() - startTime) / intervalMs)
    const intervalStart = startTime + intervalIndex * intervalMs
    
    if (!groups.has(intervalStart)) {
      groups.set(intervalStart, [])
    }
    groups.get(intervalStart)!.push(point)
  })

  // Calculate averages for each interval
  groups.forEach((points, intervalStart) => {
    const avgMetrics = {} as Record<keyof PerformanceMetrics, number>
    
    // Calculate average for each metric
    Object.keys(metricConfigs).forEach(metric => {
      const key = metric as keyof PerformanceMetrics
      const sum = points.reduce((acc, point) => acc + (point.metrics[key] as number), 0)
      avgMetrics[key] = sum / points.length
    })

    aggregated.push({
      timestamp: new Date(intervalStart),
      metrics: avgMetrics,
      count: points.length
    })
  })

  return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Generate chart datasets
const generateDatasets = () => {
  const aggregated = aggregateData()
  
  return props.selectedMetrics.map(metric => {
    const config = metricConfigs[metric]
    if (!config) return null

    return {
      label: config.label,
      data: aggregated.map(point => config.scale(point.metrics[metric] as number)),
      borderColor: config.color,
      backgroundColor: config.color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: config.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }
  }).filter(Boolean)
}

const createChart = async () => {
  await nextTick()
  
  if (!chartCanvas.value) return

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels: generateTimeLabels(),
      datasets: generateDatasets() as any
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Performance Timeline',
          font: {
            size: 16,
            weight: 600
          },
          color: 'rgb(17, 24, 39)'
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            color: 'rgb(107, 114, 128)',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleColor: 'rgb(243, 244, 246)',
          bodyColor: 'rgb(209, 213, 219)',
          borderColor: 'rgb(75, 85, 99)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const metric = props.selectedMetrics[context.datasetIndex]
              const config = metricConfigs[metric]
              const value = context.parsed.y.toFixed(1)
              return `${label}: ${value}${config.unit}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)'
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
            font: {
              size: 11
            }
          }
        }
      },
      elements: {
        point: {
          hoverRadius: 8
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  }

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(chartCanvas.value, config)
}

const updateChart = () => {
  if (!chart) return

  chart.data.labels = generateTimeLabels()
  chart.data.datasets = generateDatasets()
  chart.update('none')
}

// Watch for prop changes
watch(() => props.data, updateChart, { deep: true })
watch(() => props.selectedMetrics, updateChart, { deep: true })
watch(() => props.timeRange, updateChart)

onMounted(() => {
  createChart()
})
</script>