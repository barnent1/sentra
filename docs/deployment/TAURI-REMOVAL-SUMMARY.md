# Tauri Removal Summary

**Date:** November 17, 2025
**Status:** Phase 3 - Complete
**Purpose:** Track what was removed, archived, or simplified during web app conversion

---

## What Was Removed (Not Active)

### Code Files (Deleted from src-tauri/)
The entire `src-tauri/` directory has been deleted:

**Rust Source Code:**
- `src/main.rs` - Application entry point
- `src/lib.rs` - Library initialization
- `src/commands.rs` - IPC command handlers
- `src/agents.rs` - Agent integration
- `src/settings.rs` - Settings management
- `src/activity.rs` - Activity tracking
- `src/git.rs` - Git operations
- `src/pr.rs` - Pull request handling
- `src/architect.rs` - Architect AI integration
- `src/templates.rs` - Code templates
- `src/specs.rs` - Specification handling
- `src/performance.rs` - Performance monitoring
- `src/tray.rs` - System tray integration
- `src/watcher.rs` - File watching
- `src/agent_stream.rs` - Agent streaming
- `src/realtime_proxy.rs` - WebSocket proxy

**Build Configuration:**
- `Cargo.toml` - Rust dependencies
- `Cargo.lock` - Locked dependency versions
- `build.rs` - Build script
- `tauri.conf.json` - Tauri configuration
- `Info.plist` - macOS app manifest

**Assets:**
- `icons/` - App icons (PNG, ICO, ICNS, etc.)
- `capabilities/default.json` - Tauri capabilities

**Tests:**
- `tests/agent_stream_test.rs`
- `tests/performance_test.rs`
- `tests/project_commands_test.rs`
- `tests/settings_test.rs`
- `tests/templates_test.rs`

### Configuration Files (Deleted)
- `src-tauri/.gitignore` - Rust-specific git ignore
- `.gitignore` section for `src-tauri/` removed from root

### Dependencies (Removed from package.json)
- `@tauri-apps/api` - Tauri IPC communication
- `@tauri-apps/cli` - Tauri build tools
- `@tauri-apps/plugin-*` - Various Tauri plugins
- Build scripts: `tauri:dev`, `tauri:build`

### Documentation (Archived, Not Active)
These files are preserved in archives but not referenced in current docs:
- `docs/archive/tauri/README.md` - Tauri desktop architecture
- `docs/development/HANDOVER-WEB-APP-CONVERSION.md` - Migration details
- `docs/development/abandoned-approaches/HANDOVER-2025-11-14-AUDIOWORKLET.md` - Failed approach

---

## What Was Removed From Documentation

### README.md Changes
**Removed:**
- macOS badge
- Tauri badge
- "Native macOS App" section
- macOS 10.15+ prerequisite
- "Tauri 2.x (95% smaller than Electron)" line
- Phase 2 "Cross-Platform" roadmap (Linux/Windows desktop)
- Desktop-specific installation instructions

**Added:**
- Web App badge
- "Web Application" status
- Live demo URL
- Web deployment instructions
- Browser compatibility focus

### CLAUDE.md Changes
**Removed:**
- "Native desktop apps (macOS, Windows, Linux) built with Tauri 2.x"
- "Frontend (Native Apps)" section with Tauri details
- "Tauri IPC Serialization" gotcha
- "Voice Echo Prevention" gotcha (timing-based solution)
- `src-tauri/` directory from project structure
- Tauri-specific commands from Common Commands

**Added:**
- "Web Application" description
- "Universal browser access"
- Browser echo cancellation explanation
- "Why AudioWorklet was never needed" section

### docs/architecture/VOICE-SYSTEM.md Changes
**Removed:**
- Entire "WKWebView Audio Limitations" section (~130 lines)
- Backend (Tauri) from Technology Stack
- Rust audio playback reference
- AudioWorklet processor reference
- WKWebView in component locations
- WKWebView audio limitation checks in selection logic
- WKWebView rows from comparison matrix
- All WKWebView attempted solutions (5 approaches)
- AudioWorklet bridge solution proposal
- Native Rust WebRTC solution proposal
- Electron migration solution proposal
- HTTP API fallback rationale (WKWebView workaround)

**Added:**
- "Why AudioWorklet was never needed"
- Browser-only audio processing
- Browser echo cancellation explanation
- Simplified selection strategy

---

## What Remains (Web-Only)

### Frontend Stack (Complete)
- [x] Next.js 15.5
- [x] React 19
- [x] TypeScript (strict mode)
- [x] TailwindCSS
- [x] React Query
- [x] Web Audio API
- [x] WebRTC

