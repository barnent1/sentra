import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ArchitectChat } from '@/components/ArchitectChat'
import * as tauri from '@/lib/tauri'
import { RealtimeConversation } from '@/lib/openai-realtime'

// Mock the tauri module
vi.mock('@/lib/tauri', () => ({
  getSettings: vi.fn(),
  chatWithArchitect: vi.fn(),
  getProjectContext: vi.fn(),
  savePendingSpec: vi.fn(),
}))

// Mock the RealtimeConversation class
vi.mock('@/lib/openai-realtime', () => ({
  RealtimeConversation: vi.fn(),
}))

// Mock AudioContext
class MockAudioContext {
  sampleRate = 24000
  createBuffer = vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(100)),
  }))
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    onended: null,
  }))
  destination = {}
  close = vi.fn()
}

global.AudioContext = MockAudioContext as any

describe('ArchitectChat', () => {
  const mockSettings = {
    userName: 'Test User',
    voice: 'nova',
    openaiApiKey: 'sk-test-key',
    anthropicApiKey: 'sk-ant-test',
    notificationsEnabled: true,
    notifyOnCompletion: true,
    notifyOnFailure: true,
    notifyOnStart: false,
  }

  const mockOnClose = vi.fn()
  const mockConnect = vi.fn()
  const mockGetGreeting = vi.fn()
  const mockStartRecording = vi.fn()
  const mockCleanup = vi.fn()

  let conversationCallbacks: {
    onUserTranscript?: (text: string) => void
    onResponse?: (text: string) => void
    onAudioPlay?: (data: ArrayBuffer) => void
    onError?: (error: string) => void
    onConversationComplete?: () => void
  } = {}

  beforeEach(() => {
    vi.clearAllMocks()
    conversationCallbacks = {}

    // Mock getSettings
    vi.mocked(tauri.getSettings).mockResolvedValue(mockSettings)

    // Mock chatWithArchitect
    vi.mocked(tauri.chatWithArchitect).mockResolvedValue('Mock AI response')

    // Mock getProjectContext
    vi.mocked(tauri.getProjectContext).mockResolvedValue('Mock project context')

    // Mock savePendingSpec
    vi.mocked(tauri.savePendingSpec).mockResolvedValue(undefined)

    // Mock RealtimeConversation constructor
    vi.mocked(RealtimeConversation).mockImplementation((config: any) => {
      conversationCallbacks = {
        onUserTranscript: config.onUserTranscript,
        onResponse: config.onResponse,
        onAudioPlay: config.onAudioPlay,
        onError: config.onError,
        onConversationComplete: config.onConversationComplete,
      }

      return {
        connect: mockConnect,
        getGreeting: mockGetGreeting,
        startRecording: mockStartRecording,
        cleanup: mockCleanup,
      } as any
    })

    mockConnect.mockResolvedValue(undefined)
    mockGetGreeting.mockResolvedValue(undefined)
    mockStartRecording.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      // ARRANGE & ACT
      const { container } = render(
        <ArchitectChat
          isOpen={false}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      expect(container.firstChild).toBeNull()
    })

    it('should render when isOpen is true', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })
    })

    it('should display project name', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="My Cool Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('My Cool Project')).toBeInTheDocument()
      })
    })

    it('should show API keys not configured message when keys are missing', async () => {
      // ARRANGE
      vi.mocked(tauri.getSettings).mockResolvedValue({
        ...mockSettings,
        openaiApiKey: '',
        anthropicApiKey: '',
      })

      // ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('API Keys Not Configured')).toBeInTheDocument()
      })
    })
  })

  describe('voice mode initialization', () => {
    it('should check API keys when opened', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(tauri.getSettings).toHaveBeenCalled()
      })
    })

    it('should load project context when path is provided', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(tauri.getProjectContext).toHaveBeenCalledWith('/test/path')
      })
    })

    it('should work without project path', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(tauri.getSettings).toHaveBeenCalled()
      })
      expect(tauri.getProjectContext).not.toHaveBeenCalled()
    })

    it('should handle project context loading errors', async () => {
      // ARRANGE
      vi.mocked(tauri.getProjectContext).mockRejectedValue(new Error('Failed to load context'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load project context:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('should create RealtimeConversation when opened', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalled()
      })
    })

    it('should handle voice mode initialization errors', async () => {
      // ARRANGE
      mockConnect.mockRejectedValue(new Error('Connection failed'))

      // ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(
          screen.getByText('Failed to start voice conversation. Check that the proxy is running.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('text mode', () => {
    it('should switch to text mode when button is clicked', async () => {
      // ARRANGE
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // ACT
      const buttons = screen.getAllByRole('button')
      const textModeButton = buttons.find((btn) => btn.title === 'Switch to text mode')
      expect(textModeButton).toBeDefined()
      fireEvent.click(textModeButton!)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })
    })


    it('should send text message when send button is clicked', async () => {
      // ARRANGE
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // Switch to text mode
      const buttons = screen.getAllByRole('button')
      const textModeButton = buttons.find((btn) => btn.title === 'Switch to text mode')
      fireEvent.click(textModeButton!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      // ACT
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      // ASSERT
      await waitFor(() => {
        expect(tauri.chatWithArchitect).toHaveBeenCalledWith(
          'Test Project',
          'Test message',
          expect.any(Array),
          'sk-ant-test'
        )
      })
    })


    it('should not send empty messages', async () => {
      // ARRANGE
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // Switch to text mode
      const buttons = screen.getAllByRole('button')
      const textModeButton = buttons.find((btn) => btn.title === 'Switch to text mode')
      fireEvent.click(textModeButton!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      // ACT
      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      // ASSERT
      expect(tauri.chatWithArchitect).not.toHaveBeenCalled()
    })

    it('should disable input when processing', async () => {
      // ARRANGE
      vi.mocked(tauri.chatWithArchitect).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('Response'), 100))
      )

      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // Switch to text mode
      const buttons = screen.getAllByRole('button')
      const textModeButton = buttons.find((btn) => btn.title === 'Switch to text mode')
      fireEvent.click(textModeButton!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      // ACT
      const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send') as HTMLButtonElement
      fireEvent.click(sendButton)

      // ASSERT
      await waitFor(() => {
        expect(input.disabled).toBe(true)
        expect(sendButton.disabled).toBe(true)
      })
    })

    it('should display assistant response in text mode', async () => {
      // ARRANGE
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // Switch to text mode
      const buttons = screen.getAllByRole('button')
      const textModeButton = buttons.find((btn) => btn.title === 'Switch to text mode')
      fireEvent.click(textModeButton!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      // ACT
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('Mock AI response')).toBeInTheDocument()
      })
    })

    it('should handle text mode error', async () => {
      // ARRANGE
      vi.mocked(tauri.chatWithArchitect).mockRejectedValue(new Error('API error'))

      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // Switch to text mode
      const buttons = screen.getAllByRole('button')
      const textModeButton = buttons.find((btn) => btn.title === 'Switch to text mode')
      fireEvent.click(textModeButton!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      })

      // ACT
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      // ASSERT
      await waitFor(() => {
        expect(
          screen.getByText('Failed to get response. Please check your API key.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('conversation handoff', () => {
    it('should initialize with conversation complete callback', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            onConversationComplete: expect.any(Function)
          })
        )
      })
    })

    it('should pass project name to RealtimeConversation', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            projectName: 'Test Project'
          })
        )
      })
    })

    it('should pass project context to RealtimeConversation when path is provided', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            projectContext: 'Mock project context'
          })
        )
      })
    })
  })

  describe('user interactions', () => {
    it('should call onClose when X button is clicked', async () => {
      // ARRANGE
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // ACT
      const closeButtons = screen.getAllByRole('button')
      // The X button is the last one
      const xButton = closeButtons[closeButtons.length - 1]
      fireEvent.click(xButton)

      // ASSERT
      expect(mockOnClose).toHaveBeenCalled()
    })

  })

  describe('conversation transcript', () => {
    it('should initialize with RealtimeConversation callbacks for user transcript', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            onUserTranscript: expect.any(Function)
          })
        )
      })
    })

    it('should initialize with RealtimeConversation callbacks for assistant response', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            onResponse: expect.any(Function)
          })
        )
      })
    })

    it('should initialize with RealtimeConversation callbacks for error handling', async () => {
      // ARRANGE & ACT
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      // ASSERT
      await waitFor(() => {
        expect(RealtimeConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            onError: expect.any(Function)
          })
        )
      })
    })
  })

  describe('audio playback', () => {
    it('should set up audio playback callback', async () => {
      // ARRANGE
      render(
        <ArchitectChat
          isOpen={true}
          onClose={mockOnClose}
          projectName="Test Project"
          projectPath="/test/path"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Sentra')).toBeInTheDocument()
      })

      // ASSERT - Verify RealtimeConversation was created with audio callback
      expect(RealtimeConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          onAudioPlay: expect.any(Function)
        })
      )
    })
  })
})
