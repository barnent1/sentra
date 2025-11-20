# Bookmark Manager - Database Schema

## Overview
Simple relational schema using Prisma ORM with PostgreSQL (production) and SQLite (development).

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Use "sqlite" for development
  url      = env("DATABASE_URL")
}

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
  tags        String[] // Array of tag strings (e.g., ["typescript", "api", "tutorial"])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@index([tags]) // Supports tag filtering
}
```

## Model Descriptions

### User
Represents authenticated users of the application.

**Fields:**
- `id`: Unique identifier (CUID for better randomness)
- `email`: User's email address (unique, used for login)
- `password`: bcrypt hashed password (min 8 chars, never exposed in API)
- `name`: Optional display name
- `createdAt`: Account creation timestamp
- `updatedAt`: Last account modification timestamp

**Relationships:**
- One-to-many with Bookmark (cascade delete - deleting user deletes all bookmarks)

**Indexes:**
- `email` - Fast login lookups

**Validation Rules:**
- Email: Valid email format, unique
- Password: Min 8 chars, must contain uppercase, lowercase, number
- Name: Optional, max 100 chars

### Bookmark
Represents saved bookmarks owned by users.

**Fields:**
- `id`: Unique identifier (CUID)
- `userId`: Foreign key to User (required)
- `url`: Bookmark URL (required, valid URL format)
- `title`: Page title (required, max 500 chars)
- `description`: Optional user notes (max 2000 chars)
- `favicon`: Optional URL to page favicon
- `tags`: Array of tag strings (lowercase, alphanumeric + hyphens)
- `createdAt`: Bookmark creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**
- Many-to-one with User (cascading delete)

**Indexes:**
- `userId` - Fast user bookmark queries
- `userId, createdAt` - Paginated user queries sorted by date
- `tags` - Fast tag filtering (PostgreSQL GIN index)

**Validation Rules:**
- URL: Valid HTTP/HTTPS URL, max 2048 chars
- Title: Required, 1-500 chars
- Description: Optional, max 2000 chars
- Tags: Array of 0-20 tags, each 1-50 chars, lowercase, alphanumeric + hyphens

## Data Access Patterns

### Common Queries

```typescript
// Get user's bookmarks (paginated, newest first)
prisma.bookmark.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: page * 20
})

// Search bookmarks by text
prisma.bookmark.findMany({
  where: {
    userId,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { url: { contains: query, mode: 'insensitive' } }
    ]
  }
})

// Filter by tag
prisma.bookmark.findMany({
  where: {
    userId,
    tags: { has: tagName }
  }
})

// Get all tags with counts
prisma.$queryRaw`
  SELECT unnest(tags) as tag, COUNT(*) as count
  FROM "Bookmark"
  WHERE "userId" = ${userId}
  GROUP BY tag
  ORDER BY count DESC
`
```

## Migrations

### Initial Migration
```bash
npx prisma migrate dev --name init
```

Creates tables with proper indexes and constraints.

### Seed Data (Development)
```typescript
// prisma/seed.ts
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    password: await bcrypt.hash('Test123!', 10),
    name: 'Test User',
    bookmarks: {
      create: [
        {
          url: 'https://docs.anthropic.com',
          title: 'Anthropic Documentation',
          description: 'Claude API reference',
          tags: ['ai', 'api', 'documentation'],
          favicon: 'https://docs.anthropic.com/favicon.ico'
        },
        {
          url: 'https://nextjs.org/docs',
          title: 'Next.js Documentation',
          description: 'React framework docs',
          tags: ['nextjs', 'react', 'documentation'],
          favicon: 'https://nextjs.org/favicon.ico'
        }
      ]
    }
  }
})
```

## Security Considerations

### Password Storage
- NEVER store plaintext passwords
- Use bcrypt with salt rounds = 10
- Password field excluded from all Prisma select queries by default

### User Isolation
- ALL bookmark queries MUST filter by `userId`
- Database constraints prevent orphaned bookmarks
- Cascade delete ensures data cleanup

### Input Sanitization
- URL validation prevents XSS via javascript: URLs
- Tag validation prevents injection (alphanumeric + hyphens only)
- Description limited to 2000 chars prevents abuse

## Performance Optimizations

### Indexes
- Composite index on `(userId, createdAt)` optimizes paginated queries
- GIN index on `tags` array (PostgreSQL) enables fast tag lookups
- Email index speeds up authentication

### Pagination
- Use cursor-based pagination for large datasets
- Default page size: 20 bookmarks
- Max page size: 100 bookmarks

### Caching Strategy (Future)
- Cache user's tag counts (Redis)
- Invalidate on bookmark create/update/delete
- TTL: 5 minutes

## Backup Strategy
- Daily automated backups (production database)
- Point-in-time recovery enabled
- Backup retention: 30 days

## Audit Logging Setup

```sql
-- Enable audit extension for point-in-time recovery
CREATE EXTENSION IF NOT EXISTS "supa_audit";

-- Track changes on all tables
SELECT audit.enable_tracking('public.users'::regclass);
SELECT audit.enable_tracking('public.bookmarks'::regclass);
SELECT audit.enable_tracking('public.tags'::regclass);

-- Create helper function for bookmark restoration
CREATE OR REPLACE FUNCTION restore_bookmark_to_timestamp(
  bookmark_id UUID,
  target_timestamp TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  old_data JSONB;
BEGIN
  SELECT old_record INTO old_data
  FROM audit.record_version
  WHERE table_name = 'bookmarks'
    AND record_id = bookmark_id
    AND ts <= target_timestamp
  ORDER BY ts DESC
  LIMIT 1;

  IF old_data IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE bookmarks
  SET
    title = old_data->>'title',
    url = old_data->>'url',
    tags = (old_data->>'tags')::text[],
    updated_at = NOW()
  WHERE id = bookmark_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Storage Cost Analysis

For 10,000 bookmarks with 10% monthly update rate:
- Monthly audit records: 1,000 changes
- Audit record size: ~500 bytes
- Monthly storage: 0.5 MB
- Annual storage: 6 MB
- **Annual cost: < $0.01**
