# Dashboard Architecture

## Overview

The Sentra Dashboard is the command center for managing autonomous AI development across multiple projects. It provides real-time visibility into agent activity, comprehensive task management, AI-powered project analysis, visual design comparison, and seamless multi-project workflows.

**Key Principle:** ONE prompt, ONE agent, ONE task at a time—with complete visibility into the entire system.

## Core Philosophy

**For the Tactical AI Engineer:**
- Manage many projects simultaneously
- See everything at a glance
- Quick context switching
- Immediate failure visibility
- Minimal clicks to common actions
- Beautiful, dark, fast

## Visual Design Specification

### Theme System

**Primary Theme:**
- **Mode:** Dark (default)
- **Primary Color:** Violet (#8B5CF6, violet-500)
- **Background:** Slate-950
- **Text:** Slate-50

**Full ShadCN Theme Support:**
- Zinc, Slate, Stone, Gray, Neutral, Red, Rose, Orange, Green, Blue, Yellow, Violet
- **Seamless theme switching** - no color leaks
- All components use CSS variables
- Theme applied to every UI element

**Implementation:**

```tsx
// tailwind.config.ts
const config: Config = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... all ShadCN theme variables
      },
    },
  },
};

// CSS variables (app/globals.css)
:root {
  --background: 222.2 84% 4.9%; /* slate-950 */
  --foreground: 210 40% 98%; /* slate-50 */
  --primary: 262.1 83.3% 57.8%; /* violet-500 */
  --primary-foreground: 210 40% 98%;
  // ... all theme variables
}

// Theme switcher updates all variables
[data-theme='orange'] {
  --primary: 24.6 95% 53.1%; /* orange-500 */
  --primary-foreground: 0 0% 100%;
}
```

**Visual Design Elements:**
- Framer Motion for smooth transitions
- Glassmorphism effects (subtle blur backgrounds)
- Gradient accents on cards
- Micro-interactions (hover, focus states)
- Loading skeletons
- Toast notifications (Sonner)

## Page Structure

### 1. Dashboard Home

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Sentra Logo] [Project Switcher ▼] [Cmd+K] [Avatar]        │
├──────┬──────────────────────────────────────────────────────┤
│      │ Project Overview                                     │
│ Nav  │ ┌──────────┬──────────┬──────────┬──────────┐       │
│      │ │ Active   │Completed │ Failed   │ Agent    │       │
│      │ │ Tasks: 8 │Tasks: 45 │ Tasks: 2 │Utilization│       │
│      │ │   [24]   │  [135]   │   [!]    │   [65%]  │       │
│      │ └──────────┴──────────┴──────────┴──────────┘       │
│      │                                                      │
│      │ Your Projects                                        │
│      │ ┌─────────┐┌─────────┐┌─────────┐┌─────────┐       │
│      │ │Project A││Project B││Project C││Project D│       │
│      │ │Next.js  ││React    ││Vue      ││Express  │       │
│      │ │  8 tasks││ 3 tasks ││ 5 tasks ││ 12 tasks│       │
│      │ │  [View] ││  [View] ││  [View] ││  [View] │       │
│      │ └─────────┘└─────────┘└─────────┘└─────────┘       │
│      │                                                      │
│      │ Recent Activity                                      │
│      │ • Task "Add auth" completed (2m ago)                │
│      │ • Task "Fix bug" failed (5m ago)                    │
│      │ • Workflow "plan_code_test" started (8m ago)        │
└──────┴──────────────────────────────────────────────────────┘
```

**Features:**
- Project cards with stack badges
- Quick stats overview
- Recent activity feed
- Quick action buttons (+ New Task, + New Project)

### 2. Project View (Main Workspace)

**Kanban Board Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Project A (Next.js 15 + TypeScript)    [+ Task]   │
├─────────────────────────────────────────────────────────────┤
│ [Filters: All | Planning | Coding | Testing | Review]      │
├────┬────┬────┬────┬────┬────┐                              │
│Back│Plan│Code│Test│Rev │Done│                              │
│log │ning│ing │ing │iew │    │                              │
├────┼────┼────┼────┼────┼────┤                              │
│[T1]│[T2]│[T3]│[T4]│    │[T5]│                              │
│    │    │[T6]│    │    │[T6]│                              │
│    │    │    │    │    │    │                              │
└────┴────┴────┴────┴────┴────┘                              │
```

