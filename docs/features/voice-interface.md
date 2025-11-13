# Voice Interface

**How Sentra's voice conversations work**

---

## Overview

Sentra provides **two voice conversation implementations** for talking to the Architect AI:

1. **HTTP API** - Whisper STT + GPT-4 + TTS (reliable, works everywhere)
2. **Realtime API** - WebSocket streaming (faster, better UX)

Both let you have natural voice conversations to describe features and requirements.

---

## HTTP API Implementation

**Files:** `src/lib/openai-voice.ts`, `src/components/ArchitectChat.tsx`

### How It Works

```
User speaks → Microphone → Audio blob
    ↓
OpenAI Whisper API (transcribe)
    ↓
Text transcript
    ↓
OpenAI GPT-4 (conversation)
    ↓
AI response text
    ↓
OpenAI TTS API (speech)
    ↓
Audio playback → Speaker
```

### Key Features

**Auto-Silence Detection (VAD)**
- Monitors audio levels every 100ms
- Detects when you start speaking
- Automatically stops recording after 1.5s of silence
- No manual "stop" button needed

**Conversation History**
- Full transcript preserved
- Multi-turn conversation support
- Context maintained across messages

**Error Handling**
- Graceful fallback on API errors
- Audio device failure recovery
- Microphone permission handling

### Latency

**Total:** 3-5 seconds per response
- Transcription: ~1s
- GPT-4 inference: ~1-2s
- TTS generation: ~1s
- Audio playback: ~1-2s

### Code Example

```typescript
import { VoiceConversation } from '@/lib/openai-voice'

const conversation = new VoiceConversation({
  apiKey: openAIKey,
  projectName: 'MyProject',
  projectContext: 'Context about project...',
  onResponse: (text, audio) => {
    // Display text and play audio
    setText(text)
    playAudio(audio)
  },
  onError: (error) => {
    // Handle error
    showError(error)
  }
})

// Get greeting
const { text, audio } = await conversation.getGreeting()

// Start listening
await conversation.startRecording()

// Stop automatically via VAD or manually
conversation.stopRecording()

// Clean up
conversation.cleanup()
```

---

## Realtime API Implementation

**Files:** `src/lib/openai-realtime.ts`, `src-tauri/src/realtime_proxy.rs`

### How It Works

```
User speaks → Microphone → PCM16 audio stream
    ↓
WebSocket (port 9001) → Rust proxy
    ↓
OpenAI Realtime API
    ↓ (streaming)
AI response audio chunks
    ↓
Audio playback (progressive) → Speaker
```

### Key Features

**Server-Side VAD**
- Voice activity detection on OpenAI servers
- More accurate than client-side
- No manual configuration needed

**Streaming Audio**
- Audio plays as it's generated
- PCM16 format (24kHz, mono)
- ~1-2 second latency total

**Echo Prevention**
- Pauses recording while AI speaks
- 1.5s delay after speech completes
- Prevents feedback loops

**Handoff Detection**
- Detects phrase "pass this to an agent"
- Triggers spec creation automatically
- Seamless workflow integration

### Latency

**Total:** 1-2 seconds per response
- No transcription delay (streaming)
- Immediate response generation
- Progressive audio playback

### Architecture

**WebSocket Proxy** (`src-tauri/src/realtime_proxy.rs`):
- Runs on port 9001
- Authenticates with OpenAI API key
- Forwards WebSocket messages
- Handles reconnection

**React Component** (`src/lib/openai-realtime.ts`):
- Connects to local proxy
- Streams PCM audio
- Handles server events
- Manages conversation state

### Code Example

```typescript
import { RealtimeConversation } from '@/lib/openai-realtime'

const conversation = new RealtimeConversation({
  projectName: 'MyProject',
  projectContext: 'Context...',
  onResponse: (text) => {
    // Display AI text
    appendMessage(text)
  },
  onUserTranscript: (text) => {
    // Display user text
    appendMessage(text, 'user')
  },
  onAudioPlay: (audio) => {
    // Play audio chunk
    playAudioChunk(audio)
  },
  onError: (error) => {
    showError(error)
  },
  onConversationComplete: () => {
    // Handoff detected - create spec
    createSpec()
  }
})

// Connect
await conversation.connect()

// Get greeting
await conversation.getGreeting()

// Start streaming audio
await conversation.startRecording()

// Stop
conversation.stopRecording()

// Clean up
conversation.cleanup()
```

---

## Comparison

