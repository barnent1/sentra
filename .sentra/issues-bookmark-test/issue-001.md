---
title: "[BM-001] Setup Next.js 15 + TypeScript project structure"
labels: ["ai-feature", "bookmark-test", "p0", "foundation"]
---

## Description
Initialize the Next.js 15 project with TypeScript, App Router, and proper configuration for the bookmark manager application.

## Acceptance Criteria
- [ ] Next.js 15.5+ installed with App Router enabled
- [ ] TypeScript configured with strict mode
- [ ] Basic project structure created (src/app, src/components, src/lib)
- [ ] TailwindCSS configured
- [ ] Root layout and home page created
- [ ] Development server runs without errors (`npm run dev`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] ESLint and Prettier configured
- [ ] Git repository initialized with proper .gitignore

## Dependencies
None (first issue)

## Blocks
- BM-002 (Prisma setup needs package.json)
- BM-003 (Testing setup needs project structure)
- BM-006 (CI/CD needs project structure)
- BM-007 (Dark theme needs Tailwind)
- BM-008 (Environment setup needs project)

## Files to Create/Modify
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind configuration
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/app/globals.css` - Global styles
- `.gitignore` - Ignore node_modules, .env, etc.
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration

## Technical Context
**Stack:**
- Next.js 15.5 (App Router, React Server Components)
- React 19
- TypeScript 5.3+ (strict mode)
- TailwindCSS 3.4+

**Project Structure:**
```
sentra/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities, third-party integrations
│   ├── services/         # Business logic
│   ├── hooks/            # Custom React hooks
│   └── middleware/       # API middleware
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # Playwright E2E tests
├── prisma/               # Database schema and migrations
└── docs/                 # Documentation
```

**tsconfig.json must include:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## E2E Test Requirements
Not applicable for infrastructure setup.

## Estimated Complexity
**Small** (2-4 hours)
- Standard Next.js project initialization
- Configuration files follow established patterns
