# Observability Vision

**Status:** 💬 Approved Design (Not Yet Implemented)

**Last Updated:** 2025-11-13

**Owner:** Glen Barnhardt

---

## Problem Statement

Managing multiple AI-powered projects simultaneously creates visibility challenges:

1. **Which project is doing what?** - Hard to see all activity at a glance
2. **What's the current status?** - Is the agent working, waiting, or stuck?
3. **Where's my money going?** - Which projects are expensive, which are efficient?
4. **Should I pay attention?** - Does this project need my input or approval?
5. **What happened while I was away?** - No historical view of agent actions

Traditional project management tools aren't designed for AI agents that work autonomously. Sentra needs **mission control-style observability** that treats AI agents as first-class workers.

---

## Design Principles

### 1. Glanceable Intelligence
Users should understand system state in < 5 seconds without drilling down.

**Good Example:**
```
● Sentra - Implementing voice queue (65%)
○ E-commerce - Idle
● Blog - Waiting for spec approval
```

**Bad Example:**
```
Sentra: Status unknown, click for details
E-commerce: Status unknown, click for details
Blog: Status unknown, click for details
```

### 2. Progressive Disclosure
Show summary on main screen, details on demand. Never overwhelm.

**Hierarchy:**
1. **Dashboard** - Project cards with status/progress (5-second glance)
2. **Drill-down** - Detailed panel with tabs (30-second review)
3. **Full history** - Complete logs and analytics (deep investigation)

### 3. Actionable, Not Just Informational
Every piece of data should lead to a decision or action.

**Examples:**
- "Waiting for spec approval" → [Approve Spec] button
- "PR ready for review" → [Review & Merge] button
- "Budget 80% used" → [Increase Budget] or [Pause Projects]

### 4. Silent by Default, Vocal When Needed
Don't interrupt unless user input is required. Voice notifications only for:
- User approval needed (spec, PR)
- Errors blocking progress
- Task completion (if unmuted)

---

## Multi-Project Visibility

### Dashboard Grid Layout

Users can see **all projects at once** in a card grid:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ● Project A │  │ ● Project B │  │ ○ Project C │
│ Active work │  │ Active work │  │ Idle        │
│ ████░░ 60%  │  │ ██░░░░ 35%  │  │ ░░░░░░ 0%   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Information Density:**
- 4-6 projects visible without scrolling (1440p display)
- Each card: 300x200px minimum
- Grid auto-adjusts to screen size

**Responsive Behavior:**
- Desktop: 3-4 columns
- Laptop: 2-3 columns
- Tablet: 2 columns
- Mobile: 1 column

### Status Indicators

**Visual Status System:**
```
● Green  - Agent actively working
● Yellow - Waiting for user (approval, input)
○ Gray   - Idle, no active work
● Red    - Error, agent stuck
```

**Text Status (in card):**
- "Implementing feature X" (active)
- "Waiting for spec approval" (blocked on user)
- "No active tasks" (idle)
- "Error: Tests failing" (stuck)

---

## Per-Project Drill-Down

### Detail Panel Design

**Trigger:** Click "View" on project card

**Behavior:** Slide-in panel from right, 50% screen width, overlays dashboard

**Tabs:**
1. **Overview** - Current status and progress
2. **Git** - Commits, branches, PRs
3. **Logs** - Real-time agent activity
4. **Costs** - Spending for this project

### Overview Tab

```
┌─────────────────────────────────────────┐
│  Status: ● Running                      │
│  Current Task: Implement voice queue    │
│  Started: 14 minutes ago                │
│                                         │
│  Progress Breakdown:                    │
│  ✅ Create voice queue service          │
│  ✅ Add queue state management          │
│  🚧 Implement speech queueing logic     │
│  ⏳ Add per-project muting              │
│  ⏳ Test multi-project scenarios        │
│                                         │
│  Estimated Time Remaining: 12 minutes   │
│                                         │
│  Next Steps:                            │
│  - Complete queueing logic              │
│  - Write tests                          │
│  - Create PR for review                 │
│                                         │
│  [View Full Logs]                       │
└─────────────────────────────────────────┘
```

**Key Information:**
- Current checkpoint in progress
- Completed vs. remaining checkpoints
- Time estimate (based on historical data)
- What's happening next

### Git Tab

