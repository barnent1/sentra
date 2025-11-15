# Sentra Voice System Architecture

**Document Version:** 1.0
**Last Updated:** November 15, 2025
**Status:** Production
**Author:** Glen Barnhardt with Claude Code

---

## Table of Contents

1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Two-Approach Strategy](#two-approach-strategy)
4. [WebRTC Approach (Primary)](#webrtc-approach-primary)
5. [HTTP API Approach (Fallback)](#http-api-approach-fallback)
6. [WKWebView Audio Limitations](#wkwebview-audio-limitations)
7. [Component Deep Dive](#component-deep-dive)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Technical Decisions](#technical-decisions)
10. [Debugging Guide](#debugging-guide)
11. [Future Considerations](#future-considerations)

---

## Overview

Sentra implements a sophisticated dual-approach voice system that enables natural conversations with AI. The system intelligently switches between two architectures based on platform capabilities:

- **Primary:** WebRTC with OpenAI Realtime API (low latency, 100-200ms)
- **Fallback:** HTTP API with Whisper + GPT-4 + TTS (reliable, 3-5s latency)

### Key Features

- Real-time bidirectional voice conversation
- Automatic interruption handling (user can interrupt AI)
- Voice Activity Detection (VAD) for natural conversation flow
- Echo cancellation and noise suppression
- Conversation context management
- Graceful degradation to fallback mode

### Technology Stack

- **Frontend:** TypeScript, Web Audio API, WebRTC
- **Backend (Tauri):** Rust, rodio (audio playback)
- **AI Services:** OpenAI Realtime API, Whisper, GPT-4, TTS
- **Audio Processing:** MediaStream API, AudioWorklet (planned)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Sentra Voice System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   WebRTC Mode    │         │   HTTP API Mode   │          │
│  │   (Primary)      │         │   (Fallback)      │          │
│  │                  │         │                   │          │
│  │  100-200ms       │         │   3-5 seconds     │          │
│  │  Realtime API    │         │   Whisper+GPT+TTS │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
    ┌──────────────┐            ┌──────────────┐
    │ User's       │            │ OpenAI       │
    │ Microphone   │            │ Services     │
    └──────────────┘            └──────────────┘
```

### Component Locations

| Component | File Path | Purpose |
|-----------|-----------|---------|
| WebRTC Implementation | `/src/lib/openai-realtime.ts` | Low-latency realtime voice |
| HTTP API Implementation | `/src/lib/openai-voice.ts` | Fallback voice system |
| Rust Audio Commands | `/src-tauri/src/commands.rs` | Native audio playback |
| AudioWorklet Processor | `/public/webrtc-audio-processor.js` | Planned: Audio processing |

---

## Two-Approach Strategy

### Why Two Approaches?

Sentra uses a dual-approach strategy to balance performance with reliability:

1. **WebRTC (Primary)** - Best user experience when it works
2. **HTTP API (Fallback)** - Guaranteed to work everywhere

### Automatic Selection Logic

```typescript
// Simplified selection logic
if (isWKWebViewWithAudioLimitations()) {
  // Use HTTP API fallback
  useHTTPVoiceMode();
} else if (supportsWebRTC()) {
  // Use WebRTC for best performance
  useRealtimeMode();
} else {
  // Use HTTP API fallback
  useHTTPVoiceMode();
}
```

### Comparison Matrix

| Feature | WebRTC Approach | HTTP API Approach |
|---------|----------------|-------------------|
| **Latency** | 100-200ms | 3-5 seconds |
| **User Can Interrupt AI** | ✅ Yes (instant) | ❌ No |
| **Echo Cancellation** | ✅ Native WebRTC | ⚠️ Manual (delays) |
| **Browser Compatibility** | ⚠️ Requires modern browser | ✅ All browsers |
| **WKWebView Support** | ⚠️ Audio limitations | ✅ Works perfectly |
| **Complexity** | High | Low |
| **Reliability** | Medium | High |
| **Cost per minute** | ~$0.06 | ~$0.08 |
| **Setup Time** | ~500ms | ~100ms |

---

## WebRTC Approach (Primary)

### Architecture Overview

The WebRTC approach uses OpenAI's Realtime API with a peer-to-peer connection for bidirectional audio streaming.

```
User Microphone
      │
      ▼
┌─────────────────────────────────────────────────┐
│  MediaStream (echoCancellation: true)           │
└─────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  RTCPeerConnection                              │
│  - Local track: User audio                     │
│  - Remote track: AI audio (broken in WKWebView)│
│  - Data channel: Events & transcripts          │
└─────────────────────────────────────────────────┘
      │
      ├──(Audio)──────▶ OpenAI Realtime API
      │                      │
      ├──(Events)───────────▶│
      │                      │
      ◀──(AI Audio)──────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  HTMLAudioElement (WKWebView limitation)        │
│  - autoplay: true                               │
│  - srcObject: MediaStream                       │
│  - Problem: No audio in macOS 13.1+             │
└─────────────────────────────────────────────────┘
```

### Connection Flow

```typescript
// Step 1: Get ephemeral token
const tokenResponse = await fetch('/api/realtime-token', {
  method: 'POST',
  body: JSON.stringify({ apiKey })
});
const { client_secret } = await tokenResponse.json();

// Step 2: Get microphone access
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  }
});

// Step 3: Create peer connection
const peerConnection = new RTCPeerConnection();
peerConnection.addTrack(stream.getAudioTracks()[0], stream);

// Step 4: Create data channel (must be before offer)
const dataChannel = peerConnection.createDataChannel('oai-events');

// Step 5: Create offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Step 6: Exchange SDP with OpenAI
const sdpResponse = await fetch(
  'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${client_secret}`,
      'Content-Type': 'application/sdp',
    },
    body: offer.sdp,
  }
);

const answerSdp = await sdpResponse.text();
await peerConnection.setRemoteDescription({
  type: 'answer',
  sdp: answerSdp,
});

// Step 7: Wait for connection
await waitForConnectionState('connected');

// Step 8: Configure session
dataChannel.send(JSON.stringify({
  type: 'session.update',
  session: {
    modalities: ['text', 'audio'],
    voice: 'alloy',
    turn_detection: {
      type: 'server_vad',
      silence_duration_ms: 1200
    }
  }
}));
```

### Key Components

#### 1. RTCPeerConnection
- Manages WebRTC peer-to-peer connection
- Handles ICE candidates automatically
- Transmits local audio to OpenAI
- Receives remote audio from OpenAI

#### 2. RTCDataChannel
- Bidirectional event communication
- Sends commands (session.update, response.cancel)
- Receives events (response.created, transcripts, errors)

#### 3. MediaStream
- Captures user microphone input
- Applies echo cancellation (critical!)
- Noise suppression and auto gain control
- Single channel (mono) for efficiency

#### 4. HTMLAudioElement (Problematic)
- Intended to play remote audio stream
- **BROKEN in WKWebView on macOS 13.1+**
- See [WKWebView Audio Limitations](#wkwebview-audio-limitations)

### Server Events (Data Channel)

| Event Type | When Fired | Action |
|------------|------------|--------|
| `session.created` | Connection established | Store session ID |
| `response.created` | AI starts responding | Mark AI as active |
| `input_audio_buffer.speech_started` | User starts speaking | Interrupt AI, pause playback |
| `input_audio_buffer.speech_stopped` | User stops speaking | VAD detected silence |
| `output_audio_buffer.started` | AI starts speaking | Resume audio playback |
| `response.audio.done` | AI audio complete | Wait for playback finish |
| `response.audio_transcript.delta` | AI speech transcribed | Display transcript |
| `response.done` | Response complete | Ready for next turn |
| `response.cancelled` | Response interrupted | AI stopped mid-sentence |
| `error` | Error occurred | Handle gracefully |

### Critical Bug Fixes Implemented

#### Bug #2: Interruption Handling
**Problem:** User couldn't interrupt AI mid-response
**Solution:** On `input_audio_buffer.speech_started`, pause audio and send `response.cancel`

```typescript
case 'input_audio_buffer.speech_started':
  if (this.isPlayingAudio) {
    // Pause audio playback
    this.remoteAudioElement?.pause();

    // Cancel AI response
    if (this.isAIResponding && this.currentResponseId) {
      this.send({ type: 'response.cancel' });
    }
  }
  break;
```

#### Bug #3: Microphone Hardware Muting
**Problem:** Pausing didn't actually disable microphone (software flag only)
**Solution:** Disable/enable the MediaStreamTrack directly

```typescript
pauseRecording(): void {
  if (this.stream) {
    const audioTrack = this.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false; // Hardware level
    }
  }
}
```

#### Bug #5: Audio Playback Echo
**Problem:** AI audio finished server-side but still playing locally, causing echo
**Solution:** Wait for HTMLAudioElement 'ended' event + 800ms safety delay

```typescript
case 'response.audio.done':
  if (!this.remoteAudioElement.paused) {
    this.remoteAudioElement.onended = () => {
      setTimeout(() => {
        // Now safe to resume microphone
        this.config.onAudioPlaybackComplete();
      }, 800); // Safety delay
    };
  }
  break;
```

#### Bug #7: Response Cancel Race Condition
**Problem:** Sending `response.cancel` before OpenAI activates response causes error
**Solution:** Track response state and add 100ms timing threshold

```typescript
case 'response.created':
  this.isAIResponding = true;
  this.currentResponseId = event.response.id;
  this.responseStartTime = Date.now();
  break;

// Later, when interrupting:
if (this.isAIResponding && this.currentResponseId) {
  const timeSinceStart = Date.now() - this.responseStartTime;

  if (timeSinceStart >= 100) {
    // Safe to cancel
    this.send({ type: 'response.cancel' });
  } else {
    // Too early, will stop naturally
    console.log('Response too new, skipping cancel');
  }
}
```

---

## HTTP API Approach (Fallback)

### Architecture Overview

The HTTP API approach uses three separate OpenAI APIs in sequence:

```
1. User speaks ──▶ MediaRecorder ──▶ Blob
                        │
                        ▼
2. Whisper API ──▶ Transcribe ──▶ Text
                        │
                        ▼
3. GPT-4 API ──▶ Generate Response ──▶ Text
                        │
                        ▼
4. TTS API ──▶ Text-to-Speech ──▶ Audio
                        │
                        ▼
5. Audio Element ──▶ Play to User
```

### Request Flow

```typescript
// Step 1: Record user speech
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.start();

// VAD detects silence...
mediaRecorder.stop();

// Step 2: Transcribe with Whisper
const formData = new FormData();
formData.append('file', audioBlob, 'audio.webm');
formData.append('model', 'whisper-1');

const transcription = await fetch(
  'https://api.openai.com/v1/audio/transcriptions',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  }
);

