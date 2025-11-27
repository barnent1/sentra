# Voice System - Microphone Management

**Date:** November 17, 2025
**Status:** Official guidance
**Last Updated:** 2025-11-17

---

## CRITICAL: Why Manual Toggling Breaks Echo Cancellation

**Research Finding (November 2025):**

We discovered through extensive testing that browser echo cancellation ONLY works when the audio playback stays within the browser's processing pipeline. When we tried to "improve" the system by routing audio through AudioWorklet to native Rust audio (to bypass WKWebView limitations), we completely broke echo cancellation.

**The Problem:**
Browser AEC (Acoustic Echo Cancellation) works by comparing TWO signals:
1. **Microphone input** - what the mic is hearing
2. **Speaker output** - what the browser is playing

When both signals are in the browser pipeline (HTMLAudioElement), the AEC can subtract the speaker output from the mic input, eliminating echo perfectly.

When we bypass to native audio (AudioWorklet → Rust → CoreAudio), the browser can NO LONGER SEE the speaker output. The AEC only sees the mic input, which includes the AI's voice coming from speakers, creating an echo loop.

**This discovery led to Decision 4 in VOICE-SYSTEM.md:**
- Keep audio in browser pipeline (HTMLAudioElement)
- Do NOT use AudioWorklet bypass
- Do NOT manually toggle microphone
- Trust browser echo cancellation (it works!)

**Result:**
Echo cancellation works perfectly in all browsers. WKWebView desktop users temporarily use HTTP API fallback (higher latency but reliable) until Tauri fixes audio output.

---

## The Official Approach

**Always-On Microphone + Browser Echo Cancellation**

This is the industry standard pattern used by:
- ChatGPT voice mode
- Google Meet
- Zoom
- All production WebRTC voice applications

### How It Works

1. **Microphone stays enabled** - `track.enabled` remains `true` throughout the conversation
2. **Browser handles echo** - Native AEC (Acoustic Echo Cancellation) prevents feedback loops
3. **Server handles turns** - OpenAI's server-side VAD detects when user starts/stops speaking
4. **No manual toggling** - No need to pause/resume the microphone track

### Implementation

```typescript
// Get microphone with echo cancellation
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,  // ← CRITICAL for preventing feedback
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

// That's it! No manual track.enabled toggling needed.
```

---

## Deprecated Approaches (Do Not Use)

### Deprecated Pattern 1: Manual Microphone Toggling

Previously, Quetrex attempted to manually toggle the microphone on every turn:

```typescript
// ❌ WRONG - Do not do this
case 'output_audio_buffer.started':
  audioTrack.enabled = false  // Pause mic when AI speaks
  break

case 'response.audio.done':
  setTimeout(() => {
    audioTrack.enabled = true  // Resume mic after AI finishes
  }, 800)
  break
```

**Why This Is Wrong:**
1. **Not the industry standard** - No major voice application does this
2. **Causes bugs** - Complex state management, race conditions, timing issues
3. **Breaks user experience** - Artificial delays between conversation turns
4. **Unnecessary** - Browser echo cancellation already handles this

### Deprecated Pattern 2: AudioWorklet Bypass

We attempted to solve WKWebView audio limitations by routing audio through AudioWorklet to native Rust playback:

```typescript
// ❌ WRONG - Breaks echo cancellation
WebRTC remote audio
  → AudioWorklet processor (capture PCM chunks)
  → Tauri IPC (base64 encoded)
  → Rust rodio playback
  → CoreAudio → Speakers
```

**Why This Breaks Echo Cancellation:**
1. **Browser AEC requires visibility** - AEC compares mic input vs speaker output
2. **AudioWorklet breaks the chain** - Audio goes to Rust, browser can't see it
3. **AEC only sees microphone** - AI's voice from speakers gets picked up by mic
4. **Result: Echo loop** - AI hears itself and responds to its own voice

**The Fundamental Problem:**
Modern browsers implement echo cancellation by comparing two signals IN THE SAME PROCESSING PIPELINE. When you route audio outside the browser (to native audio), the echo cancellation breaks because it can't compare the signals anymore.

