# Abandoned Approaches

This directory contains documentation of approaches that were investigated but NOT implemented in the final system.

These documents are kept for historical reference only.

## AudioWorklet Bridge (HANDOVER-2025-11-14-AUDIOWORKLET.md)

**Status:** NOT IMPLEMENTED

**What it was:** An attempt to solve WKWebView audio playback issues by routing WebRTC audio through an AudioWorklet to native Rust audio playback.

**Why abandoned:**
- The AudioWorklet code was never actually integrated into the codebase
- The approach proved unnecessary - the current HTML audio element approach works sufficiently
- If WKWebView audio issues persist, the HTTP API fallback (`openai-voice.ts`) provides a reliable alternative

**Current voice system:** See `/docs/architecture/VOICE-SYSTEM.md` for the actual implementation.

---

**Note:** If you're looking for how voice currently works in Quetrex, do NOT refer to documents in this directory. Check the main architecture documentation instead.
