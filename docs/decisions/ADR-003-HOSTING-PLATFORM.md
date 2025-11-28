# ADR-003: Hosting Platform Decision

**Status:** Accepted
**Date:** 2025-11-28
**Decision Maker:** Glen Barnhardt

---

## Context

Quetrex needs a hosting platform that:
1. Minimizes operational complexity
2. Avoids future migrations ("one move" architecture)
3. Handles single point of failure concerns
4. Keeps costs predictable and low
5. Scales from MVP to $2M+ ARR without re-architecting

## Decision

**Final Architecture:**

| Component | Provider | Purpose | Cost |
|-----------|----------|---------|------|
| **DNS/CDN** | Cloudflare | DNS, DDoS protection, SSL, static asset CDN | Free |
| **Application** | Hetzner CX32 (Ashburn, USA) | Next.js app, Redis cache, Runner container | $9/mo |
| **Database** | Supabase | PostgreSQL, Auth, Real-time | Free → $25/mo |

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare (Free)                       │
│            DNS │ CDN │ DDoS │ SSL Termination               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Hetzner CX32 - Ashburn, USA ($9/mo)            │
│                                                              │
│   Next.js App │ Redis Cache │ Runner Container              │
│   Nginx reverse proxy │ Docker                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (Free → $25/mo)                   │
│                                                              │
│   PostgreSQL │ Auth │ Real-time │ Auto-backups              │
└─────────────────────────────────────────────────────────────┘
```

## Alternatives Considered

### Option 1: Vercel + Neon + Hetzner (Hybrid)
- **Rejected:** Too many moving parts, potential for migrations later
- User preference: "I don't like the 'we'll move this later' mentality"

### Option 2: Everything on Hetzner (Self-managed DB)
- **Rejected:** Single point of failure for data
- Managing PostgreSQL adds operational burden

### Option 3: Vercel Only
- **Rejected:** User prefers centralized infrastructure
- Higher costs at scale

## Consequences

### Positive
- **No migrations:** This architecture scales from 0 to 5000+ users
- **Data safety:** Supabase handles backups, PITR, replication
- **Low cost:** $9/mo starting, $60/mo at scale
- **Simplicity:** Three providers, clear responsibilities
- **Recovery:** If Hetzner dies, data is safe, new server in 5 minutes

### Negative
- **Not globally distributed:** Single region for app server
- **Some latency:** Users far from Ashburn have 50-100ms extra latency
- **Supabase dependency:** Auth and data tied to Supabase

### Mitigations
- Cloudflare CDN handles static assets globally
- Dashboard apps tolerate slight latency (not real-time gaming)
- Supabase has excellent uptime (99.9% SLA) and is replaceable with any Postgres

## Scaling Path

| Users | Hetzner | Supabase | Monthly Cost |
|-------|---------|----------|--------------|
| 0-500 | CX32 ($9) | Free | $9 |
| 500-2000 | CX32 ($9) | Pro ($25) | $34 |
| 2000-5000 | CX42 ($18) | Pro ($25) | $43 |
| 5000-10000 | CX52 ($35) | Pro ($25) | $60 |

**No architecture changes required. Vertical scaling only.**

## Implementation Notes

### Supabase Setup
- Use Supabase Auth (replaces NextAuth)
- Use Supabase Postgres with Drizzle ORM
- Enable real-time for runner status updates
- Configure Row Level Security (RLS)

### Hetzner Setup
- Region: Ashburn (ash) for US-centric users
- Docker Compose for service orchestration
- Nginx for reverse proxy + SSL via Cloudflare
- Redis for session cache (local, not critical data)

### Cloudflare Setup
- Proxy mode enabled (orange cloud)
- SSL mode: Full (strict)
- Cache static assets
- Page rule for API routes (bypass cache)

---

*This decision is final. No migrations planned.*
