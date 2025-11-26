# Production Deployment Checklist

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Author:** Glen Barnhardt with Claude Code
**Status:** Ready for Use

---

## Overview

This checklist ensures all critical systems are verified before deploying Sentra to production. Follow this checklist in order for every production deployment.

**Target completion time:** 30-45 minutes
**Required for:** Every production deployment
**Sign-off required:** Technical Lead + Security Review

---

## Pre-Deployment Checks (Days -7 to -1)

### 1. Environment Variables Verification

**Status:** [ ] Complete

```bash
# Verify all required environment variables are set
# Run this in production environment

# Database
echo "DATABASE_URL: ${DATABASE_URL:+SET}"

# OpenAI (required for voice system)
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}"

# Anthropic (required for AI agents)
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+SET}"

# Authentication
echo "JWT_SECRET: ${JWT_SECRET:+SET}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:+SET}"

# App configuration
echo "NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:+SET}"
echo "NODE_ENV: ${NODE_ENV}"

# Security Phase 2 (if deployed)
echo "CREDENTIAL_PROXY_ENABLED: ${CREDENTIAL_PROXY_ENABLED:+SET}"
```

**Expected output:** All variables show "SET", NODE_ENV shows "production"

**Action items:**
- [ ] All required environment variables are set
- [ ] No placeholder values (e.g., "your-key-here")
- [ ] JWT secrets are cryptographically secure (min 32 bytes)
- [ ] NEXT_PUBLIC_APP_URL matches production domain
- [ ] NODE_ENV is set to "production"

---

### 2. Database Migrations Status

**Status:** [ ] Complete

```bash
# Check migration status
npm run db:migrate:status

# Expected: All migrations applied, no pending
```

**Action items:**
- [ ] All migrations have been applied
- [ ] No pending migrations
- [ ] Database schema matches ORM definitions
- [ ] Backup created before migration
- [ ] Rollback plan documented

**Rollback procedure:**
If migrations fail, follow `docs/deployment/DATABASE-ROLLBACK.md`

---

### 3. Security Configuration Audit

**Status:** [ ] Complete

#### Security Phase 1: Docker Containerization
- [ ] Containers use read-only filesystem
- [ ] tmpfs mounts are ephemeral and sized correctly (2GB max)
- [ ] Non-root user execution (claude-agent:claude-agent)
- [ ] All capabilities dropped (CAP_DROP=ALL)
- [ ] Resource limits enforced (2GB RAM, 2 CPU cores)
- [ ] Process limits set (100 max)

#### Security Phase 2: Credential Proxy (if enabled)
- [ ] Proxy service starts before containers
- [ ] Unix socket permissions are 0600
- [ ] Service/operation whitelists are current
- [ ] Audit logs uploading to secure storage
- [ ] No credentials in container environment (verified)
- [ ] Proxy service health check passing

**Verification command:**
```bash
# Verify no credentials in container env
docker exec <container-id> env | grep -E '(TOKEN|KEY|SECRET)'
# Expected: No output (no credentials)
```

#### API Security
- [ ] Rate limiting enabled (100 req/min per user)
- [ ] CORS configured for production domain only
- [ ] CSP headers configured
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

#### Authentication & Authorization
- [ ] JWT tokens expire after reasonable time (1 hour)
- [ ] Refresh tokens implemented and secure
- [ ] Session management configured
- [ ] Password requirements enforced (min 8 chars, complexity)
- [ ] Account lockout after failed attempts (5 max)

---

### 4. Monitoring & Logging Setup

**Status:** [ ] Complete

#### Error Reporting
- [ ] Sentry configured with production DSN
- [ ] Error sampling rate configured (10% for production)
- [ ] PII scrubbing enabled
- [ ] Source maps uploaded (for React errors)
- [ ] Alert rules configured

#### Performance Monitoring
- [ ] Application performance monitoring (APM) enabled
- [ ] Database query performance tracking
- [ ] API endpoint performance tracking
- [ ] Real User Monitoring (RUM) configured

