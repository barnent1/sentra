---
title: "[BM-013] Implement GET /api/auth/me endpoint"
labels: ["ai-feature", "bookmark-test", "p0", "core-api"]
---

## Description
Create endpoint to get current authenticated user's profile.

## Acceptance Criteria
- [ ] GET /api/auth/me endpoint created
- [ ] Requires authentication (JWT token)
- [ ] Returns user object without password
- [ ] Returns 401 if not authenticated
- [ ] 90%+ test coverage

## Dependencies
- BM-002 (Prisma)
- BM-004 (User model)
- BM-009 (auth utilities)
- BM-010 (API middleware)

## Blocks
All UI components (need to check auth status)

## Files to Create/Modify
- `src/app/api/auth/me/route.ts` - Get current user endpoint
- `tests/unit/api/auth/me.test.ts` - Unit tests

## Technical Context
**Response (200):**
```json
{
  "user": {
    "id": "clh1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

## E2E Test Requirements
Not required (covered by other auth tests).

## Estimated Complexity
**Small** (2-3 hours)
