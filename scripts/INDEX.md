# Quetrex Installation Scripts - Complete Index

Quick reference guide to all installation and setup scripts.

---

## Start Here

**Brand New to Quetrex?** → `QUICK-START.md` (5 minutes)

**Need Detailed Instructions?** → `INSTALLATION.md` (comprehensive guide)

**Ready to Setup?** → Run `./scripts/setup-quetrex.sh`

---

## Core Scripts

### 1. setup-quetrex.sh
**Complete system setup automation**

```bash
./scripts/setup-quetrex.sh
```

**Does:**
- Checks prerequisites (Python, Node.js, git, gh, claude)
- Installs Serena MCP
- Creates directory structure
- Installs dependencies
- Validates installation

**When:** First time setup, or resetting environment

**Time:** ~5 minutes

---

### 2. install-serena.sh
**Serena MCP installation only**

```bash
./scripts/install-serena.sh
```

**Does:**
- Installs UV package manager
- Adds Serena MCP via Claude CLI
- Configures for read-only mode
- Pre-indexes project

**When:** Just need Serena for codebase understanding

**Time:** ~2 minutes

---

### 3. init-project.py
**Initialize NEW project**

```bash
python .quetrex/scripts/init-project.py --name "project-name"
```

**Does:**
- Creates session directory structure
- Generates session templates
- Creates coverage checklist
- Creates progress tracker
- Provides Voice Architect guidance

**When:** Starting new SaaS product from scratch

**Time:** ~30 seconds

---

### 4. init-existing-project.py
**Initialize EXISTING project**

```bash
python .quetrex/scripts/init-existing-project.py
```

**Does:**
- Analyzes codebase structure
- Detects frameworks and patterns
- Creates protection rules
- Extracts existing patterns
- Identifies critical paths

**When:** Adding Quetrex to existing codebase

**Time:** ~2 minutes

---

## Documentation

### Quick Reference

**File:** `QUICK-START.md`
**Length:** 5-minute read
**For:** First-time users, quick command reference
**Contains:**
- Installation (2 min)
- New project setup (1 min)
- Existing project setup (1 min)
- Common commands
- Skills overview

---

### Installation Guide

**File:** `INSTALLATION.md`
**Length:** 10-minute read
**For:** Detailed setup, troubleshooting
**Contains:**
- Prerequisites
- Complete script documentation
- Usage examples
- Troubleshooting guide
- Directory structure

---

### Scripts Reference

**File:** `.quetrex/scripts/README.md`
**Length:** 15-minute read
**For:** Understanding automation scripts
**Contains:**
- All 9 automation scripts documented
- Usage examples for each
- Common workflows
- Configuration guide
- Development guidelines

---

### Implementation Summary

**File:** `INSTALLATION-COMPLETE.md`
**Length:** 10-minute read
**For:** Developers, contributors
**Contains:**
- Complete file list
- Features implemented
- Testing performed
- Design decisions
- Known limitations

---

## File Locations

### Setup Scripts
```
/Users/barnent1/Projects/quetrex/scripts/
├── setup-quetrex.sh          Main setup script
├── install-serena.sh        Serena MCP installation
├── QUICK-START.md           5-minute guide
├── INSTALLATION.md          Complete guide
└── INDEX.md                 This file
```

### Project Scripts
```
/Users/barnent1/Projects/quetrex/.quetrex/scripts/
├── init-project.py              New project initialization
├── init-existing-project.py     Existing project analysis
├── auto-refactor.py             Code refactoring
├── dashboard-generator.py       Dashboard generation
├── metrics-collector.py         Metrics collection
├── check-dependencies.py        Dependency checking
├── dependency-manager.py        Dependency graph
├── update-progress.py           Progress tracking
├── figma-import.py              Figma design import
└── README.md                    Scripts documentation
```

### Configuration
```
/Users/barnent1/Projects/quetrex/
├── requirements.txt         Python dependencies
├── package.json             Node.js dependencies
├── .gitignore              Ignore patterns
└── CLAUDE.md               Project instructions
```

---

## Usage Workflows

### Workflow 1: Complete First-Time Setup

```bash
# Step 1: Setup everything
./scripts/setup-quetrex.sh

# Step 2: Verify installation
claude --version
python3 --version
node --version

# Step 3: Choose your path
# Option A: New project
python .quetrex/scripts/init-project.py --name "my-project"

# Option B: Existing project
python .quetrex/scripts/init-existing-project.py
```

---

### Workflow 2: New Project Development

