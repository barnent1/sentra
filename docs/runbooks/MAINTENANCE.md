# Maintenance Runbook

**Audience:** DevOps, Site Reliability Engineers
**Last Updated:** 2025-11-23

---

## Overview

This runbook covers routine maintenance tasks for Quetrex's production environment including backups, updates, monitoring, and cost optimization.

---

## Table of Contents

- [Daily Tasks](#daily-tasks)
- [Weekly Tasks](#weekly-tasks)
- [Monthly Tasks](#monthly-tasks)
- [Database Maintenance](#database-maintenance)
- [Dependency Updates](#dependency-updates)
- [Security Patches](#security-patches)
- [Performance Monitoring](#performance-monitoring)
- [Cost Optimization](#cost-optimization)

---

## Daily Tasks

### Morning Checklist (15 minutes)

```bash
# 1. Check service health
curl https://quetrex.vercel.app/api/health

# 2. Review error logs (last 24 hours)
vercel logs --since=24h | grep ERROR

# 3. Monitor API usage
# OpenAI Dashboard: https://platform.openai.com/usage
# Anthropic Console: https://console.anthropic.com/

# 4. Check GitHub Actions status
gh run list --limit=20

# 5. Review Vercel deployments
vercel ls --limit=10
```

### Alerts to Monitor

- **Error Rate:** >1% of requests
- **Response Time:** P95 >2 seconds
- **API Costs:** >$50/day spike
- **Failed Workflows:** >3 in 24 hours
- **Database Connections:** >80% of pool

### Quick Fixes

**High Error Rate:**
```bash
# Check recent deployments
vercel ls

# Rollback if needed
vercel rollback <DEPLOYMENT_URL>
```

**Slow Response Time:**
```bash
# Check database query performance
# Enable slow query log (threshold: 1s)
```

---

## Weekly Tasks

### Sunday Maintenance Window (30 minutes)

#### 1. Database Backup

```bash
# Full backup (when database is added)
pg_dump -h $DB_HOST -U $DB_USER -d quetrex_db \
  > backups/quetrex_$(date +%Y%m%d).sql

# Compress
gzip backups/quetrex_$(date +%Y%m%d).sql

# Upload to S3 (or storage provider)
aws s3 cp backups/quetrex_$(date +%Y%m%d).sql.gz \
  s3://quetrex-backups/weekly/
```

**Retention Policy:**
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months
- Yearly: 7 years

#### 2. Log Rotation

```bash
# Archive old logs
find /var/log/quetrex -name "*.log" -mtime +7 \
  -exec gzip {} \;

# Delete logs older than 90 days
find /var/log/quetrex -name "*.log.gz" -mtime +90 \
  -exec rm {} \;
```

#### 3. Audit Access Logs

```bash
# Review authentication failures
grep "401\|403" logs/access.log | wc -l

# Check for suspicious IPs
awk '{print $1}' logs/access.log | sort | uniq -c | sort -nr | head -20
```

#### 4. Performance Review

```bash
# Check average response times
awk '{sum+=$request_time; count++} END {print sum/count}' logs/access.log

# P95 latency
awk '{print $request_time}' logs/access.log | sort -n | awk 'NR==int(NR*0.95)'

# Error breakdown
grep ERROR logs/app.log | awk '{print $error_type}' | sort | uniq -c
```

---

## Monthly Tasks

### First Sunday of Month (2 hours)

#### 1. Credential Rotation

```bash
# Rotate GitHub token
gh auth refresh
GITHUB_TOKEN=$(gh auth token)
gh secret set GITHUB_TOKEN --body "$GITHUB_TOKEN"

# Rotate Anthropic API key
# 1. Generate new key in console.anthropic.com
# 2. Update GitHub secret
gh secret set ANTHROPIC_API_KEY --body "NEW_KEY"

# Rotate OpenAI API key
# 1. Generate new key in platform.openai.com
# 2. Update GitHub secret
gh secret set OPENAI_API_KEY --body "NEW_KEY"

# Rotate database password (when applicable)
# 1. Generate new password
# 2. Update database user
# 3. Update DATABASE_URL secret
```

#### 2. Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update non-breaking changes
npm update

# Review breaking changes manually
npm outdated | grep major

# Test updates
npm run type-check
npm test -- --run
npm run build

# Deploy if passing
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main
```

#### 3. Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if safe)
npm audit fix

# Review manual fixes
npm audit fix --dry-run

# Update security policies
# Review .github/SECURITY.md
```

#### 4. Cost Review

```bash
# Export monthly costs
# OpenAI: Dashboard → Usage → Export CSV
# Anthropic: Console → Billing → Download Invoice
# Vercel: Dashboard → Usage → Export

# Analyze trends
# Check for cost spikes, optimize high-usage features
```

---

## Database Maintenance

### Backup Strategy

**Automated Backups (Daily):**
```bash
# Using Vercel Postgres or Supabase built-in backups
# Verify backup exists:
vercel env pull .env.backup
grep DATABASE_URL .env.backup
```

**Manual Backup:**
```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Data only
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

### Restoration

```bash
# Restore full backup
psql $DATABASE_URL < backup_20251123_140000.sql

# Restore specific table
pg_restore --table=users backup.sql | psql $DATABASE_URL
```

### Maintenance Tasks

```bash
# Vacuum database (reclaim space)
psql $DATABASE_URL -c "VACUUM FULL ANALYZE;"

# Reindex (improve query performance)
psql $DATABASE_URL -c "REINDEX DATABASE quetrex_db;"

# Check table sizes
psql $DATABASE_URL -c "
  SELECT schemaname, tablename,
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## Dependency Updates

### Update Strategy

**Low-Risk Updates (Weekly):**
- Patch versions (1.2.3 → 1.2.4)
- Security fixes
- Type definitions

**Medium-Risk Updates (Monthly):**
- Minor versions (1.2.0 → 1.3.0)
- New features (backward compatible)
- Performance improvements

**High-Risk Updates (Quarterly):**
- Major versions (1.x → 2.x)
- Breaking changes
- API changes

### Update Process

```bash
# 1. Create update branch
git checkout -b deps/monthly-updates

# 2. Update package.json
npm outdated
npm update

# 3. Review breaking changes
# Read CHANGELOG for each package

# 4. Run full test suite
npm run type-check
npm test -- --run
npm run test:e2e
npm run build

# 5. Test locally
npm run dev
# Manual smoke testing

# 6. Deploy to staging
git push origin deps/monthly-updates
# Vercel auto-deploys preview

# 7. Merge if passing
gh pr create --title "chore: monthly dependency updates"
```

---

## Security Patches

### Critical Patches (Immediate)

When security advisory published:

```bash
# 1. Check if affected
npm audit

# 2. Update affected package
npm update <package>@latest

# 3. Test
npm test -- --run

# 4. Deploy ASAP
git commit -m "security: patch <vulnerability>"
git push origin main
```

### Regular Security Updates

```bash
# Weekly security check
npm audit --audit-level=moderate

# Fix automatically
npm audit fix

# Review manual fixes
npm audit fix --dry-run
```

---

## Performance Monitoring

### Metrics to Track

**Application Metrics:**
- Response time (P50, P95, P99)
- Error rate (%)
- Request throughput (req/s)
- Database query time
- API latency (OpenAI, Anthropic)

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Network bandwidth
- Database connections

**Business Metrics:**
- Active users
- Conversations per day
- Specs generated
- Agent runs
- API costs per user

### Monitoring Setup

**Vercel Analytics:**
```javascript
// Already integrated in src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
<Analytics />
```

**Custom Metrics:**
```typescript
// Log performance metrics
performance.mark('architect-start')
// ... code ...
performance.mark('architect-end')
performance.measure('architect-duration', 'architect-start', 'architect-end')
```

### Performance Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npx bundle-wizard

# Optimize images
# Use next/image component (already doing)

# Enable caching
# Add Cache-Control headers to API routes
```

---

## Cost Optimization

### Monthly Cost Breakdown

**Target Costs (per 100 active users):**
- Vercel Hosting: $20/month
- OpenAI API: $30/month
- Anthropic API: $40/month
- Database: $15/month
- **Total: ~$105/month**

### Optimization Strategies

**1. Cache API Responses**
```typescript
// Cache architect responses (Redis/in-memory)
const cache = new Map()

async function getCachedResponse(key: string) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  const response = await generateResponse()
  cache.set(key, response)
  return response
}
```

**2. Rate Limiting**
```typescript
// Prevent API abuse
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

app.use('/api/', limiter)
```

**3. Model Selection**
```typescript
// Use cheaper models for simple tasks
const model = task.complexity === 'high'
  ? 'claude-sonnet-4-5'   // $3/$15 per 1M tokens
  : 'claude-haiku'        // $0.25/$1.25 per 1M tokens
```

**4. Batch Processing**
```typescript
// Batch API calls when possible
const results = await Promise.all(
  items.map(item => processItem(item))
)
```

---

## Troubleshooting

### High Memory Usage

```bash
# Check Node.js memory
node --inspect index.js
# Open chrome://inspect

# Increase memory limit if needed
node --max-old-space-size=4096 index.js
```

### Slow Database Queries

```bash
# Enable slow query log
psql $DATABASE_URL -c "ALTER DATABASE quetrex_db SET log_min_duration_statement = 1000;"

# Check slow queries
psql $DATABASE_URL -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Add indexes
psql $DATABASE_URL -c "CREATE INDEX idx_projects_user_id ON projects(user_id);"
```

### Deployment Failures

```bash
# Check build logs
vercel logs <DEPLOYMENT_ID>

# Test build locally
npm run build

# Check environment variables
vercel env pull .env.production
```

---

## Resources

- [Incident Response](./INCIDENT-RESPONSE.md)
- [Security Guide](../guides/SECURITY.md)
- [Architecture](../architecture/SECURITY-ARCHITECTURE.md)

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
