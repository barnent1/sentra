# Dashboard Feature

**Current Status:** ✅ Basic Implementation (Mock Data)

**Planned:** 💬 Mission Control Redesign (Approved Design)

**Last Updated:** 2025-11-13

---

## Overview

The Quetrex dashboard is the central hub for monitoring and managing AI-powered projects. It provides real-time visibility into agent activity, project status, and system health.

---

## Current Implementation (Phase 1)

### What's Working

**Minimalistic Single View**
- Basic dashboard at `/` (home page)
- Project list (3 mock projects displayed)
- Agent activity feed (mock data)
- Telemetry logs panel (mock data)
- Cost tracking panel (mock data)

**Technology:**
```typescript
// src/app/page.tsx
export default async function DashboardPage() {
  const projects = await invoke('get_projects') // Mock data from Rust
  const agents = await invoke('get_agents')     // Mock data
  const logs = await invoke('get_telemetry')    // Mock data

  return <DashboardLayout projects={projects} agents={agents} logs={logs} />
}
```

**Rust Commands:**
```rust
// src-tauri/src/commands.rs
#[tauri::command]
pub async fn get_projects() -> Result<Vec<Project>, String> {
    // Returns hardcoded mock data
    Ok(vec![
        Project {
            id: "quetrex".to_string(),
            name: "Quetrex".to_string(),
            status: "active".to_string(),
            // ... mock fields
        },
        // ... 2 more mock projects
    ])
}
```

### Limitations

**All Data is Mock:**
- Projects are hardcoded (not real filesystem scanning)
- Agent activity is fake (no real GitHub Actions polling)
- Costs are fictional (no real API tracking)
- Telemetry is simulated (no real log collection)

**Single Project Focus:**
- Designed for one project at a time
- No multi-project grid layout
- No per-project drill-down
- No project creation UI

**No Voice Integration:**
- Voice notifications not connected to dashboard
- No per-project muting
- No voice queue system

**No Git Visibility:**
- Can't see commits from dashboard
- Can't review PRs in-app
- No diff viewer

---

## Planned Redesign: Mission Control

**Status:** 💬 Approved Design (Not Yet Implemented)

**Design Doc:** [/docs/roadmap/dashboard-redesign.md](../roadmap/dashboard-redesign.md)

### Vision

Transform from minimalistic single-project view to **mission control center** for multiple AI-powered projects.

**Key Changes:**
1. Multi-project grid (4-6 projects visible at once)
2. True dark theme (professional dark cards, violet accents)
3. Per-project status and progress
4. In-app project creation (no terminal needed)
5. Voice queue system (prevents overlapping speech)
6. In-app PR review/approval
7. Real-time activity logs
8. Accurate cost tracking

### Visual Comparison

**Current (Phase 1):**
```
┌─────────────────────────────────────────┐
│  Quetrex Dashboard                       │
├─────────────────────────────────────────┤
│  Projects:                              │
│  - Quetrex (mock)                        │
│  - E-commerce (mock)                    │
│  - Blog (mock)                          │
│                                         │
│  Recent Activity:                       │
│  - Agent started (mock)                 │
│  - Spec created (mock)                  │
│                                         │
│  Costs: $0.00 (mock)                    │
└─────────────────────────────────────────┘
```