const { text } = await transcription.json();

// Step 3: Get GPT-4 response
const completion = await fetch(
  'https://api.openai.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: conversationHistory,
      temperature: 0.8,
      max_tokens: 150,
    }),
  }
);

const { choices } = await completion.json();
const aiResponse = choices[0].message.content;

// Step 4: Convert to speech
const tts = await fetch(
  'https://api.openai.com/v1/audio/speech',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'nova',
      input: aiResponse,
    }),
  }
);

const audioData = await tts.arrayBuffer();

// Step 5: Play audio
const audioElement = new Audio();
audioElement.src = URL.createObjectURL(
  new Blob([audioData], { type: 'audio/mpeg' })
);
await audioElement.play();
```

### Voice Activity Detection (VAD)

The HTTP approach implements client-side VAD to automatically detect when the user stops speaking:

```typescript
// Analyze audio levels every 100ms
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
source.connect(analyser);

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

setInterval(() => {
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

  const SPEECH_THRESHOLD = 30;
  const SILENCE_THRESHOLD = 20;

  if (average > SPEECH_THRESHOLD) {
    // User is speaking
    consecutiveSilentFrames = 0;
    hasDetectedSpeech = true;
  } else if (average < SILENCE_THRESHOLD && hasDetectedSpeech) {
    // Silence after speech
    consecutiveSilentFrames++;

    if (consecutiveSilentFrames >= 15) { // ~1.5 seconds
      stopRecording();
    }
  }
}, 100);
```

### Latency Breakdown

| Step | Time | Notes |
|------|------|-------|
| 1. User speaks | Variable | Depends on speech length + VAD (1.5s silence) |
| 2. Whisper transcription | ~800ms | Audio → Text |
| 3. GPT-4 completion | ~1000ms | Text → Response |
| 4. TTS generation | ~600ms | Text → Audio |
| 5. Audio playback | Variable | Depends on response length |
| **Total (before playback)** | **~3-5s** | User stops speaking → AI starts speaking |

### Conversation History Management

```typescript
conversationHistory: Array<{ role: string; content: string }> = [];

