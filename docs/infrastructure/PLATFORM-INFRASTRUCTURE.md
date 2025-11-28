# Quetrex Platform Infrastructure

**Version:** 2.0.0
**Last Updated:** 2025-11-28
**Architecture Decision:** ADR-003-HOSTING-PLATFORM.md

---

## Overview

Quetrex uses a "one move" architecture designed to scale from MVP to $2M+ ARR without migrations.

| Component | Provider | Purpose | Cost |
|-----------|----------|---------|------|
| DNS/CDN | Cloudflare | DNS, DDoS, SSL, CDN | Free |
| Application | Hetzner CX32 | Next.js, Redis, Runner | $9/mo |
| Database | Supabase | PostgreSQL, Auth, Real-time | Free → $25/mo |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (Free)                         │
│                                                              │
│  • DNS management                                           │
│  • DDoS protection                                          │
│  • SSL termination (Full Strict)                            │
│  • CDN for static assets                                    │
│  • Page rules for API bypass                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (proxied)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Hetzner CX32 - Ashburn, USA ($9/mo)               │
│           4 vCPU │ 8GB RAM │ 80GB NVMe │ 20TB traffic       │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Docker Compose                        ││
│  │                                                          ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ││
│  │  │   Next.js   │ │    Redis    │ │   Runner    │       ││
│  │  │   App       │ │    Cache    │ │  Container  │       ││
│  │  │  Port 3000  │ │  Port 6379  │ │  Port 8080  │       ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘       ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                    Nginx                            │││
│  │  │         Reverse Proxy (Cloudflare Origin)          │││
│  │  │                   Port 443                          │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Postgres connection (pooled)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase (Free → $25/mo)                    │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ PostgreSQL  │ │    Auth     │ │  Real-time  │           │
│  │  Database   │ │   Service   │ │  Subscriptions│          │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                              │
│  • Auto-backups (daily)                                     │
│  • Point-in-time recovery                                   │
│  • Row Level Security (RLS)                                 │
│  • Connection pooling (PgBouncer)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Details

### Cloudflare (Free Tier)

**DNS Settings:**
- Proxy status: Proxied (orange cloud) for all records
- SSL/TLS mode: Full (strict)
- Always Use HTTPS: On
- Minimum TLS Version: 1.2

**Page Rules:**
```
# Bypass cache for API routes
quetrex.app/api/*
  Cache Level: Bypass

# Cache static assets
quetrex.app/_next/static/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
```

**Security:**
- Bot Fight Mode: On
- Security Level: Medium
- Challenge Passage: 30 minutes

---

### Hetzner CX32 (Ashburn, USA)

**Server Specifications:**

| Spec | Value |
|------|-------|
| Plan | CX32 |
| vCPU | 4 (shared) |
| RAM | 8GB |
| Storage | 80GB NVMe SSD |
| Traffic | 20TB included |
| Location | Ashburn, Virginia (ash) |
| IPv4 | Included |
| Cost | ~$9/month |

**Why Ashburn?**
- Primary user base in US
- Low latency to East Coast
- Good connectivity to EU via transatlantic cables
- Supabase default region is also US

**Resource Allocation:**

| Service | RAM | CPU | Purpose |
|---------|-----|-----|---------|
| Next.js | 2GB | 1.5 cores | Web application |
| Redis | 512MB | 0.25 cores | Session cache, rate limiting |
| Runner | 3GB | 1.5 cores | Your personal AI runner |
| Nginx | 256MB | 0.25 cores | Reverse proxy |
| System | 1GB | 0.5 cores | OS overhead |
| **Buffer** | **1.2GB** | - | **Headroom** |

---

### Supabase

**Project Settings:**

| Setting | Value |
|---------|-------|
| Region | East US (to match Hetzner Ashburn) |
| Plan | Free → Pro ($25/mo) |
| Database | PostgreSQL 15 |
| Connection | Pooled (PgBouncer) |

**Free Tier Limits:**

| Resource | Limit |
|----------|-------|
| Database size | 500MB |
| Storage | 1GB |
| Bandwidth | 2GB |
| Auth users | Unlimited |
| Projects | 2 |

**When to Upgrade to Pro ($25/mo):**
- Database > 500MB
- Need daily backups with 7-day retention
- Need point-in-time recovery
- Approaching 2GB bandwidth

---

