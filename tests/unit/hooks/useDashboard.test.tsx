import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboard } from '@/hooks/useDashboard'
import * as api from '@/services/api'

// Mock the API service
vi.mock('@/services/api', () => ({
  fetchWithAuth: vi.fn(),
}))

// Helper to create a wrapper with React Query provider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // React Query v5+ uses gcTime instead of cacheTime
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial data loading', () => {
    it('should fetch initial data on mount', async () => {
      // ARRANGE
      const mockDashboardResponse = {
        summary: {
          totalProjects: 1,
          activeAgents: 1,
          totalCosts: 50.0,
        },
        recentActivities: [
          {
            id: 'activity-1',
            projectId: 'project-1',
            projectName: 'test-project',
            type: 'agent_start',
            message: 'Agent started',
            timestamp: '2025-11-20T12:00:00Z',
          },
        ],
        projectStats: [
          {
            id: 'project-1',
            name: 'test-project',
            path: '/path/to/project',
            totalCost: 25.0,
            agentCount: 1,
            progress: 65,
            lastActivity: '2025-11-20T12:00:00Z',
          },
        ],
      }

      const mockProjectsResponse = {
        projects: [
          {
            id: 'project-1',
            name: 'test-project',
            path: '/path/to/project',
            userId: 'user-1',
            createdAt: '2025-11-20T10:00:00Z',
            updatedAt: '2025-11-20T12:00:00Z',
          },
        ],
      }

      const mockAgentsResponse = {
        agents: [
          {
            id: 'agent-1',
            projectId: 'project-1',
            status: 'running' as const,
            startTime: '2025-11-20T12:00:00Z',
            endTime: null,
            logs: 'Agent logs',
            error: null,
            createdAt: '2025-11-20T12:00:00Z',
            updatedAt: '2025-11-20T12:00:00Z',
          },
        ],
      }

      const mockCostsResponse = {
        costs: [
          {
            id: 'cost-1',
            projectId: 'project-1',
            amount: 2.0,
            description: 'API usage',
            timestamp: '2025-11-20T12:00:00Z',
          },
        ],
      }

      const mockActivitiesResponse = {
        activities: [
          {
            id: 'activity-1',
            projectId: 'project-1',
            projectName: 'test-project',
            type: 'agent_start',
            message: 'Agent started',
            timestamp: '2025-11-20T12:00:00Z',
          },
        ],
      }

      vi.mocked(api.fetchWithAuth).mockImplementation(async (endpoint: string) => {
        if (endpoint === '/api/dashboard') {
          return { ok: true, json: async () => mockDashboardResponse } as Response
        }
        if (endpoint === '/api/projects') {
          return { ok: true, json: async () => mockProjectsResponse } as Response
        }
        if (endpoint === '/api/agents') {
          return { ok: true, json: async () => mockAgentsResponse } as Response
        }
        if (endpoint === '/api/costs') {
          return { ok: true, json: async () => mockCostsResponse } as Response
        }
        if (endpoint === '/api/activity') {
          return { ok: true, json: async () => mockActivitiesResponse } as Response
        }
        throw new Error('Unknown endpoint')
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT - Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.projects).toEqual([])
      expect(result.current.agents).toEqual([])
      expect(result.current.stats).toBeNull()

      // ASSERT - After data loads
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].name).toBe('test-project')
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.stats?.totalProjects).toBe(1)
      expect(result.current.error).toBeNull()
    })

    it('should handle errors during data loading', async () => {
      // ARRANGE
      const errorMessage = 'Failed to fetch dashboard data'
      vi.mocked(api.fetchWithAuth).mockImplementation(async (endpoint: string) => {
        if (endpoint === '/api/dashboard') {
          return { ok: false, status: 500 } as Response
        }
        return { ok: true, json: async () => ({ projects: [], agents: [], costs: [], activities: [] }) } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('data structure validation', () => {
    it('should return projects array', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            projects: [],
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(Array.isArray(result.current.projects)).toBe(true)
    })

    it('should return agents array', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            projects: [],
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(Array.isArray(result.current.agents)).toBe(true)
    })

    it('should return stats object after loading', async () => {
      // ARRANGE
      const mockStats = {
        totalProjects: 3,
        activeAgents: 5,
        totalCosts: 25.5,
      }

      vi.mocked(api.fetchWithAuth).mockImplementation(async (endpoint: string) => {
        if (endpoint === '/api/dashboard') {
          return {
            ok: true,
            json: async () => ({
              summary: mockStats,
              recentActivities: [],
              projectStats: [],
            }),
          } as Response
        }
        return {
          ok: true,
          json: async () => ({ projects: [], agents: [], costs: [], activities: [] }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.stats).toBeDefined()
      expect(result.current.stats?.totalProjects).toBe(3)
      expect(result.current.stats?.activeAgents).toBe(5)
      expect(result.current.stats?.totalCosts).toBe(25.5)
    })
  })

  describe('loading state', () => {
    it('should set loading to true initially', () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(
        async () => new Promise(() => {}) as any // Never resolves
      )

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      expect(result.current.loading).toBe(true)
    })

    it('should set loading to false after data loads', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            projects: [],
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set loading to false even on error', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return { ok: false, status: 500 } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('error handling', () => {
    it('should set error message on fetch failure', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return { ok: false, status: 500 } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error).toContain('Failed to fetch')
    })

    it('should clear error on successful load', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            projects: [],
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('multiple data sources', () => {
    it('should fetch all data sources', async () => {
      // ARRANGE
      const fetchSpy = vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            projects: [],
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT - All endpoints should be called
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/dashboard')
        expect(fetchSpy).toHaveBeenCalledWith('/api/projects')
        expect(fetchSpy).toHaveBeenCalledWith('/api/agents')
        expect(fetchSpy).toHaveBeenCalledWith('/api/costs')
        expect(fetchSpy).toHaveBeenCalledWith('/api/activity')
      })
    })

    it('should update all data when all fetches complete', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async (endpoint: string) => {
        if (endpoint === '/api/dashboard') {
          return {
            ok: true,
            json: async () => ({
              summary: { totalProjects: 1, activeAgents: 1, totalCosts: 5.0 },
              recentActivities: [],
              projectStats: [
                {
                  id: 'project1',
                  name: 'project1',
                  path: '/path1',
                  totalCost: 25.0,
                  agentCount: 1,
                  progress: 40,
                  lastActivity: '2025-11-20T12:00:00Z',
                },
              ],
            }),
          } as Response
        }
        if (endpoint === '/api/projects') {
          return {
            ok: true,
            json: async () => ({
              projects: [
                {
                  id: 'project1',
                  name: 'project1',
                  path: '/path1',
                  userId: 'user1',
                  createdAt: '2025-11-20T10:00:00Z',
                  updatedAt: '2025-11-20T12:00:00Z',
                },
              ],
            }),
          } as Response
        }
        if (endpoint === '/api/agents') {
          return {
            ok: true,
            json: async () => ({
              agents: [
                {
                  id: 'agent1',
                  projectId: 'project1',
                  status: 'running',
                  startTime: '2025-11-20T12:00:00Z',
                  createdAt: '2025-11-20T12:00:00Z',
                  updatedAt: '2025-11-20T12:00:00Z',
                },
              ],
            }),
          } as Response
        }
        return {
          ok: true,
          json: async () => ({ costs: [], activities: [] }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toHaveLength(1)
      expect(result.current.agents).toHaveLength(1)
      expect(result.current.stats?.activeAgents).toBe(1)
    })
  })

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            projects: [],
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.refetch).toBeDefined()
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch all data when refetch is called', async () => {
      // ARRANGE
      let callCount = 0
      vi.mocked(api.fetchWithAuth).mockImplementation(async (endpoint: string) => {
        callCount++
        if (endpoint === '/api/projects') {
          return {
            ok: true,
            json: async () => ({
              projects: callCount > 5 ? [
                {
                  id: 'project1',
                  name: 'project1',
                  path: '/path1',
                  userId: 'user1',
                  createdAt: '2025-11-20T10:00:00Z',
                  updatedAt: '2025-11-20T12:00:00Z',
                },
                {
                  id: 'project2',
                  name: 'project2',
                  path: '/path2',
                  userId: 'user1',
                  createdAt: '2025-11-20T10:00:00Z',
                  updatedAt: '2025-11-20T12:00:00Z',
                },
              ] : [
                {
                  id: 'project1',
                  name: 'project1',
                  path: '/path1',
                  userId: 'user1',
                  createdAt: '2025-11-20T10:00:00Z',
                  updatedAt: '2025-11-20T12:00:00Z',
                },
              ],
            }),
          } as Response
        }
        return {
          ok: true,
          json: async () => ({
            agents: [],
            costs: [],
            activities: [],
            summary: { totalProjects: 0, activeAgents: 0, totalCosts: 0 },
            recentActivities: [],
            projectStats: [],
          }),
        } as Response
      })

      // ACT
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toHaveLength(1)

      // Call refetch
      await result.current.refetch()

      // ASSERT
      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2)
      })
    })
  })
})
