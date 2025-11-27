# Phase 1 Deployment Notes

## Critical: Workflow Configuration

The GitHub Actions workflows need the following configuration changes to match the security architecture.

### 1. Build Workflow (.github/workflows/build-agent-container.yml)

**Change Dockerfile Path:**
```yaml
# BEFORE:
file: .claude/Dockerfile

# AFTER:
file: .claude/docker/Dockerfile
```

**Update Documentation Reference:**
```yaml
# BEFORE:
# See: ADR_0001_CONTAINER_SECURITY.md

# AFTER:
# See: docs/architecture/SECURITY-ARCHITECTURE.md
```

**Update Trigger Path:**
```yaml
# BEFORE:
paths:
  - '.claude/Dockerfile'

# AFTER:
paths:
  - '.claude/docker/Dockerfile'
```

### 2. AI Agent Workflow (.github/workflows/ai-agent.yml)

**Update Container Options** (CRITICAL FOR SECURITY):

The tmpfs mounts MUST use `noexec` and `nosuid` flags per the security architecture.

```yaml
# BEFORE (INSECURE):
container:
  options: >-
    --tmpfs /tmp:exec,mode=1777
    --tmpfs /home/claude-agent/.cache:exec,mode=0755
    --tmpfs /home/claude-agent/workspace:exec,mode=0755
    --tmpfs /home/claude-agent/.claude/telemetry:exec,mode=0755

# AFTER (SECURE):
container:
  options: >-
    --rm
    --read-only
    --tmpfs /tmp:rw,noexec,nosuid,size=2g
    --tmpfs /run:rw,noexec,nosuid,size=100m
    --cap-drop=ALL
    --security-opt=no-new-privileges:true
    --pids-limit=100
    --memory=2g
    --memory-swap=2g
    --cpus=2
    --oom-kill-disable=false
```

**Key Changes:**
1. `--rm` added for auto-cleanup
2. `/tmp` changed from `:exec` to `:noexec,nosuid` (CRITICAL)
3. Removed workspace-specific tmpfs mounts (GitHub Actions handles this)
4. Added `/run` tmpfs mount
5. Added `--security-opt=no-new-privileges:true` explicit flag

**Why This Matters:**

The `:exec` flag allows executing binaries from /tmp, which defeats 30% of our security model. An attacker with prompt injection could:

1. Download malicious binary to /tmp
2. Execute it (with :exec, this would work)
3. Escalate privileges or exfiltrate data

With `:noexec,nosuid`:
1. Download malicious binary to /tmp
2. Try to execute it → **BLOCKED by kernel**
3. Attack fails

This is a **P0 SECURITY REQUIREMENT**.

### 3. Update Documentation References

Throughout both workflows, update:
- `ADR_0001_CONTAINER_SECURITY.md` → `docs/architecture/SECURITY-ARCHITECTURE.md`
- Add reference to test suite: `.claude/tests/security/test_container_security.py`

## Why Workflows May Revert

The workflows may be reverting due to:
1. Pre-commit hooks running formatters
2. Git filters or attributes
3. IDE auto-formatting
4. Another process watching the files

**Solution:** Make changes in a single commit and push immediately.

## Manual Verification Steps

After applying changes:

1. **Check Dockerfile Path:**
   ```bash
   grep "file:" .github/workflows/build-agent-container.yml
   # Should output: file: .claude/docker/Dockerfile
   ```

2. **Check tmpfs Security:**
   ```bash
   grep "tmpfs" .github/workflows/ai-agent.yml
   # Should output: --tmpfs /tmp:rw,noexec,nosuid,size=2g
   # Should NOT contain :exec
   ```

3. **Verify All Security Options:**
   ```bash
   grep -A 15 "container:" .github/workflows/ai-agent.yml
   # Verify all security flags present
   ```

## Testing the Configuration

Once changes are committed:

1. **Trigger Container Build:**
   ```bash
   # Push to main will trigger build workflow
   git push origin main
   ```

2. **Verify Build:**
   - Check GitHub Actions tab
   - Build should complete successfully
   - Image should be pushed to ghcr.io

3. **Run Security Tests (Local):**
   ```bash
   # Start Docker daemon
   docker build -t quetrex-ai-agent:latest -f .claude/docker/Dockerfile .
   pytest .claude/tests/security/test_container_security.py -v
   ```

4. **Expected Output:**
   - All 28 tests PASS
   - No security violations detected

## Rollback Plan

If deployment fails:

1. **Check Build Logs:**
   ```bash
   gh run list --workflow=build-agent-container.yml --limit=1
   gh run view <run-id> --log
   ```

2. **Check Test Logs:**
   ```bash
   # Security tests are in workflow artifacts
   gh run download <run-id>
   ```

3. **Quick Fix:**
   - Revert Dockerfile path if build fails
   - Revert tmpfs options if container won't start
   - Never revert security flags (fix root cause instead)

## Common Issues

### Issue: Container Build Fails

**Symptom:** Build workflow fails with "Dockerfile not found"

**Fix:** Verify path in build workflow:
```yaml
file: .claude/docker/Dockerfile  # Must match actual file location
```

### Issue: Container Won't Start

**Symptom:** AI agent workflow fails with container startup error

**Cause:** Missing writable directories or incorrect tmpfs flags

**Fix:** Verify tmpfs mounts include /tmp and /run

### Issue: Python Packages Not Found

**Symptom:** ImportError for anthropic or other packages

**Fix:** Verify Dockerfile installs all packages:
```dockerfile
RUN pip3 install --user --no-cache-dir \
    anthropic==0.42.0 \
    requests==2.32.3 \
    PyGithub==2.5.0
```

### Issue: Claude CLI Not Found

**Symptom:** "claude: command not found"

**Fix:** Verify Claude CLI installation in Dockerfile:
```dockerfile
RUN curl -fsSL https://claude.ai/install.sh | bash
```

## Security Validation

Before marking Phase 1 complete, verify:

- [ ] Dockerfile uses Ubuntu 22.04 base image
- [ ] Non-root user (claude-agent UID 1000) configured
- [ ] All required packages installed
- [ ] Claude Code CLI installed and working
- [ ] Build workflow uses correct Dockerfile path
- [ ] AI agent workflow has all security flags
- [ ] tmpfs mounts use noexec and nosuid
- [ ] No :exec flags in tmpfs configuration
- [ ] Resource limits set (2GB RAM, 2 CPU, 100 proc)
- [ ] All 28 security tests pass

## Next Steps

After Phase 1 deployment:

1. **Monitor First Run:**
   - Watch GitHub Actions for first agent execution
   - Check container logs for errors
   - Verify security constraints are enforced

2. **Security Audit:**
   - Review container logs for anomalies
   - Verify no security bypass attempts succeed
   - Confirm resource limits are enforced

3. **Phase 2 Planning:**
   - Begin credential proxy service design
   - Prepare Phase 2 implementation plan
   - Schedule security review with team

## Contact

**Implementation:** Glen Barnhardt with help from Claude Code
**Date:** 2025-11-22
**Status:** Ready for deployment (pending workflow edits)
**Priority:** P0 (Security)
