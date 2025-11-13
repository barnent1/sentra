import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewProjectModal } from '@/components/NewProjectModal'
import * as tauri from '@/lib/tauri'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  createProject: vi.fn(),
  selectDirectory: vi.fn(),
  getTemplates: vi.fn(),
}))

describe('NewProjectModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock getTemplates to return default templates
    vi.mocked(tauri.getTemplates).mockResolvedValue([
      {
        id: 'nextjs',
        name: 'Next.js',
        description: 'React framework with App Router, TypeScript, and Tailwind CSS',
        files: [],
        directories: [],
      },
      {
        id: 'python',
        name: 'Python (FastAPI)',
        description: 'Modern Python API with FastAPI, async support, and type hints',
        files: [],
        directories: [],
      },
      {
        id: 'react',
        name: 'React (Vite)',
        description: 'Fast React development with Vite, TypeScript, and Tailwind CSS',
        files: [],
        directories: [],
      },
    ])
  })

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      // ARRANGE & ACT
      const { container } = render(
        <NewProjectModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      )

      // ASSERT
      expect(container.firstChild).toBeNull()
    })

    it('should render when isOpen is true', () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
    })

    it('should render form fields', () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Project Path/i)).toBeInTheDocument()
      expect(screen.getByText('Template')).toBeInTheDocument()
    })

    it('should render Next.js template option', async () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT - Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('Next.js')).toBeInTheDocument()
      })
    })

    it('should have Browse button for path selection', () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      expect(screen.getByText('Browse...')).toBeInTheDocument()
    })

    it('should render Create and Cancel buttons', () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('should disable Create button when name is empty', () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      expect(createButton).toBeDisabled()
    })

    it('should disable Create button when path is empty', async () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const nameInput = screen.getByLabelText(/Project Name/i)
      fireEvent.change(nameInput, { target: { value: 'My Project' } })

      // ASSERT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      expect(createButton).toBeDisabled()
    })

    it('should enable Create button when all required fields are filled', async () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'my-project' } })
      fireEvent.change(pathInput, { target: { value: '/Users/test/projects/my-project' } })

      // ASSERT
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /Create Project/i })
        expect(createButton).not.toBeDisabled()
      })
    })

    it('should show validation error for invalid project name', async () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const nameInput = screen.getByLabelText(/Project Name/i)
      fireEvent.change(nameInput, { target: { value: 'Invalid Name!' } }) // Contains special char
      fireEvent.blur(nameInput)

      // ASSERT
      await waitFor(() => {
        expect(
          screen.getByText(/Project name can only contain letters, numbers, hyphens, and underscores/i)
        ).toBeInTheDocument()
      })
    })

    it('should accept valid project names', async () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const nameInput = screen.getByLabelText(/Project Name/i)
      const validNames = ['my-project', 'my_project', 'MyProject123']

      for (const name of validNames) {
        fireEvent.change(nameInput, { target: { value: name } })
        fireEvent.blur(nameInput)

        // ASSERT
        await waitFor(() => {
          expect(
            screen.queryByText(/Project name can only contain/i)
          ).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('path selection', () => {
    it('should open directory picker when Browse is clicked', async () => {
      // ARRANGE
      vi.mocked(tauri.selectDirectory).mockResolvedValue('/Users/test/projects')

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const browseButton = screen.getByText('Browse...')
      fireEvent.click(browseButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.selectDirectory).toHaveBeenCalled()
      })
    })

    it('should update path field when directory is selected', async () => {
      // ARRANGE
      vi.mocked(tauri.selectDirectory).mockResolvedValue('/Users/test/projects')

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      fireEvent.change(nameInput, { target: { value: 'my-project' } })

      // ACT
      const browseButton = screen.getByText('Browse...')
      fireEvent.click(browseButton)

      // ASSERT
      await waitFor(() => {
        const pathInput = screen.getByLabelText(/Project Path/i) as HTMLInputElement
        expect(pathInput.value).toBe('/Users/test/projects/my-project')
      })
    })

    it('should handle directory picker cancellation', async () => {
      // ARRANGE
      vi.mocked(tauri.selectDirectory).mockResolvedValue(null)

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const pathInput = screen.getByLabelText(/Project Path/i) as HTMLInputElement
      const originalPath = pathInput.value

      // ACT
      const browseButton = screen.getByText('Browse...')
      fireEvent.click(browseButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.selectDirectory).toHaveBeenCalled()
      })

      expect(pathInput.value).toBe(originalPath) // Path should not change
    })
  })

  describe('template selection', () => {
    it('should have Next.js selected by default', async () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT - Wait for templates to load
      await waitFor(() => {
        const nextjsRadio = screen.getByDisplayValue('nextjs') as HTMLInputElement
        expect(nextjsRadio.checked).toBe(true)
      })
    })

    it('should allow selecting different template', async () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // Wait for templates to load first
      await waitFor(() => {
        expect(screen.getByDisplayValue('nextjs')).toBeInTheDocument()
      })

      // ACT
      const nextjsRadio = screen.getByDisplayValue('nextjs') as HTMLInputElement
      fireEvent.click(nextjsRadio)

      // ASSERT
      expect(nextjsRadio.checked).toBe(true)
    })
  })

  describe('project creation', () => {
    it('should create project when form is submitted', async () => {
      // ARRANGE
      const mockProject = {
        name: 'my-project',
        path: '/Users/test/projects/my-project',
      }

      vi.mocked(tauri.createProject).mockResolvedValue(mockProject)

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'my-project' } })
      fireEvent.change(pathInput, { target: { value: '/Users/test/projects/my-project' } })

      // ACT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      fireEvent.click(createButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.createProject).toHaveBeenCalledWith({
          name: 'my-project',
          path: '/Users/test/projects/my-project',
          template: 'nextjs',
        })
      })
    })

    it('should show creating state during project creation', async () => {
      // ARRANGE
      vi.mocked(tauri.createProject).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'my-project' } })
      fireEvent.change(pathInput, { target: { value: '/Users/test/projects/my-project' } })

      // ACT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      fireEvent.click(createButton)

      // ASSERT
      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(createButton).toBeDisabled()
    })

    it('should call onSuccess when project is created successfully', async () => {
      // ARRANGE
      const mockProject = {
        name: 'my-project',
        path: '/Users/test/projects/my-project',
      }

      vi.mocked(tauri.createProject).mockResolvedValue(mockProject)

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'my-project' } })
      fireEvent.change(pathInput, { target: { value: '/Users/test/projects/my-project' } })

      // ACT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      fireEvent.click(createButton)

      // ASSERT
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should close modal after successful creation', async () => {
      // ARRANGE
      const mockProject = {
        name: 'my-project',
        path: '/Users/test/projects/my-project',
      }

      vi.mocked(tauri.createProject).mockResolvedValue(mockProject)

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'my-project' } })
      fireEvent.change(pathInput, { target: { value: '/Users/test/projects/my-project' } })

      // ACT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      fireEvent.click(createButton)

      // ASSERT
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should handle creation error', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(tauri.createProject).mockRejectedValue(new Error('Directory already exists'))

      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'my-project' } })
      fireEvent.change(pathInput, { target: { value: '/Users/test/projects/my-project' } })

      // ACT
      const createButton = screen.getByRole('button', { name: /Create Project/i })
      fireEvent.click(createButton)

      // ASSERT
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to create project')
        )
      })

      expect(mockOnClose).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })
  })

  describe('modal interactions', () => {
    it('should close modal when Cancel is clicked', () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when X button is clicked', () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT
      const closeButton = screen.getAllByRole('button')[0] // X button
      fireEvent.click(closeButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should reset form when modal is reopened', async () => {
      // ARRANGE
      const { rerender } = render(
        <NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      )

      const nameInput = screen.getByLabelText(/Project Name/i) as HTMLInputElement
      const pathInput = screen.getByLabelText(/Project Path/i) as HTMLInputElement

      fireEvent.change(nameInput, { target: { value: 'test-project' } })
      fireEvent.change(pathInput, { target: { value: '/test/path' } })

      // Close modal
      rerender(<NewProjectModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ACT: Reopen modal
      rerender(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      await waitFor(() => {
        const newNameInput = screen.getByLabelText(/Project Name/i) as HTMLInputElement
        const newPathInput = screen.getByLabelText(/Project Path/i) as HTMLInputElement

        expect(newNameInput.value).toBe('')
        expect(newPathInput.value).toBe('')
      })
    })
  })

  describe('styling', () => {
    it('should have dark theme background', () => {
      // ARRANGE & ACT
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      // ASSERT
      const modal = screen.getByText('Create New Project').closest('div')?.parentElement
      expect(modal).toHaveClass('bg-slate-900')
    })

    it('should have violet accent for Create button', () => {
      // ARRANGE
      render(<NewProjectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

      const nameInput = screen.getByLabelText(/Project Name/i)
      const pathInput = screen.getByLabelText(/Project Path/i)

      fireEvent.change(nameInput, { target: { value: 'test' } })
      fireEvent.change(pathInput, { target: { value: '/test' } })

      // ACT
      const createButton = screen.getByRole('button', { name: /Create Project/i })

      // ASSERT
      expect(createButton).toHaveClass('bg-violet-500')
    })
  })
})
