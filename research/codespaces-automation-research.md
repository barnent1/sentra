# GitHub Codespaces & Cloud Development Environments for CI/CD Automation

**Research Date:** 2025-11-12
**Purpose:** Explore GitHub Codespaces and similar cloud development environments for AI-assisted CI/CD automation patterns

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [GitHub Codespaces Basics](#github-codespaces-basics)
3. [Automation Patterns](#automation-patterns)
4. [Integration with AI Tools](#integration-with-ai-tools)
5. [Alternatives](#alternatives)
6. [Implementation Guide](#implementation-guide)
7. [Cost Analysis](#cost-analysis)
8. [Best Practices](#best-practices)
9. [Recommendations](#recommendations)

---

## Executive Summary

### Key Findings

**GitHub Codespaces** is a cloud-based development environment that can be programmatically controlled via REST API and GitHub CLI. While Codespaces excels at providing consistent development environments, **it is NOT designed as a direct replacement for GitHub Actions** for CI/CD automation.

**Best Use Case for Our Needs:** Combine **IssueOps** (GitHub Issues + GitHub Actions) with **Claude Code GitHub Actions** for AI-assisted automation. This provides:
- Issue/PR-triggered workflows
- AI-powered code generation and fixes
- Lower cost than Codespaces for automation
- Better suited for CI/CD patterns

**Codespaces Role:** Use Codespaces for development environments and testing, but leverage GitHub Actions for automation workflows.

---

## 1. GitHub Codespaces Basics

### What are Codespaces?

GitHub Codespaces is a **cloud-hosted development environment** that runs in an isolated Docker container on a virtual machine. Key characteristics:

- **On-demand cloud IDE** accessible via browser or VS Code
- **Fully configured environments** using dev containers (devcontainer.json)
- **Automatic environment setup** with dependencies, tools, and extensions
- **Instant environment provisioning** (especially with prebuilds)

### Core Components

1. **Dev Container Configuration** (`.devcontainer/devcontainer.json`)
   - Defines the Docker environment
   - Specifies tools, extensions, and runtime
   - Includes lifecycle hooks (postCreateCommand, postStartCommand)

2. **Base Images**
   - Default Linux image with Python, Node, PHP, Java, Go, C++, Ruby, .NET
   - Custom Dockerfile support
   - Predefined configurations for common stacks

3. **Virtual Machine Specs**
   - 2-core to 32-core options
   - 4 GB to 64 GB RAM
   - Configurable storage

### Lifecycle

```
Create → Start → Active → Stop (after inactivity) → Delete (after retention period)
         ↑                    ↓
         └────── Restart ──────┘
```

**Default Settings:**
- Auto-stop: 30 minutes of inactivity (configurable up to 4 hours)
- Auto-delete: 30 days after stopping (configurable, 0 = immediate deletion)
- Storage persists while stopped (incurs costs)

### Can They Be Triggered by Issues/PRs?

**Direct triggering: NO** - Codespaces cannot be automatically created by issue/PR events.

**Workaround patterns:**
1. **Manual trigger:** Users click "Open in Codespace" on a PR
2. **API-based creation:** GitHub Actions can call the Codespaces API to create/manage Codespaces
3. **Pre-configured links:** Issue templates can include links to create Codespaces

---

## 2. Automation Patterns

### A. IssueOps Pattern (RECOMMENDED for our use case)

**What is IssueOps?**
IssueOps uses GitHub Issues, Actions, and PRs as an interface for automating workflows. Issue comments, labels, and state changes trigger CI/CD pipelines.

**How it works:**
```yaml
# .github/workflows/issue-automation.yml
name: IssueOps Automation
on:
  issues:
    types: [labeled, opened]
  issue_comment:
    types: [created]

jobs:
  process:
    if: contains(github.event.issue.labels.*.name, 'automation') ||
        contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Process request
        run: |
          # Your automation logic here
```

**Benefits:**
- Transparent audit trail in issue timeline
- Event-driven automation
- No external tools needed
- Immutable records for approvals

**State Machine Pattern:**
- States: opened → submitted → approved/denied → closed
- Events: comments, labels, reactions
- Guards: permission checks, validation
- Actions: automated tasks during transitions

### B. Codespaces REST API Pattern

**Creating a Codespace Programmatically:**

```bash
# Using REST API
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/codespaces \
  -d '{
    "ref": "main",
    "machine": "standardLinux32gb",
    "devcontainer_path": ".devcontainer/devcontainer.json",
    "idle_timeout_minutes": 30,
    "retention_period_minutes": 60
  }'

# Using GitHub CLI
gh codespace create \
  --repo OWNER/REPO \
  --branch main \
  --machine standardLinux32gb
```

**Starting/Stopping:**
```bash
# Start
gh codespace start --codespace CODESPACE_NAME

# Stop
gh codespace stop --codespace CODESPACE_NAME

# Delete
gh codespace delete --codespace CODESPACE_NAME

# Delete all older than N days
gh codespace delete --repo OWNER/REPO --days 7
```

**Response includes:**
- `id`: Codespace identifier
- `name`: Unique name
- `state`: AVAILABLE, STARTING, STARTED, etc.
- `web_url`: Browser access URL
- `start_url`: API endpoint to start

### C. GitHub Actions + Codespaces API Pattern

**Hybrid approach:** Use Actions to orchestrate Codespaces

```yaml
name: Automated Development Task
on:
  issues:
    types: [labeled]

jobs:
  create-and-run:
    if: contains(github.event.issue.labels.*.name, 'codespace-task')
    runs-on: ubuntu-latest
    steps:
      - name: Create Codespace
        id: create
        run: |
          RESULT=$(gh api \
            --method POST \
            -H "Accept: application/vnd.github+json" \
            /repos/${{ github.repository }}/codespaces \
            -f ref='main' \
            -f machine='basicLinux32gb' \
            -f retention_period_minutes=60)
          echo "codespace_name=$(echo $RESULT | jq -r '.name')" >> $GITHUB_OUTPUT
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Wait for Codespace
        run: sleep 60  # Wait for startup

      - name: Execute commands in Codespace
        run: |
          # Commands would be executed via gh codespace ssh
          gh codespace ssh --codespace ${{ steps.create.outputs.codespace_name }} \
            -- "your-command-here"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Cleanup
        if: always()
        run: |
          gh codespace delete --codespace ${{ steps.create.outputs.codespace_name }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Limitations of this approach:**
- Expensive (compute + storage costs)
- Slower than standard Actions runners
- Complex setup and management
- Not designed for ephemeral CI/CD tasks

### D. Prebuilds for Faster Startup

**What are prebuilds?**
Prebuilds create "ready-to-go" Codespace templates with source code, extensions, dependencies, and configurations pre-installed.

**Configuration:**
```yaml
# .github/workflows/codespace-prebuild.yml
name: Codespace Prebuild
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  prebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: github/codespaces-prebuild@v1
        with:
          devcontainer_path: .devcontainer/devcontainer.json
```

**Benefits:**
- Near-instant Codespace creation
- Consistent environments across team
- Automatic updates on configuration changes

**Triggers:**
- Every push (keeps prebuilds current)
- On configuration change (saves Actions minutes)
- Scheduled (for dependencies updates)

### E. Dev Container Automation Hooks

**Lifecycle hooks in devcontainer.json:**

```json
{
  "name": "AI Automation Environment",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",

  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/python:1": {}
  },

  "postCreateCommand": "npm install && pip install -r requirements.txt",
  "postStartCommand": "npm run dev",
  "postAttachCommand": "echo 'Ready to code!'",

  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "ms-python.python"
      ]
    }
  },

  "remoteEnv": {
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}"
  }
}
```

**Hook types:**
- `onCreateCommand`: First-time container creation
- `updateContentCommand`: After source code update
- `postCreateCommand`: After container creation (one-time setup)
- `postStartCommand`: Every time container starts
- `postAttachCommand`: When tool attaches to container

---

## 3. Integration with AI Tools

### A. Claude Code + GitHub Actions (RECOMMENDED)

**What is it?**
Native GitHub Actions integration that allows Claude to respond to issues, PRs, and comments directly.

**Setup:**

1. **Add API key to repository secrets:**
   - Navigate to Settings → Secrets and variables → Actions
   - Add `ANTHROPIC_API_KEY`

2. **Install GitHub App (optional):**
   - Run `/install-github-app` in Claude Code CLI
   - OR manually install from GitHub Marketplace

3. **Add workflow file:**

```yaml
# .github/workflows/claude-automation.yml
name: Claude Code Automation

on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]

jobs:
  claude:
    runs-on: ubuntu-latest

    # Only run when @claude is mentioned or specific label
    if: |
      contains(github.event.comment.body, '@claude') ||
      contains(github.event.issue.labels.*.name, 'ai-assist')

    steps:
      - uses: actions/checkout@v3

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are helping with: ${{ github.event.issue.title || github.event.pull_request.title }}

            Description: ${{ github.event.issue.body || github.event.pull_request.body }}

            Analyze the request and create a pull request with the necessary changes.
          claude_args: "--max-turns 5 --model claude-sonnet-4-5"
```

**Trigger patterns:**

**Issue comment trigger:**
```yaml
on:
  issue_comment:
    types: [created]

# User types: "@claude fix the TypeError in api.js"
# Claude responds and creates PR with fix
```

**Label-based trigger:**
```yaml
on:
  issues:
    types: [labeled]

jobs:
  claude-fix:
    if: contains(github.event.issue.labels.*.name, 'bug-fix-ai')
    # Claude auto-generates fix PR
```

**PR review trigger:**
```yaml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: "Review this PR for security issues and best practices"
```

**Use cases:**
- Automated bug fixes from issue descriptions
- Code review and security analysis
- Feature implementation from specifications
- Documentation generation
- Test creation

### B. Claude Code in Codespaces

**Can Claude Code run in Codespaces? YES**

**Setup approach:**

1. **Create devcontainer.json:**
```json
{
  "name": "Claude Code Environment",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",

  "postCreateCommand": "npm install -g @anthropic-ai/claude-code",

  "remoteEnv": {
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}"
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "anthropics.claude-code"
      ]
    }
  }
}
```

2. **Add API key as Codespace secret:**
   - User settings → Codespaces → Secrets
   - Add `ANTHROPIC_API_KEY`

3. **Use Claude Code interactively:**
   - Claude Code runs in the Codespace terminal
   - Full access to codebase
   - Can commit and push changes

**Authentication methods:**

**For Codespaces (interactive):**
- Environment variable: `ANTHROPIC_API_KEY`
- Automatic authentication if variable present

**For GitHub Actions (automated):**
- Repository secret: `ANTHROPIC_API_KEY`
- OR GitHub OIDC + AWS Bedrock/Vertex AI

**Security best practices:**
- NEVER hardcode API keys
- Use GitHub Secrets for Actions
- Use Codespace user secrets for personal Codespaces
- Consider GitHub App for organization-wide deployments

### C. Real-World AI Integration Examples

**Example 1: Automated issue triage**
```yaml
name: AI Triage
on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Analyze this issue and:
            1. Add appropriate labels (bug/feature/question)
            2. Determine severity (low/medium/high)
            3. Suggest which team should handle it
            4. Add a comment with your analysis
          claude_args: "--max-turns 2"
