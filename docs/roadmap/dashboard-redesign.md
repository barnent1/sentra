# Dashboard Redesign: Mission Control

**Status:** 💬 Approved Design (Not Yet Implemented)

**Last Updated:** 2025-11-13

**Approved By:** Glen Barnhardt

---

## Vision

Transform Sentra's dashboard from a minimalistic single-project view into a **mission control center** for managing multiple AI-powered projects simultaneously. The redesign emphasizes:

1. **Multi-project visibility** - Monitor all your projects at a glance
2. **True dark theme** - Professional dark cards with subtle borders, violet accents
3. **Actionable intelligence** - See status, progress, and next actions without drilling down
4. **Voice-first interaction** - Queue system prevents overlapping speech from multiple projects
5. **In-app workflow** - Create projects, review PRs, and manage everything without leaving Sentra

---

## Design System

### Color Palette (True Dark Theme)

```
Background:     #0A0A0B (near black)
Card Surface:   #18181B (dark charcoal)
Border:         #27272A (subtle gray, 1px)
Accent:         #7C3AED (violet)
Success:        #10B981 (green)
Warning:        #F59E0B (amber)
Error:          #EF4444 (red)
Text Primary:   #FAFAFA (off-white)
Text Secondary: #A1A1AA (gray)
```

### Typography

```
Headings:  Inter, 600-700 weight
Body:      Inter, 400-500 weight
Code:      JetBrains Mono, 400 weight
```

### Spacing

```
Grid gap:     24px
Card padding: 20px
Sections:     48px vertical spacing
```

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Sentra                                    [Settings] [Profile]  │
├─────────────────────────────────────────────────────────────────┤
│  [Projects] [Analytics] [Costs] [Settings]                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ ● Sentra            │  │ ● E-commerce App    │   [+ New]    │
│  │                     │  │                     │              │
│  │ Implementing voice  │  │ Building checkout   │              │
│  │ queue system        │  │ flow                │              │
│  │                     │  │                     │              │
│  │ ████████░░░░ 65%   │  │ ██████░░░░░░ 45%   │              │
│  │                     │  │                     │              │
│  │ [View] [Mute] [•••] │  │ [View] [Mute] [•••] │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ ○ Blog Platform     │  │ ○ Mobile App        │              │
│  │                     │  │                     │              │
│  │ Waiting for         │  │ No active tasks     │              │
│  │ spec approval       │  │                     │              │
│  │                     │  │                     │              │
│  │ ░░░░░░░░░░░░ 0%    │  │ ░░░░░░░░░░░░ 0%    │              │
│  │                     │  │                     │              │
│  │ [View] [Mute] [•••] │  │ [View] [Mute] [•••] │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Card Design

Each project card displays:

### Card Header
```
┌─────────────────────┐
│ ● Project Name      │  ← Status indicator (green=running, yellow=waiting, gray=idle)
│     [Mute] [•••]    │  ← Per-project mute button, overflow menu
└─────────────────────┘
```

### Current Task
```
Implementing voice queue system
```
- Single line, truncated with ellipsis if too long
- Empty state: "No active tasks"

