# Quetrex AI Agent Docker Container
# Phase 1: Docker Containerization Security
#
# This Dockerfile implements the security architecture defined in:
# docs/architecture/SECURITY-ARCHITECTURE.md (lines 139-173)
#
# Security Features:
# - Read-only root filesystem (enforced at runtime)
# - Non-root user execution (UID/GID 1000)
# - Minimal attack surface (only essential tools)
# - No Linux capabilities (dropped at runtime)
# - Resource limits (enforced at runtime)
#
# Risk Reduction: 60-70%
# Phase 2 (credential proxy) will add another 30%

FROM ubuntu:22.04

# Set environment to prevent interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# Minimize attack surface - only essential tools
# Python 3.11: Required for AI agent worker script
# Node.js 20.x: Required for Next.js development (LTS version)
# git: Required for repository operations
# curl, ca-certificates: Required for Claude Code CLI installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Python runtime
    python3.11 \
    python3-pip \
    python3.11-venv \
    # Node.js setup
    curl \
    ca-certificates \
    gnupg \
    # Git for version control
    git \
    # Required for Claude Code CLI
    bash \
    # Required for security testing
    libcap2-bin \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x LTS (required by Next.js 15)
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user with explicit UID/GID
# UID/GID 1000: Standard first user on Ubuntu (matches host user in most cases)
# Non-root execution prevents privilege escalation attacks
RUN useradd -m -s /bin/bash -u 1000 -g users claude-agent && \
    mkdir -p /home/claude-agent/workspace && \
    mkdir -p /home/claude-agent/.claude && \
    mkdir -p /home/claude-agent/.cache && \
    chown -R claude-agent:users /home/claude-agent

# Switch to non-root user for all remaining operations
USER claude-agent:users

# Set working directory
WORKDIR /home/claude-agent/workspace

# Configure PATH for user-installed packages
# Claude Code CLI will be installed to ~/.local/bin
ENV PATH="/home/claude-agent/.local/bin:/home/claude-agent/node_modules/.bin:$PATH"
ENV PYTHONPATH="/home/claude-agent/.local/lib/python3.11/site-packages:$PYTHONPATH"

# Pre-install Python dependencies
# anthropic: Required for AI agent communication
# requests: Required for HTTP calls
# PyGithub: Required for GitHub API access
# --user: Install to user site-packages (not system-wide)
# --no-cache-dir: Don't cache packages (reduces image size)
RUN pip3 install --user --no-cache-dir \
    anthropic==0.42.0 \
    requests==2.32.3 \
    PyGithub==2.5.0

# Install Claude Code CLI (native binary installation)
# This is the official Claude Code CLI, NOT the Anthropic SDK
# See: .claude/docs/ARCHITECTURE-AGENT-WORKER.md for rationale
RUN curl -fsSL https://claude.ai/install.sh | bash

# Verify installations
RUN python3.11 --version && \
    node --version && \
    npm --version && \
    claude --version && \
    echo "All dependencies installed successfully"

# Set environment variables for Claude Code CLI
# DISABLE_AUTOUPDATER: Prevent Claude from auto-updating during execution
# DISABLE_TELEMETRY: No telemetry data sent from container
ENV DISABLE_AUTOUPDATER=true
ENV DISABLE_TELEMETRY=true

# Configure git for non-interactive use
RUN git config --global user.name "Quetrex AI Agent" && \
    git config --global user.email "agent@quetrex.dev" && \
    git config --global init.defaultBranch main

# Health check: Verify all required tools are available
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3.11 --version && node --version && claude --version || exit 1

# Entrypoint runs the AI agent worker script
# The script is provided by the GitHub Actions checkout step
# See: .github/workflows/ai-agent.yml for runtime configuration
ENTRYPOINT ["python3.11", ".claude/scripts/ai-agent-worker.py"]

# Default command (can be overridden at runtime)
CMD ["--help"]

# Security Runtime Notes:
# =======================
# The following security measures are enforced at RUNTIME (not in Dockerfile):
#
# 1. Read-only filesystem: --read-only
#    - Prevents writing to system files
#    - Only /tmp and specific directories are writable (via tmpfs)
#
# 2. Ephemeral writable mounts: --tmpfs
#    - /tmp: Standard temporary files (noexec, nosuid)
#    - ~/.cache: Python/npm cache (needed for package installs)
#    - ~/workspace: Working directory for git operations
#    - ~/.claude/telemetry: Claude Code logs
#
# 3. No Linux capabilities: --cap-drop=ALL
#    - Removes ALL capabilities (even defaults like CAP_CHOWN)
#    - No capabilities added back (strict isolation)
#
# 4. Resource limits:
#    - --memory=2g: Maximum 2GB RAM
#    - --memory-swap=2g: No additional swap
#    - --cpus=2: Maximum 2 CPU cores
#    - --pids-limit=100: Maximum 100 processes (prevents fork bombs)
#
# 5. Additional protections:
#    - --security-opt=no-new-privileges: Prevents privilege escalation
#    - --oom-kill-disable=false: Container can be OOM killed
#
# See: .github/workflows/ai-agent.yml for complete runtime configuration
