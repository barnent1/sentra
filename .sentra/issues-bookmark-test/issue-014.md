---
title: "[BM-014] Create auth middleware for protected routes"
labels: ["ai-feature", "bookmark-test", "p0", "core-api"]
---

## Description
Create reusable middleware to extract and verify JWT tokens from Authorization header.

## Acceptance Criteria
- [ ] Auth middleware function created
- [ ] Extracts token from Authorization header
- [ ] Verifies token using verifyToken utility
- [ ] Returns userId on success
- [ ] Throws error if token missing or invalid
- [ ] 90%+ test coverage

## Dependencies
- BM-009 (auth utilities)

## Blocks
All bookmark endpoints (BM-016 through BM-025)

## Files to Create/Modify
- `src/middleware/auth.ts` - Auth middleware
- `tests/unit/middleware/auth.test.ts` - Unit tests

## Technical Context
```typescript
// src/middleware/auth.ts
import { verifyToken } from '@/lib/auth'

export async function authMiddleware(req: Request): Promise<string> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = verifyToken(token) // Throws if invalid

  return payload.userId
}
```

## E2E Test Requirements
Not applicable (unit tests only).

## Estimated Complexity
**Medium** (3-4 hours)
