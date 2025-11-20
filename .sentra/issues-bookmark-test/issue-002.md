---
title: "[BM-002] Setup Prisma ORM with PostgreSQL and SQLite"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Configure Prisma ORM to support PostgreSQL (production) and SQLite (development) with proper connection handling.

## Acceptance Criteria
- [ ] Prisma installed and initialized
- [ ] DATABASE_URL environment variable configured
- [ ] Prisma Client generated successfully
- [ ] Database connection tested
- [ ] Supports both PostgreSQL and SQLite via env variable
- [ ] Prisma Studio accessible in development
- [ ] All dependencies documented in .env.example

## Dependencies
- BM-001 (requires package.json)

## Blocks
- BM-004 (database schema needs Prisma)
- BM-005 (seed data needs Prisma)
- All API endpoints (BM-011 through BM-025)

## Files to Create/Modify
- `prisma/schema.prisma` - Basic generator and datasource config
- `src/lib/prisma.ts` - Prisma Client singleton instance
- `.env.example` - Database URL template
- `.env.local` - Local database URL (gitignored)
- `package.json` - Add Prisma scripts

## Technical Context
**Prisma Configuration:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite" for development
  url      = env("DATABASE_URL")
}
```

**Environment Variables:**
```bash
# Development (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/bookmarks"
```

**Prisma Client Singleton:**
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

## E2E Test Requirements
Not applicable for infrastructure setup.

## Estimated Complexity
**Medium** (4-6 hours)
- Prisma configuration
- Environment variable handling
- Connection testing