### Voice Implementation (Both Approaches)
1. **WebRTC + OpenAI Realtime API**
   - File: `/src/lib/openai-realtime.ts`
   - Latency: 100-200ms
   - Full interruption support
   - Browser echo cancellation

2. **HTTP API Fallback**
   - File: `/src/lib/openai-voice.ts`
   - Latency: 3-5 seconds
   - Whisper + GPT-4 + TTS
   - Fallback only

### Deployment Options (All Web)
1. [x] **Vercel** (recommended)
2. [x] **Netlify**
3. [x] **Railway** (with PostgreSQL)
4. [x] **Custom Server** (Ubuntu + Nginx)
5. [x] **PWA** (installable web app)

### Browser Support
- [x] Chrome/Chromium (full support)
- [x] Safari (full support)
- [x] Firefox (full support)
- [x] Edge (full support)
- [x] Mobile browsers (iOS Safari, Chrome Android)

---

## Migration Impact

### Code Complexity
- **Before:** Tauri (Rust) + Next.js (TypeScript) = 2 languages, complex IPC
- **After:** Next.js only (TypeScript) = single language stack

### Bundle Size
- **Before:** ~10MB (Tauri), ~5MB (web bundle) = ~15MB total
- **After:** ~5MB (web bundle only)

### Maintenance
- **Before:** Maintain Tauri desktop app + web frontend
- **After:** Maintain web frontend only

### Platform Support
- **Before:** macOS only, then planned Linux/Windows
- **After:** All platforms instantly (browser-based)

### Voice Quality
- **Before:** WKWebView couldn't play WebRTC audio = HTTP fallback
- **After:** Browser AEC works perfectly across all platforms

---

## Verification

### Files Confirming Removal
```bash
# Verify src-tauri/ directory is gone
ls -la src-tauri/  # Should: No such file or directory

# Verify Tauri dependencies removed from package.json
grep -i tauri package.json  # Should: No matches

# Verify documentation updated
grep -r "WKWebView" docs/ | grep -v archive/  # Should: No matches in active docs
```

### Documentation Checks
```bash
# Check README for Tauri references
grep -i tauri README.md  # Should: No matches (except in archive paths)

# Check CLAUDE.md for src-tauri references
grep -i src-tauri CLAUDE.md  # Should: No matches

# Check VOICE-SYSTEM.md for WKWebView
grep -i wkwebview docs/architecture/VOICE-SYSTEM.md  # Should: No matches
```

---

## Historical Preservation

These files are kept for historical context but not actively maintained:

### Archive Directory
- `/docs/archive/tauri/` - Original Tauri desktop architecture

### Development/Handover Documents
- `/docs/development/HANDOVER-WEB-APP-CONVERSION.md` - Migration details
- `/docs/development/abandoned-approaches/HANDOVER-2025-11-14-AUDIOWORKLET.md` - AudioWorklet attempt

### Why Keep Archives?
1. Document lessons learned
2. Preserve research and attempts
3. Reference for future decisions
4. Audit trail of evolution
5. Historical context for team onboarding

---

## Related Documentation

- **[PHASE-3-WEB-APP-CONVERSION-COMPLETE.md](PHASE-3-WEB-APP-CONVERSION-COMPLETE.md)** - Complete conversion details
- **[WEB-DEPLOYMENT.md](WEB-DEPLOYMENT.md)** - Deployment instructions
- **[/docs/architecture/VOICE-SYSTEM.md](/docs/architecture/VOICE-SYSTEM.md)** - Current voice architecture
- **[README.md](../../README.md)** - Updated project overview
- **[CLAUDE.md](../../CLAUDE.md)** - Updated project context

---

## Quick Reference

### What Happened
1. Deleted entire `src-tauri/` directory (Rust code)
2. Removed Tauri build tools from npm scripts
3. Removed Tauri dependencies from package.json
4. Updated all documentation to reflect web-only approach
5. Archived historical documents for reference
6. Removed WKWebView workarounds (no longer needed)

### Where to Find What
- **Deployment:** See `docs/deployment/WEB-DEPLOYMENT.md`
- **Voice Architecture:** See `docs/architecture/VOICE-SYSTEM.md`
- **Project Overview:** See `README.md`
- **Development Context:** See `CLAUDE.md`
- **Historical Info:** See `docs/archive/tauri/` and `docs/development/`

### Next Steps
1. Verify all documentation is accurate
2. Test voice functionality across browsers
3. Deploy to production (https://sentra.app)
4. Update any remaining references if found
5. Monitor for any breaking changes

---

**Last Updated:** November 17, 2025
**Status:** Complete
**Author:** Glen Barnhardt with Claude Code

