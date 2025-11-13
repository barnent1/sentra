import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Settings } from '@/components/Settings'
import * as tauri from '@/lib/tauri'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  speakNotification: vi.fn(),
}))

describe('Settings', () => {
  const mockSettings = {
    userName: 'Test User',
    voice: 'nova',
    openaiApiKey: 'sk-test-key',
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

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tauri.getSettings).mockResolvedValue(mockSettings)
    vi.mocked(tauri.saveSettings).mockResolvedValue(undefined)
    vi.mocked(tauri.speakNotification).mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      // ARRANGE & ACT
      const { container } = render(<Settings isOpen={false} onClose={mockOnClose} />)

      // ASSERT
      expect(container.firstChild).toBeNull()
    })

    it('should render when isOpen is true', async () => {
      // ARRANGE & ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      // ARRANGE & ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      expect(screen.getByText('Loading settings...')).toBeInTheDocument()
    })

    it('should load and display settings', async () => {
      // ARRANGE & ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(tauri.getSettings).toHaveBeenCalled()
      })

      const userNameInput = screen.getByPlaceholderText('e.g., Glen') as HTMLInputElement
      await waitFor(() => {
        expect(userNameInput.value).toBe('Test User')
      })
    })
  })

  describe('user interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const closeButton = screen.getAllByRole('button')[0] // X button
      fireEvent.click(closeButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when cancel button is clicked', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should update userName when input changes', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const userNameInput = screen.getByPlaceholderText('e.g., Glen') as HTMLInputElement
      fireEvent.change(userNameInput, { target: { value: 'New Name' } })

      // ASSERT
      expect(userNameInput.value).toBe('New Name')
    })

    it('should update OpenAI API key when input changes', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const apiKeyInput = screen.getByPlaceholderText('sk-proj-...') as HTMLInputElement
      fireEvent.change(apiKeyInput, { target: { value: 'sk-new-key' } })

      // ASSERT
      expect(apiKeyInput.value).toBe('sk-new-key')
    })

    it('should update Anthropic API key when input changes', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const apiKeyInput = screen.getByPlaceholderText('sk-ant-api03-...') as HTMLInputElement
      fireEvent.change(apiKeyInput, { target: { value: 'sk-ant-new-key' } })

      // ASSERT
      expect(apiKeyInput.value).toBe('sk-ant-new-key')
    })
  })

  describe('saving settings', () => {
    it('should save settings when save button is clicked', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.saveSettings).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should show saving state when saving', async () => {
      // ARRANGE
      vi.mocked(tauri.saveSettings).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should handle save error', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(tauri.saveSettings).mockRejectedValue(new Error('Save failed'))

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to save settings')
        )
      })

      alertSpy.mockRestore()
    })
  })

  describe('voice selection', () => {
    it('should select a different voice', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const echoRadio = screen.getByDisplayValue('echo') as HTMLInputElement
      fireEvent.click(echoRadio)

      // ASSERT
      expect(echoRadio.checked).toBe(true)
    })

    it('should display all voice options', async () => {
      // ARRANGE & ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ASSERT
      expect(screen.getByText('Alloy')).toBeInTheDocument()
      expect(screen.getByText('Echo')).toBeInTheDocument()
      expect(screen.getByText('Fable')).toBeInTheDocument()
      expect(screen.getByText('Onyx')).toBeInTheDocument()
      expect(screen.getByText('Nova')).toBeInTheDocument()
      expect(screen.getByText('Shimmer')).toBeInTheDocument()
    })
  })

  describe('notifications', () => {
    it('should toggle notifications enabled', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const notificationCheckbox = screen.getByRole('checkbox', {
        name: 'Enable voice notifications',
      })
      fireEvent.click(notificationCheckbox)

      // ASSERT
      expect(notificationCheckbox).not.toBeChecked()
    })

    it('should toggle completion notifications', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const completionCheckbox = screen.getByRole('checkbox', {
        name: 'Notify when agents complete',
      })
      fireEvent.click(completionCheckbox)

      // ASSERT
      expect(completionCheckbox).not.toBeChecked()
    })
  })

  describe('test voice', () => {
    it('should show test voice button', async () => {
      // ARRANGE & ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ASSERT
      expect(screen.getByText('Test Voice')).toBeInTheDocument()
    })

    it('should test voice when button is clicked', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const testButton = screen.getByText('Test Voice')
      fireEvent.click(testButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.speakNotification).toHaveBeenCalled()
      })
    })

    it('should handle test voice error', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(tauri.speakNotification).mockRejectedValue(new Error('Voice test failed'))

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const testButton = screen.getByText('Test Voice')
      fireEvent.click(testButton)

      // ASSERT
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to test voice. Check your API key.')
      })

      alertSpy.mockRestore()
    })

    it('should disable test voice button when API key is missing', async () => {
      // ARRANGE
      vi.mocked(tauri.getSettings).mockResolvedValue({
        ...mockSettings,
        openaiApiKey: '',
      })

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ASSERT
      const testButton = screen.getByText('Test Voice')
      expect(testButton).toBeDisabled()
    })

    it('should show testing state when testing voice', async () => {
      // ARRANGE
      vi.mocked(tauri.speakNotification).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const testButton = screen.getByText('Test Voice')
      fireEvent.click(testButton)

      // ASSERT
      expect(screen.getByText('Testing...')).toBeInTheDocument()
    })

    it('should include user name in test voice message', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const testButton = screen.getByText('Test Voice')
      fireEvent.click(testButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.speakNotification).toHaveBeenCalledWith(
          expect.stringContaining('Test User'),
          'nova',
          'sk-test-key'
        )
      })
    })

    it('should use "there" when user name is not set', async () => {
      // ARRANGE
      vi.mocked(tauri.getSettings).mockResolvedValue({
        ...mockSettings,
        userName: '',
      })

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const testButton = screen.getByText('Test Voice')
      fireEvent.click(testButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.speakNotification).toHaveBeenCalledWith(
          expect.stringContaining('Hey there'),
          'nova',
          'sk-test-key'
        )
      })
    })
  })

  describe('GitHub settings', () => {
    it('should update GitHub repo owner when input changes', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const ownerInput = screen.getByPlaceholderText('barnent1') as HTMLInputElement
      fireEvent.change(ownerInput, { target: { value: 'newowner' } })

      // ASSERT
      expect(ownerInput.value).toBe('newowner')
    })

    it('should update GitHub repo name when input changes', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const repoInput = screen.getByPlaceholderText('sentra') as HTMLInputElement
      fireEvent.change(repoInput, { target: { value: 'newrepo' } })

      // ASSERT
      expect(repoInput.value).toBe('newrepo')
    })
  })

  describe('notification checkboxes', () => {
    it('should disable sub-checkboxes when notifications are disabled', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const notificationCheckbox = screen.getByRole('checkbox', {
        name: 'Enable voice notifications',
      })
      fireEvent.click(notificationCheckbox)

      // ASSERT
      const completionCheckbox = screen.getByRole('checkbox', {
        name: 'Notify when agents complete',
      })
      const failureCheckbox = screen.getByRole('checkbox', {
        name: 'Notify when agents fail',
      })
      const startCheckbox = screen.getByRole('checkbox', {
        name: 'Notify when agents start',
      })

      expect(completionCheckbox).toBeDisabled()
      expect(failureCheckbox).toBeDisabled()
      expect(startCheckbox).toBeDisabled()
    })

    it('should toggle failure notifications', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const failureCheckbox = screen.getByRole('checkbox', {
        name: 'Notify when agents fail',
      })
      fireEvent.click(failureCheckbox)

      // ASSERT
      expect(failureCheckbox).not.toBeChecked()
    })

    it('should toggle start notifications', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const startCheckbox = screen.getByRole('checkbox', {
        name: 'Notify when agents start',
      })
      fireEvent.click(startCheckbox)

      // ASSERT
      expect(startCheckbox).toBeChecked()
    })
  })

  describe('error handling', () => {
    it('should handle loading settings error gracefully', async () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(tauri.getSettings).mockRejectedValue(new Error('Load failed'))

      // ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      // ASSERT
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load settings:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle non-Error save failures', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(tauri.saveSettings).mockRejectedValue('String error')

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to save settings: Unknown error')
      })

      alertSpy.mockRestore()
    })
  })
})
