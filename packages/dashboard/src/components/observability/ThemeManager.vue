<template>
  <!-- Theme Manager Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="bg-[var(--theme-bg-primary)] rounded-xl shadow-2xl border border-[var(--theme-border-primary)] max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-[var(--theme-border-secondary)] bg-gradient-to-r from-[var(--theme-bg-secondary)] to-[var(--theme-bg-tertiary)]">
        <div>
          <h2 class="text-xl font-bold text-[var(--theme-text-primary)] flex items-center">
            <span class="mr-2 text-2xl">🎨</span>
            Theme Manager
          </h2>
          <p class="text-sm text-[var(--theme-text-secondary)] mt-1">
            Customize the appearance of your evolution dashboard
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-[var(--theme-bg-quaternary)] rounded-lg transition-colors"
          aria-label="Close theme manager"
        >
          <span class="text-xl text-[var(--theme-text-secondary)]">×</span>
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[calc(90vh-100px)]">
        <div class="p-6 space-y-6">
          <!-- Current Theme -->
          <div>
            <h3 class="text-lg font-semibold text-[var(--theme-text-primary)] mb-3">
              Current Theme
            </h3>
            <div class="flex items-center space-x-3 p-4 bg-[var(--theme-bg-secondary)] rounded-lg border border-[var(--theme-border-primary)]">
              <div class="w-8 h-8 rounded-full bg-[var(--theme-primary)] shadow-sm"></div>
              <div>
                <div class="font-semibold text-[var(--theme-text-primary)]">{{ activeTheme.name }}</div>
                <div class="text-sm text-[var(--theme-text-secondary)]">{{ activeTheme.id }}</div>
              </div>
            </div>
          </div>

          <!-- Theme Selection -->
          <div>
            <h3 class="text-lg font-semibold text-[var(--theme-text-primary)] mb-3">
              Available Themes
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                v-for="theme in availableThemes"
                :key="theme.id"
                @click="selectTheme(theme.id)"
                :class="[
                  'p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md',
                  theme.id === currentTheme
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 shadow-sm'
                    : 'border-[var(--theme-border-primary)] hover:border-[var(--theme-primary)]/50'
                ]"
              >
                <div class="flex items-center space-x-3 mb-3">
                  <div 
                    class="w-6 h-6 rounded-full shadow-sm"
                    :style="{ backgroundColor: theme.colors.primary }"
                  ></div>
                  <div>
                    <div class="font-semibold text-[var(--theme-text-primary)]">{{ theme.name }}</div>
                    <div class="text-xs text-[var(--theme-text-secondary)]">{{ theme.id }}</div>
                  </div>
                  <div 
                    v-if="theme.id === currentTheme"
                    class="ml-auto text-[var(--theme-primary)]"
                  >
                    ✓
                  </div>
                </div>
                
                <!-- Theme Preview -->
                <div class="flex space-x-1">
                  <div 
                    class="flex-1 h-2 rounded"
                    :style="{ backgroundColor: theme.colors.primary }"
                  ></div>
                  <div 
                    class="flex-1 h-2 rounded"
                    :style="{ backgroundColor: theme.colors.primaryLight }"
                  ></div>
                  <div 
                    class="flex-1 h-2 rounded"
                    :style="{ backgroundColor: theme.colors.bgSecondary }"
                  ></div>
                  <div 
                    class="flex-1 h-2 rounded"
                    :style="{ backgroundColor: theme.colors.textPrimary }"
                  ></div>
                </div>
              </button>
            </div>
          </div>

          <!-- Theme Preview -->
          <div>
            <h3 class="text-lg font-semibold text-[var(--theme-text-primary)] mb-3">
              Preview
            </h3>
            <div class="p-4 bg-[var(--theme-bg-secondary)] rounded-lg border border-[var(--theme-border-primary)]">
              <div class="space-y-3">
                <!-- Sample header -->
                <div class="p-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-light)] rounded-lg text-white">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold">Evolution Dashboard</h4>
                    <div class="flex items-center space-x-1">
                      <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span class="text-sm">Connected</span>
                    </div>
                  </div>
                </div>
                
                <!-- Sample content -->
                <div class="p-3 bg-[var(--theme-bg-primary)] rounded-lg border border-[var(--theme-border-primary)]">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-[var(--theme-text-primary)]">Evolution Events</span>
                    <span class="text-sm text-[var(--theme-text-secondary)]">42</span>
                  </div>
                  <div class="w-full h-2 bg-[var(--theme-bg-tertiary)] rounded-full">
                    <div class="w-3/4 h-2 bg-[var(--theme-primary)] rounded-full"></div>
                  </div>
                </div>
                
                <!-- Sample metrics -->
                <div class="grid grid-cols-3 gap-2">
                  <div class="p-2 bg-[var(--theme-bg-tertiary)] rounded border border-[var(--theme-border-secondary)]">
                    <div class="text-xs text-[var(--theme-text-tertiary)]">DNA Variants</div>
                    <div class="font-semibold text-[var(--theme-text-primary)]">12</div>
                  </div>
                  <div class="p-2 bg-[var(--theme-bg-tertiary)] rounded border border-[var(--theme-border-secondary)]">
                    <div class="text-xs text-[var(--theme-text-tertiary)]">Species</div>
                    <div class="font-semibold text-[var(--theme-text-primary)]">5</div>
                  </div>
                  <div class="p-2 bg-[var(--theme-bg-tertiary)] rounded border border-[var(--theme-border-secondary)]">
                    <div class="text-xs text-[var(--theme-text-tertiary)]">Rate</div>
                    <div class="font-semibold text-[var(--theme-text-primary)]">2.3/min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom Theme Creation (Future Enhancement) -->
          <div class="p-4 bg-[var(--theme-bg-secondary)] rounded-lg border border-[var(--theme-border-primary)]">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-lg">✨</span>
              <h4 class="font-semibold text-[var(--theme-text-primary)]">Custom Themes</h4>
            </div>
            <p class="text-sm text-[var(--theme-text-secondary)] mb-3">
              Create and customize your own themes for the evolution dashboard.
            </p>
            <button
              disabled
              class="px-4 py-2 text-sm font-medium text-[var(--theme-text-tertiary)] bg-[var(--theme-bg-tertiary)] border border-[var(--theme-border-secondary)] rounded-lg cursor-not-allowed opacity-75"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)]">
        <div class="text-sm text-[var(--theme-text-secondary)]">
          Changes are saved automatically
        </div>
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-[var(--theme-primary)] text-white font-medium rounded-lg hover:bg-[var(--theme-primary-dark)] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemes } from '../../composables/useThemes'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

const { state, activeTheme, setTheme } = useThemes()

const currentTheme = computed(() => state.value.currentTheme)
const availableThemes = computed(() => state.value.availableThemes)

const selectTheme = (themeId: string) => {
  setTheme(themeId)
}
</script>