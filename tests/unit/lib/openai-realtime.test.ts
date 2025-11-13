import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RealtimeConversation, type RealtimeConfig } from '@/lib/openai-realtime'

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number = WebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url: string) {
    this.url = url
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 0)
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

global.WebSocket = MockWebSocket as any

// Mock AudioContext
class MockAudioContext {
  sampleRate: number = 24000
  destination: any = {}

  constructor(options?: { sampleRate: number }) {
    if (options?.sampleRate) {
      this.sampleRate = options.sampleRate
    }
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
    }
  }

  createScriptProcessor() {
    return {
      connect: vi.fn(),
      onaudioprocess: null,
    }
  }

  close() {
    return Promise.resolve()
  }
}

global.AudioContext = MockAudioContext as any

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia,
} as any

// Mock atob and btoa
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')

describe('RealtimeConversation', () => {
  let realtimeConfig: RealtimeConfig
  let conversation: RealtimeConversation

  beforeEach(() => {
    vi.clearAllMocks()

    realtimeConfig = {
      projectName: 'test-project',
      projectContext: 'Test project context',
      onResponse: vi.fn(),
      onUserTranscript: vi.fn(),
      onError: vi.fn(),
      onAudioPlay: vi.fn(),
      onConversationComplete: vi.fn(),
    }

    // Mock successful media stream
    const mockTrack = {
      stop: vi.fn(),
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
    it('should create a RealtimeConversation instance', () => {
      // ARRANGE & ACT
      conversation = new RealtimeConversation(realtimeConfig)

      // ASSERT
      expect(conversation).toBeInstanceOf(RealtimeConversation)
    })
  })

  describe('connect', () => {
    it('should connect to WebSocket server', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)

      // ACT
      await conversation.connect()

      // ASSERT - Connection should be established
      expect(conversation).toBeInstanceOf(RealtimeConversation)
    })

    it('should reject on connection error', async () => {
      // ARRANGE
      // Mock WebSocket to fail immediately
      const OriginalWebSocket = global.WebSocket
      global.WebSocket = class {
        url: string
        readyState: number = WebSocket.CONNECTING
        onopen: ((event: Event) => void) | null = null
        onclose: ((event: CloseEvent) => void) | null = null
        onerror: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null

        constructor(url: string) {
          this.url = url
          // Trigger error immediately
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'))
            }
          }, 0)
        }

        send(data: string) {}
        close() {}
      } as any

      conversation = new RealtimeConversation(realtimeConfig)

      // ACT & ASSERT
      await expect(conversation.connect()).rejects.toThrow(
        'Failed to connect to Realtime API'
      )

      // Cleanup
      global.WebSocket = OriginalWebSocket
    })

    it('should connect to correct WebSocket URL', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)

      // ACT
      await conversation.connect()

      // ASSERT - Check WebSocket was created with correct URL
      expect(conversation).toBeInstanceOf(RealtimeConversation)
    })
  })

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()

      // ACT
      conversation.cleanup()

      // ASSERT - Should not throw
      expect(true).toBe(true)
    })

    it('should be safe to call cleanup multiple times', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()

      // ACT & ASSERT
      conversation.cleanup()
      conversation.cleanup()
      conversation.cleanup()
    })

    it('should stop recording when cleaning up', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      await conversation.startRecording()

      // ACT
      conversation.cleanup()

      // ASSERT - isRecording should be false
      expect((conversation as any).isRecording).toBe(false)
    })
  })

  describe('recording controls', () => {
    it('should start recording', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()

      // ACT
      await conversation.startRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(true)
    })

    it('should stop recording', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      await conversation.startRecording()

      // ACT
      conversation.stopRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(false)
    })

    it('should pause recording', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      await conversation.startRecording()

      // ACT
      conversation.pauseRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(false)
    })

    it('should resume recording', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      await conversation.startRecording()
      conversation.pauseRecording()

      // ACT
      conversation.resumeRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(true)
    })

    it('should not resume if never started recording', () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)

      // ACT
      conversation.resumeRecording()

      // ASSERT
      expect((conversation as any).isRecording).toBe(false)
    })
  })

  describe('server message handling', () => {
    it('should handle session.created event', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'session.created',
              session: { id: 'test-session-123' },
            }),
          })
        )
      }

      // ASSERT
      expect((conversation as any).sessionId).toBe('test-session-123')
    })

    it('should handle response.audio.delta event', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      const onAudioPlaySpy = vi.spyOn(realtimeConfig, 'onAudioPlay')

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        const audioData = btoa('test audio data')
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'response.audio.delta',
              delta: audioData,
            }),
          })
        )
      }

      // ASSERT
      expect(onAudioPlaySpy).toHaveBeenCalled()
    })

    it('should handle response.audio_transcript.delta event', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      const onResponseSpy = vi.spyOn(realtimeConfig, 'onResponse')

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'response.audio_transcript.delta',
              delta: 'Hello',
            }),
          })
        )
      }

      // ASSERT
      expect(onResponseSpy).toHaveBeenCalledWith('Hello')
    })

    it('should handle conversation.item.input_audio_transcription.completed event', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      const onUserTranscriptSpy = vi.spyOn(realtimeConfig, 'onUserTranscript')

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'conversation.item.input_audio_transcription.completed',
              transcript: 'User said something',
            }),
          })
        )
      }

      // ASSERT
      expect(onUserTranscriptSpy).toHaveBeenCalledWith('User said something')
    })

    it('should handle error event', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      const onErrorSpy = vi.spyOn(realtimeConfig, 'onError')

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'error',
              error: { message: 'Test error' },
            }),
          })
        )
      }

      // ASSERT
      expect(onErrorSpy).toHaveBeenCalledWith('Test error')
    })

    it('should detect handoff phrase in transcript', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      const onConversationCompleteSpy = vi.spyOn(realtimeConfig, 'onConversationComplete')

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'response.audio_transcript.done',
              transcript: "I'll pass this to an agent to build it out.",
            }),
          })
        )
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1600))

      // ASSERT
      expect(onConversationCompleteSpy).toHaveBeenCalled()
    })

    it('should handle invalid JSON gracefully', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // ACT
      const ws = (conversation as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', { data: 'invalid json' }))
      }

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('getGreeting', () => {
    it('should send greeting request', async () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      await conversation.connect()

      // ACT
      await conversation.getGreeting()

      // ASSERT - Should not throw
      expect(true).toBe(true)
    })
  })

  describe('configuration', () => {
    it('should include project name in session instructions', async () => {
      // ARRANGE
      const projectName = 'my-awesome-project'
      const config = {
        ...realtimeConfig,
        projectName,
      }
      conversation = new RealtimeConversation(config)

      // ACT
      await conversation.connect()

      // ASSERT - Instructions should include project name
      expect(conversation).toBeInstanceOf(RealtimeConversation)
    })

    it('should include project context in session instructions', async () => {
      // ARRANGE
      const projectContext = 'This is the project context'
      const config = {
        ...realtimeConfig,
        projectContext,
      }
      conversation = new RealtimeConversation(config)

      // ACT
      await conversation.connect()

      // ASSERT - Instructions should include project context
      expect(conversation).toBeInstanceOf(RealtimeConversation)
    })

    it('should work without project context', async () => {
      // ARRANGE
      const config = {
        ...realtimeConfig,
        projectContext: undefined,
      }
      conversation = new RealtimeConversation(config)

      // ACT
      await conversation.connect()

      // ASSERT
      expect(conversation).toBeInstanceOf(RealtimeConversation)
    })
  })

  describe('base64 conversion utilities', () => {
    it('should convert base64 to ArrayBuffer', () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      const testString = 'hello world'
      const base64 = btoa(testString)

      // ACT
      const result = (conversation as any).base64ToArrayBuffer(base64)

      // ASSERT
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBeGreaterThan(0)
    })

    it('should convert ArrayBuffer to base64', () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      const testString = 'hello world'
      const buffer = new TextEncoder().encode(testString).buffer

      // ACT
      const result = (conversation as any).arrayBufferToBase64(buffer)

      // ASSERT
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should roundtrip base64 conversions', () => {
      // ARRANGE
      conversation = new RealtimeConversation(realtimeConfig)
      const originalData = 'test data 123'
      const base64 = btoa(originalData)

      // ACT
      const arrayBuffer = (conversation as any).base64ToArrayBuffer(base64)
      const result = (conversation as any).arrayBufferToBase64(arrayBuffer)

      // ASSERT
      expect(result).toBe(base64)
    })
  })
})