| Feature | HTTP API | Realtime API |
|---------|----------|--------------|
| **Latency** | 3-5 seconds | 1-2 seconds |
| **Implementation** | Simple | Complex |
| **Reliability** | High | Medium |
| **Cost** | Lower | Higher |
| **Browser Support** | All modern | All modern |
| **VAD** | Client-side | Server-side |
| **Streaming** | No | Yes |
| **Setup** | Easy | Requires proxy |

### When to Use HTTP API

- **Development** - Simpler to debug
- **Testing** - More predictable behavior
- **Cost-sensitive** - Lower API usage
- **Simple use cases** - No need for low latency

### When to Use Realtime API

- **Production** - Best user experience
- **Interactive conversations** - Low latency matters
- **Complex dialogues** - Streaming feels more natural
- **Demo/presentation** - Impressive responsiveness

---

## UI Components

### ArchitectChat Component

**File:** `src/components/ArchitectChat.tsx`

**Features:**
- Voice mode toggle (HTTP vs Realtime)
- Microphone button with visual feedback
- Conversation transcript display
- Markdown rendering for AI responses
- Audio waveform visualization (optional)
- Error display and recovery

**User Flow:**
1. Click "Chat with Architect" button
2. Modal opens with greeting
3. AI speaks greeting
4. User clicks microphone button
5. User speaks requirements
6. Auto-stops after silence
7. AI responds with acknowledgment
8. Repeat until complete
9. User says "I'm done"
10. AI triggers spec creation

### Settings Integration

**API Key Configuration:**
- OpenAI API key stored securely
- Validated on first use
- No key exposed to frontend
- Stored in Tauri settings

**Voice Mode Selection:**
- Toggle between HTTP and Realtime
- Automatic fallback if Realtime unavailable
- Preference saved

---

## Echo Prevention

**Problem:** AI voice output can trigger its own microphone, creating feedback loop.

**Solutions:**

**HTTP API:**
- 1000ms delay after TTS completes
- Wait for audio to fully play
- Then resume listening

**Realtime API:**
- Pause recording when AI starts speaking
- 1500ms delay after AI finishes
- Resume recording automatically

**Code:**
```typescript
// HTTP API
await playAudio(audioData)
await new Promise(resolve => setTimeout(resolve, 1000))
await conversation.startRecording()

// Realtime API
case 'response.audio.delta':
  if (this.isRecording) {
    this.pauseRecording()
  }
  playAudioChunk(event.delta)
  break

case 'response.audio.done':
  setTimeout(() => {
    this.resumeRecording()
  }, 1500)
  break
```

---

## Voice Activity Detection (VAD)

### Client-Side VAD (HTTP API)

**Algorithm:**
1. Create AudioContext and AnalyserNode
2. Sample frequency data every 100ms
3. Calculate average amplitude
4. If above threshold (30) → speech detected
5. If below threshold (20) for 1.5s → silence
6. Auto-stop recording

**Tunable Parameters:**
```typescript
const SPEECH_THRESHOLD = 30  // Higher = less sensitive
const SILENCE_THRESHOLD = 20 // Lower = more sensitive
const SILENCE_FRAMES = 15    // 15 × 100ms = 1.5s
```

### Server-Side VAD (Realtime API)

**Configuration:**
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.6,  // 0-1, higher = less sensitive
  prefix_padding_ms: 300,  // Audio before speech start
  silence_duration_ms: 500  // Silence to trigger stop
}
```

**Advantages:**
- More accurate (trained on large datasets)
- No client-side CPU usage
- Consistent across devices

---

## Debugging

### Common Issues

**Microphone not working:**
```bash
# Check permissions
# macOS: System Preferences → Security → Microphone

# Check browser console for errors
# Should see: "🎙️ Recording started"
```

**Audio echo/feedback:**
```bash
# Check delay timings
console.log('Audio finished, waiting 1000ms')

# Verify microphone isn't picking up speakers
# Use headphones for testing
```

**Transcription errors:**
```bash
# Check API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check audio format
# Should be: audio/webm or audio/wav
```

**Realtime API connection fails:**
```bash
# Check proxy is running
lsof -i :9001  # Should show Sentra process

# Check API key in settings
# Settings → OpenAI API Key

# Check proxy logs
# Tauri console should show "🔌 Realtime API proxy started"
```

---

## Future Improvements

### Planned

- **Multi-language support** - Support languages beyond English
- **Custom voice selection** - Let users choose TTS voice
- **Background noise reduction** - Better audio processing
- **Offline mode** - Local STT/TTS models

### Under Consideration

- **Voice commands** - "Sentra, create a new spec"
- **Voice authentication** - Speaker recognition
- **Conversation branching** - Fork conversations
- **Voice notes** - Record ideas without full conversation

---

## References

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

**Last Updated:** 2025-11-13
