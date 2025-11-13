import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDashboard } from '@/hooks/useDashboard'
import * as tauri from '@/lib/tauri'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  getProjects: vi.fn(),
  getActiveAgents: vi.fn(),
  getDashboardStats: vi.fn(),
}))

// Mock the Tauri event listener
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}))

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial data loading', () => {
    it('should fetch initial data on mount', async () => {
      // ARRANGE
      const mockProjects = [
        {
          name: 'test-project',
          path: '/path/to/project',
          activeAgents: 1,
          totalIssues: 10,
          completedIssues: 5,
          monthlyCost: 50.0,
          status: 'active' as const,
        },
      ]
      const mockAgents = [
        {
          id: 'agent-1',
          project: 'test-project',
          issue: 1,
          title: 'Test Issue',
          description: 'Test Description',
          phase: 'Phase 1',
          elapsedMinutes: 10,
          cost: 2.0,
          status: 'running' as const,
        },
      ]
      const mockStats = {
        activeAgents: 1,
        totalProjects: 1,
        todayCost: 10.0,
        monthlyBudget: 100.0,
        successRate: 95,
      }

      vi.mocked(tauri.getProjects).mockResolvedValue(mockProjects)
      vi.mocked(tauri.getActiveAgents).mockResolvedValue(mockAgents)
      vi.mocked(tauri.getDashboardStats).mockResolvedValue(mockStats)

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT - Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.projects).toEqual([])
      expect(result.current.agents).toEqual([])
      expect(result.current.stats).toBeNull()

      // ASSERT - After data loads
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toEqual(mockProjects)
      expect(result.current.agents).toEqual(mockAgents)
      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.error).toBeNull()
    })

    it('should handle errors during data loading', async () => {
      // ARRANGE
      const errorMessage = 'Failed to fetch data'
      vi.mocked(tauri.getProjects).mockRejectedValue(new Error(errorMessage))
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

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
      vi.mocked(tauri.getProjects).mockResolvedValue([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(Array.isArray(result.current.projects)).toBe(true)
    })

    it('should return agents array', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockResolvedValue([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(Array.isArray(result.current.agents)).toBe(true)
    })

    it('should return stats object after loading', async () => {
      // ARRANGE
      const mockStats = {
        activeAgents: 5,
        totalProjects: 3,
        todayCost: 25.5,
        monthlyBudget: 100.0,
        successRate: 92,
      }

      vi.mocked(tauri.getProjects).mockResolvedValue([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue(mockStats)

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.stats).toHaveProperty('activeAgents')
      expect(result.current.stats).toHaveProperty('totalProjects')
      expect(result.current.stats).toHaveProperty('todayCost')
      expect(result.current.stats).toHaveProperty('monthlyBudget')
      expect(result.current.stats).toHaveProperty('successRate')
    })
  })

  describe('loading state', () => {
    it('should set loading to true initially', () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      vi.mocked(tauri.getActiveAgents).mockImplementation(
        () => new Promise(() => {})
      )
      vi.mocked(tauri.getDashboardStats).mockImplementation(
        () => new Promise(() => {})
      )

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      expect(result.current.loading).toBe(true)
    })

    it('should set loading to false after data loads', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockResolvedValue([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set loading to false even on error', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockRejectedValue(new Error('Test error'))
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

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
      const errorMessage = 'Network error'
      vi.mocked(tauri.getProjects).mockRejectedValue(new Error(errorMessage))
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })
    })

    it('should handle non-Error objects', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockRejectedValue('String error')
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch dashboard data')
      })
    })

    it('should clear error on successful load', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockResolvedValue([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('multiple data sources', () => {
    it('should fetch all three data sources in parallel', async () => {
      // ARRANGE
      const getProjectsSpy = vi.mocked(tauri.getProjects).mockResolvedValue([])
      const getActiveAgentsSpy = vi
        .mocked(tauri.getActiveAgents)
        .mockResolvedValue([])
      const getDashboardStatsSpy = vi
        .mocked(tauri.getDashboardStats)
        .mockResolvedValue({
          activeAgents: 0,
          totalProjects: 0,
          todayCost: 0,
          monthlyBudget: 100,
          successRate: 0,
        })

      // ACT
      renderHook(() => useDashboard())

      // ASSERT - All should be called
      await waitFor(() => {
        expect(getProjectsSpy).toHaveBeenCalledTimes(1)
        expect(getActiveAgentsSpy).toHaveBeenCalledTimes(1)
        expect(getDashboardStatsSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('should update all data when all fetches complete', async () => {
      // ARRANGE
      const mockProjects = [
        {
          name: 'project1',
          path: '/path1',
          activeAgents: 1,
          totalIssues: 5,
          completedIssues: 2,
          monthlyCost: 25.0,
          status: 'active' as const,
        },
      ]
      const mockAgents = [
        {
          id: 'agent1',
          project: 'project1',
          issue: 1,
          title: 'Issue 1',
          description: 'Description 1',
          phase: 'Phase 1',
          elapsedMinutes: 5,
          cost: 1.0,
          status: 'running' as const,
        },
      ]
      const mockStats = {
        activeAgents: 1,
        totalProjects: 1,
        todayCost: 5.0,
        monthlyBudget: 100.0,
        successRate: 90,
      }

      vi.mocked(tauri.getProjects).mockResolvedValue(mockProjects)
      vi.mocked(tauri.getActiveAgents).mockResolvedValue(mockAgents)
      vi.mocked(tauri.getDashboardStats).mockResolvedValue(mockStats)

      // ACT
      const { result } = renderHook(() => useDashboard())

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
      vi.mocked(tauri.getProjects).mockResolvedValue([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      // ASSERT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.refetch).toBeDefined()
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should refetch all data when refetch is called', async () => {
      // ARRANGE
      const mockProjects = [
        {
          name: 'project1',
          path: '/path1',
          activeAgents: 1,
          totalIssues: 5,
          completedIssues: 2,
          monthlyCost: 25.0,
          status: 'active' as const,
        },
      ]

      const updatedProjects = [
        ...mockProjects,
        {
          name: 'project2',
          path: '/path2',
          activeAgents: 0,
          totalIssues: 3,
          completedIssues: 1,
          monthlyCost: 15.0,
          status: 'active' as const,
        },
      ]

      vi.mocked(tauri.getProjects).mockResolvedValueOnce(mockProjects)
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 1,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.projects).toHaveLength(1)

      // Mock updated data
      vi.mocked(tauri.getProjects).mockResolvedValueOnce(updatedProjects)

      // Call refetch
      await result.current.refetch()

      // ASSERT
      await waitFor(() => {
        expect(result.current.projects).toHaveLength(2)
      })
    })

    it('should clear error on successful refetch', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockRejectedValueOnce(new Error('Initial error'))
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Initial error')

      // Mock successful refetch
      vi.mocked(tauri.getProjects).mockResolvedValueOnce([])

      await result.current.refetch()

      // ASSERT
      await waitFor(() => {
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle refetch errors', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjects).mockResolvedValueOnce([])
      vi.mocked(tauri.getActiveAgents).mockResolvedValue([])
      vi.mocked(tauri.getDashboardStats).mockResolvedValue({
        activeAgents: 0,
        totalProjects: 0,
        todayCost: 0,
        monthlyBudget: 100,
        successRate: 0,
      })

      // ACT
      const { result } = renderHook(() => useDashboard())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()

      // Mock error on refetch
      vi.mocked(tauri.getProjects).mockRejectedValueOnce(new Error('Refetch failed'))

      await result.current.refetch()

      // ASSERT
      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed')
      })
    })
  })
})
