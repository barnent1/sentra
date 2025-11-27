# Quetrex CLI

A command-line tool for initializing and managing AI-powered development workflows.

## Installation

### Method 1: From Source (Current)

```bash
cd ~/Projects/quetrex/quetrex-cli
./install.sh
```

This installs the `quetrex` command to `~/.local/bin/` (or `/usr/local/bin/` if available).

### Method 2: Direct Execution

```bash
# Run without installing
~/Projects/quetrex/quetrex-cli/quetrex --version
```

## Commands

### `quetrex init [directory]`

Initialize Quetrex AI-powered infrastructure in a project.

```bash
# Initialize in current directory
cd ~/my-project
quetrex init

# Initialize in specific directory
quetrex init ~/my-project
```

**What it does:**
- Copies `.claude/` directory (11 agents, 7 skills, 6 hooks, scripts)
- Copies `.quetrex/` directory (Python scripts)
- Copies `.github/workflows/ai-agent.yml`
- Creates `.quetrex/config.yml`
- Updates `.gitignore`

### `quetrex test <spec-name> <directory>`

Create an isolated test project from a specification.

```bash
# Create bookmark manager test project
quetrex test bookmark-manager-test ~/test-projects/bookmark-manager

# What happens:
# 1. Creates ~/test-projects/bookmark-manager/
# 2. Runs: npx create-next-app@latest
# 3. Initializes git repository
# 4. Runs: quetrex init
# 5. Copies specification from Quetrex repo
```

**After test project is created:**
```bash
cd ~/test-projects/bookmark-manager

# Create GitHub repository
gh repo create bookmark-manager --private --source=. --remote=origin --push

# Build and push Docker container (required for GitHub Actions)
docker build -t ghcr.io/YOUR_USERNAME/bookmark-manager-agent:latest -f .claude/Dockerfile .
docker push ghcr.io/YOUR_USERNAME/bookmark-manager-agent:latest

# Update workflow to use your container
sed -i '' 's/quetrex-agent:latest/bookmark-manager-agent:latest/g' .github/workflows/ai-agent.yml
sed -i '' 's/${{ github.repository_owner }}/YOUR_USERNAME/g' .github/workflows/ai-agent.yml

# Generate issues from specification
cd ~/test-projects/bookmark-manager
python3 .quetrex/scripts/run-agent.py meta-orchestrator \
  --session bookmark-manager-test \
  --output .quetrex/dependency-graph.yml

# Create GitHub issues
python3 .quetrex/scripts/create-issues.py .quetrex/dependency-graph.yml

# Monitor execution
./scripts/monitor-test.sh
```

### `quetrex doctor`

Check installation health and environment.

```bash
quetrex doctor

# Output:
# ✅ Git: git version 2.39.0
# ✅ GitHub CLI: gh version 2.40.0
# ✅ Claude Code CLI: v1.5.0
# ✅ Python: Python 3.11.7
# ✅ Node.js: v20.10.0
# ❌ Anthropic API Key: Not configured
# ❌ GitHub Token: Not configured
# ✅ .claude/ directory: /path/to/.claude
```

## Quick Start

### 1. Test Bookmark Manager (Recommended)

This creates a completely isolated test project:

```bash
# Create test project
quetrex test bookmark-manager-test ~/test-projects/bm-test

# Navigate to project
cd ~/test-projects/bm-test

# Create GitHub repo (replace YOUR_USERNAME)
gh repo create bm-test --private --source=. --remote=origin --push

# The test project is now ready!
# Next: Generate issues and let AI agents build it
```

### 2. Initialize Quetrex in Existing Project

```bash
cd ~/my-existing-app
quetrex init

# Quetrex infrastructure is now installed
# Next: Run voice architect or create issues
```

## Architecture

### What Gets Copied

When you run `quetrex init`, these directories are copied:

