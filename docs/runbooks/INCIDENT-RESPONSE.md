# Incident Response Playbook

**Audience:** DevOps, Security Teams, On-Call Engineers
**Last Updated:** 2025-11-23

---

## Overview

This playbook provides step-by-step procedures for responding to security incidents in Quetrex's production environment.

**Severity Levels:**
- **P0 (Critical):** Active attack, data breach, service down
- **P1 (High):** Credential leak, container escape attempt, API abuse
- **P2 (Medium):** Suspicious activity, failed auth attempts
- **P3 (Low):** Policy violations, non-critical alerts

---

## Contact Information

### Escalation Path

**On-Call Engineer (First Response):**
- Slack: `#quetrex-incidents`
- PagerDuty: Quetrex On-Call rotation

**Security Team:**
- Email: security@quetrex.app
- Slack: `#security`
- Lead: Glen Barnhardt (glen@quetrex.app)

**Infrastructure Team:**
- Slack: `#infra`
- Vercel Support: support@vercel.com

**Third-Party Services:**
- GitHub Security: https://github.com/security
- Anthropic Support: support@anthropic.com
- OpenAI Support: support@openai.com

---

## P0: Credential Leak

### Symptoms
- API keys found in logs/commits
- Unusual API usage spike
- Third-party security alert
- Public repository exposure

### Immediate Actions (< 5 minutes)

```bash
# 1. STOP ALL WORKFLOWS
gh run list --status=in_progress --json databaseId \
  | jq -r '.[].databaseId' \
  | xargs -I {} gh run cancel {}

# 2. REVOKE ALL CREDENTIALS
# GitHub
gh auth token | xargs gh api /applications/grants -X DELETE

# Anthropic (via console)
# Login to https://console.anthropic.com/ → API Keys → Revoke All

# OpenAI (via console)
# Login to https://platform.openai.com/api-keys → Revoke All
```

### Investigation (< 30 minutes)

```bash
# 3. Download audit logs
gh run list --limit=100 --json databaseId \
  | jq -r '.[].databaseId' \
  | xargs -I {} gh run download {}

# 4. Search for credential exfiltration
find . -name "*.log" -exec grep -l "curl\|wget\|nc" {} \;

# 5. Check GitHub commit history
git log --all --grep="API_KEY\|SECRET\|TOKEN" --oneline

# 6. Review access logs
# Check Vercel logs, GitHub audit log, third-party dashboards
```

### Remediation (< 2 hours)

```bash
# 7. Rotate ALL credentials
# Generate new keys in each service console

# 8. Update GitHub secrets
gh secret set ANTHROPIC_API_KEY --body "NEW_KEY"
gh secret set OPENAI_API_KEY --body "NEW_KEY"
gh secret set GITHUB_TOKEN --body "NEW_KEY"

# 9. Force password reset for all users (if database compromised)
# Via admin panel or direct database update

# 10. Deploy fixes
git commit -m "fix: rotate all credentials after incident"
git push origin main
```

### Post-Incident (< 24 hours)

1. **Root Cause Analysis**
   - How was credential leaked?
   - What systems were accessed?
   - What data was compromised?

2. **Documentation**
   - Incident timeline
   - Actions taken
   - Lessons learned

3. **Prevention**
   - Update security policies
   - Add monitoring/alerts
   - Team training

---

## P1: Container Escape Attempt

### Symptoms
- Suspicious syscalls in logs
- Container accessing host filesystem
- Privilege escalation attempts
- Unusual network traffic

### Immediate Actions (< 5 minutes)

```bash
# 1. Kill running containers
docker ps -q | xargs docker kill

# 2. Stop agent workflows
gh run list --status=in_progress \
  | jq -r '.[].databaseId' \
  | xargs -I {} gh run cancel {}

# 3. Enable maintenance mode
# (Prevents new workflows from starting)
```

### Investigation (< 30 minutes)

```bash
# 4. Review container logs
gh run view --log <RUN_ID> | grep -E "chown|mount|setuid|chmod"

# 5. Check for filesystem modifications
# On GitHub Actions host (if accessible):
find /var/lib/docker -mmin -60 -type f

# 6. Analyze network traffic
# Review egress logs for suspicious destinations
```

### Remediation (< 2 hours)

1. **Strengthen Container Security**
   ```yaml
   # Update .github/workflows/ai-agent.yml
   --cap-drop=ALL
   --cap-add=CHOWN  # Only essential capabilities
   --security-opt=no-new-privileges:true
   --read-only
   --pids-limit=100
   ```