**Planned (Mission Control):**
```
┌─────────────────────────────────────────────────────────────┐
│  Quetrex                      [Projects] [Analytics] [Costs] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ ● Quetrex            │  │ ● E-commerce        │  [+ New] │
│  │                     │  │                     │          │
│  │ Voice queue (65%)   │  │ Checkout flow (45%) │          │
│  │ ████████░░░░        │  │ ██████░░░░░░        │          │
│  │                     │  │                     │          │
│  │ [View] [🔊] [•••]   │  │ [View] [🔇] [•••]   │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ ○ Blog              │  │ ○ Mobile App        │          │
│  │ Needs approval      │  │ Idle                │          │
│  │ [Approve Spec]      │  │ No tasks            │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Comparison Table

| Feature | Current (Phase 1) | Planned (Mission Control) |
|---------|------------------|---------------------------|
| **Project Display** | List (3 mock) | Grid (unlimited real) |
| **Status Indicators** | Text only | Color-coded dots (●○) |
| **Progress Tracking** | None | Progress bars with % |
| **Multi-Project** | No | Yes (4-6 visible) |
| **Project Creation** | Terminal only | In-app with templates |
| **Voice Integration** | None | Queue + per-project mute |
| **PR Review** | GitHub only | In-app review/merge |
| **Git Visibility** | None | Commits, diffs, branches |
| **Real-Time Logs** | Mock data | Live streaming |
| **Cost Tracking** | Mock ($0.00) | Real API tracking |
| **Analytics** | None | Charts, trends, insights |
| **Dark Theme** | Basic | True dark with accents |

---

## User Workflows

### Current Workflow (Phase 1)

**Creating a Project:**
1. User opens terminal
2. `mkdir my-project && cd my-project`
3. `git init`
4. `gh repo create`
5. Manually configure Quetrex
6. Start voice conversation

**Monitoring Progress:**
1. User looks at basic dashboard
2. Sees mock data (not helpful)
3. Opens GitHub to check real status
4. Opens terminal to see logs

**Reviewing PRs:**
1. User gets email from GitHub
2. Opens browser
3. Navigates to PR
4. Reviews diff
5. Clicks "Approve and merge"
6. Returns to Quetrex

**Total Context Switches:** 5+ (Quetrex → Terminal → GitHub → Browser → Quetrex)

### Planned Workflow (Mission Control)

**Creating a Project:**
1. User clicks [+ New Project] in Quetrex
2. Enters name, selects template (Next.js, Python, etc.)
3. Clicks [Create]
4. Project appears in dashboard, ready to use

**Monitoring Progress:**
1. User glances at dashboard
2. Sees all projects with real status indicators
3. Clicks [View] on active project
4. Sees real-time logs, progress breakdown, next steps
5. Stays in Quetrex

**Reviewing PRs:**
1. Quetrex voice: "PR ready for review in E-commerce"
2. User clicks [Review & Approve] in dashboard
3. Views diff inline
4. Clicks [Approve & Merge]
5. Stays in Quetrex

**Total Context Switches:** 0 (Everything in Quetrex)

---

## Design System

### Color Palette (Planned)

```typescript
// tailwind.config.ts
const colors = {
  background: '#0A0A0B',      // Near black
  surface: '#18181B',         // Dark charcoal
  border: '#27272A',          // Subtle gray
  accent: '#7C3AED',          // Violet
  success: '#10B981',         // Green
  warning: '#F59E0B',         // Amber
  error: '#EF4444',           // Red
  text: {
    primary: '#FAFAFA',       // Off-white
    secondary: '#A1A1AA',     // Gray
  }
}
```

### Typography (Planned)

```typescript
// Font family
const fonts = {
  heading: 'Inter, sans-serif',
  body: 'Inter, sans-serif',
  code: 'JetBrains Mono, monospace'
}

// Font weights
const weights = {
  heading: '600-700',
  body: '400-500',
  code: '400'
}
```

### Spacing (Planned)

```typescript
const spacing = {
  gridGap: '24px',
  cardPadding: '20px',
  sectionSpacing: '48px',
  cardSize: {
    minWidth: '300px',
    minHeight: '200px'
  }
}
```

---

## Component Architecture

### Current Architecture (Phase 1)

```
src/app/page.tsx (Dashboard)
  ├─ DashboardLayout
  │   ├─ ProjectList (mock data)
  │   ├─ ActivityFeed (mock data)
  │   └─ TelemetryPanel (mock data)
  └─ Tauri invoke() calls (return mocks)
```

### Planned Architecture (Mission Control)

```
src/app/page.tsx (Dashboard)
  ├─ DashboardLayout
  │   ├─ TabNavigation
  │   │   ├─ ProjectsTab (default)
  │   │   ├─ AnalyticsTab
  │   │   ├─ CostsTab
  │   │   └─ SettingsTab
  │   │
  │   ├─ ProjectsTab
  │   │   ├─ ProjectGrid
  │   │   │   ├─ ProjectCard (x4-6)
  │   │   │   │   ├─ StatusIndicator (●○)
  │   │   │   │   ├─ TaskDisplay
  │   │   │   │   ├─ ProgressBar
  │   │   │   │   └─ ActionButtons
  │   │   │   │       ├─ ViewButton
  │   │   │   │       ├─ MuteButton
  │   │   │   │       └─ OverflowMenu
  │   │   │   └─ NewProjectButton
  │   │   │
  │   │   └─ DrillDownPanel (slide-in)
  │   │       ├─ OverviewTab
  │   │       ├─ GitTab
  │   │       ├─ LogsTab
  │   │       └─ CostsTab
  │   │
  │   ├─ AnalyticsTab
  │   │   ├─ MetricsSummary
  │   │   ├─ TasksChart
  │   │   └─ SuccessRateChart
  │   │
  │   └─ CostsTab
  │       ├─ SpendingSummary
  │       ├─ DailyChart
  │       └─ Breakdown
  │
  ├─ NewProjectModal
  │   ├─ NameInput
  │   ├─ LocationPicker
  │   ├─ TemplateSelector
  │   └─ OptionsCheckboxes
  │
  └─ PRReviewModal
      ├─ ConversationTab
      ├─ FilesChangedTab
      │   ├─ FileTree
      │   └─ DiffViewer
      ├─ ChecksTab
      └─ ActionButtons
