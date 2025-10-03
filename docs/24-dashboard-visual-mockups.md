# Dashboard Visual Mockups

Complete visual guide for the Sentra Dashboard interface design.

## Color Palette

```
Dark Mode (Default):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background:     #020817 (slate-950)
Surface:        #0f172a (slate-900)
Border:         #1e293b (slate-800)
Text Primary:   #f8fafc (slate-50)
Text Secondary: #94a3b8 (slate-400)
Primary:        #8b5cf6 (violet-500)
Success:        #22c55e (green-500)
Warning:        #f59e0b (amber-500)
Error:          #ef4444 (red-500)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 1. Dashboard Home - Full Layout

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║                                                                                 ║
║  ┌─────────┐  ┌──────────────────────┐  ┌───────────────┐  ┌────────────────┐ ║
║  │ SENTRA  │  │  Project A  ▼        │  │  ⌘ Search     │  │  🔔  👤 JD    │ ║
║  │  [S]    │  │  Next.js 15 + TS     │  │               │  │                │ ║
║  └─────────┘  └──────────────────────┘  └───────────────┘  └────────────────┘ ║
║                                                                                 ║
╟─────────────┬───────────────────────────────────────────────────────────────────╢
║             │                                                                   ║
║  Dashboard  │  Project Overview                                                ║
║  Projects   │  ┏━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┓  ║
║  Tasks      │  ┃   Active   ┃ Completed  ┃   Failed   ┃      Agent        ┃  ║
║  Logs       │  ┃   Tasks    ┃   Tasks    ┃   Tasks    ┃   Utilization     ┃  ║
║  Analytics  │  ┃            ┃            ┃            ┃                   ┃  ║
║  💰 Costs   │  ┃     8      ┃     45     ┃     2      ┃   ████████░░      ┃  ║
║  🔄 Health  │  ┃            ┃            ┃            ┃       65%         ┃  ║
║  Settings   │  ┃   ↗ 24h   ┃   ↗ 135    ┃    ⚠️      ┃                   ┃  ║
║             │  ┗━━━━━━━━━━━━┻━━━━━━━━━━━━┻━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━┛  ║
║  ┌────────┐ │                                                                  ║
║  │+ Task  │ │  ┌────────────────────────────────────────────────────────────┐ ║
║  └────────┘ │  │  💰 Monthly Budget: $342.50 / $500.00 (68.5%)              │ ║
║             │  │  🔄 Circuit Breaker: ✅ CLOSED (System Healthy)            │ ║
║  ┌────────┐ │  └────────────────────────────────────────────────────────────┘ ║
║  │+Project│ │                                                                  ║
║  └────────┘ │  Your Projects                                                  ║
║             │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            ║
║             │  │  Project A   │ │  Project B   │ │  Project C   │  [+ Add]  ║
║             │  │  ━━━━━━━━━━  │ │  ━━━━━━━━━━  │ │  ━━━━━━━━━━  │            ║
║             │  │  Next.js 15  │ │  React 18    │ │  Vue 3       │            ║
║             │  │  TypeScript  │ │  JavaScript  │ │  TypeScript  │            ║
║             │  │              │ │              │ │              │            ║
║             │  │  🟢 8 active │ │  🟡 3 active │ │  🟠 5 active │            ║
║             │  │  ✅ 45 done  │ │  ✅ 23 done  │ │  ✅ 12 done  │            ║
║             │  │  ❌ 2 failed │ │  ❌ 1 failed │ │  ❌ 0 failed │            ║
║             │  │              │ │              │ │              │            ║
║             │  │  [Open] →    │ │  [Open] →    │ │  [Open] →    │            ║
║             │  └──────────────┘ └──────────────┘ └──────────────┘            ║
║             │                                                                  ║
║             │  Recent Activity                                                ║
║             │  ┌────────────────────────────────────────────────────────────┐ ║
║             │  │ ✅ Task "Add JWT authentication" completed       2m ago    │ ║
║             │  │    Project A · #T001 · by @planner-agent                  │ ║
║             │  ├────────────────────────────────────────────────────────────┤ ║
║             │  │ ❌ Task "Fix login bug" failed in TEST           5m ago    │ ║
║             │  │    Project B · #T002 · 3 tests failed  [View] [Retry]    │ ║
║             │  ├────────────────────────────────────────────────────────────┤ ║
║             │  │ 🟡 Workflow "plan_code_test" started             8m ago    │ ║
║             │  │    Project A · #W005 · Currently in CODE phase            │ ║
║             │  ├────────────────────────────────────────────────────────────┤ ║
║             │  │ 🔔 New team member "alice@example.com" joined   15m ago   │ ║
║             │  │    Project C · Role: Developer                            │ ║
║             │  └────────────────────────────────────────────────────────────┘ ║
║             │                                                                  ║
╚═════════════╧══════════════════════════════════════════════════════════════════╝
```

