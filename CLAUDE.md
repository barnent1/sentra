# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SENTRA is an evolutionary agent system built as a TypeScript monorepo using Turborepo. It creates a "sentient codebase ecosystem" where intelligent agents orchestrate, observe, and optimize software creation with evolutionary learning capabilities.

## Architecture

**Monorepo Structure (Turborepo):**
- `@sentra/types` - Shared TypeScript types with branded types and strict readonly interfaces
- `@sentra/core` - Core evolutionary agent system with Drizzle ORM, OpenAI integration, and Qdrant vector DB
- `@sentra/api` - Express.js API layer with Socket.IO, JWT auth, and rate limiting
- `@sentra/dashboard` - Vue 3 evolution monitoring dashboard with Chart.js and WebSocket integration
- `@sentra/mobile` - Progressive Web App (PWA) for mobile approvals and monitoring
- `@sentra/cli` - Command-line interface with Commander.js and Inquirer

**Key Technologies:**
- Frontend: Vue 3 with Composition API, TypeScript 5.3+, Tailwind CSS, shadcn/ui
- Backend: Node.js 20+, Express.js, Drizzle ORM, PostgreSQL 16 with pgvector
- Infrastructure: Docker Compose, Qdrant vector database, OpenAI API integration

## Development Commands

**Root Level (Turborepo):**
```bash
npm run dev         # Start all packages in development mode
npm run build       # Build all packages
npm run test        # Run tests across all packages
npm run lint        # Lint all packages
npm run type-check  # TypeScript compilation check
npm run clean       # Clean all build artifacts
```

**Package-Specific:**
- API: `tsx watch src/example.ts`
- Dashboard: `vite dev` (port 5173)
- Mobile: `vite dev` (port 5174)
- Core: `tsc --watch`

## SENTRA Project Standards

- **Evolutionary agents use strict TypeScript** - zero tolerance for `any` types
- **All interfaces are readonly where possible** 
- **Use branded types for IDs** - e.g., `type AgentId = string & { readonly brand: unique symbol }`
- **Vector operations use proper generic constraints**
- **No legacy patterns from pre-2023 TypeScript**

## Testing

- **Vitest** for unit/integration testing
- **Playwright** for e2e testing (Dashboard & Mobile)
- **Coverage requirement**: 90% across all metrics
- Test command: `npm run test`

## Critical Requirements

1. **NEVER ship broken code** - absolute requirement for zero compilation errors
2. **Context preservation** - zero information loss in agent handoffs
3. **Learning evolution** - agents must demonstrate measurable improvement
4. **Use Drizzle ORM** (not Prisma) for all database operations

## Environment Setup

Requires Node.js 18+, Docker/Docker Compose for services (PostgreSQL with pgvector, Qdrant), and proper environment variables for OpenAI API, database connections, and WebSocket URLs.