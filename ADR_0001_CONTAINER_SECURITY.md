# ADR-0001: Container Security Architecture for Sentra AI Agent System

**Status:** PROPOSED (Awaiting Glen's Decision)  
**Date:** November 12, 2025  
**Author:** Glen Barnhardt (with Claude Code)  
**Supersedes:** None  
**Related:** CRITICAL_SECURITY_FINDINGS.md, TECHNICAL_RESEARCH_CLAUDE_CODE.md

---

## Context

Sentra runs untrusted AI-generated code (from Claude) in GitHub Actions workflows. This code has direct access to:
- `$GITHUB_TOKEN` (can modify repository, create backdoors)
- `$ANTHROPIC_API_KEY` (can drain API credits, modify settings)
- Entire runner filesystem
- Network access to any domain
- Execution permissions for any command

**Current Threat Model:**
- Prompt injection → Malicious code generation
- Claude exploited by sophisticated jailbreak prompt
- Malicious code exfiltrates credentials
- Attacker gains repository control

**Probability:** Moderate (jailbreaks improve monthly)  
**Impact:** CRITICAL (full GitHub account compromise)

---

## Decision

**We will implement a 3-phase container security architecture:**

### Phase 1: Docker Containerization (Weeks 1-2)
- Timeline: ASAP
- Risk reduction: 60-70%
- Implementation: Docker with isolation options

### Phase 2: Credential Proxy Service (Weeks 2-4)
- Timeline: Immediately after Phase 1
- Risk reduction: 30% (critical)
- Implementation: Unix socket proxy

### Phase 3: gVisor Migration (Months 2-3)
- Timeline: Next quarter
- Risk reduction: 15% (remaining)
- Implementation: Custom gVisor infrastructure

---

## Options Considered

### Option A: Status Quo (NO CHANGE)
**Pros:**
- No engineering effort
- System works "as-is"

**Cons:**
- CRITICAL security gaps (credential theft probable)
- Cannot deploy to production
- Regulatory non-compliance
- Supply chain compromise risk

**Verdict:** REJECTED (unacceptable risk)

---

### Option B: Quick Docker Band-Aid (Docker only, no proxy)
**Pros:**
- Fast implementation (2-3 days)
- Improves filesystem isolation
- Low complexity

**Cons:**
- Network isolation still missing
- Credentials still in process memory
- Incomplete security solution
- False sense of security

**Verdict:** REJECTED (insufficient)

---

### Option C: Sentra's Choice - Comprehensive 3-Phase Approach
**Pros:**
- Phases 1+2 = production-ready (85% secure)
- Phase 3 = industry-leading (95%+ secure)
- Scalable (gVisor preparation)
- Matches Anthropic's architecture
- Defensible to customers
- Enterprise-grade security posture

**Cons:**
- Engineering effort: 20-25 days
- Complexity increases over time
- Requires new infrastructure (Phase 3)

**Verdict:** SELECTED (best long-term path)

---

### Option D: Pure gVisor from Day 1
**Pros:**
- Highest security immediately
- No need for Phase 1+2
- Enterprise-grade from start

**Cons:**
- Engineering effort: 20-25 days all at once
- Cannot use GitHub Actions
- Custom infrastructure needed immediately
- Delays other features by 5 weeks

**Verdict:** REJECTED (too aggressive timeline)

---

## Detailed Design

### Phase 1: Docker Containerization

#### Dockerfile

```dockerfile
FROM ubuntu:22.04

# Install only necessary tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3.11 python3-pip nodejs npm git curl && \
    rm -rf /var/lib/apt/lists/*

# Non-root user (security best practice)
RUN useradd -m -s /bin/bash claude-agent

WORKDIR /home/claude-agent/workspace
RUN chown -R claude-agent:claude-agent /home/claude-agent

# Run as non-root
USER claude-agent:claude-agent

ENV PATH="/home/claude-agent/.local/bin:$PATH"

# Pre-install dependencies
RUN pip install --user anthropic requests

ENTRYPOINT ["python3.11", ".claude/scripts/ai-agent-worker.py"]
```

#### Workflow Update

```yaml
jobs:
  ai-agent-work:
    runs-on: ubuntu-latest
    
    # NEW: Use container for isolation
    container:
      image: ghcr.io/barnent1/sentra-ai-agent:latest
      options: |
        --rm
        --read-only
        --tmpfs /tmp:rw,noexec,nosuid,size=2g
        --tmpfs /run:rw,size=100m
        --cap-drop=ALL
        --cap-add=CHOWN
        --cap-add=SETUID
        --cap-add=SETGID
        --security-opt=no-new-privileges:true
        --pids-limit=100
        --memory=2g
        --cpus=2
        --oom-kill-disable=true
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run AI Agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          python3.11 .claude/scripts/ai-agent-worker.py \
            ${{ github.event.issue.number }}
```

#### Security Features Enabled

1. **Read-only Root Filesystem**
   - Prevents malicious code from modifying system
   - Only /tmp and /run are writable
   - Still needs to exec Python (solved with CAP_EXECVE)

2. **tmpfs /tmp**
   - In-memory only (no disk persistence)
   - Automatic cleanup on job termination
   - noexec flag prevents direct execution

3. **Capability Dropping**
   - CAP_DROP=ALL removes most privileges
   - Only essential CAPs added back
   - Prevents privilege escalation

4. **Process Limits**
   - Max 100 processes (prevents fork bomb)
   - Memory limit 2GB (prevents OOM attacks)
   - CPU limit 2 cores (prevents resource hogging)

5. **No New Privileges**
   - security-opt prevents escalation
   - setuid/setgid still available (for git operations)

#### Isolation Verification Tests

```bash
# Test 1: Cannot modify /etc
docker run --rm sentra-ai-agent:latest \
  touch /etc/test.txt
# Expected: Permission denied

# Test 2: Can write to /tmp
docker run --rm sentra-ai-agent:latest \
  echo test > /tmp/test.txt && cat /tmp/test.txt
# Expected: "test"

# Test 3: /tmp is not executable
docker run --rm sentra-ai-agent:latest \
  echo '#!/bin/sh' > /tmp/test.sh && chmod +x /tmp/test.sh && /tmp/test.sh
# Expected: Permission denied

# Test 4: Process limit enforced
docker run --rm --pids-limit=10 sentra-ai-agent:latest \
  bash -c 'for i in {1..100}; do ( sleep infinity ) & done'
# Expected: killed after ~10 processes

# Test 5: Memory limit enforced
docker run --rm --memory=100m sentra-ai-agent:latest \
  python3 -c "import array; a = array.array('i', range(100000000))"
# Expected: OOMKilled
```

**Phase 1 Impact:**
- Filesystem isolation: ✓ (prevents /etc access)
- Network isolation: ✗ (still needed)
- Credential security: ✗ (still in env vars)
- Resource limits: ✓ (kernel-enforced)

---

### Phase 2: Credential Proxy Service

#### Architecture

```
┌─────────────────────────────────────────────────┐
│ GitHub Actions Runner (Host)                     │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Credential Proxy Service (Host Process)   │  │
│  │ ─────────────────────────────────────────│  │
│  │ - Listen on /var/run/credential-proxy.sock  │
│  │ - Validate requests                         │
│  │ - Attach real credentials                   │
│  │ - Log all access                            │
│  └────────────────────────────────────────────┘
│       ↑                                         │
│       │ /var/run/credential-proxy.sock         │
│       │ (Unix domain socket)                    │
│       │                                         │
│  ┌──────────────────────────────────────────┐  │
│  │ Docker Container (Isolated)              │  │
│  │ ─────────────────────────────────────────│  │
│  │ Claude Agent Code:                         │  │
│  │ - NO access to $GITHUB_TOKEN              │  │
│  │ - NO access to $ANTHROPIC_API_KEY         │  │
│  │ - Request: "Clone github.com/user/repo"  │  │
│  │ - Proxy validates + attaches token        │  │
│  │ - Agent never sees token                  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### Implementation: Credential Proxy Service

```python
#!/usr/bin/env python3
# .claude/services/credential-proxy.py

import json
import socket
import subprocess
import os
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

class CredentialProxy:
    """
    Validates and provides credentials to sandboxed agent.
    Runs as host process, not inside container.
    """
    
    def __init__(self, socket_path: str = "/var/run/credential-proxy.sock"):
        self.socket_path = socket_path
        self.audit_log = Path.home() / ".claude" / "credential-audit.log"
        
        # Define allowed operations per service
        self.allowed_operations = {
            "github": {
                "clone": {"scopes": ["repo"]},
                "push": {"scopes": ["repo"]},
                "pull": {"scopes": ["repo"]},
            },
            "anthropic": {
                "api_call": {"scopes": ["default"]},
            }
        }
    
    def validate_request(self, request: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate if request is allowed."""
        service = request.get("service")
        operation = request.get("operation")
        
        if service not in self.allowed_operations:
            return False, f"Unknown service: {service}"
        
        if operation not in self.allowed_operations[service]:
            return False, f"Operation not allowed: {service}/{operation}"
        
        return True, None
    
    def get_credential(self, service: str) -> Optional[str]:
        """Get credential from secure location."""
        if service == "github":
            # GitHub CLI provides token
            try:
                result = subprocess.run(
                    ["gh", "auth", "token"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    return result.stdout.strip()
            except Exception as e:
                self.log_error(f"Failed to get GitHub token: {e}")
                return None
        
        elif service == "anthropic":
            # From environment (only accessible to host process)
            return os.getenv("ANTHROPIC_API_KEY")
        
        return None
    
    def log_audit(self, request: Dict[str, Any], status: str) -> None:
        """Log credential access for audit trail."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "service": request.get("service"),
            "operation": request.get("operation"),
            "status": status,
            "requester_pid": os.getppid(),  # Parent process (container)
        }
        
        with open(self.audit_log, "a") as f:
            f.write(json.dumps(entry) + "\n")
    
    def log_error(self, message: str) -> None:
        """Log errors."""
        print(f"[CREDENTIAL_PROXY] ERROR: {message}", flush=True)
    
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle credential request from container."""
        # Validate request
        valid, error = self.validate_request(request)
        if not valid:
            self.log_audit(request, "REJECTED")
            return {"error": error, "status": "rejected"}
        
        # Get credential
        service = request["service"]
        token = self.get_credential(service)
        
        if not token:
            self.log_audit(request, "FAILED_TO_RETRIEVE")
            return {"error": "Failed to retrieve credential", "status": "error"}
        
        # Log successful retrieval
        self.log_audit(request, "GRANTED")
        
        return {
            "status": "granted",
            "token": token,
            "expires_in": 3600,  # 1 hour
        }

def main():
    proxy = CredentialProxy()
    # Socket creation and listening loop...
    pass

if __name__ == "__main__":
    main()
```

#### Usage in Agent

```python
# In ai-agent-worker.py
class AgentWorker:
    def __init__(self, issue_number: int):
        self.credential_socket = "/var/run/credential-proxy.sock"
        
        # DON'T load credentials directly
        # (they're not available in env inside container)
    
    def get_github_token(self) -> str:
        """Request credential from proxy."""
        with socket.socket(socket.AF_UNIX) as sock:
            sock.connect(self.credential_socket)
            
            request = {
                "service": "github",
                "operation": "clone",
            }
            
            sock.send(json.dumps(request).encode())
            response = json.loads(sock.recv(1024).decode())
            
            if response.get("status") == "granted":
                return response["token"]
            else:
                raise RuntimeError(f"Credential request denied: {response.get('error')}")
```

#### Workflow Changes

```yaml
jobs:
  ai-agent-work:
    runs-on: ubuntu-latest
    
    container:
      image: sentra-ai-agent:latest
      options: |
        --rm
        --read-only
        --tmpfs /tmp:rw,noexec,nosuid,size=2g
        --mount type=tmpfs,destination=/run
        # NEW: Mount socket from host
        -v /var/run/credential-proxy.sock:/var/run/credential-proxy.sock:ro
        --cap-drop=ALL
        # ... other options
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Start credential proxy
        # NEW: Start proxy on host before container runs
        run: |
          python3 .claude/services/credential-proxy.py &
          PROXY_PID=$!
          echo "PROXY_PID=$PROXY_PID" >> $GITHUB_ENV
          sleep 1  # Wait for socket creation
      
      - name: Run AI Agent
        # Remove GITHUB_TOKEN and ANTHROPIC_API_KEY from env
        run: |
          python3.11 .claude/scripts/ai-agent-worker.py \
            ${{ github.event.issue.number }}
```

**Phase 2 Impact:**
- Filesystem isolation: ✓ (from Phase 1)
- Network isolation: ✗ (still needed)
- Credential security: ✓ (no longer in env vars)
- Resource limits: ✓ (from Phase 1)
- Audit trail: ✓ (credential-audit.log)

---

### Phase 3: gVisor Migration (Future)

**Deferred to Q1 2026** (requires custom infrastructure)

Will involve:
- Setting up gVisor runtime infrastructure
- Custom container orchestration (not GitHub Actions)
- Replacing credential proxy with gVisor-compatible model
- End result: Industry-leading security

---

## Rollout Strategy

### Rollout Phase 1 (Week 1)

```
Day 1-2: Build Dockerfile, test locally
Day 3: Deploy to staging branch
Day 4-5: Run security tests, iterate
Day 6: Deploy to main (behind feature flag)
Day 7: Monitor, rollback if needed
```

### Rollout Phase 2 (Week 2-3)

```
Day 1-2: Implement credential proxy
Day 3-4: Integration testing
Day 5: Deploy to main
Day 6-7: Monitor, fine-tune
```

### Rollout Phase 3 (Q1 2026)

Plan gVisor infrastructure during Q4 2025.

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Credential proxy crashes, job fails | Medium | High | Fallback timeout (15 min), manual intervention |
| Docker image startup slow | Low | Medium | Cache layers, optimize Dockerfile |
| Incompatible with GitHub Actions | Low | Critical | Extensive testing before rollout |
| Socket permission issues | Medium | Medium | Use umask 0077, strict testing |

---

## Success Criteria

Phase 1 Success:
- [ ] Dockerfile builds successfully
- [ ] All security tests pass
- [ ] Job runtime < 10% slower
- [ ] Zero false negatives (legitimate operations work)

Phase 2 Success:
- [ ] Credentials never appear in environment
- [ ] Audit log captures all requests
- [ ] Zero credentials leaked to container
- [ ] Integration tests pass

Phase 3 Success (future):
- [ ] gVisor deployment live
- [ ] Zero syscall exposure to host kernel
- [ ] 95%+ security posture achieved

---

## Alternatives Not Taken

### Why not AWS Lambda?
- Limited to 15-minute execution time
- Sentra tasks can take 30-45 minutes
- More expensive ($2-3 per task)
- Overkill for most small tasks

### Why not Firecracker?
- Slower startup (5-10 seconds vs <1 second)
- Larger memory footprint
- More complex operational overhead
- Docker is sufficient for our threat model

### Why not Kubernetes?
- Over-engineered for current scale
- Adds operational complexity
- GitHub Actions integration painful
- Docker + gVisor is better path

---

## Approval

**Awaiting decision from:** Glen Barnhardt

**Required approvals:**
- [ ] Glen (Technical Lead)
- [ ] Security review (if applicable)
- [ ] Architecture review

**Implementation will begin upon approval.**

---

## References

- CRITICAL_SECURITY_FINDINGS.md - Summary of gaps
- TECHNICAL_RESEARCH_CLAUDE_CODE.md - Deep technical analysis
- gVisor documentation: https://gvisor.dev
- Docker security: https://docs.docker.com/engine/security/

---

**Generated by Glen Barnhardt with the help of Claude Code**  
**Date:** November 12, 2025  
**Next Review:** December 12, 2025 (or upon decision)