### Progress Bar
```
████████░░░░ 65%
```
- Visual progress indicator
- Percentage calculated from task breakdown
- Color: violet (#7C3AED) for active, gray for idle

### Action Buttons
```
[View] [Mute] [•••]
```
- **View**: Open drill-down detail panel
- **Mute**: Toggle voice notifications for this project
- **•••**: Overflow menu (Archive, Delete, Settings)

### Status Indicator

Circle indicator in top-left of card:
- **● Green**: Agent actively working
- **● Yellow**: Waiting for user input (spec approval, PR review)
- **○ Gray**: Idle, no active work

---

## Tab Navigation

### Projects Tab (Default)
Grid of project cards as shown above.

### Analytics Tab
```
┌─────────────────────────────────────────┐
│  Tasks Completed: 142                   │
│  Success Rate: 94%                      │
│  Average Time to PR: 18 minutes         │
│                                         │
│  [Chart: Tasks over time]               │
│  [Chart: Success rate trend]            │
└─────────────────────────────────────────┘
```

### Costs Tab
```
┌─────────────────────────────────────────┐
│  This Month: $47.32                     │
│  Budget: $100.00 (47% used)             │
│                                         │
│  Breakdown:                             │
│  - OpenAI API:     $28.50               │
│  - Anthropic API:  $18.82               │
│  - GitHub Actions: $0.00 (free tier)    │
│                                         │
│  [Chart: Daily spending]                │
└─────────────────────────────────────────┘
```

**Note:** Costs hidden by default (separate tab), not shown in main dashboard to avoid anxiety.

### Settings Tab
Global Sentra settings (API keys, preferences, etc.)

---

## New Project Button

**Location:** Top-right of dashboard, next to project cards grid

```
[+ New Project]
```

**Behavior:** Opens modal with template selection

### New Project Modal

```
┌─────────────────────────────────────────┐
│  Create New Project                     │
├─────────────────────────────────────────┤
│                                         │
│  Project Name:                          │
│  [_____________________________]        │
│                                         │
│  Location:                              │
│  [~/Projects/my-app        ] [Browse]   │
│                                         │
│  Template:                              │
│  ┌───────────┐ ┌───────────┐           │
│  │ Next.js   │ │ Python    │           │
│  │ Full Stack│ │ FastAPI   │           │
│  └───────────┘ └───────────┘           │
│  ┌───────────┐ ┌───────────┐           │
│  │ React     │ │ Blank     │           │
│  │ Native    │ │ Project   │           │
│  └───────────┘ └───────────┘           │
│                                         │
│  [x] Initialize Git repository          │
│  [x] Create GitHub repository           │
│  [x] Add to Sentra tracking             │
│                                         │
│          [Cancel]  [Create Project]     │
└─────────────────────────────────────────┘
```

**Templates Available:**

1. **Next.js Full Stack**
   - Next.js 15 + TypeScript + TailwindCSS
   - Prisma + PostgreSQL
   - Authentication (NextAuth)
   - API routes

2. **Python FastAPI**
   - FastAPI + Pydantic
   - SQLAlchemy + PostgreSQL
   - JWT authentication
   - Docker setup

3. **React Native**
   - Expo + TypeScript
   - Navigation (React Navigation)
   - State management (Zustand)
   - API client (Axios)

4. **Blank Project**
   - Empty directory
   - Git initialization only
   - User provides structure

**Auto-initialization:**
- Creates directory structure
- Initializes Git repository
- Creates GitHub repository (if selected)
- Adds `.sentra/` directory for tracking
- Adds to Sentra project list
- Opens in dashboard

---

## Drill-Down Detail Panel

**Trigger:** Click "View" button on project card

**Behavior:** Slide-in panel from right side, 50% screen width

```
┌─────────────────────────────────────────┐
│  ← Back          Sentra                 │
├─────────────────────────────────────────┤
│  [Overview] [Git] [Logs] [Costs]        │
├─────────────────────────────────────────┤
│                                         │
│  Status: ● Running                      │
│  Current Task: Implementing voice queue │
│  Started: 14 minutes ago                │
│                                         │
│  Progress Breakdown:                    │
│  ✅ Create voice queue service          │
│  ✅ Add queue state management          │
│  🚧 Implement speech queueing logic     │
│  ⏳ Add per-project muting              │
│  ⏳ Test multi-project scenarios        │
│                                         │
│  Next Steps:                            │
│  - Complete queueing logic              │
│  - Review and test                      │
│  - Create PR                            │
│                                         │
└─────────────────────────────────────────┘
```

### Overview Tab
- Current status and task
- Progress breakdown (checklist of sub-tasks)
- Next steps
- Estimated time remaining

### Git Tab
```
Recent Commits:
┌─────────────────────────────────────────┐
│  feat: add voice queue state            │
│  14 minutes ago                         │
│  +42 -8 (3 files changed)              │
│  [View Diff]                            │
├─────────────────────────────────────────┤
│  chore: update dependencies             │
│  2 hours ago                            │
│  +12 -4 (2 files changed)              │
│  [View Diff]                            │
└─────────────────────────────────────────┘

Pull Requests:
┌─────────────────────────────────────────┐
│  #42 Implement voice queue system       │
│  Status: ● Open                         │
│  Checks: ✅ All passing                 │
│  [Review & Approve]                     │
└─────────────────────────────────────────┘
```

### Logs Tab
```
Real-time agent activity logs:

[14:32:15] Starting task: Implement voice queue
[14:32:18] ✅ Created VoiceQueueService
[14:32:45] ✅ Added queue state to store
[14:33:02] 🔄 Writing queue logic...
[14:33:28] Running tests...
[14:33:35] ✅ 24 tests passed
```

### Costs Tab (Per-Project)
```
This Project:
- OpenAI API: $4.20
- Anthropic API: $2.80
- Total: $7.00

Last 7 Days:
[Mini chart showing daily costs]
```

---

## Voice Queue System

**Problem:** Multiple projects running simultaneously could speak over each other.

**Solution:** Voice queue with per-project filtering.

### Architecture

```
Voice Queue Service
    ↓
Queue: [
  { project: "sentra", message: "Voice queue implemented" },
  { project: "ecommerce", message: "Checkout flow complete" }
]
    ↓
Speech Processor
    ↓
Checks mute settings
    ↓
Speaks one message at a time
    ↓
Waits for completion
    ↓
Next in queue
```

### Per-Project Muting

Each project card has a **[Mute]** button:
- **Muted**: Project voice notifications disabled
- **Unmuted**: Project can speak through queue
- **Persisted**: Mute state saved in project config

### Queue Behavior

1. **Agent completes task** → Message added to queue
2. **Queue processor checks** → Is project muted?
3. **If unmuted** → Add to speech queue
4. **If muted** → Show silent notification only
5. **Speech queue** → Processes one message at a time
6. **Wait for completion** → 1000ms delay (echo prevention)
7. **Next message** → Process from queue

### Implementation Location

```
src/services/voice-queue.ts
```

**Interface:**
```typescript
interface VoiceQueueService {
  enqueue(message: VoiceMessage): void
  dequeue(): VoiceMessage | null
  isMuted(projectId: string): boolean
  setMuted(projectId: string, muted: boolean): void
  processQueue(): Promise<void>
}

interface VoiceMessage {
  projectId: string
  projectName: string
  message: string
  timestamp: Date
  priority: 'low' | 'normal' | 'high'
}
```

---

## In-App PR Review & Approval

**Problem:** User must leave Sentra to review PRs on GitHub.

**Solution:** Inline PR review modal with GitHub API integration.

### PR Review Modal

**Trigger:** Click "[Review & Approve]" in Git tab

```
┌─────────────────────────────────────────────────────────────┐
│  Pull Request #42: Implement voice queue system             │
├─────────────────────────────────────────────────────────────┤
│  [Conversation] [Files Changed (3)] [Checks]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Files Changed:                                             │
│  ┌─ src/services/voice-queue.ts ──────────── +42 -8 ────┐  │
│  │ + export class VoiceQueueService {                    │  │
│  │ +   private queue: VoiceMessage[] = []                │  │
│  │ +   private processing = false                        │  │
│  │ +                                                      │  │
│  │ +   enqueue(message: VoiceMessage): void {            │  │
│  │ +     this.queue.push(message)                        │  │
│  │ +     this.processQueue()                             │  │
│  │ +   }                                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ src/store/voice-store.ts ──────────── +12 -2 ───────┐  │
│  │   export const useVoiceStore = create<VoiceState>((set) │
│  │ +   queuedMessages: [],                               │  │
│  │ +   addToQueue: (message) => set((state) => ({        │  │
│  │ +     queuedMessages: [...state.queuedMessages, ...]  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  Checks: ✅ All passing                                     │
│  - Build: ✅ Success                                        │
│  - Tests: ✅ 24 passed                                      │
│  - Lint: ✅ No issues                                       │
│                                                             │
│  [Approve & Merge]  [Request Changes]  [Comment]  [Close]  │
└─────────────────────────────────────────────────────────────┘
```

### GitHub API Integration

**Endpoints Used:**
```typescript
// Get PR details
GET /repos/{owner}/{repo}/pulls/{number}

// Get PR files
GET /repos/{owner}/{repo}/pulls/{number}/files

// Get PR checks
GET /repos/{owner}/{repo}/commits/{sha}/check-runs

// Approve PR
POST /repos/{owner}/{repo}/pulls/{number}/reviews
{
  event: "APPROVE",
  body: "Approved via Sentra"
}

// Merge PR
PUT /repos/{owner}/{repo}/pulls/{number}/merge
{
  merge_method: "squash"
}
```

**Implementation Location:**
```
src/services/github-api.ts
```

**Authentication:**
- Uses GitHub Personal Access Token
- Stored in Sentra settings
- Scopes required: `repo`, `workflow`

### File Tree Navigation

For PRs with many files, show collapsible file tree:

```
├─ src/
│  ├─ services/
│  │  └─ voice-queue.ts (+42 -8)
│  └─ store/
│     └─ voice-store.ts (+12 -2)
└─ tests/
   └─ voice-queue.test.ts (+18 -0)
```

Click file to view diff inline.

---

## Progress Calculation System

**Challenge:** How do we calculate progress percentage for each project?

### Task Breakdown Approach

When agent starts work, it creates a task breakdown:

```yaml
# .sentra/tasks/current.yml
task: Implement voice queue system
started: 2025-11-13T14:32:15Z
checkpoints:
  - name: Create voice queue service
    status: completed
    completedAt: 2025-11-13T14:32:45Z
  - name: Add queue state management
    status: completed
    completedAt: 2025-11-13T14:33:15Z
  - name: Implement speech queueing logic
    status: in_progress
    startedAt: 2025-11-13T14:33:20Z
  - name: Add per-project muting
    status: pending
  - name: Test multi-project scenarios
    status: pending
```

### Progress Formula

```
Progress = (Completed Checkpoints / Total Checkpoints) * 100
```

Example:
- 2 completed / 5 total = 40%

### Checkpoint Detection

Agent automatically creates checkpoints by analyzing the task:

```typescript
// src/services/task-breakdown.ts
async function generateCheckpoints(task: string): Promise<Checkpoint[]> {
  const prompt = `Break down this task into 3-7 concrete checkpoints: ${task}`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4",
    messages: [{ role: "user", content: prompt }]
  })

  return parseCheckpoints(response.content)
}
```

### Real-Time Updates

As agent completes each checkpoint:
1. Updates `.sentra/tasks/current.yml`
2. Tauri watches file for changes
3. Dashboard updates progress bar
4. Voice notification (if unmuted): "Checkpoint complete: Add queue state management"

---

## Visual Reference

The design should match the aesthetic shown in the user's reference image:

**Key Visual Elements:**
- **Dark cards** with subtle borders (not stark white)
- **Violet accent color** (#7C3AED) for progress bars and highlights
- **Charts and graphs** for analytics (using Recharts or similar)
- **Calendar/timeline** views for activity history
- **Minimalist icons** (Lucide React or Heroicons)
- **Smooth animations** (Framer Motion) for transitions

**Typography:**
- Clean, professional Inter font
- Consistent sizing hierarchy
- High contrast for readability

**Spacing:**
- Generous padding in cards (20px)
- Consistent gaps between elements (24px grid)
- Visual breathing room

---

## Implementation Phases

### Phase 1: Core Dashboard (Week 1-2)
- ✅ Multi-project card grid
- ✅ Status indicators
- ✅ Progress bars
- ✅ True dark theme colors
- ✅ Tab navigation structure

### Phase 2: Project Management (Week 3)
- ✅ New Project button + modal
- ✅ Template selection
- ✅ Auto-initialization (Git, GitHub, Sentra)
- ✅ Project scaffolding (Tauri command)

### Phase 3: Voice Queue (Week 4)
- ✅ Voice queue service
- ✅ Per-project muting
- ✅ Queue processing logic
- ✅ Silent notifications for muted projects

### Phase 4: Drill-Down Details (Week 5)
- ✅ Slide-in detail panel
- ✅ Overview tab (progress breakdown)
- ✅ Git tab (commits, branches)
- ✅ Logs tab (real-time streaming)
- ✅ Costs tab (per-project tracking)

### Phase 5: PR Review (Week 6)
- ✅ PR review modal
- ✅ GitHub API integration
- ✅ Inline diff viewer
- ✅ File tree navigation
- ✅ Approve/merge functionality

### Phase 6: Analytics & Costs (Week 7-8)
- ✅ Analytics tab (charts, metrics)
- ✅ Costs tab (spending tracking)
- ✅ Budget alerts
- ✅ Historical trends

---

## Technical Requirements

### Frontend Stack
```json
{
  "dependencies": {
    "next": "15.5.0",
    "react": "19.0.0",
    "recharts": "^2.10.0",       // Charts
    "framer-motion": "^11.0.0",  // Animations
    "lucide-react": "^0.400.0",  // Icons
    "zustand": "^4.5.0",         // State management
    "@octokit/rest": "^20.0.0"   // GitHub API
  }
}
```

### Tauri Commands

```rust
// src-tauri/src/commands.rs

#[tauri::command]
pub async fn create_project(
    name: String,
    location: String,
    template: String,
    init_git: bool,
    create_github: bool
) -> Result<Project, String> {
    // 1. Create directory
    // 2. Initialize from template
    // 3. Init Git if requested
    // 4. Create GitHub repo if requested
    // 5. Add .sentra/ directory
    // 6. Add to project list
    // 7. Return project details
}

#[tauri::command]
pub async fn get_project_progress(project_id: String) -> Result<Progress, String> {
    // Read .sentra/tasks/current.yml
    // Calculate progress from checkpoints
    // Return percentage and breakdown
}

#[tauri::command]
pub async fn get_git_status(project_path: String) -> Result<GitStatus, String> {
    // Get recent commits
    // Get open PRs (via GitHub API)
    // Get branch info
    // Return status
}
```

### File Watchers

```rust
// Watch for task updates
use notify::{Watcher, RecursiveMode, Event};

fn watch_task_file(project_path: &str, callback: impl Fn(Progress)) {
    let task_file = format!("{}/.sentra/tasks/current.yml", project_path);

    let mut watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
        if let Ok(event) = res {
            // File changed, recalculate progress
            let progress = calculate_progress(&task_file);
            callback(progress);
        }
    }).unwrap();

    watcher.watch(task_file.as_ref(), RecursiveMode::NonRecursive).unwrap();
}
```

---

## Testing Requirements

### Unit Tests
- Voice queue service logic
- Progress calculation
- Task breakdown parsing
- GitHub API client

### Integration Tests
- Project creation flow
- Voice queue with multiple projects
- PR review workflow
- Real-time progress updates

### E2E Tests
```typescript
test('create new project from template', async ({ page }) => {
  await page.click('[data-testid="new-project-button"]')
  await page.fill('[data-testid="project-name"]', 'Test Project')
  await page.click('[data-testid="template-nextjs"]')
  await page.click('[data-testid="create-project"]')

  // Should show new project card
  await expect(page.getByText('Test Project')).toBeVisible()
  await expect(page.getByText('No active tasks')).toBeVisible()
})

test('view project drill-down details', async ({ page }) => {
  await page.click('[data-testid="project-card-sentra"] [data-testid="view-button"]')

  // Detail panel should slide in
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Progress Breakdown:')).toBeVisible()
})

test('review and approve PR in-app', async ({ page }) => {
  await page.click('[data-testid="project-card-sentra"] [data-testid="view-button"]')
  await page.click('[data-testid="tab-git"]')
  await page.click('[data-testid="pr-42-review"]')

  // PR modal should open
  await expect(page.getByText('Pull Request #42')).toBeVisible()
  await expect(page.getByText('Files Changed')).toBeVisible()

  // Approve and merge
  await page.click('[data-testid="approve-merge-button"]')
  await expect(page.getByText('PR merged successfully')).toBeVisible()
})
```

---

## Security Considerations

### GitHub Token Storage
- Stored in Tauri secure storage (OS keychain)
- Never exposed to renderer process
- Only used in Rust backend

### API Rate Limiting
- Respect GitHub API rate limits (5000/hour for authenticated)
- Cache PR data to reduce calls
- Implement retry with exponential backoff

### Input Validation
- Sanitize project names (no special chars)
- Validate file paths (prevent directory traversal)
- Validate GitHub repository names

---

## Accessibility

### Keyboard Navigation
- Tab through project cards
- Arrow keys for grid navigation
- Enter to open details
- Escape to close modals

### Screen Reader Support
- ARIA labels for all interactive elements
- Status announcements for progress updates
- Semantic HTML structure

### Color Contrast
- All text meets WCAG AA standards (4.5:1 contrast)
- Status colors have both color AND icon indicators
- Focus indicators clearly visible

---

## Future Enhancements (Post-Launch)

### Collaboration Features
- Share project dashboards with team
- Real-time updates from multiple users
- Comment threads on tasks

### Advanced Analytics
- Time-to-completion predictions
- Quality metrics (test coverage trends)
- Agent performance scoring

### Custom Dashboards
- User-configurable layouts
- Custom widgets
- Saved views/filters

### Mobile Companion App
- View project status on phone
- Approve PRs on the go
- Voice commands via mobile

---

## Related Documentation

- [/docs/features/dashboard.md](../features/dashboard.md) - Current vs future comparison
- [/docs/roadmap/observability.md](./observability.md) - Observability vision
- [/docs/features/project-creation.md](../features/project-creation.md) - Project creation details
- [/docs/features/pr-approval.md](../features/pr-approval.md) - PR review workflow
- [/docs/roadmap/unfinished-features.md](./unfinished-features.md) - Implementation status

---

**Next Steps:**
1. Review and approve design
2. Begin Phase 1 implementation
3. User testing with multi-project scenarios
4. Iterate based on feedback

---

*Designed by Glen Barnhardt with help from Claude Code*
*Last Updated: 2025-11-13*