#### Logging
- [ ] Structured logging configured (JSON format)
- [ ] Log retention policy set (90 days)
- [ ] Log aggregation configured
- [ ] Security audit logs separate from app logs
- [ ] No secrets in logs (verified)

**Verification command:**
```bash
# Check logs for secrets
grep -rE '(ghp_|sk-ant-|sk_live_)' /var/log/sentra/ || echo "No secrets found"
# Expected: "No secrets found"
```

---

### 5. Backup Procedures Verification

**Status:** [ ] Complete

#### Database Backups
- [ ] Automated daily backups configured
- [ ] Backup retention policy set (30 days)
- [ ] Backup encryption enabled
- [ ] Restore procedure tested (within 7 days)
- [ ] Backup monitoring and alerts configured
- [ ] Point-in-time recovery available

#### Code & Configuration Backups
- [ ] Git repository backups configured
- [ ] Environment variables backed up (encrypted)
- [ ] Infrastructure as Code (IaC) versioned

**Test restore procedure:**
```bash
# Restore backup to staging environment
# Verify data integrity
# Document restoration time
```

- [ ] Backup restore tested successfully
- [ ] Restore time documented: _________ minutes
- [ ] Data integrity verified after restore

---

### 6. Testing & QA Validation

**Status:** [ ] Complete

#### Test Coverage
- [ ] Unit tests passing (100%)
- [ ] Integration tests passing (100%)
- [ ] E2E tests passing (100%)
- [ ] Coverage thresholds met (75%+ overall, 90%+ services)

**Run tests:**
```bash
npm test -- --run --coverage
```

#### Manual QA Checklist
- [ ] Critical user journeys tested
  - [ ] User signup and email verification
  - [ ] User login and authentication
  - [ ] Project creation and management
  - [ ] Voice interface (if enabled)
  - [ ] GitHub integration (if enabled)
- [ ] Visual regression tests passed
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Cross-browser testing complete
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
- [ ] Mobile responsiveness verified
  - [ ] iOS Safari
  - [ ] Android Chrome

#### Performance Testing
- [ ] Load testing completed
  - Target: 1000 concurrent users
  - Average response time: < 200ms
  - p95 response time: < 500ms
  - p99 response time: < 1000ms
- [ ] Database query performance verified
- [ ] CDN caching verified
- [ ] Asset optimization verified (images, JS, CSS)

---

### 7. Rollback Plan Documentation

**Status:** [ ] Complete

**Rollback procedure:**

1. **Immediate rollback (< 5 minutes):**
   ```bash
   # Revert to previous deployment
   vercel rollback <previous-deployment-id>
   # OR
   gh api repos/barnent1/sentra/deployments/<deployment-id>/statuses \
     -f state=inactive
   ```

2. **Database rollback (if migrations were run):**
   ```bash
   # Restore from backup
   npm run db:restore -- --backup-id=<backup-id>
   ```

3. **Verify rollback:**
   ```bash
   # Check app version
   curl https://sentra.app/api/health | jq .version

   # Check database schema version
   npm run db:migrate:status
   ```

- [ ] Rollback procedure documented
- [ ] Rollback steps tested in staging
- [ ] Rollback contacts identified:
  - Primary: ___________________
  - Secondary: _________________
- [ ] Rollback decision criteria defined:
  - Error rate > 5%
  - Response time > 2s (p95)
  - Database errors > 1%
  - Critical feature broken

---

## Deployment Execution (Day 0)

### 8. Pre-Deployment Communication

**Status:** [ ] Complete

- [ ] Deployment notification sent to team
  - Date/Time: ___________________
  - Expected duration: ____________
  - Maintenance window: Y / N
- [ ] Stakeholders notified
- [ ] Support team briefed on changes
- [ ] Status page updated (if maintenance)

---

### 9. Deployment Steps

