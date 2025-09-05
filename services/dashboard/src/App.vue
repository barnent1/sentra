<template>
  <div class="min-h-screen bg-background">
    <NavigationSidebar />
    <main class="lg:ml-64">
      <router-view v-slot="{ Component }">
        <Transition
          name="page"
          mode="out-in"
          enter-active-class="duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-4"
        >
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import NavigationSidebar from './components/navigation/NavigationSidebar.vue'
import { useThemeStore } from './stores/theme'
import { useThemes } from './composables/useThemes'
import { onMounted } from 'vue'

const themeStore = useThemeStore()
const { loadThemes } = useThemes()

onMounted(() => {
  // Initialize theme from localStorage or system preference
  themeStore.initializeTheme()
  // Also initialize our observability theme system
  loadThemes()
})
</script>

<style>
/* Page transition styles */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>