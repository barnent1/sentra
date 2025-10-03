# Sentra MCP Server

Model Context Protocol server for autonomous AI development workflows.

## Tech Stack

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js
- **MCP SDK:** @modelcontextprotocol/sdk v1.19.1
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** Ed25519 signature verification
- **Deployment:** Fly.io

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Deployment to Fly.io

### First-time setup:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Create PostgreSQL database
fly postgres create --name sentra-postgres --region iad

# Attach database to app
fly postgres attach sentra-postgres

# Set secrets
fly secrets set AUTH_ENABLED=true
fly secrets set CORS_ORIGINS=https://app.sentra.io,https://sentra.io

# Deploy
fly deploy
```

### Subsequent deploys:

```bash
fly deploy
```

### Custom domain setup:

```bash
# Add custom domain
fly certs create mcp.sentra.io

# Get DNS records to add to Cloudflare
fly certs show mcp.sentra.io
```

## Environment Variables

See `.env.example` for all configuration options.

Required for production:
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Fly.io)
- `AUTH_ENABLED` - Enable Ed25519 authentication
- `CORS_ORIGINS` - Allowed CORS origins

## API Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check (includes DB connectivity)
- `GET /ping` - Simple ping
- `POST /mcp` - MCP protocol endpoint
- `GET /mcp` - MCP streaming endpoint

## Authentication

All MCP requests require Ed25519 signature authentication. See [AUTHENTICATION.md](./AUTHENTICATION.md) for details.

## Monitoring

```bash
# View logs
fly logs

# SSH into instance
fly ssh console

# Check status
fly status

# View metrics
fly dashboard
```

## Database

```bash
# Connect to database
fly postgres connect -a sentra-postgres

# Run migrations
npm run db:migrate

# Generate new migration
npm run db:generate
```