**Status:** [ ] Complete

#### Step 1: Create Deployment Tag
```bash
# Tag release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

- [ ] Git tag created
- [ ] Tag pushed to repository
- [ ] Release notes prepared

#### Step 2: Build Verification
```bash
# Build production bundle
npm run build

# Verify build artifacts
ls -lh .next/
```

- [ ] Build completed successfully
- [ ] No build errors or warnings
- [ ] Bundle size within acceptable range (< 500KB gzipped)

#### Step 3: Deploy to Production
```bash
# Deploy via Vercel (or your platform)
vercel --prod

# OR manual deployment
npm run deploy:prod
```

- [ ] Deployment started
- [ ] Deployment ID: ___________________
- [ ] Deployment completed
- [ ] Deployment time: ___________________

#### Step 4: Post-Deployment Verification
```bash
# Health check
curl https://sentra.app/api/health
# Expected: {"status":"ok","version":"1.0.0"}

# Smoke tests
npm run test:smoke:prod
```

- [ ] Health check passing
- [ ] Application accessible
- [ ] Assets loading correctly
- [ ] API endpoints responding
- [ ] Database connectivity verified

---

### 10. Monitoring & Alerts Setup

**Status:** [ ] Complete

#### Immediate Monitoring (first 1 hour)
- [ ] Error rate monitoring active
- [ ] Response time monitoring active
- [ ] Database query monitoring active
- [ ] Alert channels confirmed:
  - Email: ___________________
  - Slack: ___________________
  - PagerDuty: Y / N

#### Baseline Metrics Captured
- [ ] Error rate: __________%
- [ ] Average response time: __________ ms
- [ ] p95 response time: __________ ms
- [ ] Active users: __________
- [ ] Database connections: __________

**Alert thresholds:**
- Error rate > 1%: Warning
- Error rate > 5%: Critical
- Response time > 1s (p95): Warning
- Response time > 2s (p95): Critical
- Database errors > 0.1%: Warning

---

## Post-Deployment Verification (Day 0-1)

### 11. Functional Verification

**Status:** [ ] Complete

#### Critical User Journeys (verify in production)
- [ ] User can sign up and receive verification email
- [ ] User can log in successfully
- [ ] User can create a new project
- [ ] User can manage project settings
- [ ] Voice interface works (if enabled)
- [ ] GitHub integration works (if enabled)

#### API Endpoints Verification
```bash
# Test critical endpoints
curl https://sentra.app/api/health
curl -H "Authorization: Bearer <token>" https://sentra.app/api/projects

# Expected: All return 2xx status codes
```

- [ ] All API endpoints responding
- [ ] Authentication working
- [ ] Database queries executing correctly

---

### 12. Performance Validation

**Status:** [ ] Complete

#### Real User Metrics (first 24 hours)
- [ ] Page load time: __________ ms (target: < 2s)
- [ ] Time to Interactive (TTI): __________ ms (target: < 3s)
- [ ] First Contentful Paint (FCP): __________ ms (target: < 1s)
- [ ] Largest Contentful Paint (LCP): __________ ms (target: < 2.5s)
- [ ] Cumulative Layout Shift (CLS): __________ (target: < 0.1)

#### Server Metrics
- [ ] CPU usage: __________%
- [ ] Memory usage: __________%
- [ ] Database connection pool: __________ / __________
- [ ] Cache hit rate: __________%

---

### 13. Security Validation

**Status:** [ ] Complete

#### Security Checks (within 24 hours)
- [ ] SSL/TLS certificate valid
- [ ] Security headers present (run: https://securityheaders.com)
- [ ] No exposed secrets in logs
- [ ] Authentication endpoints rate-limited
- [ ] OWASP Top 10 mitigations verified

**Security scan:**
```bash
# Run security audit
npm audit --production

