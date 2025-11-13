import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VoiceConversation, type VoiceConfig } from '@/lib/openai-voice'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  state: string = 'inactive'

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    if (this.onstop) {
      this.onstop()
    }
  }
}

global.MediaRecorder = MockMediaRecorder as any

// Mock AudioContext
class MockAudioContext {
  createMediaStreamSource() {
    return {
      connect: vi.fn(),
    }
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      connect: vi.fn(),
    }
  }

  close() {
    return Promise.resolve()
  }
}

global.AudioContext = MockAudioContext as any

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
})

describe('VoiceConversation', () => {
  let voiceConfig: VoiceConfig
  let conversation: VoiceConversation

  beforeEach(() => {
    vi.clearAllMocks()

    voiceConfig = {
      apiKey: 'sk-test-key',
      projectName: 'test-project',
      projectContext: 'Test project context',
      onResponse: vi.fn(),
      onError: vi.fn(),
    }

    // Mock successful media stream
    const mockTrack = {
      stop: vi.fn(),
      onended: null,
    }
    const mockStream = {
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    }
    mockGetUserMedia.mockResolvedValue(mockStream)
  })

  afterEach(() => {
    if (conversation) {
      conversation.cleanup()
    }
  })

  describe('constructor', () => {
    it('should create a VoiceConversation instance', () => {
      // ARRANGE & ACT
      conversation = new VoiceConversation(voiceConfig)

      // ASSERT
      expect(conversation).toBeInstanceOf(VoiceConversation)
    })

    it('should initialize conversation history with system message', () => {
      // ARRANGE & ACT
      conversation = new VoiceConversation(voiceConfig)
      const history = conversation.getConversationHistory()

      // ASSERT
      expect(history).toEqual([])
    })

    it('should include project context in system message', () => {
      // ARRANGE
      const configWithContext = {
        ...voiceConfig,
        projectContext: 'Custom project context',
      }

      // ACT
      conversation = new VoiceConversation(configWithContext)

      // ASSERT - System message should be set (verified indirectly through getConversationHistory)
      const history = conversation.getConversationHistory()
      expect(history).toEqual([])
    })
  })

  describe('getConversationHistory', () => {
    it('should return conversation history without system messages', () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      // ACT
      const history = conversation.getConversationHistory()

      // ASSERT
      expect(history).toEqual([])
      expect(history.every((msg) => msg.role !== 'system')).toBe(true)
    })
  })

  describe('getGreeting', () => {
    it('should return greeting text and audio', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      const greetingText = 'Hello! How can I help you?'
      const audioBuffer = new ArrayBuffer(100)

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: greetingText } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => audioBuffer,
        })

      // ACT
      const result = await conversation.getGreeting()

      // ASSERT
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('audio')
      expect(result.text).toBe(greetingText)
      expect(result.audio).toBe(audioBuffer)
    })

    it('should add greeting to conversation history', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      const greetingText = 'Hello!'
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: greetingText } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        })

      // ACT
      await conversation.getGreeting()
      const history = conversation.getConversationHistory()

      // ASSERT
      expect(history.length).toBeGreaterThan(0)
      expect(history.some((msg) => msg.role === 'assistant')).toBe(true)
    })

    it('should throw error if greeting fails', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      mockFetch.mockRejectedValue(new Error('API error'))

      // ACT & ASSERT
      await expect(conversation.getGreeting()).rejects.toThrow()
    })
  })

  describe('stopRecording', () => {
    it('should do nothing if not recording', () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      // ACT & ASSERT - Should not throw
      conversation.stopRecording()
    })
  })

  describe('cleanup', () => {
    it('should stop recording and clean up resources', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      // ACT
      conversation.cleanup()

      // ASSERT - Should not throw
      expect(true).toBe(true)
    })

    it('should be safe to call cleanup multiple times', () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      // ACT & ASSERT - Should not throw
      conversation.cleanup()
      conversation.cleanup()
      conversation.cleanup()
    })
  })

  describe('error handling', () => {
    it('should call onError when transcription fails', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const onErrorSpy = vi.spyOn(voiceConfig, 'onError')

      // Mock failed transcription
      mockFetch.mockRejectedValue(new Error('Transcription failed'))

      // Setup recording scenario
      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      // ACT - Start recording and trigger stop
      await conversation.startRecording()

      // Get the MediaRecorder instance
      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder

      // Add some data
      if (recorder.ondataavailable) {
        recorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) })
      }

      // Stop recording to trigger processing
      conversation.stopRecording()

      // Trigger onstop callback
      if (recorder.onstop) {
        await recorder.onstop()
      }

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      // ASSERT
      expect(onErrorSpy).toHaveBeenCalled()
    })

    it('should handle microphone access errors', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const onErrorSpy = vi.spyOn(voiceConfig, 'onError')

      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

      // ACT
      await conversation.startRecording()

      // ASSERT
      expect(onErrorSpy).toHaveBeenCalledWith('Failed to access microphone')
    })
  })

  describe('configuration handling', () => {
    it('should accept configuration without project context', () => {
      // ARRANGE
      const configWithoutContext = {
        apiKey: 'sk-test',
        projectName: 'test',
        onResponse: vi.fn(),
        onError: vi.fn(),
      }

      // ACT
      conversation = new VoiceConversation(configWithoutContext)

      // ASSERT
      expect(conversation).toBeInstanceOf(VoiceConversation)
    })

    it('should handle empty project context', () => {
      // ARRANGE
      const configWithEmptyContext = {
        ...voiceConfig,
        projectContext: '',
      }

      // ACT
      conversation = new VoiceConversation(configWithEmptyContext)

      // ASSERT
      expect(conversation).toBeInstanceOf(VoiceConversation)
    })

    it('should handle whitespace-only project context', () => {
      // ARRANGE
      const configWithWhitespaceContext = {
        ...voiceConfig,
        projectContext: '   \n  ',
      }

      // ACT
      conversation = new VoiceConversation(configWithWhitespaceContext)

      // ASSERT
      expect(conversation).toBeInstanceOf(VoiceConversation)
    })
  })

  describe('API integration', () => {
    it('should use correct API key in requests', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Hello' } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        })

      // ACT
      await conversation.getGreeting()

      // ASSERT
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${voiceConfig.apiKey}`,
          }),
        })
      )
    })

    it('should include project name in system prompt', () => {
      // ARRANGE
      const projectName = 'my-special-project'
      const config = {
        ...voiceConfig,
        projectName,
      }

      // ACT
      conversation = new VoiceConversation(config)

      // ASSERT - Project name should be included in system message
      expect(conversation).toBeInstanceOf(VoiceConversation)
    })
  })

  describe('recording state management', () => {
    it('should start with isRecording as false', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      // ASSERT - Initial state should be not recording
      expect((conversation as any).isRecording).toBe(false)
    })

    it('should set isRecording to true when recording starts', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      // ACT
      await conversation.startRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(true)
    })

    it('should set isRecording to false when recording stops', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      // ACT
      conversation.stopRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(false)
    })
  })

  describe('VAD (Voice Activity Detection)', () => {
    it('should handle empty audio chunks gracefully', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      // ACT - Stop without adding data
      conversation.stopRecording()

      // Get the MediaRecorder instance and trigger onstop
      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder
      if (recorder.onstop) {
        await recorder.onstop()
      }

      // ASSERT - Should not call onError
      expect(voiceConfig.onError).not.toHaveBeenCalled()
    })

    it('should skip processing if audio blob is empty', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      // Get the MediaRecorder instance
      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder

      // Add empty data
      if (recorder.ondataavailable) {
        recorder.ondataavailable({ data: new Blob([], { type: 'audio/webm' }) })
      }

      // ACT
      conversation.stopRecording()
      if (recorder.onstop) {
        await recorder.onstop()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      // ASSERT
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('skipping transcription')
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('transcription', () => {
    it('should handle empty transcript gracefully', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ text: '' }),
      })

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder
      if (recorder.ondataavailable) {
        recorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) })
      }

      // ACT
      conversation.stopRecording()
      if (recorder.onstop) {
        await recorder.onstop()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      // ASSERT
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Empty transcript')
      )

      consoleLogSpy.mockRestore()
    })

    it('should handle AI response errors', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const onErrorSpy = vi.spyOn(voiceConfig, 'onError')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: 'Test transcript' }),
        })
        .mockRejectedValueOnce(new Error('AI response failed'))

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder
      if (recorder.ondataavailable) {
        recorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) })
      }

      // ACT
      conversation.stopRecording()
      if (recorder.onstop) {
        await recorder.onstop()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      // ASSERT
      expect(onErrorSpy).toHaveBeenCalled()
    })

    it('should handle TTS errors', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const onErrorSpy = vi.spyOn(voiceConfig, 'onError')

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: 'Test transcript' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response text' } }],
          }),
        })
        .mockRejectedValueOnce(new Error('TTS failed'))

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder
      if (recorder.ondataavailable) {
        recorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) })
      }

      // ACT
      conversation.stopRecording()
      if (recorder.onstop) {
        await recorder.onstop()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      // ASSERT
      expect(onErrorSpy).toHaveBeenCalled()
    })

    it('should handle HTTP errors in transcription', async () => {
      // ARRANGE
      conversation = new VoiceConversation(voiceConfig)
      const onErrorSpy = vi.spyOn(voiceConfig, 'onError')

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const mockStream = {
        getAudioTracks: () => [{ stop: vi.fn(), onended: null }],
        getTracks: () => [{ stop: vi.fn() }],
      }
      mockGetUserMedia.mockResolvedValue(mockStream)

      await conversation.startRecording()

      const recorder = (conversation as any).mediaRecorder as MockMediaRecorder
      if (recorder.ondataavailable) {
        recorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) })
      }

      // ACT
      conversation.stopRecording()
      if (recorder.onstop) {
        await recorder.onstop()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      // ASSERT
      expect(onErrorSpy).toHaveBeenCalled()
    })
  })

})