```

**Example 2: Automated PR from issue**
```yaml
name: AI Feature Implementation
on:
  issues:
    types: [labeled]

jobs:
  implement:
    if: contains(github.event.issue.labels.*.name, 'implement-ai')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Implement the feature described in issue #${{ github.event.issue.number }}:

            ${{ github.event.issue.body }}

            Create a complete implementation with:
            - Necessary code changes
            - Tests
            - Documentation updates

            Create a PR when done.
          claude_args: "--max-turns 10"
```

**Example 3: Repository-specific guidelines**

Create `CLAUDE.md` in repo root:
```markdown
# Claude Code Guidelines for This Project

## Coding Standards
- Use TypeScript for all new files
- Follow ESLint configuration
- Write tests using Jest
- Use conventional commits

## Architecture
- API routes in `/app/api`
- Components in `/components`
- Use server components by default

## Testing Requirements
- Unit tests for all business logic
- Integration tests for API routes
- Minimum 80% coverage

## Documentation
- Update README.md for new features
- JSDoc comments for public APIs
```

Claude automatically follows these guidelines when creating PRs.

---

## 4. Alternatives

### Comparison Table

| Solution | Pros | Cons | Best For | Cost |
|----------|------|------|----------|------|
| **GitHub Codespaces** | Native GitHub integration, prebuilds, consistent environments | Expensive for automation, not designed for CI/CD | Development environments, testing | $0.18-$2.88/hr compute + $0.07/GB/mo storage |
| **GitHub Actions** | Purpose-built for CI/CD, fast, economical, mature ecosystem | Limited to 6-hour runs, no persistent state | CI/CD automation, workflows | 2000 free minutes/mo, then $0.008/min |
| **Gitpod** | Multi-platform (GitHub/GitLab/Bitbucket), better prebuilds, self-hosting | Less GitHub integration, smaller ecosystem | Multi-platform teams, open source | 50 free hours/mo |
| **DevPod** | Open source, infrastructure-agnostic, devcontainer.json standard | Self-managed, less polished | Cost-conscious teams, flexibility | Infrastructure costs only |
| **Coder** | Enterprise-grade, self-hosted, full control | Complex setup, requires infrastructure | Enterprise, compliance requirements | Infrastructure costs only |
| **Self-hosted Actions runners** | Full control, custom hardware, no usage limits | Maintenance overhead, security responsibility | High-volume builds, special hardware | Infrastructure costs only |

### A. Gitpod

**Key differences from Codespaces:**
- **Better prebuild system:** Continuous prebuilds on every commit
- **Multi-platform:** Works with GitHub, GitLab, Bitbucket
- **Configuration:** Uses `.gitpod.yml` instead of `devcontainer.json`
- **Workspace snapshots:** Save and share exact environment states

**Configuration example:**
```yaml
# .gitpod.yml
image:
  file: .gitpod.Dockerfile

