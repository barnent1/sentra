# Sentra CLI - Portable AI-Powered Development System

**Problem:** We need to test Sentra's AI factory in clean project directories without interference from the main Sentra codebase.

**Solution:** Create a `sentra` CLI tool that can initialize the AI-powered infrastructure in any project directory.

---

## Design Goals

1. **Portability** - Easy to install Sentra in any project (new or existing)
2. **Test Isolation** - Run tests in clean directories separate from Sentra development
3. **Simple Onboarding** - One command to get started
4. **Distribution** - Can be published as Python package or standalone installer
5. **No Lock-In** - All infrastructure is human-readable and modifiable

---

## CLI Commands

```bash
# Initialize Sentra in current directory
sentra init

# Initialize Sentra in new directory
sentra init ~/my-saas-app

# Create and run test project
sentra test <spec-name> <target-directory>
# Example: sentra test bookmark-manager ~/test-projects/bm-test

# Run voice architect interactively
sentra architect [session-name]

# Run meta-orchestrator to generate issues
sentra orchestrate <session-name>

# Show configuration
sentra config

# Check health of installation
sentra doctor
```

---

## What `sentra init` Does

When you run `sentra init` in a directory, it:

### 1. Creates Infrastructure Directories

```
project/
├── .claude/
│   ├── agents/           # Copy all 11 specialized agents
│   ├── hooks/            # Copy 6-layer quality defense
│   ├── skills/           # Copy 7 skills (progressive disclosure)
│   ├── scripts/          # Copy ai-agent-worker.py, etc.
│   ├── docs/             # Copy architecture docs
│   └── settings.json     # Claude Code settings
├── .sentra/
│   ├── scripts/          # Copy all Python scripts
│   ├── config.yml        # Project configuration
│   └── .gitkeep
├── .github/
│   └── workflows/
│       └── ai-agent.yml  # Copy GitHub Actions workflow
└── .gitignore            # Add .sentra entries
```

### 2. Installs Dependencies

- Serena MCP (semantic code search)
- Claude Code CLI (if not present)
- Python dependencies (anthropic, PyGithub, etc.)

### 3. Creates Configuration

**`.sentra/config.yml`:**
```yaml
project:
  name: "My SaaS App"
  type: "nextjs"  # nextjs, react, express, etc.
  initialized: "2025-11-17"

repository:
  url: "https://github.com/user/repo"
  main_branch: "main"

agent:
  max_execution_time: 45
  max_api_calls: 150
  require_tests: true
  github_comments: true

coverage:
  global: 75
  services: 90
  utils: 90

labels:
  - "ai-feature"
  - "p0"
  - "p1"
  - "p2"
  - "foundation"
```

### 4. Sets Up GitHub Integration

```bash
# Create required labels
gh label create "ai-feature" --description "AI agent will implement" --color "0e8a16"
gh label create "p0" --description "Critical priority" --color "d73a4a"
gh label create "p1" --description "High priority" --color "ff9800"
gh label create "p2" --description "Medium priority" --color "ffc107"
gh label create "foundation" --description "Foundation infrastructure" --color "1d76db"
gh label create "needs-help" --description "Requires human attention" --color "d73a4a"

# Verify GitHub Actions can run
gh workflow list
```

### 5. Validates Environment

- ✅ Git repository initialized
- ✅ GitHub CLI authenticated
- ✅ Claude Code CLI installed
- ✅ Anthropic API key configured
- ✅ Node.js/npm installed (if applicable)
- ✅ Python 3.11+ installed

---

## What `sentra test` Does

When you run `sentra test bookmark-manager ~/test-projects/bm-test`, it:

### 1. Creates Isolated Project Directory

```bash
mkdir -p ~/test-projects/bm-test
cd ~/test-projects/bm-test
```

### 2. Initializes Clean Project

```bash
# For Next.js test
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo
gh repo create bm-test --private --source=. --remote=origin --push
```

