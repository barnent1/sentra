# Sentra Standard Stack

**Version:** 1.1
**Last Updated:** 2025-11-19
**Status:** Production-ready

---

## Executive Summary

The Sentra Standard Stack represents the optimal technology choices for building modern, production-ready SaaS applications. This stack is based on:

- **Real-world usage** by top companies (Vercel, Linear, Supabase)
- **Performance benchmarks** (bundle size, runtime speed)
- **Developer experience** (TypeScript support, documentation, community)
- **Future-proofing** (aligned with React/Next.js roadmap)

**Your Dream Stack:**

```
Next.js 15 + TypeScript + Tailwind + shadcn/ui + Drizzle +
React Hook Form + Zod + Zustand + TanStack Query + NextAuth.js
```

---

## The Complete Stack

### 🎯 Core Framework

**Next.js 15.5 with App Router**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

**Why Next.js 15?**
- React Server Components by default
- Parallel routes for complex UIs
- Automatic code splitting
- Industry standard (used by Vercel, Linear, Supabase)
- Best-in-class developer experience

**Why App Router over Pages Router?**
- Future of Next.js (Pages Router in maintenance mode)
- Better performance (RSC reduces client JS by 30-50%)
- Cleaner patterns (layouts, nested routing)
- Streaming and Suspense built-in

---

### 🎨 UI & Styling

**shadcn/ui + Tailwind CSS**

```bash
npm install tailwindcss tailwindcss-animate
npx shadcn@latest init
```

**Why shadcn/ui over alternatives?**

| Library | Bundle Size | Control | TypeScript | Customization |
|---------|------------|---------|------------|---------------|
| **shadcn/ui** | 2.3KB | ✅ Full | ✅ Native | ✅ Complete |
| Material UI | 91.7KB | ❌ Limited | ✅ Good | ⚠️ Medium |
| Chakra UI | 47.2KB | ⚠️ Medium | ✅ Good | ⚠️ Medium |

**Key Benefits:**
- **Copy-paste architecture**: You own the code, no black box
- **Tiny bundle**: Only 2.3KB initial JS
- **Built on Radix UI**: Accessible, battle-tested primitives
- **Perfect Tailwind integration**: No style conflicts
- **TypeScript-first**: Full type safety

**Real-world usage:**
- Vercel uses custom components with Tailwind (same approach)
- Linear uses custom design system (shadcn allows this)
- Supabase uses Tailwind + custom components