**Task Card:**
```
┌────────────────────────┐
│ Add user authentication│ ← Title
│ #T001 • Feature       │ ← ID, Type
│                        │
│ [Plan] [Code] [Test]  │ ← Phase indicators
│ 🟢 Planning (35%)     │ ← Current phase, progress
│                        │
│ Started: 5m ago        │
│ Agent: planner         │
└────────────────────────┘
```

**Failed Task Card (highlighted):**
```
┌────────────────────────┐
│ ⚠️ Fix login bug       │
│ #T002 • Bug           │
│                        │
│ ❌ FAILED in TEST     │
│ Error: Test suite...   │
│                        │
│ [View Logs] [Retry]   │
└────────────────────────┘
```

**Interactions:**
- Drag & drop between columns
- Click card → Task detail drawer
- Right-click → Context menu (retry, delete, duplicate)
- Keyboard shortcuts (j/k to navigate, Enter to open)

### 3. Task Detail View

**Drawer/Modal Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Add user authentication                            [×]      │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Logs] [Files] [Visual Diff] [Activity]         │
├─────────────────────────────────────────────────────────────┤
│ Status: 🟢 CODE phase (45% complete)                        │
│ Branch: feature/add-auth-abc123                            │
│ Worktree: .sentra/worktrees/task-abc123                    │
│                                                             │
│ Phase Progress:                                             │
│ ✅ PLAN  → ▶️ CODE → ⏸ TEST → ⏸ REVIEW                     │
│                                                             │
│ Description:                                                │
│ Implement JWT-based authentication with refresh tokens...  │
│                                                             │
│ [View Plan] [View Code Changes] [View Tests]               │
│                                                             │
│ Actions:                                                    │
│ [Retry Phase] [Skip to Review] [Cancel Task]               │
└─────────────────────────────────────────────────────────────┘
```

**Logs Tab:**
```
[Filter: All phases ▼] [Level: All ▼] [Search...]

10:35:24 [PLAN] INFO  Starting planning workflow
10:35:25 [PLAN] INFO  Task fetched from database
10:35:26 [PLAN] INFO  Classifying task type...
10:35:30 [PLAN] INFO  ✅ Classified as: feature
10:35:31 [PLAN] INFO  Creating branch: feature/add-auth-abc123
10:35:32 [CODE] INFO  Starting coding workflow
10:35:33 [CODE] INFO  Loading plan file...
10:35:35 [CODE] WARN  Dependency not found, installing...
10:35:40 [CODE] ERROR ❌ Type check failed (3 errors)

[Export Logs] [Auto-scroll: ON]
```

**Files Tab:**
```
Files Changed (8):

Modified:
  ✏️ app/api/auth/login/route.ts
  ✏️ lib/auth.ts
  ✏️ db/schema/users.ts

Created:
  ✨ app/api/auth/refresh/route.ts
  ✨ app/api/auth/logout/route.ts
  ✨ __tests__/auth.test.ts

[View Diff] button for each file
```

**Visual Diff Tab:**
```
Reference Design          vs        Implementation
┌─────────────┐                    ┌─────────────┐
│             │                    │             │
│  [Design]   │  ← AI Comparison → │ [Screenshot]│
│             │     87% match      │             │
└─────────────┘                    └─────────────┘

Issues Found:
  ❌ Button color mismatch (expected: violet, got: blue)
  ⚠️ Padding difference (expected: 24px, got: 16px)

[Accept] [Retry with Corrections]
```

## AI Analyst for Large Projects

### Project Decomposition Wizard

**Use Case:** User wants to build a state-of-the-art CRM system.

**Wizard Flow:**

**Step 1: Project Overview**
```
┌─────────────────────────────────────────────────────────────┐
│ AI Project Analyst                                          │
├─────────────────────────────────────────────────────────────┤
│ Let's break down your large project into manageable pieces. │
│                                                             │
│ Project Name: [Enterprise CRM System_______________]       │
│                                                             │
│ Description:                                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ A comprehensive CRM for managing contacts, deals,   │   │
│ │ pipelines, reporting, and team collaboration.       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Target Stack: [Next.js 15 + TypeScript ▼]                  │
│                                                             │
│ [Analyze Project] →                                         │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: AI Analysis**
```
🤖 Analyzing your project...

✅ Identified 8 major modules
✅ Discovered 47 features
✅ Generated 234 tasks
✅ Estimated dependencies
✅ Calculated timeline: 4-6 weeks

[View Breakdown] →
```

