import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProjects,
  getActiveAgents,
  getDashboardStats,
  getTelemetryLogs,
  stopAgent,
  getProjectMemory,
  getSettings,
  saveSettings,
  speakNotification,
  chatWithArchitect,
  transcribeAudio,
  getProjectContext,
  savePendingSpec,
  approveSpec,
  rejectSpec,
  type Settings,
} from '@/lib/tauri'

// Mock the Tauri API
const mockInvoke = vi.fn()

// Setup window mock for Tauri environment
beforeEach(() => {
  vi.clearAllMocks()

  // Mock browser environment (MOCK_MODE = true)
  // @ts-expect-error - mocking window.__TAURI_INTERNALS__
  delete window.__TAURI_INTERNALS__
})

describe('tauri.ts', () => {
  describe('getProjects', () => {
    it('should return mock projects in browser mode', async () => {
      // ARRANGE & ACT
      const result = await getProjects()

      // ASSERT
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('path')
      expect(result[0]).toHaveProperty('activeAgents')
      expect(result[0]).toHaveProperty('status')
    })

    it('should return projects with correct structure', async () => {
      // ARRANGE & ACT
      const result = await getProjects()

      // ASSERT
      const project = result[0]
      expect(project).toMatchObject({
        name: expect.any(String),
        path: expect.any(String),
        activeAgents: expect.any(Number),
        totalIssues: expect.any(Number),
        completedIssues: expect.any(Number),
        monthlyCost: expect.any(Number),
        status: expect.stringMatching(/^(active|idle|error)$/),
      })
    })
  })

  describe('getActiveAgents', () => {
    it('should return mock agents in browser mode', async () => {
      // ARRANGE & ACT
      const result = await getActiveAgents()

      // ASSERT
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('project')
      expect(result[0]).toHaveProperty('issue')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('status')
    })

    it('should return agents with correct structure', async () => {
      // ARRANGE & ACT
      const result = await getActiveAgents()

      // ASSERT
      const agent = result[0]
      expect(agent).toMatchObject({
        id: expect.any(String),
        project: expect.any(String),
        issue: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        phase: expect.any(String),
        elapsedMinutes: expect.any(Number),
        cost: expect.any(Number),
        status: expect.stringMatching(/^(running|completed|failed)$/),
      })
    })
  })

  describe('getDashboardStats', () => {
    it('should return mock stats in browser mode', async () => {
      // ARRANGE & ACT
      const result = await getDashboardStats()

      // ASSERT
      expect(result).toMatchObject({
        activeAgents: expect.any(Number),
        totalProjects: expect.any(Number),
        todayCost: expect.any(Number),
        monthlyBudget: expect.any(Number),
        successRate: expect.any(Number),
      })
    })

    it('should return non-negative values', async () => {
      // ARRANGE & ACT
      const result = await getDashboardStats()

      // ASSERT
      expect(result.activeAgents).toBeGreaterThanOrEqual(0)
      expect(result.totalProjects).toBeGreaterThanOrEqual(0)
      expect(result.todayCost).toBeGreaterThanOrEqual(0)
      expect(result.monthlyBudget).toBeGreaterThan(0)
      expect(result.successRate).toBeGreaterThanOrEqual(0)
      expect(result.successRate).toBeLessThanOrEqual(100)
    })
  })

  describe('getTelemetryLogs', () => {
    it('should return mock logs in browser mode', async () => {
      // ARRANGE
      const project = 'test-project'
      const lines = 10

      // ACT
      const result = await getTelemetryLogs(project, lines)

      // ASSERT
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain(project)
    })

    it('should include project name in logs', async () => {
      // ARRANGE
      const project = 'my-project'

      // ACT
      const result = await getTelemetryLogs(project)

      // ASSERT
      expect(result.every((log) => log.includes(project))).toBe(true)
    })
  })

  describe('stopAgent', () => {
    it('should log agent stop in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const agentId = 'test-agent-123'

      // ACT
      await stopAgent(agentId)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stopping agent')
      )
    })
  })

  describe('getProjectMemory', () => {
    it('should return mock memory in browser mode', async () => {
      // ARRANGE
      const project = 'test-project'

      // ACT
      const result = await getProjectMemory(project)

      // ASSERT
      expect(result).toHaveProperty('gotchas')
      expect(result).toHaveProperty('patterns')
      expect(result).toHaveProperty('decisions')
      expect(typeof result.gotchas).toBe('string')
      expect(typeof result.patterns).toBe('string')
      expect(typeof result.decisions).toBe('string')
    })
  })

  describe('getSettings', () => {
    it('should return mock settings in browser mode', async () => {
      // ARRANGE & ACT
      const result = await getSettings()

      // ASSERT
      expect(result).toMatchObject({
        userName: expect.any(String),
        voice: expect.any(String),
        openaiApiKey: expect.any(String),
        anthropicApiKey: expect.any(String),
        notificationsEnabled: expect.any(Boolean),
        notifyOnCompletion: expect.any(Boolean),
        notifyOnFailure: expect.any(Boolean),
        notifyOnStart: expect.any(Boolean),
      })
    })

    it('should return default values for API keys', async () => {
      // ARRANGE & ACT
      const result = await getSettings()

      // ASSERT
      expect(result.voice).toBe('nova')
      expect(result.notificationsEnabled).toBe(true)
      expect(result.notifyOnCompletion).toBe(true)
      expect(result.notifyOnFailure).toBe(true)
      expect(result.notifyOnStart).toBe(false)
    })
  })

  describe('saveSettings', () => {
    it('should throw error in browser mode', async () => {
      // ARRANGE
      const settings: Settings = {
        userName: 'Test User',
        voice: 'nova',
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

      // ACT & ASSERT
      await expect(saveSettings(settings)).rejects.toThrow(
        'Settings cannot be saved in browser mode'
      )
    })

    it('should log warning when trying to save in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const settings: Settings = {
        userName: 'Test User',
        voice: 'nova',
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

      // ACT
      try {
        await saveSettings(settings)
      } catch {
        // Expected to throw
      }

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Mock] Saving settings'),
        expect.anything()
      )
    })
  })

  describe('speakNotification', () => {
    it('should log notification in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const message = 'Test notification'
      const voice = 'nova'
      const apiKey = 'sk-test'

      // ACT
      await speakNotification(message, voice, apiKey)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(message)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(voice)
      )
    })
  })

  describe('chatWithArchitect', () => {
    it('should return mock response in browser mode', async () => {
      // ARRANGE
      const projectName = 'test-project'
      const message = 'Hello, Architect'
      const conversationHistory: Array<{ role: string; content: string }> = []
      const apiKey = 'sk-ant-test'

      // ACT
      const result = await chatWithArchitect(
        projectName,
        message,
        conversationHistory,
        apiKey
      )

      // ASSERT
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('mock response')
    })

    it('should log message in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const projectName = 'test-project'
      const message = 'Test message'

      // ACT
      await chatWithArchitect(projectName, message, [], 'sk-ant-test')

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(projectName)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(message)
      )
    })
  })

  describe('transcribeAudio', () => {
    it('should return mock transcription in browser mode', async () => {
      // ARRANGE
      const audioData = new Uint8Array([1, 2, 3, 4])
      const apiKey = 'sk-test'

      // ACT
      const result = await transcribeAudio(audioData, apiKey)

      // ASSERT
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('mock transcription')
    })

    it('should log transcription in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const audioData = new Uint8Array([1, 2, 3, 4])
      const apiKey = 'sk-test'

      // ACT
      await transcribeAudio(audioData, apiKey)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transcribing audio')
      )
    })
  })

  describe('getProjectContext', () => {
    it('should return mock context in browser mode', async () => {
      // ARRANGE
      const projectPath = '/path/to/project'

      // ACT
      const result = await getProjectContext(projectPath)

      // ASSERT
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('Project Context')
    })

    it('should include project path in context', async () => {
      // ARRANGE
      const projectPath = '/path/to/my-project'

      // ACT
      const result = await getProjectContext(projectPath)

      // ASSERT
      expect(result).toContain(projectPath)
    })
  })

  describe('savePendingSpec', () => {
    it('should log save in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const projectName = 'test-project'
      const projectPath = '/path/to/project'
      const spec = 'Test specification'

      // ACT
      await savePendingSpec(projectName, projectPath, spec)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Saving pending spec')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(projectName)
      )
    })
  })

  describe('approveSpec', () => {
    it('should log approval in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const projectName = 'test-project'
      const projectPath = '/path/to/project'

      // ACT
      await approveSpec(projectName, projectPath)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Approving spec')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(projectName)
      )
    })
  })

  describe('rejectSpec', () => {
    it('should log rejection in browser mode', async () => {
      // ARRANGE
      const consoleLogSpy = vi.spyOn(console, 'log')
      const projectName = 'test-project'
      const projectPath = '/path/to/project'

      // ACT
      await rejectSpec(projectName, projectPath)

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rejecting spec')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(projectName)
      )
    })
  })
})