tasks:
  - name: Setup
    init: npm install
    command: npm run dev

ports:
  - port: 3000
    onOpen: open-preview

vscode:
  extensions:
    - dbaeumer.vscode-eslint
```

**Automation patterns:**
- Similar to Codespaces
- API for programmatic control
- Webhooks for custom triggers

**Pricing:**
- 50 free hours/month (vs Codespaces 30 hours)
- More flexible pricing for heavy users

### B. DevPod

**Open-source alternative:**
- Uses devcontainer.json standard
- Works with any infrastructure
- No vendor lock-in
- Self-hosted or cloud

**Benefits:**
- Full control over costs
- Compatible with Codespaces configurations
- Flexible deployment options

**Drawbacks:**
- Less integrated with GitHub
- Requires more setup
- Community support vs. enterprise support

### C. Self-Hosted GitHub Actions Runners

**For CI/CD automation, this is often BETTER than Codespaces:**

**Benefits:**
- Purpose-built for automation
- Ephemeral runners for security
- Auto-scaling with Actions Runner Controller
- Full control over hardware
- No per-minute charges

**Setup patterns:**

**Docker-based ephemeral runners:**
```yaml
# docker-compose.yml
services:
  runner:
    image: myoung34/github-runner:latest
    environment:
      RUNNER_NAME: docker-runner
      RUNNER_WORKDIR: /tmp/runner/work
      REPO_URL: https://github.com/owner/repo
      ACCESS_TOKEN: ${GITHUB_PAT}
      EPHEMERAL: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

**Kubernetes with Actions Runner Controller:**
```yaml
apiVersion: actions.summerwind.dev/v1alpha1
kind: RunnerDeployment
metadata:
  name: claude-automation-runner
spec:
  replicas: 1
  template:
    spec:
      repository: owner/repo
      ephemeral: true
      env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: claude-secrets
              key: api-key
```

**When to use:**
- High-volume automation
- Special hardware requirements (GPUs, etc.)
- Compliance/security requirements
- Cost optimization for heavy users

**Interesting pattern: Runners IN Codespaces:**
You can run self-hosted Actions runners inside Codespaces for development/testing of Actions workflows!

---

## 5. Implementation Guide

### Recommended Architecture for Our Use Case

**Goal:** AI-assisted automation triggered by issues/PRs

**Best approach:** IssueOps + Claude Code GitHub Actions

```
Issue/PR Event → GitHub Actions → Claude Code → PR Creation → Review → Merge
                      ↓
                Label/comment
                 triggers
```

### Step-by-Step Implementation

#### Phase 1: Basic Setup (1-2 hours)

**1. Add Anthropic API key:**
```bash
# In GitHub repository settings
Settings → Secrets and variables → Actions → New repository secret
Name: ANTHROPIC_API_KEY
Value: sk-ant-api03-... (from console.anthropic.com)
```

**2. Create workflow file:**
```bash
mkdir -p .github/workflows
```

```yaml
# .github/workflows/ai-automation.yml
name: AI Automation

on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]

jobs:
  process-request:
    runs-on: ubuntu-latest

    # Trigger conditions
    if: |
      (github.event_name == 'issues' &&
       contains(github.event.issue.labels.*.name, 'ai-assist')) ||
      (github.event_name == 'issue_comment' &&
       contains(github.event.comment.body, '@claude'))

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for better context

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

          prompt: |
            You are an AI assistant helping with this repository.

            Event: ${{ github.event_name }}
            Issue/PR: ${{ github.event.issue.title || github.event.pull_request.title }}

            Description:
            ${{ github.event.issue.body || github.event.comment.body }}

            Task:
            - Analyze the request
            - Make necessary code changes
            - Create a PR with your changes
            - Include tests and documentation

          claude_args: |
            --max-turns 10
            --model claude-sonnet-4-5
```

**3. Create issue templates:**
```yaml
# .github/ISSUE_TEMPLATE/ai-feature.yml
name: AI-Assisted Feature Request
description: Request a feature to be implemented by AI
title: "[AI Feature] "
labels: ["ai-assist", "feature"]
body:
  - type: markdown
    attributes:
      value: |
        This issue will be processed by our AI automation system.

  - type: textarea
    id: description
    attributes:
      label: Feature Description
      description: Describe the feature you want implemented
      placeholder: |
        I want a new API endpoint that...

        It should:
        - Accept POST requests
        - Validate input
        - Return JSON response
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance Criteria
      description: How will we know it's done correctly?
      placeholder: |
        - API responds with 200 on valid input
        - Returns 400 on invalid input
        - Tests pass
```

**4. Test the workflow:**
```bash
# Create test issue
gh issue create \
  --title "[AI Feature] Add health check endpoint" \
  --body "Create a /health endpoint that returns status 200 and {\"status\":\"ok\"}" \
  --label "ai-assist"

# Or comment on existing issue
gh issue comment 123 --body "@claude implement this feature"
```

#### Phase 2: Advanced Configuration (2-4 hours)

**1. Add repository guidelines:**
```markdown
# CLAUDE.md
# AI Automation Guidelines

## Project Structure
- Source code: `/src`
- Tests: `/tests`
- Documentation: `/docs`

## Coding Standards
- Language: TypeScript
- Style: Follow .eslintrc.js
- Commit format: Conventional Commits

## Testing Requirements
- Unit tests required for all new functions
- Integration tests for API endpoints
- Run `npm test` before committing

## Documentation
- Update README.md for new features
- JSDoc comments for public APIs
- Include examples

## PR Requirements
- Descriptive title and body
- Reference issue number
- Tests passing
- No linting errors
```

