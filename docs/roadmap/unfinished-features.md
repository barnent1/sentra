# Unfinished Features

**What's not done yet and why**

Last Updated: 2025-11-13

---

## Overview

Quetrex is in **early implementation** phase. Many features are working, but several are incomplete or use mock data. This document tracks what's not finished and the plan to complete it.

**Status Legend:**
- 🚧 **In Progress** - Actively being worked on
- 📋 **Planned** - Designed, not started
- 💬 **Needs Discussion** - Requires decision/design
- ❌ **Not Started** - On roadmap but no work yet

---

## Dashboard Redesign 💬

### Current State: Minimalistic Single-Project View

**What's Working:**
- Basic dashboard page at `/`
- Project list (3 mock projects)
- Agent activity feed (mock data)
- Telemetry logs (mock data)
- Cost tracking (mock data)

**Files:**
- `src-tauri/src/commands.rs` - Returns hardcoded data
- `src/app/page.tsx` - Displays mock dashboard

**Limitations:**
- All data is mock (no real project scanning)
- Single project focus (no multi-project grid)
- No voice integration
- No Git visibility
- No in-app PR review

### Approved Redesign: Mission Control 💬

**Status:** Approved design, not yet implemented

**Design Doc:** [/docs/roadmap/dashboard-redesign.md](../roadmap/dashboard-redesign.md)

**Vision:** Transform from minimalistic view to mission control center for multiple AI-powered projects

**Key Features:**

1. **Multi-Project Grid**
   - 4-6 project cards visible at once
   - Status indicators (● green = active, ○ gray = idle, ● yellow = waiting)
   - Progress bars showing task completion
   - Per-project mute buttons

2. **True Dark Theme**
   - Dark cards (#18181B) with subtle borders
   - Violet accent color (#7C3AED)
   - Professional, modern design

3. **Project Creation UI**
   - [+ New Project] button
   - Template selection (Next.js, Python FastAPI, React Native, Blank)
   - Auto-initialization (Git, GitHub, Quetrex tracking)
   - No terminal needed

4. **Voice Queue System**
   - Prevents overlapping speech from multiple projects
   - Per-project muting
   - Priority-based notifications
   - Silent notifications for muted projects

5. **Drill-Down Detail Panel**
   - Slide-in panel (50% screen width)
   - Tabs: Overview, Git, Logs, Costs
   - Real-time activity streaming
   - Progress breakdown with checkpoints

6. **In-App PR Review**
   - View PRs without leaving Quetrex
   - Inline diff viewer with syntax highlighting
   - File tree navigation
   - Approve/merge with one click
   - GitHub API integration

7. **Analytics & Costs**
   - Separate tabs for analytics and costs
   - Charts showing trends (Recharts)
   - Budget alerts
   - Per-project cost breakdown

**Implementation Phases:**

- **Phase 1 (Weeks 1-2):** Core dashboard redesign 📋
  - Multi-project card grid
  - True dark theme
  - Status indicators
  - Progress bars
  - Tab navigation

- **Phase 2 (Week 3):** Project management 📋
  - New Project button + modal
  - Template selection
  - Auto-initialization
  - Real project scanning

- **Phase 3 (Week 4):** Voice integration 📋
  - Voice queue service
  - Per-project mute buttons
  - Priority notifications
  - Silent mode

- **Phase 4 (Week 5):** Drill-down details 📋
  - Slide-in detail panel
  - Overview/Git/Logs/Costs tabs
  - Real-time log streaming
  - Progress breakdown

- **Phase 5 (Week 6):** PR review 📋
  - PR review modal
  - GitHub API client
  - Diff viewer
  - Approve/merge functionality

- **Phase 6 (Weeks 7-8):** Analytics 📋
  - Analytics tab (charts, metrics)
  - Costs tab (tracking, budgets)
  - Historical trends
  - Optimization insights

**Related Docs:**
- [Dashboard Redesign Spec](../roadmap/dashboard-redesign.md) - Complete design
- [Observability Vision](../roadmap/observability.md) - Multi-project visibility
- [Dashboard Feature](../features/dashboard.md) - Current vs planned
- [Project Creation](../features/project-creation.md) - New Project feature
- [PR Approval](../features/pr-approval.md) - In-app PR review

---

## Database Layer 📋

### Current State: File-Based Storage

**What We Have:**
- Specs stored in `.quetrex/specs/` as markdown files
- Settings stored in Tauri app data
- No persistent database
- No cloud sync

**Files:**
- `.quetrex/specs/` - Spec files (versioned)
- `.quetrex/memory/` - Project context
- `.quetrex/config.yml` - Configuration

**Why File-Based:**
Simpler for Phase 1. No server setup needed. Easy to version control.

### Planned Database

**Phase 2 (Months 3-4):**

**Stack:**
- PostgreSQL (relational database)
- Prisma (ORM)
- Node.js API server (Express)
- Railway (hosting)

**Schema:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  apiKeys   ApiKey[]
  projects  Project[]
  createdAt DateTime @default(now())
}

model Project {
  id          String   @id @default(uuid())
  name        String
  path        String
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  specs       Spec[]
  agents      Agent[]
  createdAt   DateTime @default(now())
}

model Spec {
  id          String        @id @default(uuid())
  projectId   String
  project     Project       @relation(fields: [projectId], references: [id])
  title       String
  content     String
  version     Int
  isApproved  Boolean       @default(false)
  versions    SpecVersion[]
  createdAt   DateTime      @default(now())
}

model SpecVersion {
  id        String   @id @default(uuid())
  specId    String
  spec      Spec     @relation(fields: [specId], references: [id])
  version   Int
  content   String
  createdAt DateTime @default(now())
}

model Agent {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  status      String   // running, completed, failed
  githubIssue String?
  logs        String[]
  startedAt   DateTime @default(now())
  completedAt DateTime?
}
```

**Benefits:**
- Cloud sync between devices
- Multi-user support
- Complex queries
- Real-time subscriptions
- Analytics and reporting

**Migration Plan:**
1. Set up PostgreSQL on Railway
2. Create Prisma schema
3. Build Node.js API
4. Update Tauri to call API instead of files
5. Add authentication (TOTP)
6. Migrate existing file data

---

## Menu Bar Integration 📋

### Current State: Full Window App

**What We Have:**
- Full Quetrex app window
- Standard macOS window controls
- Dock icon

**What's Missing:**
- Menu bar integration
- Quick access without full app
- Background operation
- System tray icon

### Planned Menu Bar

**Phase 1 (Month 2):**

**Features:**
- Menu bar icon (Quetrex logo)
- Quick actions:
  - "Chat with Architect" (opens voice modal)
  - "View recent specs"
  - "Open dashboard"
  - "Settings"
  - "Quit"
- Notifications
- Status indicator (agent running, etc.)

**Implementation:**
```rust
// src-tauri/src/lib.rs
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent};

let tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("chat", "Chat with Architect"))
    .add_item(CustomMenuItem::new("specs", "View Specs"))
    .add_item(CustomMenuItem::new("open", "Open Dashboard"))
    .add_item(CustomMenuItem::new("quit", "Quit"));

let system_tray = SystemTray::new().with_menu(tray_menu);

tauri::Builder::default()
    .system_tray(system_tray)
    .on_system_tray_event(|app, event| match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "chat" => {
                    // Open voice modal
                }
                "open" => {
                    // Show main window
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    })
```

**Design:**
- Icon: Green beaker with "S"
- Click: Quick menu
- Right-click: Full menu
- Notification badges for agent status

---

## Agent Worker SDK Usage 🚧

### Current State: CLI-Based (Incomplete)

**What We Have:**
- Python worker script (`ai-agent-worker.py`)
- Comprehensive error handling
- Quality hooks integration
- GitHub Actions workflow

**What's Wrong:**
- Script tries to call `claude-code` CLI (doesn't exist as callable)
- Should use Anthropic Python SDK directly
- Core execution engine needs rewrite

**Files:**
- `.claude/scripts/ai-agent-worker.py` (1148 lines)
- `.github/workflows/ai-agent.yml`

### Planned Fix

**Phase 1 (This Week):**

**Replace:**
```python
# Current (doesn't work)
subprocess.run([
    "claude-code",
    "--api-key", api_key,
    "--yes"
], input=prompt, capture_output=True)
```

**With:**
```python
# Fixed (uses SDK)
from anthropic import Anthropic

client = Anthropic(api_key=api_key)