## 2. Kanban Board - Project View

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║  [← Back]  Project A: E-Commerce Platform (Next.js 15 + TypeScript)  [+ Task]  ║
╟─────────────────────────────────────────────────────────────────────────────────╢
║  [All] [Planning] [Coding] [Testing] [Review]    🔍 Search...   [@User ▼] [⚙️] ║
╟──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────────╢
║          │          │          │          │          │          │             ║
║ BACKLOG  │ PLANNING │  CODING  │ TESTING  │  REVIEW  │   DONE   │  DEPLOYED   ║
║    (15)  │    (3)   │   (5)    │   (2)    │   (1)    │   (45)   │    (23)     ║
║          │          │          │          │          │          │             ║
╟──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────────╢
║          │          │          │          │          │          │             ║
║┌────────┐│┌────────┐│┌────────┐│┌────────┐│┌────────┐│┌────────┐│┌────────┐  ║
║│ #T012  │││ #T008  │││ #T003  │││ #T002  │││ #T001  │││ #T010  │││ #T009  │  ║
║│━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│  ║
║│        │││        │││        │││        │││        │││        │││        │  ║
║│Add cart│││Product │││User    │││Payment │││Auth    │││Landing │││Header  │  ║
║│feature │││catalog │││profile │││gateway │││system  │││page    │││navbar  │  ║
║│        │││        │││        │││        │││        │││        │││        │  ║
║│Feature │││Feature │││Feature │││Bug 🐛  │││Feature │││Feature │││Feature │  ║
║│        │││        │││        │││        │││        │││        │││        │  ║
║│🟢 High │││🟡 Med  │││🟢 High │││🔴 Crit │││🟢 High │││🟡 Med  │││🟡 Med  │  ║
║│        │││        │││        │││        │││        │││        │││        │  ║
║│━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│││━━━━━━━━│  ║
║│        │││ PLAN   │││ CODE   │││ TEST   │││ REVIEW │││        │││        │  ║
║│        │││ 45%    │││ 68%    │││ 30%    │││ 90%    │││        │││        │  ║
║│        │││████▒▒▒ │││█████▒▒ │││██▒▒▒▒▒ │││██████▒ │││        │││        │  ║
║│        │││        │││        │││        │││        │││        │││        │  ║
║│Unassign│││@planner│││@coder  │││@tester │││@reviewer│││@coder │││@coder  │  ║
║│        │││5m ago  │││12m ago │││3m ago  │││1m ago  │││2h ago  │││1d ago  │  ║
║└────────┘││└────────┘││└────────┘││└────────┘││└────────┘││└────────┘││└────────┘  ║
║          │          │          │          │          │          │             ║
║┌────────┐│┌────────┐│┌────────┐│          │          │┌────────┐│             ║
║│ #T013  │││ #T007  │││ #T004  ││          │          ││ #T011  ││             ║
║│━━━━━━━━│││━━━━━━━━│││━━━━━━━━││          │          ││━━━━━━━━││             ║
║│        │││        │││        ││          │          ││        ││             ║
║│Checkout│││Search  │││Settings││          │          ││Footer  ││             ║
║│flow    │││filters │││page    ││          │          ││design  ││             ║
║│        │││        │││        ││          │          ││        ││             ║
║│Feature │││Feature │││Feature ││          │          ││Feature ││             ║
║│        │││        │││        ││          │          ││        ││             ║
║│🟡 Med  │││🟡 Med  │││⚪ Low  ││          │          ││⚪ Low  ││             ║
║└────────┘││└────────┘││└────────┘││          │          ││└────────┘││             ║
║          │          │          │          │          │          │             ║
║   [...]  │   [...]  │   [...]  │          │          │   [...]  │             ║
║          │          │          │          │          │          │             ║
╚══════════╧══════════╧══════════╧══════════╧══════════╧══════════╧═════════════╝
```

## 3. Failed Task Card - Highlighted

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  TASK FAILED                                       #T002 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Fix payment gateway integration bug                         │
│                                                              │
│  ╔══════════════════════════════════════════════════════╗   │
│  ║  Failed in: TEST phase                               ║   │
│  ║  Error: 3 of 5 integration tests failed              ║   │
│  ║  Failed at: 10:35:24 AM (2 minutes ago)              ║   │
│  ╚══════════════════════════════════════════════════════╝   │
│                                                              │
│  ❌ payment-integration.test.ts                              │
│     ✓ should initialize Stripe client                       │
│     ✗ should process successful payment                      │
│     ✗ should handle declined card                            │
│     ✓ should validate card details                          │
│     ✗ should refund transaction                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Error Details:                                     │    │
│  │  TypeError: Cannot read property 'id' of undefined  │    │
│  │  at processPayment (payment.ts:45:18)              │    │
│  │  at Test.it (payment-integration.test.ts:23:12)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━┓    │
│  ┃ View Logs  ┃  ┃   Retry    ┃  ┃ Skip to Review   ┃    │
│  ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━┛    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 4. Task Detail Drawer - Overview Tab

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Add user authentication                                    #T001  [×]  ║
╟─────────────────────────────────────────────────────────────────────────╢
║  [Overview] [Logs] [Files] [Visual Diff] [Activity]                    ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  Status: 🟢 CODE phase                                                  ║
║  Progress: 45% complete                                                 ║
║  ████████████▒▒▒▒▒▒▒▒▒▒▒▒▒                                             ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  Phase Progress:                                                  │ ║
║  │                                                                   │ ║
║  │  ✅ PLAN  →  ▶️ CODE  →  ⏸ TEST  →  ⏸ REVIEW                     │ ║
║  │     100%       45%        0%         0%                           │ ║
║  │                                                                   │ ║
║  │  Total elapsed: 18 minutes                                        │ ║
║  │  Estimated remaining: 22 minutes                                  │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  Branch: feature/add-auth-abc123                                        ║
║  Worktree: .sentra/worktrees/task-abc123                               ║
║  Agent: @coder-agent (active)                                           ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  Description                                                      │ ║
║  │                                                                   │ ║
║  │  Implement JWT-based authentication with refresh tokens.         │ ║
║  │  Include email/password login, logout, and token refresh         │ ║
║  │  endpoints. Use bcrypt for password hashing. Store refresh       │ ║
║  │  tokens in httpOnly cookies for security.                        │ ║
║  │                                                                   │ ║
║  │  Requirements:                                                    │ ║
║  │  • POST /api/auth/login                                           │ ║
║  │  • POST /api/auth/logout                                          │ ║
║  │  • POST /api/auth/refresh                                         │ ║
║  │  • Middleware for protected routes                                │ ║
║  │  • Unit tests + integration tests                                 │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  Current Agent Activity:                                                ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  🤖 @coder-agent is working on:                                   │ ║
║  │  • Writing app/api/auth/login/route.ts                           │ ║
║  │  • Progress: Implementing password validation logic               │ ║
║  │  • Last update: 12 seconds ago                                    │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━┓  ║
║  ┃    View Plan      ┃  ┃ View Code Changes ┃  ┃   View Tests    ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━┛  ║
║                                                                         ║
║  Actions:                                                               ║
║  ┏━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃  Retry Phase  ┃  ┃ Skip to Review ┃  ┃     Cancel Task        ┃  ║
║  ┗━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 5. Task Detail Drawer - Logs Tab

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Add user authentication                                    #T001  [×]  ║
╟─────────────────────────────────────────────────────────────────────────╢
║  [Overview] [Logs] [Files] [Visual Diff] [Activity]                    ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  [Phase: All ▼] [Level: All ▼] [Agent: All ▼] [🔍 Search logs...]     ║
║                                                                         ║
║  [Export Logs]  [Auto-scroll: ON ✓]  [Follow Mode: ON ✓]              ║
║                                                                         ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  10:35:24.123  [PLAN]  INFO    Starting planning workflow              ║
║                                                                         ║
║  10:35:25.456  [PLAN]  INFO    Task fetched from database              ║
║                                 > Task: Add user authentication         ║
║                                 > Priority: High                        ║
║                                 > Type: Feature                         ║
║                                                                         ║
║  10:35:26.789  [PLAN]  INFO    Classifying task type...                ║
║                                                                         ║
║  10:35:30.012  [PLAN]  INFO    ✅ Task classified as: feature          ║
║                                 > Estimated complexity: Medium          ║
║                                 > Estimated time: 45 minutes            ║
║                                                                         ║
║  10:35:31.345  [PLAN]  INFO    Creating branch: feature/add-auth-abc123║
║                                 > Base: main                            ║
║                                                                         ║
║  10:35:32.678  [PLAN]  INFO    ✅ Branch created successfully          ║
║                                                                         ║
║  10:35:33.901  [CODE]  INFO    Starting coding workflow                ║
║                                                                         ║
║  10:35:35.234  [CODE]  INFO    Loading plan file...                    ║
║                                 > File: .sentra/plans/task-abc123.md   ║
║                                                                         ║
║  10:35:36.567  [CODE]  WARN    Dependency not found, installing...     ║
║                                 > Package: bcryptjs@^2.4.3             ║
║                                 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║                                 ┃ npm install bcryptjs --save     ┃  ║
║                                 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                         ║
║  10:35:40.890  [CODE]  INFO    ✅ Dependency installed successfully     ║
║                                                                         ║
║  10:35:42.123  [CODE]  INFO    Creating file: app/api/auth/login/route.║
║                                                                         ║
║  10:35:45.456  [CODE]  INFO    ✅ File created (78 lines)              ║
║                                                                         ║
║  10:35:47.789  [CODE]  INFO    Running type check...                   ║
║                                                                         ║
║  10:35:52.012  [CODE]  ERROR   ❌ Type check failed (3 errors)         ║
║                                 > File: lib/auth.ts:42                  ║
║                                 > Error: Type 'string | undefined' is  ║
║                                   not assignable to type 'string'       ║
║                                 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║                                 ┃ [View Full Error] [View File]    ┃  ║
║                                 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                         ║
║  10:35:53.345  [CODE]  INFO    Attempting auto-fix...                  ║
║                                                                         ║
║  [Load More Lines...]                                                   ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 6. Task Detail Drawer - Files Tab

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Add user authentication                                    #T001  [×]  ║
╟─────────────────────────────────────────────────────────────────────────╢
║  [Overview] [Logs] [Files] [Visual Diff] [Activity]                    ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  Files Changed (8)                                                      ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  📄 Modified Files (3)                                            │ ║
║  │                                                                   │ ║
║  │  ✏️  app/api/auth/login/route.ts                   +45  -0      │ ║
║  │     Last modified: 2m ago                                        │ ║
║  │     ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━┓ │ ║
║  │     ┃ View Diff  ┃  ┃   Blame    ┃  ┃    Open in Editor     ┃ │ ║
║  │     ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━┛ │ ║
║  │                                                                   │ ║
║  │  ✏️  lib/auth.ts                                   +32  -5      │ ║
║  │     Last modified: 5m ago                                        │ ║
║  │     ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━┓ │ ║
║  │     ┃ View Diff  ┃  ┃   Blame    ┃  ┃    Open in Editor     ┃ │ ║
║  │     ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━┛ │ ║
║  │                                                                   │ ║
║  │  ✏️  db/schema/users.ts                            +12  -2      │ ║
║  │     Last modified: 8m ago                                        │ ║
║  │     ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━┓ │ ║
║  │     ┃ View Diff  ┃  ┃   Blame    ┃  ┃    Open in Editor     ┃ │ ║
║  │     ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━┛ │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ✨ Created Files (5)                                            │ ║
║  │                                                                   │ ║
║  │  ✨ app/api/auth/refresh/route.ts                  +28  -0      │ ║
║  │  ✨ app/api/auth/logout/route.ts                   +18  -0      │ ║
║  │  ✨ middleware/auth.ts                             +45  -0      │ ║
║  │  ✨ __tests__/auth.test.ts                         +156 -0      │ ║
║  │  ✨ __tests__/auth-integration.test.ts             +89  -0      │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  Summary                                                          │ ║
║  │                                                                   │ ║
║  │  Total lines added:     +425                                      │ ║
║  │  Total lines removed:   -7                                        │ ║
║  │  Net change:            +418                                      │ ║
║  │                                                                   │ ║
║  │  Files modified:        3                                         │ ║
║  │  Files created:         5                                         │ ║
║  │  Files deleted:         0                                         │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 7. Visual Comparison View

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Create user profile page                                   #T015  [×]  ║
╟─────────────────────────────────────────────────────────────────────────╢
║  [Overview] [Logs] [Files] [Visual Diff] [Activity]                    ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  Visual Design Comparison                                               ║
║                                                                         ║
║  [Pixel Diff] [Side by Side] [Overlay] [Slider]                        ║
║                                                                         ║
║  ┌─────────────────────────────────┬─────────────────────────────────┐ ║
║  │  Reference Design               │  Implementation                 │ ║
║  ├─────────────────────────────────┼─────────────────────────────────┤ ║
║  │                                 │                                 │ ║
║  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓   │   ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  │ ║
║  │  ┃                         ┃   │   ┃                        ┃  │ ║
║  │  ┃   [User Avatar]         ┃   │   ┃   [User Avatar]        ┃  │ ║
║  │  ┃                         ┃   │   ┃                        ┃  ║
║  │  ┃   John Doe              ┃   │   ┃   John Doe             ┃  │ ║
║  │  ┃   john@example.com      ┃   │   ┃   john@example.com     ┃  │ ║
║  │  ┃                         ┃   │   ┃                        ┃  │ ║
║  │  ┃   ┏━━━━━━━━━━━━━━━━┓   ┃   │   ┃   ┏━━━━━━━━━━━━━━━┓   ┃  │ ║
║  │  ┃   ┃  Edit Profile  ┃   ┃   │   ┃   ┃  Edit Profile ┃   ┃  │ ║
║  │  ┃   ┗━━━━━━━━━━━━━━━━┛   ┃   │   ┃   ┗━━━━━━━━━━━━━━━┛   ┃  │ ║
║  │  ┃                         ┃   │   ┃                        ┃  │ ║
║  │  ┃   Bio: Software dev...  ┃   │   ┃   Bio: Software dev... ┃  │ ║
║  │  ┃                         ┃   │   ┃                        ┃  │ ║
║  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛   │   ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │ ║
║  │                                 │                                 │ ║
║  │  Figma Export                   │  localhost:3000/profile         │ ║
║  │  1920x1080                      │  Captured: 2m ago               │ ║
║  └─────────────────────────────────┴─────────────────────────────────┘ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  AI Analysis: 87% Match                                          ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  Issues Found (4):                                                      ║
║                                                                         ║
║  ❌ Header section                                                      ║
║     Expected height: 80px                                               ║
║     Actual height: 64px                                                 ║
║     Difference: -16px (20% smaller)                                     ║
║                                                                         ║
║  ❌ Avatar size                                                         ║
║     Expected size: 120x120px                                            ║
║     Actual size: 96x96px                                                ║
║     Difference: -24px (20% smaller)                                     ║
║                                                                         ║
║  ⚠️ Button color                                                        ║
║     Expected: #8b5cf6 (violet-500)                                      ║
║     Actual: #7c3aed (violet-600)                                        ║
║     Note: Minor shade difference, may be acceptable                     ║
║                                                                         ║
║  ⚠️ Profile section spacing                                             ║
║     Missing 24px bottom margin                                          ║
║     Current: 16px                                                       ║
║     Difference: -8px (33% less)                                         ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃ Accept Implementation   ┃  ┃   Retry with Corrections         ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 8. AI Project Analyst - Large Project Breakdown

```
╔═════════════════════════════════════════════════════════════════════════╗
║  🤖 AI Project Analyst                                                  ║
╟─────────────────────────────────────────────────────────────────────────╢
║  Step 1 of 5: Project Overview                                          ║
║                                                                         ║
║  Let's break down your large project into manageable atomic tasks.      ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  Project Name                                                     │ ║
║  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ ║
║  │  ┃ Enterprise CRM System                                       ┃  │ ║
║  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ ║
║  │                                                                   │ ║
║  │  Description                                                      │ ║
║  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ ║
║  │  ┃ A comprehensive CRM system for managing customer contacts, ┃  │ ║
║  │  ┃ sales pipeline, deal tracking, team collaboration,         ┃  │ ║
║  │  ┃ reporting and analytics. Should include email integration, ┃  │ ║
║  │  ┃ task management, document storage, and calendar features.  ┃  │ ║
║  │  ┃                                                             ┃  │ ║
║  │  ┃ Target users: Sales teams (5-50 people)                    ┃  │ ║
║  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ ║
║  │                                                                   │ ║
║  │  Target Stack                                                     │ ║
║  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ ║
║  │  ┃ Next.js 15 + TypeScript + PostgreSQL          [Detected ✓]┃  │ ║
║  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━┓                                              ║
║  ┃  Analyze Project →  ┃                                              ║
║  ┗━━━━━━━━━━━━━━━━━━━━━┛                                              ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝

                              ↓ (After clicking)

