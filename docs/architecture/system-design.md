# System Design

**Complete architecture of Sentra AI Agent Control Center**

Last Updated: 2025-11-13

---

## Overview

Sentra is a **voice-first AI platform** that combines natural conversation with automated agent execution for software development.

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      User (Developer)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Voice
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Sentra Native App (Tauri)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          Next.js Frontend (React 19)                     ││
│  │  • Voice UI (ArchitectChat component)                    ││
│  │  • Spec Viewer (versioning, approval)                    ││
│  │  • Dashboard (project monitoring)                        ││
│  │  • Settings                                               ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Tauri Backend (Rust IPC)                         ││
│  │  • Spec Management (save, version, approve)              ││
│  │  • Settings Storage (API keys)                           ││
│  │  • File Watcher (reactive updates)                       ││
│  │  • Realtime API Proxy (WebSocket)                        ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────────┘
                       │ File System
                       ↓
┌─────────────────────────────────────────────────────────────┐
│             .sentra/ Local Storage                           │
│  • specs/ - Specification files (versioned)                 │
│  • memory/ - Project context and learnings                  │
│  • metrics/ - Quality metrics and analytics                 │
│  • config.yml - Project configuration                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  • OpenAI (Whisper, GPT-4, TTS, Realtime API)              │
│  • GitHub (issues, PRs, Actions)                            │
│  • Anthropic (Claude for agent execution)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            GitHub Actions (Agent Execution)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │   Docker Container (Isolated Environment)                ││
│  │   • AI Agent Worker (Python + Anthropic SDK)             ││
│  │   • Quality Hooks (PreToolUse, PostToolUse, Stop)        ││
│  │   • Build, Test, Lint                                     ││
│  │   • PR Creation                                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Native App)

