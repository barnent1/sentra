# Tauri Cleanup - COMPLETED

**Status**: RESOLVED - File renamed to `@/services/sentra-api`
**Date**: 2025-11-20

**Note**: This file is kept for historical reference. The `@/lib/tauri` file has been renamed to `@/services/sentra-api` to better reflect its purpose as a typed API client for backend endpoints.

---

## Files Requiring Changes

The following files import `@/lib/tauri` and must be updated:

### Components (8 files)

1. `/Users/barnent1/Projects/sentra/src/components/Settings.tsx`
   - Likely using: Tauri store for settings
   - Replace with: localStorage

2. `/Users/barnent1/Projects/sentra/src/components/ArchitectChat.tsx`
   - Likely using: Tauri IPC or file system
   - Replace with: REST API calls

3. `/Users/barnent1/Projects/sentra/src/components/NewProjectModal.tsx`
   - Likely using: Tauri file system (directory picker)
   - Replace with: Text input for project path

4. `/Users/barnent1/Projects/sentra/src/components/SpecViewer.tsx`
   - Likely using: Tauri file system
   - Replace with: Backend API

5. `/Users/barnent1/Projects/sentra/src/components/ProjectDetailPanel.tsx`
   - Likely using: Tauri IPC
   - Replace with: REST API

6. `/Users/barnent1/Projects/sentra/src/components/ActivityFeed.tsx`
   - Likely using: Tauri IPC
   - Replace with: REST API

7. `/Users/barnent1/Projects/sentra/src/components/PRReviewPanel.tsx`
   - Likely using: Tauri IPC
   - Replace with: REST API

### Hooks (3 files)

8. `/Users/barnent1/Projects/sentra/src/hooks/useAgentStream.ts`
   - Likely using: Tauri events/streaming
   - Replace with: WebSocket or SSE

9. `/Users/barnent1/Projects/sentra/src/hooks/useGitHubIssue.ts`
   - Likely using: Tauri IPC
   - Replace with: fetch/REST API

10. `/Users/barnent1/Projects/sentra/src/hooks/useDashboard.ts`
    - Likely using: Tauri store or IPC
    - Replace with: localStorage + REST API

---

## Replacement Strategy

### For Settings/Local Storage

**Before (Tauri)**:
```typescript
import { store } from '@/lib/tauri'

// Save settings
await store.set('settings', settings)

// Load settings
const settings = await store.get('settings')
```

**After (Web)**:
```typescript
// Save settings
localStorage.setItem('settings', JSON.stringify(settings))

// Load settings
const settings = JSON.parse(localStorage.getItem('settings') || '{}')
```

### For IPC/API Calls

**Before (Tauri)**:
```typescript
import { invoke } from '@/lib/tauri'

// Call Rust backend
const result = await invoke('get_projects')
```

**After (Web)**:
```typescript
// Call REST API
const response = await fetch('/api/projects')
const result = await response.json()
```

### For File System

**Before (Tauri)**:
```typescript
import { dialog } from '@/lib/tauri'

// Open directory picker
const path = await dialog.open({
  directory: true
})
```

**After (Web)**:
```typescript
// Use text input (file system not available in browser)
<input
  type="text"
  placeholder="Enter project path"
  value={projectPath}
  onChange={(e) => setProjectPath(e.target.value)}
/>
```

### For Events/Streaming

**Before (Tauri)**:
```typescript
import { listen } from '@/lib/tauri'

// Listen to events
const unlisten = await listen('agent-progress', (event) => {
  console.log(event.payload)
})
```

**After (Web)**:
```typescript
// Use Server-Sent Events or WebSocket
const eventSource = new EventSource('/api/agent-stream')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log(data)
}
```

---

## Quick Fix Option

If you need to deploy ASAP, create a stub file:

### Create `/Users/barnent1/Projects/sentra/src/lib/tauri.ts`

```typescript
/**
 * Tauri compatibility shims for web deployment
 * These are temporary stubs to allow build to succeed
 * TODO: Replace with proper web implementations
 */

// Store (use localStorage)
export const store = {
  async get(key: string) {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  },
  async set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  async delete(key: string) {
    localStorage.removeItem(key)
  }
}

// IPC (stub - will fail at runtime)
export async function invoke(command: string, args?: unknown) {
  console.warn(`invoke() called with ${command} - not implemented for web`)
  throw new Error('Tauri IPC not available in web deployment')
}

// Dialog (stub)
export const dialog = {
  async open(options?: unknown) {
    console.warn('dialog.open() - not available in web')
    return null
  }
}

// Events (stub)
export async function listen(event: string, handler: (event: any) => void) {
  console.warn(`listen() called for ${event} - not implemented for web`)
  return () => {} // unlisten function
}

// File system (stub)
export const fs = {
  async readTextFile(path: string) {
    throw new Error('File system not available in web deployment')
  },
  async writeTextFile(path: string, contents: string) {
    throw new Error('File system not available in web deployment')
  }
}
```

**Warning**: This allows build to succeed but features using these stubs will fail at runtime. You must replace with proper web implementations.

---

## Recommended Approach

1. **Create stub file** (above) to get build working
2. **Deploy to preview** to verify build/deployment works
3. **Systematically replace** each Tauri usage with web implementation
4. **Test each component** as you update it
5. **Remove stub file** when all components updated

---

## Testing After Changes

After removing Tauri code:

```bash
# 1. Build succeeds
npm run build

# 2. No errors in output
# Should see: ✓ Compiled successfully

# 3. Test production build locally
npm run start

# 4. Deploy to preview
vercel  # or netlify deploy

# 5. Test all features work
```

---

## When Build Succeeds

See:
- `/Users/barnent1/Projects/sentra/docs/deployment/QUICK-START.md` - Deploy in 5 minutes
- `/Users/barnent1/Projects/sentra/docs/deployment/CHECKLIST.md` - Full deployment checklist

---

*Generated: 2025-11-17*