### 3. Runs `sentra init`

Copies all Sentra infrastructure into the clean project.

### 4. Copies Test Specification

```bash
# Copy spec from Sentra development repo
cp -r ~/Projects/sentra/.sentra/architect-sessions/bookmark-manager-test \
      ~/test-projects/bm-test/.sentra/architect-sessions/
```

### 5. Generates Issues

```bash
# Run meta-orchestrator
python3 .sentra/scripts/run-agent.py meta-orchestrator \
  --session bookmark-manager-test \
  --output .sentra/dependency-graph-bookmark-test.yml
```

### 6. Creates GitHub Issues (Optional)

```bash
# Ask user if they want to create all issues now
echo "Generate 48 GitHub issues? (y/n)"
read answer

if [ "$answer" = "y" ]; then
  python3 .sentra/scripts/create-issues.py \
    .sentra/dependency-graph-bookmark-test.yml
fi
```

### 7. Monitors Execution

```bash
# Start monitoring script
./scripts/monitor-test.sh
```

---

## Implementation Structure

### Main CLI Entry Point

**`sentra-cli/sentra`** (Python script with shebang):

```python
#!/usr/bin/env python3
"""
Sentra CLI - AI-Powered SaaS Factory
"""
import click
from sentra_cli.commands import init, test, architect, orchestrate, config, doctor

@click.group()
@click.version_option(version='1.0.0')
def cli():
    """Sentra - AI-Powered SaaS Factory"""
    pass

cli.add_command(init.init_command)
cli.add_command(test.test_command)
cli.add_command(architect.architect_command)
cli.add_command(orchestrate.orchestrate_command)
cli.add_command(config.config_command)
cli.add_command(doctor.doctor_command)

if __name__ == '__main__':
    cli()
```

### Directory Structure

```
sentra-cli/
├── sentra                 # Main executable
├── setup.py               # Python package setup
├── requirements.txt       # Dependencies
├── README.md
├── sentra_cli/
│   ├── __init__.py
│   ├── commands/
│   │   ├── init.py        # sentra init
│   │   ├── test.py        # sentra test
│   │   ├── architect.py   # sentra architect
│   │   ├── orchestrate.py # sentra orchestrate
│   │   ├── config.py      # sentra config
│   │   └── doctor.py      # sentra doctor
│   ├── templates/         # Infrastructure templates
│   │   ├── claude/        # .claude/ directory
│   │   ├── sentra/        # .sentra/ directory
│   │   ├── github/        # .github/ workflows
│   │   └── config.yml.tmpl
│   └── utils/
│       ├── git.py         # Git operations
│       ├── github.py      # GitHub operations
│       └── validation.py  # Environment validation
└── tests/
    ├── test_init.py
    ├── test_test.py
    └── fixtures/
```

---

## Installation

### Method 1: Install from PyPI (Future)

```bash
pip install sentra-cli
sentra --version
```

### Method 2: Install from Git (Current)

```bash
git clone https://github.com/barnent1/sentra.git
cd sentra/sentra-cli
pip install -e .
sentra --version
```

### Method 3: Standalone Installer

```bash
curl -fsSL https://sentra.dev/install.sh | bash
sentra --version
```

---

## Usage Examples

### Example 1: Initialize Sentra in Existing Project

```bash
cd ~/my-existing-app
sentra init

# Output:
# ✅ Created .claude/ directory with 11 agents
# ✅ Created .sentra/ directory with scripts
# ✅ Created .github/workflows/ai-agent.yml
# ✅ Installed Serena MCP
# ✅ Created GitHub labels
# ✅ Sentra initialized successfully!
#
# Next steps:
# 1. Run: sentra architect my-feature
# 2. Describe your feature to the voice architect
# 3. Run: sentra orchestrate my-feature
# 4. GitHub issues will be created and agents will start working
```

### Example 2: Test Bookmark Manager in Clean Directory