```

---

## Data Flow

### Current Data Flow (Phase 1)

```
Frontend (React)
    ↓ invoke('get_projects')
Rust Backend
    ↓ return hardcoded Vec<Project>
Frontend
    ↓ render mock data
Dashboard (shows fake projects)
```

### Planned Data Flow (Mission Control)

```
Frontend (React)
    ↓ invoke('get_projects')
Rust Backend
    ↓ scan filesystem for .quetrex/ dirs
    ↓ read config.yml files
    ↓ poll GitHub Actions API
    ↓ aggregate data
    ↓ return Vec<RealProject>
Frontend
    ↓ render real data
    ↓ WebSocket for live updates
Dashboard (shows actual projects, live)
```

**Real-Time Updates:**
```
GitHub Actions (agent running)
    ↓ log stream
WebSocket Server (Rust)
    ↓ broadcast
Frontend (React)
    ↓ update Logs tab
User sees live activity
```

---

## Implementation Phases

### Phase 1: Current State ✅
- Basic dashboard page
- Mock data display
- Tauri integration working
- Next.js routing

### Phase 2: Core Redesign (Weeks 1-2) 📋
- Multi-project card grid
- True dark theme
- Status indicators (●○)
- Progress bars
- Tab navigation

### Phase 3: Project Management (Week 3) 📋
- New Project button
- Template selection modal
- Auto-initialization (Git, GitHub)
- Real project scanning

### Phase 4: Voice Integration (Week 4) 📋
- Voice queue service
- Per-project mute buttons
- Priority system
- Silent notifications

### Phase 5: Drill-Down (Week 5) 📋
- Slide-in detail panel
- Overview tab (progress breakdown)
- Git tab (commits, PRs)
- Logs tab (live streaming)
- Costs tab (per-project)

### Phase 6: PR Review (Week 6) 📋
- PR review modal
- GitHub API integration
- Diff viewer
- Approve/merge in-app

### Phase 7: Analytics (Week 7-8) 📋
- Analytics tab (charts)
- Costs tab (tracking)
- Historical trends
- Budget alerts

---

## Testing Strategy

### Current Tests (Phase 1)

Minimal testing, mostly mock data validation:
```typescript
// tests/dashboard.test.ts
test('dashboard renders', async () => {
  const { container } = render(<DashboardPage />)
  expect(container).toBeDefined()
})
```

### Planned Tests (Mission Control)

**Unit Tests:**
```typescript
// tests/unit/voice-queue.test.ts
test('voice queue processes messages in order', () => {
  const queue = new VoiceQueueService()
  queue.enqueue({ project: 'A', message: 'First' })
  queue.enqueue({ project: 'B', message: 'Second' })

  expect(queue.dequeue().message).toBe('First')
  expect(queue.dequeue().message).toBe('Second')
})

// tests/unit/progress-calculator.test.ts
test('calculates progress from checkpoints', () => {
  const checkpoints = [
    { status: 'completed' },
    { status: 'completed' },
    { status: 'in_progress' },
    { status: 'pending' },
    { status: 'pending' }
  ]

  const progress = calculateProgress(checkpoints)
  expect(progress).toBe(40) // 2/5 = 40%
})
```

**Integration Tests:**
```typescript
// tests/integration/github-api.test.ts
test('fetches real PR data from GitHub', async () => {
  const pr = await githubApi.getPullRequest('quetrex', 42)

  expect(pr.number).toBe(42)
  expect(pr.title).toBeDefined()
  expect(pr.files).toBeInstanceOf(Array)
})
```

**E2E Tests:**
```typescript
// tests/e2e/dashboard.spec.ts
test('multi-project dashboard workflow', async ({ page }) => {
  await page.goto('/')

  // Should show project cards
  await expect(page.getByTestId('project-card-quetrex')).toBeVisible()
  await expect(page.getByTestId('project-card-ecommerce')).toBeVisible()

  // Click view on first project
  await page.click('[data-testid="project-card-quetrex"] [data-testid="view-button"]')

  // Detail panel should slide in
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Progress Breakdown:')).toBeVisible()

  // Switch to Git tab
  await page.click('[data-testid="tab-git"]')
  await expect(page.getByText('Recent Commits:')).toBeVisible()
})

