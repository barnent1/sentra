---
name: nextjs-15-specialist
description: Use when working with Next.js 15 features, App Router, Server Components, Server Actions, or data fetching patterns. Ensures correct usage of Server vs Client Components and modern Next.js patterns.
allowed-tools: Read, Grep, Glob, WebFetch
---

# Next.js 15 + App Router Specialist

## When to Use
- Creating new routes or pages
- Implementing data fetching
- Server vs Client Component decisions
- Server Actions
- Streaming and Suspense
- Metadata and SEO
- Route handlers (API routes)

## Key Patterns

### Server Components (Default)
Server Components are the default in Next.js App Router. They run on the server and can directly access backend resources.

```typescript
// ✅ DO: Server Component (async allowed)
export default async function ProjectsPage() {
  const projects = await prisma.project.findMany()
  return (
    <div>
      <h1>Projects</h1>
      <ProjectList projects={projects} />
    </div>
  )
}

// Benefits:
// - Direct database access
// - No bundle sent to client
// - Better performance
// - SEO friendly
```

**When to use:**
- Data fetching from database
- Accessing backend APIs
- Reading environment variables
- Static content rendering

**What you CAN do:**
- async/await
- Direct database queries
- Access file system
- Use Node.js APIs

**What you CANNOT do:**
- useState, useEffect, useContext
- Event listeners (onClick, onChange)
- Browser APIs (window, localStorage)
- React hooks (except use from React 19)

### Client Components
Client Components run in the browser and enable interactivity.

```typescript
// ✅ DO: Client Component (when interactivity needed)
'use client'

import { useState } from 'react'

export function ProjectCard({ project }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await deleteProject(project.id)
    setLoading(false)
  }

  return (
    <div>
      <h2>{project.name}</h2>
      <button onClick={handleDelete} disabled={loading}>
        Delete
      </button>
    </div>
  )
}
```

**When to use:**
- Interactive UI (buttons, forms, modals)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)

**What you CAN do:**
- useState, useEffect, useContext
- Event handlers
- Browser APIs
- React hooks

**What you CANNOT do:**
- async component functions
- Direct database access
- Node.js APIs (fs, path)
- Server-only code

### Common Mistake: Async Client Component

```typescript
// ❌ DON'T: Async Client Component (SYNTAX ERROR)
'use client'

export default async function BadComponent() {
  const data = await fetch('/api/data')
  return <div>{data}</div>
}
// Error: Client Components cannot be async
```

```typescript
// ✅ DO: Use useEffect in Client Component
'use client'

export default function GoodComponent() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{data}</div>
}
```

```typescript
// ✅ BETTER: Use Server Component
export default async function BestComponent() {
  const data = await fetch('/api/data')
  return <DataDisplay data={data} />
}
```

### Data Fetching Patterns

#### Server Component (Recommended)
```typescript
// ✅ DO: Fetch in Server Component
export default async function DashboardPage() {
  // Parallel fetching
  const [projects, users] = await Promise.all([
    prisma.project.findMany(),
    prisma.user.findMany(),
  ])

  return <Dashboard projects={projects} users={users} />
}
```

#### Client Component with useEffect
```typescript
// ⚠️ ONLY when Server Component not possible
'use client'

export function DashboardClient() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <Skeleton />
  return <ProjectList projects={projects} />
}
```

#### React Query (Client-side)
```typescript
// ✅ DO: Use React Query in Client Components only
'use client'

import { useQuery } from '@tanstack/react-query'

export function ProjectsClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json()),
  })

  if (isLoading) return <Skeleton />
  if (error) return <Error error={error} />
  return <ProjectList projects={data} />
}
```

### Server Actions

```typescript
// app/actions.ts
'use server'

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  // Validate
  const validated = createProjectSchema.parse({ name, description })

  // Create in database
  const project = await prisma.project.create({
    data: validated,
  })

  // Revalidate cache
  revalidatePath('/projects')

  return project
}
```

```typescript
// app/projects/new/page.tsx
import { createProject } from '@/app/actions'

export default function NewProjectPage() {
  return (
    <form action={createProject}>
      <input name="name" required />
      <textarea name="description" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Route Handlers (API Routes)

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const projects = await prisma.project.findMany()
  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate
  const validated = createProjectSchema.parse(body)

  // Create
  const project = await prisma.project.create({
    data: validated,
  })

  return NextResponse.json(project, { status: 201 })
}
```

### Streaming and Suspense

```typescript
// ✅ DO: Use Suspense for streaming
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList />
      </Suspense>
      <Suspense fallback={<UsersSkeleton />}>
        <UsersList />
      </Suspense>
    </div>
  )
}

// These components can be slow async Server Components
async function ProjectsList() {
  const projects = await fetchProjects() // Slow query
  return <div>{/* render projects */}</div>
}

async function UsersList() {
  const users = await fetchUsers() // Slow query
  return <div>{/* render users */}</div>
}
```

### Metadata and SEO

```typescript
// Static metadata
export const metadata = {
  title: 'Projects - Sentra',
  description: 'Manage your AI-powered development projects',
}

// Dynamic metadata
export async function generateMetadata({ params }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  })

  return {
    title: `${project.name} - Sentra`,
    description: project.description,
  }
}
```

## Decision Tree: Server vs Client Component

```
Do you need interactivity (onClick, onChange, etc.)?
├─ YES → Client Component ('use client')
└─ NO → Server Component (default)

Do you need React hooks (useState, useEffect)?
├─ YES → Client Component
└─ NO → Server Component

Do you need browser APIs (window, localStorage)?
├─ YES → Client Component
└─ NO → Server Component

Do you need to fetch data?
├─ Use Server Component (preferred)
└─ Only use Client Component if data must be client-side

Is the component purely presentational?
└─ Server Component (better performance)
```

## Common Patterns

### Composition: Server + Client

```typescript
// app/projects/page.tsx (Server Component)
export default async function ProjectsPage() {
  const projects = await prisma.project.findMany()

  return (
    <div>
      <h1>Projects</h1>
      {/* Pass data from Server to Client Component */}
      <ProjectList projects={projects} />
    </div>
  )
}

// components/ProjectList.tsx (Client Component)
'use client'

export function ProjectList({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState('')

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter projects..."
      />
      {filtered.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
```

## Best Practices

1. **Default to Server Components**
   - Start with Server Component
   - Only use 'use client' when needed
   - Minimize client bundle size

2. **Colocation**
   - Keep components close to where they're used
   - app/dashboard/components/ for dashboard-specific
   - components/ for shared components

3. **Data Fetching**
   - Prefer Server Components for data fetching
   - Use React Query only in Client Components
   - Avoid fetching in useEffect when possible

4. **Error Handling**
   - Use error.tsx for error boundaries
   - Use loading.tsx for loading states
   - Provide good fallback UX

5. **Performance**
   - Server Components reduce bundle size
   - Use Suspense for streaming
   - Parallel data fetching with Promise.all

## Troubleshooting

**Error: "You're importing a component that needs useState..."**
→ Add 'use client' to the component file

**Error: "async/await is not valid in Client Components"**
→ Remove 'use client' or use useEffect instead

**Error: "process is not defined"**
→ Environment variables in Client Components need NEXT_PUBLIC_ prefix
