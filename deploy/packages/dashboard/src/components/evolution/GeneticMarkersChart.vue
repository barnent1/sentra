<template>
  <div class="w-full">
    <canvas ref="chartCanvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, type PropType } from 'vue'
import {
  Chart,
  CategoryScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'
import type { GeneticMarkers } from '@sentra/types'

Chart.register(CategoryScale, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Props {
  markers: GeneticMarkers[]
  labels?: string[]
  width?: number
  height?: number
  showComparison?: boolean
  comparisonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  labels: () => ['Agent DNA'],
  width: 400,
  height: 400,
  showComparison: false,
  comparisonLabel: 'Comparison'
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const markerLabels = [
  'Complexity',
  'Adaptability', 
  'Success Rate',
  'Transferability',
  'Stability',
  'Novelty'
]

const generateDatasets = () => {
  const colors = [
    'rgba(59, 130, 246, 0.8)', // Blue
    'rgba(16, 185, 129, 0.8)',  // Green
    'rgba(249, 115, 22, 0.8)',  // Orange
    'rgba(139, 92, 246, 0.8)',  // Purple
    'rgba(236, 72, 153, 0.8)',  // Pink
  ]
  
  return props.markers.map((markers, index) => ({
    label: props.labels[index] || `Pattern ${index + 1}`,
    data: [
      markers.complexity * 100,
      markers.adaptability * 100,
      markers.successRate * 100,
      markers.transferability * 100,
      markers.stability * 100,
      markers.novelty * 100
    ],
    backgroundColor: colors[index % colors.length].replace('0.8', '0.2'),
    borderColor: colors[index % colors.length],
    borderWidth: 2,
    pointBackgroundColor: colors[index % colors.length],
    pointBorderColor: '#fff',
    pointRadius: 5,
    pointHoverRadius: 7,
    fill: true
  }))
}

const createChart = async () => {
  await nextTick()
  
  if (!chartCanvas.value) return

  const config: ChartConfiguration = {
    type: 'radar',
    data: {
      labels: markerLabels,
      datasets: generateDatasets()
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgb(107, 114, 128)',
            font: {
              size: 12
            },
            padding: 20
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
              const value = context.parsed.r.toFixed(1)
              return `${label}: ${value}%`
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(107, 114, 128, 0.2)'
          },
          angleLines: {
            color: 'rgba(107, 114, 128, 0.2)'
          },
          pointLabels: {
            color: 'rgb(107, 114, 128)',
            font: {
              size: 11,
              weight: '500'
            }
          },
          ticks: {
            display: true,
            stepSize: 20,
            color: 'rgba(107, 114, 128, 0.7)',
            font: {
              size: 10
            },
            callback: function(value) {
              return value + '%'
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.1
        }
      },
      interaction: {
        intersect: false,
        mode: 'point'
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

  chart.data.datasets = generateDatasets()
  chart.update('none')
}

// Watch for changes in markers and update chart
watch(() => props.markers, updateChart, { deep: true })
watch(() => props.labels, updateChart, { deep: true })

onMounted(() => {
  createChart()
})
</script>

<style scoped>
canvas {
  max-width: 100%;
  height: auto;
}
</style>