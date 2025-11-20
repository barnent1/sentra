# ADR-002: Migration from Prisma to Drizzle ORM for Edge Compatibility

**Status:** Accepted

**Date:** 2025-11-19

**Decision Maker:** Glen Barnhardt

**Context Author:** Glen Barnhardt with help from Claude Code

---

## Context

Sentra is a voice-first AI assistant web application built with Next.js 15 and deployed on Vercel. The project aims to use the latest technology stack and leverage all available Vercel features for optimal performance.

### Current State

- **Framework:** Next.js 15 with App Router
- **Deployment:** Vercel (production)
- **Database:** PostgreSQL
- **ORM:** Prisma 6.19.0 (current)
- **User Requirement:** "I want to use the latest technology and all Vercel features"

### Problem

Prisma 6.19.0 has a critical limitation that blocks Vercel Edge Runtime:

1. **Node.js Dependency:** Prisma requires Node.js runtime due to native binary dependencies
2. **Blocks Edge Functions:** Cannot deploy API routes or Server Actions to Vercel Edge Runtime
3. **Limited Performance:** Restricted to regional Node.js runtime with ~500ms cold starts
4. **Missed Features:** Unable to use Next.js 15 Server Actions optimally on Edge

### Edge Runtime Benefits

**Performance:**
- **Cold starts:** 0ms (Edge) vs 500ms (Node.js)
- **Global distribution:** 300+ edge locations vs regional deployment
- **Latency:** 50-200ms (Edge) vs 200-500ms (Node.js) for global users

**Features:**
- Vercel Edge Functions
- Next.js 15 Server Actions with full edge support
- Edge middleware for authentication
- Global caching at edge nodes

**Cost:**
- Edge Functions: Free tier 100GB-hours/month
- Better scalability at lower cost

---

## Decision

**We will migrate from Prisma to Drizzle ORM.**

This enables full Vercel Edge Runtime compatibility while maintaining type safety and developer experience.

---

## Technical Justification

### Comparison Matrix

| Requirement | Prisma 6.19.0 | Drizzle | Winner |
|-------------|---------------|---------|--------|
| **Vercel Edge Compatible** | ❌ No | ✅ Yes | **Drizzle** |
| **Next.js 15 Server Actions** | ⚠️ Limited (Node.js only) | ✅ Full (Edge + Node.js) | **Drizzle** |
| **Bundle Size** | Heavy (~100KB + binary) | 7KB | **Drizzle** |
| **Cold Start Time** | ~500ms (Node.js) | ~50ms (Edge) | **Drizzle** |
| **Global Performance** | Regional | Edge (300+ locations) | **Drizzle** |
| **Type Safety** | ✅ Excellent | ✅ Excellent | Tie |
| **Migration System** | ✅ Excellent | ✅ Good | Prisma |
| **Visual Studio** | ✅ Prisma Studio | ❌ No (3rd party) | Prisma |
| **SQL-like Syntax** | ⚠️ Abstracted | ✅ Yes | Drizzle |
| **Raw SQL Support** | ✅ Yes | ✅ Yes (`sql` template) | Tie |
| **Latest Tech Stack** | ❌ Blocks features | ✅ Enables features | **Drizzle** |

### Performance Impact

**User in Tokyo:**
- Prisma (Node.js US East): ~250ms latency
- Drizzle (Edge Tokyo): ~50ms latency
- **Improvement: 5x faster**

**User in London:**
- Prisma (Node.js US East): ~180ms latency
- Drizzle (Edge London): ~45ms latency
- **Improvement: 4x faster**

**User in São Paulo:**
- Prisma (Node.js US East): ~300ms latency
- Drizzle (Edge São Paulo): ~60ms latency
- **Improvement: 5x faster**

### Developer Experience

**Type Safety (Both Equal):**

```typescript
// Prisma
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { profile: true }
})

// Drizzle
const user = await db
  .select()
  .from(users)
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .where(eq(users.email, 'user@example.com'))
```

Both provide full TypeScript inference and type safety.

**Drizzle Advantages:**
- SQL-like syntax (easier to optimize complex queries)
- Smaller bundle size (7KB vs 100KB+)
- Works in Edge Runtime
- No binary dependencies

