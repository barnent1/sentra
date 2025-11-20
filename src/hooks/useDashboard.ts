'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/services/api'

// Type definitions matching backend API responses
export interface Project {
  id: string
  name: string
  path: string
  activeAgents: number
  totalIssues: number
  completedIssues: number
  monthlyCost: number
  status: 'active' | 'idle' | 'error'
  progress: number
  currentTask: string
  muted: boolean
  agentCount?: number
  totalCost?: number
  lastActivity?: string
}

export interface Agent {
  id: string
  projectId: string
  status: 'running' | 'completed' | 'failed'
  startTime: string
  endTime?: string | null
  logs?: string
  error?: string | null
  createdAt: string
  updatedAt: string
  // Legacy fields for backward compatibility
  project?: string
  issue?: number
  title?: string
  description?: string
  phase?: string
  elapsedMinutes?: number
  cost?: number
}

export interface Cost {
  id: string
  projectId: string
  amount: number
  description: string
  timestamp: string
}

export interface Activity {
  id: string
  projectId: string
  projectName?: string
  type: string
  message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface DashboardStats {
  totalProjects: number
  activeAgents: number
  totalCosts: number
  todayCost?: number
  monthlyBudget?: number
  successRate?: number
}

interface DashboardResponse {
  summary: {
    totalProjects: number
    activeAgents: number
    totalCosts: number
  }
  recentActivities: Activity[]
  projectStats: Array<{
    id: string
    name: string
    path: string
    totalCost: number
    agentCount: number
    progress: number
    lastActivity: string
  }>
}

interface ProjectsResponse {
  projects: Array<{
    id: string
    name: string
    path: string
    userId: string
    createdAt: string
    updatedAt: string
  }>
}

interface AgentsResponse {
  agents: Agent[]
}

interface CostsResponse {
  costs: Array<{
    id: string
    projectId: string
    amount: number
    description: string
    timestamp: string
  }>
}

interface ActivitiesResponse {
  activities: Activity[]
}

/**
 * Fetch dashboard summary data
 */
async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetchWithAuth('/api/dashboard')
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

/**
 * Fetch all projects (returns raw API data, transformed by hook)
 */
async function fetchProjects(): Promise<Array<{
  id: string
  name: string
  path: string
  userId: string
  createdAt: string
  updatedAt: string
}>> {
  const response = await fetchWithAuth('/api/projects')
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  const data: ProjectsResponse = await response.json()
  return data.projects
}

/**
 * Fetch all agents
 */
async function fetchAgents(): Promise<Agent[]> {
  const response = await fetchWithAuth('/api/agents')
  if (!response.ok) {
    throw new Error('Failed to fetch agents')
  }
  const data: AgentsResponse = await response.json()
  return data.agents
}

/**
 * Fetch all costs
 */
async function fetchCosts(): Promise<Cost[]> {
  const response = await fetchWithAuth('/api/costs')
  if (!response.ok) {
    throw new Error('Failed to fetch costs')
  }
  const data: CostsResponse = await response.json()
  return data.costs
}

/**
 * Fetch all activities
 */
async function fetchActivities(): Promise<Activity[]> {
  const response = await fetchWithAuth('/api/activity')
  if (!response.ok) {
    throw new Error('Failed to fetch activities')
  }
  const data: ActivitiesResponse = await response.json()
  return data.activities
}

/**
 * Dashboard hook with React Query
 * Fetches and caches dashboard data with automatic refresh
 */
export function useDashboard() {
  // Fetch dashboard summary (includes stats and recent activities)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch projects list
  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    refetchInterval: 30000,
  })

  // Fetch agents list
  const {
    data: agentsData,
    isLoading: isAgentsLoading,
    error: agentsError,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    refetchInterval: 30000,
  })

  // Fetch costs list
  const {
    data: costsData,
    isLoading: isCostsLoading,
    error: costsError,
    refetch: refetchCosts,
  } = useQuery({
    queryKey: ['costs'],
    queryFn: fetchCosts,
    refetchInterval: 30000,
  })

  // Fetch activities list
  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    refetchInterval: 30000,
  })

  // Combine loading states
  const loading =
    isDashboardLoading ||
    isProjectsLoading ||
    isAgentsLoading ||
    isCostsLoading ||
    isActivitiesLoading

  // Combine errors
  const error =
    dashboardError?.message ||
    projectsError?.message ||
    agentsError?.message ||
    costsError?.message ||
    activitiesError?.message ||
    null

  // Transform data to match expected interface
  const projects: Project[] = projectsData
    ? projectsData.map((project) => {
        // Find matching project stats from dashboard
        const projectStat = dashboardData?.projectStats.find((p) => p.id === project.id)

        return {
          id: project.id,
          name: project.name,
          path: project.path,
          activeAgents: projectStat?.agentCount || 0,
          totalIssues: 0, // Not available from API yet
          completedIssues: 0, // Not available from API yet
          monthlyCost: projectStat?.totalCost || 0,
          status: (projectStat?.agentCount || 0) > 0 ? ('active' as const) : ('idle' as const),
          progress: projectStat?.progress || 0,
          currentTask: '', // Not available from API yet
          muted: false, // Not available from API yet
        }
      })
    : []

  const agents: Agent[] = agentsData || []
  const costs: Cost[] = costsData || []
  const activities: Activity[] = activitiesData || dashboardData?.recentActivities || []

  const stats: DashboardStats | null = dashboardData
    ? {
        totalProjects: dashboardData.summary.totalProjects,
        activeAgents: dashboardData.summary.activeAgents,
        totalCosts: dashboardData.summary.totalCosts,
        todayCost: 0, // Not available from API yet
        monthlyBudget: 100.0, // Default value, not available from API yet
        successRate: 0, // Not available from API yet
      }
    : null

  // Manual refresh function that refetches all data
  const refetch = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchProjects(),
      refetchAgents(),
      refetchCosts(),
      refetchActivities(),
    ])
  }

  return {
    projects,
    agents,
    costs,
    activities,
    stats,
    loading,
    error,
    refetch,
  }
}