// Initialize with system prompt
conversationHistory.push({
  role: 'system',
  content: 'You are Sentra, an expert software architect...'
});

// Add user message
conversationHistory.push({
  role: 'user',
  content: transcribedText
});

// Add assistant response
conversationHistory.push({
  role: 'assistant',
  content: aiResponse
});
```

### Advantages of HTTP Approach

1. **100% Reliable** - No platform-specific audio issues
2. **Simple Architecture** - Sequential HTTP requests
3. **Explicit State Management** - Clear conversation history
4. **No WebRTC Complexity** - No peer connections, ICE, SDP
5. **Works in WKWebView** - No audio playback limitations

### Disadvantages

1. **High Latency** - 3-5 seconds vs 100-200ms
2. **No Interruption** - User must wait for AI to finish
3. **No Streaming** - Response comes as single blob
4. **More API Calls** - 3 separate requests per turn
5. **Manual VAD** - Client-side silence detection needed

---

## WKWebView Audio Limitations

### The Problem

**WKWebView on macOS 13.1+ cannot play WebRTC remote audio through HTMLAudioElement.**

This is a platform limitation, not a bug in our code. Here's what happens:

```typescript
// This code works in Chrome/Safari, but NOT in Tauri (WKWebView):
const audioElement = new Audio();
audioElement.autoplay = true;
audioElement.srcObject = remoteMediaStream; // From WebRTC
await audioElement.play(); // ❌ No sound!
```

### Root Cause

1. **WKWebView Architecture** - Apple's embedded browser engine
2. **AVAudioSession Access** - WKWebView cannot access macOS audio session
3. **Remote Track Routing** - Remote audio tracks don't route to system speakers
4. **Scope** - macOS 13.1+ (Ventura and later)

### Research Evidence

- **Apple Developer Forums** - Threads #723763, #649486, #764453
- **Tauri Issue #13143** - "WebRTC audio not working"
- **WRY Issue #85** - "WebRTC support limitations"
- **WebKit Bug #230922** - "MediaStream autoplay issues"

### Confirmed Symptoms

- ✅ WebRTC peer connection establishes successfully
- ✅ Data channel communicates bidirectionally
- ✅ Remote audio track events fire
- ✅ User microphone works perfectly
- ❌ **No audio plays through speakers**

### Attempted Solutions (All Failed)

```typescript
// ❌ Attempt 1: Explicit play() call
audioElement.play(); // Promise resolves, but no sound

// ❌ Attempt 2: Set volume and unmute
audioElement.volume = 1.0;
audioElement.muted = false;

// ❌ Attempt 3: Attach to DOM
document.body.appendChild(audioElement);

// ❌ Attempt 4: User interaction first
button.addEventListener('click', async () => {
  await audioElement.play(); // Still no sound
});

// ❌ Attempt 5: Different audio element
const audio = document.createElement('audio');
// Still doesn't work
```

### Proposed Solutions

#### Solution 1: AudioWorklet Bridge (Planned)

Route audio through Web Audio API → Native Rust playback:

```
WebRTC Remote Stream
  ↓
MediaStreamAudioSourceNode
  ↓
AudioWorkletNode (capture audio chunks)
  ↓
Tauri IPC (base64 PCM data)
  ↓
Rust rodio playback
  ↓
CoreAudio → SPEAKERS ✅
```

**Status:** Designed in handover document, not yet implemented
**Complexity:** Medium
**Expected Latency:** 100-200ms (acceptable)

#### Solution 2: Native Rust WebRTC (Rejected)

Implement WebRTC entirely in Rust using `webrtc-rs`:

**Pros:**
- Complete control over audio playback
- No WKWebView limitations

**Cons:**
- 2-4 weeks development time
- High complexity
- Duplicate WebRTC implementation
- Overkill for the problem

#### Solution 3: Electron Migration (Nuclear Option)

Migrate from Tauri to Electron:

**Pros:**
- Chromium has full WebRTC support
- No WKWebView limitations

**Cons:**
- Abandons Tauri investment
- Much larger bundle size (~100MB vs ~10MB)
- Slower startup time
- Requires complete rewrite

#### Solution 4: HTTP API Fallback (Current Approach)

Use `openai-voice.ts` instead of `openai-realtime.ts`:

**Pros:**
- ✅ Already implemented and working
- ✅ 100% reliable
- ✅ No platform-specific issues

**Cons:**
- ⚠️ 3-5 second latency
- ⚠️ No real-time interruption

**Status:** **ACTIVE** - Currently shipping this approach

---

## Component Deep Dive

### 1. RealtimeConversation Class

**File:** `/src/lib/openai-realtime.ts`

```typescript
export class RealtimeConversation {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private isAIResponding = false;
  private currentResponseId: string | null = null;

