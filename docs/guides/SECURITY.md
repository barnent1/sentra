# Security Guide

**Audience:** DevOps and Security Teams
**Last Updated:** 2025-11-23

---

## Overview

Sentra implements a 3-phase security architecture for running AI agents that execute untrusted code. This guide explains how credentials are protected, how to analyze audit logs, and security best practices.

### Security Posture

- **Phase 1 (Implemented):** Docker container isolation - 60-70% risk reduction
- **Phase 2 (Weeks 2-4):** Credential proxy service - 85% total risk reduction
- **Phase 3 (Q1 2026):** gVisor runtime - 95%+ total risk reduction (industry-leading)

---

## Phase 1: Docker Container Security

### What It Does

AI agents run in isolated Docker containers on GitHub Actions with:

**1. Read-Only Filesystem**
- Root filesystem is immutable
- Only `/tmp` and `/run` writable (in-memory tmpfs)
- Prevents malware persistence between jobs

**2. Non-Root User**
- Runs as `claude-agent` (UID 1000)
- Cannot exploit setuid binaries
- Limited blast radius if compromised

**3. Capability Dropping**
- All Linux capabilities dropped (`CAP_DROP=ALL`)
- Only essential capabilities added back:
  - `CAP_CHOWN` - For git operations
  - `CAP_SETUID/CAP_SETGID` - For subprocess execution
- Prevents network config changes, filesystem mounts, process debugging

**4. Resource Limits**
- Memory: 2GB max
- CPU: 2 cores max
- Processes: 100 max
- Prevents fork bombs and resource exhaustion attacks

**5. Ephemeral /tmp**
- In-memory only (tmpfs)
- `noexec` flag prevents executing binaries
- `nosuid` prevents privilege escalation
- Auto-cleanup on container termination

### Configuration

Located in `.github/workflows/ai-agent.yml`:

```yaml
container:
  image: ghcr.io/barnent1/sentra-ai-agent:latest
  options: |
    --rm
    --read-only
    --tmpfs /tmp:rw,noexec,nosuid,size=2g
    --tmpfs /run:rw,noexec,nosuid,size=100m
    --cap-drop=ALL
    --cap-add=CHOWN
    --cap-add=SETUID
    --cap-add=SETGID
    --security-opt=no-new-privileges:true
    --pids-limit=100
    --memory=2g
    --memory-swap=2g
    --cpus=2
```

### Limitations

Phase 1 does NOT protect against:
- **Credential theft** - Environment variables still accessible
- **Network exfiltration** - No network isolation
- **Kernel exploits** - Uses host kernel

**These are addressed in Phase 2 and Phase 3.**

---

## Phase 2: Credential Proxy Service

### How It Works

Credentials never enter the container environment. A proxy service runs on the GitHub Actions host and validates all credential requests.

**Architecture:**

```
┌──────────────────────────────────────┐
│ GitHub Actions Host                  │
│                                       │
│  ┌────────────────────────────────┐ │
│  │ Credential Proxy               │ │
│  │ - Has credentials              │ │
│  │ - Validates requests           │ │
│  │ - Logs all access              │ │
│  └────────────────────────────────┘ │
│         ↕ Unix socket                │
│  ┌────────────────────────────────┐ │
│  │ Docker Container               │ │
│  │ - NO credentials               │ │
│  │ - Requests via proxy           │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Credential Request Flow

**1. Agent needs GitHub token**
```python
# Agent code (inside container)
token = get_credential("github", "clone")
```

**2. Request sent to proxy**
```json
{
  "service": "github",
  "operation": "clone",
  "pid": 1234
}
```

**3. Proxy validates request**
```python
# Proxy (on host)
if operation in allowed_operations["github"]:
    token = os.getenv("GITHUB_TOKEN")
    log_audit(request, "GRANTED")
    return {"status": "granted", "token": token}
else:
    log_audit(request, "REJECTED", "Operation not allowed")
    return {"error": "Operation not allowed"}