╔═════════════════════════════════════════════════════════════════════════╗
║  🤖 AI Project Analyst                                                  ║
╟─────────────────────────────────────────────────────────────────────────╢
║  Step 2 of 5: Analyzing...                                              ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  🤖 Analyzing your project...                                     │ ║
║  │                                                                   │ ║
║  │  ✅ Identified 8 major modules                                    │ ║
║  │  ✅ Discovered 47 features                                        │ ║
║  │  ✅ Generated 234 atomic tasks                                    │ ║
║  │  ✅ Mapped dependencies                                           │ ║
║  │  ✅ Estimated timeline: 4-6 weeks                                 │ ║
║  │                                                                   │ ║
║  │  ████████████████████████████ 100%                                │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━┓                                              ║
║  ┃  View Breakdown →   ┃                                              ║
║  ┗━━━━━━━━━━━━━━━━━━━━━┛                                              ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 9. Module Breakdown View

```
╔═════════════════════════════════════════════════════════════════════════╗
║  🤖 AI Project Analyst - Enterprise CRM System                          ║
╟─────────────────────────────────────────────────────────────────────────╢
║  Step 3 of 5: Module Breakdown                                          ║
║                                                                         ║
║  [Expand All] [Collapse All]                                            ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▼ 1. Authentication & Authorization (12 tasks · 3 days)         │ ║
║  │                                                                   │ ║
║  │     Features:                                                     │ ║
║  │     • User registration (email/password)          3 tasks         │ ║
║  │     • Login/logout                                2 tasks         │ ║
║  │     • Password reset flow                         2 tasks         │ ║
║  │     • Role-based access control (RBAC)           3 tasks         │ ║
║  │     • Session management                          2 tasks         │ ║
║  │                                                                   │ ║
║  │     Dependencies: Database schema                                 │ ║
║  │     Priority: Critical (must complete first)                      │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▼ 2. Contact Management (18 tasks · 5 days)                     │ ║
║  │                                                                   │ ║
║  │     Features:                                                     │ ║
║  │     • Create/edit/delete contacts                4 tasks         │ ║
║  │     • Contact detail view                         3 tasks         │ ║
║  │     • Search & filters                            3 tasks         │ ║
║  │     • Contact segmentation                        2 tasks         │ ║
║  │     • Import/export CSV                           4 tasks         │ ║
║  │     • Contact notes & timeline                    2 tasks         │ ║
║  │                                                                   │ ║
║  │     Dependencies: Auth, Database                                  │ ║
║  │     Priority: High                                                │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▼ 3. Deal Pipeline (25 tasks · 6 days)                          │ ║
║  │                                                                   │ ║
║  │     Features:                                                     │ ║
║  │     • Deal creation & editing                     4 tasks         │ ║
║  │     • Pipeline stages (customizable)              5 tasks         │ ║
║  │     • Kanban board with drag-drop                 6 tasks         │ ║
║  │     • Deal value & revenue tracking               3 tasks         │ ║
║  │     • Win/loss analysis                           2 tasks         │ ║
║  │     • Deal activities & history                   3 tasks         │ ║
║  │     • Forecasting                                 2 tasks         │ ║
║  │                                                                   │ ║
║  │     Dependencies: Contacts, Auth                                  │ ║
║  │     Priority: High                                                │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▶ 4. Task Management (15 tasks · 4 days)                        │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▶ 5. Email Integration (22 tasks · 5 days)                      │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▶ 6. Reporting & Analytics (28 tasks · 7 days)                  │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▶ 7. Team Collaboration (16 tasks · 4 days)                     │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  ▶ 8. Calendar & Scheduling (18 tasks · 4 days)                  │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃  Generate Tasks     ┃  ┃   Customize   ┃  ┃   Export Plan     ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 10. Dependency Graph Visualization

```
╔═════════════════════════════════════════════════════════════════════════╗
║  🤖 AI Project Analyst - Dependency Graph                               ║
╟─────────────────────────────────────────────────────────────────────────╢
║  Step 4 of 5: Dependencies                                              ║
║                                                                         ║
║                           ┏━━━━━━━━━━━━━━━┓                            ║
║                           ┃  1. Database  ┃                            ║
║                           ┃    Schema     ┃                            ║
║                           ┗━━━━━━━┯━━━━━━━┛                            ║
║                                   │                                     ║
║                           ┏━━━━━━━┷━━━━━━━┓                            ║
║                           ┃   2. Auth &   ┃                            ║
║                           ┃ Authorization ┃                            ║
║                           ┗━━━━━━━┯━━━━━━━┛                            ║
║                                   │                                     ║
║                 ┌─────────────────┼─────────────────┐                  ║
║                 │                 │                 │                  ║
║         ┏━━━━━━━┷━━━━━━┓  ┏━━━━━━┷━━━━━━┓  ┏━━━━━━┷━━━━━━┓           ║
║         ┃ 3. Contact   ┃  ┃  4. Task     ┃  ┃ 5. Calendar  ┃           ║
║         ┃ Management   ┃  ┃ Management   ┃  ┃ & Scheduling ┃           ║
║         ┗━━━━━━━┯━━━━━━┛  ┗━━━━━━┯━━━━━━┛  ┗━━━━━━━━━━━━━━┛           ║
║                 │                 │                                     ║
║                 └────────┬────────┘                                     ║
║                          │                                              ║
║                  ┏━━━━━━━┷━━━━━━┓                                      ║
║                  ┃   6. Deal    ┃                                      ║
║                  ┃   Pipeline   ┃                                      ║
║                  ┗━━━━━━━┯━━━━━━┛                                      ║
║                          │                                              ║
║                 ┌────────┴────────┐                                     ║
║                 │                 │                                     ║
║         ┏━━━━━━━┷━━━━━━┓  ┏━━━━━━┷━━━━━━┓                             ║
║         ┃   7. Email   ┃  ┃ 8. Reporting ┃                             ║
║         ┃ Integration  ┃  ┃ & Analytics  ┃                             ║
║         ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛                             ║
║                                                                         ║
║  Build Strategy:                                                        ║
║  Week 1: Database + Auth (foundation)                                   ║
║  Week 2: Contacts + Tasks + Calendar (core entities)                    ║
║  Week 3-4: Deal Pipeline (primary feature)                              ║
║  Week 5: Email + Reporting (advanced features)                          ║
║  Week 6: Testing + Polish + Deployment                                  ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━┓                                                     ║
║  ┃    Next →     ┃                                                     ║
║  ┗━━━━━━━━━━━━━━━┛                                                     ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 11. Command Palette (Cmd+K)

