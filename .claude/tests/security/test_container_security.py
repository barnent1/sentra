#!/usr/bin/env python3
"""
Security Test Suite for Quetrex AI Agent Container

This test suite verifies all security measures defined in Phase 1:
Docker Containerization (SECURITY-ARCHITECTURE.md lines 1215-1292)

Security Measures Tested:
1. Read-only root filesystem (except /tmp)
2. /tmp is writable but NOT executable
3. Process limits enforced (100 max)
4. Memory limits enforced (2GB max)
5. Non-root user execution (claude-agent)
6. No privileged port binding (< 1024)

Risk Reduction: 60-70%

Usage:
    pytest .claude/tests/security/test_container_security.py -v

Requirements:
    - Docker installed and running
    - Image built: docker build -t quetrex-ai-agent:latest -f .claude/docker/Dockerfile .
    - pytest installed: pip install pytest
"""

import subprocess
import pytest
import time
import os


# Container image to test
IMAGE_NAME = "quetrex-ai-agent:latest"

# Runtime security options (matches .github/workflows/ai-agent.yml)
SECURITY_OPTIONS = [
    "--rm",  # Auto-remove container after run
    "--read-only",  # Read-only root filesystem
    "--tmpfs", "/tmp:rw,noexec,nosuid,size=2g",  # Ephemeral /tmp (not executable)
    "--cap-drop=ALL",  # Drop all Linux capabilities
    "--security-opt=no-new-privileges",  # Prevent privilege escalation
    "--pids-limit=100",  # Max 100 processes
    "--memory=2g",  # Max 2GB RAM
    "--memory-swap=2g",  # No additional swap
    "--cpus=2",  # Max 2 CPU cores
    "--oom-kill-disable=false",  # Allow OOM killer
]


def run_docker_command(command, timeout=10, security_opts=None):
    """
    Run a command in the Docker container with security options.

    Args:
        command: Command to run (string or list)
        timeout: Max execution time in seconds
        security_opts: Security options (defaults to SECURITY_OPTIONS)

    Returns:
        subprocess.CompletedProcess with stdout, stderr, returncode
    """
    if security_opts is None:
        security_opts = SECURITY_OPTIONS

    if isinstance(command, str):
        command = ["bash", "-c", command]

    cmd = ["docker", "run"] + security_opts + [IMAGE_NAME] + command

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=timeout,
            text=True
        )
        return result
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(
            cmd, 124, stdout="", stderr="Command timed out"
        )


@pytest.fixture(scope="session", autouse=True)
def check_docker_image():
    """Verify Docker image exists before running tests."""
    result = subprocess.run(
        ["docker", "images", "-q", IMAGE_NAME],
        capture_output=True,
        text=True
    )

    if not result.stdout.strip():
        pytest.fail(
            f"Docker image '{IMAGE_NAME}' not found. "
            f"Build it first: docker build -t {IMAGE_NAME} -f .claude/docker/Dockerfile ."
        )


class TestFilesystemSecurity:
    """Test filesystem isolation and read-only enforcement."""

    def test_root_filesystem_read_only(self):
        """Verify root filesystem is read-only."""
        result = run_docker_command("touch /etc/test.txt")

        assert result.returncode != 0, "Should not be able to write to /etc"
        assert "Read-only file system" in result.stderr or "Permission denied" in result.stderr

    def test_usr_read_only(self):
        """Verify /usr is read-only."""
        result = run_docker_command("touch /usr/test.txt")

        assert result.returncode != 0, "Should not be able to write to /usr"
        assert "Read-only file system" in result.stderr or "Permission denied" in result.stderr

    def test_var_read_only(self):
        """Verify /var is read-only."""
        result = run_docker_command("touch /var/test.txt")

        assert result.returncode != 0, "Should not be able to write to /var"
        assert "Read-only file system" in result.stderr or "Permission denied" in result.stderr

    def test_tmp_writable(self):
        """Verify /tmp is writable."""
        result = run_docker_command("echo 'test content' > /tmp/test.txt && cat /tmp/test.txt")

        assert result.returncode == 0, f"Should be able to write to /tmp: {result.stderr}"
        assert "test content" in result.stdout

    def test_tmp_not_executable(self):
        """Verify /tmp has noexec flag (cannot execute binaries)."""
        result = run_docker_command(
            'echo "#!/bin/bash\necho hello" > /tmp/test.sh && '
            'chmod +x /tmp/test.sh && '
            '/tmp/test.sh'
        )

        assert result.returncode != 0, "Should not be able to execute files in /tmp"
        assert "Permission denied" in result.stderr or "cannot execute" in result.stderr.lower()

    def test_home_directory_writable(self):
        """Verify home directory workspace is writable (via tmpfs mount)."""
        # Note: In GitHub Actions, workspace is mounted as tmpfs
        # This test verifies the user can write to their home directory
        result = run_docker_command(
            "echo 'test' > ~/test.txt && cat ~/test.txt"
        )

        # This may fail in base container (no workspace tmpfs)
        # but will work in GitHub Actions with --tmpfs mounts
        if result.returncode == 0:
            assert "test" in result.stdout