```bash
# 1. Initialize project
python .quetrex/scripts/init-project.py --name "bookmark-manager"

# 2. Start Voice Architect
claude
> Enable Voice Architect Skill
> I want to start Session 1 for bookmark-manager

# 3. Voice Architect guides through:
#    - Requirements
#    - Architecture
#    - Component design
#    - Database schema

# 4. Begin development
npm run dev

# 5. Build features with Meta Orchestrator
claude
> Enable Meta Orchestrator Skill
> Build user authentication feature
```

---

### Workflow 3: Existing Project Enhancement

```bash
# 1. Analyze existing code
python .quetrex/scripts/init-existing-project.py

# Output shows:
# - 234 files analyzed
# - Next.js, React, Prisma detected
# - Service layer, component architecture found
# - Protection rules created

# 2. Review analysis
cat docs/existing-codebase/ANALYSIS-SUMMARY.md

# 3. Review protection rules
cat .quetrex/protection/protection-rules.yml

# 4. Add features safely
claude
> Enable Meta Orchestrator Skill
> I want to add real-time notifications
# Meta Orchestrator follows existing patterns

# 5. Monitor progress
python .quetrex/scripts/dashboard-generator.py --serve
```

---

### Workflow 4: Codebase Understanding

```bash
# 1. Install Serena (if not already)
./scripts/install-serena.sh

# 2. Start Claude
claude

# 3. Ask Serena questions
> What is the overall architecture?
> Show me all React components
> Find all database queries
> What patterns are used for error handling?
> How is authentication implemented?
```

---

## Common Tasks

### Check Prerequisites

```bash
# Automated check
./scripts/setup-quetrex.sh
# Will check and report all prerequisites

# Manual check
python3 --version    # Need 3.11+
node --version       # Need 20+
git --version        # Any version
gh --version         # Any version
claude --version     # Any version
```

---

### Install Python Dependencies

```bash
# Option 1: Automated (via setup script)
./scripts/setup-quetrex.sh

# Option 2: Manual
pip install -r requirements.txt

# Option 3: Virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Install Node.js Dependencies

```bash
# Option 1: Automated (via setup script)
./scripts/setup-quetrex.sh

# Option 2: Manual
npm install

# Option 3: Clean install
rm -rf node_modules package-lock.json
npm install
```

---

### Update Documentation

```bash
# After making changes
cat scripts/INSTALLATION.md       # Review install guide
cat scripts/QUICK-START.md        # Review quick start
cat .quetrex/scripts/README.md     # Review scripts docs
cat INSTALLATION-COMPLETE.md      # Review implementation
```

---

### Run Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

---

## Troubleshooting

### Quick Fixes

**Problem:** Prerequisites missing
**Solution:** `./scripts/setup-quetrex.sh` will identify and guide

**Problem:** Python dependencies fail
**Solution:** Use virtual environment: `python3 -m venv venv`

**Problem:** Serena not found
**Solution:** `./scripts/install-serena.sh`

**Problem:** Claude CLI not found
**Solution:** Install from https://docs.claude.com/claude-code

**Problem:** Permission denied
**Solution:** `chmod +x scripts/*.sh .quetrex/scripts/*.py`

### Detailed Troubleshooting

See `scripts/INSTALLATION.md` → Troubleshooting section

---

## Support

### Documentation Hierarchy

```
1. QUICK-START.md           ← Start here (5 min)
2. INDEX.md                 ← You are here
3. INSTALLATION.md          ← Detailed guide
4. .quetrex/scripts/README.md ← Scripts reference
5. INSTALLATION-COMPLETE.md ← Implementation details
```

### External Resources

- **Claude Code:** https://docs.claude.com/claude-code
- **Serena MCP:** https://github.com/PierrunoYT/serena-mcp
- **GitHub Issues:** https://github.com/barnent1/quetrex/issues

---

## Version Information

**Version:** 1.0.0
**Date:** 2025-11-17
**Author:** Glen Barnhardt with help from Claude Code

---

## Quick Command Reference

```bash
# Setup
./scripts/setup-quetrex.sh

# New project
python .quetrex/scripts/init-project.py --name "project"

# Existing project
python .quetrex/scripts/init-existing-project.py

# Serena only
./scripts/install-serena.sh

# Development
npm run dev
npm test
npm run type-check

# Dashboard
python .quetrex/scripts/dashboard-generator.py --serve

# Metrics
python .quetrex/scripts/metrics-collector.py --summary
```

---

**Need help?** Start with `scripts/QUICK-START.md` or `scripts/INSTALLATION.md`

**Ready to build?** Run `./scripts/setup-quetrex.sh`