**2. Add state machine workflow:**
```yaml
# .github/workflows/issueops-state-machine.yml
name: IssueOps State Machine

on:
  issues:
    types: [opened, labeled, unlabeled]
  issue_comment:
    types: [created]

jobs:
  validate:
    if: github.event.action == 'opened'
    runs-on: ubuntu-latest
    steps:
      - name: Validate issue
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;

            // Check if issue has required fields
            if (!issue.body || issue.body.length < 50) {
              await github.rest.issues.createComment({
                ...context.repo,
                issue_number: issue.number,
                body: '❌ Issue body is too short. Please provide more details.'
              });
              return;
            }

            // Add 'validated' label
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: issue.number,
              labels: ['validated']
            });

  submit:
    if: |
      github.event_name == 'issue_comment' &&
      contains(github.event.comment.body, '.submit') &&
      contains(github.event.issue.labels.*.name, 'validated')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: context.issue.number,
              labels: ['submitted']
            });
            await github.rest.issues.removeLabel({
              ...context.repo,
              issue_number: context.issue.number,
              name: 'validated'
            });

  process:
    if: contains(github.event.issue.labels.*.name, 'submitted')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Process this approved request: ${{ github.event.issue.body }}
            Create a complete implementation with tests and docs.
```

**3. Add scheduled automation:**
```yaml
# .github/workflows/scheduled-tasks.yml
name: Scheduled AI Tasks

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Allow manual triggering

jobs:
  weekly-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate report
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Generate a weekly summary report:

            1. Analyze commit history from last 7 days
            2. Summarize new features and bug fixes
            3. Identify potential technical debt
            4. Suggest improvements

            Create an issue with the report.
          claude_args: "--max-turns 5"
```

#### Phase 3: Cost Optimization (1-2 hours)

**1. Add workflow controls:**
```yaml
env:
  # Limit concurrent workflows
  CONCURRENCY_LIMIT: 3

concurrency:
  group: ai-automation-${{ github.ref }}
  cancel-in-progress: true

jobs:
  claude:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Prevent runaway costs

    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          claude_args: |
            --max-turns 5
            --model claude-sonnet-4-5
```

**2. Add usage monitoring:**
```yaml
# .github/workflows/cost-monitor.yml
name: Cost Monitor

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Check Actions usage
        uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.actions.getWorkflowUsage({
              ...context.repo,
              workflow_id: 'ai-automation.yml'
            });

            console.log('Minutes used:', data.billable.UBUNTU.total_ms / 60000);

            // Create issue if over threshold
            if (data.billable.UBUNTU.total_ms / 60000 > 1000) {
              await github.rest.issues.create({
                ...context.repo,
                title: '⚠️ High Actions usage detected',
                body: `Actions usage this month: ${data.billable.UBUNTU.total_ms / 60000} minutes`
              });
            }
```

### Testing Strategy

**1. Local testing with Claude Code CLI:**
```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Test prompts locally
claude "Create a health check endpoint"

# Test with repository context
cd /path/to/repo
claude "Add tests for the new API endpoint"
```

**2. Test workflows without API calls:**
```yaml
# Use dry-run or test mode
- name: Test (dry run)
  if: github.event.issue.labels.*.name contains 'test'
  run: |
    echo "Would call Claude with prompt:"
    echo "${{ steps.build-prompt.outputs.prompt }}"
```

**3. Gradual rollout:**
```yaml
# Start with single label
if: contains(github.event.issue.labels.*.name, 'ai-assist-beta')

# Expand to more triggers
if: |
  contains(github.event.issue.labels.*.name, 'ai-assist') ||
  contains(github.event.issue.labels.*.name, 'ai-assist-beta')
```

---

## 6. Cost Analysis

### GitHub Codespaces Pricing

**Compute costs (per hour, actively running):**
| Machine Type | Cores | RAM | Storage | Cost/Hour | Use Case |
|--------------|-------|-----|---------|-----------|----------|
| 2-core | 2 | 8 GB | 32 GB | $0.18 | Light development |
| 4-core | 4 | 16 GB | 32 GB | $0.36 | Standard development |
| 8-core | 8 | 32 GB | 64 GB | $0.72 | Heavy workloads |
| 16-core | 16 | 64 GB | 128 GB | $1.44 | ML/data processing |
| 32-core | 32 | 128 GB | 256 GB | $2.88 | Large builds |

**Storage costs:**
- $0.07 per GB per month (while Codespace exists, even when stopped)

**Example monthly costs:**

**Scenario 1: Single developer**
- 4-core machine
- 40 hours/week active (160 hours/month)
- 50 GB storage
- Cost: (160 × $0.36) + (50 × $0.07) = $57.60 + $3.50 = $61.10/month

**Scenario 2: Team of 5 developers**
- 4-core machines
- 40 hours/week each (800 hours/month total)
- 250 GB total storage
- Cost: (800 × $0.36) + (250 × $0.07) = $288 + $17.50 = $305.50/month

**Scenario 3: Automation use (NOT RECOMMENDED)**
- 2-core machine
- 10 automation runs/day, 30 min each = 5 hours/day = 150 hours/month
- 10 GB storage
- Cost: (150 × $0.18) + (10 × $0.07) = $27 + $0.70 = $27.70/month
- **Note:** GitHub Actions would cost $1.20/month for same workload!

### GitHub Actions Pricing

**Included minutes (free tier):**
- Free plan: 2,000 minutes/month
- Team plan: 3,000 minutes/month
- Enterprise: 50,000 minutes/month

**Overage pricing:**
- Linux runners: $0.008 per minute ($0.48/hour)
- Windows runners: $0.016 per minute
- macOS runners: $0.08 per minute

**Example automation costs:**

**Scenario 1: AI automation (IssueOps + Claude)**
- 50 automation runs/month
- 10 minutes per run = 500 minutes/month
- Cost: $0 (within free tier)

**Scenario 2: Heavy automation**
- 200 automation runs/month
- 15 minutes per run = 3,000 minutes/month
- Overage: 1,000 minutes (after free tier)
- Cost: 1,000 × $0.008 = $8/month

**Scenario 3: CI/CD + AI automation**
- 500 total workflow runs/month
- Average 8 minutes = 4,000 minutes/month
- Overage: 2,000 minutes
- Cost: 2,000 × $0.008 = $16/month

### Anthropic API Costs

**Claude Sonnet 4.5 pricing:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Typical automation scenarios:**

**Small task (bug fix):**
- Input: ~10K tokens (codebase context + prompt)
- Output: ~2K tokens (code changes)
- Cost: (10K × $3/1M) + (2K × $15/1M) = $0.03 + $0.03 = $0.06