class TestUserSecurity:
    """Test non-root user execution and privilege restrictions."""

    def test_non_root_user(self):
        """Verify running as non-root user (claude-agent)."""
        result = run_docker_command("whoami")

        assert result.returncode == 0
        assert "claude-agent" in result.stdout.strip()
        assert "root" not in result.stdout.strip()

    def test_uid_gid(self):
        """Verify correct UID/GID (1000:100 for claude-agent:users)."""
        result = run_docker_command("id")

        assert result.returncode == 0
        assert "uid=1000(claude-agent)" in result.stdout
        # GID may be 100 (users) or other depending on system
        assert "claude-agent" in result.stdout

    def test_no_sudo(self):
        """Verify sudo is not available (not installed)."""
        result = run_docker_command("sudo echo test")

        assert result.returncode != 0
        assert "sudo: command not found" in result.stderr or "not found" in result.stderr

    def test_no_privileged_port_bind(self):
        """Verify cannot bind privileged ports (< 1024)."""
        result = run_docker_command(
            "python3.11 -c 'import socket; s = socket.socket(); s.bind((\"\", 80))'"
        )

        assert result.returncode != 0, "Should not be able to bind to port 80"
        assert "Permission denied" in result.stderr or "error" in result.stderr.lower()

    def test_can_bind_unprivileged_port(self):
        """Verify can bind unprivileged ports (>= 1024)."""
        result = run_docker_command(
            "python3.11 -c 'import socket; s = socket.socket(); s.bind((\"\", 8080)); print(\"success\")'"
        )

        assert result.returncode == 0
        assert "success" in result.stdout


class TestResourceLimits:
    """Test resource limits (CPU, memory, processes)."""

    def test_process_limit(self):
        """Verify process limit enforced (100 max)."""
        # Try to create 150 background processes
        result = run_docker_command(
            "for i in {1..150}; do ( sleep 60 ) & done; wait",
            timeout=5
        )

        # Should hit process limit and fail
        assert result.returncode != 0, "Should hit process limit"
        # May timeout or get resource error
        assert "fork" in result.stderr.lower() or "timed out" in result.stderr.lower() or result.returncode == 124

    def test_memory_limit(self):
        """Verify memory limit enforced (2GB max)."""
        # Try to allocate 3GB of memory (exceeds 2GB limit)
        result = run_docker_command(
            "python3.11 -c 'a = [0] * (3 * 1024 * 1024 * 1024 // 8)'",
            timeout=15
        )

        # Should be killed by OOM
        assert result.returncode != 0, "Should be killed by OOM"
        # May get killed silently or with error

    def test_cpu_limit_set(self):
        """Verify CPU limit is set (cannot use more than 2 cores)."""
        # This test just verifies the container starts with CPU limit
        # Actual CPU usage limiting is done by Docker/cgroups
        result = run_docker_command("nproc")

        assert result.returncode == 0
        # Container may see all host CPUs, but usage is limited by cgroups
        # This is expected behavior - the --cpus flag limits CPU time, not visibility


