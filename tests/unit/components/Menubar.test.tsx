import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MenubarPage from '@/app/menubar/page'
import * as sentraApi from '@/services/sentra-api'

// Mock sentra-api library
vi.mock('@/services/sentra-api', () => ({
  getDashboardStats: vi.fn(),
}))

describe('MenubarPage', () => {
  const mockStats = {
    activeAgents: 3,
    totalProjects: 5,
    todayCost: 12.45,
    successRate: 95,
    monthlyBudget: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sentraApi.getDashboardStats).mockResolvedValue(mockStats)
  })

  describe('rendering', () => {
    it('should render loading state initially', () => {
      // ARRANGE
      vi.mocked(sentraApi.getDashboardStats).mockImplementation(() => new Promise(() => {})) // Never resolves

      // ACT
      render(<MenubarPage />)

      // ASSERT
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render stats after loading', async () => {
      // ARRANGE & ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Active agents
        expect(screen.getByText('5')).toBeInTheDocument() // Projects
        expect(screen.getByText('$12.45')).toBeInTheDocument() // Today's cost
        expect(screen.getByText('95%')).toBeInTheDocument() // Success rate
      })
    })

    it('should display remaining budget correctly', async () => {
      // ARRANGE & ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('$87.55 left')).toBeInTheDocument() // 100 - 12.45 = 87.55
      })
    })

    it('should render Sentra branding', async () => {
      // ARRANGE & ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
        expect(screen.getByText('Quick Stats')).toBeInTheDocument()
      })
    })

    it('should render action buttons', async () => {
      // ARRANGE & ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Open Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Quit Sentra')).toBeInTheDocument()
      })
    })
  })

  describe('stats display', () => {
    it('should show "Running" status when agents are active', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getDashboardStats).mockResolvedValue({ ...mockStats, activeAgents: 2 })

      // ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeInTheDocument()
      })
    })

    it('should show "Idle" status when no agents are active', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getDashboardStats).mockResolvedValue({ ...mockStats, activeAgents: 0 })

      // ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Idle')).toBeInTheDocument()
      })
    })

    it('should show "Great!" for high success rate', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getDashboardStats).mockResolvedValue({ ...mockStats, successRate: 95 })

      // ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Great!')).toBeInTheDocument()
      })
    })

    it('should show "Good" for lower success rate', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getDashboardStats).mockResolvedValue({ ...mockStats, successRate: 75 })

      // ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Good')).toBeInTheDocument()
      })
    })
  })

  describe('interactions', () => {
    it('should call show_main_window when Open Dashboard is clicked', async () => {
      // ARRANGE
      render(<MenubarPage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Open Dashboard')).toBeInTheDocument()
      })

      // ACT
      const openButton = screen.getByText('Open Dashboard')
      fireEvent.click(openButton)

      // ASSERT
      await waitFor(() => {
        expect(sentraApi.getDashboardStats).toHaveBeenCalledWith('show_main_window')
      })
    })

    it('should call quit_app when Quit is clicked', async () => {
      // ARRANGE
      render(<MenubarPage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Quit Sentra')).toBeInTheDocument()
      })

      // ACT
      const quitButton = screen.getByText('Quit Sentra')
      fireEvent.click(quitButton)

      // ASSERT
      await waitFor(() => {
        expect(sentraApi.getDashboardStats).toHaveBeenCalledWith('quit_app')
      })
    })

    it('should call hide_menubar_window when close button is clicked', async () => {
      // ARRANGE
      render(<MenubarPage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // ACT
      const closeButton = screen.getByTitle('Close')
      fireEvent.click(closeButton)

      // ASSERT
      await waitFor(() => {
        expect(sentraApi.getDashboardStats).toHaveBeenCalledWith('hide_menubar_window')
      })
    })

    it('should handle errors when opening dashboard', async () => {
      // ARRANGE
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(sentraApi.getDashboardStats)
        .mockResolvedValueOnce(mockStats) // Initial stats load
        .mockRejectedValueOnce(new Error('Failed to show window')) // Open dashboard fails

      render(<MenubarPage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Open Dashboard')).toBeInTheDocument()
      })

      // ACT
      const openButton = screen.getByText('Open Dashboard')
      fireEvent.click(openButton)

      // ASSERT
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to open dashboard:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle errors when quitting app', async () => {
      // ARRANGE
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(sentraApi.getDashboardStats)
        .mockResolvedValueOnce(mockStats) // Initial stats load
        .mockRejectedValueOnce(new Error('Failed to quit')) // Quit fails

      render(<MenubarPage />)

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Quit Sentra')).toBeInTheDocument()
      })

      // ACT
      const quitButton = screen.getByText('Quit Sentra')
      fireEvent.click(quitButton)

      // ASSERT
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to quit app:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('auto-refresh', () => {
    it('should set up auto-refresh interval', async () => {
      // ARRANGE
      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      // ACT
      render(<MenubarPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(sentraApi.getDashboardStats).toHaveBeenCalledWith('get_dashboard_stats')
      })

      // ASSERT - Should have set up a 30-second interval
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000)

      setIntervalSpy.mockRestore()
    })

    it('should clean up interval on unmount', async () => {
      // ARRANGE
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const { unmount } = render(<MenubarPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(sentraApi.getDashboardStats).toHaveBeenCalledWith('get_dashboard_stats')
      })

      // ACT
      unmount()

      // ASSERT - Should have called clearInterval
      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    it('should handle stats loading failure gracefully', async () => {
      // ARRANGE
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(sentraApi.getDashboardStats).mockRejectedValue(new Error('Failed to load stats'))

      // ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load stats:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('should display action buttons even when stats fail to load', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getDashboardStats).mockRejectedValue(new Error('Failed to load stats'))

      // ACT
      render(<MenubarPage />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Open Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Quit Sentra')).toBeInTheDocument()
      })
    })
  })

  describe('visual state changes', () => {
    it('should transition from loading to loaded state', async () => {
      // ARRANGE
      let resolveStats: (value: any) => void
      const statsPromise = new Promise((resolve) => {
        resolveStats = resolve
      })
      vi.mocked(sentraApi.getDashboardStats).mockReturnValue(statsPromise as any)

      // ACT
      render(<MenubarPage />)

      // ASSERT - Initially loading
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Resolve the promise to complete loading
      resolveStats!(mockStats)

      // ASSERT - After load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        expect(screen.getByText('Open Dashboard')).toBeInTheDocument()
      })
    })

    it('should display current timestamp in footer', async () => {
      // ARRANGE & ACT
      render(<MenubarPage />)

      // Wait for stats to load
      await waitFor(() => {
        expect(screen.getByText('Open Dashboard')).toBeInTheDocument()
      })

      // ASSERT
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })
  })
})