conversation = []
while not finished:
    response = client.messages.create(
        model="claude-sonnet-4",
        messages=conversation,
        max_tokens=4000,
        tools=[...file_tools...]
    )

    # Parse tool calls
    for tool_use in response.content:
        if tool_use.type == "tool_use":
            if tool_use.name == "write_file":
                execute_file_write(tool_use.input)
            elif tool_use.name == "run_command":
                execute_command(tool_use.input)

    conversation.append({
        "role": "assistant",
        "content": response.content
    })

    # Check if done
    if no_more_tool_calls:
        finished = True
```

**Benefits:**
- Actually works (no dependency on non-existent CLI)
- Better error handling
- Token tracking for costs
- More control over conversation flow

**Status:** Design complete, implementation started.

---

## Credential Proxy Service 📋

### Current State: Credentials in Environment

**Security Risk:**
- GitHub token in workflow environment
- OpenAI API key in container
- Anthropic API key accessible to agent
- Could be stolen via prompt injection

**Current Risk Level:** 30-40% (Phase 1 Docker reduces some risk)

### Planned Proxy

**Phase 2 (Weeks 2-4):**

**Architecture:**
```
Docker Container (Agent)
    ↓ (requests credential)
Unix Socket
    ↓
Credential Proxy (Host)
    ↓ (validates request)
Attaches credential only if valid
    ↓
Request proceeds with credential
```

**Design:**
- Proxy runs on host (outside container)
- Agent requests credential via socket
- Proxy checks:
  - Request legitimacy
  - Allowed operations
  - Rate limits
- Proxy attaches credential and forwards
- Full audit trail

**Benefits:**
- Credentials never in container
- Prevents prompt injection theft
- Audit trail of all API usage
- Additional 30% risk reduction (CRITICAL)

**Implementation:**
```python
# In container (agent)
def github_api_call(endpoint, method, data):
    # Request through proxy
    response = proxy_client.request(
        service="github",
        endpoint=endpoint,
        method=method,
        data=data
    )
    return response

# On host (proxy)
def validate_request(service, endpoint, method):
    # Check allowed operations
    if service == "github":
        if endpoint.startswith("/repos/") and method == "GET":
            return True  # Read operations allowed
        if endpoint.startswith("/repos/") and method == "POST":
            return True  # Creating issues/PRs allowed
        return False  # Other operations blocked
```

See [Security Architecture](../architecture/SECURITY-ARCHITECTURE.md) for complete design.

---

## Platform Support ❌

### Current State: macOS Only

**What Works:**
- macOS 10.15+ (Catalina or later)
- Intel and Apple Silicon

**What Doesn't:**
- Linux (not tested)
- Windows (not tested)

### Planned Support

**Phase 2 (Months 3-4):**

1. **Linux Desktop** (Month 3)
   - Ubuntu 20.04+
   - Fedora 35+
   - Arch Linux
   - Tauri supports Linux natively
   - Test on major distros
   - Package as AppImage/deb/rpm

2. **Windows Desktop** (Month 4)
   - Windows 10+
   - Windows 11
   - Test with Windows Defender
   - Package as MSI installer
   - Handle Windows-specific paths

**Challenges:**
- Different file paths (Windows uses backslashes)
- Different permissions model
- Different native look and feel
- Testing on multiple platforms

**Testing Strategy:**
- GitHub Actions matrices for multi-platform builds
- Virtual machines for manual testing
- Beta testers on each platform

---

## Web Application ❌

### Current State: Native App Only

**What We Have:**
- Tauri native app
- Next.js frontend (embedded)
- No web deployment

**What's Missing:**
- Standalone web app
- Authentication
- Multi-user support
- Cloud hosting

### Planned Web App

**Phase 3 (Months 5-6):**

**Architecture:**
```
Browser
    ↓
Next.js Web App (Vercel)
    ↓
Node.js API (Railway)
    ↓
PostgreSQL (Railway)
```

**Features:**
- Same UI as native app
- TOTP 2FA authentication
- OAuth (GitHub, Google)
- User accounts and teams
- Cloud sync (all devices)
- Real-time collaboration

**Authentication:**
```typescript
// TOTP 2FA
import * as OTPAuth from 'otpauth'

// Generate secret
const secret = OTPAuth.Secret.generate()

// Generate QR code
const totp = new OTPAuth.TOTP({
  issuer: 'Quetrex',
  label: user.email,
  secret: secret,
})

