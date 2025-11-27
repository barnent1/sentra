---
title: "[BM-005] Create database seed data for development"
labels: ["ai-feature", "bookmark-test", "p1", "foundation"]
---

## Description
Create seed script to populate development database with test user and sample bookmarks.

## Acceptance Criteria
- [ ] Seed script created (prisma/seed.ts)
- [ ] Test user created with hashed password
- [ ] 10+ sample bookmarks created
- [ ] Bookmarks have varied tags for testing filters
- [ ] Package.json configured to run seed script
- [ ] Script is idempotent (can run multiple times)
- [ ] Seed data matches realistic use cases

## Dependencies
- BM-004 (requires database schema)

## Blocks
None (nice-to-have for development)

## Files to Create/Modify
- `prisma/seed.ts` - Seed script
- `package.json` - Add prisma seed configuration

## Technical Context
**Seed Script (from database-schema.md):**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Delete existing data (development only)
  await prisma.bookmark.deleteMany({})
  await prisma.user.deleteMany({})

  // Create test user
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
            description: 'Claude API reference and guides',
            tags: ['ai', 'api', 'documentation'],
            favicon: 'https://docs.anthropic.com/favicon.ico'
          },
          {
            url: 'https://nextjs.org/docs',
            title: 'Next.js Documentation',
            description: 'React framework documentation',
            tags: ['nextjs', 'react', 'documentation'],
            favicon: 'https://nextjs.org/favicon.ico'
          },
          {
            url: 'https://www.typescriptlang.org/',
            title: 'TypeScript',
            description: 'TypeScript language homepage',
            tags: ['typescript', 'language', 'programming'],
            favicon: 'https://www.typescriptlang.org/favicon.ico'
          },
          {
            url: 'https://www.prisma.io/',
            title: 'Prisma ORM',
            description: 'Next-generation ORM for Node.js',
            tags: ['database', 'orm', 'typescript'],
            favicon: 'https://www.prisma.io/favicon.ico'
          },
          {
            url: 'https://tailwindcss.com/',
            title: 'Tailwind CSS',
            description: 'Utility-first CSS framework',
            tags: ['css', 'styling', 'design'],
            favicon: 'https://tailwindcss.com/favicon.ico'
          },
          {
            url: 'https://vitest.dev/',
            title: 'Vitest',
            description: 'Blazing fast unit test framework',
            tags: ['testing', 'javascript', 'typescript'],
            favicon: 'https://vitest.dev/favicon.ico'
          },
          {
            url: 'https://playwright.dev/',
            title: 'Playwright',
            description: 'E2E testing for modern web apps',
            tags: ['testing', 'e2e', 'automation'],
            favicon: 'https://playwright.dev/favicon.ico'
          },
          {
            url: 'https://zod.dev/',
            title: 'Zod',
            description: 'TypeScript-first schema validation',
            tags: ['validation', 'typescript', 'library'],
            favicon: 'https://zod.dev/favicon.ico'
          },
          {
            url: 'https://github.com/',
            title: 'GitHub',
            description: 'Code hosting platform',
            tags: ['git', 'development', 'tools'],
            favicon: 'https://github.com/favicon.ico'
          },
          {
            url: 'https://vercel.com/',
            title: 'Vercel',
            description: 'Deploy web projects with ease',
            tags: ['hosting', 'deployment', 'serverless'],
            favicon: 'https://vercel.com/favicon.ico'
          }
        ]
      }
    },
    include: {
      bookmarks: true
    }
  })

  console.log(`✅ Seeded database with user: ${user.email}`)
  console.log(`   Created ${user.bookmarks.length} bookmarks`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Package.json Configuration:**
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "prisma db seed"
  }
}
```

**Run Seed:**
```bash
npm run db:seed
```

## E2E Test Requirements
Not applicable for seed data.

## Estimated Complexity
**Small** (2-3 hours)
- Sample data creation
- Script configuration
