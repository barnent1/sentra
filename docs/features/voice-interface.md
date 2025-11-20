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
- Browser native echo cancellation (always-on microphone)
- WebRTC AEC (Acoustic Echo Cancellation) prevents feedback loops
- Server-side VAD handles turn detection
- Industry standard approach (same as ChatGPT voice)

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

**The Industry Standard Approach:**

Sentra uses the same pattern as ChatGPT voice, Google Meet, and all modern WebRTC voice applications:

**Always-On Microphone + Browser Echo Cancellation**
- Microphone track remains enabled throughout the entire conversation
- Browser's native AEC (Acoustic Echo Cancellation) prevents feedback loops
- Server-side VAD (Voice Activity Detection) handles turn detection
- No manual track toggling needed

**Why This Works:**
1. Modern browsers have excellent built-in echo cancellation
2. WebRTC's `echoCancellation: true` filters out speaker audio before it reaches the mic
3. Server-side VAD detects who is speaking (user vs AI)
4. No artificial delays needed between conversation turns

**Code:**
```typescript
// Microphone setup - stays enabled throughout
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,  // ← Critical for preventing feedback
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  }
});

// Add to peer connection - stays connected
peerConnection.addTrack(stream.getAudioTracks()[0], stream);

// Server-side VAD configuration
session: {
  turn_detection: {
    type: 'server_vad',        // ← Server detects turns
    silence_duration_ms: 1200  // 1.2s silence = user finished
  }
}

// No manual track.enabled toggling needed!
```

**Deprecated Approach (Do Not Use):**
Previously, Sentra tried manually toggling `track.enabled` on every turn (pause when AI speaks, resume when finished). This is NOT the industry standard and causes bugs. The codebase still contains deprecated `pauseRecording()` and `resumeRecording()` methods that should not be used.

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

## Cross-Platform Audio Playback

### Overview

Sentra uses **rodio** for cross-platform audio playback in the Rust (Tauri) backend. This ensures voice notifications work consistently on macOS, Windows, and Linux.

### Implementation

**File:** `src-tauri/src/settings.rs`

**How It Works:**
1. OpenAI TTS API returns MP3 audio data
2. Audio data is decoded using rodio's MP3 decoder
3. Audio is played through the system's default audio device
4. Playback blocks until audio finishes (prevents notification overlap)

**Code:**
```rust
use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;

fn play_audio_cross_platform(audio_data: &[u8]) -> Result<(), String> {
    // Get system audio output
    let (_stream, stream_handle) = OutputStream::try_default()
        .map_err(|e| format!("Failed to get audio output: {}", e))?;

    // Create audio sink
    let sink = Sink::try_new(&stream_handle)
        .map_err(|e| format!("Failed to create audio sink: {}", e))?;

    // Decode MP3 data
    let cursor = Cursor::new(audio_data.to_vec());
    let source = Decoder::new(cursor)
        .map_err(|e| format!("Failed to decode audio: {}", e))?;

    // Play audio
    sink.append(source);
    sink.sleep_until_end();

    Ok(())
}
```

### Platform Support

| Platform | Audio Backend | Status | Notes |
|----------|--------------|--------|-------|
| **macOS** | CoreAudio | ✅ Tested | Native support, no dependencies |
| **Windows** | WASAPI | ✅ Supported | Native support, no dependencies |
| **Linux** | ALSA/PulseAudio | ✅ Supported | May require audio libraries |

### Linux Audio Setup

**Ubuntu/Debian:**
```bash
sudo apt-get install libasound2-dev
```

**Fedora/RHEL:**
```bash
sudo dnf install alsa-lib-devel
```

**Arch Linux:**
```bash
sudo pacman -S alsa-lib
```

### Dependencies

**Cargo.toml:**
```toml
[dependencies]
rodio = "0.17"
```

**Features:**
- MP3 decoding (for OpenAI TTS output)
- WAV support (for future use)
- Ogg Vorbis support (for future use)
- Cross-platform audio output
- Low latency playback

### Error Handling

**Common Errors:**

1. **No audio device found:**
   - Error: "Failed to get audio output"
   - Solution: Check system audio settings
   - Fallback: Notification displays text only

2. **Audio decode failure:**
   - Error: "Failed to decode audio"
   - Solution: Verify MP3 data from OpenAI API
   - Fallback: Log error, skip audio

3. **Playback interruption:**
   - Error: Audio device disconnected during playback
   - Solution: Rodio handles cleanup automatically
   - Behavior: Graceful failure, no crash

### Testing

**Unit Tests:** `src-tauri/tests/settings_test.rs`

Tests verify:
- Rodio dependency available on all platforms
- MP3 decoder compiled and functional
- Audio output API accessible
- Platform detection correct

**Manual Testing:**
1. Enable notifications in settings
2. Complete an agent task
3. Verify voice notification plays
4. Test on different platforms

### Browser-Side Audio (Web Audio API)

**Realtime API Audio Playback:**

The Realtime API plays audio directly in the browser using Web Audio API:

```typescript
// Convert PCM16 to AudioBuffer
const audioContext = new AudioContext({ sampleRate: 24000 });
const pcm16 = new Int16Array(audioData);
const floatData = new Float32Array(pcm16.length);

for (let i = 0; i < pcm16.length; i++) {
  floatData[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
}

const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
audioBuffer.getChannelData(0).set(floatData);

const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(audioContext.destination);
source.start();
```

**Platform Support:**
- All modern browsers (Chrome, Firefox, Safari, Edge)
- No external dependencies required
- Works on all desktop and mobile platforms

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
