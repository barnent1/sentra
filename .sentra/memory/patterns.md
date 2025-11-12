# Architectural Patterns for Next.js 15 Full-Stack Applications

This document defines the comprehensive architectural patterns for building modern Next.js 15 applications with App Router, TypeScript, and Tauri integration.

**Last Updated:** 2025-11-12
**Version:** 1.0.0
**Context:** Sentra Project - Voice-First AI Assistant Platform

---

## Pattern: Server-Sent Events for Reactive Data

**ID:** `pattern-sse-reactive-data`
**Category:** Data Fetching
**Mandatory:** NO
**Confidence:** HIGH

**When to Use:**
- Real-time dashboard updates (server→client)
- Reactive data streams (metrics, logs, status updates)
- One-way data flow from server to client
- Need automatic reconnection and simple implementation
- NOT for bidirectional communication

**Implementation:**
```typescript
// Client-side hook
import { useEffect, useState } from 'react';

export function useSSEData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    eventSource.onerror = (error) => {
      setError(new Error('SSE connection failed'));
      eventSource.close();
    };

    return () => eventSource.close();
  }, [endpoint]);

  return { data, error };
}

// API Route: app/api/stream/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const data = `data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }, 1000);

      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Detection Rules:**
- File pattern: `hooks/use*.ts`, `app/api/*/route.ts`
- Content pattern: `EventSource|text/event-stream|ReadableStream`
- Context: Real-time data updates

**Validation:**
- ✅ PASS if: Uses EventSource API, auto-reconnection handled, cleanup in useEffect
- ❌ FAIL if: No error handling, memory leaks, missing cleanup

**Testing Requirements:**
- Test connection establishment
- Test data updates
- Test error handling and reconnection
- Test cleanup on unmount

**Examples:**
- ✅ Good: Hook with cleanup, error handling, TypeScript types
- ❌ Bad: No cleanup function, no error boundaries, polling instead

**References:**
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Next.js: Streaming](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)

---

## Pattern: Tauri Events for Native App Reactivity

**ID:** `pattern-tauri-events-reactive`
**Category:** Data Fetching
**Mandatory:** YES (for Tauri apps)
**Confidence:** HIGH

**When to Use:**
- Native desktop apps using Tauri
- Backend (Rust) needs to push updates to frontend
- File system changes, system events, background processes
- Native performance-critical operations

**Implementation:**
```typescript
// Frontend hook
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

export function useTauriEvent<T>(eventName: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen<T>(eventName, (event) => {
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

// Usage
const projects = useTauriEvent<Project[]>('projects-updated');

// Backend (Rust): src-tauri/src/commands.rs
use tauri::Manager;

#[tauri::command]
async fn update_projects(app: tauri::AppHandle) -> Result<(), String> {
    let projects = fetch_projects();

    // Emit event to all windows
    app.emit_all("projects-updated", projects)
        .map_err(|e| e.to_string())?;

    Ok(())
}
```

**Detection Rules:**
- File pattern: `hooks/use*.ts`, `src-tauri/src/**/*.rs`
- Content pattern: `listen<.*>\(.*event.*\)|app\.emit`
- Context: Tauri desktop app

**Validation:**
- ✅ PASS if: Cleanup function registered, TypeScript types match Rust types
- ❌ FAIL if: Memory leaks, type mismatches, missing error handling

**Testing Requirements:**
- Test event emission from Rust
- Test event reception in React
- Test type safety across boundary
- Test cleanup and memory management

**Examples:**
- ✅ Good: Type-safe events, cleanup, graceful degradation for web builds
- ❌ Bad: No cleanup, any types, crashes in web mode