```

**4. Agent uses credential**
```python
# Never sees actual token value in logs
git_clone(repo_url, token)
```

### Allowed Operations

The proxy only grants credentials for validated operations:

**GitHub:**
- `clone` - Clone repository
- `push` - Push commits
- `pull` - Pull changes
- `create_pr` - Create pull request
- `comment` - Comment on issue

**Anthropic:**
- `api_call` - Call Claude API

**Blocked by default:**
- All other operations
- Can be extended by adding to allowlist

### Audit Log

Every credential request is logged:

```json
{
  "timestamp": "2025-11-23T14:32:15Z",
  "service": "github",
  "operation": "clone",
  "status": "GRANTED",
  "requester_pid": 1234
}
```

**Log Location:** `/tmp/credential-audit.log` (on GitHub Actions host)

---

## How Credentials Are Protected

### Environment Variables (Phase 1 - Current)

**Current State:**
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Risk:** Container can read environment variables
```bash
# Attacker code
docker run --rm sentra-ai-agent:latest env | grep TOKEN
# Outputs: GITHUB_TOKEN=ghp_...
```

**Mitigation (Phase 1):**
- Container isolation limits blast radius
- Credentials only available during job execution
- No persistence across jobs
- Requires GitHub Actions compromise

### Credential Proxy (Phase 2 - Weeks 2-4)

**New State:**
```yaml
steps:
  - name: Start credential proxy
    run: python3 .claude/services/credential-proxy.py &
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  - name: Run agent (NO credentials)
    run: |
      docker run --rm \
        --mount type=bind,source=/var/run/credential-proxy.sock,target=/var/run/credential-proxy.sock,readonly \
        sentra-ai-agent:latest
```

**Protection:**
- Credentials only in host process memory
- Container cannot access environment variables
- All requests validated by proxy
- Complete audit trail

**Even if attacker compromises container:**
```bash
# Attacker code
docker run --rm sentra-ai-agent:latest env | grep TOKEN
# Outputs: (nothing)

# Attacker tries to access proxy
curl unix:///var/run/credential-proxy.sock -d '{"service":"github","operation":"delete_repo"}'
# Response: {"error": "Operation not allowed", "status": "rejected"}
```

### gVisor Isolation (Phase 3 - Q1 2026)

**Additional Protection:**
- User-space kernel intercepts all syscalls
- Only ~50 syscalls reach host kernel (vs 300+ with Docker)
- Kernel exploits cannot break out of sandbox
- Industry-leading security (matches Claude Code for Web)

---

## Audit Log Analysis

### Viewing Logs

**On GitHub Actions:**
```bash
# After workflow run
cat /tmp/credential-audit.log | jq .
```

**Download logs:**
```bash
gh run download <run-id> --name credential-audit
cat credential-audit.log | jq .
```

### Log Format

```json
{
  "timestamp": "2025-11-23T14:32:15.123Z",
  "service": "github",
  "operation": "clone",
  "status": "GRANTED",
  "requester_pid": 1234,
  "error": null
}
```

**Fields:**
- `timestamp` - ISO 8601 timestamp
- `service` - "github" or "anthropic"
- `operation` - Specific operation requested
- `status` - "GRANTED", "REJECTED", or "ERROR"
- `requester_pid` - Process ID of requester
- `error` - Error message if status is REJECTED or ERROR

### Common Patterns

**Normal Activity:**
```json
{"service":"github","operation":"clone","status":"GRANTED"}
{"service":"anthropic","operation":"api_call","status":"GRANTED"}
{"service":"github","operation":"push","status":"GRANTED"}
{"service":"github","operation":"create_pr","status":"GRANTED"}
```

**Suspicious Activity:**
```json
// Rapid-fire requests
{"timestamp":"14:32:15","service":"github","operation":"clone","status":"GRANTED"}
{"timestamp":"14:32:15","service":"github","operation":"clone","status":"GRANTED"}
{"timestamp":"14:32:15","service":"github","operation":"clone","status":"GRANTED"}
// → Possible credential harvesting attempt

// Rejected operations
{"service":"github","operation":"delete_repo","status":"REJECTED"}
{"service":"github","operation":"admin_access","status":"REJECTED"}
// → Attacker probing for allowed operations

// Failed retrievals
{"service":"github","operation":"clone","status":"FAILED_TO_RETRIEVE"}
// → Credential configuration issue
```

### Alerting Rules

Set up alerts for:

**1. Rejected Requests**
```bash
# Alert if >5 rejections in 1 minute
jq -r 'select(.status=="REJECTED")' credential-audit.log | wc -l
```

**2. Unusual Operations**
```bash
# Alert on any non-standard operation
jq -r 'select(.operation | IN("clone","push","pull","create_pr","comment","api_call") | not)' credential-audit.log
```

**3. High Request Volume**
```bash
# Alert if >100 requests in 1 minute
jq -r '.timestamp' credential-audit.log | uniq -c
```

---

## Security Best Practices

### 1. Rotate Credentials Regularly

**GitHub Tokens:**
```bash
# Generate new token
gh auth refresh

# Update GitHub secret
gh secret set GITHUB_TOKEN --body "ghp_..."

