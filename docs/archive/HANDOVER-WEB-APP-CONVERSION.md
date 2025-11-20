# HANDOVER: Sentra Web App Conversion

**Status:** IN PROGRESS (Multiple agents working in parallel)
**Date:** 2025-11-17
**Decision Maker:** Glen Barnhardt
**Priority:** CRITICAL - Starting NOW

---

## Table of Contents

1. [Decision Summary](#decision-summary)
2. [Current State](#current-state)
3. [Work Breakdown](#work-breakdown)
4. [What to Keep](#what-to-keep)
5. [What Changes](#what-changes)
6. [Testing Checklist](#testing-checklist)
7. [Next Steps After Handover](#next-steps-after-handover)
8. [Critical Context](#critical-context)

---

## Decision Summary

### Why We're Converting to Web App

**Problem:** WKWebView on macOS 13.1+ cannot play WebRTC audio through HTMLAudioElement
- This is a platform limitation (Apple bug), not our code
- WebRTC remote audio track connects successfully but produces no sound
- Affects desktop app ONLY - web browsers work perfectly

**Root Cause:**
- WKWebView cannot access macOS AVAudioSession for WebRTC remote tracks
- Browser (Chrome/Safari) WebRTC works flawlessly with echo cancellation
- Voice is our CORE product - we cannot ship without working voice

**Decision:** Convert to pure web app (Option 1)
- Browser echo cancellation works perfectly in web (industry standard)
- WebRTC Realtime API gives 100-200ms latency (vs 3-5s HTTP fallback)
- System tray features are secondary compared to voice functionality
- Timeline: TODAY (not 2-3 days) - multiple agents working in parallel

### What We're Keeping

Everything except the Tauri wrapper:
- Exact same UI (true dark theme, mission control design)
- All icons, logos, branding (violet accents, dark cards)
- Voice system (already web-based)
- Project tracking
- Settings interface
- Git integration
- PR review
- Spec management
- Activity feed
- All existing features

### Timeline

**START:** NOW (2025-11-17)
**COMPLETION:** TODAY (same day)
**APPROACH:** Multiple agents working in parallel on different phases

---

## Current State

### What Works Now

1. **Voice System** (Web-based):
   - WebRTC Realtime API implementation (`/src/lib/openai-realtime.ts`)
   - HTTP API fallback (`/src/lib/openai-voice.ts`)
   - Browser echo cancellation (always-on microphone pattern)
   - Server-side VAD (OpenAI handles turn detection)
   - Works perfectly in Chrome, Safari, Firefox, Edge

2. **Dashboard** (Next.js):
   - True dark theme (bg-[#18181B], text-[#FAFAFA])
   - Mission control layout
   - Multi-project management
   - Real-time agent monitoring
   - Activity feed
   - Cost tracking

3. **Project Features**:
   - Project creation with templates
   - Spec versioning system
   - GitHub integration (issues, PRs)
   - Git operations (log, diff, status)
   - Agent streaming

4. **Settings**:
   - Currently uses Tauri IPC (`src/lib/tauri.ts`)
   - Mock mode works in browser
   - Stores: API keys, GitHub tokens, voice preferences, notifications

### What's Broken

1. **Desktop WebRTC Audio**:
   - Peer connection establishes successfully
   - Remote audio track received
   - HTMLAudioElement receives MediaStream
   - BUT: No audio plays (WKWebView limitation)
   - Fallback to HTTP API works but has 3-5s latency

2. **Desktop-Only Features**:
   - System tray (Tauri-specific)
   - Auto-launch at boot (desktop-only)
   - File system access (can migrate to cloud storage)
   - Native audio playback (not needed - browser handles it)

### Existing Features (Web-Compatible)

All these features already work in browser mock mode:

| Feature | Status | Location |
|---------|--------|----------|
| Voice (WebRTC) | Works in web browsers | `/src/lib/openai-realtime.ts` |
| Voice (HTTP fallback) | Works everywhere | `/src/lib/openai-voice.ts` |
| Dashboard | Web-based (Next.js) | `/src/app/page.tsx` |
| Project tracking | Mock mode ready | `/src/lib/tauri.ts` MOCK_MODE |
| Settings | Mock mode exists | `/src/lib/tauri.ts` (needs localStorage) |
| Git integration | Mock data available | `/src/lib/tauri.ts` |
| PR review | Mock mode ready | `/src/lib/tauri.ts` |
| Activity feed | Mock mode ready | `/src/lib/tauri.ts` |

---

## Work Breakdown

### Phase 1: Remove Tauri (Agent Assigned)

**Files to Delete:**
```bash
rm -rf src-tauri/
```

**Dependencies to Remove from package.json:**
```json
// Remove these:
"@tauri-apps/api": "^2.0.0",
"@tauri-apps/plugin-fs": "^2.0.0",
"@tauri-apps/plugin-process": "^2.3.1",
"@tauri-apps/plugin-shell": "^2.0.0",
"@tauri-apps/plugin-sql": "^2.0.0",
"@tauri-apps/plugin-updater": "^2.9.0",
"@tauri-apps/cli": "^2.9.4"
```

**Scripts to Remove from package.json:**
```json
// Remove these:
"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build",
"build:mac": "...",
"build:mac:x64": "...",
"build:mac:arm64": "...",
"build:windows": "...",
"build:linux": "...",
"build:all": "...",
"version:patch": "...",
"version:minor": "...",
"version:major": "...",
"release:prepare": "..."
```

**TypeScript Imports to Find and Remove:**
```bash
# Find all Tauri imports
grep -r "from '@tauri-apps" src/
```

Files that import Tauri:
- `/src/lib/tauri.ts` (main file - will be rewritten)
- `/src/lib/updater.ts` (delete or stub)
- `/src/hooks/useAgentStream.ts` (uses Tauri events)
- `/src/app/menubar/page.tsx` (Tauri menubar)
- `/tests/unit/components/Menubar.test.tsx` (test file)

**Action Plan:**
1. Delete `src-tauri/` directory
2. Remove Tauri dependencies from `package.json`
3. Remove Tauri scripts from `package.json`
4. Run `npm install` to clean lock file
5. Verify TypeScript compilation: `npx tsc --noEmit`

---

### Phase 2: Update Settings (Agent Assigned)

**Current Implementation:**
```typescript
// src/lib/tauri.ts
export async function getSettings(): Promise<Settings> {
  if (MOCK_MODE) {
    // Returns hardcoded mock data
    return { userName: 'Glen', voice: 'alloy', ... };
  }

  // Calls Tauri IPC
  return await tauriInvoke('get_settings');
}
```

**New Implementation (localStorage):**
```typescript
// src/lib/settings.ts (NEW FILE)
export interface Settings {
  userName: string;
  voice: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  githubToken: string;
  githubRepoOwner: string;
  githubRepoName: string;
  notificationsEnabled: boolean;
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  notifyOnStart: boolean;
  language: string;
}

const SETTINGS_KEY = 'sentra-settings';

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  voice: 'alloy',
  openaiApiKey: '',
  anthropicApiKey: '',
  githubToken: '',
  githubRepoOwner: '',
  githubRepoName: '',
  notificationsEnabled: true,
  notifyOnCompletion: true,
  notifyOnFailure: true,
  notifyOnStart: false,
  language: 'en',
};

export async function getSettings(): Promise<Settings> {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults (in case new fields added)
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save settings on server');
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
}
```

**Migration Plan:**
1. Create `/src/lib/settings.ts` with localStorage implementation
2. Update imports in components:
   - `/src/app/settings/page.tsx`
   - `/src/components/VoiceInterface.tsx` (if it uses settings)
   - Any other components importing from `tauri.ts`
3. Remove Tauri-specific logic from `/src/lib/tauri.ts`
4. Test settings persistence:
   - Save settings
   - Refresh page
   - Verify settings loaded correctly

**Data Migration:**
If users have existing Tauri settings, we'll lose them (acceptable for early development).
For production, consider:
- Export settings from Tauri app before conversion
- Import wizard for first web app launch

---

### Phase 3: Update Documentation (Agent Assigned)

**Files to Update:**

1. **README.md** (currently describes desktop app):
```markdown
# Before:
"Sentra is a native desktop application..."
"Install: Download .dmg for macOS..."

# After:
"Sentra is a web-based AI assistant platform..."
"Access: Visit https://sentra.app or run locally..."

# Add:
## Web App Deployment
- Vercel: One-click deploy
- Self-hosted: `npm run build && npm start`
```

2. **CLAUDE.md** (project context):
```markdown
# Update "What is Sentra?" section:
Before: "Native desktop apps (macOS, Windows, Linux) built with Tauri 2.x"
After: "Progressive Web App (PWA) with Next.js 15"

# Remove Tauri sections:
- Tauri IPC Serialization gotcha
- Tauri build commands

# Update Technology Stack:
Before:
- Frontend (Native Apps): Tauri 2.x (Rust backend, web frontend)
After:
- Frontend (Web App): Next.js 15.5 with React 19 (App Router, RSC)
- Backend (Optional): Node.js + Express (if needed for API proxy)
```

3. **Architecture Docs** to Update:
- `/docs/architecture/system-design.md` - Update platform architecture
- `/docs/architecture/VOICE-SYSTEM.md` - Already web-focused (minimal changes)
- `/docs/getting-started/installation.md` - Web installation instructions
- `/docs/DEPLOYMENT.md` - Web deployment guide

4. **Archive Tauri-Specific Docs:**
```bash
mkdir -p docs/archive/tauri-era
mv docs/features/MENUBAR-INTEGRATION.md docs/archive/tauri-era/
# Keep as reference but mark as deprecated
```

5. **Update Feature Docs:**
- `/docs/features/dashboard.md` - Still relevant (web-based)
- `/docs/features/voice-interface.md` - Already web-based
- `/docs/features/project-creation.md` - Update file system references
- `/docs/features/pr-approval.md` - Already web-compatible

**Action Items:**
1. Update README.md with web app focus
2. Update CLAUDE.md Technology Stack section
3. Remove Tauri gotchas from CLAUDE.md
4. Archive Tauri-specific feature docs
5. Update installation guides for web deployment
6. Add deployment guide (Vercel, Netlify, self-hosted)

---

### Phase 4: Deploy (Agent Assigned)

**Deployment Options:**

#### Option A: Vercel (Recommended)

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Configuration (.vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://sentra.vercel.app"
  }
}
```

**Advantages:**
- Free tier available
- Auto HTTPS
- CDN globally distributed
- Zero config for Next.js
- Preview deployments for PRs

#### Option B: Netlify

**Setup:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Configuration (netlify.toml):**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### Option C: Self-Hosted (Docker)

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Deploy:**
```bash
docker build -t sentra .
docker run -p 3000:3000 -d sentra
```

**Environment Variables (Required):**

Create `.env.local` (or configure in deployment platform):
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://sentra.app

# Optional: If using backend API
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
```

**NO SECRET API KEYS IN ENV:**
- OpenAI API key: User enters in settings (stored in localStorage)
- Anthropic API key: User enters in settings
- GitHub token: User enters in settings
- All secrets stay client-side

**Deployment Checklist:**
- [ ] Build succeeds: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] Tests pass: `npm test -- --run`
- [ ] Deploy to staging
- [ ] Test voice in staging
- [ ] Test settings persistence
- [ ] Deploy to production
- [ ] Update DNS if needed

---

## What to Keep

### UI Components (100% Same)

All these stay EXACTLY as-is:
- Dashboard layout (mission control design)
- True dark theme colors:
  - Background: `bg-[#18181B]`
  - Cards: `bg-[#27272A]`
  - Text: `text-[#FAFAFA]`
  - Accents: `text-violet-400`, `bg-violet-500/10`
- Grid layout for projects
- Activity feed design
- Settings interface
- Voice interface controls

### Icons, Logos, Branding

Everything visual stays identical:
- Sentra logo (wherever it is)
- Project icons
- Voice mic/speaker icons
- Color scheme (violet accents, dark backgrounds)
- Typography
- Spacing, padding, margins

### Voice System (Already Web-Based)

Voice system is ALREADY 100% web-compatible:
- WebRTC Realtime API (`/src/lib/openai-realtime.ts`)
- HTTP API fallback (`/src/lib/openai-voice.ts`)
- Browser echo cancellation (always-on mic pattern)
- Server-side VAD
- Conversation history management
- Audio playback (HTMLAudioElement)

**NO CHANGES NEEDED** - voice works perfectly in web browsers.

### Features (Web-Compatible)

All existing features continue to work:
- Project tracking
- Spec versioning
- GitHub integration (via API)
- Git operations (via API)
- PR review
- Activity feed
- Agent monitoring
- Cost tracking

### Code (95% Reusable)

Almost all TypeScript code is web-compatible:
- React components (already web-based)
- Next.js App Router (already web-based)
- API routes (already web-based)
- Voice implementation (already web-based)
- Utilities (already web-based)

**Only remove:** Tauri IPC calls in `/src/lib/tauri.ts`

---

## What Changes

### System Tray → Web App

**Before (Tauri Desktop):**
- System tray icon in macOS menu bar
- Click tray icon → open window
- Run in background
- Auto-launch at boot

**After (Web App):**
- User bookmarks site
- Open in browser tab
- PWA installable (optional):
  ```json
  // public/manifest.json
  {
    "name": "Sentra",
    "short_name": "Sentra",
    "start_url": "/",
    "display": "standalone",
    "icons": [...]
  }
  ```
- Can "Add to Home Screen" on mobile
- Can "Install" in Chrome (appears like native app)

**User Experience:**
- Web: Bookmark → Click → Open (2 clicks)
- Desktop was: Tray icon → Click → Open (2 clicks)
- Equivalent user experience

### File System Access → localStorage/Cloud Storage

**Before (Tauri Desktop):**
```rust
// Rust code accesses local filesystem
use std::fs;
let content = fs::read_to_string(path)?;
```

**After (Web App):**

**Option 1: localStorage (Simple):**
```typescript
// Store small data client-side
localStorage.setItem('sentra-settings', JSON.stringify(settings));
```

**Option 2: Cloud Storage (Full-Featured):**
```typescript
// Store in database (PostgreSQL, Supabase, etc.)
await prisma.project.create({ data: projectData });
```

**Option 3: File System Access API (Future):**
```typescript
// Chrome/Edge only (experimental)
const handle = await window.showDirectoryPicker();
const file = await handle.getFileHandle('spec.md');
```

**Recommendation for MVP:** Use localStorage for settings, consider cloud storage for projects later.

### Auto-Launch → User Bookmarks

**Before:** App auto-starts at login (macOS LaunchAgents)

**After:** User bookmarks the site, opens when needed

**Impact:** Minimal - users who want quick access can:
- Bookmark in browser toolbar
- Pin tab
- Install as PWA
- Add to home screen (mobile)

### Native Notifications → Web Notifications

**Before (Tauri):**
```rust
// Native macOS notifications
use tauri_plugin_notification::NotificationExt;
app.notification()
    .builder()
    .title("Agent Complete")
    .body("Issue #42 finished")
    .show()?;
```

**After (Web):**
```typescript
// Web Notifications API
if (Notification.permission === 'granted') {
  new Notification('Agent Complete', {
    body: 'Issue #42 finished',
    icon: '/icon.png',
  });
}

// Request permission first
await Notification.requestPermission();
```

**Browser Support:** Chrome, Firefox, Safari, Edge (all modern browsers)

---

## Testing Checklist

### Voice Testing

**Chrome:**
- [ ] Connect to WebRTC Realtime API
- [ ] Microphone access granted
- [ ] Speak to AI - hear response
- [ ] No echo (browser AEC working)
- [ ] Can interrupt AI mid-sentence
- [ ] Transcript displays for user and AI
- [ ] Low latency (100-200ms)

**Safari:**
- [ ] Same tests as Chrome
- [ ] Verify echo cancellation
- [ ] Check microphone permissions

**Firefox:**
- [ ] Same tests as Chrome
- [ ] Verify echo cancellation

**Edge:**
- [ ] Same tests as Chrome

**Mobile Safari (iOS):**
- [ ] Voice works on iPhone
- [ ] Microphone permission flow
- [ ] Echo cancellation works
- [ ] Can use in background?

**Mobile Chrome (Android):**
- [ ] Voice works on Android
- [ ] Microphone permission flow

### Settings Testing

- [ ] Save settings (OpenAI API key)
- [ ] Refresh page
- [ ] Settings persist (loaded from localStorage)
- [ ] Update setting
- [ ] Verify localStorage updated
- [ ] Clear localStorage
- [ ] Verify defaults loaded

### Project Features

- [ ] Projects load correctly
- [ ] Can create new project (if implemented)
- [ ] Activity feed updates
- [ ] Agent status shows correctly
- [ ] Cost tracking displays

### Visual Testing

- [ ] Dashboard renders (true dark theme)
- [ ] Cards use correct colors (bg-[#27272A])
- [ ] Text readable (text-[#FAFAFA])
- [ ] Violet accents visible
- [ ] Grid layout works
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Performance

- [ ] Initial page load < 2 seconds
- [ ] Voice connection < 500ms
- [ ] No console errors
- [ ] No memory leaks (test long sessions)
- [ ] WebRTC audio plays smoothly
- [ ] No audio dropouts

---

## Next Steps After Handover

### Immediate (After Context Clear)

1. **Review This Document**
   - Read entire handover
   - Understand decision (web app vs desktop)
   - Check work breakdown status

2. **Check Agent Progress**
   - Multiple agents working in parallel:
     - Agent 1: Removing Tauri (Phase 1)
     - Agent 2: Updating Settings (Phase 2)
     - Agent 3: Updating Docs (Phase 3)
     - Agent 4: Deployment Config (Phase 4)
   - Review completed work
   - Verify tests pass

3. **Test in Browser**
   - Run `npm run dev`
   - Open `http://localhost:3000` in Chrome
   - Test voice system
   - Verify echo cancellation works
   - Test settings persistence

4. **Deploy to Staging**
   - Use Vercel or Netlify
   - Test deployed version
   - Verify all features work
   - Check HTTPS, CORS

5. **Deploy to Production**
   - Deploy to production URL
   - Update DNS if needed
   - Test production deployment
   - Monitor for errors

### Short-Term (Next Week)

1. **PWA Implementation (Optional)**
   - Add manifest.json
   - Add service worker
   - Enable offline mode
   - Test "Add to Home Screen"

2. **Cloud Storage (If Needed)**
   - Set up PostgreSQL database
   - Migrate project data to cloud
   - Add authentication (if multi-user)

3. **Performance Optimization**
   - Add caching headers
   - Optimize bundle size
   - Lazy load components
   - Image optimization

### Long-Term (Next Month)

1. **Mobile Optimization**
   - Test on real iOS devices
   - Test on real Android devices
   - Optimize touch targets
   - Improve mobile UX

2. **Advanced Features**
   - Web Notifications
   - Background sync (if PWA)
   - Offline support
   - File System Access API (Chrome)

3. **Analytics**
   - Track voice usage
   - Monitor error rates
   - User feedback collection

---

## Critical Context

### Why This Decision is Correct

1. **Voice is the Core Product**
   - Browser WebRTC audio works perfectly
   - Echo cancellation is industry-standard (always-on mic)
   - 100-200ms latency (excellent UX)
   - System tray is secondary feature

2. **WKWebView Limitation is Temporary**
   - Platform bug, not our code
   - Will likely be fixed in future Tauri/WKWebView updates
   - Web app works NOW, desktop can wait

3. **Web is Proven**
   - ChatGPT voice mode uses web
   - Google Meet, Zoom all use web WebRTC
   - No need for desktop wrapper

4. **Development Speed**
   - Converting to web: 1 day (TODAY)
   - Fixing WKWebView: Unknown timeline (Apple)
   - Implementing AudioWorklet bypass: Complex, breaks echo cancellation

### Architecture Decisions (DO NOT CHANGE)

1. **Always-On Microphone** (FINAL):
   - Do NOT implement manual mic toggling
   - Do NOT add pauseRecording()/resumeRecording()
   - Trust browser echo cancellation
   - See: `/docs/decisions/ADR-001-VOICE-ECHO-CANCELLATION.md`

2. **Audio in Browser Pipeline** (FINAL):
   - Do NOT route audio through AudioWorklet → Rust
   - Do NOT bypass HTMLAudioElement
   - Browser AEC requires audio in browser pipeline
   - See: `/docs/architecture/VOICE-SYSTEM.md` (Decision 4)

3. **HTTP API Fallback** (Temporary):
   - Used only when WebRTC unavailable
   - 3-5s latency vs 100-200ms WebRTC
   - Reliable but slower UX

### References

**Key Documents:**
- `/docs/architecture/VOICE-SYSTEM.md` - Complete voice architecture
- `/docs/decisions/ADR-001-VOICE-ECHO-CANCELLATION.md` - Echo cancellation decision
- `/docs/development/VOICE-MICROPHONE-MANAGEMENT.md` - Microphone management
- `/CLAUDE.md` - Project context (update after conversion)

**Abandoned Approaches:**
- `/docs/development/abandoned-approaches/HANDOVER-2025-11-14-AUDIOWORKLET.md`
- Reason abandoned: Breaks echo cancellation

**Industry Research:**
- ChatGPT voice mode: Always-on mic, browser AEC
- Google Meet: Same pattern
- Zoom: Same pattern
- Discord: Same pattern

### Common Pitfalls to Avoid

1. **DO NOT** try to "fix" echo cancellation
   - Browser AEC works perfectly
   - Manual mic toggling breaks natural conversations
   - Trust the industry pattern

2. **DO NOT** route audio outside browser
   - AudioWorklet bypass breaks AEC
   - Native Rust audio breaks AEC
   - Keep audio in HTMLAudioElement

3. **DO NOT** add artificial delays
   - No 800ms safety delays needed
   - Server-side VAD handles turn detection
   - Browser handles echo cancellation

4. **DO NOT** migrate to Anthropic SDK for agents
   - We use Claude Code CLI (see `.claude/docs/ARCHITECTURE-AGENT-WORKER.md`)
   - Provides agent ecosystem, quality hooks, auto-updates
   - Direct SDK would lose these benefits

---

## Agent Assignments (In Progress)

| Phase | Agent | Status | Files Changed |
|-------|-------|--------|---------------|
| **Phase 1** | Remove Tauri | IN PROGRESS | `src-tauri/` (deleted), `package.json` |
| **Phase 2** | Update Settings | IN PROGRESS | `/src/lib/settings.ts` (new), `/src/lib/tauri.ts` (modified) |
| **Phase 3** | Update Docs | IN PROGRESS | `README.md`, `CLAUDE.md`, `/docs/...` |
| **Phase 4** | Deploy Config | IN PROGRESS | `vercel.json` or `netlify.toml` |

**Check Status:**
```bash
# See git status for changes
git status

# See what's been modified
git diff
```

---

## Success Criteria

Conversion is COMPLETE when:

1. **Tauri Removed:**
   - [ ] `src-tauri/` directory deleted
   - [ ] Tauri dependencies removed from package.json
   - [ ] No Tauri imports in TypeScript (`grep -r "@tauri-apps" src/` returns nothing)
   - [ ] `npx tsc --noEmit` passes (no type errors)

2. **Settings Work:**
   - [ ] Settings load from localStorage
   - [ ] Settings save to localStorage
   - [ ] Settings persist across page refresh
   - [ ] Default settings work (first time user)

3. **Voice Works:**
   - [ ] WebRTC connects in Chrome
   - [ ] Microphone access granted
   - [ ] Can speak and hear AI response
   - [ ] Echo cancellation works (no feedback)
   - [ ] Low latency (100-200ms)

4. **Deployed:**
   - [ ] Deployed to Vercel/Netlify
   - [ ] HTTPS working
   - [ ] Production URL accessible
   - [ ] Voice works in production

5. **Documentation Updated:**
   - [ ] README.md describes web app
   - [ ] CLAUDE.md updated (no Tauri references)
   - [ ] Installation guide updated
   - [ ] Deployment guide added

6. **Tests Pass:**
   - [ ] `npm test -- --run` passes
   - [ ] `npm run build` succeeds
   - [ ] `npm run type-check` passes
   - [ ] No console errors in browser

---

## Emergency Rollback

If conversion goes wrong, rollback:

```bash
# Revert all changes
git reset --hard HEAD

# Or revert specific commit
git revert <commit-hash>

# Restart Tauri dev mode
npm run tauri:dev
```

**When to Rollback:**
- Voice completely broken
- Cannot build
- Critical features lost
- Cannot deploy

**When NOT to Rollback:**
- Minor bugs (fix forward)
- Settings migration issues (expected)
- Styling differences (cosmetic)

---

## Questions for Glen

If context is cleared and you have questions:

1. **Should we keep HTTP API fallback?**
   - Yes - for older browsers without WebRTC

2. **Should we implement PWA features?**
   - Optional - can add later

3. **Where should we deploy?**
   - Recommendation: Vercel (easiest for Next.js)

4. **What about existing Tauri users?**
   - Development project, no production users yet

5. **Should we keep Tauri code in git history?**
   - Yes - keep in git history (don't force push)
   - Archive documentation in `/docs/archive/tauri-era/`

---

## Final Notes

**This is the RIGHT decision because:**
1. Voice works perfectly in web browsers (proven)
2. Echo cancellation is industry-standard pattern
3. WKWebView bug is out of our control
4. Conversion takes 1 day vs weeks of workarounds
5. Web deployment is simpler than desktop distribution

**Trust the process:**
- Remove Tauri wrapper
- Keep all existing web-based code
- Deploy to web hosting
- Test voice in production
- Ship working product

**Remember:**
- Voice is core product (not system tray)
- Browser WebRTC > Desktop workarounds
- 100-200ms latency > 3-5s fallback
- Ship working product > wait for platform fix

---

**Last Updated:** 2025-11-17 (conversion in progress)
**Next Review:** After conversion complete (same day)
**Contact:** Glen Barnhardt

---

**END OF HANDOVER**