2. **Deploy Fix**
   ```bash
   git commit -m "security: tighten container isolation"
   git push origin main
   ```

3. **Monitor Next Runs**
   - Watch for repeat attempts
   - Enable detailed logging

---

## P1: API Abuse

### Symptoms
- Unusually high API costs
- Rate limit errors
- Repeated failed requests
- Suspicious usage patterns

### Immediate Actions (< 5 minutes)

```bash
# 1. Check current API usage
# OpenAI
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Anthropic (via console)
# Login to console.anthropic.com → Usage

# 2. Identify abusive user/project
# Check database for high-usage projects
```

### Investigation (< 30 minutes)

```bash
# 3. Review API call logs
# Check application logs for patterns:
grep "api.openai.com" logs/*.log | wc -l
grep "api.anthropic.com" logs/*.log | wc -l

# 4. Identify source
# User ID, project ID, IP address
```

### Remediation (< 1 hour)

```bash
# 5. Suspend abusive account
# Via admin panel or database:
# UPDATE users SET status='suspended' WHERE id='USER_ID';

# 6. Set rate limits
# Add to API routes:
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

# 7. Monitor recovery
# Verify costs return to normal
```

---

## P2: Database Breach

### Symptoms
- Unauthorized database access
- SQL injection detected
- Data exfiltration
- Unusual queries

### Immediate Actions (< 5 minutes)

```bash
# 1. Enable read-only mode (if possible)
# Prevents further writes

# 2. Block suspicious IPs
# Via Vercel firewall or database provider

# 3. Capture current state
pg_dump quetrex_db > breach_snapshot_$(date +%Y%m%d_%H%M%S).sql
```

### Investigation (< 30 minutes)

```bash
# 4. Review database logs
# Identify compromised queries, users, tables

# 5. Check for SQL injection
# Review application code for vulnerable queries

# 6. Assess data exposure
# What tables were accessed?
# What user data was compromised?
```

### Remediation (< 2 hours)

1. **Patch Vulnerabilities**
   - Fix SQL injection points
   - Use parameterized queries
   - Enable prepared statements

2. **Rotate Database Credentials**
   ```bash
   # Generate new database password
   # Update DATABASE_URL in environment
   ```

3. **Notify Affected Users**
   - Email notification
   - Forced password reset
   - Credit monitoring (if PII exposed)

---

## P3: Policy Violations

### Examples
- Hardcoded secrets in code
- Unapproved dependencies
- Missing test coverage
- Linting errors

### Response (< 24 hours)

1. **Automated Detection**
   - Pre-commit hooks catch most
   - CI/CD fails on violations

2. **Manual Review**
   - Code review process
   - Security audit

3. **Remediation**
   - Fix violations
   - Update policies if needed
   - Team training

---

## Communication Templates

### Incident Announcement

```
🚨 INCIDENT: [TITLE]

Severity: P[0-3]
Status: Investigating / Mitigating / Resolved
Impact: [Description]
ETA: [Time to resolution]

Actions Taken:
- [Action 1]
- [Action 2]

Next Update: [Time]

Contact: security@quetrex.app
```

### Post-Incident Report

```
INCIDENT POST-MORTEM: [TITLE]

Date: [Date]
Duration: [Start - End]
Severity: P[0-3]

SUMMARY
[Brief description]

TIMELINE
[Chronological events]

ROOT CAUSE
[What went wrong]

IMPACT
[Affected systems/users/data]

RESOLUTION
[How it was fixed]

PREVENTION
[How to prevent recurrence]

ACTION ITEMS
- [ ] Task 1 (Owner: Name, Due: Date)
- [ ] Task 2 (Owner: Name, Due: Date)
```

---

## Prevention Checklist

### Daily
- [ ] Monitor API usage dashboards
- [ ] Review security alerts
- [ ] Check error rates

### Weekly
- [ ] Audit access logs
- [ ] Review failed authentication attempts
- [ ] Update security policies

### Monthly
- [ ] Rotate credentials
- [ ] Security audit
- [ ] Penetration testing
- [ ] Incident response drill

---

## Resources

- [Security Architecture](../architecture/SECURITY-ARCHITECTURE.md)
- [Security Guide](../guides/SECURITY.md)
- [Maintenance Runbook](./MAINTENANCE.md)

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