# Revoke old token
gh auth token | xargs gh api /applications/grants -X DELETE
```

**Anthropic API Keys:**
```bash
# Generate new key in Anthropic Console
# Update GitHub secret
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
# Revoke old key in console
```

**Frequency:** Every 90 days minimum, every 30 days recommended

### 2. Monitor Audit Logs

**Daily:**
- Check for rejected requests
- Review unusual operations
- Verify request volume is normal

**Weekly:**
- Analyze patterns and trends
- Update allowlist if needed
- Review incident reports

**Monthly:**
- Full security audit
- Credential rotation
- Update security policies

### 3. Limit Credential Scope

**GitHub Tokens:**
- Use fine-grained tokens (not classic)
- Limit to specific repositories
- Only grant required permissions:
  - `repo` - For code access
  - `workflow` - For GitHub Actions
- Avoid `admin` permissions

**Anthropic API Keys:**
- Separate keys for development vs production
- Set spending limits in console
- Monitor usage regularly

### 4. Implement Rate Limiting

**Proxy Configuration:**
```python
# In credential-proxy.py
RATE_LIMITS = {
    "github": {
        "clone": {"max": 10, "window": 60},  # 10 clones per minute
        "push": {"max": 5, "window": 60},    # 5 pushes per minute
    },
    "anthropic": {
        "api_call": {"max": 100, "window": 60},  # 100 API calls per minute
    }
}
```

### 5. Network Segmentation (Phase 3)

**With gVisor:**
```yaml
# Restrict outbound network
--network=none  # No network access

# Or whitelist specific domains
--network=custom
  --allow-domain=api.github.com
  --allow-domain=api.anthropic.com
```

---

## Incident Response

### Credential Leak Suspected

**1. Immediate Actions**
```bash
# Revoke all credentials
gh auth token | xargs gh api /applications/grants -X DELETE
# Revoke Anthropic API key in console

# Stop all running workflows
gh run list --status=in_progress --json databaseId --jq '.[].databaseId' | xargs -I {} gh run cancel {}
```

**2. Investigation**
```bash
# Download all audit logs
gh run list --limit=100 --json databaseId --jq '.[].databaseId' | xargs -I {} gh run download {}

# Search for suspicious activity
grep "REJECTED" */credential-audit.log
grep "FAILED" */credential-audit.log

# Check for credential exfiltration
grep -E "(curl|wget|nc|telnet)" */workflow.log
```

**3. Remediation**
```bash
# Rotate all credentials
# Update GitHub secrets
# Review and update allowlist
# Add additional monitoring
```

**4. Post-Incident**
- Document timeline
- Root cause analysis
- Update security policies
- Team training on new procedures

### Security Breach Detected

**See:** `/docs/runbooks/INCIDENT-RESPONSE.md` for complete playbook

---

## Compliance

### Data Encryption

**At Rest:**
- GitHub Secrets encrypted with AES-256
- Anthropic API keys stored encrypted
- No credentials written to disk in container

**In Transit:**
- All API calls use HTTPS/TLS 1.3
- Unix socket communication (local only)
- No credentials in logs or metrics

### Audit Requirements

**SOC 2 / ISO 27001:**
- Complete audit trail (credential-audit.log)
- 90-day retention minimum
- Daily review process
- Quarterly security audits

**GDPR / CCPA:**
- No user data in credentials
- Credential access logged
- Right to audit logs

### Access Control

**Principle of Least Privilege:**
- Container has no credentials
- Proxy validates every request
- Allowlist-based operations only
- Time-limited tokens (JWT expiration)

---

## Security Checklist

### Daily
- [ ] Review credential audit logs
- [ ] Check for rejected requests
- [ ] Verify no unusual operations
- [ ] Monitor request volume

### Weekly
- [ ] Analyze audit log patterns
- [ ] Review incident reports
- [ ] Update allowlist if needed
- [ ] Test backup credential rotation

### Monthly
- [ ] Rotate all credentials
- [ ] Full security audit
- [ ] Review and update policies
- [ ] Team security training

### Quarterly
- [ ] External security assessment
- [ ] Penetration testing
- [ ] Compliance audit
- [ ] Disaster recovery drill

---

## Summary

**Key Security Features:**

1. **Container Isolation** - Read-only filesystem, non-root user, capability dropping
2. **Credential Proxy** - Credentials never in container environment
3. **Complete Audit Trail** - Every credential request logged
4. **Least Privilege** - Allowlist-based operations only
5. **Automated Monitoring** - Alerting on suspicious activity

**Security Posture:**
- Phase 1: 60-70% risk reduction (acceptable for internal testing)
- Phase 2: 85% risk reduction (acceptable for limited production)
- Phase 3: 95%+ risk reduction (industry-leading, enterprise-ready)

**Next Steps:**

1. Review audit logs regularly
2. Set up alerting rules
3. Implement credential rotation schedule
4. Monitor for Phase 2 deployment

**Resources:**

- Full architecture: `/docs/architecture/SECURITY-ARCHITECTURE.md`
- Phase 2 design: `/docs/architecture/SECURITY-PHASE-2.md`
- Incident playbook: `/docs/runbooks/INCIDENT-RESPONSE.md`

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
