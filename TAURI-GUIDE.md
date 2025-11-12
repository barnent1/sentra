# Sentra - Native Mac App Guide

**Created by Glen Barnhardt with the help of Claude Code**

---

## What's Happening Now

Sentra is being transformed from a web app into a **native macOS application** using Tauri!

### Current Build Status

✅ **Tauri initialized** - Rust backend is set up
✅ **Backend commands created** - Can read telemetry and projects
✅ **Frontend connected** - React talks to Rust via IPC
🚧 **First build compiling** - Rust is compiling (takes 5-10 minutes first time)

---

## How It Works

```
┌─────────────────────────────────────┐
│     Sentra.app (Native Mac App)     │
├─────────────────────────────────────┤
│                                     │
│  Frontend: Next.js + React          │
│  - Beautiful dark violet UI         │
│  - Your green beaker logo           │
│  - Real-time dashboard              │
│                                     │
└──────────────┬──────────────────────┘
               │ Tauri IPC
               │ (invoke commands)
               ↓
┌─────────────────────────────────────┐
│      Rust Backend (Tauri)           │
├─────────────────────────────────────┤
│                                     │
│  Commands:                          │
│  - get_projects()                   │
│  - get_active_agents()              │
│  - get_dashboard_stats()            │
│  - get_telemetry_logs()             │
│  - get_project_memory()             │
│  - stop_agent()                     │
│                                     │
└──────────────┬──────────────────────┘
               │ File System Access
               ↓
┌─────────────────────────────────────┐
│      Your System                    │
├─────────────────────────────────────┤
│                                     │
│  ~/.claude/tracked-projects.txt     │
│  ~/.claude/telemetry/agents.log     │
│  project/.claude/memory/*.md        │
│                                     │
└─────────────────────────────────────┘
```

---

## Backend Commands

### `get_projects()`

Reads `~/.claude/tracked-projects.txt` and returns all tracked projects:

```rust
// Rust backend
pub fn get_projects() -> Result<Vec<Project>, String> {
    let home = dirs::home_dir()?;
    let tracked_file = home.join(".claude/tracked-projects.txt");
    // Parses file and returns project data
}
```

```typescript
// Frontend TypeScript
const projects = await invoke<Project[]>('get_projects');
```

### `get_telemetry_logs(project, lines)`

Reads telemetry logs for a specific project:

```rust
pub fn get_telemetry_logs(project: String, lines: usize) -> Result<Vec<String>, String> {
    let log_file = home.join(".claude/telemetry/agents.log");
    // Filters by project, returns last N lines
}
```

### `get_project_memory(project)`

Reads project learnings from `.claude/memory/`:

```rust
pub fn get_project_memory(project: String) -> Result<serde_json::Value, String> {
    // Reads gotchas.md, patterns.md, decisions.md
    // Returns as JSON
}
```

---

## Development Workflow

### Running in Development

```bash
# Option 1: Full Tauri app (native window)
cd ~/Projects/claude-code-base/sentra
npm run tauri dev

# Option 2: Web browser (for quick UI testing)
npm run dev -- -p 3002
open http://localhost:3002
```

### Building for Production

```bash
# Build native Mac app
npm run tauri build

# Output will be in:
# src-tauri/target/release/bundle/macos/Sentra.app
```

---

## Mock vs Real Data

The app automatically detects if it's running in Tauri or browser:

```typescript
// In src/lib/tauri.ts
const MOCK_MODE = typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window);
```

- **Browser**: Uses mock data (good for UI development)
- **Tauri app**: Calls real Rust commands (reads actual files)

---

## Project Structure

```
sentra/
├── src/                      # Frontend (Next.js/React)
│   ├── app/
│   │   ├── page.tsx         # Dashboard UI
│   │   └── layout.tsx       # Root layout
│   ├── lib/
│   │   └── tauri.ts         # Tauri command wrappers
│   └── hooks/
│       └── useDashboard.ts  # Dashboard data hook
│
├── src-tauri/               # Backend (Rust/Tauri)
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── lib.rs           # Tauri app setup
│   │   └── commands.rs      # Backend commands
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
│
├── public/
│   └── sentra-logo.png      # Your green beaker icon
│
└── package.json             # npm scripts
```

---

## First Build (Currently Happening)

The first Tauri build takes 5-10 minutes because Rust needs to compile:
- Tauri framework (~200 crates)
- WebView bindings
- macOS system libraries
- All dependencies

**Subsequent builds are fast** (30 seconds) - Rust caches compiled dependencies.

---

## What's Next

Once the build completes, you'll have:

1. **Native Mac app** running in its own window
2. **Real data** from your telemetry files
3. **Fast performance** (native WebView, not Electron)
4. **Menu bar integration** (coming next)
5. **Auto-updates** (coming next)

---

## Troubleshooting

### Port already in use

If you see "EADDRINUSE ::: 3002":
```bash
# Kill the existing dev server
pkill -f "next dev"

# Or use a different port
npm run tauri dev -- -- -p 3003
```

### Build errors

If Rust compilation fails:
```bash
# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri dev
```

### Missing Rust

If you need to install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

---

**The native Mac app is being born! 🎉**

Created by Glen Barnhardt with the help of Claude Code
