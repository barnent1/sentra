# Sentra Deployment Guide

## Architecture Overview

```
sentra.io (Cloudflare DNS)
├── app.sentra.io       → Vercel (Next.js Dashboard)
└── mcp.sentra.io       → Fly.io (MCP Server + PostgreSQL)
```

## Prerequisites

- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, can use dashboard)
- Cloudflare account with `sentra.io` domain
- Node.js 20+

## 1. Deploy MCP Server to Fly.io

### First-time setup:

```bash
# Login to Fly.io
fly auth login

# Navigate to MCP server directory
cd apps/mcp-server

# Create PostgreSQL database
fly postgres create --name sentra-postgres --region iad

# Launch the app (follow prompts)
fly launch --no-deploy

# Attach PostgreSQL database
fly postgres attach sentra-postgres

# Set environment secrets
fly secrets set AUTH_ENABLED=true
fly secrets set CORS_ORIGINS=https://app.sentra.io,https://sentra.io
fly secrets set AUTH_TIMESTAMP_MAX_AGE=60
fly secrets set AUTH_CLOCK_SKEW=5

# Create persistent volume for git worktrees
fly volumes create sentra_worktrees --region iad --size 10

# Deploy
fly deploy
```

### Subsequent deployments:

```bash
cd apps/mcp-server
fly deploy
```

### Database migrations:

```bash
# Connect to Fly.io machine
fly ssh console

# Run migrations
npm run db:migrate
```

## 2. Configure Custom Domain (Cloudflare)

### Add DNS record in Cloudflare:

```
Type: CNAME
Name: mcp
Target: sentra-mcp.fly.dev
Proxy: Enabled (orange cloud)
TTL: Auto
```

### Add SSL certificate in Fly.io:

```bash
fly certs create mcp.sentra.io
fly certs show mcp.sentra.io
```

Cloudflare will automatically handle SSL when proxied.

## 3. Deploy Dashboard to Vercel

### First-time setup:

```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Navigate to dashboard directory
cd apps/dashboard

# Deploy to Vercel
vercel
```

### Or use Vercel Dashboard:

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select `apps/dashboard` as root directory
4. Framework preset: Next.js
5. Deploy

### Environment variables (Vercel):

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_MCP_API_URL=https://mcp.sentra.io
NEXTAUTH_URL=https://app.sentra.io
NEXTAUTH_SECRET=<generate-random-secret>
DATABASE_URL=<postgresql-connection-string>
```

### Custom domain (Vercel):

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `app.sentra.io`
3. Vercel provides CNAME target

### Add DNS record in Cloudflare:

```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy: Enabled (orange cloud)
TTL: Auto
```

## 4. Cloudflare Configuration

### SSL/TLS Settings:

```
Cloudflare Dashboard → SSL/TLS → Overview
Encryption mode: Full (strict)
```

### Security Settings:

```
Security → WAF
- Create rate limiting rule for /mcp endpoints
- Limit: 100 requests per minute per IP
```

### Page Rules (optional):

```
Rule 1: app.sentra.io/*
- Cache Level: Standard
- Always Use HTTPS: On

Rule 2: mcp.sentra.io/*
- Cache Level: Bypass
- Always Use HTTPS: On
```

## 5. Monitoring

### Fly.io:

```bash
# View logs
fly logs

# Check status
fly status

# View metrics dashboard
fly dashboard

# SSH into machine
fly ssh console
```

### Vercel:

```bash
# View logs
vercel logs

# View deployment status
vercel ls
```

## 6. Costs

### Fly.io (MCP Server):
- **Shared CPU VM:** ~$5-10/mo
- **PostgreSQL:** ~$10/mo
- **Volume (10GB):** ~$1.50/mo
- **Bandwidth:** First 100GB free
- **Total:** ~$15-20/mo

### Vercel (Dashboard):
- **Hobby (Free):** 100GB bandwidth, unlimited deploys
- **Pro ($20/mo):** Production apps, team features
- **Start with:** Free tier

### Cloudflare:
- **Free tier:** Unlimited DNS, basic DDoS, SSL
- **Pro ($20/mo):** Advanced WAF, analytics
- **Start with:** Free tier

**Total Monthly Cost:** $15-20/mo to start

## 7. Troubleshooting

### MCP Server not responding:

```bash
# Check logs
fly logs -a sentra-mcp

# Check health endpoint
curl https://mcp.sentra.io/health

# SSH and check process
fly ssh console
ps aux | grep node
```

### Database connection issues:

```bash
# Check database status
fly postgres db list -a sentra-postgres

# Connect to database
fly postgres connect -a sentra-postgres

# Verify DATABASE_URL secret is set
fly secrets list
```

### Dashboard can't connect to MCP:

1. Verify CORS_ORIGINS includes `https://app.sentra.io`
2. Check Cloudflare firewall rules aren't blocking requests
3. Verify MCP server is responding: `curl https://mcp.sentra.io/health`

## 8. Rollback

### Fly.io:

```bash
# List releases
fly releases

# Rollback to previous version
fly releases rollback <version>
```

### Vercel:

```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>
```

## 9. Scaling

### Fly.io MCP Server:

```bash
# Scale VM size
fly scale vm shared-cpu-2x

# Scale memory
fly scale memory 1024

# Add more machines (horizontal scaling)
fly scale count 2

# Auto-scaling (future)
# Edit fly.toml and add auto_scale settings
```

### Vercel Dashboard:

Vercel auto-scales automatically. No configuration needed.

## 10. Security Checklist

- [ ] SSL certificates configured (Cloudflare handles this)
- [ ] AUTH_ENABLED=true on MCP server
- [ ] CORS_ORIGINS properly configured
- [ ] Database credentials stored as secrets
- [ ] Cloudflare WAF rules configured
- [ ] Rate limiting enabled (both app-level and Cloudflare)
- [ ] Regular backups enabled (Fly.io PostgreSQL)
- [ ] Monitoring/alerts configured
- [ ] 2FA enabled on Fly.io and Vercel accounts
