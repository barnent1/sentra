# ADR-001: Voice Echo Cancellation Strategy

**Status**: Accepted
**Date**: 2025-11-17
**Deciders**: Glen Barnhardt, Claude Code Research Agents
**Related Documents**:
- `/docs/architecture/VOICE-SYSTEM.md` (Decision 4)
- `/docs/development/VOICE-MICROPHONE-MANAGEMENT.md`
- `CLAUDE.md` (Voice System Architecture section)

---

## Context

Quetrex implements a voice-first AI assistant using OpenAI's Realtime API over WebRTC. During development, we encountered a critical challenge: how to prevent echo loops (the AI hearing its own voice through the user's microphone and responding to itself).

### The Problem Space

When implementing voice conversations, echo can occur when:
1. AI speaks through user's speakers
2. User's microphone picks up the AI's voice from the speakers
3. This audio is sent back to OpenAI
4. AI hears itself and responds, creating a feedback loop

### Initial Assumptions

We initially believed that echo prevention required one of:
- Manual microphone toggling (disable mic when AI speaks)
- Custom echo cancellation implementation
- Audio routing through native code with advanced signal processing

### Research Findings (November 2025)

Through extensive testing and research, we discovered:

1. **Browser echo cancellation WORKS** - Modern browsers (Chrome, Safari, Firefox) have excellent Acoustic Echo Cancellation (AEC) built-in
2. **Industry standard pattern** - ChatGPT voice, Google Meet, Zoom, Discord all use always-on microphones with browser AEC
3. **Critical requirement** - Browser AEC requires audio playback to stay within the browser's processing pipeline
4. **Why AudioWorklet breaks AEC** - Routing audio through AudioWorklet → Rust → CoreAudio removes speaker output from browser's visibility, breaking echo cancellation

### Key Discovery: Browser Pipeline Requirement

Modern browsers implement AEC by comparing TWO signals:
- **Microphone input** (what the mic hears)
- **Speaker output** (what the browser is playing)

The AEC algorithm subtracts the known speaker output from the microphone input, eliminating echo.

**This ONLY works when both signals are in the same processing pipeline.**

When audio is routed outside the browser (via AudioWorklet to native audio), the browser can no longer see the speaker output. The AEC only has the microphone input signal, which includes the AI's voice from the speakers, resulting in echo loops.

---

## Decision

**We will implement Option A: Trust Industry Pattern**

### Core Principles

1. **Always-on microphone** - MediaStreamTrack.enabled stays true throughout conversation
2. **Browser echo cancellation** - Use native browser AEC (echoCancellation: true)
3. **Audio in browser pipeline** - Use HTMLAudioElement exclusively for audio playback
4. **No manual toggling** - Do not disable/enable microphone track between turns
5. **HTTP API fallback** - Use Whisper + GPT-4 + TTS for desktop until Tauri fixes WKWebView

### Implementation

```typescript
// Get microphone with echo cancellation
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,  // CRITICAL - enables browser AEC
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  }
});

// Add to peer connection - stays enabled
peerConnection.addTrack(stream.getAudioTracks()[0], stream);

// Play audio through HTMLAudioElement (browser pipeline)
const audioElement = new Audio();
audioElement.srcObject = remoteMediaStream;
audioElement.play();

// Server-side VAD handles turn detection
session: {
  turn_detection: {
    type: 'server_vad',
    silence_duration_ms: 1200
  }
}
```

### Platform Strategy

| Platform | Approach | Reason |
|----------|----------|--------|
| **Web browsers** | WebRTC with browser AEC | Works perfectly, low latency |
| **Desktop (WKWebView)** | HTTP API fallback | WKWebView can't play WebRTC audio yet |
| **Future desktop** | WebRTC when Tauri fixes issue | Will enable low latency for all platforms |

---

## Consequences

### Positive Consequences

1. **Echo cancellation works perfectly** - Industry-proven approach, no echo loops
2. **Simpler architecture** - No IPC audio streaming, no AudioWorklet complexity
3. **Natural interruptions** - User can interrupt AI mid-sentence without artificial delays
4. **Proven reliability** - Same pattern used by ChatGPT, Google Meet, Zoom, Discord
5. **Works in all browsers** - Chrome, Firefox, Safari, Edge all have excellent AEC
6. **Maintainable code** - No complex state management for mic toggling
7. **Future-proof** - When Tauri fixes WKWebView, we just enable WebRTC for desktop