**Medium task (feature implementation):**
- Input: ~50K tokens
- Output: ~10K tokens
- Cost: (50K × $3/1M) + (10K × $15/1M) = $0.15 + $0.15 = $0.30

**Large task (complex feature):**
- Input: ~100K tokens
- Output: ~20K tokens
- Cost: (100K × $3/1M) + (20K × $15/1M) = $0.30 + $0.30 = $0.60

**Monthly automation estimates:**

**Light usage (10 tasks/month):**
- API costs: ~$3-6/month
- GitHub Actions: $0 (free tier)
- **Total: $3-6/month**

**Moderate usage (50 tasks/month):**
- API costs: ~$15-30/month
- GitHub Actions: $0-5/month
- **Total: $15-35/month**

**Heavy usage (200 tasks/month):**
- API costs: ~$60-120/month
- GitHub Actions: ~$15/month
- **Total: $75-135/month**

### Cost Comparison: Codespaces vs Actions for Automation

**For 50 automation tasks/month, 30 minutes each:**

| Approach | Compute | Storage | API | Total |
|----------|---------|---------|-----|-------|
| **Codespaces** | $27 | $0.70 | $30 | **$57.70** |
| **GitHub Actions** | $0 | N/A | $30 | **$30** |
| **Savings** | -$27 | -$0.70 | $0 | **-$27.70 (48%)** |

**For 200 automation tasks/month, 15 minutes each:**

| Approach | Compute | Storage | API | Total |
|----------|---------|---------|-----|-------|
| **Codespaces** | $90 | $0.70 | $120 | **$210.70** |
| **GitHub Actions** | $16 | N/A | $120 | **$136** |
| **Savings** | -$74 | -$0.70 | $0 | **-$74.70 (35%)** |

**Verdict:** GitHub Actions is significantly cheaper for automation workloads.

### Cost Optimization Strategies

**1. Right-size machine types:**
```yaml
# Use smallest machine that works
if: needs.determine-size.outputs.complexity == 'low'
uses: anthropics/claude-code-action@v1
with:
  claude_args: "--max-turns 3"  # Limit API calls

if: needs.determine-size.outputs.complexity == 'high'
uses: anthropics/claude-code-action@v1
with:
  claude_args: "--max-turns 10"
```

**2. Set spending limits:**
```yaml
# In organization settings
Settings → Billing → Spending limits → Set monthly limit
```

**3. Auto-delete Codespaces:**
```yaml
# For any Codespaces you do create
retention_period_minutes: 60  # Delete after 1 hour
idle_timeout_minutes: 30      # Stop after 30 min
```

**4. Use concurrency limits:**
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel old runs
```

**5. Cache dependencies:**
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**6. Monitor usage:**
```bash
# Check Actions usage
gh api /repos/OWNER/REPO/actions/workflows/WORKFLOW_ID/timing

# Set up alerts
# Use GitHub Actions usage API to create weekly reports
```

---

## 7. Best Practices

### Security

**1. API Key Management:**

**DO:**
- Store in GitHub Secrets
- Use organization-level secrets for multiple repos
- Rotate keys periodically
- Use GitHub OIDC for cloud providers (Bedrock/Vertex)

**DON'T:**
- Hardcode in workflow files
- Commit to repository
- Share keys across environments
- Log keys in workflow output

**2. Workflow Permissions:**
```yaml
permissions:
  contents: write       # For creating PRs
  issues: write        # For commenting on issues
  pull-requests: write # For PR operations
  # Minimal permissions principle
```

**3. Input Validation:**
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate input
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;

            // Check issue body isn't malicious
            if (issue.body.includes('rm -rf') || issue.body.includes('eval(')) {
              throw new Error('Potentially malicious content detected');
            }
```

**4. Rate Limiting:**
```yaml
# Limit concurrent AI operations
concurrency:
  group: ai-automation
  cancel-in-progress: false  # Queue requests

# Add delays between operations
- name: Rate limit
  run: sleep 5
```

**5. Code Review Requirements:**
```yaml
# Require human review for AI PRs
on:
  pull_request:
    types: [opened]

jobs:
  tag-ai-pr:
    if: contains(github.event.pull_request.user.login, 'github-actions')
    steps:
      - name: Require review
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: context.issue.number,
              labels: ['ai-generated', 'needs-review']
            });
```

### Performance

**1. Optimize workflow triggers:**
```yaml
# Be specific about what triggers workflows
on:
  issues:
    types: [labeled]  # Not [opened, edited, labeled, ...]

jobs:
  process:
    # Add conditions to reduce unnecessary runs
    if: |
      contains(github.event.issue.labels.*.name, 'ai-assist') &&
      !contains(github.event.issue.labels.*.name, 'wontfix')
```

**2. Use workflow caching:**
```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.cache
      node_modules
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}
```

**3. Parallel execution:**
```yaml
jobs:
  analyze:
    strategy:
      matrix:
        component: [api, frontend, database]
    runs-on: ubuntu-latest
    steps:
      - name: Analyze ${{ matrix.component }}
        # Each runs in parallel
```

**4. Minimize token usage:**
```yaml
- name: Build efficient prompt
  run: |
    # Only include relevant files
    RELEVANT_FILES=$(git diff --name-only HEAD~1 HEAD)
    echo "files=$RELEVANT_FILES" >> $GITHUB_OUTPUT

- uses: anthropics/claude-code-action@v1
  with:
    prompt: |
      Focus only on these files: ${{ steps.prep.outputs.files }}
```

### Reliability

**1. Retry logic:**
```yaml
- uses: anthropics/claude-code-action@v1
  id: claude
  continue-on-error: true

- name: Retry on failure
  if: steps.claude.outcome == 'failure'
  uses: anthropics/claude-code-action@v1
  with:
    # Same parameters
```

**2. Fallback workflows:**
```yaml
jobs:
  ai-process:
    runs-on: ubuntu-latest
    continue-on-error: true

  human-fallback:
    needs: ai-process
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Notify team
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "AI processing failed. @team please review manually."
```

**3. Health checks:**
```yaml
- name: Verify setup
  run: |
    if [ -z "${{ secrets.ANTHROPIC_API_KEY }}" ]; then
      echo "ERROR: ANTHROPIC_API_KEY not set"
      exit 1
    fi
```

**4. Logging and monitoring:**
```yaml
- name: Log execution
  run: |
    echo "Issue: #${{ github.event.issue.number }}"
    echo "Label: ${{ github.event.label.name }}"
    echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

- name: Report metrics
  if: always()
  run: |
    echo "Duration: ${{ steps.claude.duration }}"
    echo "Status: ${{ steps.claude.outcome }}"
```