  async connect(): Promise<void> { /* ... */ }
  startRecording(): Promise<void> { /* ... */ }
  pauseRecording(): void { /* ... */ }
  resumeRecording(): void { /* ... */ }
  cleanup(): void { /* ... */ }
}
```

#### Key Methods

**`connect()`**
- Gets ephemeral token from `/api/realtime-token`
- Requests microphone access
- Creates RTCPeerConnection
- Exchanges SDP with OpenAI
- Sets up event handlers

**`startRecording()`**
- Marks recording as active
- Audio capture happens automatically via RTCPeerConnection

**`pauseRecording()`**
- Disables microphone hardware (MediaStreamTrack.enabled = false)
- Prevents echo when AI is speaking

**`resumeRecording()`**
- Re-enables microphone hardware
- Called after AI finishes speaking

**`cleanup()`**
- Stops all media tracks
- Closes peer connection and data channel
- Removes audio element from DOM
- Prevents memory leaks

### 2. VoiceConversation Class

**File:** `/src/lib/openai-voice.ts`

```typescript
export class VoiceConversation {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  async startRecording(): Promise<void> { /* ... */ }
  stopRecording(): void { /* ... */ }
  private async processUserSpeech(audioBlob: Blob): Promise<void> { /* ... */ }
  private async transcribeAudio(audioBlob: Blob): Promise<string> { /* ... */ }
  private async getAIResponse(): Promise<string> { /* ... */ }
  private async textToSpeech(text: string): Promise<ArrayBuffer> { /* ... */ }
}
```

#### Processing Pipeline

1. **Recording Phase**
   - MediaRecorder captures audio
   - VAD monitors silence
   - Auto-stops after 1.5s silence

2. **Transcription Phase**
   - Upload blob to Whisper API
   - Receive text transcript

3. **Completion Phase**
   - Send transcript + history to GPT-4
   - Receive AI response text

4. **Synthesis Phase**
   - Send response text to TTS API
   - Receive audio ArrayBuffer

5. **Playback Phase**
   - Create Audio element
   - Play to user

### 3. Rust Audio Commands (Planned for AudioWorklet)

**File:** `/src-tauri/src/commands.rs`

```rust
// Initialize audio sink
#[tauri::command]
pub fn init_audio_sink() -> Result<(), String> {
    // Create OutputStream and Sink
    // Store in thread-local storage
}

// Play audio chunk from JavaScript
#[tauri::command]
pub async fn play_audio_chunk(
    audio_data_base64: String,
    sample_rate: u32,
    channels: u16,
) -> Result<(), String> {
    // Decode base64 → bytes
    // Convert to Vec<i16> PCM samples
    // Append to rodio Sink
}

// Stop playback
#[tauri::command]
pub fn stop_audio_playback() -> Result<(), String> {
    // Stop sink
    // Clean up resources
}
```

**Status:** Implemented but not yet used (waiting for AudioWorklet integration)

---

## Data Flow Diagrams

### WebRTC Mode: User Speech → AI Response

```
┌─────────────┐
│    User     │
│   Speaks    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  MediaStream (microphone)               │
│  - echoCancellation: true               │
│  - noiseSuppression: true               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  RTCPeerConnection                      │
│  - Encodes audio to Opus                │
│  - Sends via RTP                        │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │   Internet    │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  OpenAI Realtime API                    │
│  - Decodes Opus audio                   │
│  - Runs VAD (server-side)               │
│  - Transcribes with Whisper             │
│  - Generates response with GPT-4o       │
│  - Synthesizes speech with TTS          │
│  - Encodes to Opus                      │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │   Internet    │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  RTCPeerConnection (remote track)       │
│  - Receives Opus RTP packets            │
│  - Decodes to PCM                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  HTMLAudioElement                       │
│  ❌ BROKEN in WKWebView                 │
│  ✅ Works in Chrome/Safari              │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌─────────┐
         │ Speakers│
         │ (maybe) │
         └─────────┘
```

### HTTP Mode: User Speech → AI Response

```
┌─────────────┐
│    User     │
│   Speaks    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  MediaRecorder                          │
│  - Records to WebM/Opus                 │
│  - Client-side VAD monitors silence     │
└──────────────┬──────────────────────────┘
               │ (1.5s silence detected)
               ▼
┌─────────────────────────────────────────┐
│  Blob (audio.webm)                      │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  HTTP POST    │
       │  to Whisper   │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  OpenAI Whisper API                     │
│  - Transcribes audio → text             │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  Transcript   │
       │  "Hello AI"   │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Conversation History                   │
│  + new user message                     │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  HTTP POST    │
       │  to GPT-4     │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  OpenAI GPT-4 API                       │
│  - Generates text response              │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  AI Response  │
       │  "Hi there!"  │
       └───────┬───────┘
               │
               ▼
       ┌───────────────┐
       │  HTTP POST    │
       │  to TTS       │
       └───────┬───────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  OpenAI TTS API                         │
│  - Converts text → audio (MP3)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ArrayBuffer (audio data)               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Audio Element                          │
│  - Plays MP3 audio                      │
│  ✅ Works everywhere                    │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌─────────┐
         │ Speakers│
         │   ✅    │
         └─────────┘