**Step 3: Module Breakdown**
```
┌─────────────────────────────────────────────────────────────┐
│ CRM System - Module Breakdown                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Authentication & Authorization (12 tasks, 3 days)        │
│    • User registration                                      │
│    • Login/logout                                           │
│    • Role-based access control                              │
│    • Password reset                                         │
│    └─ Dependencies: Database schema                         │
│                                                             │
│ 2. Contact Management (18 tasks, 5 days)                    │
│    • Create/edit contacts                                   │
│    • Contact search & filters                               │
│    • Contact segmentation                                   │
│    • Import/export contacts                                 │
│    └─ Dependencies: Auth, Database                          │
│                                                             │
│ 3. Deal Pipeline (25 tasks, 6 days)                         │
│    • Deal stages                                            │
│    • Drag-drop kanban                                       │
│    • Deal value tracking                                    │
│    • Win/loss analysis                                      │
│    └─ Dependencies: Contacts, Auth                          │
│                                                             │
│ [... 5 more modules ...]                                    │
│                                                             │
│ [Generate Tasks] [Customize] [Export Plan]                 │
└─────────────────────────────────────────────────────────────┘
```

**Step 4: Dependency Graph**
```
         [Auth]
           │
     ┌─────┴─────┐
     │           │
[Contacts]   [Database]
     │           │
     └─────┬─────┘
           │
       [Deals]
           │
     ┌─────┴─────┐
     │           │
[Pipeline]  [Reporting]
```

**Step 5: Task Generation**
```
Generated 234 tasks organized by:
  ✓ Module
  ✓ Dependencies
  ✓ Priority
  ✓ Estimated complexity

Starting strategy:
  Week 1: Auth + Database (foundation)
  Week 2: Contacts (core entity)
  Week 3: Deals + Pipeline (primary feature)
  Week 4: Reporting + Analytics
  Week 5: Team features + Collaboration
  Week 6: Testing + Polish

[Create All Tasks] [Review Tasks] [Adjust]
```

**Result:**
- 234 tasks created in Backlog
- Organized by module
- Dependency relationships set
- Priority assigned
- ONE prompt, ONE agent approach for each task

### AI Module Breakdown Algorithm

```typescript
async function analyzeProject(description: string): Promise<ProjectBreakdown> {
  // 1. Use Claude to analyze project description
  const analysis = await query({
    prompt: `
Analyze this project and break it down into modules, features, and tasks:

Project: ${description}

Return JSON:
{
  "modules": [
    {
      "name": "Authentication",
      "description": "...",
      "features": [
        {
          "name": "User Registration",
          "tasks": [
            { "title": "Create registration form", "type": "feature", "priority": "high" },
            { "title": "Add email validation", "type": "feature", "priority": "high" },
            // ...
          ]
        }
      ],
      "dependencies": ["Database"],
      "estimatedDays": 3
    }
  ],
  "totalTasks": 234,
  "estimatedWeeks": 6
}
`,
    options: { model: 'opus' }, // Use most capable model
  });

  // 2. Parse response
  const breakdown = JSON.parse(analysis);

  // 3. Create tasks in database
  for (const module of breakdown.modules) {
    for (const feature of module.features) {
      for (const task of feature.tasks) {
        await createTask({
          projectId,
          title: task.title,
          type: task.type,
          priority: task.priority,
          module: module.name,
          feature: feature.name,
        });
      }
    }
  }

  return breakdown;
}
```

## Legacy System Migration Planner

### Use Case: Rewrite a legacy PHP application in Next.js

**Wizard Flow:**