```
╔═════════════════════════════════════════════════════════════════════════╗
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃ 🔍 Search or run a command...                                     ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  Quick Actions                                                          ║
║  ───────────────────────────────────────────────────────────────────   ║
║  ⌨️  Create Task                                      Cmd+N             ║
║  ⌨️  Create Project                                   Cmd+Shift+N       ║
║  ⌨️  Switch Project                                   Cmd+P             ║
║  ⌨️  View Logs                                        Cmd+L             ║
║  ⌨️  View Failures                                    Cmd+Shift+F       ║
║  ⌨️  Toggle Theme                                     Cmd+T             ║
║                                                                         ║
║  Recent Searches                                                        ║
║  ───────────────────────────────────────────────────────────────────   ║
║  🔎 "auth bug"                                                          ║
║  🔎 "migration tasks"                                                   ║
║  🔎 "failed tests"                                                      ║
║                                                                         ║
║  Go to                                                                  ║
║  ───────────────────────────────────────────────────────────────────   ║
║  📁 Project A (Next.js)                                                 ║
║  📁 Project B (React)                                                   ║
║  📁 Project C (Vue)                                                     ║
║  📋 Task #T001 - Add user authentication                                ║
║  📋 Task #T002 - Fix payment bug                                        ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝

                        ↓ (After typing "auth")

╔═════════════════════════════════════════════════════════════════════════╗
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃ 🔍 auth▊                                                          ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  Tasks                                                                  ║
║  ───────────────────────────────────────────────────────────────────   ║
║  ✅ #T001 - Add user authentication (Project A)                         ║
║  🔴 #T002 - Fix auth token expiry bug (Project B)                       ║
║  🟢 #T015 - Add OAuth providers (Project A)                             ║
║                                                                         ║
║  Files                                                                  ║
║  ───────────────────────────────────────────────────────────────────   ║
║  📄 lib/auth.ts                                                         ║
║  📄 app/api/auth/login/route.ts                                         ║
║  📄 middleware/auth.ts                                                  ║
║                                                                         ║
║  Logs                                                                   ║
║  ───────────────────────────────────────────────────────────────────   ║
║  ⚠️ [CODE] ERROR - Auth type check failed (2m ago)                      ║
║  ✅ [PLAN] INFO - Starting auth workflow (5m ago)                       ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 12. Multi-Project Split View

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Multi-Project View                          [⊞ 2-Column ▼] [Settings] ║
╟─────────────────────────────────┬───────────────────────────────────────╢
║                                 │                                       ║
║  Project A: E-Commerce          │  Project B: Marketing Site            ║
║  Next.js 15 + TypeScript        │  React 18 + JavaScript                ║
║                                 │                                       ║
╟─────────────────────────────────┼───────────────────────────────────────╢
║                                 │                                       ║
║  BACK  PLAN  CODE  TEST  DONE  │  BACK  PLAN  CODE  TEST  DONE        ║
║  ──────────────────────────────  │  ──────────────────────────────────   ║
║                                 │                                       ║
║  ┌───────┐ ┌───────┐           │  ┌───────┐            ┌───────┐      ║
║  │ #T001 │ │ #T003 │           │  │ #T010 │            │ #T012 │      ║
║  │ ───── │ │ ───── │           │  │ ───── │            │ ───── │      ║
║  │ Auth  │ │ Cart  │           │  │ Hero  │            │ Footer│      ║
║  │ 🟢    │ │ 🟡    │           │  │ 🟢    │            │ ✅    │      ║
║  └───────┘ └───────┘           │  └───────┘            └───────┘      ║
║                                 │                                       ║
║  ┌───────┐            ┌───────┐│  ┌───────┐ ┌───────┐                 ║
║  │ #T002 │            │ #T004 ││  │ #T011 │ │ #T013 │                 ║
║  │ ───── │            │ ─────││  │ ───── │ │ ───── │                 ║
║  │Payment│            │ Tests││  │ About │ │Contact│                 ║
║  │ 🔴    │            │ ✅   ││  │ 🟡    │ │ 🟡    │                 ║
║  └───────┘            └───────┘│  └───────┘ └───────┘                 ║
║                                 │                                       ║
║  Active: 3  Failed: 1  Done: 1  │  Active: 3  Failed: 0  Done: 1        ║
║                                 │                                       ║
╟─────────────────────────────────┴───────────────────────────────────────╢
║  Global Activity Feed                                                   ║
║  • [Project A] Task "Auth" completed (2m ago)                           ║
║  • [Project B] Task "Hero" in CODE phase (5m ago)                       ║
║  • [Project A] Task "Payment" failed in TEST (8m ago)                   ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 13. Team Members & Permissions View

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Project A: E-Commerce Platform  >  Team                                ║
╟─────────────────────────────────────────────────────────────────────────╢
║  [Members] [Invitations] [Activity Log]                                 ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  Team Members (5)                                     [+ Invite Member] ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  👤 John Doe                                            [Owner]   │ ║
║  │     john@example.com                                              │ ║
║  │     Joined 3 months ago · Last active: 5m ago                     │ ║
║  │     Created 45 tasks · Completed 120 tasks                        │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  👤 Alice Smith                              [Admin ▼] [Remove]  │ ║
║  │     alice@example.com                                             │ ║
║  │     Joined 2 months ago · Last active: 2h ago                     │ ║
║  │     Created 28 tasks · Completed 67 tasks                         │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  👤 Bob Johnson                         [Developer ▼] [Remove]   │ ║
║  │     bob@example.com                                               │ ║
║  │     Joined 1 month ago · Last active: 1d ago                      │ ║
║  │     Created 15 tasks · Completed 34 tasks                         │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  👤 Carol White                      [Contributor ▼] [Remove]    │ ║
║  │     carol@example.com                                             │ ║
║  │     Joined 2 weeks ago · Last active: 3h ago                      │ ║
║  │     Created 8 tasks · No coding permissions                       │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │  👤 David Lee                            [Viewer ▼] [Remove]     │ ║
║  │     david@example.com                                             │ ║
║  │     Joined 3 days ago · Last active: 6h ago                       │ ║
║  │     Read-only access                                              │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 14. Invite Member Modal

```
         ┌─────────────────────────────────────────────┐
         │  Invite Team Member                    [×]  │
         ├─────────────────────────────────────────────┤
         │                                             │
         │  Email Address                              │
         │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
         │  ┃ alice@example.com                   ┃  │
         │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
         │                                             │
         │  Role                                       │
         │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
         │  ┃ Developer                      ▼    ┃  │
         │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
         │                                             │
         │  ┌───────────────────────────────────────┐ │
         │  │  Developer Permissions:               │ │
         │  │                                       │ │
         │  │  ✓ Create and edit tasks              │ │
         │  │  ✓ View all project data              │ │
         │  │  ✓ Access logs and code changes       │ │
         │  │  ✓ Retry failed tasks                 │ │
         │  │  ✗ Manage team members                │ │
         │  │  ✗ Delete project                     │ │
         │  │                                       │ │
         │  └───────────────────────────────────────┘ │
         │                                             │
         │  Custom Message (optional)                  │
         │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
         │  ┃ Hey Alice! Inviting you to our      ┃  │
         │  ┃ e-commerce project. Looking forward ┃  │
         │  ┃ to working with you!                ┃  │
         │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
         │                                             │
         │  ┏━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━┓  │
         │  ┃  Send Invitation ┃  ┃     Cancel    ┃  │
         │  ┗━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━┛  │
         │                                             │
         └─────────────────────────────────────────────┘
