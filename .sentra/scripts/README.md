# Sentra Automation Scripts

Python automation scripts for the Sentra AI-Powered SaaS Factory system.

---

## Overview

These scripts automate common tasks in the Sentra development workflow:

- **Project initialization** (new and existing codebases)
- **Dependency management** and conflict resolution
- **Progress tracking** and metrics collection
- **Automated refactoring** and code improvement
- **Dashboard generation** for project monitoring

All scripts are designed to be used with Claude Code Skills and can be invoked directly from the command line.

---

## Scripts

### 1. init-project.py

**Purpose:** Initialize a NEW project structure

**Usage:**
```bash
python .sentra/scripts/init-project.py --name "project-name"
```

**What it does:**
- Creates `.sentra/architect-sessions/[project-name]/` structure
- Generates session templates
- Creates coverage checklist (all 0%)
- Creates progress tracker
- Provides Voice Architect startup guide

**When to use:**
- Starting a new SaaS product from scratch
- No existing codebase to work with
- Want to use Voice Architect to design architecture

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

**Example:**
```bash
# Initialize bookmark manager project
python .sentra/scripts/init-project.py --name "bookmark-manager"

# Then start Voice Architect
claude
> Enable Voice Architect Skill
> I want to start Session 1 for bookmark-manager
```

---

### 2. init-existing-project.py

**Purpose:** Initialize Sentra for EXISTING codebase

**Usage:**
```bash
python .sentra/scripts/init-existing-project.py
```

**What it does:**
- Analyzes existing codebase structure
- Detects frameworks and patterns
- Creates protection rules for critical paths
- Extracts existing patterns
- Identifies breaking change risks
- Generates safety guidelines

**When to use:**
- Adding Sentra to existing project
- Need to protect current functionality
- Want to maintain existing patterns
- Adding new features to production code

**Output:**
```
docs/existing-codebase/
├── ANALYSIS-SUMMARY.md           # Overview and statistics
└── patterns/
    └── detected-patterns.md      # Code patterns found

.sentra/protection/
└── protection-rules.yml          # Safety rules and restrictions
```

**Example:**
```bash
# Analyze existing codebase
python .sentra/scripts/init-existing-project.py

# Review what was found
cat docs/existing-codebase/ANALYSIS-SUMMARY.md

# Then use Meta Orchestrator to add features safely
claude
> Enable Meta Orchestrator Skill
> I want to add user authentication to the existing codebase
```

---

### 3. auto-refactor.py

**Purpose:** Automated code refactoring and improvement

**Usage:**
```bash
# Analyze code quality
python .sentra/scripts/auto-refactor.py --analyze

# Apply refactoring
python .sentra/scripts/auto-refactor.py --refactor path/to/file.ts

# Dry run (show what would change)
python .sentra/scripts/auto-refactor.py --refactor path/to/file.ts --dry-run
```

**What it does:**
- Detects code smells and anti-patterns
- Suggests refactoring opportunities
- Applies safe automated refactorings
- Generates refactoring reports
- Maintains test compatibility

**Features:**
- Extract method refactoring
- Simplify conditionals
- Remove dead code
- Rename for clarity
- DRY principle enforcement

**Example:**
```bash
# Analyze services directory
python .sentra/scripts/auto-refactor.py --analyze src/services/

# Refactor auth service
python .sentra/scripts/auto-refactor.py --refactor src/services/auth.ts

# Generate report
python .sentra/scripts/auto-refactor.py --report
```

---

### 4. dashboard-generator.py

**Purpose:** Generate project monitoring dashboards

**Usage:**
```bash
# Generate dashboard HTML
python .sentra/scripts/dashboard-generator.py --output dashboard.html

# Generate JSON data only
python .sentra/scripts/dashboard-generator.py --json

# Serve dashboard locally
python .sentra/scripts/dashboard-generator.py --serve
```

**What it does:**
- Collects project metrics
- Generates visualizations
- Creates HTML dashboard
- Shows test coverage trends
- Displays feature progress

**Dashboard includes:**
- Test coverage charts
- Feature completion status
- Session history timeline
- Code quality metrics
- Dependency health

**Example:**
```bash
# Generate and view dashboard
python .sentra/scripts/dashboard-generator.py --serve

# Opens browser to http://localhost:8000
# Shows real-time project status
```