**Purpose:** See code changes without leaving Sentra

```
┌─────────────────────────────────────────┐
│  Current Branch: feature/voice-queue    │
│  Ahead of main: 3 commits               │
│                                         │
│  Recent Commits:                        │
│  ┌─────────────────────────────────────┐│
│  │ feat: add voice queue state         ││
│  │ 14 minutes ago                      ││
│  │ +42 -8 (3 files)    [View Diff]    ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ test: add queue tests               ││
│  │ 8 minutes ago                       ││
│  │ +24 -0 (1 file)     [View Diff]    ││
│  └─────────────────────────────────────┘│
│                                         │
│  Pull Requests:                         │
│  ┌─────────────────────────────────────┐│
│  │ #42 Implement voice queue           ││
│  │ Status: ● Open                      ││
│  │ Checks: ✅ All passing              ││
│  │                                     ││
│  │ [Review & Approve]                  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Features:**
- See commits made by agent
- View diffs inline
- Check PR status
- Approve/merge without GitHub

**Diff Viewer:**
```
┌─────────────────────────────────────────┐
│  src/services/voice-queue.ts            │
│  +42 -8 lines                           │
├─────────────────────────────────────────┤
│ 12  export class VoiceQueueService {    │
│ 13 +  private queue: VoiceMessage[] = []│
│ 14 +  private processing = false        │
│ 15 +                                    │
│ 16 +  enqueue(msg: VoiceMessage) {      │
│ 17 +    this.queue.push(msg)            │
│ 18 +    this.processQueue()             │
│ 19 +  }                                 │
└─────────────────────────────────────────┘
```

### Logs Tab

**Purpose:** Real-time visibility into agent actions

```
┌─────────────────────────────────────────┐
│  [Clear] [Export] [Auto-scroll: ON]     │
├─────────────────────────────────────────┤
│  [14:32:15] Starting task: Voice queue  │
│  [14:32:18] ✅ Created VoiceQueueSvc    │
│  [14:32:45] ✅ Added state to store     │
│  [14:33:02] 🔄 Writing queue logic...   │
│  [14:33:15]    - Added enqueue()        │
│  [14:33:18]    - Added dequeue()        │
│  [14:33:22]    - Added processQueue()   │
│  [14:33:28] Running tests...            │
│  [14:33:30]    ✓ enqueue adds message   │
│  [14:33:31]    ✓ dequeue removes first  │
│  [14:33:33]    ✓ queue processes order  │
│  [14:33:35] ✅ 24 tests passed          │
│  [14:33:40] Creating commit...          │
│  [14:33:42] ✅ Committed changes        │
│  [14:33:45] 🔄 Pushing to GitHub...     │
│  ●                                      │ ← Live indicator
└─────────────────────────────────────────┘
```

**Features:**
- **Real-time streaming** - Updates as agent works
- **Auto-scroll** - Follows latest activity
- **Syntax highlighting** - Code snippets colorized
- **Log levels** - Info (✓), Warning (⚠), Error (✗)
- **Timestamps** - Precise timing for each action
- **Export** - Save logs for debugging

**Implementation:**
- WebSocket connection to GitHub Actions
- Or: Poll GitHub Actions API every 5 seconds
- Buffer last 500 lines in memory
- Full logs stored in `.sentra/logs/`

### Costs Tab

**Purpose:** Track spending per project, identify expensive operations

```
┌─────────────────────────────────────────┐
│  This Project (Last 30 Days)            │
│                                         │
│  Total: $7.80                           │
│                                         │
│  Breakdown:                             │
│  ┌─────────────────────────────────────┐│
│  │ OpenAI API        $4.20  (54%)      ││
│  │ - GPT-4 calls:    $3.80             ││
│  │ - TTS:            $0.40             ││
│  │                                     ││
│  │ Anthropic API     $3.60  (46%)      ││
│  │ - Claude Sonnet:  $3.60             ││
│  │                                     ││
│  │ GitHub Actions    $0.00  (0%)       ││
│  │ - Free tier                         ││
│  └─────────────────────────────────────┘│
│                                         │
│  Daily Spending Trend:                  │
│  [Chart: Line graph showing daily $]   │
│                                         │
│  Most Expensive Operations:             │
│  1. Spec generation: $2.40 (3 runs)    │
│  2. Code review: $1.80 (6 runs)         │
│  3. Bug fixes: $1.20 (4 runs)           │
│                                         │
│  [View Detailed History]                │
└─────────────────────────────────────────┘
```

**Metrics Tracked:**
- API calls (count, tokens, cost)
- GitHub Actions minutes
- Total per operation type
- Daily/weekly/monthly trends

**Cost Calculation:**
```typescript
interface CostBreakdown {
  openai: {
    gpt4: { calls: number; tokens: number; cost: number }
    tts: { characters: number; cost: number }
  }
  anthropic: {
    sonnet: { calls: number; tokens: number; cost: number }
  }
  github: {
    minutes: number
    cost: number
  }
  total: number
}
```

**Rate Card (Updated Automatically):**
```typescript
const PRICING = {
  openai: {
    gpt4: { input: 0.03, output: 0.06 }, // per 1K tokens
    tts: 0.015 // per 1M characters
  },
  anthropic: {
    sonnet: { input: 0.003, output: 0.015 } // per 1K tokens
  },
  github: {
    actions: 0.008 // per minute (Linux)
  }
}
```

---

## Real-Time Activity Feed

**Location:** Optional sidebar or bottom panel

**Purpose:** See what ALL projects are doing without switching views

```
┌─────────────────────────────────────────┐
│  Recent Activity (All Projects)         │
├─────────────────────────────────────────┤
│  [14:35:42] Sentra                      │
│  ✅ Voice queue tests passing           │
│                                         │
│  [14:34:18] E-commerce                  │
│  🔄 Implementing checkout validation    │
│                                         │
│  [14:32:05] Blog                        │
│  ⏸ Waiting for spec approval            │
│                                         │
│  [14:28:33] Mobile App                  │
│  ✅ PR #12 merged to main               │
│                                         │
│  [14:25:10] Sentra                      │
│  ✅ Committed: feat: add queue state    │
└─────────────────────────────────────────┘
```

**Features:**
- Unified timeline across all projects
- Color-coded by project
- Click to jump to project detail
- Filter by project or event type
- Pause auto-scroll for reading

---

## Voice Filtering and Muting

### Per-Project Mute

**Problem:** Multiple projects completing tasks simultaneously → cacophony of voice notifications

**Solution:** Per-project mute button on each card

```
┌─────────────────────┐
│ ● Sentra            │
│   [🔊] [View] [•••] │  ← Unmuted (will speak)
└─────────────────────┘

┌─────────────────────┐
│ ○ E-commerce        │
│   [🔇] [View] [•••] │  ← Muted (silent)
└─────────────────────┘
```

**Behavior:**
- **Unmuted** (🔊): Project can add voice notifications to queue
- **Muted** (🔇): Project shows visual notifications only (toast, badge)

**Voice Queue Processing:**
```
1. Agent completes task
2. Check if project is muted
3. If unmuted: Add to voice queue
4. If muted: Show silent toast notification
5. Voice queue processes one at a time
6. Wait 1000ms between messages (echo prevention)
```

### Global Voice Controls

**Location:** Top-right of dashboard

```
[🔊 Voice: ON] [Settings]
```

**Options:**
- **Voice ON/OFF** - Master mute all projects
- **Voice Speed** - 0.8x to 2.0x
- **Voice Selection** - Choose TTS voice
- **Priority Only** - Only speak high-priority notifications

### Notification Priorities

```typescript
type NotificationPriority = 'low' | 'normal' | 'high'

const PRIORITY_RULES = {
  low: {
    events: ['checkpoint_complete', 'test_passed'],
    voice: false, // Never speak, only visual
  },
  normal: {
    events: ['task_complete', 'pr_created'],
    voice: true, // Speak if unmuted
  },
  high: {
    events: ['approval_needed', 'error', 'stuck'],
    voice: true, // Always speak, even if muted
    requireAck: true // User must acknowledge
  }
}
```

**High Priority Overrides Mute:**
- "Spec approval needed for Blog project"
- "Error in E-commerce: Tests failing"
- "Sentra agent stuck, needs your help"

---

## Historical Analytics

### Analytics Tab

**Purpose:** Long-term trends and insights

```
┌─────────────────────────────────────────┐
│  Analytics (All Projects, Last 30 Days) │
├─────────────────────────────────────────┤
│                                         │
│  Tasks Completed: 142                   │
│  Success Rate: 94%                      │
│  Avg Time to PR: 18 minutes             │
│  Total Cost: $47.32                     │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  Tasks Completed Over Time          ││
│  │  [Line chart: 30 days]              ││
│  │                                     ││
│  │   ^                                 ││
│  │ 8 │     ●                           ││
│  │ 6 │   ● ● ●   ●                     ││
│  │ 4 │ ● ● ● ● ● ● ●                   ││
│  │ 2 │ ● ● ● ● ● ● ● ●                 ││
│  │ 0 └─────────────────→               ││
│  │   1  5  10 15 20 25 30 (days)      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  Success Rate Trend                 ││
│  │  [Line chart: Shows 94% → 96% → 94%││
│  └─────────────────────────────────────┘│
│                                         │
│  Top Projects by Activity:              │
│  1. Sentra - 48 tasks                   │
│  2. E-commerce - 42 tasks               │
│  3. Blog - 28 tasks                     │
│                                         │
│  Most Common Operations:                │
│  1. Bug fixes - 52 (37%)                │
│  2. New features - 48 (34%)             │
│  3. Code review - 42 (29%)              │
│                                         │
└─────────────────────────────────────────┘
```

### Costs Dashboard

**Location:** Separate "Costs" tab (hidden by default to avoid anxiety)

```
┌─────────────────────────────────────────┐
│  Costs Overview (Last 30 Days)          │
├─────────────────────────────────────────┤
│                                         │
│  Total Spent: $47.32                    │
│  Budget: $100.00 (47% used)             │
│  Projected End-of-Month: $78.50         │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  Daily Spending                     ││
│  │  [Bar chart: Last 30 days]          ││
│  │                                     ││
│  │   ^                                 ││
│  │ $5│           ▂                     ││
│  │   │       ▃ ▆ █ ▂                   ││
│  │   │   ▁ ▅ █ █ █ █ ▃                 ││
│  │ $0└─────────────────→               ││
│  │   1  5  10 15 20 25 30 (days)      ││
│  └─────────────────────────────────────┘│
│                                         │
│  Breakdown by Service:                  │
│  ┌─────────────────────────────────────┐│
│  │ OpenAI API        $28.50  (60%)     ││
│  │ Anthropic API     $18.82  (40%)     ││
│  │ GitHub Actions    $0.00   (0%)      ││
│  └─────────────────────────────────────┘│
│                                         │
│  Breakdown by Project:                  │
│  1. Sentra - $14.20 (30%)               │
│  2. E-commerce - $18.40 (39%)           │
│  3. Blog - $10.80 (23%)                 │
│  4. Mobile App - $3.92 (8%)             │
│                                         │
│  [Set Budget Alert]  [Export Report]    │
└─────────────────────────────────────────┘
```

**Budget Alerts:**
- Warning at 75% of budget
- Alert at 90% of budget
- Block new tasks at 100% (optional)

**Cost Optimization Insights:**
```
💡 Tip: E-commerce project uses 39% of budget
   Consider reviewing spec clarity to reduce iterations.

💡 Tip: You're averaging $1.58 per task
   Industry average is $2.40 - you're efficient!
```

---

## Error and Stuck State Handling

### Error Detection

**Agent reports errors via structured logs:**
```json
{
  "type": "error",
  "severity": "high",
  "message": "Tests failing after implementation",
  "details": "3 tests in checkout.test.ts failing",
  "project": "e-commerce",
  "task": "Implement checkout validation",
  "timestamp": "2025-11-13T14:45:00Z",
  "requiresUserAction": true
}
```

### Error Display

**In Project Card:**
```
┌─────────────────────┐
│ ● E-commerce        │
│                     │
│ ⚠ Error: Tests      │
│ failing             │
│                     │
│ ░░░░░░░░ 0% (stuck) │
│                     │
│ [View Error] [Help] │
└─────────────────────┘
```

**Status Indicator Changes:**
- Green (●) → Red (●)
- Progress halted
- "Help" button appears

**Error Detail Panel:**
```
┌─────────────────────────────────────────┐
│  ⚠ Agent Stuck - Needs Your Help        │
├─────────────────────────────────────────┤
│  Task: Implement checkout validation    │
│  Error: Tests failing                   │
│                                         │
│  Details:                               │
│  3 tests in checkout.test.ts failing:   │
│  - "validates credit card format"       │
│  - "rejects invalid CVV"                │
│  - "handles expired cards"              │
│                                         │
│  Agent tried:                           │
│  1. Fixed validation logic (failed)     │
│  2. Updated test assertions (failed)    │
│  3. Checked for edge cases (failed)     │
│                                         │
│  Suggested Actions:                     │
│  [View Failing Tests]                   │
│  [Review Implementation]                │
│  [Ask Agent to Try Different Approach]  │
│  [Fix Manually and Resume]              │
└─────────────────────────────────────────┘
```

### Stuck Detection

**Agent is "stuck" if:**
- No progress for 15 minutes
- Same error repeated 3+ times
- Explicitly reports "need help"

**Automatic Actions:**
- Voice notification (high priority, overrides mute)
- Email notification (if configured)
- Slack/Discord notification (if integrated)

---

## Mobile Companion (Future)

**Phase 3 Enhancement**

### Mobile Dashboard

Simplified version for iOS/Android:
```
┌─────────────────────┐
│  Sentra Projects    │
├─────────────────────┤
│                     │
│  ● Sentra           │
│  Voice queue (65%)  │
│                     │
│  ○ E-commerce       │
│  Idle               │
│                     │
│  ● Blog             │
│  Needs approval     │
│  [Approve Spec]     │
│                     │
└─────────────────────┘
```

### Push Notifications

```
📱 Sentra: Spec approval needed
   Blog project ready for review

📱 Sentra: PR ready for merge
   E-commerce checkout flow complete

📱 Sentra: Error in Mobile App
   Tests failing, needs your help
```

### Quick Actions

- Approve specs from phone
- Merge PRs on the go
- Mute/unmute projects
- View activity feed

---

## Implementation Roadmap

### Phase 1: Core Observability (Weeks 1-2)
- ✅ Multi-project card grid
- ✅ Status indicators (green/yellow/gray)
- ✅ Progress bars with percentage
- ✅ Basic drill-down panel

### Phase 2: Git Visibility (Week 3)
- ✅ Git tab in drill-down
- ✅ Recent commits display
- ✅ PR status checking
- ✅ Inline diff viewer

### Phase 3: Real-Time Logs (Week 4)
- ✅ Log streaming from GitHub Actions
- ✅ Syntax highlighting
- ✅ Auto-scroll and filtering
- ✅ Export functionality

### Phase 4: Voice Controls (Week 5)
- ✅ Per-project mute buttons
- ✅ Voice queue system
- ✅ Priority-based notifications
- ✅ Global voice settings

### Phase 5: Costs Tracking (Week 6)
- ✅ API usage monitoring
- ✅ Per-project cost breakdown
- ✅ Budget alerts
- ✅ Optimization insights

### Phase 6: Analytics (Week 7)
- ✅ Historical trends
- ✅ Success rate tracking
- ✅ Time-to-completion metrics
- ✅ Activity charts

### Phase 7: Error Handling (Week 8)
- ✅ Stuck state detection
- ✅ Error detail panels
- ✅ Suggested recovery actions
- ✅ Manual intervention tools

---

## Success Metrics

**We'll know observability is successful when:**

1. **Time to understand system state < 5 seconds**
   - User glances at dashboard
   - Immediately knows: What's active? What needs attention?

2. **Zero missed approvals**
   - User never misses spec or PR approval
   - Notifications always reach user

3. **Cost surprises eliminated**
   - User always knows spending before end of month
   - Budget alerts prevent overages

4. **Reduced context switching**
   - User stays in Sentra for 90%+ of workflow
   - Rarely opens GitHub or terminal

5. **Faster debugging**
   - When agent gets stuck, user can diagnose in < 2 minutes
   - Logs and error details are immediately accessible

---

## Related Documentation

- [/docs/roadmap/dashboard-redesign.md](./dashboard-redesign.md) - Full dashboard spec
- [/docs/features/voice-interface.md](../features/voice-interface.md) - Voice system
- [/docs/roadmap/unfinished-features.md](./unfinished-features.md) - Implementation status

---

*Designed by Glen Barnhardt with help from Claude Code*
*Last Updated: 2025-11-13*
