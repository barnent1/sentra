# Data Fetching Architecture

**Status:** Approved
**Author:** Architecture Advisor Agent
**Date:** 2025-11-12
**Last Updated:** 2025-11-12
**Reviewers:** Glen Barnhardt

---

## Overview

This document defines how the Quetrex web application fetches and synchronizes data between the backend (Node.js/Express) and frontend (Next.js/React). The architecture prioritizes real-time updates and simplicity.

**Note:** This document is being updated to reflect Quetrex's transition from a Tauri desktop app to a Next.js web application. References to Tauri are historical.

**What this covers:**
- REST API calls for data fetching (via `@/services/quetrex-api`)
- React Server Components for initial page loads
- Server-Sent Events (SSE) for real-time updates
- Best practices for each approach

**What this does NOT cover:**
- State management (see `STATE-MANAGEMENT.md`)
- API design patterns (see `API-DESIGN.md`)
- Authentication (see `AUTHENTICATION.md`)

---

## Core Principle

> **Native-first, reactive data flow with automatic synchronization**

**Rationale:**
Quetrex is a native desktop app built with Tauri, so the primary data fetching mechanism should leverage native capabilities (Tauri Events). This provides the best performance, lowest latency, and most natural integration with the Rust backend. For the optional web version, we use Server-Sent Events for similar reactive behavior.

---

## Pattern: Tauri Events for Reactive Data

**Status:** ✅ Approved
**Mandatory:** YES (for Tauri desktop app)
**Applies To:** All components needing real-time data from the Rust backend

### When to Use

Use Tauri Events when:
- Building the native desktop app (not web)
- Backend (Rust) needs to push updates to frontend
- File system changes (project updates, logs)
- System events (agent status changes, cost updates)
- Performance-critical operations

**Do NOT use** when:
- Building for web (use SSE instead)
- One-time data fetch (use Tauri commands instead)
- Data doesn't change frequently

### Implementation

#### Step 1: Backend - Emit Events

In the Rust backend, emit events when data changes:

```rust
// src-tauri/src/commands.rs
use tauri::Manager;
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub status: String,
    // ... other fields
}

#[tauri::command]
pub async fn update_projects(app: tauri::AppHandle) -> Result<(), String> {
    // Fetch latest projects
    let projects = fetch_projects_from_disk();

    // Emit to all windows
    app.emit_all("projects-updated", projects)
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Background watcher that emits on file changes
pub fn watch_project_changes(app: tauri::AppHandle) {
    tokio::spawn(async move {
        loop {
            // Check for changes
            if let Some(changes) = check_for_changes() {
                let _ = app.emit_all("projects-updated", changes);
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
}
```

#### Step 2: Frontend - Create Hook

Create a reusable React hook for listening to events:

```typescript
// hooks/useTauriEvent.ts
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

export function useTauriEvent<T>(eventName: string, initialValue: T | null = null): T | null {
  const [data, setData] = useState<T | null>(initialValue);

  useEffect(() => {
    // Only run in Tauri environment
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      return;
    }

    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen<T>(eventName, (event) => {
        console.log(`🔄 Received ${eventName}:`, event.payload);
        setData(event.payload);
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [eventName]);

  return data;
}
```

#### Step 3: Usage in Components

Use the hook in your components:

```typescript
// components/ProjectList.tsx
'use client';

import { useTauriEvent } from '@/hooks/useTauriEvent';
import { Project } from '@/types';

export function ProjectList() {
  const projects = useTauriEvent<Project[]>('projects-updated', []);

  return (
    <div>
      <h2>Projects</h2>
      {projects?.map(project => (
        <div key={project.name}>
          {project.name} - {project.status}
        </div>
      ))}
    </div>
  );
}
```

### Directory Structure

```
quetrex/
├── src-tauri/src/
│   ├── commands.rs         # Tauri commands that emit events
│   ├── watcher.rs          # Background watchers
│   └── types.rs            # Shared types
├── src/
│   ├── hooks/
│   │   └── useTauriEvent.ts   # Generic event hook
│   │   └── useDashboard.ts    # Specific dashboard hook
│   ├── types/
│   │   └── index.ts           # TypeScript types (match Rust)
│   └── components/
│       └── ProjectList.tsx    # Components using events
└── tests/
    └── integration/
        └── tauri-events.test.ts
```

### Testing

