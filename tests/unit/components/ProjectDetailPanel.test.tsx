import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectDetailPanel } from '@/components/ProjectDetailPanel'
import type { Project } from '@/lib/tauri'
import * as tauri from '@/lib/tauri'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  getGitLog: vi.fn(),
  getGitStatus: vi.fn(),
  getGitDiff: vi.fn(),
  getTelemetryLogs: vi.fn(),
}))

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}))

describe('ProjectDetailPanel', () => {
  const mockProject: Project = {
    name: 'Test Project',
    path: '/test/path',
    status: 'active',
    activeAgents: 2,
    totalIssues: 10,
    completedIssues: 7,
    monthlyCost: 15.50,
    progress: 65,
    currentTask: 'Implementing voice queue system',
    muted: false,
  }

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(tauri.getGitLog).mockResolvedValue([
      {
        hash: 'abc123',
        shortHash: 'abc123d',
        author: 'John Doe',
        email: 'john@example.com',
        date: '2025-11-13 15:30:00',
        message: 'feat: Add new feature',
      },
    ])

    vi.mocked(tauri.getGitStatus).mockResolvedValue({
      currentBranch: 'main',
      ahead: 2,
      behind: 0,
      modifiedFiles: ['src/test.ts'],
      stagedFiles: [],
      untrackedFiles: [],
    })

    vi.mocked(tauri.getGitDiff).mockResolvedValue({
      files: [],
      totalAdditions: 0,
      totalDeletions: 0,
      patch: '',
    })

    vi.mocked(tauri.getTelemetryLogs).mockResolvedValue([
      '[2025-11-13 14:23:15] [Test Project] [INFO] Starting work',
    ])
  })

  describe('rendering', () => {
    it('should render panel when isOpen is true', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByTestId('project-detail-panel')).toBeInTheDocument()
    })

    it('should not render panel when isOpen is false', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={false} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.queryByTestId('project-detail-panel')).not.toBeInTheDocument()
    })

    it('should render project name in header', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('should render close button', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByTestId('close-button')).toBeInTheDocument()
    })

    it('should render all tab buttons', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument()
      expect(screen.getByTestId('tab-git')).toBeInTheDocument()
      expect(screen.getByTestId('tab-logs')).toBeInTheDocument()
      expect(screen.getByTestId('tab-costs')).toBeInTheDocument()
    })
  })

  describe('backdrop', () => {
    it('should render backdrop when panel is open', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByTestId('panel-backdrop')).toBeInTheDocument()
    })

    it('should close panel when backdrop is clicked', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const backdrop = screen.getByTestId('panel-backdrop')
      fireEvent.click(backdrop)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should have semi-transparent background', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const backdrop = screen.getByTestId('panel-backdrop')
      expect(backdrop).toHaveClass('bg-black/50')
    })
  })

  describe('close button', () => {
    it('should call onClose when clicked', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const closeButton = screen.getByTestId('close-button')
      fireEvent.click(closeButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should have proper ARIA label', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const closeButton = screen.getByTestId('close-button')
      expect(closeButton).toHaveAttribute('aria-label', 'Close panel')
    })
  })

  describe('tab navigation', () => {
    it('should default to Overview tab', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const overviewTab = screen.getByTestId('tab-overview')
      expect(overviewTab).toHaveAttribute('data-active', 'true')
    })

    it('should switch to Git tab when clicked', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      expect(gitTab).toHaveAttribute('data-active', 'true')
      expect(screen.getByTestId('tab-overview')).toHaveAttribute('data-active', 'false')
    })

    it('should switch to Logs tab when clicked', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const logsTab = screen.getByTestId('tab-logs')
      fireEvent.click(logsTab)

      // ASSERT
      expect(logsTab).toHaveAttribute('data-active', 'true')
    })

    it('should switch to Costs tab when clicked', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const costsTab = screen.getByTestId('tab-costs')
      fireEvent.click(costsTab)

      // ASSERT
      expect(costsTab).toHaveAttribute('data-active', 'true')
    })

    it('should highlight active tab with violet border', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const activeTab = screen.getByTestId('tab-overview')

      // ASSERT
      expect(activeTab).toHaveClass('border-b-2', 'border-violet-500')
    })

    it('should show inactive tabs with transparent border', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const gitTab = screen.getByTestId('tab-git')
      expect(gitTab).toHaveClass('border-transparent')
    })
  })

  describe('Overview tab', () => {
    it('should render project stats', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText('2')).toBeInTheDocument() // Active agents
      expect(screen.getByText('7/10')).toBeInTheDocument() // Issues
      expect(screen.getByText('$15.50')).toBeInTheDocument() // Monthly cost
    })

    it('should render progress percentage', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText(/65%/i)).toBeInTheDocument()
    })

    it('should render current task', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText('Implementing voice queue system')).toBeInTheDocument()
    })

    it('should render recent activity section', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument()
    })

    it('should show "No active tasks" for idle projects', () => {
      // ARRANGE
      const idleProject = { ...mockProject, status: 'idle' as const, currentTask: '' }

      // ACT
      render(<ProjectDetailPanel project={idleProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText('No active tasks')).toBeInTheDocument()
    })
  })

  describe('Git tab', () => {
    it('should fetch git log on mount', async () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // Switch to Git tab
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      await waitFor(() => {
        expect(tauri.getGitLog).toHaveBeenCalledWith('/test/path', 10)
      })
    })

    it('should display git commits', async () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('feat: Add new feature')).toBeInTheDocument()
      })
    })

    it('should display current branch', async () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/main/i)).toBeInTheDocument()
      })
    })

    it('should show commit author', async () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
      })
    })

    it('should show loading state while fetching', () => {
      // ARRANGE
      vi.mocked(tauri.getGitLog).mockImplementation(() => new Promise(() => {}))

      // ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show error state on fetch failure', async () => {
      // ARRANGE
      vi.mocked(tauri.getGitLog).mockRejectedValue(new Error('Git error'))

      // ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Logs tab', () => {
    it('should fetch telemetry logs on mount', async () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // Switch to Logs tab
      const logsTab = screen.getByTestId('tab-logs')
      fireEvent.click(logsTab)

      // ASSERT
      await waitFor(() => {
        expect(tauri.getTelemetryLogs).toHaveBeenCalledWith('Test Project', 50)
      })
    })

    it('should display log entries', async () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const logsTab = screen.getByTestId('tab-logs')
      fireEvent.click(logsTab)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/Starting work/i)).toBeInTheDocument()
      })
    })

    it('should have search/filter input', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const logsTab = screen.getByTestId('tab-logs')
      fireEvent.click(logsTab)

      // ASSERT
      expect(screen.getByTestId('log-filter-input')).toBeInTheDocument()
    })

    it('should filter logs based on search input', async () => {
      // ARRANGE
      vi.mocked(tauri.getTelemetryLogs).mockResolvedValue([
        '[2025-11-13 14:23:15] [Test Project] [INFO] Starting work',
        '[2025-11-13 14:23:16] [Test Project] [ERROR] Failed to load',
      ])

      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      const logsTab = screen.getByTestId('tab-logs')
      fireEvent.click(logsTab)

      await waitFor(() => {
        expect(screen.getByText(/Starting work/i)).toBeInTheDocument()
      })

      // ACT
      const filterInput = screen.getByTestId('log-filter-input')
      fireEvent.change(filterInput, { target: { value: 'ERROR' } })

      // ASSERT
      expect(screen.queryByText(/Starting work/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    })

    it('should show monospace font for logs', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const logsTab = screen.getByTestId('tab-logs')
      fireEvent.click(logsTab)

      // ASSERT
      const logsContainer = screen.getByTestId('logs-container')
      expect(logsContainer).toHaveClass('font-mono')
    })
  })

  describe('Costs tab', () => {
    it('should display daily cost chart', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const costsTab = screen.getByTestId('tab-costs')
      fireEvent.click(costsTab)

      // ASSERT
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should display total monthly cost', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const costsTab = screen.getByTestId('tab-costs')
      fireEvent.click(costsTab)

      // ASSERT
      expect(screen.getByText(/\$15\.50/i)).toBeInTheDocument()
    })

    it('should show cost breakdown by provider', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const costsTab = screen.getByTestId('tab-costs')
      fireEvent.click(costsTab)

      // ASSERT
      expect(screen.getByTestId('cost-breakdown')).toBeInTheDocument()
    })
  })

  describe('animations', () => {
    it('should have slide-in animation class', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('animate-slide-in-right')
    })

    it('should have transition classes', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('transition-transform')
    })
  })

  describe('styling', () => {
    it('should use dark charcoal background', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('bg-[#18181B]')
    })

    it('should have subtle border', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('border-l', 'border-[#27272A]')
    })

    it('should position fixed on right side', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('fixed', 'right-0', 'top-0')
    })

    it('should have full height', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('h-screen')
    })

    it('should have responsive width', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveClass('w-full', 'md:w-2/3', 'lg:w-1/2')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA role', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveAttribute('role', 'dialog')
    })

    it('should have aria-modal attribute', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby pointing to header', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      expect(panel).toHaveAttribute('aria-labelledby', 'panel-header')
    })

    it('should trap focus within panel', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const panel = screen.getByTestId('project-detail-panel')
      const closeButton = screen.getByTestId('close-button')

      // Panel should contain focusable elements
      expect(panel).toContainElement(closeButton)
    })

    it('should support Escape key to close', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should have proper tab navigation order', () => {
      // ARRANGE & ACT
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const tabs = [
        screen.getByTestId('tab-overview'),
        screen.getByTestId('tab-git'),
        screen.getByTestId('tab-logs'),
        screen.getByTestId('tab-costs'),
      ]

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('role', 'tab')
      })
    })

    it('should announce tab panel changes to screen readers', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)

      // ASSERT
      const tabPanel = screen.getByTestId('tab-panel')
      expect(tabPanel).toHaveAttribute('role', 'tabpanel')
      expect(tabPanel).toHaveAttribute('aria-labelledby', 'tab-git')
    })
  })

  describe('keyboard navigation', () => {
    it('should navigate to next tab with ArrowRight', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const overviewTab = screen.getByTestId('tab-overview')
      overviewTab.focus()
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight', code: 'ArrowRight' })

      // ASSERT
      const gitTab = screen.getByTestId('tab-git')
      expect(gitTab).toHaveAttribute('data-active', 'true')
    })

    it('should navigate to previous tab with ArrowLeft', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const gitTab = screen.getByTestId('tab-git')
      fireEvent.click(gitTab)
      fireEvent.keyDown(gitTab, { key: 'ArrowLeft', code: 'ArrowLeft' })

      // ASSERT
      const overviewTab = screen.getByTestId('tab-overview')
      expect(overviewTab).toHaveAttribute('data-active', 'true')
    })

    it('should wrap around when navigating past last tab', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const costsTab = screen.getByTestId('tab-costs')
      fireEvent.click(costsTab)
      fireEvent.keyDown(costsTab, { key: 'ArrowRight', code: 'ArrowRight' })

      // ASSERT
      const overviewTab = screen.getByTestId('tab-overview')
      expect(overviewTab).toHaveAttribute('data-active', 'true')
    })

    it('should wrap around when navigating before first tab', () => {
      // ARRANGE
      render(<ProjectDetailPanel project={mockProject} isOpen={true} onClose={mockOnClose} />)

      // ACT
      const overviewTab = screen.getByTestId('tab-overview')
      fireEvent.keyDown(overviewTab, { key: 'ArrowLeft', code: 'ArrowLeft' })

      // ASSERT
      const costsTab = screen.getByTestId('tab-costs')
      expect(costsTab).toHaveAttribute('data-active', 'true')
    })
  })
})
