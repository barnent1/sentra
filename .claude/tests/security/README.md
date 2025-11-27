# Container Security Testing

Phase 1: Docker Containerization Security Tests

## Overview

This test suite verifies all security measures implemented in Phase 1 of the security architecture:
- Read-only root filesystem
- Non-root user execution
- No Linux capabilities
- Resource limits (CPU, memory, processes)
- Ephemeral tmpfs mounts with noexec/nosuid

**Expected Risk Reduction:** 60-70%

## Prerequisites

1. **Docker installed and running**
   ```bash
   docker --version
   ```

2. **Python 3.11+ with pytest**
   ```bash
   pip install pytest
   ```

3. **Build the container image**
   ```bash
   docker build -t quetrex-ai-agent:latest -f .claude/docker/Dockerfile .
   ```

## Running Tests

### Quick Test (All Tests)
```bash
pytest .claude/tests/security/test_container_security.py -v
```

### Run Specific Test Classes
```bash
# Test filesystem security
pytest .claude/tests/security/test_container_security.py::TestFilesystemSecurity -v

# Test user security
pytest .claude/tests/security/test_container_security.py::TestUserSecurity -v

# Test resource limits
pytest .claude/tests/security/test_container_security.py::TestResourceLimits -v

# Test capabilities
pytest .claude/tests/security/test_container_security.py::TestCapabilities -v

# Test runtime environment
pytest .claude/tests/security/test_container_security.py::TestRuntimeEnvironment -v

# Test overall security
pytest .claude/tests/security/test_container_security.py::TestSecurityVerification -v
```

### Run with Coverage
```bash
pytest .claude/tests/security/test_container_security.py -v --cov
```

## Expected Results

All tests should PASS with output similar to:

```
test_container_security.py::TestFilesystemSecurity::test_root_filesystem_read_only PASSED
test_container_security.py::TestFilesystemSecurity::test_tmp_writable PASSED
test_container_security.py::TestFilesystemSecurity::test_tmp_not_executable PASSED
test_container_security.py::TestUserSecurity::test_non_root_user PASSED
test_container_security.py::TestResourceLimits::test_process_limit PASSED
test_container_security.py::TestResourceLimits::test_memory_limit PASSED
...
========================== 20 passed in 45.23s ==========================
```

## Security Measures Verified

### 1. Filesystem Isolation (5 tests)
- ✅ Root filesystem is read-only
- ✅ /usr and /var are read-only
- ✅ /tmp is writable
- ✅ /tmp has noexec flag (cannot execute binaries)
- ✅ Home directory workspace is writable (GitHub Actions only)

### 2. User Security (4 tests)
- ✅ Running as non-root user (claude-agent)
- ✅ Correct UID/GID (1000:100)
- ✅ No sudo access
- ✅ Cannot bind privileged ports (< 1024)
- ✅ Can bind unprivileged ports (>= 1024)

### 3. Resource Limits (3 tests)
- ✅ Process limit enforced (100 max)
- ✅ Memory limit enforced (2GB max)
- ✅ CPU limit set (2 cores)

### 4. Capabilities (2 tests)
- ✅ All capabilities dropped
- ✅ Cannot modify network configuration

### 5. Runtime Environment (7 tests)
- ✅ Python 3.11 installed
- ✅ Node.js 20.x installed
- ✅ npm installed
- ✅ git installed and configured
- ✅ Claude Code CLI installed
- ✅ Required Python packages installed
- ✅ Git configured for non-interactive use

### 6. Security Verification (3 tests)
- ✅ SUID binaries cannot be created
- ✅ No sensitive environment variables exposed
- ✅ Full security stack works together

## Troubleshooting

### Docker daemon not running
```bash
# macOS
open -a Docker

# Linux (systemd)
sudo systemctl start docker
```

### Image not found
Build the image first:
```bash
docker build -t quetrex-ai-agent:latest -f .claude/docker/Dockerfile .
```

### Tests timing out
Some tests (like memory limit) may take longer. Increase timeout:
```bash
pytest .claude/tests/security/test_container_security.py -v --timeout=60
```

### Permission denied errors
Make sure Docker daemon is running and your user has Docker permissions:
```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## CI/CD Integration

These tests run automatically in GitHub Actions when:
1. Container image is built (`.github/workflows/build-agent-container.yml`)
2. Pull requests are created (`.github/workflows/test.yml`)

## Next Steps

After Phase 1 passes all tests:
1. **Phase 2: Credential Proxy Service** (30% additional risk reduction)
   - Unix socket-based credential proxy
   - Credentials never exposed to container
   - Full audit trail of credential usage

2. **Phase 3: gVisor Migration** (15% additional risk reduction)
   - User-space kernel
   - No direct syscall exposure
   - Industry-leading security

## References

- **Security Architecture:** `/docs/architecture/SECURITY-ARCHITECTURE.md`
- **Dockerfile:** `.claude/docker/Dockerfile`
- **GitHub Actions Workflow:** `.github/workflows/ai-agent.yml`
- **Build Workflow:** `.github/workflows/build-agent-container.yml`
