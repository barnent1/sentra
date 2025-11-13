import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpecViewer } from '@/components/SpecViewer'

describe('SpecViewer', () => {
  const mockOnClose = vi.fn()
  const mockOnApprove = vi.fn()
  const mockOnReject = vi.fn()

  const mockSpec = `# Test Specification

## Overview
This is a test specification for testing the SpecViewer component.

## Features
- Feature 1
- Feature 2
- Feature 3

## Implementation
\`\`\`typescript
const test = () => {
  console.log('hello');
};
\`\`\`

**Bold text** and *italic text* should be rendered.`

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      // ARRANGE & ACT
      const { container } = render(
        <SpecViewer
          isOpen={false}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(container.firstChild).toBeNull()
    })

    it('should render when isOpen is true', () => {
      // ARRANGE & ACT
      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(screen.getByText('Specification Review')).toBeInTheDocument()
      expect(screen.getByText('test-project')).toBeInTheDocument()
    })

    it('should display the spec content', () => {
      // ARRANGE & ACT
      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(screen.getByText(/Test Specification/)).toBeInTheDocument()
      expect(screen.getByText(/This is a test specification/)).toBeInTheDocument()
    })

    it('should render approve and reject buttons', () => {
      // ARRANGE & ACT
      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(screen.getByText(/Approve & Create GitHub Issue/)).toBeInTheDocument()
      expect(screen.getByText(/Reject Specification/)).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('should call onClose when close button is clicked', () => {
      // ARRANGE
      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ACT
      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onApprove and onClose when approve button is clicked', async () => {
      // ARRANGE
      mockOnApprove.mockResolvedValue(undefined)

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ACT
      const approveButton = screen.getByText(/Approve & Create GitHub Issue/)
      fireEvent.click(approveButton)

      // ASSERT
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should call onReject and onClose when reject button is clicked', async () => {
      // ARRANGE
      mockOnReject.mockResolvedValue(undefined)

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ACT
      const rejectButton = screen.getByText(/Reject Specification/)
      fireEvent.click(rejectButton)

      // ASSERT
      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should show alert when approve fails', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      mockOnApprove.mockRejectedValue(new Error('Approval failed'))

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ACT
      const approveButton = screen.getByText(/Approve & Create GitHub Issue/)
      fireEvent.click(approveButton)

      // ASSERT
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to approve spec. Please try again.'
        )
      })

      alertSpy.mockRestore()
    })

    it('should show alert when reject fails', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      mockOnReject.mockRejectedValue(new Error('Rejection failed'))

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ACT
      const rejectButton = screen.getByText(/Reject Specification/)
      fireEvent.click(rejectButton)

      // ASSERT
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to reject spec. Please try again.'
        )
      })

      alertSpy.mockRestore()
    })

    it('should not close modal when approve fails', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      mockOnApprove.mockRejectedValue(new Error('Approval failed'))

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={mockSpec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ACT
      const approveButton = screen.getByText(/Approve & Create GitHub Issue/)
      fireEvent.click(approveButton)

      // ASSERT
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalled()
      })

      expect(mockOnClose).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })
  })

  describe('markdown rendering', () => {
    it('should render markdown headers', () => {
      // ARRANGE & ACT
      const spec = '# Header 1\n## Header 2\n### Header 3'

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={spec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(screen.getByText(/Header 1/)).toBeInTheDocument()
      expect(screen.getByText(/Header 2/)).toBeInTheDocument()
      expect(screen.getByText(/Header 3/)).toBeInTheDocument()
    })

    it('should render markdown lists', () => {
      // ARRANGE & ACT
      const spec = '- Item 1\n- Item 2\n- Item 3'

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={spec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(screen.getByText(/Item 1/)).toBeInTheDocument()
      expect(screen.getByText(/Item 2/)).toBeInTheDocument()
      expect(screen.getByText(/Item 3/)).toBeInTheDocument()
    })

    it('should render code blocks', () => {
      // ARRANGE & ACT
      const spec = '```typescript\nconst test = "hello";\n```'

      render(
        <SpecViewer
          isOpen={true}
          onClose={mockOnClose}
          spec={spec}
          projectName="test-project"
          projectPath="/path/to/project"
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      )

      // ASSERT
      expect(screen.getByText(/const test/)).toBeInTheDocument()
    })
  })
})