test('create new project from template', async ({ page }) => {
  await page.goto('/')

  // Click new project button
  await page.click('[data-testid="new-project-button"]')

  // Fill in form
  await page.fill('[data-testid="project-name"]', 'Test Project')
  await page.click('[data-testid="template-nextjs"]')
  await page.click('[data-testid="create-project"]')

  // Should show new card
  await expect(page.getByText('Test Project')).toBeVisible()
})

test('review and merge PR in-app', async ({ page }) => {
  await page.goto('/')

  // Open project detail
  await page.click('[data-testid="project-card-quetrex"] [data-testid="view-button"]')

  // Go to Git tab
  await page.click('[data-testid="tab-git"]')

  // Click review on PR
  await page.click('[data-testid="pr-42-review"]')

  // PR modal should open
  await expect(page.getByText('Pull Request #42')).toBeVisible()

  // Approve and merge
  await page.click('[data-testid="approve-merge-button"]')

  // Should show success
  await expect(page.getByText('PR merged successfully')).toBeVisible()
})
```

**Visual Regression Tests:**
```typescript
// tests/visual/dashboard.spec.ts
test('dashboard matches design', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('dashboard.png')
})

test('dark theme colors correct', async ({ page }) => {
  await page.goto('/')

  const card = page.getByTestId('project-card-quetrex')
  const bg = await card.evaluate(el => getComputedStyle(el).backgroundColor)

  expect(bg).toBe('rgb(24, 24, 27)') // #18181B
})
```

---

## Performance Considerations

### Current Performance (Phase 1)

**Load Time:** < 100ms (all mock data, no API calls)

**Memory:** Minimal (no state management, simple render)

### Planned Performance (Mission Control)

**Optimization Strategies:**

1. **Lazy Loading**
   ```typescript
   // Only load project cards in viewport
   const ProjectCard = lazy(() => import('./ProjectCard'))
   ```

2. **Virtualization**
   ```typescript
   // For large project lists (50+ projects)
   import { VirtualScroller } from '@tanstack/react-virtual'
   ```

3. **Debounced Updates**
   ```typescript
   // Don't update progress bar on every log line
   const debouncedProgress = useDebouncedValue(progress, 1000)
   ```

4. **WebSocket Batching**
   ```typescript
   // Batch log updates every 500ms
   const logBuffer = []
   setInterval(() => {
     if (logBuffer.length > 0) {
       updateLogs(logBuffer)
       logBuffer.length = 0
     }
   }, 500)
   ```

5. **Memoization**
   ```typescript
   // Expensive calculations cached
   const progress = useMemo(
     () => calculateProgress(checkpoints),
     [checkpoints]
   )
   ```

**Target Metrics:**
- Initial load: < 500ms
- Time to interactive: < 1s
- Progress bar update: < 100ms
- Log scroll: 60fps
- Memory usage: < 200MB for 10 projects

---

## Accessibility

### Current Accessibility (Phase 1)

Basic semantic HTML, no ARIA labels, limited keyboard support.

### Planned Accessibility (Mission Control)

**Keyboard Navigation:**
- Tab through project cards
- Arrow keys for grid navigation
- Enter to open details
- Escape to close modals

**Screen Reader Support:**
```tsx
<div
  role="article"
  aria-label={`${project.name} project card`}
  aria-describedby={`${project.id}-status`}
>
  <span id={`${project.id}-status`}>
    {status === 'active' ? 'Active' : 'Idle'}, {progress}% complete
  </span>
</div>
```

**Focus Management:**
```typescript
// When modal opens, focus first interactive element
useEffect(() => {
  if (isOpen) {
    modalRef.current?.querySelector('button')?.focus()
  }
}, [isOpen])
```

**Color Contrast:**
- All text meets WCAG AA (4.5:1)
- Status uses color AND icon (● ○)
- Focus indicators clearly visible

---

## Related Documentation

- [/docs/roadmap/dashboard-redesign.md](../roadmap/dashboard-redesign.md) - Full redesign spec
- [/docs/roadmap/observability.md](../roadmap/observability.md) - Observability vision
- [/docs/features/project-creation.md](./project-creation.md) - New Project feature
- [/docs/features/pr-approval.md](./pr-approval.md) - In-app PR review
- [/docs/roadmap/unfinished-features.md](../roadmap/unfinished-features.md) - Implementation status

---

*Documented by Glen Barnhardt with help from Claude Code*
*Last Updated: 2025-11-13*
