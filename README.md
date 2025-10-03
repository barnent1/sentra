# Sentra

Autonomous AI development platform that builds production-ready software with minimal human intervention.

## Architecture

```
sentra.io                  # Marketing site
├── app.sentra.io         # Dashboard (Vercel)
└── mcp.sentra.io         # MCP Server (Fly.io)
```

## Monorepo Structure

```
sentra/
├── apps/
│   ├── mcp-server/       # MCP protocol server (Fly.io)
│   ├── dashboard/        # Next.js dashboard (Vercel)
│   └── marketing/        # Landing page
├── packages/
│   ├── cli/              # CLI tool (@sentra/cli)
│   └── shared/           # Shared types and utilities
├── docs/                 # Documentation
├── PRD.md               # Product Requirements Document
├── TASKS.md             # Development tasks breakdown
└── package.json         # Workspace root
```

## Quick Start

### MCP Server (Local Development)

```bash
# Install dependencies
npm install

# Start MCP server
npm run dev:mcp
```

### Deploy to Fly.io

```bash
# Deploy MCP server
npm run deploy:mcp
```

### Deploy Dashboard to Vercel

```bash
# Deploy dashboard
npm run deploy:dashboard
```

## Tech Stack

### MCP Server (apps/mcp-server)
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js
- **MCP SDK:** @modelcontextprotocol/sdk
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Ed25519 signatures
- **Deployment:** Fly.io

### Dashboard (apps/dashboard)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + ShadCN
- **Auth:** NextAuth.js
- **Deployment:** Vercel

### CLI (packages/cli)
- **Runtime:** Node.js
- **Package:** @sentra/cli (npm)
- **Auth:** Ed25519 keypairs

## Development Workflow

```bash
# Install all dependencies
npm install

# Run MCP server locally
npm run dev:mcp

# Run dashboard locally
npm run dev:dashboard

# Run all tests
npm test

# Build everything
npm run build

# Type check
npm run typecheck
```

## Documentation

- [MCP Server Documentation](./apps/mcp-server/README.md)
- [Authentication Guide](./apps/mcp-server/AUTHENTICATION.md)
- [Product Requirements](./PRD.md)
- [Task Breakdown](./TASKS.md)
- [Architecture Docs](./docs/)

## Deployment

### MCP Server → Fly.io (mcp.sentra.io)
```bash
cd apps/mcp-server
fly deploy
```

### Dashboard → Vercel (app.sentra.io)
```bash
cd apps/dashboard
vercel --prod
```

## License

MIT