**References:**
- [Tauri: Events](https://tauri.app/v1/guides/features/events/)
- [Tauri: IPC](https://tauri.app/v1/guides/features/command/)

---

## Pattern: React Server Components for Data Fetching

**ID:** `pattern-rsc-data-fetching`
**Category:** Data Fetching
**Mandatory:** YES (for Next.js 15)
**Confidence:** HIGH

**When to Use:**
- Initial page load data
- SEO-critical content
- Data that doesn't need real-time updates
- Reduce client-side JavaScript bundle size

**Implementation:**
```typescript
// app/dashboard/page.tsx (Server Component - default)
import { db } from '@/lib/db';

// This runs on the server only
async function getProjects() {
  const projects = await db.project.findMany({
    include: { agents: true },
  });
  return projects;
}

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div>
      <h1>Projects</h1>
      <ProjectList projects={projects} />
    </div>
  );
}

// components/ProjectList.tsx (Client Component for interactivity)
'use client';

import { useState } from 'react';

export function ProjectList({ projects }) {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      {projects.map(project => (
        <div key={project.id} onClick={() => setSelected(project)}>
          {project.name}
        </div>
      ))}
    </div>
  );
}
```

**Detection Rules:**
- File pattern: `app/**/page.tsx`, `app/**/layout.tsx`
- Content pattern: `async function.*Page|await.*fetch|await.*db`
- Context: Next.js App Router, NO 'use client' directive

**Validation:**
- ✅ PASS if: Async server component, no client-side state, proper error boundaries
- ❌ FAIL if: Using useState/useEffect, window/document access, 'use client' directive

**Testing Requirements:**
- Test SSR output
- Test data fetching errors
- Test loading states
- Integration tests for data flow

**Examples:**
- ✅ Good: Async page component, server-side data fetch, client component for interactivity
- ❌ Bad: Fetching in useEffect, client-side data loading, no loading states

**References:**
- [Next.js: Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React: Server Components](https://react.dev/reference/react/use-server)

---

## Pattern: React Query for Client-Side State

**ID:** `pattern-react-query-state`
**Category:** State Management
**Mandatory:** YES (for server state)
**Confidence:** HIGH

**When to Use:**
- Fetching, caching, and synchronizing server state
- Mutations with optimistic updates
- Automatic background refetching
- Request deduplication and caching

**Implementation:**
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// app/providers.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Detection Rules:**
- File pattern: `hooks/use*.ts`, `app/providers.tsx`
- Content pattern: `useQuery|useMutation|QueryClientProvider`
- Context: Client components needing server state

**Validation:**
- ✅ PASS if: QueryClient configured, proper cache invalidation, error handling
- ❌ FAIL if: No cache strategy, missing error boundaries, no loading states

**Testing Requirements:**
- Test query execution
- Test cache behavior
- Test mutations and invalidation
- Test error scenarios

**Examples:**
- ✅ Good: Centralized QueryClient, typed hooks, cache invalidation strategy
- ❌ Bad: Multiple QueryClients, no error handling, synchronous state

**References:**
- [TanStack Query: Overview](https://tanstack.com/query/latest)
- [Next.js + React Query](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

---

## Pattern: Local UI State with useState

**ID:** `pattern-usestate-local-ui`
**Category:** State Management
**Mandatory:** YES (for local UI state)
**Confidence:** HIGH

**When to Use:**
- Form input state
- UI toggles (modals, dropdowns, tabs)
- Component-specific temporary state
- State that doesn't need to be shared

**Implementation:**
```typescript
'use client';

import { useState } from 'react';

export function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'api'>('general');

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Settings</button>

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tab value="general">General</Tab>
            <Tab value="api">API Keys</Tab>
          </Tabs>

          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'api' && <ApiSettings />}
        </Modal>
      )}
    </>
  );
}
```

**Detection Rules:**
- File pattern: `components/**/*.tsx`
- Content pattern: `useState<[^>]+>\(`
- Context: Client components with local state

**Validation:**
- ✅ PASS if: Used for local UI only, proper TypeScript types, cleanup on unmount
- ❌ FAIL if: Used for server data, prop drilling 3+ levels, no types

**Testing Requirements:**
- Test state updates
- Test user interactions
- Test edge cases (multiple rapid clicks)

**Examples:**
- ✅ Good: Modal state, form inputs, UI toggles
- ❌ Bad: API data, shared state across components, complex business logic

**References:**
- [React: useState](https://react.dev/reference/react/useState)
- [Next.js: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

---

## Pattern: Context for Shared UI State

**ID:** `pattern-context-shared-ui`
**Category:** State Management
**Mandatory:** CONDITIONAL (when prop drilling > 2 levels)
**Confidence:** HIGH

**When to Use:**
- Theme (dark/light mode)
- User preferences
- UI settings (sidebar collapsed, language)
- State shared across 3+ component levels

**Implementation:**
```typescript
// contexts/theme-context.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Usage
export function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={theme === 'dark' ? 'bg-black' : 'bg-white'}
    >
      Toggle Theme
    </button>
  );
}
```

**Detection Rules:**
- File pattern: `contexts/**/*.tsx`, `app/providers.tsx`
- Content pattern: `createContext|useContext|Provider`
- Context: Shared UI state

**Validation:**
- ✅ PASS if: Error thrown if used outside provider, TypeScript types, single responsibility
- ❌ FAIL if: Used for server state, too many contexts nested, no error handling

**Testing Requirements:**
- Test provider renders
- Test context updates
- Test error when used outside provider

**Examples:**
- ✅ Good: Theme, user preferences, UI settings
- ❌ Bad: API data, complex business logic, rarely-used state

**References:**
- [React: useContext](https://react.dev/reference/react/useContext)
- [React: Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)

---

## Pattern: Zod for Input Validation

**ID:** `pattern-zod-validation`
**Category:** API Design
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- All API route handlers
- Form validation
- Environment variable validation
- External data parsing

**Implementation:**
```typescript
// lib/validations/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().min(1),
  budget: z.number().positive().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createProjectSchema } from '@/lib/validations/project';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and parse
    const data = createProjectSchema.parse(body);

    // Now data is typed and validated
    const project = await db.project.create({ data });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Detection Rules:**
- File pattern: `app/api/**/route.ts`, `lib/validations/*.ts`
- Content pattern: `z\.(object|string|number)|\.parse\(|\.safeParse\(`
- Context: API routes, form validation

**Validation:**
- ✅ PASS if: All inputs validated, proper error handling, TypeScript types inferred
- ❌ FAIL if: No validation, manual type casting, ignored errors

**Testing Requirements:**
- Test valid inputs
- Test invalid inputs
- Test error messages
- Test TypeScript inference

**Examples:**
- ✅ Good: Schema-driven validation, type inference, clear error messages
- ❌ Bad: Manual validation, unchecked inputs, any types

**References:**
- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Pattern: REST API with Standard Methods

**ID:** `pattern-rest-api-standard`
**Category:** API Design
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- CRUD operations
- Resource-based endpoints
- Standard HTTP semantics needed

**Implementation:**
```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const projects = await db.project.findMany();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body);
    const project = await db.project.create({ data });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    // Handle error
  }
}

// app/api/projects/[id]/route.ts
// GET /api/projects/:id - Get one project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await db.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/:id - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const data = updateProjectSchema.parse(body);

  const project = await db.project.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.project.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
```

**Detection Rules:**
- File pattern: `app/api/**/route.ts`
- Content pattern: `export async function (GET|POST|PATCH|DELETE)`
- Context: API routes

**Validation:**
- ✅ PASS if: RESTful conventions, proper status codes, error handling
- ❌ FAIL if: Wrong HTTP methods, missing status codes, no error handling

**Testing Requirements:**
- Test all CRUD operations
- Test error cases (404, 400, 500)
- Test validation
- Integration tests

**Examples:**
- ✅ Good: RESTful structure, proper status codes, validation
- ❌ Bad: GET requests with side effects, wrong status codes, no validation

**References:**
- [REST API Tutorial](https://restfulapi.net/)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Pattern: Client Component Boundaries

**ID:** `pattern-client-component-boundaries`
**Category:** Component Architecture
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- Need browser APIs (window, localStorage)
- Need React hooks (useState, useEffect, useContext)
- Need event listeners
- Need interactivity

**Implementation:**
```typescript
// ❌ WRONG: Everything is client-side
'use client';

export default async function Page() {
  const projects = await db.project.findMany(); // ERROR: Can't use async in client component
  return <div>{projects.length}</div>;
}

// ✅ CORRECT: Server component with client island
// app/dashboard/page.tsx (Server Component - NO 'use client')
import { ProjectList } from '@/components/ProjectList';

async function getProjects() {
  return await db.project.findMany();
}

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Pass data to client component */}
      <ProjectList projects={projects} />
    </div>
  );
}

// components/ProjectList.tsx (Client Component - HAS 'use client')
'use client';

import { useState } from 'react';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      {projects.map(project => (
        <button
          key={project.id}
          onClick={() => setSelected(project.id)}
          className={selected === project.id ? 'selected' : ''}
        >
          {project.name}
        </button>
      ))}
    </div>
  );
}
```

**Detection Rules:**
- File pattern: `components/**/*.tsx`, `app/**/page.tsx`
- Content pattern: `'use client'|useState|useEffect|onClick`
- Context: Component needs interactivity

**Validation:**
- ✅ PASS if: Minimal client components, server components by default, proper data flow
- ❌ FAIL if: Everything 'use client', server data fetching in client components

**Testing Requirements:**
- Test server rendering
- Test hydration
- Test client interactivity
- Test data flow

**Examples:**
- ✅ Good: Server component parent, client component for interactivity only
- ❌ Bad: Root 'use client', data fetching in client components

**References:**
- [Next.js: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React: 'use client'](https://react.dev/reference/react/use-client)

---

## Pattern: Typescript Strict Mode

**ID:** `pattern-typescript-strict`
**Category:** Code Quality
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- All TypeScript projects
- No exceptions

**Implementation:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

```typescript
// ❌ WRONG
function processData(data: any) {
  return data.map(item => item.value);
}

// ✅ CORRECT
interface DataItem {
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}

// ❌ WRONG
// @ts-ignore
const value = dangerousFunction();

// ✅ CORRECT
function isDangerousResult(obj: unknown): obj is DangerousResult {
  return typeof obj === 'object' && obj !== null && 'value' in obj;
}

const result = dangerousFunction();
if (isDangerousResult(result)) {
  const value = result.value; // Type-safe
}
```

**Detection Rules:**
- File pattern: `tsconfig.json`, `**/*.ts`, `**/*.tsx`
- Content pattern: `any|@ts-ignore|@ts-expect-error`
- Context: All TypeScript files

**Validation:**
- ✅ PASS if: Strict mode enabled, no any types, no ts-ignore
- ❌ FAIL if: Strict mode off, any types, ts-ignore comments

**Testing Requirements:**
- Run `tsc --noEmit` in CI
- No compilation errors
- No type warnings

**Examples:**
- ✅ Good: Explicit types, type guards, strict null checks
- ❌ Bad: any types, ts-ignore, loose null checks

**References:**
- [TypeScript: Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript: Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

## Pattern: Environment Variable Validation

**ID:** `pattern-env-validation`
**Category:** Security
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- Application startup
- All environment-dependent code
- API keys and secrets

**Implementation:**
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // API Keys
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),

  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),

  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
}

// Export validated env
export const env = validateEnv();

// Usage in other files
import { env } from '@/lib/env';

const apiKey = env.OPENAI_API_KEY; // Type-safe, guaranteed to exist
```

**Detection Rules:**
- File pattern: `lib/env.ts`, `**/*.ts`
- Content pattern: `process\.env\.|z\.object.*API_KEY`
- Context: Environment variables

**Validation:**
- ✅ PASS if: All env vars validated at startup, TypeScript types, app fails fast
- ❌ FAIL if: Direct process.env access, no validation, silent failures

**Testing Requirements:**
- Test with valid env vars
- Test with missing env vars (should exit)
- Test with invalid env vars (should exit)

**Examples:**
- ✅ Good: Zod validation, type-safe, fail fast
- ❌ Bad: Unchecked process.env, runtime errors, default values for secrets

**References:**
- [Zod: Environment Variables](https://zod.dev/)
- [Next.js: Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## Pattern: SQL Injection Prevention with Prisma ORM

**ID:** `pattern-sql-injection-prevention`
**Category:** Security
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- All database operations
- Any user input in queries

**Implementation:**
```typescript
// ❌ WRONG: Raw SQL with user input
const projects = await db.$queryRaw`
  SELECT * FROM projects WHERE name = ${userInput}
`;

// ❌ WRONG: String interpolation
const projects = await db.$queryRawUnsafe(
  `SELECT * FROM projects WHERE name = '${userInput}'`
);

// ✅ CORRECT: Prisma query builder (parameterized by default)
const projects = await db.project.findMany({
  where: {
    name: userInput,
  },
});

// ✅ CORRECT: If you MUST use raw SQL, use parameterized queries
import { Prisma } from '@prisma/client';

const projects = await db.$queryRaw(
  Prisma.sql`SELECT * FROM projects WHERE name = ${userInput}`
);
```

**Detection Rules:**
- File pattern: `app/api/**/route.ts`, `lib/**/*.ts`
- Content pattern: `\$queryRaw|\$executeRaw|db\.(project|agent|user)`
- Context: Database operations

**Validation:**
- ✅ PASS if: Prisma ORM, parameterized queries, no string interpolation
- ❌ FAIL if: $queryRawUnsafe, string interpolation, dynamic SQL

**Testing Requirements:**
- Test with SQL injection attempts
- Test escaping of special characters
- Security audit of all database queries

**Examples:**
- ✅ Good: Prisma query builder, parameterized raw queries
- ❌ Bad: String concatenation, $queryRawUnsafe, dynamic table names

**References:**
- [Prisma: SQL Injection Prevention](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)
- [OWASP: SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)

---

## Pattern: XSS Prevention in Next.js

**ID:** `pattern-xss-prevention`
**Category:** Security
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- Displaying user-generated content
- Rendering HTML from external sources
- All text input/output

**Implementation:**
```typescript
// ✅ SAFE: React automatically escapes by default
export function UserComment({ text }: { text: string }) {
  return <div>{text}</div>; // Safe - React escapes
}

// ❌ DANGEROUS: dangerouslySetInnerHTML
export function UnsafeComponent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />; // XSS risk!
}

// ✅ SAFE: Sanitize HTML if you must render it
import DOMPurify from 'isomorphic-dompurify';

export function SafeHtmlComponent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href'],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// ✅ SAFE: Use markdown library
import ReactMarkdown from 'react-markdown';

export function MarkdownComponent({ markdown }: { markdown: string }) {
  return <ReactMarkdown>{markdown}</ReactMarkdown>;
}
```

**Detection Rules:**
- File pattern: `components/**/*.tsx`, `app/**/*.tsx`
- Content pattern: `dangerouslySetInnerHTML|innerHTML`
- Context: Rendering user content

**Validation:**
- ✅ PASS if: React default escaping, sanitization library, markdown parser
- ❌ FAIL if: Unsanitized dangerouslySetInnerHTML, innerHTML manipulation

**Testing Requirements:**
- Test XSS attack vectors
- Test script injection
- Test HTML entity escaping

**Examples:**
- ✅ Good: React escaping, DOMPurify, ReactMarkdown
- ❌ Bad: Unsanitized HTML rendering, eval(), innerHTML

**References:**
- [OWASP: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)

---

## Pattern: Next.js Image Optimization

**ID:** `pattern-nextjs-image-optimization`
**Category:** Performance
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- All images in the application
- User avatars, logos, photos

**Implementation:**
```typescript
// ❌ WRONG: Regular img tag
<img src="/logo.png" alt="Logo" width="200" height="100" />

// ✅ CORRECT: Next.js Image component
import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={200}
      height={100}
      priority // For above-fold images
    />
  );
}

// ✅ CORRECT: Dynamic images
export function UserAvatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={`${name}'s avatar`}
      width={40}
      height={40}
      className="rounded-full"
      loading="lazy" // For below-fold images
    />
  );
}

// ✅ CORRECT: External images (configure in next.config.js)
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
};
```

**Detection Rules:**
- File pattern: `components/**/*.tsx`, `app/**/*.tsx`
- Content pattern: `<img |<Image`
- Context: Image rendering

**Validation:**
- ✅ PASS if: Using next/image, width/height specified, alt text
- ❌ FAIL if: img tags, missing dimensions, missing alt text

**Testing Requirements:**
- Test image loading
- Test responsive images
- Test performance (Lighthouse)

**Examples:**
- ✅ Good: next/image, proper sizing, lazy loading
- ❌ Bad: img tags, no dimensions, no optimization

**References:**
- [Next.js: Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web.dev: Image Optimization](https://web.dev/fast/#optimize-your-images)

---

## Pattern: AAA Test Structure

**ID:** `pattern-aaa-test-structure`
**Category:** Testing
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- All unit and integration tests
- Component tests
- API tests

**Implementation:**
```typescript
// tests/unit/auth-service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '@/services/auth-service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      // ARRANGE: Setup test data and dependencies
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      // ACT: Execute the behavior being tested
      const result = await authService.register(userData);

      // ASSERT: Verify the outcome
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should throw error for duplicate email', async () => {
      // ARRANGE
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };
      await authService.register(userData); // Create first user

      // ACT & ASSERT
      await expect(authService.register(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      // ARRANGE
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };
      await authService.register(userData);

      // ACT
      const result = await authService.login({
        email: userData.email,
        password: userData.password,
      });

      // ASSERT
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user.email).toBe(userData.email);
    });
  });
});
```

**Detection Rules:**
- File pattern: `tests/**/*.test.ts`, `**/*.spec.ts`
- Content pattern: `describe\(|it\(|test\(`
- Context: All test files

**Validation:**
- ✅ PASS if: AAA structure, descriptive test names, proper assertions
- ❌ FAIL if: No structure, vague test names, missing assertions

**Testing Requirements:**
- All tests follow AAA
- Clear comments for sections
- One assertion per test (generally)

**Examples:**
- ✅ Good: Clear AAA sections, specific test names, focused assertions
- ❌ Bad: Mixed arrange/act, vague names, multiple unrelated assertions

**References:**
- [AAA Pattern](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/)
- [Jest: Testing](https://jestjs.io/docs/getting-started)

---

## Pattern: Test Coverage Thresholds

**ID:** `pattern-test-coverage-thresholds`
**Category:** Testing
**Mandatory:** YES
**Confidence:** HIGH

**When to Use:**
- All projects
- CI/CD pipelines

**Implementation:**
```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:coverage:ci": "jest --coverage --ci"
  }
}

// .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage:ci

- name: Check coverage thresholds
  run: |
    if ! npm run test:coverage:ci; then
      echo "❌ Coverage thresholds not met"
      exit 1
    fi
```

**Detection Rules:**
- File pattern: `jest.config.js`, `vitest.config.ts`, `.github/workflows/*.yml`
- Content pattern: `coverageThreshold|--coverage`
- Context: Test configuration

**Validation:**
- ✅ PASS if: Thresholds enforced, CI checks coverage, fails on insufficient coverage
- ❌ FAIL if: No thresholds, coverage not checked in CI, warnings ignored

**Testing Requirements:**
- Overall coverage ≥ 75%
- Business logic ≥ 90%
- Utilities ≥ 90%

**Examples:**
- ✅ Good: Enforced thresholds, CI integration, granular thresholds
- ❌ Bad: No thresholds, no CI check, coverage ignored

**References:**
- [Jest: Coverage](https://jestjs.io/docs/configuration#coveragethreshold-object)
- [Testing Best Practices](https://testingjavascript.com/)

---

## Summary

This document defines 15 core architectural patterns for Next.js 15 full-stack applications with Tauri integration. These patterns cover:

- **Data Fetching** (3 patterns): SSE, Tauri Events, React Server Components
- **State Management** (3 patterns): React Query, useState, Context
- **API Design** (2 patterns): Zod Validation, REST API
- **Component Architecture** (1 pattern): Client Component Boundaries
- **Code Quality** (1 pattern): TypeScript Strict Mode
- **Security** (3 patterns): Environment Variables, SQL Injection Prevention, XSS Prevention
- **Performance** (1 pattern): Next.js Image Optimization
- **Testing** (2 patterns): AAA Structure, Coverage Thresholds

**Next Steps:**
1. Run architecture scanner to detect current usage
2. Identify conflicts and inconsistencies
3. Standardize on approved patterns
4. Document project-specific decisions
5. Enforce patterns in code review and CI/CD

---

**Maintained by:** Architecture Advisor Agent
**Version:** 1.0.0
**Last Updated:** 2025-11-12