**Unit Tests:**
```typescript
// tests/unit/useTauriEvent.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTauriEvent } from '@/hooks/useTauriEvent';

// Mock Tauri API
const mockListen = jest.fn();
jest.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
}));

describe('useTauriEvent', () => {
  it('should setup event listener', async () => {
    // ARRANGE
    const eventName = 'test-event';
    const mockUnlisten = jest.fn();
    mockListen.mockResolvedValue(mockUnlisten);

    // ACT
    const { result, unmount } = renderHook(() => useTauriEvent(eventName));

    // ASSERT
    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith(eventName, expect.any(Function));
    });

    // Cleanup
    unmount();
    expect(mockUnlisten).toHaveBeenCalled();
  });
});
```

**Integration Tests:**
```typescript
// tests/integration/tauri-events.test.ts
describe('Tauri Events integration', () => {
  it('should receive and display updated projects', async () => {
    // Test the complete flow from Rust to React
    // This requires Tauri test harness
  });
});
```

**Coverage Requirements:**
- Hook logic: 90%+
- Component integration: 75%+

### Examples

#### ✅ Good Example

```typescript
// hooks/useDashboard.ts - Real example from Quetrex
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getProjects, getActiveAgents, getDashboardStats } from '@/lib/tauri';

export function useDashboard() {
  const [projects, setProjects] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unlistenProjects = null;
    let unlistenAgents = null;
    let unlistenStats = null;

    async function setup() {
      // Initial fetch
      const [projectsData, agentsData, statsData] = await Promise.all([
        getProjects(),
        getActiveAgents(),
        getDashboardStats(),
      ]);

      setProjects(projectsData);
      setAgents(agentsData);
      setStats(statsData);
      setLoading(false);

      // Setup reactive listeners (only in Tauri)
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        unlistenProjects = await listen('projects-updated', (event) => {
          setProjects(event.payload);
        });

        unlistenAgents = await listen('agents-updated', (event) => {
          setAgents(event.payload);
        });

        unlistenStats = await listen('stats-updated', (event) => {
          setStats(event.payload);
        });
      }
    }

    setup();

    return () => {
      if (unlistenProjects) unlistenProjects();
      if (unlistenAgents) unlistenAgents();
      if (unlistenStats) unlistenStats();
    };
  }, []);

  return { projects, agents, stats, loading };
}
```

**Why this is good:**
- Initial fetch + reactive updates pattern
- Cleanup function properly unlistens
- Gracefully handles non-Tauri environment (web)
- TypeScript types for events
- Loading state managed

#### ❌ Bad Example (Anti-pattern)

```typescript
// ❌ WRONG: No cleanup, memory leak
export function BadExample() {
  const [data, setData] = useState(null);

  useEffect(() => {
    listen('some-event', (event) => {
      setData(event.payload);
    });
    // Missing cleanup function!
  }, []);

  return <div>{data}</div>;
}

// ❌ WRONG: Doesn't check for Tauri environment
export function BadExample2() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Will crash in web browser!
    listen('some-event', (event) => {
      setData(event.payload);
    });
  }, []);

  return <div>{data}</div>;
}

// ❌ WRONG: Type mismatch between Rust and TypeScript
// Rust emits: Project { name: String, path: String }
// TypeScript expects: { id: number, name: string }
export function BadExample3() {
  const [data, setData] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    listen('projects-updated', (event) => {
      setData(event.payload); // Runtime error: no 'id' field!
    });
  }, []);

  return <div>{data?.name}</div>;
}
```

**Why these are bad:**
- No cleanup function (memory leaks)
- Doesn't handle web environment (crashes)
- Type mismatches between Rust and TypeScript
- Missing error handling

**How to fix:**
See the Good Example above for proper implementation.

### Common Pitfalls

#### Pitfall 1: Type Mismatches

**Problem:**
Rust structs and TypeScript interfaces must match exactly, but are defined separately.

**Solution:**
```rust
// Rust: src-tauri/src/types.rs
#[derive(Clone, Serialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub status: String,
}
```

```typescript
// TypeScript: src/types/index.ts
// MUST MATCH RUST EXACTLY
export interface Project {
  name: string;      // String -> string
  path: string;      // String -> string
  status: string;    // String -> string
}
```

**Best practice:** Generate TypeScript types from Rust using `ts-rs` crate:
```toml
# Cargo.toml
[dependencies]
ts-rs = "6.2"
```

```rust
#[derive(Serialize, TS)]
#[ts(export)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub status: String,
}
```

This generates `bindings/Project.ts` automatically.

#### Pitfall 2: Forgetting Cleanup

**Problem:**
Event listeners not removed on unmount cause memory leaks.

**Solution:**
```typescript
// ❌ WRONG
useEffect(() => {
  listen('event', handler);
}, []);

// ✅ CORRECT
useEffect(() => {
  let unlisten = null;

  const setup = async () => {
    unlisten = await listen('event', handler);
  };

  setup();

  return () => {
    if (unlisten) unlisten();
  };
}, []);
```