### Negative Consequences

1. **No audio in WKWebView** - Desktop users don't hear AI voice in WebRTC mode (temporary)
2. **Desktop uses HTTP API** - Higher latency (3-5s) for desktop users temporarily
3. **Platform dependency** - Relies on browser AEC quality (excellent on modern browsers)
4. **WKWebView wait** - Must wait for Tauri to fix audio output for MediaStream

### Mitigation Strategies

1. **HTTP API fallback** - Desktop users get reliable voice, just higher latency
2. **Platform detection** - Automatically use best approach for each platform
3. **Clear documentation** - Explain WKWebView limitation and fallback
4. **Monitor Tauri issues** - Track progress on WKWebView audio fix

---

## Alternatives Considered

### Option B: AudioWorklet Bypass + Manual Mic Toggling

**Approach:**
```
WebRTC → AudioWorklet → Tauri IPC → Rust rodio → CoreAudio
+ Manual microphone toggling (disable when AI speaks)
+ 800ms safety delays
```

**Why Rejected:**
- ❌ **Breaks echo cancellation** - Browser can't see speaker output
- ❌ **Not industry standard** - No production app does this
- ❌ **Complex state management** - Race conditions, timing bugs
- ❌ **Artificial delays** - Poor UX, interruptions don't work naturally
- ❌ **Maintenance burden** - Complex code to maintain
- ❌ **Solves wrong problem** - WKWebView limitation is temporary

**Rating:** 2/10 - Technically works but fundamentally flawed approach

### Option C: Native Rust WebRTC

**Approach:**
Implement entire WebRTC stack in Rust using `webrtc-rs` crate, handle audio playback natively.

**Why Rejected:**
- ❌ **2-4 weeks development** - Significant engineering time
- ❌ **Duplicate implementation** - Browser already has excellent WebRTC
- ❌ **Still need AEC** - Must implement echo cancellation ourselves
- ❌ **Maintenance burden** - Another WebRTC implementation to maintain
- ❌ **Overkill** - Massive effort for a temporary platform limitation

**Rating:** 3/10 - Would work but wasteful

### Option D: Manual Echo Cancellation

**Approach:**
Implement our own echo cancellation algorithm (frequency domain subtraction, adaptive filtering).

**Why Rejected:**
- ❌ **Reinventing the wheel** - Browser AEC is excellent
- ❌ **Complex signal processing** - Requires DSP expertise
- ❌ **Worse quality** - Unlikely to match browser AEC
- ❌ **Maintenance burden** - Complex algorithm to tune and maintain
- ❌ **Unnecessary** - Browser already solves this problem

**Rating:** 1/10 - Academic exercise, not practical

---

## Implementation Plan

### Phase 1: Document Decision (Completed 2025-11-17)

- ✅ Update `/docs/architecture/VOICE-SYSTEM.md` with Decision 4
- ✅ Update `/docs/development/VOICE-MICROPHONE-MANAGEMENT.md` with critical context
- ✅ Update `CLAUDE.md` with explicit guidance
- ✅ Create this ADR (ADR-001)
- ✅ Update code comments in `src/lib/openai-realtime.ts`

### Phase 2: Remove Deprecated Patterns (Future)

1. Remove `pauseRecording()` calls from event handlers
2. Remove `resumeRecording()` calls from event handlers
3. Remove 800ms safety delays
4. Mark `pauseRecording()` / `resumeRecording()` as deprecated
5. Update tests to verify always-on microphone
6. Verify echo cancellation works in test environments

### Phase 3: Monitor Platform Progress (Ongoing)

1. Watch Tauri issues for WKWebView audio fixes
2. Test WebRTC audio in new Tauri versions
3. Enable WebRTC for desktop when available
4. Deprecate HTTP API fallback detection

---

## References

### Industry Research

**ChatGPT Voice Mode:**
- Uses always-on microphone
- Browser echo cancellation
- No manual mic toggling observed
- Natural interruptions work perfectly

**Google Meet / Zoom / Discord:**
- All use WebRTC with browser AEC
- Always-on microphones
- Server-side VAD for turn detection
- No manual track toggling

### Technical References

**WebRTC Specification:**
- Defines echo cancellation as a constraint for getUserMedia
- AEC implemented at browser level, not application level
- Requires audio capture and playback in same pipeline