### Maintainability

**1. Reusable workflows:**
```yaml
# .github/workflows/reusable-ai.yml
name: Reusable AI Workflow

on:
  workflow_call:
    inputs:
      prompt:
        required: true
        type: string
      max-turns:
        required: false
        type: number
        default: 5
    secrets:
      anthropic-api-key:
        required: true

jobs:
  run-claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.anthropic-api-key }}
          prompt: ${{ inputs.prompt }}
          claude_args: "--max-turns ${{ inputs.max-turns }}"
```

```yaml
# .github/workflows/use-reusable.yml
name: Use Reusable Workflow

on:
  issues:
    types: [labeled]

jobs:
  call-reusable:
    uses: ./.github/workflows/reusable-ai.yml
    with:
      prompt: "Process issue #${{ github.event.issue.number }}"
      max-turns: 10
    secrets:
      anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**2. Composite actions:**
```yaml
# .github/actions/ai-process/action.yml
name: AI Process Action
description: Reusable AI processing

inputs:
  task:
    description: Task type (fix/feature/review)
    required: true
  issue-number:
    description: Issue number
    required: true

runs:
  using: composite
  steps:
    - name: Build prompt
      shell: bash
      run: |
        case "${{ inputs.task }}" in
          fix)
            PROMPT="Fix the bug described in issue #${{ inputs.issue-number }}"
            ;;
          feature)
            PROMPT="Implement the feature from issue #${{ inputs.issue-number }}"
            ;;
          review)
            PROMPT="Review the code in PR #${{ inputs.issue-number }}"
            ;;
        esac
        echo "prompt=$PROMPT" >> $GITHUB_OUTPUT
      id: prompt

    - uses: anthropics/claude-code-action@v1
      with:
        anthropic_api_key: ${{ env.ANTHROPIC_API_KEY }}
        prompt: ${{ steps.prompt.outputs.prompt }}
```

**3. Documentation:**
```markdown
# .github/workflows/README.md
# AI Automation Workflows

## Workflows

### ai-automation.yml
Responds to @claude mentions and `ai-assist` labels.

**Triggers:**
- Issue opened with `ai-assist` label
- Comment containing @claude

**Example:**
\`\`\`
@claude implement the login endpoint described above
\`\`\`

### issueops-state-machine.yml
Manages multi-step approval processes.

**States:**
- opened → validated → submitted → approved → processed

**Commands:**
- `.submit` - Submit for approval
- `.approve` - Approve request (admins only)
- `.deny` - Deny request

## Configuration

See CLAUDE.md for AI behavior guidelines.
```

**4. Testing:**
```yaml
# .github/workflows/test-ai-workflows.yml
name: Test AI Workflows

on:
  pull_request:
    paths:
      - '.github/workflows/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate workflow syntax
        run: |
          for workflow in .github/workflows/*.yml; do
            echo "Validating $workflow"
            yamllint "$workflow"
          done

      - name: Test with dry run
        run: |
          # Create test issue
          gh issue create \
            --title "Test AI automation" \
            --body "This is a test" \
            --label "ai-assist-test"

          # Verify workflow starts
          sleep 10
          RUNS=$(gh run list --workflow ai-automation.yml --limit 1 --json status)
          echo "$RUNS" | jq -e '.[0].status == "queued"'
```

---

## 8. Recommendations

### For Your Use Case: AI-Assisted CI/CD Automation

**Primary Recommendation: IssueOps + Claude Code GitHub Actions**

**Why this approach:**
1. **Cost-effective:** ~$30-50/month vs $200+ for Codespaces
2. **Purpose-built:** Actions designed for automation, Codespaces for development
3. **Faster:** Actions start in seconds, Codespaces take 30-120 seconds
4. **Simpler:** No Codespace lifecycle management
5. **Proven pattern:** IssueOps is a established methodology

**Architecture:**
```
GitHub Issue/PR
    ↓
Label/Comment Trigger (@claude or ai-assist label)
    ↓
GitHub Actions Workflow
    ↓
Claude Code Action (API call)
    ↓
Code Analysis & Generation
    ↓
Create PR with Changes
    ↓
Human Review & Approval
    ↓
Merge
```

**When to use Codespaces:**
- Interactive development by team members
- Testing complex changes before automation
- Debugging automation issues
- Providing consistent dev environments

**When NOT to use Codespaces:**
- CI/CD automation tasks
- Scheduled jobs
- Event-driven automation
- High-frequency operations

### Implementation Priority

**Phase 1: Foundation (Week 1)**
- [ ] Set up ANTHROPIC_API_KEY in repository secrets
- [ ] Create basic ai-automation.yml workflow
- [ ] Add issue templates for AI-assisted tasks
- [ ] Test with simple tasks (bug fixes)

**Phase 2: Enhancement (Week 2)**
- [ ] Add CLAUDE.md with project guidelines
- [ ] Implement state machine workflow
- [ ] Add cost monitoring
- [ ] Create reusable workflows

**Phase 3: Optimization (Week 3-4)**
- [ ] Refine prompts based on results
- [ ] Add parallel processing for complex tasks
- [ ] Implement retry logic and fallbacks
- [ ] Document patterns and best practices

**Phase 4: Scale (Month 2+)**
- [ ] Expand to more repositories
- [ ] Create organization-level workflows
- [ ] Develop custom actions
- [ ] Build metrics dashboard

### Success Metrics

**Track these KPIs:**
- **Automation rate:** % of issues handled by AI vs manual
- **Success rate:** % of AI PRs merged without major changes
- **Time savings:** Average time from issue to PR
- **Cost per task:** Monthly costs / tasks completed
- **Developer satisfaction:** Survey team regularly

**Target benchmarks:**
- 70%+ automation rate for routine tasks
- 80%+ success rate for AI PRs
- 50%+ reduction in time to PR
- <$1 per task average cost
- 4/5+ satisfaction rating

### Migration Path from Codespaces (if currently using)

**If you're already using Codespaces for automation:**

1. **Audit current usage**
   - Identify automation tasks vs development use
   - Calculate costs of each

2. **Move automation to Actions**
   - One workflow at a time
   - Start with simplest tasks
   - Run parallel for validation period

3. **Keep Codespaces for development**
   - Configure prebuilds for fast startup
   - Set aggressive auto-delete policies
   - Educate team on cost optimization

4. **Measure results**
   - Compare costs before/after
   - Track automation success rates
   - Gather team feedback

### Future Considerations

**Emerging patterns to watch:**

1. **GitHub Models (2025)**
   - Native AI inference in Actions
   - May reduce API costs
   - Currently in preview