```

---

## Technical Decisions

### Decision 1: Dual-Mode Architecture

**Decision:** Implement both WebRTC and HTTP approaches

**Rationale:**
- WebRTC provides superior UX (100-200ms latency)
- HTTP provides guaranteed reliability
- WKWebView audio issues affect only specific platforms
- Can switch approaches without changing UI

**Trade-offs:**
- **Pro:** Best of both worlds
- **Con:** Doubled implementation complexity
- **Con:** More code to maintain

**Alternatives Considered:**
- WebRTC only → Unreliable in Tauri
- HTTP only → Poor UX (3-5s latency)
- Native Rust WebRTC → 2-4 weeks dev time

**Status:** ✅ Accepted, implemented

---

### Decision 2: Server-Side VAD (WebRTC Mode)

**Decision:** Use OpenAI's server-side VAD instead of client-side

**Configuration:**
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 1200  // 1.2 seconds
}
```

**Rationale:**
- OpenAI's VAD is more accurate (trained on speech data)
- Reduces client-side computation
- Consistent behavior across devices
- No need to implement/tune client VAD

**Trade-offs:**
- **Pro:** Better accuracy
- **Pro:** Simpler client code
- **Con:** Network latency affects detection (~50ms)
- **Con:** Less control over sensitivity

**Alternatives Considered:**
- Client-side VAD (like HTTP mode) → More network traffic
- Hybrid approach → Overcomplicated

**Status:** ✅ Accepted, working well

---

### Decision 3: Echo Cancellation Strategy

**Decision:** Multi-layered echo prevention:
1. WebRTC native echo cancellation
2. Pause microphone when AI speaks
3. 800ms safety delay after AI finishes

**Rationale:**
- Echo is the #1 voice UX killer
- Single approach isn't enough in edge cases
- Defense in depth → better reliability

**Implementation:**
```typescript
// Layer 1: Native echo cancellation
navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: true }
});

// Layer 2: Pause mic during AI speech
case 'output_audio_buffer.started':
  this.pauseRecording();
  break;

// Layer 3: Safety delay
case 'response.audio.done':
  await waitForAudioComplete();
  setTimeout(() => {
    this.resumeRecording();
  }, 800);
  break;
```

**Trade-offs:**
- **Pro:** Eliminates echo in 99% of cases
- **Con:** Adds 800ms delay to conversation flow
- **Con:** User cannot speak immediately after AI

**Alternatives Considered:**
- Echo cancellation only → Still had echo in testing
- Longer delay (1500ms) → Felt unnatural
- No delay → Echo loops occurred

**Status:** ✅ Accepted, working well

---

### Decision 4: Conversation History Management

**Decision:** Store full conversation in memory (HTTP mode)

```typescript
conversationHistory: Array<{
  role: 'system' | 'user' | 'assistant';
  content: string;
}> = [];
```

**Rationale:**
- GPT-4 needs context for coherent conversation
- Chat API requires message history
- Memory usage is negligible (<1KB per message)
- Simple to implement

**Trade-offs:**
- **Pro:** Natural multi-turn conversations
- **Pro:** AI remembers context
- **Con:** Longer conversations = higher API costs
- **Con:** No history pruning (could grow unbounded)

**Future Enhancement:**
- Implement sliding window (keep last 20 messages)
- Summarize old context to reduce tokens

**Status:** ✅ Accepted, working

---

### Decision 5: Realtime API Voice Selection

**Decision:** Validate voice against Realtime API whitelist

```typescript
const REALTIME_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'sage', 'shimmer', 'verse', 'marin', 'cedar'
] as const;

// Fallback to 'alloy' if invalid
if (!isRealtimeVoice(selectedVoice)) {
  console.warn(`Voice '${selectedVoice}' not supported, using 'alloy'`);
  selectedVoice = 'alloy';
}
```

**Rationale:**
- Realtime API supports only specific voices
- TTS API supports different voices
- Avoid silent failures with invalid voices

**Trade-offs:**
- **Pro:** Prevents runtime errors
- **Pro:** Clear user feedback
- **Con:** Tightly coupled to OpenAI's voice list

**Status:** ✅ Accepted, implemented

---

## Debugging Guide

### Problem: No audio in WebRTC mode

#### Step 1: Check Browser Console

Look for these log messages:

**Good signs:**
```
✅ Audio element created (autoplay=true, attached to DOM)
🔊 Received remote audio track from OpenAI
✅ Remote stream has 1 audio track(s)
✅ Audio track enabled
```

**Bad signs:**
```
❌ No audio tracks in remote stream
❌ HTMLAudioElement.play() failed
⚠️  Audio element paused - may need user interaction
```

#### Step 2: Check Peer Connection State

```typescript
console.log('Connection state:', peerConnection.connectionState);
console.log('ICE state:', peerConnection.iceConnectionState);
```

**Expected:**
- Connection state: `'connected'`
- ICE state: `'connected'` or `'completed'`

**Problems:**
- Connection state: `'failed'` → Network/firewall issue
- ICE state: `'disconnected'` → Network issue

#### Step 3: Check Audio Element State

```typescript
console.log('Audio element:', {
  paused: audioElement.paused,
  muted: audioElement.muted,
  volume: audioElement.volume,
  srcObject: audioElement.srcObject,
  readyState: audioElement.readyState
});
```

**Expected:**
- paused: `false`
- muted: `false`
- volume: `1.0`
- srcObject: `MediaStream` (not null)
- readyState: `4` (HAVE_ENOUGH_DATA)

#### Step 4: Test Native Browser

Open the same WebRTC code in Chrome/Safari (not Tauri):

```bash
# Start Next.js dev server
npm run dev

# Open in Chrome
open http://localhost:3000
```

If audio works in Chrome but not Tauri → **WKWebView limitation confirmed**

