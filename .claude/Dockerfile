# Sentra AI Agent - Secure Docker Container
# Phase 1: Docker Containerization for GitHub Actions
# Decision: ADR_0001_CONTAINER_SECURITY.md
# Author: Glen Barnhardt (with Claude Code)

FROM ubuntu:22.04

# Security: Reduce attack surface by installing only required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    nodejs \
    npm \
    git \
    curl \
    ca-certificates \
    wget \
    gnupg && \
    # Install GitHub CLI
    wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && \
    apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/*

# Install Python packages system-wide (before creating non-root user)
# This ensures packages are in read-only filesystem, not ephemeral tmpfs
RUN python3.11 -m pip install --no-cache-dir \
    anthropic \
    requests \
    PyGithub

# Security: Create non-root user for running agent code
RUN useradd -m -s /bin/bash -u 1001 claude-agent && \
    mkdir -p /home/claude-agent/workspace && \
    chown -R claude-agent:claude-agent /home/claude-agent

# Set working directory
WORKDIR /home/claude-agent/workspace

# Switch to non-root user for runtime
USER claude-agent:claude-agent

# Security: Drop all capabilities by default (will be enforced in workflow)
# Security: Read-only root filesystem (will be enforced in workflow)
# Security: Tmpfs for /tmp (will be enforced in workflow)

# Agent entrypoint
ENTRYPOINT ["python3.11"]
CMD [".claude/scripts/ai-agent-worker.py"]

# Metadata
LABEL org.opencontainers.image.title="Sentra AI Agent"
LABEL org.opencontainers.image.description="Secure containerized AI agent for automated development tasks"
LABEL org.opencontainers.image.authors="Glen Barnhardt"
LABEL org.opencontainers.image.version="1.0.0-phase1"
LABEL security.phase="Phase 1: Docker Containerization"