# Expected: 0 high/critical vulnerabilities
```

- [ ] Security audit passed
- [ ] Vulnerability count: High: ____ Critical: ____

#### Credential Proxy Audit (if Phase 2 enabled)
```bash
# Verify audit logs
gh run download <run-id> --name credential-audit-logs

# Check for anomalies
cat credential-audit.log | jq 'select(.status == "REJECTED")' | wc -l
# Expected: Low rejection count (< 5% of requests)
```

- [ ] Audit logs accessible
- [ ] No credential theft attempts detected
- [ ] Rejection rate within expected range (< 5%)

---

### 14. Documentation Updates

**Status:** [ ] Complete

- [ ] Deployment documented in changelog
- [ ] Version number updated in README
- [ ] API documentation updated (if changes)
- [ ] User documentation updated (if UI changes)
- [ ] Runbook updated with new procedures
- [ ] Incident response plan updated

---

### 15. Team Communication

**Status:** [ ] Complete

- [ ] Deployment success notification sent
- [ ] Metrics shared with team
- [ ] Known issues documented
- [ ] Support team trained on new features
- [ ] Status page updated (if maintenance window used)

---

## Post-Deployment Monitoring (Days 1-7)

### 16. Week 1 Monitoring Checklist

**Day 1:**
- [ ] Check error rates every hour
- [ ] Monitor performance metrics
- [ ] Review audit logs
- [ ] Check backup completion

**Day 3:**
- [ ] Review user feedback
- [ ] Analyze performance trends
- [ ] Check resource utilization
- [ ] Verify backups restoreable

**Day 7:**
- [ ] Weekly metrics review
- [ ] Cost analysis
- [ ] Security audit review
- [ ] Team retrospective

---

## Rollback Decision Matrix

**Trigger rollback immediately if:**
- [ ] Error rate > 10%
- [ ] Critical feature completely broken
- [ ] Data integrity issues discovered
- [ ] Security vulnerability actively exploited

**Consider rollback if:**
- [ ] Error rate > 5% for > 15 minutes
- [ ] p95 response time > 2s for > 15 minutes
- [ ] Database errors > 1%
- [ ] User complaints > 10 in first hour

**Do NOT rollback for:**
- [ ] Minor UI issues
- [ ] Non-critical feature bugs
- [ ] Error rate < 2%
- [ ] Issues affecting < 5% of users

---

## Sign-Off

### Pre-Deployment Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | _____________ | _____________ | ______ |
| Security Review | _____________ | _____________ | ______ |
| QA Lead | _____________ | _____________ | ______ |

### Post-Deployment Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | _____________ | _____________ | ______ |
| Operations | _____________ | _____________ | ______ |

---

## Appendix A: Critical Contacts

**Deployment Team:**
- Technical Lead: Glen Barnhardt
- Security: ___________________
- DevOps: ___________________
- QA: ___________________

**Escalation Path:**
1. Technical Lead
2. CTO/Senior Engineer
3. CEO (critical incidents only)

**External Contacts:**
- Vercel Support: https://vercel.com/support
- Database Provider: ___________________
- Monitoring Service: ___________________

---

## Appendix B: Health Check Endpoints

```
GET /api/health
Response: {"status":"ok","version":"1.0.0","uptime":12345}

GET /api/health/db
Response: {"status":"ok","latency_ms":5}

GET /api/health/redis
Response: {"status":"ok","connected":true}
```

---

## Appendix C: Quick Reference Commands

```bash
# Check application status
curl https://sentra.app/api/health

# View recent errors (last 1 hour)
# (Sentry, or your error tracking tool)

# Check database status
npm run db:status

# View deployment logs
vercel logs <deployment-id>

# Rollback to previous version
vercel rollback <previous-deployment-id>

# Check current resource usage
npm run monitor:resources
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-23 | Glen Barnhardt with Claude Code | Initial production checklist |

---

**Last Deployment:**
- Version: ___________________
- Date: ___________________
- Deployment ID: ___________________
- Status: ___________________
- Issues: ___________________
