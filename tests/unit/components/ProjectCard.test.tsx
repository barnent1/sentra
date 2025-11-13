import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/lib/tauri'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  setProjectMuted: vi.fn(),
}))

describe('ProjectCard', () => {
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

  const mockOnMuteToggle = vi.fn()
  const mockOnViewDetails = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render project name', () => {
      // ARRANGE & ACT
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project')
    })

    it('should render current task when project is active', () => {
      // ARRANGE & ACT
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByText('Implementing voice queue system')).toBeInTheDocument()
    })

    it('should render "No active tasks" when project is idle', () => {
      // ARRANGE
      const idleProject = { ...mockProject, status: 'idle' as const, currentTask: '' }

      // ACT
      render(<ProjectCard project={idleProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByText('No active tasks')).toBeInTheDocument()
    })

    it('should render progress percentage', () => {
      // ARRANGE & ACT
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByTestId('progress-text')).toHaveTextContent('65%')
    })

    it('should render stats (issues and cost)', () => {
      // ARRANGE & ACT
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByText(/7\/10 issues completed/i)).toBeInTheDocument()
      expect(screen.getByText(/\$15\.50 this month/i)).toBeInTheDocument()
    })
  })

  describe('status indicator', () => {
    it('should show green pulsing dot for active status', () => {
      // ARRANGE
      const activeProject = { ...mockProject, status: 'active' as const }

      // ACT
      render(<ProjectCard project={activeProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const indicator = screen.getByTestId('status-indicator')
      expect(indicator).toHaveClass('bg-green-500')
      expect(indicator).toHaveClass('animate-pulse')
    })

    it('should show gray static dot for idle status', () => {
      // ARRANGE
      const idleProject = { ...mockProject, status: 'idle' as const }

      // ACT
      render(<ProjectCard project={idleProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const indicator = screen.getByTestId('status-indicator')
      expect(indicator).toHaveClass('bg-gray-500')
      expect(indicator).not.toHaveClass('animate-pulse')
    })

    it('should show red pulsing dot for error status', () => {
      // ARRANGE
      const errorProject = { ...mockProject, status: 'error' as const }

      // ACT
      render(<ProjectCard project={errorProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const indicator = screen.getByTestId('status-indicator')
      expect(indicator).toHaveClass('bg-red-500')
      expect(indicator).toHaveClass('animate-pulse')
    })

    it('should have proper ARIA label for active status', () => {
      // ARRANGE
      const activeProject = { ...mockProject, status: 'active' as const }

      // ACT
      render(<ProjectCard project={activeProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const indicator = screen.getByTestId('status-indicator')
      expect(indicator).toHaveAttribute('aria-label', 'Status: active')
    })

    it('should have proper ARIA label for idle status', () => {
      // ARRANGE
      const idleProject = { ...mockProject, status: 'idle' as const }

      // ACT
      render(<ProjectCard project={idleProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const indicator = screen.getByTestId('status-indicator')
      expect(indicator).toHaveAttribute('aria-label', 'Status: idle')
    })

    it('should have proper ARIA label for error status', () => {
      // ARRANGE
      const errorProject = { ...mockProject, status: 'error' as const }

      // ACT
      render(<ProjectCard project={errorProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const indicator = screen.getByTestId('status-indicator')
      expect(indicator).toHaveAttribute('aria-label', 'Status: error')
    })
  })

  describe('progress bar', () => {
    it('should render progress bar with correct width', () => {
      // ARRANGE & ACT
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveStyle({ width: '65%' })
    })

    it('should use violet color for active projects', () => {
      // ARRANGE
      const activeProject = { ...mockProject, status: 'active' as const }

      // ACT
      render(<ProjectCard project={activeProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveClass('bg-violet-600')
    })

    it('should use gray color for idle projects', () => {
      // ARRANGE
      const idleProject = { ...mockProject, status: 'idle' as const, progress: 0 }

      // ACT
      render(<ProjectCard project={idleProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveClass('bg-gray-600')
    })

    it('should handle 0% progress', () => {
      // ARRANGE
      const noProgressProject = { ...mockProject, progress: 0 }

      // ACT
      render(<ProjectCard project={noProgressProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveStyle({ width: '0%' })
      expect(screen.getByTestId('progress-text')).toHaveTextContent('0%')
    })

    it('should handle 100% progress', () => {
      // ARRANGE
      const completeProject = { ...mockProject, progress: 100 }

      // ACT
      render(<ProjectCard project={completeProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const progressFill = screen.getByTestId('progress-fill')
      expect(progressFill).toHaveStyle({ width: '100%' })
      expect(screen.getByTestId('progress-text')).toHaveTextContent('100%')
    })
  })

  describe('mute button', () => {
    it('should render mute button', () => {
      // ARRANGE & ACT
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const muteButton = screen.getByTestId('mute-button')
      expect(muteButton).toBeInTheDocument()
    })

    it('should show unmuted icon when not muted', () => {
      // ARRANGE
      const unmutedProject = { ...mockProject, muted: false }

      // ACT
      render(<ProjectCard project={unmutedProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const muteButton = screen.getByTestId('mute-button')
      expect(muteButton).toHaveAttribute('data-muted', 'false')
      expect(muteButton).toHaveAttribute('aria-label', 'Mute notifications for Test Project')
    })

    it('should show muted icon when muted', () => {
      // ARRANGE
      const mutedProject = { ...mockProject, muted: true }

      // ACT
      render(<ProjectCard project={mutedProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const muteButton = screen.getByTestId('mute-button')
      expect(muteButton).toHaveAttribute('data-muted', 'true')
      expect(muteButton).toHaveAttribute('aria-label', 'Unmute notifications for Test Project')
    })

    it('should call onMuteToggle when clicked', () => {
      // ARRANGE
      render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ACT
      const muteButton = screen.getByTestId('mute-button')
      fireEvent.click(muteButton)

      // ASSERT
      expect(mockOnMuteToggle).toHaveBeenCalledWith('Test Project', true)
    })

    it('should toggle mute state on click', () => {
      // ARRANGE
      const mutedProject = { ...mockProject, muted: true }
      render(<ProjectCard project={mutedProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ACT
      const muteButton = screen.getByTestId('mute-button')
      fireEvent.click(muteButton)

      // ASSERT
      expect(mockOnMuteToggle).toHaveBeenCalledWith('Test Project', false)
    })
  })

  describe('styling', () => {
    it('should have dark charcoal background', () => {
      // ARRANGE & ACT
      const { container } = render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-[#18181B]')
    })

    it('should have subtle border', () => {
      // ARRANGE & ACT
      const { container } = render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('border-[#27272A]')
    })

    it('should have rounded corners', () => {
      // ARRANGE & ACT
      const { container } = render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('rounded-lg')
    })

    it('should have proper padding', () => {
      // ARRANGE & ACT
      const { container } = render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('p-5')
    })

    it('should have hover transition', () => {
      // ARRANGE & ACT
      const { container } = render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('transition-all')
    })

    it('should have proper data attributes for testing', () => {
      // ARRANGE & ACT
      const { container } = render(<ProjectCard project={mockProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const card = container.firstChild as HTMLElement
      expect(card).toHaveAttribute('data-testid', 'project-card')
      expect(card).toHaveAttribute('data-status', 'active')
      expect(card).toHaveAttribute('data-project-name', 'Test Project')
    })
  })

  describe('truncation', () => {
    it('should truncate long task names with ellipsis', () => {
      // ARRANGE
      const longTaskProject = {
        ...mockProject,
        currentTask: 'This is a very long task name that should be truncated with an ellipsis because it is too long to fit in one line',
      }

      // ACT
      render(<ProjectCard project={longTaskProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const taskElement = screen.getByTestId('current-task')
      expect(taskElement).toHaveClass('truncate')
    })

    it('should show full task name in title attribute', () => {
      // ARRANGE
      const longTaskProject = {
        ...mockProject,
        currentTask: 'This is a very long task name that should be truncated',
      }

      // ACT
      render(<ProjectCard project={longTaskProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      const taskElement = screen.getByTestId('current-task')
      expect(taskElement).toHaveAttribute('title', 'This is a very long task name that should be truncated')
    })
  })

  describe('active agents display', () => {
    it('should show active agent count when greater than 0', () => {
      // ARRANGE
      const activeProject = { ...mockProject, activeAgents: 3 }

      // ACT
      render(<ProjectCard project={activeProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByText('3 active agents')).toBeInTheDocument()
    })

    it('should not show agent count when 0', () => {
      // ARRANGE
      const idleProject = { ...mockProject, activeAgents: 0 }

      // ACT
      render(<ProjectCard project={idleProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.queryByText(/active agents/i)).not.toBeInTheDocument()
    })

    it('should show singular "agent" when count is 1', () => {
      // ARRANGE
      const singleAgentProject = { ...mockProject, activeAgents: 1 }

      // ACT
      render(<ProjectCard project={singleAgentProject} onMuteToggle={mockOnMuteToggle} onViewDetails={mockOnViewDetails} />)

      // ASSERT
      expect(screen.getByText('1 active agent')).toBeInTheDocument()
    })
  })
})