**Framework: Tauri 2.x**
- Rust backend for native OS integration
- Native WebView (Safari on macOS)
- IPC bridge between Rust and JavaScript
- ~600KB bundle size (vs Electron's 100MB+)

**UI Framework: Next.js 15.5**
- React 19 with Server Components
- App Router for file-based routing
- Static export for Tauri embedding
- TypeScript 5.6 strict mode

**Styling**
- TailwindCSS for utility-first styling
- shadcn/ui for component library
- Custom theme (dark mode, violet accent)

### Backend (Rust)

**Tauri Commands (IPC)**
- `specs.rs` - Spec management (save, version, approve, list)
- `commands.rs` - Dashboard data (projects, agents, stats)
- `settings.rs` - Settings storage and retrieval
- `architect.rs` - Voice conversation backend
- `realtime_proxy.rs` - WebSocket proxy for Realtime API
- `watcher.rs` - File system monitoring

**Storage**
- File-based (.sentra/ directory)
- JSON for structured data
- Markdown for specs and documentation
- No database layer (yet - planned Phase 2)

### AI Services

**Voice Conversation**
- OpenAI Whisper (speech-to-text)
- OpenAI GPT-4o (language model)
- OpenAI TTS (text-to-speech)
- OpenAI Realtime API (low-latency streaming)

**Agent Execution**
- Anthropic Claude (via Python SDK)
- GitHub Actions (execution environment)
- Docker (isolation and security)

### Automation

**GitHub Actions Workflows**
- `ai-agent.yml` - Main agent automation
- `test.yml` - CI/CD testing
- `build-agent-image.yml` - Docker image builder

**Quality Hooks**
- `validate-bash.py` (PreToolUse) - Blocks dangerous commands
- `verify-changes.py` (PostToolUse) - Validates file edits
- `quality-gate.sh` (Stop) - Comprehensive quality checks

---

## Data Flow

### Voice Conversation Flow

```
User speaks
    ↓
Browser captures audio (MediaRecorder)
    ↓
[HTTP API Path]                [Realtime API Path]
    ↓                              ↓
OpenAI Whisper (STT)          WebSocket → Realtime API
    ↓                              ↓
GPT-4o conversation           Server-side VAD + streaming
    ↓                              ↓
OpenAI TTS (speech)           PCM16 audio chunks
    ↓                              ↓
Browser plays audio           Browser plays audio
    ↓                              ↓
Transcript saved to UI        Transcript saved to UI
```

**HTTP API** (3-5s latency):
1. Record audio blob
2. Send to Whisper API → get text
3. Send text to GPT-4 → get response
4. Send response to TTS → get audio
5. Play audio

**Realtime API** (1-2s latency):
1. Stream raw PCM audio to WebSocket
2. Server-side VAD detects speech/silence
3. Streaming response starts immediately
4. Audio chunks play as they arrive

### Spec Creation Flow

```
Voice conversation completes
    ↓
User says "I'm done" / conversation ends naturally
    ↓
Architect generates markdown spec
    ↓
Tauri command: save_spec()
    ↓
Rust backend:
  - Generate unique ID
  - Create version file (v1)
  - Save metadata (title, date, status)
  - Write to .sentra/specs/{project}/{spec-id}/
    ↓
UI shows SpecViewer modal
  - Markdown rendering
  - Version selector
  - Approve/Reject/Continue buttons
    ↓
User clicks "Approve"
    ↓
Tauri command: approve_spec_version()
    ↓
Rust backend:
  - Mark spec as approved
  - Generate GitHub issue body
    ↓
Tauri command: create_github_issue()
    ↓
GitHub API:
  - Create issue with spec content
  - Add "ai-feature" label
  - Add metadata to issue body
    ↓
Issue URL returned to UI
    ↓
UI shows success notification
```

### Agent Automation Flow

```
GitHub issue created with "ai-feature" label
    ↓
GitHub Actions workflow triggered (.github/workflows/ai-agent.yml)
    ↓
Workflow job starts:
  1. Checkout code
  2. Set up environment (Node, Python, Rust)
  3. Build Docker container
  4. Run agent worker inside container
    ↓
Python agent worker (ai-agent-worker.py):
  1. Fetch issue details via gh CLI
  2. Load project context (.sentra/config.yml, CLAUDE.md)
  3. Build comprehensive prompt
  4. Call Anthropic SDK (Claude)
  5. Execute file changes requested by Claude
  6. Run quality hooks:
     - PreToolUse: validate bash commands
     - PostToolUse: verify file changes
     - Stop: comprehensive quality gate
  7. Run tests, build, lint
  8. Commit changes
  9. Push branch
  10. Create pull request
  11. Post updates to GitHub issue
    ↓
Pull request created
    ↓
Human reviews and merges (or requests changes)
```

---

## File Structure

### Source Code

```
src/                              # Next.js frontend
├── app/
│   ├── layout.tsx                # Root layout (global styles, providers)
│   └── page.tsx                  # Dashboard page
├── components/
│   ├── ArchitectChat.tsx         # Voice conversation UI
│   ├── SpecViewer.tsx            # Spec review modal
│   └── Settings.tsx              # Settings panel
├── lib/
│   ├── openai-voice.ts           # HTTP-based voice (Whisper+GPT+TTS)
│   ├── openai-realtime.ts        # Realtime API voice (streaming)
│   ├── tauri.ts                  # Tauri IPC wrappers
│   └── utils.ts                  # Utility functions
└── hooks/
    └── useDashboard.ts           # Dashboard data fetching

src-tauri/src/                    # Rust backend
├── lib.rs                        # App initialization, setup
├── commands.rs                   # Dashboard IPC commands
├── specs.rs                      # Spec management IPC commands
├── architect.rs                  # Voice backend
├── realtime_proxy.rs             # WebSocket proxy
├── settings.rs                   # Settings IPC commands
└── watcher.rs                    # File watcher
```

### Configuration

```
.claude/                          # Claude Code configuration
├── hooks/
│   ├── hooks.json                # Hook registration
│   ├── validate-bash.py          # PreToolUse hook
│   ├── verify-changes.py         # PostToolUse hook
│   └── quality-gate.sh           # Stop hook
├── scripts/
│   └── ai-agent-worker.py        # Main agent worker
└── settings.json                 # Claude Code settings

.github/workflows/
├── ai-agent.yml                  # Agent automation workflow
├── test.yml                      # CI/CD testing
└── build-agent-image.yml         # Docker image builder
```

### Local Data

```
.sentra/                          # Local project data
├── specs/
│   └── {project-name}/
│       └── {spec-id}/
│           ├── metadata.json     # Spec metadata
│           ├── spec-v1.md        # Version 1
│           ├── spec-v2.md        # Version 2 (if edited)
│           └── ...
├── memory/
│   ├── project-overview.md       # High-level context
│   ├── patterns.md               # Code patterns
│   └── learnings.md              # What agents learned
├── metrics/
│   ├── dashboard.html            # Visual dashboard
│   └── metrics.json              # Raw metrics data
└── config.yml                    # Project configuration
```

---

## Component Design

### Voice Conversation (Two Implementations)

**1. HTTP API Implementation** (`openai-voice.ts`)

```typescript
class VoiceConversation {
  // Properties
  private conversationHistory: Message[]
  private mediaRecorder: MediaRecorder
  private audioContext: AudioContext
  private analyser: AnalyserNode

  // Methods
  async startRecording()          // Capture microphone
  private startVAD()               // Voice activity detection
  private stopVAD()                // Stop monitoring
  stopRecording()                  // Stop capture
  private async processUserSpeech() // STT → GPT → TTS pipeline
  private async transcribeAudio()  // Whisper API
  private async getAIResponse()    // GPT-4 API
  private async textToSpeech()     // TTS API
  async getGreeting()              // Initial greeting
  getConversationHistory()         // Export history
  cleanup()                        // Release resources
}
```

**Features:**
- Auto-silence detection (VAD)
- Microphone stream reuse (prevents crashes)
- Full conversation history
- Error handling and recovery

**2. Realtime API Implementation** (`openai-realtime.ts`)

```typescript
class RealtimeConversation {
  // Properties
  private ws: WebSocket
  private audioContext: AudioContext
  private stream: MediaStream
  private isSpeaking: boolean

  // Methods
  async connect()                  // Connect to WebSocket proxy
  private sendSessionUpdate()      // Configure session
  private handleServerMessage()    // Parse server events
  async startRecording()           // Stream PCM audio
  stopRecording()                  // Stop stream
  pauseRecording()                 // Pause while AI speaks
  resumeRecording()                // Resume after AI finishes
  async getGreeting()              // Trigger greeting
  cleanup()                        // Close connections
}
```

**Features:**
- Server-side VAD (no client-side detection needed)
- Streaming audio (PCM16 format)
- Automatic echo prevention (pause while AI speaks)
- WebSocket event handling
- Handoff phrase detection ("pass this to an agent")

### Spec Management

**Spec Versioning:**
- Each edit creates new version (v1 → v2 → v3)
- All versions preserved (history)
- Latest version marked as current
- Approved version tracked separately

**Approval Workflow:**
1. Review spec in UI
2. Click "Approve" → marks version as approved
3. Creates GitHub issue with approved content
4. Issue gets `ai-feature` label
5. Triggers automation

**File Structure:**
```
.sentra/specs/{project}/{spec-id}/
├── metadata.json      # { id, title, versions: [], approved_version }
├── spec-v1.md         # Initial version
├── spec-v2.md         # After first edit
└── spec-v3.md         # After second edit
```

### Quality Hooks

**Hook Lifecycle:**

```
Agent wants to run command/edit file
    ↓
PreToolUse Hook
  • validate-bash.py
  • Checks command for dangerous patterns
  • Returns 0 (allow) or 2 (block)
    ↓
If allowed → Command executes
    ↓
PostToolUse Hook
  • verify-changes.py
  • Validates file changes
  • Checks TypeScript syntax
  • Detects security issues
  • Returns 0 (ok) or 2 (revert)
    ↓
Agent continues working
    ↓
... many iterations ...
    ↓
Agent tries to finish
    ↓
Stop Hook
  • quality-gate.sh
  • Runs comprehensive checks:
    - TypeScript type check
    - ESLint
    - Tests with coverage
    - Build
    - Security audit
  • Returns 0 (can finish) or 2 (blocked)
    ↓
If all checks pass → Agent finishes
If any check fails → Agent must fix issues
```

---

## Security Model

### Phase 1: Docker Isolation (Current)

**Container Configuration:**
```yaml
security:
  - Read-only root filesystem
  - Ephemeral tmpfs mounts (/tmp, /home)
  - Non-root user (claude-agent:claude-agent)
  - Capability dropping (CAP_DROP=ALL)
  - Resource limits:
      memory: 2GB
      cpus: 2
      pids: 100
```

**Risk Reduction:** 60-70%

**What it prevents:**
- Filesystem tampering
- Privilege escalation
- Resource exhaustion
- Host system access

**What it doesn't prevent:**
- Credential theft via prompt injection
- Network-based attacks
- API key exfiltration

### Phase 2: Credential Proxy (Planned)

**Design:**
- Credentials never in container environment
- Unix socket proxy on host validates requests
- Agent requests credential via proxy
- Proxy checks request legitimacy
- Attaches credential only for valid requests

**Risk Reduction:** Additional 30% (CRITICAL)

See [Security Architecture](SECURITY-ARCHITECTURE.md) for complete design.

---

## State Management

### Current Approach (No Global State)

**React State:**
- Component-local state (useState)
- No Redux, Zustand, or Context providers
- Simple and explicit

**Data Fetching:**
- Direct Tauri IPC calls
- No React Query or SWR
- Manual refetching when needed

**Why this works:**
- Small app with few states
- No complex state synchronization
- Tauri IPC is fast enough

### Future (Phase 2)

When adding database and cloud sync:
- Add React Query for caching
- Add Zustand for global state
- Add real-time subscriptions

---

## Performance

### Measurements

**Cold Start:**
- First run: 5-10 minutes (Rust compile)
- Subsequent runs: ~30 seconds

**Voice Latency:**
- HTTP API: 3-5 seconds (transcribe → think → speak)
- Realtime API: 1-2 seconds (streaming)

**Spec Save:**
- < 100ms (file write)

**GitHub Issue Creation:**
- 1-2 seconds (API call)

### Optimizations

**Tauri:**
- Static Next.js export (no server)
- Native WebView (no Chromium bundle)
- Rust compiled to native code

**React:**
- Server Components where possible
- Minimal client-side JavaScript
- Code splitting (dynamic imports)

**File Operations:**
- Async I/O (Rust tokio)
- File watcher (reactive updates)

---

## Testing Strategy

### Unit Tests (Vitest)

**Coverage Requirements:**
- Overall: 75%+
- Business logic: 90%+
- UI components: 60%+

**Example:**
```typescript
// tests/unit/specs.test.ts
describe('Spec Management', () => {
  it('should create new version when editing', async () => {
    const spec = await createSpec('Feature X')
    await editSpec(spec.id, 'Updated content')
    const versions = await getVersions(spec.id)
    expect(versions).toHaveLength(2)
  })
})
```

### Integration Tests

**Tauri IPC:**
```typescript
// tests/integration/tauri-commands.test.ts
describe('Tauri Commands', () => {
  it('should save and retrieve spec', async () => {
    await invoke('save_spec', { content: '# Spec', projectName: 'test' })
    const specs = await invoke('list_specs', { projectName: 'test' })
    expect(specs).toHaveLength(1)
  })
})
```

### E2E Tests (Playwright)

**Critical Flows:**
```typescript
// tests/e2e/voice-conversation.spec.ts
test('complete voice conversation flow', async ({ page }) => {
  await page.click('[data-testid="chat-button"]')
  await page.click('[data-testid="mic-button"]')
  // Simulate voice input
  await page.waitForSelector('[data-testid="spec-viewer"]')
  await page.click('[data-testid="approve-button"]')
  await expect(page.getByText('Issue created')).toBeVisible()
})
```

**Visual Testing:**
- Screenshot comparisons
- Color/visibility state changes
- Animation validation

---

## Deployment

### Development

```bash
npm run tauri:dev
```

Runs in development mode with:
- Hot reload
- Source maps
- Debug logging
- DevTools enabled

### Production

```bash
npm run tauri:build
```

Creates distributable .app bundle:
- Optimized build
- Code signing (if configured)
- Installer generation
- Update manifest

**Output:** `src-tauri/target/release/bundle/macos/Sentra.app`

---

## Future Architecture

### Phase 2: Database Layer

**PostgreSQL + Prisma:**
```
┌──────────────────────┐
│   Sentra Native App   │
│  (Tauri + Next.js)    │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│   Node.js API Server  │
│  (Express + Prisma)   │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│   PostgreSQL Database │
│  (Projects, Specs,    │
│   Users, Sessions)    │
└──────────────────────┘
```

**Benefits:**
- Cloud sync between devices
- Multi-user support
- Better querying
- Real-time subscriptions

### Phase 3: Web Application

**Deployment:**
- Vercel (frontend)
- Railway (database + API)
- Auth (TOTP + OAuth)

**Architecture:**
- Same Next.js frontend
- Remove Tauri (web only)
- Add authentication layer
- Add WebSocket for real-time

---

## Known Limitations

### Current (Phase 1)

1. **No cloud sync** - Data stored locally only
2. **macOS only** - No Linux/Windows support yet
3. **File-based storage** - No database queries
4. **Dashboard mock data** - Not showing real project metrics
5. **No menu bar** - Full app window required

### Planned Improvements

See [Roadmap](../roadmap/) for detailed plans.

---

## References

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Last Updated:** 2025-11-13
**Maintained by:** Glen Barnhardt with help from Claude Code