```

## 15. Analytics Dashboard with Cost Tracking

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Analytics - Project A            [Performance] [Costs]  [30 Days ▼]   ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  💰 Monthly Budget & Token Usage                                 ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Budget: $500.00  │  Spent: $342.50  │  Remaining: $157.50      ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  [████████████████████████████░░░░░░░░░░] 68.5%                 ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  ⚠️  Threshold: 80% ($400) - On track                            ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Daily Burn Rate:          7-Day Average:    Projected Month:    ┃ ║
║  ┃  $12.50/day                $11.08/day        $390 (under budget) ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  ┌──────────────────────────────────┬──────────────────────────────┐  ║
║  │  Cost by Phase                   │  Token Usage Breakdown       │  ║
║  │                                  │                              │  ║
║  │  PLAN    $87.50   ███████  25.5% │  Input Tokens:   12.5M      │  ║
║  │  CODE    $171.25  ██████████ 50% │  Output Tokens:  3.8M       │  ║
║  │  TEST    $51.50   ████      15%  │  Total Tokens:   16.3M      │  ║
║  │  REVIEW  $32.25   ███        9.5%│                              │  ║
║  │                                  │  Avg per Task:               │  ║
║  │  Most Expensive Tasks:           │  • Input:  53k tokens       │  ║
║  │  • #T045 "Auth System"  $23.40   │  • Output: 16k tokens       │  ║
║  │  • #T032 "Payment API"  $18.75   │  • Cost:   $1.46            │  ║
║  │  • #T021 "User CRUD"    $15.20   │                              │  ║
║  └──────────────────────────────────┴──────────────────────────────┘  ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  Daily Spending Trend                                             ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  $20│                                                             ┃ ║
║  ┃     │        ╱╲                    ╱╲                             ┃ ║
║  ┃  $15│       ╱  ╲      ╱╲          ╱  ╲        ╱╲                 ┃ ║
║  ┃     │      ╱    ╲    ╱  ╲    ╱╲  ╱    ╲      ╱  ╲                ┃ ║
║  ┃  $10│     ╱      ╲__╱    ╲__╱  ╲╱      ╲____╱    ╲___            ┃ ║
║  ┃     │ ___╱                                          ╲             ┃ ║
║  ┃   $5│                                                             ┃ ║
║  ┃     │                                                             ┃ ║
║  ┃   $0├─────────────────────────────────────────────────────────   ┃ ║
║  ┃     1   5   10   15   20   25   30                               ┃ ║
║  ┃                   Days of Month                                   ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  Task Velocity                                                    ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  15 │                            ╱╲                              ┃ ║
║  ┃     │                  ╱╲       ╱  ╲                             ┃ ║
║  ┃  10 │        ╱╲       ╱  ╲     ╱    ╲      ╱╲                    ┃ ║
║  ┃     │       ╱  ╲     ╱    ╲   ╱      ╲    ╱  ╲                   ┃ ║
║  ┃   5 │  ╱╲  ╱    ╲___╱      ╲_╱        ╲__╱    ╲                  ┃ ║
║  ┃     │ ╱  ╲╱                                     ╲                 ┃ ║
║  ┃   0 ├──────────────────────────────────────────────────────────  ┃ ║
║  ┃     Week1  Week2  Week3  Week4  Today                            ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Average: 8.5 tasks/day  │  Peak: 15 tasks/day  │  Total: 234   ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  ┌──────────────────────────────────┬──────────────────────────────┐  ║
║  │  Agent Performance               │  Phase Distribution          │  ║
║  │                                  │                              │  ║
║  │  ✅ @planner-agent               │    PLAN    ████████  35%    │  ║
║  │     Success: 95% (200/210)       │    CODE    ███████   30%    │  ║
║  │     Avg time: 8 min              │    TEST    ████      18%    │  ║
║  │                                  │    REVIEW  ████      17%    │  ║
║  │  ✅ @coder-agent                 │                              │  ║
║  │     Success: 88% (180/205)       │                              │  ║
║  │     Avg time: 25 min             │                              │  ║
║  │                                  │                              │  ║
║  │  ✅ @tester-agent                │  Most Common Failures:       │  ║
║  │     Success: 92% (190/207)       │  • Type errors: 12          │  ║
║  │     Avg time: 12 min             │  • Test failures: 8         │  ║
║  │                                  │  • Build errors: 3          │  ║
║  │  ✅ @reviewer-agent              │                              │  ║
║  │     Success: 97% (195/201)       │                              │  ║
║  │     Avg time: 6 min              │                              │  ║
║  └──────────────────────────────────┴──────────────────────────────┘  ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  Time to Completion (Average per task)                           ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  PLAN    ████████                      8 min                     ┃ ║
║  ┃  CODE    █████████████████████████     25 min                    ┃ ║
║  ┃  TEST    ████████████                  12 min                    ┃ ║
║  ┃  REVIEW  ██████                        6 min                     ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Total: 51 minutes per task (on average)                         ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 16. System Health & Circuit Breaker Monitoring

```
╔═════════════════════════════════════════════════════════════════════════╗
║  System Health - Project A                                 [Refresh 🔄] ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  🔄 Circuit Breaker Status                                        ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  State: ✅ CLOSED        Consecutive Failures: 0 / 5            ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  System is operating normally. Task execution is active.         ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Last State Change: Never                                        ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  ⚠️  HALF_OPEN State (Example)                                   ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  State: 🟡 HALF_OPEN      Consecutive Failures: 5 / 5           ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Testing recovery... Next attempt in 45 seconds.                ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Last Opened: 2024-10-03 14:32:15 (1 minute ago)                ┃ ║
║  ┃  Reason: Database connection timeout                            ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║  ┃  🔴 OPEN State (Example)                                         ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  State: 🔴 OPEN           Consecutive Failures: 5 / 5           ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  ❌ Task execution paused due to system failures.               ┃ ║
║  ┃  Will retry in 38 seconds...                                    ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  Last Opened: 2024-10-03 14:35:22 (22 seconds ago)              ┃ ║
║  ┃  Reason: Too many consecutive task failures                     ┃ ║
║  ┃                                                                   ┃ ║
║  ┃  [Force Reset Circuit] [View Error Logs]                        ┃ ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
║                                                                         ║
║  Recent System Events                                                  ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │ ✅ Circuit breaker closed                          2m ago         │ ║
║  │    System recovered after HALF_OPEN test succeeded               │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ 🔄 Circuit breaker transitioned to HALF_OPEN       3m ago         │ ║
║  │    Attempting recovery after 60 second timeout                    │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ 🔴 Circuit breaker opened                          4m ago         │ ║
║  │    5 consecutive failures detected  [View Details]                │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ ♻️  Task rollback completed                        8m ago         │ ║
║  │    Task #T042 rolled back to clean state                         │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ ⚠️  Task rollback initiated                        8m ago         │ ║
║  │    Task #T042 failed - automatic rollback started                │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ┌────────────────────────────┬────────────────────────────────────┐  ║
║  │  Rollback Statistics       │  Error Rate (Last Hour)            │  ║
║  │                            │                                    │  ║
║  │  Automatic Rollbacks: 3    │  100%│                            │  ║
║  │  Successful: 3             │      │                            │  ║
║  │  Failed: 0                 │   50%│  █                         │  ║
║  │                            │      │  █   █                     │  ║
║  │  Manual Intervention: 0    │   25%│  █   █ █   █              │  ║
║  │                            │      │  █ █ █ █ █ █   █          │  ║
║  │  Success Rate: 100%        │    0%├───────────────────────────  │  ║
║  │                            │      10  20  30  40  50  60  mins │  ║
║  └────────────────────────────┴────────────────────────────────────┘  ║
║                                                                         ║
║  Active Task Monitoring                                                ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │ #T045 · Add auth system · CODE · Running 12m · [Monitor] [Stop]  │ ║
║  │ #T046 · User profile · TEST · Running 8m · [Monitor] [Stop]      │ ║
║  │ #T047 · Payment API · PLAN · Running 4m · [Monitor] [Stop]       │ ║
║  │                                                                   │ ║
║  │ Long-running tasks (>30 min): 0                                   │ ║
║  │ ⚠️  No slow tasks detected                                        │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 17. Security Settings - Keychain & Audit