**Step 1: Legacy System Analysis**
```
┌─────────────────────────────────────────────────────────────┐
│ Legacy Migration Planner                                    │
├─────────────────────────────────────────────────────────────┤
│ Let's analyze your legacy system and plan a migration.      │
│                                                             │
│ Legacy System:                                              │
│ Path: [/path/to/legacy/app_________________]               │
│ Language: [PHP ▼]                                           │
│ Framework: [Laravel ▼]                                      │
│                                                             │
│ Target System:                                              │
│ Language: [TypeScript ▼]                                    │
│ Framework: [Next.js 15 ▼]                                   │
│ Database: [PostgreSQL ▼] (was: MySQL)                      │
│                                                             │
│ [Analyze Legacy System] →                                   │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Code Analysis**
```
🤖 Analyzing legacy system...

✅ Scanned 347 files
✅ Found 45 database tables
✅ Identified 89 API endpoints
✅ Discovered 23 background jobs
✅ Mapped 156 UI pages

Analysis complete!
```

**Step 3: Component Mapping**
```
┌─────────────────────────────────────────────────────────────┐
│ Legacy → New System Mapping                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Database Schema:                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Legacy (MySQL)          →    New (PostgreSQL)        │  │
│ │ users                   →    users                   │  │
│ │   - user_id (INT)       →      - id (UUID)           │  │
│ │   - user_email (VARCHAR)→      - email (TEXT)        │  │
│ │   - created (TIMESTAMP) →      - createdAt (TIMESTAMP)│  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ API Endpoints:                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Legacy (PHP)            →    New (Next.js)           │  │
│ │ POST /api/login.php     →    POST /api/auth/login   │  │
│ │ GET  /api/users.php     →    GET  /api/users        │  │
│ │ POST /api/create_user   →    POST /api/users        │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ [View Full Mapping] [Export] [Edit Mappings]               │
└─────────────────────────────────────────────────────────────┘
```

**Step 4: Migration Strategy**
```
Recommended Strategy: Component-by-Component

Phase 1: Foundation (2 weeks)
  ✓ Database schema migration
  ✓ Authentication system
  ✓ Core utilities

Phase 2: API Layer (3 weeks)
  ✓ User endpoints (8 tasks)
  ✓ Product endpoints (12 tasks)
  ✓ Order endpoints (15 tasks)

Phase 3: UI Pages (4 weeks)
  ✓ Dashboard (5 tasks)
  ✓ User management (8 tasks)
  ✓ Product catalog (10 tasks)
  ✓ Orders (12 tasks)

Phase 4: Background Jobs (1 week)
  ✓ Email notifications (3 tasks)
  ✓ Report generation (4 tasks)

Phase 5: Testing & Deployment (2 weeks)
  ✓ Integration tests
  ✓ Data migration scripts
  ✓ Rollback plan

Total: 156 tasks across 12 weeks
```

**Step 5: Field Name Mapping**
```
AI will ensure field names are consistent:

Legacy:         New:
user_id     →   id
user_email  →   email
created     →   createdAt
modified    →   updatedAt

All generated code will use NEW field names.
Agents will reference this mapping automatically.
```

**Step 6: Task Generation**
```
Generate Migration Tasks?

This will create:
  • 45 database migration tasks
  • 89 API rewrite tasks
  • 23 background job tasks
  • 156 UI rewrite tasks

Each task will:
  ✓ Reference the mapping
  ✓ Include rollback plan
  ✓ Have tests
  ✓ Be small and focused (ONE component at a time)

[Generate Tasks] [Cancel]
```

### Migration Task Example

```
Task: Migrate Users API Endpoint

Description:
Rewrite legacy PHP endpoint /api/users.php to Next.js.

Legacy Endpoint:
  File: /api/users.php
  Method: GET
  Returns: List of users

New Endpoint:
  File: app/api/users/route.ts
  Method: GET
  Returns: JSON array of users

Field Mapping:
  user_id → id
  user_email → email
  created → createdAt

Agent Instructions:
  1. Read legacy endpoint logic
  2. Create new Next.js API route
  3. Apply field name mapping
  4. Add TypeScript types
  5. Write tests
  6. Ensure 100% functional equivalence

Rollback Plan:
  Keep legacy endpoint active
  Run both in parallel
  Compare outputs for consistency
  Switch over when validated
