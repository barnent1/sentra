import { ref, computed, watch } from 'vue'

export interface Theme {
  readonly id: string
  readonly name: string
  readonly colors: {
    readonly primary: string
    readonly primaryLight: string
    readonly primaryDark: string
    readonly bgPrimary: string
    readonly bgSecondary: string
    readonly bgTertiary: string
    readonly bgQuaternary: string
    readonly textPrimary: string
    readonly textSecondary: string
    readonly textTertiary: string
    readonly borderPrimary: string
    readonly borderSecondary: string
  }
}

export interface ThemeState {
  readonly currentTheme: string
  readonly isCustomTheme: boolean
  readonly customThemes: readonly Theme[]
  readonly availableThemes: readonly Theme[]
}

const defaultThemes: readonly Theme[] = [
  {
    id: 'blue',
    name: 'Ocean Blue',
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#1E40AF',
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F8FAFC',
      bgTertiary: '#F1F5F9',
      bgQuaternary: '#E2E8F0',
      textPrimary: '#1E293B',
      textSecondary: '#475569',
      textTertiary: '#64748B',
      borderPrimary: '#E2E8F0',
      borderSecondary: '#CBD5E1'
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    colors: {
      primary: '#7C3AED',
      primaryLight: '#A855F7',
      primaryDark: '#5B21B6',
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F8FAFC',
      bgTertiary: '#F1F5F9',
      bgQuaternary: '#E2E8F0',
      textPrimary: '#1E293B',
      textSecondary: '#475569',
      textTertiary: '#64748B',
      borderPrimary: '#E2E8F0',
      borderSecondary: '#CBD5E1'
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#1E40AF',
      bgPrimary: '#0F172A',
      bgSecondary: '#1E293B',
      bgTertiary: '#334155',
      bgQuaternary: '#475569',
      textPrimary: '#F8FAFC',
      textSecondary: '#E2E8F0',
      textTertiary: '#CBD5E1',
      borderPrimary: '#475569',
      borderSecondary: '#64748B'
    }
  },
  {
    id: 'green',
    name: 'Forest Green',
    colors: {
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F8FAFC',
      bgTertiary: '#F1F5F9',
      bgQuaternary: '#E2E8F0',
      textPrimary: '#1E293B',
      textSecondary: '#475569',
      textTertiary: '#64748B',
      borderPrimary: '#E2E8F0',
      borderSecondary: '#CBD5E1'
    }
  }
] as const

const THEME_STORAGE_KEY = 'sentra-dashboard-theme'
const CUSTOM_THEMES_STORAGE_KEY = 'sentra-dashboard-custom-themes'

export function useThemes() {
  const currentTheme = ref<string>('blue')
  const customThemes = ref<Theme[]>([])

  const state = computed((): ThemeState => ({
    currentTheme: currentTheme.value,
    isCustomTheme: !defaultThemes.some(t => t.id === currentTheme.value),
    customThemes: customThemes.value,
    availableThemes: [...defaultThemes, ...customThemes.value]
  }))

  const activeTheme = computed((): Theme => {
    return state.value.availableThemes.find(t => t.id === currentTheme.value) || defaultThemes[0]
  })

  // Apply theme variables to document root
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVar, value)
    })
  }

  // Set theme and persist
  const setTheme = (themeId: string) => {
    const theme = state.value.availableThemes.find(t => t.id === themeId)
    if (theme) {
      currentTheme.value = themeId
      applyTheme(theme)
      localStorage.setItem(THEME_STORAGE_KEY, themeId)
    }
  }

  // Add custom theme
  const addCustomTheme = (theme: Theme) => {
    const exists = customThemes.value.find(t => t.id === theme.id)
    if (!exists) {
      customThemes.value.push(theme)
      saveCustomThemes()
    }
  }

  // Remove custom theme
  const removeCustomTheme = (themeId: string) => {
    customThemes.value = customThemes.value.filter(t => t.id !== themeId)
    saveCustomThemes()
    
    // If current theme was removed, switch to default
    if (currentTheme.value === themeId) {
      setTheme('blue')
    }
  }

  // Save custom themes to localStorage
  const saveCustomThemes = () => {
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes.value))
  }

  // Load themes from localStorage
  const loadThemes = () => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      const savedCustomThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY)
      
      if (savedCustomThemes) {
        customThemes.value = JSON.parse(savedCustomThemes)
      }
      
      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        // Apply default theme
        applyTheme(defaultThemes[0])
      }
    } catch (error) {
      console.error('Failed to load themes from localStorage:', error)
      applyTheme(defaultThemes[0])
    }
  }

  // Watch for theme changes
  watch(activeTheme, (theme) => {
    if (theme) {
      applyTheme(theme)
    }
  })

  // Initialize themes
  loadThemes()

  return {
    state: readonly(state),
    activeTheme: readonly(activeTheme),
    setTheme,
    addCustomTheme,
    removeCustomTheme,
    loadThemes
  }
}

// Helper function to make computed readonly
function readonly<T>(computedRef: any): Readonly<T> {
  return computedRef
}