# Sentra - AI Agent Control Center

**Mission Control for Your AI Agents**

Native Mac app built with Tauri + Next.js + shadcn/ui + Tailwind CSS

Created by Glen Barnhardt with the help of Claude Code

---

## Overview

Sentra is a beautiful native Mac application that provides a visual interface for monitoring, controlling, and optimizing your AI agents across all projects.

**Status:** Planning/Design Phase

**Will eventually be moved to:** Separate `sentra` repository

---

## Features (Planned)

- 🖥️ **Native Mac Dashboard** - Real-time monitoring with beautiful UI
- 💬 **Agent Chat** - Talk to agents while they work, intervene and guide
- 📊 **Analytics** - Visual insights, cost tracking, performance metrics
- 🔄 **Smart Automation** - Auto-retry failures, intelligent prioritization
- 🎯 **Menu Bar Integration** - Quick access without leaving your workflow
- 🔔 **Native Notifications** - Mac notifications for important events

---

## Tech Stack

**Framework:**
- Tauri 2.x (Rust backend)
- Next.js 14 (React frontend)
- shadcn/ui (Beautiful components)
- Tailwind CSS (Styling)

**Why Tauri?**
- Tiny bundle size (~600KB vs Electron's 100MB+)
- Native macOS WebView (fast, low memory)
- True Mac app experience
- Built-in menu bar, notifications, auto-updates

---

## Design Assets

**App Icon:** Green beaker/flask with "S" logo
- Located in: `sentra/design/app-icon.png`
- Represents AI agents "brewing" solutions
- Clean, modern, professional

**Tagline:** "Mission Control for Your AI Agents"

---

## Project Structure (Planned)

```
sentra/
├── src-tauri/           # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/    # Tauri IPC commands
│   │   └── services/    # Core services
│   └── icons/           # App icons
│
├── src/                 # Next.js frontend
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   └── hooks/           # Custom hooks
│
├── design/              # Design assets
│   └── app-icon.png
│
└── README.md            # This file
```

---

## Development Plan

See [docs/PHASE-II-PLAN.md](../docs/PHASE-II-PLAN.md) for complete planning document.

**Phases:**
1. **Phase 2a:** Core Dashboard - Real-time monitoring
2. **Phase 2b:** Agent Chat - Intervene mid-work
3. **Phase 2c:** Analytics - Visual insights
4. **Phase 2d:** Smart Automation - Auto-retry, prioritization

---

## Getting Started (Future)

```bash
# Install dependencies
cd sentra
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## Requirements

- macOS 10.15+ (Catalina or later)
- Node.js 18+
- Rust (installed automatically)

---

Created by Glen Barnhardt with the help of Claude Code