**Browser AEC Documentation:**
- Chrome: Uses WebRTC's AEC3 algorithm (industry leading)
- Safari: Uses system-level AEC with WebRTC integration
- Firefox: Uses WebRTC AEC implementation
- All provide excellent echo cancellation quality

**Platform Limitations:**
- Tauri Issue #13143: "WebRTC audio not working"
- WKWebView on macOS 13.1+ cannot play MediaStream audio
- Apple Developer Forums: Multiple threads on WKWebView audio limitations
- Temporary issue, likely to be fixed in future Tauri/WKWebView updates

---

## Decision Rationale

This decision prioritizes:

1. **Correctness over features** - Working echo cancellation is non-negotiable
2. **Industry standards over innovation** - Use proven patterns, not experimental approaches
3. **Simplicity over complexity** - Trust browser capabilities, don't reinvent
4. **Long-term maintainability** - Simple code is easier to maintain
5. **User experience** - Natural conversations without artificial delays

The temporary tradeoff (higher latency for desktop users) is acceptable because:
- Desktop users still get functional voice (HTTP API)
- The limitation is platform-specific and temporary
- The correct architecture is in place for when platform is fixed
- Breaking echo cancellation for all users would be far worse

---

## Future Considerations

### When WKWebView Audio is Fixed

1. Remove platform detection for audio support
2. Enable WebRTC for all platforms
3. Deprecate HTTP API fallback (keep for backwards compatibility)
4. All users get low-latency voice with working echo cancellation

### Potential Enhancements

1. **Adaptive VAD** - Tune silence duration based on user patterns
2. **Quality monitoring** - Detect poor AEC and suggest hardware changes
3. **Noise suppression tuning** - Adjust based on environment detection
4. **Background noise detection** - Warn users about problematic environments

### Never Consider

1. **AudioWorklet bypass** - Breaks echo cancellation, do not implement
2. **Manual mic toggling** - Not industry standard, causes bugs
3. **Custom AEC** - Browser AEC is better, don't reinvent
4. **Native audio routing** - Breaks browser pipeline, defeats AEC

---

## Approval

**Approved by:** Glen Barnhardt
**Date:** 2025-11-17
**Status:** Accepted and implemented

This decision is **FINAL**. Do not attempt to:
- Implement AudioWorklet bypass
- Add manual microphone toggling
- "Improve" browser echo cancellation
- Route audio outside browser pipeline

Trust the industry pattern. It works.

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-17 | Initial ADR created | Claude Code |
| 2025-11-17 | Approved by Glen Barnhardt | Glen Barnhardt |

---

## Update: November 2025 - Web App Decision

**Final Decision:** Convert Quetrex to a pure web application

**Context:** WKWebView on macOS cannot play WebRTC audio (Apple platform bug). All workarounds (AudioWorklet bypass, manual mic toggling) break echo cancellation. Voice is the core product feature.

**Decision:** Deploy Quetrex as a web application accessible via browser instead of desktop app.

**Reasoning:**
1. **Browser echo cancellation works perfectly** - Chrome, Safari, Firefox, Edge all have excellent AEC
2. **No platform limitations** - Runs directly in browser, no WKWebView issues
3. **Universal access** - Works on any device with a browser (macOS, Windows, Linux, tablets, phones)
4. **Simpler deployment** - Deploy once to web, everyone gets updates instantly
5. **Proven approach** - ChatGPT voice, Google Meet, Zoom all run in browsers successfully

**Result:**
- Echo cancellation works reliably on all platforms
- WebRTC Realtime API provides low-latency voice (100-200ms)
- Always-on microphone with browser AEC (industry standard pattern)
- No more WKWebView workarounds needed
- Voice-first AI works perfectly

**Technical Implementation:**
- Deploy to Vercel/Netlify
- Use Next.js 15 App Router
- WebRTC voice with HTMLAudioElement playback
- Progressive Web App (PWA) for installable experience
- Responsive design for all screen sizes

**Alternatives Rejected:**
- ❌ Wait for Tauri/WKWebView fix - Timeline unknown, blocks progress
- ❌ AudioWorklet bypass - Breaks echo cancellation
- ❌ Electron migration - Larger bundle, slower, unnecessary

**Status:** Accepted and implemented (November 2025)

---

**End of ADR-001**
