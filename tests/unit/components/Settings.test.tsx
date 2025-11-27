import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Settings } from '@/components/Settings'
import * as settingsLib from '@/lib/settings'
import * as quetrexApi from '@/services/quetrex-api'

// Mock the settings module
vi.mock('@/lib/settings', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

// Mock the quetrex-api module (for speakNotification)
vi.mock('@/services/quetrex-api', () => ({
  speakNotification: vi.fn(),
}))

describe('Settings', () => {
  const mockSettings = {
    userName: 'Test User',
    voice: 'alloy',  // Default voice - works with both TTS and Realtime APIs
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
    vi.mocked(settingsLib.getSettings).mockResolvedValue(mockSettings)
    vi.mocked(settingsLib.saveSettings).mockResolvedValue(undefined)
    vi.mocked(quetrexApi.speakNotification).mockResolvedValue(undefined)
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
        expect(settingsLib.getSettings).toHaveBeenCalled()
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
        expect(settingsLib.saveSettings).toHaveBeenCalled()
      })

      // Wait for success toast and modal close
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should show saving state when saving', async () => {
      // ARRANGE
      vi.mocked(settingsLib.saveSettings).mockImplementation(
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

    it('should show success toast on successful save', async () => {
      // ARRANGE
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT - Shows success toast
      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument()
      })
    })

    it('should handle save error', async () => {
      // ARRANGE
      vi.mocked(settingsLib.saveSettings).mockRejectedValue(new Error('Save failed'))

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT - Now shows error toast instead of alert
      await waitFor(() => {
        expect(screen.getByText(/Failed to save settings/i)).toBeInTheDocument()
      })
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

      // ASSERT - All 13 voices should be displayed
      expect(screen.getByText('Alloy')).toBeInTheDocument()
      expect(screen.getByText('Ash')).toBeInTheDocument()
      expect(screen.getByText('Ballad')).toBeInTheDocument()
      expect(screen.getByText('Cedar')).toBeInTheDocument()
      expect(screen.getByText('Coral')).toBeInTheDocument()
      expect(screen.getByText('Echo')).toBeInTheDocument()
      expect(screen.getByText('Fable')).toBeInTheDocument()
      expect(screen.getByText('Marin')).toBeInTheDocument()
      expect(screen.getByText('Nova')).toBeInTheDocument()
      expect(screen.getByText('Onyx')).toBeInTheDocument()
      expect(screen.getByText('Sage')).toBeInTheDocument()
      expect(screen.getByText('Shimmer')).toBeInTheDocument()
      expect(screen.getByText('Verse')).toBeInTheDocument()
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
        expect(quetrexApi.speakNotification).toHaveBeenCalled()
      })
    })

    it('should handle test voice error', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(quetrexApi.speakNotification).mockRejectedValue(new Error('Voice test failed'))

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
      vi.mocked(settingsLib.getSettings).mockResolvedValue({
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
      vi.mocked(quetrexApi.speakNotification).mockImplementation(
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
        expect(quetrexApi.speakNotification).toHaveBeenCalledWith(
          expect.stringContaining('Test User'),
          'alloy',  // Changed from 'nova' to match mock settings
          'sk-test-key'
        )
      })
    })

    it('should use "there" when user name is not set', async () => {
      // ARRANGE
      vi.mocked(settingsLib.getSettings).mockResolvedValue({
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
        expect(quetrexApi.speakNotification).toHaveBeenCalledWith(
          expect.stringContaining('Hey there'),
          'alloy',  // Changed from 'nova' to match mock settings
          'sk-test-key'
        )
      })
    })

    it('should block preview for Realtime-only voices', async () => {
      // ARRANGE
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      vi.mocked(settingsLib.getSettings).mockResolvedValue({
        ...mockSettings,
        voice: 'ballad', // Realtime-only voice
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
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Ballad voice is only available in the Realtime API')
        )
        expect(quetrexApi.speakNotification).not.toHaveBeenCalled()
      })

      alertSpy.mockRestore()
    })

    it('should show Realtime-only indicator for non-TTS voices', async () => {
      // ARRANGE & ACT
      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ASSERT - Check that Realtime-only voices have the indicator
      expect(screen.getAllByText(/Voice chat only - no preview/i).length).toBeGreaterThan(0)
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
      const repoInput = screen.getByPlaceholderText('quetrex') as HTMLInputElement
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
      vi.mocked(settingsLib.getSettings).mockRejectedValue(new Error('Load failed'))

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
      vi.mocked(settingsLib.saveSettings).mockRejectedValue('String error')

      render(<Settings isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument()
      })

      // ACT
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      // ASSERT - Shows error toast
      await waitFor(() => {
        expect(screen.getByText(/Failed to save settings: Unknown error/i)).toBeInTheDocument()
      })
    })
  })
})