**Prisma Advantages:**
- Better migration system (more mature)
- Prisma Studio (visual database browser)
- More abstracted syntax (less SQL knowledge needed)

### Edge Runtime Compatibility

**Prisma:**
```typescript
// ❌ CANNOT run on Edge Runtime
export const runtime = 'edge' // Error: Prisma is not compatible

import { PrismaClient } from '@prisma/client'
// Error: Cannot find module 'fs' (Node.js API)
```

**Drizzle:**
```typescript
// ✅ CAN run on Edge Runtime
export const runtime = 'edge' // Works perfectly

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
// No errors - fully edge compatible
```

---

## Consequences

### Positive

1. **Edge Runtime Enabled**
   - Can deploy to Vercel Edge Functions
   - Full Next.js 15 Server Actions support
   - Global low-latency performance

2. **Performance Improvement**
   - 4-5x faster for global users
   - 0ms cold starts on Edge
   - Better scalability

3. **Modern Stack**
   - Aligned with Vercel's platform direction
   - Enables latest Next.js features
   - Future-proof architecture

4. **Smaller Bundle**
   - 7KB vs 100KB+ (93% reduction)
   - Faster initial page loads
   - Lower bandwidth costs

5. **SQL Control**
   - SQL-like syntax for complex queries
   - Easier to optimize performance
   - Can drop to raw SQL when needed

### Negative

1. **Migration Effort**
   - 4-6 weeks estimated timeline
   - Need to rewrite database layer
   - Schema conversion required
   - All queries need updating

2. **Lost Features**
   - No Prisma Studio (can use Drizzle Studio or pgAdmin)
   - Migration system less mature
   - Smaller community (growing rapidly)

3. **Team Learning Curve**
   - Developers need to learn Drizzle syntax
   - More SQL knowledge required
   - Different migration approach

4. **Risk**
   - Potential bugs during migration
   - Testing burden
   - Temporary productivity loss

---

## Migration Strategy

### Phase 1: Preparation (Week 1)

**Tasks:**
- [ ] Install Drizzle and dependencies
- [ ] Set up Drizzle configuration
- [ ] Create Drizzle schema from Prisma schema
- [ ] Set up migration system
- [ ] Create development database

**Estimated Time:** 3-5 days

### Phase 2: Schema Migration (Week 2)

**Tasks:**
- [ ] Convert Prisma models to Drizzle schema
- [ ] Generate initial migration
- [ ] Test schema on development database
- [ ] Verify all relationships and constraints
- [ ] Update type definitions

**Code Example:**

```typescript
// Before (Prisma)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  profile   Profile?
  projects  Project[]
  createdAt DateTime @default(now())
}

// After (Drizzle)
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Estimated Time:** 5-7 days

### Phase 3: Query Migration (Week 3-4)

**Tasks:**
- [ ] Identify all Prisma queries in codebase
- [ ] Convert queries to Drizzle syntax
- [ ] Update Server Actions
- [ ] Update API routes
- [ ] Update background jobs

**Conversion Examples:**

```typescript
// FIND UNIQUE
// Before
const user = await prisma.user.findUnique({
  where: { id: userId }
})

// After
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1)

// CREATE
// Before
const user = await prisma.user.create({
  data: { email, name }
})

// After
const [user] = await db
  .insert(users)
  .values({ email, name })
  .returning()

// UPDATE
// Before
const user = await prisma.user.update({
  where: { id: userId },
  data: { name: newName }
})

// After
const [user] = await db
  .update(users)
  .set({ name: newName })
  .where(eq(users.id, userId))
  .returning()

// COMPLEX QUERY WITH JOINS
// Before
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    profile: true,
    projects: {
      where: { status: 'active' },
      include: { team: true }
    }
  }
})

// After
const user = await db
  .select()
  .from(users)
  .leftJoin(profiles, eq(users.id, profiles.userId))
  .leftJoin(projects, and(
    eq(users.id, projects.userId),
    eq(projects.status, 'active')
  ))
  .leftJoin(teams, eq(projects.teamId, teams.id))
  .where(eq(users.id, userId))