#### Pitfall 3: Web/Tauri Environment Detection

**Problem:**
Code assumes Tauri is always available, crashes in web builds.

**Solution:**
```typescript
// ✅ CORRECT: Check environment first
useEffect(() => {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    console.log('Not in Tauri environment, skipping event setup');
    return;
  }

  // Safe to use Tauri APIs here
  const setup = async () => {
    const unlisten = await listen('event', handler);
    return unlisten;
  };

  let cleanup;
  setup().then(fn => cleanup = fn);

  return () => {
    if (cleanup) cleanup();
  };
}, []);
```

### Performance Considerations

**Optimization tips:**
- Debounce high-frequency events (file watchers)
- Batch multiple related events into one emission
- Use event filtering to only update affected components
- Consider event priority (critical vs nice-to-have)

**Benchmarks:**
- Event latency: < 50ms (Rust → React)
- Memory overhead: ~1KB per listener
- CPU usage: < 1% (idle), < 5% (active updates)

**When to optimize:**
- More than 10 updates per second
- Large payloads (> 100KB)
- Many simultaneous listeners (> 20)

---

## Alternative Patterns

### Pattern: Server-Sent Events (SSE)

**Status:** Approved (for web builds)

**When to use instead:**
- Building web version (not Tauri desktop)
- Need real-time updates in browser
- Server→Client data flow only

**Tradeoffs:**

| Aspect | Tauri Events | Server-Sent Events |
|--------|-------------|---------------------|
| Complexity | Low (native) | Medium (HTTP stream) |
| Performance | Excellent (IPC) | Good (HTTP) |
| Latency | < 50ms | 100-500ms |
| Scalability | Single app | Many clients |
| Best For | Native desktop | Web browser |

**Example:**
```typescript
// hooks/useSSE.ts (for web version)
export function useSSE<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [endpoint]);

  return data;
}
```

### Pattern: Tauri Commands (One-time Fetch)

**Status:** Approved

**When to use instead:**
- One-time data fetch (not reactive)
- User-initiated actions (button clicks)
- Infrequent updates

**Example:**
```typescript
// lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';

export async function getProjects(): Promise<Project[]> {
  return await invoke('get_projects');
}

// Usage
const projects = await getProjects();
```

---

## Migration Guide

If you have existing code using polling or fetch in useEffect:

### Assessment

1. **Identify current pattern:**
   ```bash
   python3 .claude/scripts/architecture-scanner.py .
   ```

2. **Count files to migrate:**
   ```bash
   grep -r "useEffect.*fetch" src/ | wc -l
   ```

3. **Estimate effort:**
   - Small project (< 10 files): 2-4 hours
   - Medium project (10-50 files): 8-16 hours
   - Large project (50+ files): 2-3 days

### Step-by-Step Migration

#### Phase 1: Setup Tauri Event Infrastructure

- [x] Add event emission to Rust backend (already done in `watcher.rs`)
- [x] Create `useTauriEvent` hook (already done)
- [x] Test events work end-to-end

#### Phase 2: Migrate Components One-by-One

**For each component:**

1. **Identify the data fetch:**
   ```typescript
   // OLD
   useEffect(() => {
     const interval = setInterval(() => {
       fetch('/api/projects')
         .then(res => res.json())
         .then(data => setProjects(data));
     }, 5000);
     return () => clearInterval(interval);
   }, []);
   ```

2. **Replace with Tauri event:**
   ```typescript
   // NEW
   const projects = useTauriEvent<Project[]>('projects-updated', []);
   ```

3. **Remove old code:**
   - Delete polling/fetch logic
   - Delete state management (hook handles it)
   - Keep rendering logic

#### Phase 3: Validation

- [ ] Run tests: `npm test`
- [ ] Check for memory leaks in DevTools
- [ ] Verify all listeners clean up
- [ ] Run architecture scanner

### Rollback Plan

If issues arise:

1. **Keep both patterns temporarily:**
   ```typescript
   const USE_TAURI_EVENTS = true; // Feature flag

   const projects = USE_TAURI_EVENTS
     ? useTauriEvent('projects-updated', [])
     : useFetchPolling('/api/projects');
   ```

2. **Revert individual components:**
   ```bash
   git checkout HEAD~1 -- src/components/ProjectList.tsx
   ```

---

## Validation & Enforcement

### Manual Validation

**Code review checklist:**
- [ ] Event listener has cleanup function
- [ ] Environment detection for Tauri vs web
- [ ] TypeScript types match Rust structs
- [ ] Error handling for event failures
- [ ] Initial data fetch + reactive updates pattern

### Automated Validation

**Architecture Scanner:**
```bash
python3 .claude/scripts/architecture-scanner.py .
```