```
╔═════════════════════════════════════════════════════════════════════════╗
║  Settings - Security                          [Save Changes]            ║
╟─────────────────────────────────────────────────────────────────────────╢
║                                                                         ║
║  🔐 Authentication Keys                                                 ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │                                                                   │ ║
║  │  Registered Devices (3)                                           │ ║
║  │                                                                   │ ║
║  │  ┌─────────────────────────────────────────────────────────────┐ │ ║
║  │  │  💻 MacBook Pro (work-laptop)                              │ │ ║
║  │  │  🔒 Secured with macOS Keychain                            │ │ ║
║  │  │                                                             │ │ ║
║  │  │  • Registered: Oct 1, 2024 at 2:30 PM                      │ │ ║
║  │  │  • Last used: 2 minutes ago                                │ │ ║
║  │  │  • Key ID: key_a1b2c3d4e5                                  │ │ ║
║  │  │  • Storage: Encrypted in Keychain ✅                       │ │ ║
║  │  │                                                             │ │ ║
║  │  │  [Rotate Key] [Revoke Access]                              │ │ ║
║  │  └─────────────────────────────────────────────────────────────┘ │ ║
║  │                                                                   │ ║
║  │  ┌─────────────────────────────────────────────────────────────┐ │ ║
║  │  │  🖥️  Work Desktop (office-pc)                              │ │ ║
║  │  │  🔒 Secured with Windows Credential Manager                │ │ ║
║  │  │                                                             │ │ ║
║  │  │  • Registered: Oct 2, 2024 at 9:15 AM                      │ │ ║
║  │  │  • Last used: 3 hours ago                                  │ │ ║
║  │  │  • Key ID: key_f6g7h8i9j0                                  │ │ ║
║  │  │  • Storage: Encrypted in Credential Manager ✅            │ │ ║
║  │  │                                                             │ │ ║
║  │  │  [Rotate Key] [Revoke Access]                              │ │ ║
║  │  └─────────────────────────────────────────────────────────────┘ │ ║
║  │                                                                   │ ║
║  │  ┌─────────────────────────────────────────────────────────────┐ │ ║
║  │  │  🐧 Linux Server (cloud-dev)                               │ │ ║
║  │  │  🔒 Secured with GNOME Keyring (libsecret)                 │ │ ║
║  │  │                                                             │ │ ║
║  │  │  • Registered: Oct 3, 2024 at 11:45 AM                     │ │ ║
║  │  │  • Last used: 1 day ago                                    │ │ ║
║  │  │  • Key ID: key_k1l2m3n4o5                                  │ │ ║
║  │  │  • Storage: Encrypted in Keyring ✅                        │ │ ║
║  │  │                                                             │ │ ║
║  │  │  [Rotate Key] [Revoke Access]                              │ │ ║
║  │  └─────────────────────────────────────────────────────────────┘ │ ║
║  │                                                                   │ ║
║  │  [+ Register New Device]                                          │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  🛡️ Security Preferences                                               ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │                                                                   │ ║
║  │  [✅] Use OS Keychain for private key encryption (Recommended)   │ ║
║  │       Private keys encrypted with native OS keychain services    │ ║
║  │                                                                   │ ║
║  │  [✅] Automatic key rotation reminders                           │ ║
║  │       Notify when keys are older than 90 days                    │ ║
║  │                                                                   │ ║
║  │  [✅] Require MFA for sensitive operations                       │ ║
║  │       Extra verification for key revocation and rotation         │ ║
║  │                                                                   │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  📋 Audit Log (Immutable)                           [Export] [Filter]  ║
║  ┌───────────────────────────────────────────────────────────────────┐ ║
║  │ 🔐 key_generated                               2m ago             │ ║
║  │    New device "MacBook Pro" registered                            │ ║
║  │    User: john.doe@company.com  IP: 192.168.1.42                   │ ║
║  │    🔒 Record immutable - cannot be modified                       │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ 🔄 workflow_executed                           5m ago             │ ║
║  │    Workflow "plan_code_test" started for Task #T045               │ ║
║  │    User: john.doe@company.com  IP: 192.168.1.42                   │ ║
║  │    🔒 Record immutable - cannot be modified                       │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ ♻️  task_rollback                              8m ago             │ ║
║  │    Task #T042 automatically rolled back due to agent error       │ ║
║  │    Reason: Test failures · Worktree: .sentra/worktrees/task-042   │ ║
║  │    🔒 Record immutable - cannot be modified                       │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ 🔴 circuit_breaker_open                        15m ago            │ ║
║  │    Circuit breaker opened - 5 consecutive failures                │ ║
║  │    Error: Database connection timeout                             │ ║
║  │    🔒 Record immutable - cannot be modified                       │ ║
║  ├───────────────────────────────────────────────────────────────────┤ ║
║  │ 💰 budget_exceeded                             2h ago             │ ║
║  │    Project "E-Commerce" exceeded monthly budget                   │ ║
║  │    Spent: $502.50 · Limit: $500.00                                │ ║
║  │    🔒 Record immutable - cannot be modified                       │ ║
║  └───────────────────────────────────────────────────────────────────┘ ║
║                                                                         ║
║  ℹ️  Audit logs are append-only and cryptographically immutable.       ║
║     Records cannot be modified or deleted, even by administrators.     ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## 18. Mobile Responsive View

```
┌─────────────────────────┐
│  [≡]  SENTRA     [🔔] 👤│
├─────────────────────────┤
│                         │
│  Project A ▼            │
│  Next.js 15 + TS        │
│                         │
├─────────────────────────┤
│                         │
│  ┏━━━━━━━━━━━━━━━━━━┓  │
│  ┃   + New Task     ┃  │
│  ┗━━━━━━━━━━━━━━━━━━┛  │
│                         │
│  Active Tasks (3)       │
│                         │
│  ┌───────────────────┐  │
│  │ #T001             │  │
│  │ Add auth          │  │
│  │ 🟢 CODE 45%       │  │
│  │ 12m ago           │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ #T003             │  │
│  │ Shopping cart     │  │
│  │ 🟡 PLAN 20%       │  │
│  │ 25m ago           │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ #T002 ⚠️          │  │
│  │ Payment bug       │  │
│  │ ❌ FAILED         │  │
│  │ [View] [Retry]    │  │
│  └───────────────────┘  │
│                         │
│  [View All Tasks →]     │
│                         │
│  Recent Activity        │
│  • Task completed 2m    │
│  • Task failed 5m       │
│  • Workflow started 8m  │
│                         │
└─────────────────────────┘
```

## Summary

This visual guide provides comprehensive mockups for:

1. **Dashboard Home** - Project overview with stats and activity
2. **Kanban Board** - Full SDLC workflow visualization
3. **Failed Task Cards** - Clear error highlighting
4. **Task Detail Drawer** - Multi-tab detailed view
5. **Logs Interface** - Real-time, searchable, filterable logs
6. **Files Tab** - Git-like diff viewer
7. **Visual Comparison** - AI-powered design verification
8. **AI Project Analyst** - Large project decomposition wizard
9. **Module Breakdown** - Hierarchical task organization
10. **Dependency Graph** - Visual dependency mapping
11. **Command Palette** - Fast keyboard-driven navigation
12. **Multi-Project View** - Side-by-side project management
13. **Team Management** - Role-based access control UI
14. **Invite Members** - Permission-aware invitation flow
15. **Analytics Dashboard with Cost Tracking** - Performance metrics, budget monitoring, token usage
16. **System Health & Circuit Breaker Monitoring** - Real-time system status, rollback tracking, error rates
17. **Security Settings - Keychain & Audit** - OS keychain integration, device management, immutable audit logs
18. **Mobile View** - Responsive design for on-the-go access

**New Features Added (CIO Recommendations):**
- 💰 **Cost Governance** - Monthly budget tracking, token usage by phase, burn rate analysis
- 🔄 **Circuit Breaker Status** - CLOSED/HALF_OPEN/OPEN states with automatic recovery
- ♻️  **Rollback Monitoring** - Automatic rollback tracking and success rates
- 🔐 **OS Keychain Integration** - Encrypted private keys with native OS security
- 🔒 **Immutable Audit Logs** - Tamper-proof security event tracking

All designs follow the dark violet theme with glassmorphism effects and smooth Framer Motion transitions.
