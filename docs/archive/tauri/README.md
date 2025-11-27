# Tauri Documentation Archive

**Status:** Historical - No longer in use
**Date Archived:** November 2025
**Reason:** Converted from Tauri desktop to web application

---

## Why These Documents Are Archived

In November 2025, Quetrex transitioned from a Tauri-based desktop application to a pure web application. This decision was made because:

1. **WKWebView Audio Limitation** - WKWebView on macOS cannot play WebRTC audio (Apple platform bug)
2. **Voice is Core Product** - Perfect echo cancellation is non-negotiable
3. **Browser Echo Cancellation Works** - Chrome, Safari, Firefox, Edge all have excellent AEC
4. **Universal Access** - Web apps work on any device with a browser
5. **Simpler Deployment** - Deploy once, everyone gets the update

## What Was Tauri?

Tauri is a framework for building native desktop applications using web technologies (HTML, CSS, JavaScript) with a Rust backend. It's similar to Electron but uses the system's native webview instead of bundling Chromium.

### Why We Originally Chose Tauri

- **95% smaller bundles** (~600KB vs Electron's 100MB+)
- **50% less memory** usage
- **Better security** (no Node.js in renderer)
- **Native OS integration** (menu bar, notifications)
- **Rust performance** and safety

### Why We Moved Away

The WKWebView audio limitation proved to be a blocker:
- WebRTC audio wouldn't play through HTMLAudioElement in WKWebView
- All workarounds (AudioWorklet bypass, manual mic toggling) broke echo cancellation
- Timeline for Apple/Tauri fix was unknown
- Voice is the core feature of Quetrex - couldn't compromise on quality

## Tauri-Specific Documents

If you're looking for historical Tauri implementation details, they may have included:

- Rust command implementations (`src-tauri/src/commands.rs`)
- IPC serialization patterns
- Native audio playback with rodio
- WKWebView workarounds
- Desktop-specific features (menu bar, system tray)

These are no longer relevant to the current web application architecture.

## Current Architecture

Quetrex is now a **Next.js 15 web application** deployed to Vercel/Netlify. See:

- [Web Deployment Guide](../../deployment/WEB-DEPLOYMENT.md)
- [Voice System Architecture](../../architecture/VOICE-SYSTEM.md)
- [ADR-001: Voice Echo Cancellation](../../decisions/ADR-001-VOICE-ECHO-CANCELLATION.md)

## For Future Reference

If you're considering a desktop app again in the future:

1. **Check if WKWebView audio is fixed** - Monitor Tauri issues for updates
2. **Consider Electron** - Chromium bundle is large but audio works
3. **Evaluate tradeoffs** - Desktop UX vs web universality
4. **Test voice thoroughly** - Echo cancellation is critical

For now, the web application provides the best user experience with perfect voice support.

---

**Archived by:** Glen Barnhardt with Claude Code
**Date:** November 2025
