---
title: "[BM-015] Create Zod validation schemas for bookmarks"
labels: ["ai-feature", "bookmark-test", "p0", "core-api"]
---

## Description
Create Zod schemas for bookmark validation (create, update).

## Acceptance Criteria
- [ ] Bookmark creation schema defined
- [ ] Bookmark update schema defined (partial)
- [ ] URL validation (HTTP/HTTPS only, no javascript:)
- [ ] Title validation (1-500 chars)
- [ ] Description validation (max 2000 chars)
- [ ] Tags validation (max 20 tags, alphanumeric + hyphens)
- [ ] 90%+ test coverage

## Dependencies
- BM-002 (Prisma)
- BM-004 (Bookmark model)

## Blocks
- BM-016 through BM-020 (all bookmark CRUD endpoints)

## Files to Create/Modify
- `src/lib/validation.ts` - Zod schemas
- `tests/unit/lib/validation.test.ts` - Unit tests

## Technical Context
See security-model.md for validation rules.

```typescript
// src/lib/validation.ts
import { z } from 'zod'

export const bookmarkSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .refine(url => url.startsWith('http'), 'Only HTTP/HTTPS URLs allowed')
    .refine(url => !url.toLowerCase().startsWith('javascript:'), 'JavaScript URLs not allowed'),

  title: z.string()
    .min(1, 'Title required')
    .max(500, 'Title too long'),

  description: z.string()
    .max(2000, 'Description too long')
    .optional(),

  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag too long')
      .regex(/^[a-z0-9-]+$/, 'Tags must be lowercase alphanumeric with hyphens')
  ).max(20, 'Maximum 20 tags allowed')
    .default([])
})

export const updateBookmarkSchema = bookmarkSchema.partial()
```

## E2E Test Requirements
Not applicable (unit tests only).

## Estimated Complexity
**Small** (2-3 hours)