**Why Tailwind CSS?**
- Zero runtime cost (CSS-in-JS has 5-10% overhead)
- Works with RSC (CSS-in-JS doesn't)
- Enforces design consistency
- Tiny production bundles
- Industry standard in 2025

---

### 💾 Database & ORM

**Drizzle (Primary) + @vercel/postgres (Edge)**

```bash
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit
```

**Decision: Drizzle over Prisma**

Sentra uses Next.js 15 on Vercel with full access to latest features. Prisma 6.19.0 blocks Vercel Edge Runtime, limiting platform capabilities.

**Technical Comparison:**

| Requirement | Prisma 6.19.0 | Drizzle | Winner |
|-------------|---------------|---------|--------|
| Vercel Edge Compatible | ❌ No | ✅ Yes | **Drizzle** |
| Next.js 15 Server Actions | ⚠️ Limited | ✅ Full | **Drizzle** |
| Bundle Size | Heavy (Node.js) | 7KB | **Drizzle** |
| Type Safety | ✅ Excellent | ✅ Excellent | Tie |
| Latest Tech Stack | ❌ Blocks features | ✅ Enables | **Drizzle** |
| Cold Start Time | ~500ms | ~50ms | **Drizzle** |
| Migration System | ✅ Excellent | ✅ Good | Prisma |
| Visual Studio | ✅ Yes | ❌ No | Prisma |

**Why Drizzle for Sentra:**
- **Edge-first architecture** - Works everywhere (Node.js, Edge, Serverless)
- **Type-safe queries** - Fully typed with TypeScript inference
- **Minimal bundle** - 7KB vs heavy Node.js runtime
- **Latest features** - Enables Vercel Edge Functions, Server Actions
- **SQL-like syntax** - Easier to optimize complex queries

**Drizzle Example:**
```typescript
// Type-safe, auto-completed
import { db } from '@/lib/db'
import { users, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const user = await db
  .insert(users)
  .values({ email: 'user@example.com' })
  .returning()

const profile = await db
  .insert(profiles)
  .values({ userId: user[0].id, name: 'John Doe' })
  .returning()

// Queries with joins
const userWithProfile = await db
  .select()
  .from(users)
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .where(eq(users.email, 'user@example.com'))
```

**Migration from Prisma:**
See `docs/decisions/ADR-002-DRIZZLE-ORM-MIGRATION.md` for complete migration strategy.

**When to still consider Prisma:**
- Not using edge deployment
- Team prefers Prisma Studio GUI
- Legacy project with existing Prisma setup

---

### 📝 Forms & Validation

**React Hook Form + Zod**

```bash
npm install react-hook-form @hookform/resolvers zod
```

**Why React Hook Form?**

| Feature | React Hook Form | Formik |
|---------|----------------|--------|
| Bundle Size | 12KB | 44KB |
| Renders | Minimal (uncontrolled) | Many (controlled) |
| Performance | ⚡ Fast | 🐌 Slower |
| API | Simple | Complex |
| Usage Trend | ↗️ Growing | ↘️ Declining |

**Why Zod over Yup?**
- TypeScript-first (not bolted on)
- Automatic type inference
- Better error messages
- Zero dependencies
- Future-proof

**Example:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormData = z.infer<typeof schema>  // Automatic TypeScript types!

const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

---

### 🔄 State & Data Fetching

**Zustand + TanStack Query**

```bash
npm install zustand @tanstack/react-query
```

**Why Zustand over Redux/Context?**
- Tiny bundle (3KB vs 30KB+)
- No boilerplate (no actions, reducers, providers)
- Simple, intuitive API
- Perfect for 90% of use cases
- Great TypeScript support

**Zustand Example:**
```typescript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))

// Use anywhere
function Counter() {
  const { count, increment } = useStore()
  return <button onClick={increment}>{count}</button>
}
```

**Why TanStack Query?**
- Handles caching, refetching, optimistic updates
- Perfect for server state (API data)
- Great DevTools
- Works beautifully with RSC

**When to use what:**
- **Zustand**: Client-side state (UI state, user preferences)
- **TanStack Query**: Server state (API data, database queries)
- **Context**: Simple, infrequently changing state

---

### 🔐 Authentication

**NextAuth.js (Recommended)**

```bash
npm install next-auth@beta
```

**Why NextAuth.js?**
- Self-hosted = full control over data
- Free and open source
- 50+ OAuth providers built-in
- Excellent Next.js integration
- Works with RSC

**Alternative: Clerk**
- Better if you want beautiful pre-built UI
- 10K MAU free tier
- Perfect for B2B SaaS
- Faster initial setup

**Authentication Comparison:**

| Feature | NextAuth.js | Clerk | Supabase Auth |
|---------|------------|-------|---------------|
| Self-hosted | ✅ Yes | ❌ No | ⚠️ Optional |
| Free Tier | ♾️ Unlimited | 10K MAU | 50K MAU |
| UI Components | Basic | Beautiful | Good |
| Setup Time | 30 min | 5 min | 15 min |
| Control | 100% | Limited | Medium |

**Recommendation:** Use NextAuth.js for self-hosted control, switch to Clerk if you need rapid development with pre-built UI.

---

### ✅ Testing

**Vitest + Playwright**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react
npm install -D @playwright/test
```

**Why Vitest over Jest?**
- 10x faster (uses Vite's transform pipeline)
- Better ESM support
- Compatible with Jest API (easy migration)
- Better watch mode
- Native TypeScript support

**Why Playwright over Cypress?**
- Faster execution
- Better debugging
- Auto-wait (no flaky tests)
- Native TypeScript
- Works with all browsers

**Coverage Requirements:**
- Overall: 75%+
- Business logic (services/): 90%+
- Utilities: 90%+

---

### 🎭 Animation (Optional)

**Framer Motion**

```bash
npm install framer-motion
```

**When to use:**
- Complex animations
- Gesture interactions
- Page transitions
- Drag and drop

**Alternative: @formkit/auto-animate**
- Use for simple transitions
- 2KB bundle (vs 50KB Framer Motion)
- Zero configuration

**Animation Decision Tree:**
```
Need complex animations or gestures?
├─ Yes → Framer Motion
└─ No → @formkit/auto-animate or CSS
```

---

## Package.json Scripts

Your standard scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

---

## Installation Order

Dependencies must be installed in this order (peer dependencies matter):

```bash
# 1. Core
npm install next@15.5.3 react@19.0.0 react-dom@19.0.0

# 2. Styling
npm install tailwindcss tailwindcss-animate autoprefixer postcss

# 3. UI
npm install lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init

# 4. Database
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit

# 5. Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# 6. State & Data
npm install zustand @tanstack/react-query

# 7. Auth
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs

# 8. Testing
npm install -D vitest @vitejs/plugin-react @testing-library/react @playwright/test

# 9. Code Quality
npm install -D prettier prettier-plugin-tailwindcss

# 10. Optional: Animation
npm install framer-motion
```

---

## TypeScript Configuration

**Always use strict mode:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Environment Variables

Standard `.env` template:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

---

## Real-World Examples

### Vercel Dashboard Stack
```yaml
Framework: Next.js 15 + App Router
UI: Custom components + Tailwind
Database: PostgreSQL + Prisma
State: SWR
Auth: Custom
Deployment: Vercel
```

### Linear Stack
```yaml
Framework: Next.js + App Router
UI: Custom design system + Tailwind
Database: PostgreSQL + Prisma
State: GraphQL + Apollo Client
Animation: Framer Motion
Deployment: Vercel
```

### Supabase Dashboard Stack
```yaml
Framework: Next.js 15
UI: Tailwind + Custom components
Database: Supabase (PostgreSQL)
State: React Query
Auth: Supabase Auth
Deployment: Vercel
```

---

## Future UI Configuration

When you build the Sentra interface, users should be able to configure:

### 1. Project Type
- [ ] Full-stack SaaS (default)
- [ ] Landing Page (minimal)
- [ ] E-commerce
- [ ] Dashboard/Admin Panel

### 2. Deployment Target
- [ ] Vercel (default)
- [ ] AWS
- [ ] Self-hosted
- [ ] Edge (Cloudflare)

### 3. Design System
- [ ] shadcn/ui (default)
- [ ] Material UI
- [ ] Custom only

### 4. Authentication
- [ ] Self-hosted (NextAuth) ✅ Default
- [ ] Managed (Clerk)
- [ ] Supabase
- [ ] None

### 5. Database
- [ ] PostgreSQL + Drizzle ✅ Default
- [ ] Supabase + Drizzle
- [ ] PostgreSQL + Prisma (if not using edge)
- [ ] None

### 6. Optional Features
- [ ] Animation (Framer Motion)
- [ ] Internationalization (next-intl)
- [ ] Analytics (Vercel Analytics)
- [ ] Error tracking (Sentry)

---

## Bundle Size Summary

| Category | Library | Bundle Size |
|----------|---------|-------------|
| Framework | Next.js 15 | Base ~85KB |
| UI | shadcn/ui | +2.3KB |
| Icons | lucide-react | +1KB per icon |
| Forms | React Hook Form | +12KB |
| Validation | Zod | +8KB |
| State | Zustand | +3KB |
| Data Fetching | TanStack Query | +15KB |
| Animation | Framer Motion | +50KB (optional) |
| **Total (without animation)** | | **~125KB** |

For comparison:
- Material UI alone: 91.7KB
- Formik: 44KB
- Redux Toolkit: 30KB+

The Sentra Standard Stack achieves **better functionality with 50% smaller bundle** compared to common alternatives.

---

## Why This Stack?

This stack prioritizes:

1. **Developer Experience** ⚡
   - Tools that make development faster
   - Great documentation
   - Active communities

2. **Type Safety** 🛡️
   - Full TypeScript support
   - Compile-time error catching
   - Better IDE autocomplete

3. **Performance** 🚀
   - Minimal bundle sizes
   - Fast runtime performance
   - Optimal SEO (RSC)

4. **Maintainability** 🔧
   - Clear patterns
   - Easy to onboard developers
   - Future-proof choices

5. **Production-Ready** ✅
   - Battle-tested by top companies
   - Proven at scale
   - Active maintenance

---

## Quick Setup Command

Use the automated setup script:

```bash
cd your-project
/path/to/sentra/.sentra/scripts/setup-nextjs-stack.sh .
```

Or via Sentra CLI (coming soon):

```bash
sentra init --stack standard
```

---

## Questions & Answers

**Q: Why not use Redux?**
A: Zustand provides 90% of Redux functionality with 10% of the code. Modern React (with hooks) doesn't need Redux's complexity for most apps.

**Q: Why Drizzle over Prisma?**
A: Edge runtime compatibility, enables Vercel Edge Functions and Server Actions. Prisma blocks these features. Drizzle is edge-first with excellent type safety.

**Q: Why Drizzle over raw SQL?**
A: Type safety, migration system, query builder. You can still write raw SQL when needed with Drizzle's `sql` tagged template.

**Q: Why not Material UI if it's more complete?**
A: 91.7KB bundle + opinionated design language + harder to customize. shadcn/ui gives you Radix primitives with full control.

**Q: Should I use Server Actions or API routes?**
A: Server Actions for forms and mutations. API routes for third-party integrations and webhooks.

**Q: What about mobile apps?**
A: Use React Native with similar stack (Expo + NativeWind + Zustand). Or build PWA with Next.js.

---

**Last Updated:** 2025-11-19
**Next Review:** When Next.js 16 releases or React 20
**Owner:** Glen Barnhardt with help from Claude Code
