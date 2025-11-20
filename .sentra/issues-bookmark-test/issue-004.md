---
title: "[BM-004] Create database schema (User + Bookmark models)"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Define Prisma schema for User and Bookmark models with proper relationships, indexes, and constraints.

## Acceptance Criteria
- [ ] User model created with required fields
- [ ] Bookmark model created with required fields
- [ ] One-to-many relationship configured (User → Bookmarks)
- [ ] Cascade delete configured
- [ ] Indexes created for performance
- [ ] Migration generated successfully
- [ ] Migration runs without errors
- [ ] Schema matches specification in database-schema.md

## Dependencies
- BM-002 (requires Prisma setup)

## Blocks
- BM-005 (seed data needs schema)
- BM-009 (auth utilities need User model)
- All API endpoints (BM-011 through BM-025)

## Files to Create/Modify
- `prisma/schema.prisma` - User and Bookmark models
- `prisma/migrations/` - Initial migration

## Technical Context
**Schema Definition (from database-schema.md):**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed, never returned in API
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bookmarks Bookmark[]

  @@index([email])
}

model Bookmark {
  id          String   @id @default(cuid())
  userId      String
  url         String
  title       String
  description String?
  favicon     String?  // URL to favicon image
  tags        String[] // Array of tag strings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@index([tags]) // GIN index for PostgreSQL
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name init
```

**Verification:**
```bash
npx prisma studio  # Opens database browser
```

## E2E Test Requirements
Not applicable for database schema.

## Estimated Complexity
**Small** (2-3 hours)
- Standard Prisma schema definition
- Single migration