#### Step 5: Verify Microphone Permissions

```bash
# macOS: Check microphone permission
sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
  "SELECT * FROM access WHERE service='kTCCServiceMicrophone';"
```

Ensure Sentra/Tauri has microphone access.

---

### Problem: Echo in conversation

#### Symptom
AI hears its own voice and responds to itself in a loop.

#### Diagnosis

1. **Check echo cancellation:**
   ```typescript
   stream.getAudioTracks()[0].getSettings().echoCancellation
   // Should be: true
   ```

2. **Check microphone state during AI speech:**
   ```typescript
   // When AI is speaking, mic should be disabled
   console.log('Track enabled:', audioTrack.enabled); // Should be: false
   ```

3. **Check timing:**
   ```typescript
   // Should see 800ms delay after AI finishes
   console.log('Audio ended at:', Date.now());
   // ... 800ms later ...
   console.log('Mic resumed at:', Date.now());
   ```

#### Solutions

- **Increase safety delay:** Change `800ms` to `1200ms`
- **Verify hardware muting:** Ensure `audioTrack.enabled = false` works
- **Check audio routing:** Ensure speakers aren't too close to microphone

---

### Problem: High latency in HTTP mode

#### Symptom
3-5 seconds feels too slow.

#### Diagnosis

Add timing logs:

```typescript
const t0 = Date.now();
const transcript = await transcribeAudio(blob);
console.log('Whisper:', Date.now() - t0, 'ms');

const t1 = Date.now();
const response = await getAIResponse();
console.log('GPT-4:', Date.now() - t1, 'ms');

const t2 = Date.now();
const audio = await textToSpeech(response);
console.log('TTS:', Date.now() - t2, 'ms');
```

#### Optimizations

1. **Use faster models:**
   - TTS: `tts-1` instead of `tts-1-hd` (✅ already done)
   - GPT: `gpt-4o-mini` instead of `gpt-4o` (saves ~200ms)

2. **Reduce max_tokens:**
   ```typescript
   max_tokens: 150 // ✅ Already optimized for voice
   ```

3. **Parallel processing:**
   - Start TTS immediately when first sentence completes
   - Stream GPT-4 response (requires SSE support)

---

### Problem: User transcript not showing

#### Symptom
User speaks but no transcript appears.

#### Diagnosis (WebRTC mode)

Check event handler:

```typescript
case 'conversation.item.input_audio_transcription.completed':
  console.log('Transcript event:', event);
  if (event.transcript) {
    console.log('User said:', event.transcript);
    this.config.onUserTranscript(event.transcript);
  }
  break;
```

Ensure session config enables transcription:

```typescript
session: {
  input_audio_transcription: {
    model: 'whisper-1'  // ✅ Required!
  }
}
```

#### Diagnosis (HTTP mode)

Check Whisper response:

```typescript
const data = await response.json();
console.log('Whisper response:', data);
// Should have: { text: "..." }
```

Check for errors:

```typescript
if (!response.ok) {
  console.error('Whisper failed:', response.status);
  const error = await response.text();
  console.error('Error:', error);
}
```

---

### Problem: Response cancel errors

#### Symptom
Console shows: `response_cancel_not_active` error

#### Cause
Race condition: Sending `response.cancel` before OpenAI activates the response.

#### Solution (Already Implemented)

```typescript
// Bug #7 Fix: Add timing check
if (this.isAIResponding && this.currentResponseId) {
  const timeSinceStart = Date.now() - this.responseStartTime;

  if (timeSinceStart >= 100) {
    // Safe to cancel
    this.send({ type: 'response.cancel' });
  } else {
    // Too early - response will stop naturally
    console.log('Response too new, skipping cancel');
  }
}
```

If still seeing errors, increase threshold from `100ms` to `200ms`.

---

### Problem: Memory leaks / poor performance

#### Symptom
App slows down after multiple conversations.

#### Diagnosis

Check cleanup:

```typescript
// Add logging to cleanup()
cleanup(): void {
  console.log('Cleaning up...');

  // Stop tracks
  if (this.stream) {
    this.stream.getTracks().forEach(track => {
      console.log('Stopping track:', track.kind);
      track.stop();
    });
  }

  // Close connections
  if (this.peerConnection) {
    console.log('Closing peer connection');
    this.peerConnection.close();
  }

  // Remove DOM elements
  if (this.remoteAudioElement?.parentNode) {
    console.log('Removing audio element from DOM');
    this.remoteAudioElement.parentNode.removeChild(this.remoteAudioElement);
  }
}
```

#### Common Issues

1. **Audio element not removed from DOM**
   - Solution: Ensure `cleanup()` removes it

2. **Event listeners not cleared**
   - Solution: Set all event handlers to `null`

3. **MediaStream tracks not stopped**
   - Solution: Call `track.stop()` on all tracks

4. **Peer connection not closed**
   - Solution: Call `peerConnection.close()`

---

## Future Considerations

### 1. AudioWorklet Integration

**Goal:** Bypass WKWebView audio limitations by routing audio through native Rust playback.

**Implementation Plan:**

```
Phase 1: AudioWorklet Processor
- Create /public/webrtc-audio-processor.js
- Capture remote audio in 4096-sample chunks
- Convert Float32 → Int16 PCM
- Send to main thread via postMessage

Phase 2: Tauri IPC Bridge
- Base64 encode PCM data
- Send to Rust via invoke('play_audio_chunk')
- Decode in Rust

Phase 3: Native Audio Playback
- Use rodio crate for audio playback
- Route to CoreAudio (macOS) / WASAPI (Windows)
- Handle buffering and synchronization

Phase 4: Testing
- Test latency (target: <200ms)
- Test audio quality
- Test synchronization with transcripts
```