2. **GitHub Copilot Workspace**
   - Issue-to-PR automation
   - May complement or replace custom workflows

3. **Actions Runner Controller improvements**
   - Better autoscaling
   - Cost optimizations
   - Might make self-hosted more attractive

4. **MCP (Model Context Protocol) integration**
   - Richer context for Claude
   - Better code understanding
   - Currently experimental in Claude Code

---

## Appendix A: Complete Example Repository

### Repository Structure
```
my-ai-automated-repo/
├── .github/
│   ├── workflows/
│   │   ├── ai-automation.yml           # Main AI workflow
│   │   ├── issueops-state-machine.yml  # Multi-step approval
│   │   ├── scheduled-tasks.yml         # Periodic AI tasks
│   │   ├── cost-monitor.yml           # Usage tracking
│   │   └── reusable-ai.yml            # Reusable workflow
│   ├── ISSUE_TEMPLATE/
│   │   ├── ai-feature.yml             # Feature request
│   │   ├── ai-bug-fix.yml             # Bug fix request
│   │   └── config.yml                 # Template config
│   ├── actions/
│   │   └── ai-process/
│   │       └── action.yml             # Composite action
│   └── CODEOWNERS                     # Review assignments
├── .devcontainer/
│   └── devcontainer.json              # Optional: for dev
├── CLAUDE.md                          # AI guidelines
├── README.md                          # Project docs
└── docs/
    └── ai-automation.md               # Automation docs
```

### Key Files

**CLAUDE.md:**
```markdown
# AI Automation Guidelines

## Project Overview
This is a TypeScript Node.js API server with PostgreSQL database.

## Architecture
- API routes: `/src/routes`
- Business logic: `/src/services`
- Database models: `/src/models`
- Tests: `/tests`

## Coding Standards
- Language: TypeScript 5.x
- Style: Prettier + ESLint (see .eslintrc.js)
- Commits: Conventional Commits format
- Tests: Jest for unit, Supertest for integration

## AI Automation Rules

### When Creating PRs
- Branch naming: `ai/issue-{number}-{brief-description}`
- PR title: Same as issue title
- PR body: Reference issue, explain changes, list testing done
- Include unit and integration tests
- Update documentation if API changes

### Testing Requirements
- All new functions must have unit tests
- API endpoints need integration tests
- Minimum 80% code coverage
- Run `npm test` before committing

### Code Patterns
- Use async/await, not callbacks
- Error handling: try/catch with proper error types
- Validation: Use Zod schemas
- Database: Use Prisma ORM
- Logging: Use Winston logger

### Security
- Never commit secrets
- Validate all inputs
- Use parameterized queries
- Follow OWASP best practices

### Documentation
- JSDoc comments for public APIs
- Update README.md for new features
- Update OpenAPI spec for API changes
- Include usage examples

## Common Tasks

### Adding an API Endpoint
1. Create route in `/src/routes`
2. Add validation schema
3. Implement service logic
4. Add tests
5. Update OpenAPI spec
6. Update README

### Fixing a Bug
1. Add test that reproduces bug
2. Fix the code
3. Verify test passes
4. Check no regressions
5. Update docs if behavior changes

### Refactoring
1. Ensure tests exist and pass
2. Make changes incrementally
3. Keep tests passing at each step
4. Update docs if interfaces change

## Review Criteria
PRs will be reviewed for:
- Code quality and style
- Test coverage
- Documentation completeness
- Security considerations
- Performance implications
```

**ai-automation.yml (complete):**
```yaml
name: AI Automation

on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]

# Limit concurrent runs
concurrency:
  group: ai-automation-${{ github.ref }}
  cancel-in-progress: false

env:
  MAX_TURNS: 10
  MODEL: claude-sonnet-4-5

jobs:
  # Validate inputs
  validate:
    runs-on: ubuntu-latest
    outputs:
      should-run: ${{ steps.check.outputs.should-run }}
      task-type: ${{ steps.check.outputs.task-type }}
    steps:
      - name: Check trigger conditions
        id: check
        uses: actions/github-script@v7
        with:
          script: |
            const { issue, comment, label, pull_request } = context.payload;

            let shouldRun = false;
            let taskType = '';

            // Check for @claude mention
            if (comment && comment.body.includes('@claude')) {
              shouldRun = true;
              taskType = 'comment-triggered';
            }

            // Check for ai-assist label
            if (label && label.name === 'ai-assist') {
              shouldRun = true;
              taskType = 'label-triggered';
            }

            // Check for PR review request
            if (pull_request && pull_request.labels.some(l => l.name === 'ai-review')) {
              shouldRun = true;
              taskType = 'pr-review';
            }

            // Validation
            if (shouldRun) {
              const body = comment?.body || issue?.body || pull_request?.body || '';

              // Check for malicious content
              const dangerous = ['rm -rf', 'eval(', 'exec(', '__import__'];
              if (dangerous.some(pattern => body.includes(pattern))) {
                throw new Error('Potentially malicious content detected');
              }

              // Check minimum length
              if (body.length < 20) {
                throw new Error('Description too short');
              }
            }

            core.setOutput('should-run', shouldRun);
            core.setOutput('task-type', taskType);

  # Process with Claude
  process:
    needs: validate
    if: needs.validate.outputs.should-run == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for context

      - name: Build context
        id: context
        uses: actions/github-script@v7
        with:
          script: |
            const { issue, comment, pull_request } = context.payload;
            const taskType = '${{ needs.validate.outputs.task-type }}';

            let prompt = '';

            if (taskType === 'comment-triggered') {
              prompt = `
                User comment: ${comment.body}
                Issue context: ${issue.title}
                ${issue.body}
              `;
            } else if (taskType === 'label-triggered') {
              prompt = `
                Task: Implement the request in this issue
                Title: ${issue.title}
                Description: ${issue.body}
              `;
            } else if (taskType === 'pr-review') {
              prompt = `
                Task: Review this pull request
                PR: ${pull_request.title}
                Description: ${pull_request.body}

                Check for:
                - Code quality issues
                - Security vulnerabilities
                - Performance problems
                - Best practice violations
              `;
            }

            core.setOutput('prompt', prompt);

      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-action@v1
        continue-on-error: true
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: ${{ steps.context.outputs.prompt }}
          claude_args: |
            --max-turns ${{ env.MAX_TURNS }}
            --model ${{ env.MODEL }}

      - name: Retry on failure
        if: steps.claude.outcome == 'failure'
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: ${{ steps.context.outputs.prompt }}
          claude_args: |
            --max-turns 5
            --model ${{ env.MODEL }}

      - name: Add labels to PR
        if: steps.claude.outcome == 'success'
        uses: actions/github-script@v7
        with:
          script: |
            // Find the PR created by Claude
            const { data: prs } = await github.rest.pulls.list({
              ...context.repo,
              state: 'open',
              sort: 'created',
              direction: 'desc',
              per_page: 5
            });

            const claudePR = prs.find(pr =>
              pr.user.login === 'github-actions[bot]' &&
              pr.created_at > new Date(Date.now() - 5 * 60 * 1000)  // Last 5 min
            );

            if (claudePR) {
              await github.rest.issues.addLabels({
                ...context.repo,
                issue_number: claudePR.number,
                labels: ['ai-generated', 'needs-review']
              });

              // Comment on original issue
              if (context.payload.issue) {
                await github.rest.issues.createComment({
                  ...context.repo,
                  issue_number: context.payload.issue.number,
                  body: `🤖 I've created PR #${claudePR.number} to address this issue.`
                });
              }
            }

  # Notify on failure
  notify-failure:
    needs: [validate, process]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Comment on issue
        uses: actions/github-script@v7
        with:
          script: |
            if (context.payload.issue) {
              await github.rest.issues.createComment({
                ...context.repo,
                issue_number: context.payload.issue.number,
                body: `
                  ❌ AI automation failed.

                  A human developer will need to review this manually.

                  @team/developers
                `
              });
            }

  # Log metrics
  log-metrics:
    needs: [validate, process]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Record execution
        run: |
          echo "Workflow: ${{ github.workflow }}"
          echo "Run ID: ${{ github.run_id }}"
          echo "Trigger: ${{ needs.validate.outputs.task-type }}"
          echo "Status: ${{ needs.process.result }}"
          echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

