import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGitHubIssue, type CreateIssueOptions } from '@/hooks/useGitHubIssue'
import * as tauri from '@/lib/tauri'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  createGithubIssue: vi.fn(),
}))

describe('useGitHubIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      // ARRANGE & ACT
      const { result } = renderHook(() => useGitHubIssue())

      // ASSERT
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.issueUrl).toBeNull()
      expect(result.current.createIssue).toBeDefined()
      expect(result.current.reset).toBeDefined()
    })
  })

  describe('createIssue', () => {
    it('should create GitHub issue successfully', async () => {
      // ARRANGE
      const mockUrl = 'https://github.com/test/repo/issues/123'
      vi.mocked(tauri.createGithubIssue).mockResolvedValue(mockUrl)

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body content',
        labels: ['bug', 'enhancement'],
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT
      let returnedUrl: string | null = null
      await act(async () => {
        returnedUrl = await result.current.createIssue(options)
      })

      // ASSERT
      expect(tauri.createGithubIssue).toHaveBeenCalledWith(
        'Test Issue',
        'Test body content',
        ['bug', 'enhancement']
      )
      expect(returnedUrl).toBe(mockUrl)
      expect(result.current.issueUrl).toBe(mockUrl)
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should use default ai-feature label when labels not provided', async () => {
      // ARRANGE
      const mockUrl = 'https://github.com/test/repo/issues/124'
      vi.mocked(tauri.createGithubIssue).mockResolvedValue(mockUrl)

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT
      await act(async () => {
        await result.current.createIssue(options)
      })

      // ASSERT
      expect(tauri.createGithubIssue).toHaveBeenCalledWith(
        'Test Issue',
        'Test body',
        ['ai-feature']
      )
    })

    it('should set isCreating to true while creating', async () => {
      // ARRANGE
      let resolveCreate: (value: string) => void
      const createPromise = new Promise<string>((resolve) => {
        resolveCreate = resolve
      })
      vi.mocked(tauri.createGithubIssue).mockReturnValue(createPromise)

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT
      act(() => {
        result.current.createIssue(options)
      })

      // ASSERT - Should be creating
      expect(result.current.isCreating).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolveCreate!('https://github.com/test/repo/issues/125')
        await createPromise
      })

      // Should no longer be creating
      expect(result.current.isCreating).toBe(false)
    })

    it('should handle Error objects correctly', async () => {
      // ARRANGE
      const errorMessage = 'Failed to create issue'
      vi.mocked(tauri.createGithubIssue).mockRejectedValue(new Error(errorMessage))

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT
      let returnedUrl: string | null = null
      await act(async () => {
        returnedUrl = await result.current.createIssue(options)
      })

      // ASSERT
      expect(returnedUrl).toBeNull()
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.issueUrl).toBeNull()
      expect(result.current.isCreating).toBe(false)
    })

    it('should handle non-Error objects correctly', async () => {
      // ARRANGE
      vi.mocked(tauri.createGithubIssue).mockRejectedValue('String error')

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT
      let returnedUrl: string | null = null
      await act(async () => {
        returnedUrl = await result.current.createIssue(options)
      })

      // ASSERT
      expect(returnedUrl).toBeNull()
      expect(result.current.error).toBe('Failed to create GitHub issue')
      expect(result.current.issueUrl).toBeNull()
      expect(result.current.isCreating).toBe(false)
    })

    it('should clear previous error on new attempt', async () => {
      // ARRANGE
      vi.mocked(tauri.createGithubIssue).mockRejectedValueOnce(new Error('First error'))

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT - First attempt fails
      await act(async () => {
        await result.current.createIssue(options)
      })

      expect(result.current.error).toBe('First error')

      // Mock successful response
      const mockUrl = 'https://github.com/test/repo/issues/126'
      vi.mocked(tauri.createGithubIssue).mockResolvedValueOnce(mockUrl)

      // Second attempt succeeds
      await act(async () => {
        await result.current.createIssue(options)
      })

      // ASSERT
      expect(result.current.error).toBeNull()
      expect(result.current.issueUrl).toBe(mockUrl)
    })

    it('should clear previous issueUrl on new attempt', async () => {
      // ARRANGE
      const firstUrl = 'https://github.com/test/repo/issues/127'
      vi.mocked(tauri.createGithubIssue).mockResolvedValueOnce(firstUrl)

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // ACT - First attempt succeeds
      await act(async () => {
        await result.current.createIssue(options)
      })

      expect(result.current.issueUrl).toBe(firstUrl)

      // Mock second attempt failure
      vi.mocked(tauri.createGithubIssue).mockRejectedValueOnce(new Error('Failed'))

      // Second attempt fails
      await act(async () => {
        await result.current.createIssue(options)
      })

      // ASSERT - URL should be cleared on new attempt
      expect(result.current.issueUrl).toBeNull()
      expect(result.current.error).toBe('Failed')
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      // ARRANGE
      const mockUrl = 'https://github.com/test/repo/issues/128'
      vi.mocked(tauri.createGithubIssue).mockResolvedValue(mockUrl)

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // Create an issue first
      await act(async () => {
        await result.current.createIssue(options)
      })

      expect(result.current.issueUrl).toBe(mockUrl)

      // ACT - Reset
      act(() => {
        result.current.reset()
      })

      // ASSERT
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.issueUrl).toBeNull()
    })

    it('should reset error state', async () => {
      // ARRANGE
      vi.mocked(tauri.createGithubIssue).mockRejectedValue(new Error('Test error'))

      const options: CreateIssueOptions = {
        title: 'Test Issue',
        body: 'Test body',
      }

      const { result } = renderHook(() => useGitHubIssue())

      // Create an issue that fails
      await act(async () => {
        await result.current.createIssue(options)
      })

      expect(result.current.error).toBe('Test error')

      // ACT - Reset
      act(() => {
        result.current.reset()
      })

      // ASSERT
      expect(result.current.error).toBeNull()
    })

    it('should be safe to call reset multiple times', () => {
      // ARRANGE
      const { result } = renderHook(() => useGitHubIssue())

      // ACT & ASSERT - Should not throw
      act(() => {
        result.current.reset()
        result.current.reset()
        result.current.reset()
      })

      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.issueUrl).toBeNull()
    })
  })

  describe('return type', () => {
    it('should return all required properties', () => {
      // ARRANGE & ACT
      const { result } = renderHook(() => useGitHubIssue())

      // ASSERT
      expect(result.current).toHaveProperty('createIssue')
      expect(result.current).toHaveProperty('isCreating')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('issueUrl')
      expect(result.current).toHaveProperty('reset')
    })

    it('should have createIssue as a function', () => {
      // ARRANGE & ACT
      const { result } = renderHook(() => useGitHubIssue())

      // ASSERT
      expect(typeof result.current.createIssue).toBe('function')
    })

    it('should have reset as a function', () => {
      // ARRANGE & ACT
      const { result } = renderHook(() => useGitHubIssue())

      // ASSERT
      expect(typeof result.current.reset).toBe('function')
    })
  })
})
