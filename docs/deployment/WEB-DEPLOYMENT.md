# Quetrex Web Deployment Guide

**Last Updated:** 2025-11-19
**Status:** Production Ready
**Author:** Glen Barnhardt with Claude Code

---

## Table of Contents

1. [Overview](#overview)
2. [Vercel Deployment](#vercel-deployment)
3. [Netlify Deployment](#netlify-deployment)
4. [Railway Deployment](#railway-deployment)
5. [Custom Server Deployment](#custom-server-deployment)
6. [Environment Variables](#environment-variables)
7. [Domain Configuration](#domain-configuration)
8. [PWA Setup](#pwa-setup)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Quetrex is a Next.js 15 web application that can be deployed to any platform supporting Node.js. This guide covers deployment to popular hosting platforms.

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection string set (@vercel/postgres for Vercel)
- [ ] Drizzle migrations run
- [ ] OpenAI API key added
- [ ] Anthropic API key added
- [ ] GitHub OAuth app created (if using)
- [ ] Domain configured
- [ ] SSL certificate enabled
- [ ] Monitoring setup

---

## Vercel Deployment

**Recommended for:** Production deployments (easiest, fastest)

### Prerequisites

- GitHub account
- Vercel account (free tier available)
- Quetrex repository forked/cloned

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select your Quetrex repository
4. Vercel auto-detects Next.js configuration

### Step 2: Configure Environment Variables

In Vercel dashboard:

```bash
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database (automatically provided by Vercel Postgres)
# If using Vercel Postgres, this is auto-configured
# If using external Postgres:
DATABASE_URL=postgresql://user:pass@host:5432/quetrex

# Optional
NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
JWT_SECRET=your-random-secret-here
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### Step 2.5: Set Up Vercel Postgres (Recommended)

For optimal edge performance with Drizzle:

1. In Vercel Dashboard → Storage → Create Database
2. Select **Postgres**
3. Choose region (match your primary users)
4. Database credentials are automatically added to environment variables
5. Run migrations after deployment:
   ```bash
   # From your local machine
   npm run db:migrate
   ```

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Visit your deployment URL

### Step 4: Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `quetrex.yourcompany.com`)
3. Update DNS records as instructed
4. SSL certificate is automatically provisioned

### Vercel CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Features

- **Automatic HTTPS** - SSL included
- **Edge Functions** - Low latency worldwide
- **Auto-scaling** - Handles traffic spikes
- **Preview Deployments** - Test PRs before merge
- **Analytics** - Built-in performance monitoring

---

## Netlify Deployment

**Recommended for:** Alternative to Vercel, similar features

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub and select Quetrex repository

### Step 2: Build Settings

Netlify auto-detects Next.js, but verify:

```
Build command: npm run build
Publish directory: .next
```

### Step 3: Environment Variables

In Netlify dashboard → **Site settings** → **Environment variables**:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://yourapp.netlify.app
```

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait for build completion
3. Visit your `.netlify.app` URL

### Netlify CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Netlify Features

- **Automatic HTTPS**
- **Edge Functions**
- **Split testing** - A/B testing built-in
- **Forms** - Built-in form handling
- **Identity** - User authentication

---

## Railway Deployment

**Recommended for:** Full-stack apps with database included

### Step 1: Create Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**

### Step 2: Add Database

1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway provisions database automatically
3. Connection string is auto-populated

### Step 3: Configure Service

```bash
# Build command
npm run build

# Start command
npm run start

# Environment variables (auto-populated)
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 4: Deploy

Railway automatically deploys on git push.

### Railway Features

- **Managed PostgreSQL** - Database included
- **Auto-scaling** - Based on usage
- **Metrics** - Built-in monitoring
- **One-click rollbacks**

---

## Custom Server Deployment

**Recommended for:** Self-hosted or specific infrastructure requirements

### Prerequisites

- Ubuntu 22.04+ server
- Node.js 18+
- PostgreSQL 14+
- Nginx

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Setup Database

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE quetrex;
CREATE USER quetrex_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE quetrex TO quetrex_user;
ALTER DATABASE quetrex OWNER TO quetrex_user;
\q

# Run Drizzle migrations
cd /path/to/quetrex
npm run db:migrate
```

### Step 3: Clone and Build

```bash
# Clone repository
git clone https://github.com/barnent1/quetrex.git
cd quetrex

# Install dependencies
npm install

# Create .env.production
cat > .env.production << EOF
DATABASE_URL=postgresql://quetrex_user:your-secure-password@localhost:5432/quetrex
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://your-domain.com
JWT_SECRET=$(openssl rand -base64 32)
EOF

# Build application
npm run build
```

### Step 4: Setup PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name quetrex -- start

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### Step 5: Configure Nginx

```nginx
# /etc/nginx/sites-available/quetrex
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/quetrex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is setup automatically
```

---

## Environment Variables

### Required Variables

```bash
# OpenAI API Key (required for voice features)
OPENAI_API_KEY=sk-...

# Anthropic API Key (required for AI agents)
ANTHROPIC_API_KEY=sk-ant-...

# Database connection string (Drizzle + @vercel/postgres)
# For Vercel: Automatically provided when using Vercel Postgres
# For other platforms:
DATABASE_URL=postgresql://user:pass@host:5432/quetrex

# Vercel Postgres connection pooling (automatic on Vercel)
# POSTGRES_URL=postgresql://...
# POSTGRES_PRISMA_URL=postgresql://... (not needed with Drizzle)
# POSTGRES_URL_NON_POOLING=postgresql://...
```

### Optional Variables

```bash
# Application URL (for OAuth callbacks)
NEXT_PUBLIC_APP_URL=https://yourapp.com

# JWT secret for authentication (generate with: openssl rand -base64 32)
JWT_SECRET=your-random-secret

# GitHub OAuth (if using GitHub login)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://yourapp.com/api/auth/callback/github

# Redis (for caching, sessions)
REDIS_URL=redis://localhost:6379

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# Monitoring (optional)
SENTRY_DSN=...
NEXT_PUBLIC_ANALYTICS_ID=...
```

### Environment Variable Security

**Do NOT commit secrets to git:**

```bash
# Always use .env.local for local development
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Use platform secret managers in production
# - Vercel: Environment Variables UI
# - Netlify: Environment Variables UI
# - Railway: Variables tab
# - Custom: HashiCorp Vault or AWS Secrets Manager
```

---

## Domain Configuration

### Vercel Custom Domain

1. **Add Domain**
   - Vercel Dashboard → Settings → Domains
   - Enter your domain: `quetrex.yourcompany.com`

2. **Update DNS Records**
   - Add CNAME record:
     ```
     CNAME: quetrex.yourcompany.com → cname.vercel-dns.com
     ```

3. **Verify**
   - SSL certificate auto-provisions (5-10 minutes)
   - Domain becomes active

### Netlify Custom Domain

1. **Add Domain**
   - Netlify Dashboard → Domain settings → Add custom domain

2. **Update DNS**
   - Option A (Netlify DNS): Transfer nameservers
   - Option B (External DNS): Add CNAME record

3. **Enable HTTPS**
   - Automatic with Let's Encrypt

### Custom Server Domain

1. **Point A Record**
   ```
   A: yourapp.com → your-server-ip
   ```

2. **Setup SSL**
   ```bash
   sudo certbot --nginx -d yourapp.com -d www.yourapp.com
   ```

---

## PWA Setup

Progressive Web App enables installable web experience.

### Step 1: Create Manifest

Create `/public/manifest.json`:

```json
{
  "name": "Quetrex - AI Control Center",
  "short_name": "Quetrex",
  "description": "Voice-first AI assistant for developers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#8b5cf6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 2: Add to HTML Head

In `/src/app/layout.tsx`:

```tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#8b5cf6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quetrex'
  }
}
```

### Step 3: Add Service Worker

Create `/public/sw.js`:

```javascript
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('fetch', (event) => {
  // Cache-first strategy for static assets
  // Network-first for API calls
});
```

### Step 4: Test PWA

1. Open Chrome DevTools
2. Application tab → Manifest
3. Verify manifest loads correctly
4. Check "Add to Home Screen" appears

---

## Monitoring & Analytics

### Performance Monitoring

**Vercel Analytics** (included with Vercel)
```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Sentry Error Tracking**
```bash
npm install @sentry/nextjs

# Configure
npx @sentry/wizard -i nextjs
```

**Google Analytics**
```tsx
// src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

### Uptime Monitoring

- **UptimeRobot** - Free, checks every 5 minutes
- **Pingdom** - Advanced monitoring
- **Better Uptime** - Status pages included

---

## Troubleshooting

### Build Failures

**Error: TypeScript errors**
```bash
# Run type check locally
npm run type-check

# Fix errors, then deploy
```

**Error: Missing environment variables**
```bash
# Verify all required vars are set
# Check platform dashboard → Environment Variables
```

### Runtime Errors

**Database connection failed**
```bash
# Verify DATABASE_URL is correct
# Ensure database allows connections from deployment IP
# Check firewall rules
```

**OpenAI API errors**
```bash
# Verify OPENAI_API_KEY is valid
# Check API quota/billing
# Test with: curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Performance Issues

**Slow page loads**
- Enable ISR (Incremental Static Regeneration)
- Add caching headers
- Optimize images with `next/image`

**High memory usage**
- Increase server memory allocation
- Enable Node.js memory profiling
- Check for memory leaks in custom code

### Deployment Rollback

**Vercel**
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

**Netlify**
- Dashboard → Deploys → Previous deploy → "Publish deploy"

**Railway**
- Dashboard → Deployments → Previous deployment → "Redeploy"

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics tracking enabled
- [ ] Uptime monitoring configured
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] CORS policy configured
- [ ] API keys rotated and secured
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

---

## Support

**Documentation:** [docs/README.md](../README.md)

**Issues:** [GitHub Issues](https://github.com/barnent1/quetrex/issues)

**Community:** [Discord](https://discord.gg/quetrex) (coming soon)

---

---

## Database Setup Notes

### Drizzle ORM

Quetrex uses Drizzle ORM (not Prisma) for edge compatibility.

**Why Drizzle:**
- ✅ Works in Vercel Edge Runtime
- ✅ Enables Next.js 15 Server Actions on Edge
- ✅ 4-5x faster global performance
- ✅ 7KB bundle size

**See:** `docs/decisions/ADR-002-DRIZZLE-ORM-MIGRATION.md` for complete rationale

**Setup Commands:**
```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Drizzle Studio (dev)
npm run db:studio
```

**Vercel Postgres Integration:**
```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './db/schema'

export const db = drizzle(sql, { schema })
```

---

**Last Updated:** 2025-11-19 by Glen Barnhardt with Claude Code
