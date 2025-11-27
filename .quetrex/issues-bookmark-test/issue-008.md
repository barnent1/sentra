---
title: "[BM-008] Setup environment variables (.env.example)"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Create .env.example template and configure environment variable loading for database, JWT, and other secrets.

## Acceptance Criteria
- [ ] .env.example created with all required variables
- [ ] .env.local added to .gitignore
- [ ] Environment variables load correctly in development
- [ ] Validation added for required env vars
- [ ] Documentation added for each variable

## Dependencies
- BM-001 (requires project structure)

## Blocks
- BM-002 (DATABASE_URL needed)
- All API endpoints (JWT_SECRET needed)

## Files to Create/Modify
- `.env.example` - Template for environment variables
- `.gitignore` - Ensure .env files excluded
- `src/lib/env.ts` - Environment variable validation

## Technical Context
**Required Environment Variables:**

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@host:5432/bookmarks"
# Development: DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="generate-with-openssl-rand-base64-32"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Rate Limiting (Optional)
# UPSTASH_REDIS_URL="https://..."
# UPSTASH_REDIS_TOKEN="..."
```

**Environment Validation:**
```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
})

export const env = envSchema.parse(process.env)
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

## E2E Test Requirements
Not applicable for environment setup.

## Estimated Complexity
**Small** (1-2 hours)