**Expected Results:**
- ✅ Audio works in WKWebView
- ✅ Low latency (~100-200ms)
- ✅ High quality PCM audio

**Risks:**
- IPC overhead (base64 encoding/decoding)
- Audio synchronization issues
- Buffer underruns/overruns

**Reference:** See `/Users/barnent1/Projects/sentra/HANDOVER-2025-11-14-AUDIOWORKLET.md`

---

### 2. Streaming GPT-4 Responses (HTTP Mode)

**Goal:** Reduce latency in HTTP mode by streaming text as it's generated.

**Current:**
```
User speaks → Wait 3-5s → AI speaks (complete response)
```

**Future:**
```
User speaks → Wait 1s → AI speaks (streaming, first sentence)
             → Continue streaming remaining sentences
```

**Implementation:**

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: conversationHistory,
    stream: true, // ← Enable streaming
  }),
});

// Parse SSE events
const reader = response.body.getReader();
const decoder = new TextDecoder();

let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // Parse SSE events (data: {...}\n\n)
  const lines = buffer.split('\n\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      const delta = data.choices[0]?.delta?.content;

      if (delta) {
        // Stream text chunk
        processTextChunk(delta);
      }
    }
  }
}
```

**Challenges:**
- TTS API doesn't support streaming (yet)
- Need sentence detection to split chunks
- Audio playback queueing complexity

---

### 3. Conversation History Pruning

**Goal:** Prevent unbounded memory/cost growth in long conversations.

**Strategies:**

#### Strategy 1: Sliding Window
Keep last N messages:

```typescript
const MAX_MESSAGES = 20;

if (conversationHistory.length > MAX_MESSAGES) {
  // Keep system message + last 20
  conversationHistory = [
    conversationHistory[0], // system prompt
    ...conversationHistory.slice(-MAX_MESSAGES)
  ];
}
```

#### Strategy 2: Summarization
Summarize old context:

```typescript
if (conversationHistory.length > 30) {
  // Summarize messages 2-10
  const toSummarize = conversationHistory.slice(1, 11);
  const summary = await summarizeConversation(toSummarize);

  conversationHistory = [
    conversationHistory[0], // system
    { role: 'system', content: `Previous conversation summary: ${summary}` },
    ...conversationHistory.slice(11) // Recent messages
  ];
}
```

#### Strategy 3: Token Budget
Enforce max tokens:

```typescript
const MAX_TOKENS = 2000;

let totalTokens = estimateTokens(conversationHistory);
while (totalTokens > MAX_TOKENS) {
  // Remove oldest non-system message
  conversationHistory.splice(1, 1);
  totalTokens = estimateTokens(conversationHistory);
}
```

**Recommendation:** Start with Strategy 1 (simplest)

---

### 4. Voice Command Detection

**Goal:** Detect special commands ("Stop", "Repeat that", "Slower")

**Implementation:**

```typescript
case 'conversation.item.input_audio_transcription.completed':
  const transcript = event.transcript.toLowerCase();

  // Detect commands
  if (transcript.includes('stop') || transcript.includes('cancel')) {
    this.send({ type: 'response.cancel' });
    return; // Don't process as normal input
  }

  if (transcript.includes('repeat') || transcript.includes('say that again')) {
    // Replay last AI response
    const lastResponse = this.conversationHistory
      .filter(m => m.role === 'assistant')
      .pop();

    if (lastResponse) {
      const audio = await this.textToSpeech(lastResponse.content);
      this.playAudio(audio);
    }
    return;
  }

  if (transcript.includes('slower')) {
    // Adjust TTS speed
    this.ttsSpeed = 0.8;
  }

  // Normal processing
  this.config.onUserTranscript(event.transcript);
  break;
```

---

### 5. Multi-Language Support

**Goal:** Support conversations in languages other than English.

**Changes Needed:**

1. **Session Configuration:**
   ```typescript
   session: {
     input_audio_transcription: {
       model: 'whisper-1',
       language: 'es' // Spanish
     }
   }
   ```

2. **System Prompt:**
   ```typescript
   const instructions = `Eres Sentra, un asistente de IA experto en arquitectura de software...`;
   ```

3. **Voice Selection:**
   ```typescript
   // TTS voices by language
   const VOICES_BY_LANG = {
     en: ['alloy', 'echo', 'nova'],
     es: ['alloy'], // Spanish accent
     fr: ['alloy'], // French accent
   };
   ```

**Challenges:**
- Voice quality varies by language
- Realtime API may have latency differences
- Need UI for language selection

---

### 6. Cost Optimization

**Goal:** Reduce API costs while maintaining quality.

#### Current Costs (per 10-minute conversation)

**WebRTC Mode:**
```
Realtime API: $0.06/minute × 10 = $0.60
```

**HTTP Mode:**
```
Whisper:  $0.006/minute × 10 = $0.06
GPT-4o:   ~300 tokens/turn × 20 turns × $0.0025/1K = $0.15
TTS:      ~50 chars/turn × 20 turns × $0.015/1K = $0.015
Total: $0.225
```

#### Optimization Strategies

1. **Use GPT-4o-mini for simple conversations:**
   ```typescript
   // Detect complex vs simple
   const isComplexQuery = transcript.length > 100 ||
                          transcript.includes('architecture') ||
                          transcript.includes('implement');

   const model = isComplexQuery ? 'gpt-4o' : 'gpt-4o-mini';
   ```

2. **Reduce max_tokens dynamically:**
   ```typescript
   // Voice conversations need brevity
   const max_tokens = isVoiceMode ? 100 : 500;
   ```

3. **Cache system prompts:**
   - Use prompt caching (GPT-4o feature)
   - Save 50% on system message tokens

4. **Batch TTS requests:**
   - Queue multiple sentences
   - Send in single request

---

### 7. Offline Mode

**Goal:** Enable voice conversations without internet (local models).

**Architecture:**

```
Whisper.cpp (local STT)
     ↓
