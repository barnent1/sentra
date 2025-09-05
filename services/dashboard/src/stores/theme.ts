import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('system')
  const systemPrefersDark = ref(false)

  // Computed property for the actual theme to apply
  const isDark = computed(() => {
    if (mode.value === 'system') {
      return systemPrefersDark.value
    }
    return mode.value === 'dark'
  })

  // Initialize theme from localStorage and system preference
  const initializeTheme = () => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches

    // Listen for system preference changes
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
      applyTheme()
    })

    // Load saved preference
    const savedTheme = localStorage.getItem('sentra-theme') as ThemeMode
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      mode.value = savedTheme
    }

    applyTheme()
  }

  // Apply the theme to the document
  const applyTheme = () => {
    const html = document.documentElement
    
    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Set theme mode and persist to localStorage
  const setTheme = (newMode: ThemeMode) => {
    mode.value = newMode
    localStorage.setItem('sentra-theme', newMode)
    applyTheme()
  }

  return {
    mode: readonly(mode),
    isDark: readonly(isDark),
    initializeTheme,
    setTheme
  }
})

// Helper function to make refs readonly
function readonly<T>(ref: any): Readonly<T> {
  return ref
}