```bash
sentra test bookmark-manager ~/test-projects/bm-test

# Output:
# 📦 Creating project directory: ~/test-projects/bm-test
# 🎨 Initializing Next.js project...
# 🔧 Running sentra init...
# 📋 Copying bookmark-manager specification...
# 🤖 Running meta-orchestrator...
# ✅ Generated 48 issues with dependency graph
#
# Create GitHub issues now? (y/n): y
# ✅ Created issue #1: [BM-001] Setup Next.js 15 + TypeScript
# ✅ Created issue #2: [BM-002] Setup Prisma ORM
# ✅ Created issue #3: [BM-003] Setup Vitest + Playwright
# ...
# ✅ All 48 issues created!
#
# 🔍 Monitoring execution...
# Use Ctrl+C to stop monitoring
```

### Example 3: Start Voice Architect Session

```bash
cd ~/my-project
sentra architect payment-system

# Output:
# 🎙️  Starting Voice Architect for session: payment-system
# 📁 Session directory: .sentra/architect-sessions/payment-system/
#
# [Voice Architect begins conversation...]
```

### Example 4: Check Installation Health

```bash
sentra doctor

# Output:
# Sentra Health Check
# ==================
# ✅ Git: Installed (v2.39.0)
# ✅ GitHub CLI: Installed (v2.40.0)
# ✅ Claude Code CLI: Installed (v1.5.0)
# ✅ Python: 3.11.7
# ✅ Node.js: v20.10.0
# ✅ Anthropic API Key: Configured
# ✅ GitHub Token: Configured
# ✅ Serena MCP: Installed
# ✅ .claude/ directory: Present (11 agents, 7 skills, 6 hooks)
# ✅ .sentra/ directory: Present
# ✅ GitHub Actions: Enabled
#
# All systems operational! 🚀
```

---

## Benefits

### For Testing
- **Clean isolation** - Each test runs in its own directory
- **Reproducible** - Same setup every time
- **Fast iteration** - Quickly create and destroy test projects

### For Users
- **Simple onboarding** - One command to get started
- **No lock-in** - All files are human-readable and modifiable
- **Portable** - Works in any project (new or existing)

### For Distribution
- **Easy to share** - `pip install sentra-cli`
- **Easy to update** - `pip install --upgrade sentra-cli`
- **Cross-platform** - Works on macOS, Linux, Windows

---

## Next Steps

1. **Implement `sentra init` command** - Core functionality for copying infrastructure
2. **Implement `sentra test` command** - Automated test project creation
3. **Create template system** - Efficient copying of .claude/, .sentra/, .github/ directories
4. **Add `sentra doctor`** - Health check and troubleshooting
5. **Package for distribution** - setup.py, PyPI publishing
6. **Write documentation** - Usage guide, examples, troubleshooting

---

## Technical Notes

### Template System

Use Jinja2 templates for files that need customization:

```python
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader('templates'))
template = env.get_template('config.yml.tmpl')

rendered = template.render(
    project_name="My SaaS App",
    repo_url="https://github.com/user/repo"
)

with open('.sentra/config.yml', 'w') as f:
    f.write(rendered)
```

### Copy vs Symlink

For development, symlink to main Sentra repo:
```bash
ln -s ~/Projects/sentra/.claude/agents .claude/agents
```

For production, copy files:
```bash
cp -r ~/Projects/sentra/.claude/agents .claude/agents
```

### GitHub Actions Container Image

The `sentra test` command needs to build and push the Docker container image:

```bash
# Build container image for test project
docker build -t ghcr.io/user/bm-test-agent:latest -f .claude/Dockerfile .
docker push ghcr.io/user/bm-test-agent:latest

# Update workflow to use project-specific image
sed -i '' 's/sentra-agent:latest/bm-test-agent:latest/' .github/workflows/ai-agent.yml
```

---

**Status:** Design complete, ready for implementation
**Estimated Time:** 4-6 hours for core functionality
**Priority:** P0 (blocking test execution)
