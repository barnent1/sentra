import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PrototypePanel } from '@/components/PrototypePanel'
import type { Prototype } from '@/services/sentra-api'
import * as sentraApi from '@/services/sentra-api'

// Mock the sentra-api module
vi.mock('@/services/sentra-api', () => ({
  getPrototypes: vi.fn(),
  iteratePrototype: vi.fn(),
}))

describe('PrototypePanel', () => {
  const mockPrototypes: Prototype[] = [
    {
      id: 'proto-1',
      projectId: 'project-1',
      v0ChatId: 'chat-1',
      v0DemoUrl: 'https://v0.dev/demo-1',
      deploymentUrl: 'https://project-1-prototype.sentra.app',
      deploymentStatus: 'ready',
      title: 'Dashboard Redesign',
      description: 'Modern dashboard with mission control design',
      specPath: '.sentra/specs/dashboard-spec.yml',
      files: null,
      version: 2,
      parentId: null,
      createdAt: new Date('2025-11-20T10:00:00Z'),
      updatedAt: new Date('2025-11-20T11:00:00Z'),
    },
    {
      id: 'proto-2',
      projectId: 'project-1',
      v0ChatId: 'chat-2',
      v0DemoUrl: 'https://v0.dev/demo-2',
      deploymentUrl: 'https://project-1-settings.sentra.app',
      deploymentStatus: 'deploying',
      title: 'Settings Modal',
      description: 'User settings with dark theme',
      specPath: '.sentra/specs/settings-spec.yml',
      files: null,
      version: 1,
      parentId: null,
      createdAt: new Date('2025-11-20T12:00:00Z'),
      updatedAt: new Date('2025-11-20T12:00:00Z'),
    },
    {
      id: 'proto-3',
      projectId: 'project-1',
      v0ChatId: 'chat-3',
      v0DemoUrl: 'https://v0.dev/demo-3',
      deploymentUrl: 'https://project-1-error.sentra.app',
      deploymentStatus: 'error',
      title: 'Login Form',
      description: 'Authentication flow',
      specPath: '.sentra/specs/login-spec.yml',
      files: null,
      version: 1,
      parentId: null,
      createdAt: new Date('2025-11-20T13:00:00Z'),
      updatedAt: new Date('2025-11-20T13:00:00Z'),
    },
  ]

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render empty state when no prototypes exist', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/no prototypes yet/i)).toBeInTheDocument()
      })
    })

    it('should render loading state while fetching prototypes', () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockImplementation(() => new Promise(() => {}))

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText(/loading prototypes/i)).toBeInTheDocument()
    })

    it('should render list of prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue(mockPrototypes)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Dashboard Redesign')).toBeInTheDocument()
        expect(screen.getByText('Settings Modal')).toBeInTheDocument()
        expect(screen.getByText('Login Form')).toBeInTheDocument()
      })
    })

    it('should render prototype descriptions', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue(mockPrototypes)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Modern dashboard with mission control design')).toBeInTheDocument()
      })
    })

    it('should render version numbers', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue(mockPrototypes)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const versionElements = screen.getAllByText(/v[0-9]+/i)
        expect(versionElements.length).toBeGreaterThan(0)
        expect(screen.getByText(/v2/i)).toBeInTheDocument()
        // Multiple prototypes can have v1, so we just check that at least one exists
        const v1Elements = screen.getAllByText(/^v1$/i)
        expect(v1Elements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('deployment status', () => {
    it('should show "Ready" badge for ready prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const readyBadge = screen.getByTestId('status-badge-ready')
        expect(readyBadge).toBeInTheDocument()
        expect(readyBadge).toHaveTextContent('Ready')
        expect(readyBadge).toHaveClass('bg-green-500/20')
      })
    })

    it('should show "Deploying" badge for deploying prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[1]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const deployingBadge = screen.getByTestId('status-badge-deploying')
        expect(deployingBadge).toBeInTheDocument()
        expect(deployingBadge).toHaveTextContent('Deploying')
        expect(deployingBadge).toHaveClass('bg-violet-500/20')
      })
    })

    it('should show "Error" badge for failed prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[2]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const errorBadge = screen.getByTestId('status-badge-error')
        expect(errorBadge).toBeInTheDocument()
        expect(errorBadge).toHaveTextContent('Error')
        expect(errorBadge).toHaveClass('bg-red-500/20')
      })
    })

    it('should show pending badge for pending prototypes', async () => {
      // ARRANGE
      const pendingPrototype: Prototype = {
        ...mockPrototypes[0],
        deploymentStatus: 'pending',
      }
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([pendingPrototype])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const pendingBadge = screen.getByTestId('status-badge-pending')
        expect(pendingBadge).toBeInTheDocument()
        expect(pendingBadge).toHaveTextContent('Pending')
      })
    })
  })

  describe('view prototype button', () => {
    it('should render View Prototype button for ready prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const viewButton = screen.getByTestId('view-prototype-btn')
        expect(viewButton).toBeInTheDocument()
        expect(viewButton).toHaveTextContent('View Prototype')
        expect(viewButton).not.toBeDisabled()
      })
    })

    it('should disable View Prototype button for deploying prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[1]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const viewButton = screen.getByTestId('view-prototype-btn')
        expect(viewButton).toBeDisabled()
      })
    })

    it('should disable View Prototype button for error prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[2]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const viewButton = screen.getByTestId('view-prototype-btn')
        expect(viewButton).toBeDisabled()
      })
    })

    it('should open prototype in new tab when clicked', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])
      const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        const viewButton = screen.getByTestId('view-prototype-btn')
        fireEvent.click(viewButton)
      })

      // ASSERT
      expect(mockWindowOpen).toHaveBeenCalledWith('https://project-1-prototype.sentra.app', '_blank', 'noopener,noreferrer')

      mockWindowOpen.mockRestore()
    })
  })

  describe('iterate button', () => {
    it('should render Iterate button for all prototypes', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const iterateButton = screen.getByTestId('iterate-btn')
        expect(iterateButton).toBeInTheDocument()
        expect(iterateButton).toHaveTextContent('Iterate')
      })
    })

    it('should open iterate modal when clicked', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        const iterateButton = screen.getByTestId('iterate-btn')
        fireEvent.click(iterateButton)
      })

      // ASSERT
      expect(screen.getByTestId('iterate-modal')).toBeInTheDocument()
      expect(screen.getByText(/provide feedback/i)).toBeInTheDocument()
    })

    it('should render feedback textarea in modal', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('iterate-btn'))
      })

      // ASSERT
      expect(screen.getByTestId('feedback-textarea')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/describe the changes/i)).toBeInTheDocument()
    })

    it('should submit iteration feedback', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])
      vi.mocked(sentraApi.iteratePrototype).mockResolvedValue(undefined)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('iterate-btn'))
      })

      const textarea = screen.getByTestId('feedback-textarea')
      fireEvent.change(textarea, { target: { value: 'Move sidebar to left side' } })

      const submitButton = screen.getByTestId('submit-iteration-btn')
      fireEvent.click(submitButton)

      // ASSERT
      await waitFor(() => {
        expect(sentraApi.iteratePrototype).toHaveBeenCalledWith('proto-1', 'Move sidebar to left side')
      })
    })

    it('should close modal after successful iteration', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])
      vi.mocked(sentraApi.iteratePrototype).mockResolvedValue(undefined)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('iterate-btn'))
      })

      fireEvent.change(screen.getByTestId('feedback-textarea'), {
        target: { value: 'Move sidebar to left side' }
      })

      fireEvent.click(screen.getByTestId('submit-iteration-btn'))

      // ASSERT
      await waitFor(() => {
        expect(screen.queryByTestId('iterate-modal')).not.toBeInTheDocument()
      })
    })

    it('should disable submit button when feedback is empty', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('iterate-btn'))
      })

      // ASSERT
      const submitButton = screen.getByTestId('submit-iteration-btn')
      expect(submitButton).toBeDisabled()
    })

    it('should close modal when cancel button is clicked', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('iterate-btn'))
      })

      const cancelButton = screen.getByTestId('cancel-iteration-btn')
      fireEvent.click(cancelButton)

      // ASSERT
      expect(screen.queryByTestId('iterate-modal')).not.toBeInTheDocument()
    })
  })

  describe('panel behavior', () => {
    it('should not render when isOpen is false', () => {
      // ARRANGE & ACT
      render(<PrototypePanel projectId="project-1" isOpen={false} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.queryByTestId('prototype-panel')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByTestId('prototype-panel')).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      const closeButton = screen.getByTestId('close-panel-btn')
      fireEvent.click(closeButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      const backdrop = screen.getByTestId('panel-backdrop')
      fireEvent.click(backdrop)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close when Escape key is pressed', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('should use dark theme colors', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const panel = screen.getByTestId('prototype-panel')
        expect(panel).toHaveClass('bg-[#18181B]')
      })
    })

    it('should have proper border styling', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const panel = screen.getByTestId('prototype-panel')
        expect(panel).toHaveClass('border-l')
        expect(panel).toHaveClass('border-[#27272A]')
      })
    })
  })

  describe('error handling', () => {
    it('should show error message when fetch fails', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockRejectedValue(new Error('Network error'))

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/failed to load prototypes/i)).toBeInTheDocument()
      })
    })

    it('should show error message when iteration fails', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])
      vi.mocked(sentraApi.iteratePrototype).mockRejectedValue(new Error('API error'))

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('iterate-btn'))
      })

      fireEvent.change(screen.getByTestId('feedback-textarea'), {
        target: { value: 'Some feedback' }
      })

      fireEvent.click(screen.getByTestId('submit-iteration-btn'))

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/failed to submit iteration/i)).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([mockPrototypes[0]])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const panel = screen.getByTestId('prototype-panel')
        expect(panel).toHaveAttribute('role', 'dialog')
        expect(panel).toHaveAttribute('aria-modal', 'true')
        expect(panel).toHaveAttribute('aria-labelledby')
      })
    })

    it('should have accessible close button', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue([])

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      const closeButton = screen.getByTestId('close-panel-btn')
      expect(closeButton).toHaveAttribute('aria-label', 'Close prototype panel')
    })
  })

  describe('sorting', () => {
    it('should sort prototypes by creation date (newest first)', async () => {
      // ARRANGE
      vi.mocked(sentraApi.getPrototypes).mockResolvedValue(mockPrototypes)

      // ACT
      render(<PrototypePanel projectId="project-1" isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        const titles = screen.getAllByTestId(/^prototype-title-/)
        expect(titles[0]).toHaveTextContent('Login Form') // Newest
        expect(titles[1]).toHaveTextContent('Settings Modal')
        expect(titles[2]).toHaveTextContent('Dashboard Redesign') // Oldest
      })
    })
  })
})
