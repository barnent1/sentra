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
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'
import type { AgentInstanceId, PerformanceMetrics } from '@sentra/types'
import type { AgentMetrics } from '../../stores/agents'

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface AgentComparisonData {
  readonly agentId: AgentInstanceId
  readonly name: string
  readonly metrics: AgentMetrics
  readonly currentPerformance: PerformanceMetrics
}

interface Props {
  agents: readonly AgentComparisonData[]
  metric: keyof PerformanceMetrics | keyof Pick<AgentMetrics, 'successRate' | 'averageCompletionTime' | 'tasksCompleted'>
  chartType?: 'bar' | 'horizontal-bar'
  showComparison?: boolean
  comparisonTarget?: number
  maxAgents?: number
}

const props = withDefaults(defineProps<Props>(), {
  metric: 'successRate',
  chartType: 'bar',
  showComparison: false,
  maxAgents: 10
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

// Metric configurations
const metricConfigs = {
  successRate: {
    label: 'Success Rate',
    color: 'rgb(34, 197, 94)',
    scale: (val: number) => val * 100,
    unit: '%',
    target: 85
  },
  averageTaskCompletionTime: {
    label: 'Avg Completion Time',
    color: 'rgb(59, 130, 246)',
    scale: (val: number) => val / 60000, // ms to minutes
    unit: 'min',
    target: 30,
    reverse: true // Lower is better
  },
  codeQualityScore: {
    label: 'Code Quality Score',
    color: 'rgb(168, 85, 247)',
    scale: (val: number) => val,
    unit: '',
    target: 8.5
  },
  userSatisfactionRating: {
    label: 'User Satisfaction',
    color: 'rgb(249, 115, 22)',
    scale: (val: number) => val,
    unit: '',
    target: 4.2
  },
  adaptationSpeed: {
    label: 'Adaptation Speed',
    color: 'rgb(236, 72, 153)',
    scale: (val: number) => val,
    unit: '',
    target: 0.7
  },
  errorRecoveryRate: {
    label: 'Error Recovery Rate',
    color: 'rgb(14, 165, 233)',
    scale: (val: number) => val * 100,
    unit: '%',
    target: 90
  },
  averageCompletionTime: {
    label: 'Avg Completion Time',
    color: 'rgb(59, 130, 246)',
    scale: (val: number) => val / 60000, // ms to minutes  
    unit: 'min',
    target: 25,
    reverse: true
  },
  tasksCompleted: {
    label: 'Tasks Completed',
    color: 'rgb(16, 185, 129)',
    scale: (val: number) => val,
    unit: '',
    target: 50
  }
}

// Process and sort agent data
const processedAgents = computed(() => {
  const config = metricConfigs[props.metric]
  if (!config) return []

  const agentsWithValues = props.agents.map(agent => {
    let value: number
    
    // Get value from appropriate source
    if (props.metric in agent.metrics) {
      value = agent.metrics[props.metric as keyof AgentMetrics] as number
    } else {
      value = agent.currentPerformance[props.metric as keyof PerformanceMetrics] as number
    }

    return {
      ...agent,
      value: config.scale(value),
      rawValue: value
    }
  })

  // Sort agents (reverse for metrics where lower is better)
  const sorted = agentsWithValues.sort((a, b) => {
    return (config as any).reverse ? a.value - b.value : b.value - a.value
  })

  return sorted.slice(0, props.maxAgents)
})

// Generate chart data
const generateChartData = () => {
  const config = metricConfigs[props.metric]
  if (!config) return { labels: [], datasets: [] }

  const labels = processedAgents.value.map(agent => 
    agent.name.length > 12 ? agent.name.slice(0, 12) + '...' : agent.name
  )

  const data = processedAgents.value.map(agent => agent.value)

  // Generate colors based on performance relative to target
  const backgroundColors = data.map(value => {
    const target = props.comparisonTarget ?? config.target
    const isGood = (config as any).reverse ? value <= target : value >= target
    
    if (isGood) return 'rgba(34, 197, 94, 0.8)' // Green
    if (Math.abs(value - target) / target < 0.1) return 'rgba(251, 191, 36, 0.8)' // Yellow
    return 'rgba(239, 68, 68, 0.8)' // Red
  })

  const borderColors = backgroundColors.map(color => 
    color.replace('0.8', '1.0')
  )

  const datasets = [{
    label: config.label,
    data,
    backgroundColor: backgroundColors as string[],
    borderColor: borderColors as string[],
    borderWidth: 2,
    borderRadius: 4,
    borderSkipped: false
  }]

  // Add comparison line if enabled
  if (props.showComparison) {
    const target = props.comparisonTarget ?? config.target
    datasets.push({
      label: 'Target',
      data: new Array(data.length).fill(target) as number[],
      backgroundColor: 'rgba(107, 114, 128, 0.2)' as any,
      borderColor: 'rgb(107, 114, 128)' as any,
      borderWidth: 2,
      type: 'line' as const,
      fill: false,
      pointRadius: 0,
      borderDash: [5, 5]
    })
  }

  return { labels, datasets }
}

const createChart = async () => {
  await nextTick()
  
  if (!chartCanvas.value) return

  const config = metricConfigs[props.metric]
  if (!config) return

  const chartData = generateChartData()

  const chartConfig: ChartConfiguration = {
    type: props.chartType === 'horizontal-bar' ? 'bar' : 'bar',
    data: chartData,
    options: {
      indexAxis: props.chartType === 'horizontal-bar' ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Agent Comparison - ${config.label}`,
          font: {
            size: 16,
            weight: 600
          },
          color: 'rgb(17, 24, 39)'
        },
        legend: {
          display: props.showComparison,
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
            title: (context) => {
              const agent = processedAgents.value[context[0]?.dataIndex ?? 0]
              return agent?.name || ''
            },
            label: (context) => {
              const value = context.parsed.y || context.parsed.x
              return `${config.label}: ${value.toFixed(1)}${config.unit}`
            },
            afterBody: (context) => {
              const agent = processedAgents.value[context[0]?.dataIndex ?? 0]
              if (!agent) return []
              
              return [
                `Tasks Completed: ${agent.metrics.tasksCompleted}`,
                `Generation: ${agent.metrics.evolutionGeneration}`,
                `Last Active: ${getTimeSince(agent.metrics.lastActive)}`
              ]
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
            },
            callback: function(value: unknown) {
              return `${value}${config.unit}`
            }
          }
        }
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10
        }
      }
    }
  }

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(chartCanvas.value, chartConfig)
}

const updateChart = () => {
  if (!chart) return

  const chartData = generateChartData()
  chart.data = chartData
  chart.update('none')
}

const getTimeSince = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

// Watch for prop changes
watch(() => props.agents, updateChart, { deep: true })
watch(() => props.metric, createChart)
watch(() => props.chartType, createChart)
watch(() => props.showComparison, createChart)
watch(() => props.comparisonTarget, updateChart)

onMounted(() => {
  createChart()
})
</script>