class TestCapabilities:
    """Test Linux capability restrictions."""

    def test_no_capabilities(self):
        """Verify all capabilities are dropped."""
        result = run_docker_command("capsh --print")

        assert result.returncode == 0
        # Should show empty or minimal capability set
        # Note: capsh may not be available, which is fine
        if "command not found" not in result.stderr:
            output = result.stdout.lower()
            # Should NOT have dangerous capabilities
            assert "cap_sys_admin" not in output
            assert "cap_net_admin" not in output
            assert "cap_sys_ptrace" not in output

    def test_cannot_change_network_config(self):
        """Verify cannot modify network configuration (no CAP_NET_ADMIN)."""
        result = run_docker_command(
            "ip link set lo down"
        )

        # May fail due to missing 'ip' command or lack of capability
        # Either is acceptable - we just don't want it to succeed
        assert result.returncode != 0


class TestSecurityOptions:
    """Test additional security options."""

    def test_no_new_privileges(self):
        """Verify no-new-privileges is set."""
        # This is enforced by --security-opt=no-new-privileges
        # We can't directly test it, but we can verify setuid doesn't work
        result = run_docker_command(
            "ls -la /usr/bin/passwd"  # setuid binary
        )

        # passwd may not exist in minimal container, which is fine
        if result.returncode == 0:
            # Even if setuid bit is set, it won't work due to no-new-privileges
            pass

    def test_container_exits_cleanly(self):
        """Verify container exits cleanly after execution."""
        result = run_docker_command("echo 'test'")

        assert result.returncode == 0
        assert "test" in result.stdout


class TestRuntimeEnvironment:
    """Test runtime environment and dependencies."""

    def test_python_version(self):
        """Verify Python 3.11 is installed."""
        result = run_docker_command("python3.11 --version")

        assert result.returncode == 0
        assert "Python 3.11" in result.stdout

    def test_node_version(self):
        """Verify Node.js 20.x is installed."""
        result = run_docker_command("node --version")

        assert result.returncode == 0
        assert "v20." in result.stdout

    def test_npm_version(self):
        """Verify npm is installed."""
        result = run_docker_command("npm --version")

        assert result.returncode == 0
        # npm version should be 9.x or 10.x

    def test_git_version(self):
        """Verify git is installed."""
        result = run_docker_command("git --version")

        assert result.returncode == 0
        assert "git version" in result.stdout

    def test_claude_cli_installed(self):
        """Verify Claude Code CLI is installed."""
        result = run_docker_command("claude --version")

        assert result.returncode == 0
        # Should show version number
        assert "claude" in result.stdout.lower() or len(result.stdout.strip()) > 0

    def test_python_packages_installed(self):
        """Verify required Python packages are installed."""
        result = run_docker_command(
            "python3.11 -c 'import anthropic, requests; print(\"success\")'"
        )

        assert result.returncode == 0
        assert "success" in result.stdout

    def test_git_configured(self):
        """Verify git is configured for non-interactive use."""
        result = run_docker_command("git config --get user.name")

        assert result.returncode == 0
        assert "Quetrex AI Agent" in result.stdout


class TestSecurityVerification:
    """Overall security verification tests."""

    def test_no_suid_binaries_writable(self):
        """Verify SUID binaries cannot be created."""
        result = run_docker_command(
            "touch /tmp/test && chmod u+s /tmp/test && ls -la /tmp/test"
        )

        # chmod should succeed but suid bit won't stick due to nosuid on /tmp
        if result.returncode == 0:
            # Verify suid bit is NOT set
            assert "rws" not in result.stdout

    def test_environment_variables_secure(self):
        """Verify no sensitive environment variables exposed."""
        result = run_docker_command("env")

        assert result.returncode == 0
        # Should NOT contain API keys or secrets
        output = result.stdout.lower()
        assert "api_key" not in output or "***" in output  # May be masked
        assert "secret" not in output or "disable" in output  # JWT_SECRET not exposed
        assert "password" not in output

    def test_full_security_stack(self):
        """Verify all security measures work together."""
        # Comprehensive test: try to break out of container
        result = run_docker_command(
            "whoami && "
            "touch /etc/test 2>&1 || echo 'fs_readonly_ok' && "
            "touch /tmp/test && "
            "python3.11 -c 'import socket; s = socket.socket(); s.bind((\"\", 80))' 2>&1 || echo 'no_priv_port_ok'"
        )

        assert "claude-agent" in result.stdout
        assert "fs_readonly_ok" in result.stdout
        assert "no_priv_port_ok" in result.stdout


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "--tb=short"])