```

## Visual Design Comparison System

### Workflow

1. **User uploads reference design** (mockup, wireframe, screenshot)
2. **Agent implements feature**
3. **Playwright captures screenshot** of implementation
4. **AI compares** reference vs implementation
5. **Dashboard shows diff**
6. **User accepts or requests corrections**

### Design Upload

```
┌─────────────────────────────────────────────────────────────┐
│ Task: Create User Profile Page                             │
├─────────────────────────────────────────────────────────────┤
│ [Design Reference]                                          │
│                                                             │
│ [Drop files here or click to upload]                       │
│                                                             │
│ Uploaded:                                                   │
│ ✓ profile-mockup.png (Figma export)                        │
│ ✓ mobile-view.png                                          │
│                                                             │
│ [Add URL] for website inspiration                          │
│ URL: https://example.com/profile                           │
│ [Capture Screenshot]                                        │
│                                                             │
│ AI will use these as reference during implementation.      │
└─────────────────────────────────────────────────────────────┘
```

### Visual Comparison View

```
┌─────────────────────────────────────────────────────────────┐
│ Visual Comparison - User Profile Page                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Reference Design          Implementation                    │
│ ┌─────────────────┐      ┌─────────────────┐             │
│ │                 │      │                 │             │
│ │   [Mockup]      │  VS  │  [Screenshot]   │             │
│ │                 │      │                 │             │
│ │                 │      │                 │             │
│ └─────────────────┘      └─────────────────┘             │
│                                                             │
│ AI Analysis: 87% Match                                      │
│                                                             │
│ Issues Found:                                               │
│ ❌ Header height: Expected 80px, got 64px                   │
│ ❌ Avatar size: Expected 120px, got 96px                    │
│ ⚠️ Button color: Expected violet-500, got violet-600       │
│ ⚠️ Spacing: Profile section missing 24px bottom margin     │
│                                                             │
│ [Pixel Diff] [Side by Side] [Overlay]                      │
│                                                             │
│ Actions:                                                    │
│ [Accept Implementation] [Retry with Corrections]           │
└─────────────────────────────────────────────────────────────┘
```

### Pixel Diff View

```
┌─────────────────────────────────────────────────────────────┐
│ Difference Overlay                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      [Image with red highlights showing differences]        │
│                                                             │
│ Legend:                                                     │
│ 🔴 Red areas: Significant differences                       │
│ 🟡 Yellow: Minor differences                                │
│ 🟢 Green: Perfect match                                     │
│                                                             │
│ Overall Similarity: 87%                                     │
└─────────────────────────────────────────────────────────────┘
```

### AI Comparison Implementation

```typescript
async function compareDesigns(
  referenceImageUrl: string,
  implementationScreenshotUrl: string
): Promise<VisualComparisonResult> {
  // 1. Use Claude with vision to compare
  const analysis = await query({
    prompt: `
Compare these two images and identify differences:

Reference Design:
<image>${referenceImageUrl}</image>

Implementation:
<image>${implementationScreenshotUrl}</image>

Analyze:
1. Layout differences (positioning, spacing, alignment)
2. Color differences (exact vs close matches)
3. Size differences (widths, heights, padding)
4. Typography differences (font, size, weight)
5. Missing or extra elements

Return JSON:
{
  "overallSimilarity": 0.87,
  "issues": [
    {
      "severity": "error" | "warning",
      "type": "size" | "color" | "spacing" | "layout",
      "description": "Header height: Expected 80px, got 64px",
      "location": "header section"
    }
  ],
  "recommendation": "Retry with corrections" | "Accept"
}
`,
    options: { model: 'sonnet' },
  });

  return JSON.parse(analysis);
}
```

### Asset Storage

**Using Cloudflare R2 or AWS S3:**

```typescript
// Upload design reference
async function uploadDesignAsset(
  file: File,
  taskId: string
): Promise<string> {
  const key = `designs/${taskId}/${file.name}`;

  // Upload to R2/S3
  await r2.putObject({
    Bucket: 'sentra-assets',
    Key: key,
    Body: file,
    ContentType: file.type,
  });

  // Generate public URL
  const url = `https://assets.sentra.dev/${key}`;

  // Store in database
  await db.insert(designAssets).values({
    taskId,
    fileName: file.name,
    url,
    type: 'reference',
    uploadedAt: new Date(),
  });

  return url;
}

