# Sentra Installation Guide

Complete guide for setting up the Sentra AI-Powered SaaS Factory system.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Scripts](#installation-scripts)
- [Usage Examples](#usage-examples)
- [Directory Structure](#directory-structure)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Complete Setup (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/barnent1/sentra.git
cd sentra

# 2. Run complete setup
./scripts/setup-sentra.sh

# 3. Initialize for NEW project
python .sentra/scripts/init-project.py --name "your-project-name"

# OR initialize for EXISTING project
python .sentra/scripts/init-existing-project.py
```

That's it! You're ready to build.

---

## Prerequisites

The setup script checks for these automatically, but here's what you need:

### Required

- **Python 3.11+** - [Download from python.org](https://python.org)
- **Node.js 20+** - [Download from nodejs.org](https://nodejs.org)
- **git** - [Download from git-scm.com](https://git-scm.com)
- **GitHub CLI (gh)** - [Download from cli.github.com](https://cli.github.com)
- **Claude Code CLI** - [Install from docs.claude.com](https://docs.claude.com/claude-code)

### Verify Installation

```bash
python3 --version   # Should be 3.11.0 or higher
node --version      # Should be v20.0.0 or higher
git --version       # Any recent version
gh --version        # Any recent version
claude --version    # Any recent version
```

---

## Installation Scripts

### 1. setup-sentra.sh

**Complete system setup** - Installs everything you need.

```bash
./scripts/setup-sentra.sh
```

**What it does:**
1. Checks prerequisites (Python, Node.js, git, gh, claude)
2. Installs Serena MCP
3. Creates directory structure
4. Installs Python dependencies
5. Installs Node.js dependencies
6. Validates Claude Code CLI
7. Tests Skills activation

**Output:**
- `.sentra/` directory structure
- `docs/` directory structure
- `requirements.txt` (if not exists)
- Updated `.gitignore`
- Ready-to-use development environment

---

### 2. install-serena.sh

**Serena MCP installation** - Codebase understanding tool.

```bash
./scripts/install-serena.sh
```

**What it does:**
1. Checks for `uv` package manager (installs if missing)
2. Adds Serena MCP via Claude CLI
3. Configures for read-only access
4. Validates installation

**Serena provides:**
- Codebase indexing and search
- Pattern extraction
- Architecture understanding
- Symbol resolution

**Usage:**
```bash
claude
> What is the structure of this codebase?
> Show me all React hooks
> Find all database queries
```

---

### 3. init-project.py

**New project initialization** - For building from scratch.

```bash
python .sentra/scripts/init-project.py --name "project-name"
```

**What it does:**
1. Creates `.sentra/architect-sessions/[project-name]/` structure
2. Generates session templates
3. Creates coverage checklist (all 0%)
4. Creates progress tracker
5. Generates project README

**Use when:**
- Starting a new SaaS product
- Building MVP from scratch
- No existing codebase

**Output:**
```
.sentra/architect-sessions/project-name/
├── sessions/
│   └── session-001-initial-architecture.md
├── specs/
├── coverage/
│   └── coverage-checklist.yml
├── progress.json
└── README.md
```

---

### 4. init-existing-project.py

**Existing project initialization** - For adding to current codebase.

```bash
python .sentra/scripts/init-existing-project.py
```

**What it does:**
1. Analyzes existing codebase structure
2. Detects frameworks and patterns
3. Creates protection rules
4. Extracts existing patterns
5. Identifies critical paths
6. Generates safety guidelines

**Use when:**
- Adding Sentra to existing project
- Need to protect current functionality
- Want to maintain existing patterns

**Output:**
```
docs/existing-codebase/
├── ANALYSIS-SUMMARY.md
└── patterns/
    └── detected-patterns.md

.sentra/protection/
└── protection-rules.yml
```

---

## Usage Examples

### Example 1: Complete New Project Setup

```bash
# 1. Complete setup
./scripts/setup-sentra.sh

# 2. Initialize new project
python .sentra/scripts/init-project.py --name "bookmark-manager"

# 3. Start Voice Architect
claude
> Enable Voice Architect Skill
> I want to start Session 1 for bookmark-manager

# 4. Voice Architect will guide you through:
#    - Requirements gathering
#    - Architecture design
#    - Component hierarchy
#    - Database schema
```

---

### Example 2: Adding Sentra to Existing Project

```bash
# 1. Complete setup
./scripts/setup-sentra.sh

# 2. Analyze existing codebase
python .sentra/scripts/init-existing-project.py

# 3. Review analysis
cat docs/existing-codebase/ANALYSIS-SUMMARY.md

# 4. Review protection rules
cat .sentra/protection/protection-rules.yml

# 5. Start adding features safely
claude
> Enable Meta Orchestrator Skill
> I want to add user authentication to the existing codebase
```

---

### Example 3: Just Install Serena

```bash
# If you only want Serena MCP
./scripts/install-serena.sh

# Then use it
claude
> What patterns are used in this codebase?
> Show me the service layer architecture
```

---

## Directory Structure

After complete setup:

```
sentra/
├── .sentra/                          # Sentra configuration
│   ├── architect-sessions/           # Project sessions
│   │   └── [project-name]/
│   │       ├── sessions/             # Session history
│   │       ├── specs/                # Generated specs
│   │       ├── coverage/             # Coverage tracking
│   │       ├── progress.json         # Progress tracker
│   │       └── README.md             # Project overview
│   ├── scripts/                      # Automation scripts
│   │   ├── init-project.py           # New project init
│   │   └── init-existing-project.py  # Existing project init
│   ├── protection/                   # Protection rules (existing projects)
│   │   └── protection-rules.yml
│   ├── memory/                       # Pattern memory
│   │   └── patterns.md
│   └── README.md                     # Sentra overview
│
├── docs/                             # Documentation
│   ├── specs/                        # Feature specifications
│   │   └── [project-name]/
│   │       ├── screens/              # Screen designs
│   │       └── components/           # Component specs
│   ├── existing-codebase/            # Existing project analysis
│   │   ├── ANALYSIS-SUMMARY.md
│   │   └── patterns/
│   ├── architecture/                 # Architecture docs
│   ├── deployment/                   # Deployment guides
│   └── features/                     # Feature documentation
│
├── scripts/                          # Build scripts
│   ├── setup-sentra.sh               # Complete setup
│   ├── install-serena.sh             # Serena MCP install
│   └── INSTALLATION.md               # This file
│
├── requirements.txt                  # Python dependencies
├── package.json                      # Node.js dependencies
└── CLAUDE.md                         # Project instructions
```

---

## Troubleshooting

### Setup Script Fails

**Problem:** Prerequisites check fails

**Solution:**
```bash
# Check each requirement manually
python3 --version   # Need 3.11+
node --version      # Need 20+
git --version
gh --version
claude --version

# Install missing tools from links in Prerequisites section
```

---

### Serena Installation Fails

**Problem:** `uv` package manager not found

**Solution:**
```bash
# Install uv manually
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH
source $HOME/.cargo/env

# Retry Serena installation
./scripts/install-serena.sh
```

---

### Claude CLI Not Found

**Problem:** `claude: command not found`

**Solution:**
```bash
# Install Claude Code CLI
# Visit https://docs.claude.com/claude-code

# After installation, verify
claude --version

# If still not found, add to PATH
export PATH="$PATH:$HOME/.local/bin"
```

---

### Python Dependencies Failed

**Problem:** `pip install` fails

**Solution:**
```bash
# Upgrade pip
python3 -m pip install --upgrade pip

# Install dependencies with verbose output
python3 -m pip install -r requirements.txt --verbose

# Use virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Node Dependencies Failed

**Problem:** `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Retry installation
npm install

# If still fails, try yarn
npm install -g yarn
yarn install
```

---

### Project Already Exists

**Problem:** `init-project.py` says project exists

**Solution:**
```bash
# Check existing projects
ls .sentra/architect-sessions/

# Use different name
python .sentra/scripts/init-project.py --name "project-name-v2"

# OR remove old project
rm -rf .sentra/architect-sessions/old-project-name
```

---

### Git Repository Not Found

**Problem:** `init-existing-project.py` fails (not a git repo)

**Solution:**
```bash
# Initialize git repository
git init

# Add initial commit
git add .
git commit -m "Initial commit"

# Retry initialization
python .sentra/scripts/init-existing-project.py
```

---

## Next Steps

After installation:

### For New Projects

```bash
# 1. Initialize project
python .sentra/scripts/init-project.py --name "your-project"

# 2. Start Voice Architect
claude
> Enable Voice Architect Skill

# 3. Begin first session
> I want to start Session 1 for [your-project]
```

### For Existing Projects

```bash
# 1. Analyze codebase
python .sentra/scripts/init-existing-project.py

# 2. Review analysis
cat docs/existing-codebase/ANALYSIS-SUMMARY.md

# 3. Start Meta Orchestrator
claude
> Enable Meta Orchestrator Skill

# 4. Add new feature
> I want to add [feature] to the existing codebase
```

---

## Support

- **Documentation:** See `CLAUDE.md` and `.sentra/README.md`
- **Issues:** https://github.com/barnent1/sentra/issues
- **Claude Code Docs:** https://docs.claude.com/claude-code

---

**Author:** Glen Barnhardt with help from Claude Code
**License:** MIT
**Version:** 1.0.0