**Expected output:**
```
✅ Data Fetching: Tauri Events used consistently in 12 files
⚠️ Found 3 files still using polling - needs migration
```

**CI/CD Integration:**
```yaml
# .github/workflows/test.yml
- name: Validate Architecture
  run: |
    python3 .claude/scripts/architecture-scanner.py . --format=json > report.json
    # Check for polling/useEffect patterns
    if grep -r "setInterval.*fetch" src/; then
      echo "❌ Found polling pattern - use Tauri Events instead"
      exit 1
    fi
```

### Metrics

Track these metrics over time:

- **Tauri Event Coverage:** 100% of reactive components
- **Polling Pattern Count:** 0 instances
- **Average Event Latency:** < 50ms
- **Memory Leaks:** 0 instances

---

## Troubleshooting

### Issue: Events not received in frontend

**Symptoms:**
- Component doesn't update
- No console logs from event listener

**Cause:**
- Tauri environment not detected
- Listener not properly registered
- Event name mismatch

**Solution:**
```typescript
// Debug steps:
console.log('Is Tauri?', '__TAURI_INTERNALS__' in window);
console.log('Listening to:', eventName);

// Check Rust side:
println!("Emitting event: {}", event_name);
```

### Issue: Memory leaks / multiple listeners

**Symptoms:**
- Memory usage grows over time
- Multiple event handlers fire

**Cause:**
- Missing cleanup function
- Re-registering listeners on re-renders

**Solution:**
```typescript
useEffect(() => {
  let unlisten = null;

  const setup = async () => {
    unlisten = await listen('event', handler);
  };

  setup();

  // MUST have this cleanup!
  return () => {
    if (unlisten) unlisten();
  };
}, []); // Empty deps - register once
```

### Issue: Type errors at runtime

**Symptoms:**
- `Cannot read property 'x' of undefined`
- Type mismatch errors

**Cause:**
- Rust struct changed but TypeScript type didn't
- Optional fields not handled

**Solution:**
```typescript
// Add type guards
function isValidProject(data: unknown): data is Project {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'path' in data
  );
}

// Use in handler
listen('projects-updated', (event) => {
  if (isValidProject(event.payload)) {
    setProjects(event.payload);
  } else {
    console.error('Invalid project data:', event.payload);
  }
});
```

### Getting Help

If you encounter issues:

1. **Check examples:** See `src/hooks/useDashboard.ts`
2. **Run tests:** `npm test tests/integration/tauri-events.test.ts`
3. **Tauri docs:** https://tauri.app/v1/guides/features/events/
4. **Ask team:** #engineering-help channel

---

## References

### Official Documentation
- [Tauri Events](https://tauri.app/v1/guides/features/events/)
- [Tauri IPC](https://tauri.app/v1/guides/features/command/)
- [React useEffect](https://react.dev/reference/react/useEffect)

### Best Practices
- [Tauri Security Best Practices](https://tauri.app/v1/guides/features/security/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

### Related Patterns
- State Management: See `docs/architecture/STATE-MANAGEMENT.md`
- API Design: See `docs/architecture/API-DESIGN.md`

### Examples in This Codebase
- `src/hooks/useDashboard.ts`: Complete dashboard with events
- `src/hooks/useTauriEvent.ts`: Generic event hook
- `src-tauri/src/watcher.rs`: Background event emitter

---

## Decision Log

| Date | Decision | Rationale | Decision Maker |
|------|----------|-----------|----------------|
| 2025-11-12 | Tauri Events as primary pattern | Native performance, lowest latency, natural Tauri integration | Glen Barnhardt |
| 2025-11-12 | SSE as web fallback | Browser compatibility, similar reactive pattern | Glen Barnhardt |

---

## Appendix

### TypeScript Types

```typescript
// src/types/index.ts
export interface Project {
  name: string;
  path: string;
  activeAgents: number;
  totalIssues: number;
  completedIssues: number;
  monthlyCost: number;
  status: 'active' | 'idle' | 'error';
}

export interface Agent {
  id: string;
  project: string;
  issue: number;
  title: string;
  phase: string;
  elapsedMinutes: number;
  cost: number;
  status: 'running' | 'completed' | 'failed';
}

export interface DashboardStats {
  activeAgents: number;
  totalProjects: number;
  todayCost: number;
  monthlyBudget: number;
  successRate: number;
}
```

### Event Names

Standard event names used in Quetrex:

- `projects-updated`: Project list changed
- `agents-updated`: Agent status changed
- `stats-updated`: Dashboard stats changed
- `logs-updated`: New logs available
- `notification`: User notification

---

**Version:** 1.0.0
**Maintained By:** Architecture Advisor Agent
**Next Review:** 2026-01-12