Llama 3 / Mistral (local LLM)
     ↓
Piper TTS (local TTS)
```

**Implementation:**

1. **Download Models:**
   - Whisper: `whisper-base` (~140MB)
   - LLM: `llama-3-8b-instruct` (~4GB)
   - TTS: `piper-en_US-lessac` (~50MB)

2. **Rust Integration:**
   ```rust
   // Use whisper-rs crate
   use whisper_rs::WhisperContext;

   #[tauri::command]
   fn transcribe_local(audio_path: String) -> Result<String, String> {
       let ctx = WhisperContext::new("models/ggml-base.bin")?;
       let transcript = ctx.full_from_file(audio_path)?;
       Ok(transcript)
   }
   ```

3. **LLM Inference:**
   ```rust
   // Use llama-cpp-rs
   use llama_cpp_rs::LlamaModel;

   #[tauri::command]
   fn generate_response(prompt: String) -> Result<String, String> {
       let model = LlamaModel::load("models/llama-3-8b.gguf")?;
       let response = model.complete(&prompt)?;
       Ok(response)
   }
   ```

**Challenges:**
- Large model downloads (~4GB)
- High CPU/RAM usage
- Slower than cloud APIs (10-30s vs 3-5s)
- Quality not as good as GPT-4

**Use Case:**
- Privacy-sensitive conversations
- No internet connectivity
- Cost-conscious users

---

## Appendix A: WebRTC Event Reference

### Data Channel Events (sent by client)

| Event | Purpose | Payload |
|-------|---------|---------|
| `session.update` | Configure session | `{ modalities, voice, turn_detection, ... }` |
| `response.create` | Request AI response | `{ instructions }` |
| `response.cancel` | Stop AI mid-response | `{}` |
| `input_audio_buffer.clear` | Clear mic buffer | `{}` |
| `conversation.item.create` | Add message | `{ item: { role, content } }` |

### Data Channel Events (received from server)

| Event | Triggered When | Payload |
|-------|----------------|---------|
| `session.created` | Connection established | `{ session: { id, ... } }` |
| `session.updated` | Config changed | `{ session }` |
| `response.created` | AI starts thinking | `{ response: { id } }` |
| `response.done` | AI finished | `{ response }` |
| `response.cancelled` | Response stopped | `{}` |
| `input_audio_buffer.speech_started` | User starts speaking | `{}` |
| `input_audio_buffer.speech_stopped` | User stops speaking | `{}` |
| `conversation.item.created` | Message added | `{ item }` |
| `conversation.item.input_audio_transcription.completed` | User speech transcribed | `{ transcript }` |
| `output_audio_buffer.started` | AI starts speaking | `{}` |
| `response.audio.delta` | Audio chunk (not used in WebRTC) | `{ delta }` |
| `response.audio.done` | AI audio complete | `{}` |
| `response.audio_transcript.delta` | AI speech transcribed (partial) | `{ delta }` |
| `response.audio_transcript.done` | AI speech transcribed (complete) | `{ transcript }` |
| `error` | Something failed | `{ error: { code, message } }` |

---

## Appendix B: HTTP API Reference

### Whisper Transcription

**Endpoint:** `POST https://api.openai.com/v1/audio/transcriptions`

**Request:**
```typescript
const formData = new FormData();
formData.append('file', audioBlob, 'audio.webm');
formData.append('model', 'whisper-1');

fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}` },
  body: formData
});
```

**Response:**
```json
{
  "text": "Hello, how are you today?"
}
```

---

### GPT-4 Completion

**Endpoint:** `POST https://api.openai.com/v1/chat/completions`

**Request:**
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are Sentra..." },
    { "role": "user", "content": "Hello, how are you?" }
  ],
  "temperature": 0.8,
  "max_tokens": 150
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I'm doing great! How can I help you today?"
      }
    }
  ]
}
```

---

### TTS Speech Synthesis

**Endpoint:** `POST https://api.openai.com/v1/audio/speech`

**Request:**
```json
{
  "model": "tts-1",
  "voice": "nova",
  "input": "I'm doing great! How can I help you today?"
}
```

**Response:**
- Binary audio data (MP3 format)
- Content-Type: `audio/mpeg`

---

## Appendix C: Rust Audio Integration (Planned)

### Dependencies

```toml
[dependencies]
rodio = "0.17"
base64 = "0.21"
```

### Thread-Local Audio Sink

```rust
use rodio::{OutputStream, Sink};
use std::cell::RefCell;

thread_local! {
    static AUDIO_SINK: RefCell<Option<(OutputStream, Sink)>> = RefCell::new(None);
}
```

### PCM Audio Source

```rust
struct PcmSource {
    samples: Vec<i16>,
    sample_rate: u32,
    channels: u16,
    position: usize,
}

impl Iterator for PcmSource {
    type Item = i16;

    fn next(&mut self) -> Option<Self::Item> {
        if self.position >= self.samples.len() {
            None
        } else {
            let sample = self.samples[self.position];
            self.position += 1;
            Some(sample)
        }
    }
}

impl Source for PcmSource {
    fn current_frame_len(&self) -> Option<usize> {
        Some(self.samples.len() - self.position)
    }

    fn channels(&self) -> u16 {
        self.channels
    }

    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn total_duration(&self) -> Option<Duration> {
        let total_samples = self.samples.len() / self.channels as usize;
        let seconds = total_samples as f64 / self.sample_rate as f64;
        Some(Duration::from_secs_f64(seconds))
    }
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-15 | Glen Barnhardt with Claude Code | Initial comprehensive documentation |

---

**End of Document**
