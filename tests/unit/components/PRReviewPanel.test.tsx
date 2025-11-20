import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PRReviewPanel } from '@/components/PRReviewPanel'
import * as tauri from '@/services/sentra-api'

// Mock the tauri module
vi.mock('@/services/sentra-api', () => ({
  getPullRequest: vi.fn(),
  getPRDiff: vi.fn(),
  approvePullRequest: vi.fn(),
  requestChangesPullRequest: vi.fn(),
  mergePullRequest: vi.fn(),
}))

describe('PRReviewPanel', () => {
  const mockOnClose = vi.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    owner: 'testowner',
    repo: 'testrepo',
    prNumber: 123,
  }

  const mockPRData: tauri.PullRequestData = {
    pr: {
      number: 123,
      title: 'feat: Add new feature',
      body: 'This PR adds a new feature',
      state: 'open',
      author: 'testauthor',
      createdAt: '2025-11-13T10:00:00Z',
      updatedAt: '2025-11-13T11:00:00Z',
      headBranch: 'feature/new-feature',
      baseBranch: 'main',
      mergeable: true,
      url: 'https://github.com/testowner/testrepo/pull/123',
      checksStatus: 'success',
    },
    comments: [
      {
        id: 1,
        author: 'reviewer',
        body: 'LGTM',
        createdAt: '2025-11-13T12:00:00Z',
      },
    ],
  }

  const mockDiff = `diff --git a/src/test.ts b/src/test.ts
index abc123..def456 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,4 @@
 export function test() {
+  console.log('new line');
   return true;
 }`

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tauri.getPullRequest).mockResolvedValue(mockPRData)
    vi.mocked(tauri.getPRDiff).mockResolvedValue(mockDiff)
    vi.mocked(tauri.approvePullRequest).mockResolvedValue()
    vi.mocked(tauri.requestChangesPullRequest).mockResolvedValue()
    vi.mocked(tauri.mergePullRequest).mockResolvedValue()
  })

  describe('rendering', () => {
    it('should render panel when isOpen is true', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      expect(screen.getByTestId('pr-review-panel')).toBeInTheDocument()
    })

    it('should not render panel when isOpen is false', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} isOpen={false} />)

      // ASSERT
      expect(screen.queryByTestId('pr-review-panel')).not.toBeInTheDocument()
    })

    it('should render close button', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      expect(screen.getByTestId('pr-close-button')).toBeInTheDocument()
    })

    it('should have dark background', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      const panel = screen.getByTestId('pr-review-panel')
      expect(panel).toHaveClass('bg-[#18181B]')
    })
  })

  describe('backdrop', () => {
    it('should render backdrop when panel is open', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      expect(screen.getByTestId('pr-backdrop')).toBeInTheDocument()
    })

    it('should close panel when backdrop is clicked', () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ACT
      const backdrop = screen.getByTestId('pr-backdrop')
      fireEvent.click(backdrop)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('data fetching', () => {
    it('should fetch PR data on mount', async () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(tauri.getPullRequest).toHaveBeenCalledWith('testowner', 'testrepo', 123)
      })
    })

    it('should fetch PR diff on mount', async () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(tauri.getPRDiff).toHaveBeenCalledWith('testowner', 'testrepo', 123)
      })
    })

    it('should show loading state while fetching', () => {
      // ARRANGE
      vi.mocked(tauri.getPullRequest).mockImplementation(() => new Promise(() => {}))

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show error state on fetch failure', async () => {
      // ARRANGE
      vi.mocked(tauri.getPullRequest).mockRejectedValue(new Error('Network error'))

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })

  describe('PR metadata display', () => {
    it('should display PR title', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('feat: Add new feature')).toBeInTheDocument()
      })
    })

    it('should display PR number', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/#123/)).toBeInTheDocument()
      })
    })

    it('should display PR author', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/testauthor/i)).toBeInTheDocument()
      })
    })

    it('should display branch information', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/feature\/new-feature/)).toBeInTheDocument()
        expect(screen.getByText(/main/)).toBeInTheDocument()
      })
    })

    it('should display PR body', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('This PR adds a new feature')).toBeInTheDocument()
      })
    })
  })

  describe('checks status', () => {
    it('should show success status with green indicator', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const statusIndicator = screen.getByTestId('checks-status')
        expect(statusIndicator).toHaveClass('bg-green-500')
      })
    })

    it('should show failure status with red indicator', async () => {
      // ARRANGE
      const failedPR = {
        ...mockPRData,
        pr: { ...mockPRData.pr, checksStatus: 'failure' },
      }
      vi.mocked(tauri.getPullRequest).mockResolvedValue(failedPR)

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const statusIndicator = screen.getByTestId('checks-status')
        expect(statusIndicator).toHaveClass('bg-red-500')
      })
    })

    it('should show pending status with yellow indicator', async () => {
      // ARRANGE
      const pendingPR = {
        ...mockPRData,
        pr: { ...mockPRData.pr, checksStatus: 'pending' },
      }
      vi.mocked(tauri.getPullRequest).mockResolvedValue(pendingPR)

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const statusIndicator = screen.getByTestId('checks-status')
        expect(statusIndicator).toHaveClass('bg-yellow-500')
      })
    })
  })

  describe('diff viewer', () => {
    it('should display diff content', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByTestId('diff-viewer')).toBeInTheDocument()
      })
    })

    it('should show diff with monospace font', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const diffViewer = screen.getByTestId('diff-viewer')
        expect(diffViewer).toHaveClass('font-mono')
      })
    })

    it('should display file path in diff', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/src\/test\.ts/)).toBeInTheDocument()
      })
    })
  })

  describe('review comments', () => {
    it('should display review comments section', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByTestId('review-comments')).toBeInTheDocument()
      })
    })

    it('should show reviewer comments', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('LGTM')).toBeInTheDocument()
        expect(screen.getByText(/reviewer/)).toBeInTheDocument()
      })
    })

    it('should show empty state when no comments', async () => {
      // ARRANGE
      const prWithNoComments = {
        ...mockPRData,
        comments: [],
      }
      vi.mocked(tauri.getPullRequest).mockResolvedValue(prWithNoComments)

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/no review comments/i)).toBeInTheDocument()
      })
    })
  })

  describe('approve button', () => {
    it('should render approve button', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByTestId('approve-button')).toBeInTheDocument()
      })
    })

    it('should call approvePullRequest when approve button clicked', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('approve-button')).toBeInTheDocument()
      })

      // ACT
      const approveButton = screen.getByTestId('approve-button')
      fireEvent.click(approveButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.approvePullRequest).toHaveBeenCalledWith('testowner', 'testrepo', 123)
      })
    })

    it('should show loading state while approving', async () => {
      // ARRANGE
      vi.mocked(tauri.approvePullRequest).mockImplementation(() => new Promise(() => {}))
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('approve-button')).toBeInTheDocument()
      })

      // ACT
      const approveButton = screen.getByTestId('approve-button')
      fireEvent.click(approveButton)

      // ASSERT
      expect(approveButton).toBeDisabled()
      expect(screen.getByText(/approving/i)).toBeInTheDocument()
    })

    it('should have violet background', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const approveButton = screen.getByTestId('approve-button')
        expect(approveButton).toHaveClass('bg-violet-500')
      })
    })
  })

  describe('request changes button', () => {
    it('should render request changes button', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByTestId('request-changes-button')).toBeInTheDocument()
      })
    })

    it('should show comment textarea when request changes clicked', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('request-changes-button')).toBeInTheDocument()
      })

      // ACT
      const requestChangesButton = screen.getByTestId('request-changes-button')
      fireEvent.click(requestChangesButton)

      // ASSERT
      expect(screen.getByTestId('changes-comment-textarea')).toBeInTheDocument()
    })

    it('should call requestChangesPullRequest with comment', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('request-changes-button')).toBeInTheDocument()
      })

      // ACT
      const requestChangesButton = screen.getByTestId('request-changes-button')
      fireEvent.click(requestChangesButton)

      const textarea = screen.getByTestId('changes-comment-textarea')
      fireEvent.change(textarea, { target: { value: 'Please fix the tests' } })

      const submitButton = screen.getByTestId('submit-changes-button')
      fireEvent.click(submitButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.requestChangesPullRequest).toHaveBeenCalledWith('testowner', 'testrepo', 123, 'Please fix the tests')
      })
    })

    it('should require comment for requesting changes', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('request-changes-button')).toBeInTheDocument()
      })

      // ACT
      const requestChangesButton = screen.getByTestId('request-changes-button')
      fireEvent.click(requestChangesButton)

      const submitButton = screen.getByTestId('submit-changes-button')

      // ASSERT
      expect(submitButton).toBeDisabled()
    })
  })

  describe('merge button', () => {
    it('should render merge button', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByTestId('merge-button')).toBeInTheDocument()
      })
    })

    it('should show merge method options when clicked', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('merge-button')).toBeInTheDocument()
      })

      // ACT
      const mergeButton = screen.getByTestId('merge-button')
      fireEvent.click(mergeButton)

      // ASSERT
      expect(screen.getByTestId('merge-method-squash')).toBeInTheDocument()
      expect(screen.getByTestId('merge-method-merge')).toBeInTheDocument()
      expect(screen.getByTestId('merge-method-rebase')).toBeInTheDocument()
    })

    it('should call mergePullRequest with squash method', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTestId('merge-button')).toBeInTheDocument()
      })

      // ACT
      const mergeButton = screen.getByTestId('merge-button')
      fireEvent.click(mergeButton)

      const squashOption = screen.getByTestId('merge-method-squash')
      fireEvent.click(squashOption)

      // ASSERT
      await waitFor(() => {
        expect(tauri.mergePullRequest).toHaveBeenCalledWith('testowner', 'testrepo', 123, 'squash')
      })
    })

    it('should disable merge button when PR not mergeable', async () => {
      // ARRANGE
      const unmergablePR = {
        ...mockPRData,
        pr: { ...mockPRData.pr, mergeable: false },
      }
      vi.mocked(tauri.getPullRequest).mockResolvedValue(unmergablePR)

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const mergeButton = screen.getByTestId('merge-button')
        expect(mergeButton).toBeDisabled()
      })
    })

    it('should disable merge button when checks failing', async () => {
      // ARRANGE
      const failedChecksPR = {
        ...mockPRData,
        pr: { ...mockPRData.pr, checksStatus: 'failure' },
      }
      vi.mocked(tauri.getPullRequest).mockResolvedValue(failedChecksPR)

      // ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const mergeButton = screen.getByTestId('merge-button')
        expect(mergeButton).toBeDisabled()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA role', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      const panel = screen.getByTestId('pr-review-panel')
      expect(panel).toHaveAttribute('role', 'dialog')
    })

    it('should have aria-modal attribute', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      const panel = screen.getByTestId('pr-review-panel')
      expect(panel).toHaveAttribute('aria-modal', 'true')
    })

    it('should support Escape key to close', () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ACT
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('should use true dark theme background', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      const panel = screen.getByTestId('pr-review-panel')
      expect(panel).toHaveClass('bg-[#18181B]')
    })

    it('should have violet accents on buttons', async () => {
      // ARRANGE
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      await waitFor(() => {
        const approveButton = screen.getByTestId('approve-button')
        expect(approveButton).toHaveClass('bg-violet-500')
      })
    })

    it('should be positioned as overlay', () => {
      // ARRANGE & ACT
      render(<PRReviewPanel {...defaultProps} />)

      // ASSERT
      const panel = screen.getByTestId('pr-review-panel')
      expect(panel).toHaveClass('fixed', 'inset-0', 'z-50')
    })
  })
})
