<template>
  <div class="relative">
    <canvas ref="chartCanvas" class="w-full h-64"></canvas>
    <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <UserGroupIcon class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p>No activity data available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useThemeStore } from '../../stores/theme'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ActivityDataPoint {
  hour: string
  count: number
}

interface Props {
  data: ActivityDataPoint[]
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

  // Generate all 24 hours for consistency
  const allHours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const hourData = allHours.map(hour => {
    const found = props.data.find(d => d.hour === hour)
    return found ? found.count : 0
  })

  chart.value = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels: allHours,
      datasets: [
        {
          label: 'Agent Activity',
          data: hourData,
          backgroundColor: isDark 
            ? 'rgba(139, 92, 246, 0.6)' 
            : 'rgba(139, 92, 246, 0.6)',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
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
          borderColor: gridColor,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context) => {
              return `Hour: ${context[0]?.label || ''}`
            },
            label: (context) => {
              const count = context.parsed.y
              return `${count} agent${count === 1 ? '' : 's'} active`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Hour of Day',
            color: textColor
          },
          ticks: {
            color: textColor,
            maxTicksLimit: 12,
            callback: function(_value: unknown, index: number) {
              // Show every other hour for better readability
              return index % 2 === 0 ? allHours[index] : ''
            }
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
            text: 'Active Agents',
            color: textColor
          },
          ticks: {
            color: textColor,
            stepSize: 1,
            callback: function(value) {
              return Math.floor(value as number)
            }
          },
          grid: {
            color: gridColor
          },
          border: {
            color: gridColor
          },
          beginAtZero: true
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