```
your-project/
├── .claude/
│   ├── agents/           # 11 specialized agents
│   │   ├── orchestrator.md
│   │   ├── test-writer.md
│   │   ├── implementation.md
│   │   ├── code-reviewer.md
│   │   ├── test-runner.md
│   │   ├── security-auditor.md
│   │   ├── refactoring-agent.md
│   │   ├── architecture-advisor.md
│   │   ├── voice-architect.md
│   │   ├── meta-orchestrator.md
│   │   └── codebase-archaeologist.md
│   ├── skills/           # 7 progressive disclosure skills
│   │   ├── quetrex-architect/
│   │   ├── semantic-code-hunter/
│   │   ├── nextjs-15-specialist/
│   │   ├── typescript-strict-guard/
│   │   ├── tdd-enforcer/
│   │   ├── security-sentinel/
│   │   └── voice-system-expert/
│   ├── hooks/            # 6-layer quality defense
│   │   ├── PreToolUse/
│   │   ├── PostToolUse/
│   │   └── Stop/
│   ├── scripts/          # AI agent worker scripts
│   │   └── ai-agent-worker.py
│   ├── docs/             # Architecture documentation
│   └── settings.json     # Claude Code settings
├── .quetrex/
│   ├── scripts/          # Python utilities
│   │   ├── figma-import.py
│   │   ├── dependency-manager.py
│   │   ├── check-dependencies.py
│   │   ├── update-progress.py
│   │   └── init-project.py
│   └── config.yml        # Project configuration
├── .github/
│   └── workflows/
│       └── ai-agent.yml  # GitHub Actions workflow
└── .gitignore            # Updated with Quetrex entries
```

## Requirements

- **Git**: Version control
- **GitHub CLI**: `gh` command for GitHub integration
- **Claude Code CLI**: `claude` command for AI agent execution
- **Python 3.11+**: For scripts
- **Node.js**: For Next.js projects
- **Docker**: For building agent container images

## Environment Variables

Required for GitHub Actions:

- `ANTHROPIC_API_KEY`: Claude API key
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Troubleshooting

### `quetrex: command not found`

Make sure `~/.local/bin` is in your PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### `.claude/ directory not found`

The `quetrex` CLI needs to be run from the Quetrex repository or after installation. It uses the Quetrex repo as the source for infrastructure files.

### Git push fails in GitHub Actions

The Docker container needs proper GitHub credentials. Ensure:
1. `GITHUB_TOKEN` secret is available
2. Container has git configured
3. Branch protection rules allow pushes

## Development

### Project Structure

```
quetrex-cli/
├── quetrex          # Main CLI executable (Python)
├── install.sh      # Installation script
└── README.md       # This file
```

### Testing Changes

```bash
# Test without installing
~/Projects/quetrex/quetrex-cli/quetrex doctor

# Test init command
cd /tmp/test-project
~/Projects/quetrex/quetrex-cli/quetrex init

# Reinstall after changes
cd ~/Projects/quetrex/quetrex-cli
./install.sh
```

## Examples

### Example 1: Quick Test

```bash
# Create test in 3 commands
quetrex test bookmark-manager-test ~/test/bm
cd ~/test/bm
gh repo create bm --private --source=. --remote=origin --push

# Now AI agents can work on issues
```

### Example 2: Existing Project

```bash
cd ~/my-saas-app
quetrex init

# Infrastructure is ready
# Create issues and let AI build features
```

### Example 3: Multiple Tests

```bash
# Test different specifications in parallel
quetrex test bookmark-manager-test ~/test/bm1
quetrex test todo-app-test ~/test/todo
quetrex test blog-platform-test ~/test/blog

# Each runs independently
```

## License

Created by Glen Barnhardt with help from Claude Code
Part of the Quetrex AI-Powered SaaS Factory project

## Links

- **GitHub**: https://github.com/barnent1/quetrex
- **Documentation**: `~/Projects/quetrex/docs/`
- **CLI Design**: `~/Projects/quetrex/docs/architecture/QUETREX-CLI-DESIGN.md`
