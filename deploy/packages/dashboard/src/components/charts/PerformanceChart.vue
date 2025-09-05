<template>
  <div class="relative">
    <canvas ref="chartCanvas" class="w-full h-64"></canvas>
    <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <ChartBarIcon class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p>No performance data available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useThemeStore } from '../../stores/theme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DataPoint {
  x: number
  y: number
  label?: string
}

interface Props {
  data: DataPoint[]
}

const props = defineProps<Props>()
const chartCanvas = ref<HTMLCanvasElement>()
const chart = ref<ChartJS | null>(null)
const themeStore = useThemeStore()

const hasData = computed(() => props.data.length > 0)

const createChart = async () => {
  if (!chartCanvas.value || !hasData.value) return

  await nextTick()

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Destroy existing chart
  if (chart.value) {
    chart.value.destroy()
  }

  const isDark = themeStore.isDark
  const textColor = isDark ? '#e5e7eb' : '#374151'
  const gridColor = isDark ? '#374151' : '#e5e7eb'

  chart.value = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels: props.data.map((_, index) => `T${index + 1}`),
      datasets: [
        {
          label: 'Success Rate',
          data: props.data.map(point => point.y),
          borderColor: '#3b82f6',
          backgroundColor: isDark 
            ? 'rgba(59, 130, 246, 0.1)' 
            : 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context) => {
              const index = context[0]?.dataIndex ?? 0
              return `Time Point ${index + 1}`
            },
            label: (context) => {
              return `Success Rate: ${context.parsed.y.toFixed(1)}%`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time',
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          },
          border: {
            color: gridColor
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Success Rate (%)',
            color: textColor
          },
          ticks: {
            color: textColor,
            callback: function(value: unknown) {
              return value + '%'
            }
          },
          grid: {
            color: gridColor
          },
          border: {
            color: gridColor
          },
          min: 0,
          max: 100
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })

watch(() => themeStore.isDark, () => {
  createChart()
})
</script>