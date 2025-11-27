# Quetrex Development Guide

**Created by Glen Barnhardt with the help of Claude Code**

---

## Current Status

✅ **Next.js setup complete** - App Router with TypeScript
✅ **Dark Violet theme configured** - shadcn/ui with violet color scheme
✅ **Dashboard UI built** - Dynamic homepage with real data
✅ **Data layer complete** - TypeScript interfaces and hooks
✅ **Auto-refresh implemented** - Dashboard updates every 10 seconds
✅ **Logo support added** - Ready for actual Quetrex icon
✅ **Mock data working** - Full UI functional with sample data

🚧 **Next:** Tauri integration to read real telemetry data
🚧 **Then:** Real-time WebSocket updates from agents

---

## Quick Start

### Option 1: Using the script (recommended)

```bash
~/Projects/claude-code-base/scripts/dev-quetrex.sh
```

### Option 2: Manual

```bash
cd ~/Projects/claude-code-base/quetrex
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

---

## What's Built So Far

### UI Components

**Homepage (src/app/page.tsx):**
- Header with Quetrex branding (green beaker icon)
- 4 stat cards: Active Agents, Projects, Cost, Success Rate
- Active Agents section with live status indicators
- Projects grid showing all tracked projects

**Theme:**
- Dark mode with violet accent colors (shadcn/ui violet theme)
- Glass morphism effects (`quetrex-glass` utility class)
- Custom status indicators (running, idle, error)
- Beautiful gradients and animations

### Configuration

**Tech Stack:**
- Next.js 15.x (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

**Files Created:**
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js config for Tauri
- `tailwind.config.ts` - Tailwind with violet theme
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui config (violet base color)
- `src/app/globals.css` - Dark violet theme CSS variables
- `src/app/layout.tsx` - Root layout with dark mode
- `src/app/page.tsx` - Dynamic homepage dashboard
- `src/lib/utils.ts` - Utility functions
- `src/lib/tauri.ts` - Tauri command wrappers and TypeScript types
- `src/hooks/useDashboard.ts` - React hook for dashboard data
- `public/README.md` - Instructions for logo placement

---

## Color Scheme

The app uses shadcn/ui's **dark violet theme**:

- **Background:** Deep blue-violet (#0A0A14)
- **Primary:** Violet (#8B5CF6)
- **Accent:** Secondary violet tones
- **Success:** Green (for agent status)
- **Destructive:** Red (for errors)

Custom utilities:
- `.quetrex-glass` - Glassmorphism effect
- `.quetrex-card` - Standard card styling
- `.quetrex-status-running` - Green status badge
- `.quetrex-status-idle` - Gray status badge
- `.quetrex-status-error` - Red status badge

---

## Data Layer Architecture

Quetrex uses a clean separation between UI and data:

### TypeScript Types (`src/lib/tauri.ts`)

All data types are defined here:
- `Project` - Project metadata and stats
- `Agent` - Active agent information
- `DashboardStats` - Overall statistics

### Data Functions

Functions that will call Tauri backend (currently using mock data):
- `getProjects()` - Get all tracked projects
- `getActiveAgents()` - Get running agents
- `getDashboardStats()` - Get overall stats
- `getTelemetryLogs()` - Read logs
- `stopAgent()` - Stop a running agent
- `getProjectMemory()` - Get learnings/memory

### React Hook (`src/hooks/useDashboard.ts`)

The `useDashboard()` hook:
- Fetches all data in parallel
- Auto-refreshes every 10 seconds
- Manages loading and error states
- Returns: `{ projects, agents, stats, loading, error }`

### Usage in Components

```typescript
const { projects, agents, stats, loading } = useDashboard();

if (loading) return <LoadingSpinner />;

return <div>{projects.map(...)}</div>
```

**Current Mode:** `MOCK_MODE = true` in `src/lib/tauri.ts`

When Tauri is integrated, set `MOCK_MODE = false` and the real Tauri commands will be used automatically.

---

## Next Steps

### Phase 1: Tauri Integration (Next)

1. Initialize Tauri project
2. Create Rust backend commands
3. Build native Mac app
4. Add menu bar integration

### Phase 2: Real Data

1. Connect to existing telemetry system
2. Read `~/.claude/tracked-projects.txt`
3. Parse telemetry logs
4. Display real agent status

### Phase 3: Live Updates

1. WebSocket connection to agents
2. Real-time log streaming
3. Live cost tracking
4. Auto-refresh dashboard

---

## Development Tips

**Hot reload:**
- Next.js dev server auto-reloads on file changes
- Edit any file in `src/` and see changes instantly

**Adding shadcn/ui components:**
```bash
cd quetrex
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
```

**Tailwind classes:**
- Use `bg-background`, `text-foreground` for theme colors
- Use `border-border` for consistent borders
- Use custom `.quetrex-*` classes for app-specific styling

---

## File Structure

```
quetrex/
├── src/
│   ├── app/
│   │   ├── globals.css       # Dark violet theme
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Homepage dashboard
│   └── lib/
│       └── utils.ts          # Utility functions
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json
└── DEVELOPMENT.md            # This file
```

---

**The dark violet theme looks stunning! Ready to continue with Tauri integration.**

Created by Glen Barnhardt with the help of Claude Code
