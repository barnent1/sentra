# Supabase Setup Guide for Sentra

**The Sentra Standard Stack uses Supabase as the all-in-one backend platform.**

This guide walks you through setting up Supabase for your project, from creating your first project to deploying to production.

---

## Why Supabase?

- **93% cost savings** vs MongoDB ($25/mo vs $400/mo)
- **All-in-one**: Database + Auth + Storage + Realtime
- **PostgreSQL**: Battle-tested, ACID-compliant relational database
- **Type-safe**: Auto-generated TypeScript types
- **Row-Level Security**: Database-level auth (not application code)
- **SOC 2, HIPAA, GDPR compliant**

---

## Quick Start (5 minutes)

### 1. Create Supabase Project

```bash
# Visit https://supabase.com/dashboard
# Click "New Project"
# Choose:
#   - Project name: your-app-name
#   - Database Password: Generate strong password
#   - Region: US East (Virginia) for US data residency
#   - Pricing Plan: Pro ($25/month recommended)

# Wait 2-3 minutes for project provisioning
```

###2. Get Your API Keys

```bash
# In Supabase Dashboard:
# Settings → API → Project API keys

# Copy these values:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Keep secret!
```

### 3. Install Supabase in Your Project

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase
```

### 4. Create Environment Variables

```bash
# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
```

### 5. Initialize Supabase Client

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 6. Create Your First Table

```sql
-- In Supabase Dashboard → SQL Editor
-- Create a simple projects table

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
```

---

## Using Supabase in Your App

### Database Queries (Client-side)

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function ProjectList() {
  const supabase = createClient()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setProjects(data)
    }

    fetchProjects()
  }, [])

  return (
    <ul>
      {projects.map(project => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}
```

### Database Queries (Server-side)

```typescript
// app/api/projects/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ projects })
}
```

### Real-time Subscriptions

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeProjects() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload) => {
          console.log('Change received!', payload)
          // Invalidate React Query cache to refetch
          queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])
}
```

### Authentication

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

// Sign up
async function signUp(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

// Sign in
async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Sign out
async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

// OAuth (Google, GitHub, etc.)
async function signInWithGoogle() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`,
    },
  })
}
```

### File Storage

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

async function uploadAvatar(file: File, userId: string) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (error) throw error

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}
```

---

## Integration with Drizzle ORM

While Supabase has its own client, you can also use Drizzle ORM for type-safe queries:

### 1. Install Drizzle

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

### 2. Configure Drizzle

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

### 3. Define Schema

```typescript
// lib/db/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: uuid('user_id').notNull(),
})
```

### 4. Create Database Client

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)

export const db = drizzle(client, { schema })
```

### 5. Use Drizzle in Your App

```typescript
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Select all projects
const allProjects = await db.select().from(projects)

// Select with where clause
const userProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.userId, userId))

// Insert
await db.insert(projects).values({
  name: 'My Project',
  userId: currentUserId,
})

// Update
await db
  .update(projects)
  .set({ name: 'Updated Name' })
  .where(eq(projects.id, projectId))

// Delete
await db
  .delete(projects)
  .where(eq(projects.id, projectId))
```

---

## Local Development

### 1. Install Supabase CLI

```bash
npm install -D supabase
```

### 2. Initialize Local Supabase

```bash
npx supabase init
npx supabase start
```

This starts:
- PostgreSQL database (port 54322)
- API server (port 54321)
- Studio UI (port 54323)

### 3. Update .env.local for Local Development

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key  # Shown in terminal
```

### 4. Create Migrations

```bash
# Make changes in Supabase Studio (http://localhost:54323)
# Then generate migration
npx supabase db diff --schema public > supabase/migrations/001_initial.sql

# Apply to remote
npx supabase db push
```

---

## Production Deployment

### 1. Vercel Environment Variables

```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Migrations

```bash
# Link to remote project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

### 3. Enable Connection Pooling (Important!)

In Supabase Dashboard → Database → Connection Pooling:
- Enable "Connection Pooler"
- Use pooler connection string in production
- Set pool size based on your load (default: 15)

---

## Cost Optimization

### Current Plan: Pro ($25/month)

**Includes:**
- 8GB database storage
- 500 concurrent connections
- 100GB file storage
- 5M realtime messages
- 50K monthly active users (auth)

**Additional Costs:**
- Extra storage: $0.125/GB/month
- Extra bandwidth: $0.09/GB after 250GB

### Tips to Stay Under Budget

1. **Use infinite scroll** (already doing this ✅)
2. **Index properly** for 4M records
3. **Archive old data** to reduce storage
4. **Use CDN** for file storage (Supabase Storage + Cloudflare)
5. **Monitor usage** in Supabase Dashboard

---

## Troubleshooting

### Issue: "Too many connections"

**Solution:** Use connection pooler
```typescript
// Use pooler URL from Supabase Dashboard
const connectionString = process.env.DATABASE_URL + '?pgbouncer=true'
```

### Issue: Row Level Security blocking queries

**Solution:** Check RLS policies
```sql
-- Temporarily disable RLS to debug
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Re-enable with correct policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

### Issue: Realtime not working

**Solution:** Enable realtime for table
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

---

## Next Steps

1. **Read Supabase Docs**: https://supabase.com/docs
2. **Join Discord**: https://discord.supabase.com
3. **Example Apps**: https://github.com/supabase/supabase/tree/master/examples
4. **Sentra Templates**: Check `.sentra/templates/` for starter code

---

**Ready to build?** Your Supabase project is now set up and ready for production! 🚀
