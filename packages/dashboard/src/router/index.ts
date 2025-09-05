import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Route components - using dynamic imports for code splitting
const Dashboard = () => import('../views/Dashboard.vue')
const ObservabilityDashboard = () => import('../views/ObservabilityDashboard.vue')
const EvolutionMonitor = () => import('../views/EvolutionMonitor.vue')
const AgentManagement = () => import('../views/AgentManagement.vue')
const Analytics = () => import('../views/Analytics.vue')
const Settings = () => import('../views/Settings.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
      icon: 'HomeIcon'
    }
  },
  {
    path: '/observability',
    name: 'ObservabilityDashboard',
    component: ObservabilityDashboard,
    meta: {
      title: 'Evolution Observability',
      icon: 'EyeIcon'
    }
  },
  {
    path: '/evolution',
    name: 'EvolutionMonitor',
    component: EvolutionMonitor,
    meta: {
      title: 'Evolution Monitor',
      icon: 'BeakerIcon'
    }
  },
  {
    path: '/agents',
    name: 'AgentManagement',
    component: AgentManagement,
    meta: {
      title: 'Agent Management',
      icon: 'UserGroupIcon'
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: {
      title: 'Analytics',
      icon: 'ChartBarIcon'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: 'Settings',
      icon: 'CogIcon'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards for title updates
router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Sentra Evolution Dashboard`
  }
  next()
})

export default router