---

## Appendix B: Useful Resources

### Official Documentation
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [Dev Containers Specification](https://containers.dev)
- [IssueOps Blog Post](https://github.blog/engineering/issueops-automate-ci-cd-and-more-with-github-issues-and-actions/)

### API References
- [Codespaces REST API](https://docs.github.com/en/rest/codespaces)
- [GitHub Actions API](https://docs.github.com/en/rest/actions)
- [Anthropic API](https://docs.anthropic.com/claude/reference)

### Example Repositories
- [Claude Code Examples](https://github.com/anthropics/claude-code-examples)
- [IssueOps Organization](https://github.com/issue-ops)
- [Dev Containers Examples](https://github.com/devcontainers)
- [Claude in Codespaces](https://github.com/swahlquist/claudecodespace)

### Community Resources
- [GitHub Community Discussions](https://github.com/orgs/community/discussions)
- [Anthropic Discord](https://discord.gg/anthropic)
- [Dev Containers Community](https://devcontainer.community)

### Tools
- [GitHub CLI](https://cli.github.com)
- [Claude Code CLI](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Actions Toolkit](https://github.com/actions/toolkit)

---

## Appendix C: Troubleshooting

### Common Issues

**1. Workflow not triggering**

**Symptoms:** Issue labeled but workflow doesn't run

**Solutions:**
```yaml
# Check workflow file is in correct location
# Must be: .github/workflows/filename.yml

# Verify trigger conditions
on:
  issues:
    types: [labeled]  # Specific event types

# Check branch restrictions
# Workflows run from default branch
git branch --show-current  # Should be main/master

# Verify GitHub Actions enabled
# Settings → Actions → Allow all actions
```

**2. API key not found**

**Symptoms:** Error: "ANTHROPIC_API_KEY not set"

**Solutions:**
```bash
# Verify secret exists
gh secret list

# Check secret name matches exactly
# In workflow: ${{ secrets.ANTHROPIC_API_KEY }}
# In settings: ANTHROPIC_API_KEY (same case)

# Verify secret available to workflow
# Organization secrets need to be shared with repo
# Settings → Secrets and variables → Actions → Organization secrets
```

**3. Codespace creation fails**

**Symptoms:** API returns 500 or timeout

**Solutions:**
```bash
# Check machine type availability
gh api /repos/OWNER/REPO/codespaces/machines

# Verify devcontainer.json syntax
# Use VS Code extension: ms-vscode-remote.remote-containers

# Try smaller machine type
machine: "basicLinux32gb"  # Instead of larger

# Check repository size
# Very large repos may timeout
# Use prebuilds to speed up
```

**4. High costs**

**Symptoms:** Unexpected billing charges

**Solutions:**
```bash
# Check running Codespaces
gh codespace list

# Delete old Codespaces
gh codespace delete --all --older-than 7d

# Review Actions usage
gh api /repos/OWNER/REPO/actions/billing/usage

# Set spending limits
# Settings → Billing → Spending limits

# Optimize workflows
# - Use concurrency limits
# - Add timeout-minutes
# - Cache dependencies
```

**5. Claude Code errors**

**Symptoms:** Action fails with Claude API error

**Solutions:**
```yaml
# Check API status
# https://status.anthropic.com

# Verify model name
model: "claude-sonnet-4-5"  # Not "claude-3-sonnet"

# Add retry logic
- uses: anthropics/claude-code-action@v1
  continue-on-error: true

- name: Retry
  if: failure()
  uses: anthropics/claude-code-action@v1

# Check token limits
# Reduce context size if hitting limits
```

### Debug Workflow

**Add debugging steps:**
```yaml
- name: Debug Info
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Action: ${{ github.event.action }}"
    echo "Actor: ${{ github.actor }}"
    echo "Issue: #${{ github.event.issue.number }}"
    echo "Labels: ${{ toJson(github.event.issue.labels) }}"

- name: Debug Secrets
  run: |
    # Never echo actual secret values!
    if [ -z "${{ secrets.ANTHROPIC_API_KEY }}" ]; then
      echo "ERROR: API key not set"
    else
      echo "API key is set (length: ${#ANTHROPIC_API_KEY})"
    fi
```

**Enable debug logging:**
```bash
# In repository settings
Settings → Secrets and variables → Actions → Variables
Add variable: ACTIONS_RUNNER_DEBUG = true
Add variable: ACTIONS_STEP_DEBUG = true
```

---

## Summary

GitHub Codespaces is powerful for development environments but **not optimal for CI/CD automation**. For AI-assisted automation:

**Use:** IssueOps + Claude Code GitHub Actions
**Cost:** ~$30-50/month for moderate usage
**Setup:** 1-2 days for full implementation
**ROI:** 50%+ time savings on routine tasks

**Reserve Codespaces for:**
- Developer onboarding
- Consistent development environments
- Complex testing scenarios
- Interactive debugging

This approach provides the best balance of cost, performance, and capability for AI-assisted CI/CD automation.