## Docker Compose Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: ghcr.io/quetrex/web:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  runner:
    image: ghcr.io/quetrex/runner:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./runner-config.yml:/app/config.yml:ro
      - runner_workspace:/workspace
    environment:
      - QUETREX_API_URL=http://web:3000/api
    depends_on:
      - web

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - runner

volumes:
  redis_data:
  runner_workspace:
```

---

## Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server web:3000;
    }

    upstream runner {
        server runner:8080;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name quetrex.app;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name quetrex.app;

        # Cloudflare Origin Certificate
        ssl_certificate /etc/nginx/ssl/cloudflare-origin.pem;
        ssl_certificate_key /etc/nginx/ssl/cloudflare-origin-key.pem;

        # Only allow Cloudflare IPs (optional, extra security)
        # include /etc/nginx/cloudflare-ips.conf;

        # Next.js app
        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Runner API (internal, or protected)
        location /runner/ {
            proxy_pass http://runner/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## Environment Variables

```bash
# .env (on Hetzner server)

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Hetzner (for user provisioning)
HETZNER_API_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://quetrex.app
```

---

## Supabase Schema

```sql
-- Users (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_tier TEXT DEFAULT 'individual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  github_repo TEXT,
  github_owner TEXT,
  runner_status TEXT DEFAULT 'disconnected',
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runner Configs
CREATE TABLE public.runner_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hetzner_server_id TEXT,
  hetzner_server_ip INET,
  hetzner_region TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_configs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own runner config" ON public.runner_configs
  FOR ALL USING (auth.uid() = user_id);
```

---

## Deployment

### Initial Server Setup

```bash
# 1. Create Hetzner server via console or Terraform

# 2. SSH into server
ssh root@<server-ip>

# 3. Run setup script
curl -fsSL https://raw.githubusercontent.com/quetrex/quetrex/main/scripts/server-setup.sh | bash

# 4. Clone repo and configure
git clone https://github.com/quetrex/quetrex.git /opt/quetrex
cd /opt/quetrex
cp .env.example .env
nano .env  # Add your secrets

# 5. Start services
docker compose up -d

# 6. Configure Cloudflare DNS
# Point quetrex.app A record to server IP (proxied)
```

### GitHub Actions Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker build -t ghcr.io/quetrex/web:${{ github.sha }} .
          docker tag ghcr.io/quetrex/web:${{ github.sha }} ghcr.io/quetrex/web:latest
          docker push ghcr.io/quetrex/web:${{ github.sha }}
          docker push ghcr.io/quetrex/web:latest

      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/quetrex
            docker compose pull
            docker compose up -d
            docker system prune -f
```

---

## Monitoring

### Health Checks

**Application:** `https://quetrex.app/api/health`
**Runner:** `https://quetrex.app/runner/health`

### Uptime Monitoring

Use external service (UptimeRobot, Better Uptime):
- Monitor: `https://quetrex.app/api/health`
- Interval: 1 minute
- Alert: Email + SMS on failure

### Supabase Dashboard

Monitor via Supabase dashboard:
- Database size
- Active connections
- Query performance
- Auth usage

---

## Disaster Recovery

### If Hetzner Server Dies

1. Supabase has all data (safe)
2. Create new CX32 in Hetzner console (2 min)
3. Run setup script (5 min)
4. Update Cloudflare DNS (instant via API)
5. Back online in < 10 minutes

### If Supabase Has Issues

- Supabase SLA: 99.9%
- Daily backups (Pro plan)
- Point-in-time recovery (Pro plan)
- If extended outage: Export and migrate to another Postgres

---

## Scaling Path

| Users | Hetzner | Supabase | Total Cost |
|-------|---------|----------|------------|
| 0-500 | CX32 ($9) | Free | $9/mo |
| 500-2000 | CX32 ($9) | Pro ($25) | $34/mo |
| 2000-5000 | CX42 ($18) | Pro ($25) | $43/mo |
| 5000-10000 | CX52 ($35) | Pro ($25) | $60/mo |

**No migrations required. Just upgrade Hetzner plan as needed.**

---

## Cost Summary

| Component | Starting | At Scale |
|-----------|----------|----------|
| Cloudflare | $0 | $0 |
| Hetzner CX32 | $9 | $35 (CX52) |
| Supabase | $0 | $25 |
| Domain | ~$12/year | ~$12/year |
| **Total** | **$9/mo** | **$60/mo** |

---

*Document reflects final architecture decision per ADR-003.*
*No migrations planned. This architecture scales to $2M+ ARR.*