// Store Playwright screenshot
async function storePlaywrightScreenshot(
  taskId: string,
  screenshot: Buffer
): Promise<string> {
  const key = `screenshots/${taskId}/${Date.now()}.png`;

  await r2.putObject({
    Bucket: 'sentra-assets',
    Key: key,
    Body: screenshot,
    ContentType: 'image/png',
  });

  const url = `https://assets.sentra.dev/${key}`;

  await db.insert(designAssets).values({
    taskId,
    fileName: `${Date.now()}.png`,
    url,
    type: 'implementation',
    uploadedAt: new Date(),
  });

  return url;
}
```

## Multi-Project Management

### Project Switcher

**Header component:**

```tsx
function ProjectSwitcher() {
  const projects = useProjects();
  const currentProject = useCurrentProject();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2">
          <Avatar src={currentProject.icon} />
          <span>{currentProject.name}</span>
          <ChevronDown size={16} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Your Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Recent projects */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Recent
        </DropdownMenuLabel>
        {projects.recent.map(project => (
          <DropdownMenuItem key={project.id} onClick={() => switchProject(project.id)}>
            <Avatar src={project.icon} size="sm" />
            <span>{project.name}</span>
            <span className="text-muted-foreground text-xs">
              {project.taskCount} tasks
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* All projects */}
        <DropdownMenuItem onClick={() => showAllProjects()}>
          View All Projects →
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createNewProject()}>
          + New Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Multi-Project View

**Split-screen mode:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Multi-Project View]                    [⊞ Layout ▼]        │
├──────────────────────────┬──────────────────────────────────┤
│ Project A (Next.js)      │ Project B (React)                │
├──────────────────────────┼──────────────────────────────────┤
│ Backlog  Plan  Code Test │ Backlog  Plan  Code Test         │
│ ┌────┐  ┌────┐          │ ┌────┐  ┌────┐                  │
│ │[T1]│  │[T2]│          │ │[T5]│  │[T6]│                  │
│ │    │  │[T3]│          │ │    │  │    │                  │
│ └────┘  └────┘          │ └────┘  └────┘                  │
└──────────────────────────┴──────────────────────────────────┘
```

**Layout options:**
- 2-column split (side-by-side)
- 4-panel grid (2x2)
- Unified list (all projects, filtered view)

**Implementation:**

```tsx
function MultiProjectView() {
  const [layout, setLayout] = useState<'split' | 'grid' | 'unified'>('split');
  const selectedProjects = useSelectedProjects(); // User picks 2-4 projects

  if (layout === 'split') {
    return (
      <div className="grid grid-cols-2 gap-4">
        {selectedProjects.map(project => (
          <ProjectKanban key={project.id} projectId={project.id} />
        ))}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-4">
        {selectedProjects.slice(0, 4).map(project => (
          <ProjectKanban key={project.id} projectId={project.id} compact />
        ))}
      </div>
    );
  }

  // Unified: all tasks from all projects in one list
  return <UnifiedTaskList projects={selectedProjects} />;
}
```

### Cross-Project Task View

**Unified task list:**

```
┌─────────────────────────────────────────────────────────────┐
│ All Tasks Across Projects                                   │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Project: All ▼] [Status: Active ▼] [Sort: Recent]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🟢 [Project A] Add authentication - CODE phase (45%)        │
│    Started 5m ago                                           │
│                                                             │
│ 🔴 [Project B] Fix login bug - FAILED in TEST               │
│    Started 10m ago, failed 2m ago                           │
│                                                             │
│ 🟡 [Project A] Refactor database - PLAN phase (20%)         │
│    Started 15m ago                                          │
│                                                             │
│ ✅ [Project C] Update deps - COMPLETED                       │
│    Completed 30m ago                                        │
│                                                             │
│ [Load More...]                                              │
└─────────────────────────────────────────────────────────────┘
```

## Command Palette (Cmd+K)

**Universal search and actions:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 [Search or run a command...]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Quick Actions:                                              │
│ ⌨️  Create Task                                             │
│ ⌨️  Create Project                                          │
│ ⌨️  Switch Project                                          │
│ ⌨️  View Logs                                               │
│ ⌨️  View Failures                                           │
│                                                             │
│ Recent Searches:                                            │
│ 🔎 "auth bug"                                               │
│ 🔎 "migration tasks"                                        │
│                                                             │
│ Go to:                                                      │
│ 📁 Project A                                                │
│ 📁 Project B                                                │
│ 📋 Task #T001                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Fuzzy search across all tasks, projects, logs
- Keyboard shortcuts for common actions
- Recent items
- Command suggestions

## Logging Interface

### Global Log Viewer

```
┌─────────────────────────────────────────────────────────────┐
│ Logs                                                        │
├─────────────────────────────────────────────────────────────┤
│ [Project: All ▼] [Task: All ▼] [Phase: All ▼] [Level ▼]   │
│ [Search logs...                                  ] [Export]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 14:35:24.123 [Project A] [T001] [PLAN] INFO               │
│   Starting planning workflow                                │
│                                                             │
│ 14:35:25.456 [Project A] [T001] [PLAN] INFO               │
│   Task fetched from database                                │
│   > Task: Add user authentication                           │
│                                                             │
│ 14:35:30.789 [Project B] [T005] [CODE] WARN               │
│   Dependency not found, installing...                       │
│   > Package: @types/node@20.0.0                            │
│                                                             │
│ 14:35:31.012 [Project A] [T001] [CODE] ERROR              │
│   ❌ Type check failed                                      │
│   > File: lib/auth.ts:42                                   │
│   > Error: Type 'string | undefined' not assignable...     │
│   [View Full Error]                                        │
│                                                             │
│ [Load More...] [Auto-scroll: ON] [Follow Mode: ON]        │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time streaming
- Syntax highlighting for code snippets
- Expand/collapse detailed errors
- Link to task/file
- Copy log line
- Export filtered logs