// Verify code
const valid = totp.validate({ token: userCode, window: 1 })
```

**OAuth:**
```typescript
// GitHub OAuth
import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
}
```

**Deployment:**
- Vercel (frontend) - Free tier sufficient initially
- Railway (backend) - $5/month
- PostgreSQL (Railway) - Included

**Trade-offs:**
- No offline support (native app still available)
- Requires internet
- Subscription may be needed for hosting costs

---

## Analytics and Monitoring ❌

### Current State: No Observability

**What's Missing:**
- No agent execution logs (in UI)
- No cost tracking (real)
- No performance metrics
- No error monitoring
- No usage analytics

### Planned Analytics

**Phase 2 (Months 3-4):**

**Agent Execution Logs:**
- Real-time streaming from GitHub Actions
- Syntax-highlighted code diffs
- Step-by-step progress
- Error details and stack traces

**Cost Tracking:**
- OpenAI API usage (per request)
- Anthropic API usage (per agent run)
- GitHub Actions minutes used
- Total monthly costs
- Budget alerts

**Performance Metrics:**
- Spec creation time
- Agent execution time
- Test coverage trends
- Build success rate
- PR merge rate

**Error Monitoring:**
- Failed agent runs
- API errors
- Build failures
- Test failures
- Categorized by type

**Implementation:**
```typescript
// Telemetry collection
interface AgentMetrics {
  runId: string
  projectId: string
  specId: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  duration?: number
  apiCalls: {
    openai: { requests: number; tokens: number; cost: number }
    anthropic: { requests: number; tokens: number; cost: number }
  }
  githubActions: {
    workflowId: string
    runNumber: number
    minutesUsed: number
  }
  buildMetrics: {
    lintErrors: number
    typeErrors: number
    testsPassed: number
    testsFailed: number
    coverage: number
  }
  files: {
    changed: number
    created: number
    deleted: number
  }
}
```

---

## Testing Gaps 💬

### Current State: Partial Coverage

**What's Tested:**
- Quality hooks (100%)
- Spec management (basic)
- Settings (basic)

**What's Not Tested:**
- Voice conversations (E2E needed)
- Realtime API integration
- Agent worker script
- GitHub Actions workflow
- Visual state changes (screenshots)

### Planned Tests

**Phase 1 (Month 2):**

1. **Voice E2E Tests**
   ```typescript
   test('voice conversation creates spec', async ({ page }) => {
     await page.click('[data-testid="chat-button"]')
     await page.click('[data-testid="mic-button"]')

     // Simulate voice input
     await simulateVoiceInput(page, 'I want to build a login feature')

     // Wait for AI response
     await page.waitForSelector('[data-testid="ai-message"]')

     // Complete conversation
     await simulateVoiceInput(page, "that's everything")

     // Should show spec viewer
     await expect(page.getByRole('dialog')).toBeVisible()
     await expect(page.getByText('Specification Review')).toBeVisible()
   })
   ```

2. **Visual Regression Tests**
   - Screenshot comparisons for all components
   - Color/visibility state changes
   - Animation frames
   - Dark mode

3. **Agent Worker Tests**
   - Unit tests for Python script
   - Integration tests with mocked APIs
   - E2E tests in Docker environment

---

## Summary

### High Priority (Phase 1 - Month 2)

1. ✅ **Agent worker SDK fix** - Replace CLI with Anthropic SDK (🚧 In Progress)
2. 📋 **Menu bar integration** - Quick access from menu bar
3. 📋 **Dashboard real data** - Show actual projects and agents

### Medium Priority (Phase 2 - Months 3-4)

4. 📋 **Database layer** - PostgreSQL + Prisma + cloud sync
5. 📋 **Credential proxy** - Security Phase 2 (CRITICAL)
6. 📋 **Platform support** - Linux and Windows
7. 📋 **Analytics** - Real cost tracking and metrics

### Lower Priority (Phase 3+ - Months 5-12)

8. ❌ **Web application** - Browser-based version
9. ❌ **gVisor security** - Security Phase 3
10. ❌ **Team features** - Multi-user collaboration

---

**Last Updated:** 2025-11-13
**Maintained by:** Glen Barnhardt with help from Claude Code

See [roadmap/](.) for detailed plans on each feature.