---

### 5. metrics-collector.py

**Purpose:** Collect and track project metrics

**Usage:**
```bash
# Collect current metrics
python .sentra/scripts/metrics-collector.py --collect

# Show metrics summary
python .sentra/scripts/metrics-collector.py --summary

# Export metrics to JSON
python .sentra/scripts/metrics-collector.py --export metrics.json
```

**What it does:**
- Tracks test coverage over time
- Monitors code quality metrics
- Records feature completion
- Tracks session activity
- Generates metric reports

**Metrics tracked:**
- Test coverage (overall, services, utils, components)
- Files created/modified
- Tests written
- Features completed
- Session count

**Example:**
```bash
# Collect metrics after feature completion
python .sentra/scripts/metrics-collector.py --collect

# View summary
python .sentra/scripts/metrics-collector.py --summary

# Example output:
# Coverage: 87.2% (↑ 2.3%)
# Features: 12 completed
# Tests: 145 passing
# Sessions: 8 total
```

---

### 6. check-dependencies.py

**Purpose:** Check for dependency conflicts and updates

**Usage:**
```bash
# Check for conflicts
python .sentra/scripts/check-dependencies.py --check

# Show updates available
python .sentra/scripts/check-dependencies.py --updates

# Verify dependency graph
python .sentra/scripts/check-dependencies.py --verify
```

**What it does:**
- Detects dependency conflicts
- Checks for circular dependencies
- Validates dependency graph
- Shows available updates
- Suggests resolution strategies

**Example:**
```bash
# Check dependencies before adding feature
python .sentra/scripts/check-dependencies.py --check

# If conflicts found, show resolution
python .sentra/scripts/check-dependencies.py --resolve
```

---

### 7. dependency-manager.py

**Purpose:** Manage feature dependencies and build order

**Usage:**
```bash
# Show dependency graph
python .sentra/scripts/dependency-manager.py --graph

# Check if feature can be built
python .sentra/scripts/dependency-manager.py --can-build feature-name

# Get build order
python .sentra/scripts/dependency-manager.py --build-order
```

**What it does:**
- Maintains dependency graph
- Validates dependencies exist
- Calculates build order
- Prevents circular dependencies
- Shows dependency tree

**Example:**
```bash
# Before starting new feature
python .sentra/scripts/dependency-manager.py --can-build user-profile

# Output:
# ✓ user-authentication (completed)
# ✓ database-schema (completed)
# → user-profile can be built
```

---

### 8. update-progress.py

**Purpose:** Update project progress tracking

**Usage:**
```bash
# Update progress after session
python .sentra/scripts/update-progress.py --session 5 --complete

# Mark feature complete
python .sentra/scripts/update-progress.py --feature user-auth --status complete

# Show current progress
python .sentra/scripts/update-progress.py --show
```

**What it does:**
- Tracks session completion
- Updates feature status
- Records milestones
- Updates progress.json
- Generates progress reports

**Example:**
```bash
# After completing Session 3
python .sentra/scripts/update-progress.py --session 3 --complete

# Mark authentication feature complete
python .sentra/scripts/update-progress.py --feature user-auth --status complete

# View progress
python .sentra/scripts/update-progress.py --show
# Output: 3/10 sessions complete (30%)
```

---

### 9. figma-import.py

**Purpose:** Import Figma designs as specifications

**Usage:**
```bash
# Import Figma file
python .sentra/scripts/figma-import.py --url "figma.com/file/abc123"

# Import specific frame
python .sentra/scripts/figma-import.py --url "figma.com/file/abc123" --frame "Login Screen"

# Generate specs
python .sentra/scripts/figma-import.py --url "figma.com/file/abc123" --specs
```

**What it does:**
- Fetches Figma design via API
- Extracts component hierarchy
- Generates screen specifications
- Creates component specs
- Downloads design assets

**Requires:**
- Figma API token in `.env`: `FIGMA_API_TOKEN=...`
- Figma file URL

**Example:**
```bash
# Import login screen design
python .sentra/scripts/figma-import.py \
  --url "https://figma.com/file/abc123/MyApp" \
  --frame "Login Screen" \
  --specs

# Creates:
# docs/specs/screens/login-screen.md
# docs/specs/components/login-form.md
```