## Failure Dashboard

### Failed Tasks Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Failed Tasks (3)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔴 [Project A] Fix login bug (#T002)                        │
│    Failed in: TEST phase                                    │
│    Error: Test suite failed (3/5 tests)                     │
│    Failed at: 10:35 AM (2m ago)                             │
│    [View Logs] [Retry] [Skip to Review]                    │
│                                                             │
│ 🔴 [Project B] Update dependencies (#T007)                  │
│    Failed in: CODE phase                                    │
│    Error: Type check failed (12 errors)                     │
│    Failed at: 10:30 AM (7m ago)                             │
│    [View Logs] [Retry] [Fix Manually]                      │
│                                                             │
│ 🔴 [Project C] Refactor API (#T012)                         │
│    Failed in: BUILD phase                                   │
│    Error: Build failed (syntax error)                       │
│    Failed at: 10:25 AM (12m ago)                            │
│    [View Logs] [Retry] [Rollback]                          │
│                                                             │
│ [Clear Resolved] [Retry All]                                │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Auto-refresh
- Grouped by error type
- Quick actions for each failure
- Notification when new failure

## Additional Tactical Features

### 1. Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Analytics - Last 30 Days                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Task Velocity                                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │                                    ╱╲                 │   │
│ │                      ╱╲           ╱  ╲                │   │
│ │            ╱╲       ╱  ╲         ╱    ╲      ╱╲       │   │
│ │   ╱╲      ╱  ╲     ╱    ╲       ╱      ╲    ╱  ╲     │   │
│ │  ╱  ╲    ╱    ╲___╱      ╲_____╱        ╲__╱    ╲    │   │
│ └─────────────────────────────────────────────────────┘   │
│ Avg: 8.5 tasks/day | Peak: 15 tasks/day | Total: 234      │
│                                                             │
│ Agent Performance                                           │
│ ✅ Planner:  95% success rate (200/210 tasks)              │
│ ✅ Coder:    88% success rate (180/205 tasks)              │
│ ✅ Tester:   92% success rate (190/207 tasks)              │
│ ✅ Reviewer: 97% success rate (195/201 tasks)              │
│                                                             │
│ Time to Completion (avg)                                    │
│ PLAN:   8 minutes                                           │
│ CODE:   25 minutes                                          │
│ TEST:   12 minutes                                          │
│ REVIEW: 6 minutes                                           │
│ Total:  51 minutes per task                                 │
└─────────────────────────────────────────────────────────────┘
```

### 2. Resource Monitor

```
┌─────────────────────────────────────────────────────────────┐
│ System Resources                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Agents: 3 / 10 (30% utilization)                     │
│ ████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 30%                             │
│                                                             │
│ Worktrees:                                                  │
│ • .sentra/worktrees/task-abc123 (350 MB)                   │
│ • .sentra/worktrees/task-def456 (280 MB)                   │
│ • .sentra/worktrees/task-ghi789 (420 MB)                   │
│ Total: 1.05 GB                                              │
│ [Clean Old Worktrees]                                       │
│                                                             │
│ MCP Requests: 847 / 1000 (today)                            │
│ ████████████████████▒▒▒▒▒ 85%                              │
│                                                             │
│ API Rate Limits:                                            │
│ • Claude API: 450 / 500 (90%)                               │
│ • GitHub API: 120 / 5000 (2%)                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Workflow Builder (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│ Custom Workflow Builder                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Start] → [PLAN] → [CODE] → [TEST] → [REVIEW] → [End]     │
│                       │                                     │
│                       └─→ [RETRY] (if failed) ─┐           │
│                                                 │           │
│                                                 ↓           │
│                       [TEST] ←──────────────────┘           │
│                                                             │
│ Drag blocks to create custom workflows:                    │
│ • Conditional branching                                     │
│ • Parallel execution                                        │
│ • Custom agents                                             │
│                                                             │
│ [Save as Template] [Test Workflow]                         │
└─────────────────────────────────────────────────────────────┘
```

### 4. Notification Center

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Notifications (3 new)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Task "Add auth" completed (2m ago)                        │
│    Project: Project A                                       │
│    [View Task]                                              │
│                                                             │
│ ❌ Task "Fix bug" failed in TEST phase (5m ago)             │
│    Project: Project B                                       │
│    [View Logs] [Retry]                                      │
│                                                             │
│ ⏰ Workflow "full_sdlc" finished (10m ago)                  │
│    Project: Project C                                       │
│    Duration: 48 minutes                                     │
│    [View Results]                                           │
│                                                             │
│ [Mark All Read] [Settings]                                 │
└─────────────────────────────────────────────────────────────┘
```

### 5. Code Review Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Task #T001 - Code Review                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Files Changed (5):                                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ app/api/auth/login/route.ts (+45, -0)              │   │
│ │                                                     │   │
│ │  1  import { NextRequest } from 'next/server';     │   │
│ │  2  import { signToken } from '@/lib/auth';        │   │
│ │  3                                                  │   │
│ │  4  export async function POST(req: NextRequest) { │   │
│ │  5    const { email, password } = await req.json();│   │
│ │  6                                                  │   │
│ │  7    // Validate credentials                      │   │
│ │  8    const user = await validateUser(email, pass);│   │
│ │                                                     │   │
│ │ [💬 Comment on line 8]                              │   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ AI Review Summary:                                          │
│ ✅ Code quality: Excellent                                  │
│ ✅ Type safety: All types defined                           │
│ ⚠️ Security: Consider rate limiting                        │
│ ✅ Tests: Coverage 95%                                      │
│                                                             │
│ [Approve] [Request Changes] [Comment]                      │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Responsiveness

While primarily designed for desktop use, the dashboard is responsive:

**Mobile view priorities:**
1. Project switcher
2. Task list (compact cards)
3. Quick actions
4. Notifications
5. Logs (scrollable)

**Tablet view:**
- 2-column kanban
- Drawer overlays instead of modals
- Touch-optimized drag-drop

## Summary

The Sentra Dashboard is a comprehensive command center for managing autonomous AI development:

1. **Task Management** - Quick creation, kanban board, real-time updates
2. **AI Analyst** - Decomposes large projects into atomic tasks
3. **Legacy Migration** - Analyzes old codebases, plans component-by-component rewrites
4. **Visual Design System** - Upload designs, AI compares implementation
5. **Multi-Project** - Manage many projects simultaneously
6. **Logging** - Comprehensive, searchable, real-time logs
7. **Failure Management** - Quick identification and remediation
8. **Dark Mode with Violet** - Beautiful, themed, seamless
9. **Command Palette** - Fast keyboard-driven workflows
10. **Analytics** - Metrics, insights, performance tracking

**Philosophy:** Give the Tactical AI Engineer complete visibility and control over autonomous development with minimal clicks and maximum efficiency.