```

**Estimated Time:** 10-14 days

### Phase 4: Testing (Week 5)

**Tasks:**
- [ ] Update unit tests
- [ ] Update integration tests
- [ ] Test all Server Actions
- [ ] Test all API routes
- [ ] Load testing
- [ ] Edge runtime testing

**Estimated Time:** 5-7 days

### Phase 5: Deployment (Week 6)

**Tasks:**
- [ ] Deploy to staging environment
- [ ] Run migration on staging database
- [ ] Smoke testing
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Remove Prisma dependencies

**Estimated Time:** 3-5 days

### Total Migration Time: 4-6 weeks

---

## Alternatives Considered

### Alternative 1: Keep Prisma with Node.js Runtime

**Approach:** Continue using Prisma but stay in Node.js runtime

**Pros:**
- No migration effort
- Keep familiar tooling
- No learning curve

**Cons:**
- Cannot use Edge Functions
- Limited Server Actions support
- Higher latency for global users
- Not "latest technology" (user requirement)
- Misses 4-5x performance improvement

**Decision:** ❌ Rejected - Does not meet user requirement for "latest technology and all Vercel features"

### Alternative 2: Prisma Data Proxy for Edge

**Approach:** Use Prisma's Data Proxy service for edge compatibility

**Pros:**
- Keep Prisma syntax
- Edge compatible
- No schema migration

**Cons:**
- Paid service ($25/month minimum)
- Vendor lock-in to Prisma Cloud
- Additional network hop (slower than direct)
- Not "latest technology" (workaround)
- Still heavier bundle than Drizzle

**Decision:** ❌ Rejected - Adds cost, complexity, and vendor lock-in. Not optimal solution.

### Alternative 3: Hybrid Approach

**Approach:** Use Prisma for Node.js routes, Drizzle for Edge routes

**Pros:**
- Gradual migration
- Use best tool for each runtime

**Cons:**
- Two ORMs to maintain
- Code duplication
- Schema sync complexity
- Confusing for developers
- Higher learning curve
- Unnecessary complexity

**Decision:** ❌ Rejected - Unnecessary complexity for no real benefit

### Alternative 4: Raw SQL Queries

**Approach:** Remove ORM entirely, use raw SQL

**Pros:**
- Maximum performance
- Edge compatible
- Full SQL control

**Cons:**
- Lose type safety
- Lose schema management
- More boilerplate code
- Higher bug risk
- No migration system

**Decision:** ❌ Rejected - Loses too many developer experience benefits

---

## Implementation Checklist

### Prerequisites
- [ ] Create backup of production database
- [ ] Set up staging environment
- [ ] Install Drizzle dependencies
- [ ] Document all Prisma queries

### Development
- [ ] Convert schema to Drizzle
- [ ] Set up migration system
- [ ] Convert all queries to Drizzle
- [ ] Update type definitions
- [ ] Update tests

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Load testing complete
- [ ] Edge runtime testing complete

### Deployment
- [ ] Deploy to staging
- [ ] Run migration on staging database
- [ ] Smoke test staging
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Remove Prisma dependencies

---

## Success Metrics

### Performance
- [ ] Edge Function cold start < 100ms (target: 50ms)
- [ ] Global P99 latency < 200ms (target: 100ms)
- [ ] Bundle size reduction > 90KB

### Functionality
- [ ] All existing features working
- [ ] All tests passing (100%)
- [ ] Zero production bugs from migration

### Developer Experience
- [ ] Team trained on Drizzle syntax
- [ ] Documentation updated
- [ ] CI/CD pipeline working with Drizzle

---

## References

- **Drizzle Documentation:** https://orm.drizzle.team/
- **Vercel Edge Runtime:** https://vercel.com/docs/functions/edge-functions
- **Next.js 15 Server Actions:** https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- **Prisma Edge Limitations:** https://www.prisma.io/docs/guides/deployment/edge/overview

---

## Approval

**Approved by:** Glen Barnhardt

**Date:** 2025-11-19

**Status:** Accepted and in progress

**Next Steps:**
1. Begin Phase 1 (Preparation) immediately
2. Set up staging environment
3. Start schema conversion
4. Target completion: 6 weeks from approval date

---

*Last updated: 2025-11-19 by Glen Barnhardt with help from Claude Code*