**Correct Solution:**
Keep audio in browser pipeline (HTMLAudioElement), accept WKWebView limitation temporarily, use HTTP API fallback for desktop.

### Status in Codebase

The deprecated `pauseRecording()` and `resumeRecording()` methods still exist in the codebase and are still being called. These should be removed. They are marked as `@deprecated` in the code.

**Files containing deprecated calls:**
- `/src/lib/openai-realtime.ts` - Contains the deprecated methods and calls them
- `/tests/unit/lib/openai-realtime.test.ts` - Tests the deprecated behavior

**AudioWorklet Bypass:**
The AudioWorklet implementation was designed but never fully integrated for this exact reason - it breaks echo cancellation. Do not attempt to complete this implementation.

---

## Migration Path

To fully migrate to the always-on approach:

### Step 1: Verify echo cancellation is working
```typescript
// Check that constraint is set
const settings = stream.getAudioTracks()[0].getSettings();
console.log('Echo cancellation:', settings.echoCancellation); // Should be true
```

### Step 2: Remove pauseRecording() calls
Remove all instances of:
- `this.pauseRecording()` in event handlers
- `this.resumeRecording()` in event handlers
- The 800ms safety delays

### Step 3: Remove the methods
Once confirmed working, remove:
- `pauseRecording()` method
- `resumeRecording()` method
- Any state tracking for "is mic paused"

### Step 4: Update tests
Remove or update tests that verify pause/resume behavior.

---

## Troubleshooting

### Problem: Hearing echo

**Check:**
1. Is `echoCancellation: true` set in getUserMedia?
2. Is the microphone track staying enabled throughout?
3. Are you using a modern browser (Chrome/Safari have best AEC)?
4. Are speakers too close to microphone? (physical issue)

**Do NOT:**
- Add artificial delays
- Toggle track.enabled
- Implement manual echo cancellation

**Do:**
- Test in Chrome/Safari
- Verify echoCancellation constraint
- Check physical audio setup

### Problem: User can't interrupt AI

This should work automatically with the always-on approach:
1. User starts speaking
2. Server-side VAD detects speech
3. `input_audio_buffer.speech_started` event fires
4. Client pauses audio playback (not microphone!)
5. Client sends `response.cancel` to stop AI

The microphone never gets disabled in this flow.

---

## Why Browser Echo Cancellation Works

Modern browsers use sophisticated algorithms:

1. **Acoustic Echo Cancellation (AEC)** - Filters out speaker audio before it reaches mic input
2. **Adaptive filtering** - Learns the room's acoustic properties in real-time
3. **Noise suppression** - Removes background noise
4. **Auto gain control** - Normalizes volume levels

These are the same algorithms used in professional video conferencing tools.

**Trust the browser.** Don't try to reinvent echo cancellation with delays and toggling.

---

## References

### Documentation
- `/docs/architecture/VOICE-SYSTEM.md` - Complete voice system architecture
- `/docs/features/voice-interface.md` - User-facing voice features
- `CLAUDE.md` - Project context including voice system notes

### Code
- `/src/lib/openai-realtime.ts` - WebRTC implementation (contains deprecated methods)
- `/src/lib/openai-voice.ts` - HTTP fallback implementation

### Tests
- `/tests/unit/lib/openai-realtime.test.ts` - Tests for WebRTC implementation

---

## History

### Why We Tried Manual Toggling

The team initially thought echo prevention required manually disabling the microphone when AI speaks. This was based on a misunderstanding of how WebRTC echo cancellation works.

### What We Learned

After extensive debugging and research, we discovered:
1. Manual toggling is NOT the industry pattern
2. Browser echo cancellation is sufficient
3. All major voice apps use always-on microphones
4. The toggle approach causes more problems than it solves

### Cleanup Status

As of November 17, 2025:
- ✅ Documentation updated to describe correct approach
- ✅ Deprecated methods marked with `@deprecated` tags
- ✅ Code comments explain what should be done
- ⏳ Actual code still uses deprecated approach (needs refactor)
- ⏳ Tests still verify deprecated behavior (needs update)

---

**Author:** Documentation cleanup by Claude Code
**Approved by:** Glen Barnhardt
**Date:** November 17, 2025