---

## Common Workflows

### Workflow 1: New Project Setup

```bash
# 1. Initialize new project
python .sentra/scripts/init-project.py --name "my-saas"

# 2. Start Voice Architect
claude
> Enable Voice Architect Skill
> Start Session 1 for my-saas

# 3. After session, collect metrics
python .sentra/scripts/metrics-collector.py --collect

# 4. View dashboard
python .sentra/scripts/dashboard-generator.py --serve
```

---

### Workflow 2: Existing Project Integration

```bash
# 1. Analyze existing codebase
python .sentra/scripts/init-existing-project.py

# 2. Review analysis
cat docs/existing-codebase/ANALYSIS-SUMMARY.md

# 3. Check dependencies
python .sentra/scripts/check-dependencies.py --check

# 4. Start Meta Orchestrator
claude
> Enable Meta Orchestrator Skill
> Add feature X following existing patterns
```

---

### Workflow 3: Feature Development

```bash
# 1. Check if dependencies are ready
python .sentra/scripts/dependency-manager.py --can-build new-feature

# 2. Import design (if from Figma)
python .sentra/scripts/figma-import.py --url "figma.com/file/..."

# 3. Build feature with Meta Orchestrator
claude
> Enable Meta Orchestrator Skill
> Build new-feature

# 4. Update progress
python .sentra/scripts/update-progress.py --feature new-feature --status complete

# 5. Collect metrics
python .sentra/scripts/metrics-collector.py --collect
```

---

### Workflow 4: Code Quality Improvement

```bash
# 1. Analyze code quality
python .sentra/scripts/auto-refactor.py --analyze

# 2. Review suggestions
cat .sentra/refactor-report.md

# 3. Apply safe refactorings
python .sentra/scripts/auto-refactor.py --refactor src/services/ --dry-run

# 4. If looks good, apply
python .sentra/scripts/auto-refactor.py --refactor src/services/

# 5. Run tests to verify
npm test
```

---

## Configuration

### Environment Variables

Scripts may use these environment variables:

```bash
# Figma API (for figma-import.py)
FIGMA_API_TOKEN=your-token-here

# Project settings
PROJECT_NAME=sentra
PROJECT_ROOT=/path/to/project

# Metrics collection
METRICS_INTERVAL=daily
METRICS_RETENTION=30
```

Add to `.env` file in project root.

---

### Script Settings

Some scripts have configuration files:

```
.sentra/
├── config/
│   ├── refactor-rules.yml      # Auto-refactor rules
│   ├── metrics-config.yml      # Metrics collection config
│   └── dashboard-config.yml    # Dashboard settings
```

---

## Dependencies

All scripts require Python 3.11+ and these packages:

```bash
# Install via requirements.txt
pip install -r requirements.txt

# Includes:
# - requests (HTTP calls)
# - pyyaml (YAML parsing)
# - python-dotenv (environment variables)
# - rich (beautiful terminal output)
# - click (CLI arguments)
```

---

## Development

### Adding New Scripts

1. Create script in `.sentra/scripts/`
2. Make executable: `chmod +x script.py`
3. Add shebang: `#!/usr/bin/env python3`
4. Document in this README
5. Add usage examples

### Testing Scripts

```bash
# Dry run mode
python .sentra/scripts/script.py --dry-run

# Verbose output
python .sentra/scripts/script.py --verbose

# Debug mode
python .sentra/scripts/script.py --debug
```

---

## Troubleshooting

### Script Not Found

```bash
# Make sure you're in project root
cd /path/to/sentra

# Check script exists
ls .sentra/scripts/

# Make executable
chmod +x .sentra/scripts/script.py
```

### Python Import Errors

```bash
# Install dependencies
pip install -r requirements.txt

# Use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Permission Denied

```bash
# Make script executable
chmod +x .sentra/scripts/script.py

# Run with python explicitly
python .sentra/scripts/script.py
```

---

## Support

- **Main README:** `.sentra/README.md`
- **Installation Guide:** `scripts/INSTALLATION.md`
- **Project Instructions:** `CLAUDE.md`
- **Issues:** https://github.com/barnent1/sentra/issues

---

**Author:** Glen Barnhardt with help from Claude Code
**License:** MIT
**Version:** 1.0.0
