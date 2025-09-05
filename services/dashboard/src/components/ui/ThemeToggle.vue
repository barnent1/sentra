<template>
  <div class="relative">
    <button
      @click="toggleTheme"
      class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-150"
      :title="themeTooltip"
    >
      <SunIcon v-if="!themeStore.isDark" class="w-5 h-5" />
      <MoonIcon v-else class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { useThemeStore, type ThemeMode } from '../../stores/theme'

const themeStore = useThemeStore()

const themeTooltip = computed(() => {
  const currentMode = themeStore.mode
  return `Switch to ${currentMode === 'light' ? 'dark' : currentMode === 'dark' ? 'system' : 'light'} theme`
})

const toggleTheme = () => {
  const currentMode = themeStore.mode
  let nextMode: ThemeMode
  
  switch (currentMode) {
    case 'light':
      nextMode = 'dark'
      break
    case 'dark':
      nextMode = 'system'
      break
    case 'system':
      nextMode = 'light'
      break
    default:
      nextMode = 'light'
  }
  
  themeStore.setTheme(nextMode)
}
</script>