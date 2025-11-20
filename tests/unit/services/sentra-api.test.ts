import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getProjects,
  getActiveAgents,
  getDashboardStats,
  getSettings,
  saveSettings,
  createProject,
  getActivityEvents,
  addActivityEvent,
  type Settings,
} from '@/services/sentra-api'
import * as api from '@/services/api'

// Mock the fetchWithAuth function
vi.mock('@/services/api', () => ({
  fetchWithAuth: vi.fn(),
}))

describe('sentra-api.ts - API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getProjects', () => {
    it('should fetch projects from API and transform response', async () => {
      // ARRANGE
      const mockApiResponse = {
        projects: [
          {
            id: 'project-1',
            name: 'Test Project',
            path: '/path/to/project',
            totalCost: 45.20,
            progress: 65,
            userId: 'user-1',
            settings: null,
            createdAt: '2025-11-20T12:00:00Z',
            updatedAt: '2025-11-20T14:00:00Z',
          },
        ],
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await getProjects()

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/projects')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'Test Project',
        path: '/path/to/project',
        monthlyCost: 45.20,
        progress: 65,
      })
    })

    it('should throw error when API call fails', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response)

      // ACT & ASSERT
      await expect(getProjects()).rejects.toThrow('Failed to fetch projects')
    })
  })

  describe('getActiveAgents', () => {
    it('should fetch running agents from API', async () => {
      // ARRANGE
      const mockApiResponse = {
        agents: [
          {
            id: 'agent-1',
            projectId: 'project-1',
            status: 'running',
            startTime: '2025-11-20T12:00:00Z',
            endTime: null,
            logs: null,
            error: null,
            createdAt: '2025-11-20T12:00:00Z',
            updatedAt: '2025-11-20T12:00:00Z',
          },
        ],
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await getActiveAgents()

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/agents?status=running')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'agent-1',
        project: 'project-1',
        status: 'running',
      })
    })

    it('should throw error when API call fails', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response)

      // ACT & ASSERT
      await expect(getActiveAgents()).rejects.toThrow('Failed to fetch agents')
    })
  })

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics from API', async () => {
      // ARRANGE
      const mockApiResponse = {
        summary: {
          totalProjects: 4,
          activeAgents: 2,
          totalCosts: 86.20,
        },
        recentActivities: [],
        projectStats: [],
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await getDashboardStats()

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/dashboard')
      expect(result).toMatchObject({
        activeAgents: 2,
        totalProjects: 4,
        todayCost: 86.20,
        monthlyBudget: 100.00,
      })
    })

    it('should throw error when API call fails', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response)

      // ACT & ASSERT
      await expect(getDashboardStats()).rejects.toThrow('Failed to fetch dashboard stats')
    })
  })

  describe('getSettings', () => {
    it('should fetch settings from API', async () => {
      // ARRANGE
      const mockApiResponse = {
        userName: 'Test User',
        openaiApiKey: 'sk-test',
        anthropicApiKey: 'sk-ant-test',
        githubToken: 'ghp-test',
        githubRepoOwner: 'testowner',
        githubRepoName: 'testrepo',
        voiceSettings: {
          voice: 'alloy',
        },
        notificationSettings: {
          enabled: true,
          onCompletion: true,
          onFailure: true,
          onStart: false,
        },
        language: 'en',
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await getSettings()

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/settings')
      expect(result).toMatchObject({
        userName: 'Test User',
        voice: 'alloy',
        openaiApiKey: 'sk-test',
        anthropicApiKey: 'sk-ant-test',
        githubToken: 'ghp-test',
        notificationsEnabled: true,
        notifyOnCompletion: true,
        notifyOnFailure: true,
        notifyOnStart: false,
      })
    })

    it('should fallback to localStorage when API call fails', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response)

      // ACT
      const result = await getSettings()

      // ASSERT
      expect(result).toMatchObject({
        userName: 'Glen',
        voice: 'alloy',
        notificationsEnabled: true,
      })
    })
  })

  describe('saveSettings', () => {
    it('should save settings to API', async () => {
      // ARRANGE
      const settings: Settings = {
        userName: 'Test User',
        voice: 'alloy',
        openaiApiKey: 'sk-test',
        anthropicApiKey: 'sk-ant-test',
        githubToken: 'ghp-test',
        githubRepoOwner: 'testowner',
        githubRepoName: 'testrepo',
        notificationsEnabled: true,
        notifyOnCompletion: true,
        notifyOnFailure: true,
        notifyOnStart: false,
        language: 'en',
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const consoleLogSpy = vi.spyOn(console, 'log')

      // ACT
      await saveSettings(settings)

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/settings', {
        method: 'PUT',
        body: expect.stringContaining('openaiApiKey'),
      })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Settings saved successfully')
      )
    })

    it('should fallback to localStorage when API call fails', async () => {
      // ARRANGE
      const settings: Settings = {
        userName: 'Test User',
        voice: 'alloy',
        openaiApiKey: 'sk-test',
        anthropicApiKey: 'sk-ant-test',
        githubToken: 'ghp-test',
        githubRepoOwner: 'testowner',
        githubRepoName: 'testrepo',
        notificationsEnabled: true,
        notifyOnCompletion: true,
        notifyOnFailure: true,
        notifyOnStart: false,
        language: 'en',
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response)

      const consoleLogSpy = vi.spyOn(console, 'log')

      // ACT
      await saveSettings(settings)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Settings saved to localStorage')
      )
    })
  })

  describe('createProject', () => {
    it('should create project via API', async () => {
      // ARRANGE
      const params = {
        name: 'New Project',
        path: '/path/to/new-project',
        template: 'nextjs',
      }

      const mockApiResponse = {
        project: {
          id: 'project-new',
          name: 'New Project',
          path: '/path/to/new-project',
          userId: 'user-1',
          settings: { template: 'nextjs' },
          createdAt: '2025-11-20T12:00:00Z',
          updatedAt: '2025-11-20T12:00:00Z',
        },
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await createProject(params)

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        body: expect.stringContaining('New Project'),
      })
      expect(result).toMatchObject({
        name: 'New Project',
        path: '/path/to/new-project',
      })
    })

    it('should throw error when API call fails', async () => {
      // ARRANGE
      const params = {
        name: 'New Project',
        path: '/path/to/new-project',
        template: 'nextjs',
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      } as Response)

      // ACT & ASSERT
      await expect(createProject(params)).rejects.toThrow('Failed to create project')
    })
  })

  describe('getActivityEvents', () => {
    it('should fetch activities from API', async () => {
      // ARRANGE
      const mockApiResponse = {
        activities: [
          {
            id: 'activity-1',
            projectId: 'project-1',
            type: 'commit',
            message: 'feat: add feature',
            metadata: { author: 'Claude' },
            timestamp: '2025-11-20T12:00:00Z',
          },
        ],
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await getActivityEvents(50)

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/activity')
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'activity-1',
        project: 'project-1',
        type: 'commit',
        message: 'feat: add feature',
      })
    })

    it('should throw error when API call fails', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response)

      // ACT & ASSERT
      await expect(getActivityEvents()).rejects.toThrow('Failed to fetch activities')
    })
  })

  describe('addActivityEvent', () => {
    it('should add activity via API', async () => {
      // ARRANGE
      const mockApiResponse = {
        activity: {
          id: 'activity-new',
          projectId: 'project-1',
          type: 'commit',
          message: 'feat: add feature',
          metadata: { author: 'Claude' },
          timestamp: '2025-11-20T12:00:00Z',
        },
      }

      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response)

      // ACT
      const result = await addActivityEvent(
        'project-1',
        'commit',
        'feat: add feature',
        { author: 'Claude' }
      )

      // ASSERT
      expect(api.fetchWithAuth).toHaveBeenCalledWith('/api/activity', {
        method: 'POST',
        body: expect.stringContaining('project-1'),
      })
      expect(result).toMatchObject({
        id: 'activity-new',
        project: 'project-1',
        type: 'commit',
        message: 'feat: add feature',
      })
    })

    it('should throw error when API call fails', async () => {
      // ARRANGE
      vi.mocked(api.fetchWithAuth).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      } as Response)

      // ACT & ASSERT
      await expect(
        addActivityEvent('project-1', 'commit', 'feat: add feature')
      ).rejects.toThrow('Failed to add activity')
    })
  })
})
