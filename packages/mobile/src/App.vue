<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Main Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">
              Sentra Mobile
            </h1>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view />
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="flex justify-around py-2">
        <router-link 
          v-for="route in navigationRoutes" 
          :key="route.name || 'unknown'"
          :to="{ name: route.name! }"
          class="flex flex-col items-center py-2 px-3 text-sm"
          :class="isActiveRoute(route.name) ? 'text-blue-600' : 'text-gray-600'"
        >
          <span class="text-xs">{{ route.meta?.['title'] }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Get navigation routes
const navigationRoutes = computed(() => 
  router.getRoutes().filter(r => r.meta?.['showInNav'])
)

const isActiveRoute = (routeName: string | symbol | null | undefined) => {
  return route.name === routeName
}
</script>

<style>
/* Global styles */
html {
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  padding-bottom: 80px; /* Space for bottom navigation */
}
</style>