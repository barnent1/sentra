# Dependency Tracking System

**Part of Quetrex's AI-Powered SaaS Factory**

This system manages issue dependencies, conflict detection, and batch progression for parallel AI agent execution.

---

## Overview

The dependency tracking system ensures:
- **Sequential execution** of dependent issues (API before UI)
- **Parallel execution** of independent issues (maximize throughput)
- **Conflict detection** (prevent simultaneous modification of same files)
- **Batch progression** (automatic triggering of next phase)
- **Progress tracking** (real-time visibility into project status)

### Architecture

```
.quetrex/
├── dependency-graph.yml      # Dependency definitions (manual)
├── progress.json             # Runtime progress tracking (auto-generated)
└── scripts/
    ├── dependency-manager.py    # Core logic (library)
    ├── check-dependencies.py    # Pre-issue validation (CLI)
    └── update-progress.py       # Post-merge updates (CLI)
```

---

## Quick Start

### 1. Create Dependency Graph

Copy the example and customize for your project:

```bash
cp .quetrex/dependency-graph.example.yml .quetrex/dependency-graph.yml
```

Edit `.quetrex/dependency-graph.yml` to define:
- **Batches**: Sequential execution phases
- **Issues**: Individual tasks with dependencies
- **Dependencies**: Hard, soft, blocking, and conflict relationships

### 2. Check if Issue Can Start

Before starting work on an issue:

```bash
python .quetrex/scripts/check-dependencies.py --issue 45
```

Output:
```
✅ Issue 45 can start
```

Or if blocked:
```
❌ Issue 45 blocked: Blocked by issue #12 (dependency not complete)
```

### 3. Update Progress After Merge

After PR merge:

```bash
python .quetrex/scripts/update-progress.py \
  --issue 45 \
  --status complete \
  --pr-url https://github.com/user/repo/pull/123
```

Output:
```
✅ Issue #45 marked complete
🎯 Issues now ready to start: [50, 51]

Batch batch_3 (UI Components) progress:
  35/60 issues complete (58.3%)
```

---

## Dependency Types

### Hard Dependencies (`depends_on`)

**MUST complete before this issue can start.**

```yaml
- id: 45
  depends_on: [12, 15]  # Needs Project API (#12) and Auth (#15)
```

**Use cases:**
- API must exist before UI component
- Database schema before CRUD operations
- Authentication before protected routes

### Soft Dependencies (`soft_depends_on`)

**SHOULD complete first, but not blocking.**

```yaml
- id: 45
  soft_depends_on: [3]  # Better with auth middleware, but optional
```

**Use cases:**
- Middleware that will be added later
- Optional integrations
- Nice-to-have features

**Behavior:**
- Issue can start even if soft dependency incomplete
- Warning displayed (but not blocking)

### Blocks (`blocks`)

**This issue blocks other issues (reverse dependency).**

```yaml
- id: 12
  blocks: [45, 46]  # ProjectCard components need this API
```

**Use cases:**
- Visibility (which issues depend on this)
- Impact analysis (what breaks if this fails)

**Behavior:**
- Automatically computed from `depends_on`
- Can be explicit for clarity

### Conflicts (`conflicts_with`)

**Cannot run in parallel (file-level conflicts).**

```yaml
- id: 45
  conflicts_with: [46]  # Both modify ProjectCard.tsx
  files:
    - "src/components/ProjectCard.tsx"

- id: 46
  conflicts_with: [45]
  files:
    - "src/components/ProjectCard.tsx"  # Same file
```

**Use cases:**
- Same file modifications
- Refactoring operations
- Breaking changes

**Behavior:**
- If one issue in progress, other is blocked
- Will execute sequentially

---

## Batch Management

Batches organize issues into sequential execution phases.

### Example: 4-Batch Architecture

```yaml
batches:
  batch_1:
    name: "Foundation"
    parallel_limit: 10
    issues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    dependencies: []  # Start immediately

  batch_2:
    name: "Core APIs"
    parallel_limit: 15
    issues: [11, 12, 13, ..., 25]
    dependencies:
      all_from_batch: [1]  # ALL of batch_1 must complete

  batch_3:
    name: "UI Components"
    parallel_limit: 20
    issues: [26, 27, 28, ..., 45]
    dependencies:
      all_from_batch: [2]  # ALL of batch_2 must complete

  batch_4:
    name: "Advanced Features"
    parallel_limit: 15
    issues: [46, 47, 48, ..., 60]
    dependencies:
      all_from_batch: [3]
```

### Parallel Limits

**Why limit parallelism?**
- **Resource constraints** (GitHub Actions minutes)
- **API rate limits** (Anthropic API)
- **Merge conflict risk** (too many simultaneous PRs)
- **Review capacity** (human bottleneck)

**Recommended limits:**
- Foundation: 10 issues (simple, fast)
- Core APIs: 15 issues (medium complexity)
- UI Components: 20 issues (highly parallelizable)
- Integrations: 10 issues (complex, needs review)

---

## CLI Reference

### check-dependencies.py

**Pre-issue validation script**

```bash
# Basic check
python .quetrex/scripts/check-dependencies.py --issue 45

# Verbose mode (detailed information)
python .quetrex/scripts/check-dependencies.py --issue 45 --verbose

# Custom project root
python .quetrex/scripts/check-dependencies.py \
  --issue 45 \
  --project-root /path/to/project
```

**Exit codes:**
- `0` - Issue can start
- `1` - Issue is blocked

**Use in GitHub Actions:**

```yaml
- name: Check Dependencies
  run: |
    python .quetrex/scripts/check-dependencies.py \
      --issue ${{ github.event.issue.number }}
```

### update-progress.py

**Post-merge progress updates**

```bash
# Mark issue complete
python .quetrex/scripts/update-progress.py \
  --issue 45 \
  --status complete \
  --pr-url https://github.com/user/repo/pull/123

# Mark issue in progress
python .quetrex/scripts/update-progress.py \
  --issue 45 \
  --status in_progress

# Mark issue failed
python .quetrex/scripts/update-progress.py \
  --issue 45 \
  --status failed \
  --reason "Tests failed with 67% coverage (need 75%)"

# Verbose mode
python .quetrex/scripts/update-progress.py \
  --issue 45 \
  --status complete \
  --verbose
```

**Exit codes:**
- `0` - Success
- `1` - Error

**Use in GitHub Actions:**

```yaml
- name: Update Progress
  if: github.event.pull_request.merged == true
  run: |
    python .quetrex/scripts/update-progress.py \
      --issue ${{ github.event.issue.number }} \
      --status complete \
      --pr-url ${{ github.event.pull_request.html_url }} \
      --verbose
```

### dependency-manager.py

**Core library (also has CLI for testing)**

```bash
# Check if issue can start
python .quetrex/scripts/dependency-manager.py --check 45

# Show blocked issues
python .quetrex/scripts/dependency-manager.py --blocked

# Show ready issues
python .quetrex/scripts/dependency-manager.py --ready

# Show ready issues in specific batch
python .quetrex/scripts/dependency-manager.py --ready --batch batch_2

# Check conflicts for issue
python .quetrex/scripts/dependency-manager.py --conflicts 45

# Show progress summary
python .quetrex/scripts/dependency-manager.py --progress
```

**Example output:**

```
Bookmark Manager SaaS Progress
==================================================
Total issues: 250
Complete: 98 (39.2%)
In progress: 15 (6.0%)
Blocked: 45 (18.0%)
Pending: 92 (36.8%)

Batches:
  ✅ Foundation: 20/20
  ✅ Core APIs: 43/43
  🔄 UI Components: 35/60
  ⏸️  Advanced Features: 0/45
```

---

## GitHub Actions Integration

### Workflow: Check Dependencies Before Starting

```yaml
name: AI Agent Issue Handler

on:
  issues:
    types: [labeled]

jobs:
  check-dependencies:
    if: contains(github.event.issue.labels.*.name, 'ai-feature')
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install pyyaml python-dotenv

      - name: Check Dependencies
        id: check_deps
        run: |
          python .quetrex/scripts/check-dependencies.py \
            --issue ${{ github.event.issue.number }} \
            --verbose

      - name: Comment if Blocked
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ This issue is blocked by dependencies. Check logs for details.'
            })

      - name: Execute Agent
        if: success()
        run: |
          # Your agent execution logic here
          docker run --rm quetrex-agent ...
```

### Workflow: Update Progress After Merge

```yaml
name: Update Progress on Merge

on:
  pull_request:
    types: [closed]

jobs:
  update-progress:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install pyyaml python-dotenv

      - name: Extract Issue Number
        id: extract_issue
        run: |
          # Extract issue number from PR title or branch name
          ISSUE_NUM=$(echo "${{ github.event.pull_request.title }}" | grep -oP '#\K\d+' || echo "")
          echo "issue_number=$ISSUE_NUM" >> $GITHUB_OUTPUT

      - name: Update Progress
        if: steps.extract_issue.outputs.issue_number != ''
        run: |
          python .quetrex/scripts/update-progress.py \
            --issue ${{ steps.extract_issue.outputs.issue_number }} \
            --status complete \
            --pr-url ${{ github.event.pull_request.html_url }} \
            --verbose

      - name: Trigger Next Issues
        run: |
          # Check for newly ready issues
          READY=$(python .quetrex/scripts/dependency-manager.py --ready)
          echo "Ready issues: $READY"
          # Optionally: Create issues or trigger workflows for ready issues
```

---

## Progress Tracking

### progress.json Format

Auto-generated file tracking runtime state:

```json
{
  "project": "Bookmark Manager SaaS",
  "started_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T15:30:00Z",
  "issues": {
    "45": {
      "status": "complete",
      "started_at": "2025-11-17T14:00:00Z",
      "completed_at": "2025-11-17T15:30:00Z",
      "pr_url": "https://github.com/user/repo/pull/123"
    },
    "46": {
      "status": "in_progress",
      "started_at": "2025-11-17T15:00:00Z",
      "completed_at": null,
      "pr_url": null
    }
  },
  "batches": {
    "batch_1": {
      "status": "complete",
      "completed_at": "2025-11-17T12:00:00Z",
      "issues_count": 20
    },
    "batch_2": {
      "status": "complete",
      "completed_at": "2025-11-17T14:30:00Z",
      "issues_count": 43
    }
  }
}
```

**This file is:**
- Auto-generated (created on first run if missing)
- Updated by `update-progress.py`
- Read by `dependency-manager.py` and `check-dependencies.py`
- **DO NOT** commit to git (add to `.gitignore`)

---

## Conflict Resolution

### Automatic Strategies

The dependency manager supports automatic conflict resolution:

#### 1. Sequential Execution

```python
manager.resolve_conflict("sequential", [45, 46])
```

**Behavior:**
- Execute issues one at a time
- Order by dependency depth (fewer dependencies first)

**Use when:**
- Same file conflicts
- Cannot partition work

#### 2. File Partitioning

```python
manager.resolve_conflict("partition", [45, 46])
```

**Behavior:**
- Check if files can be cleanly partitioned
- If yes, allow parallel execution
- If no, fall back to sequential

**Use when:**
- Issues touch different sections of same file
- Conflicts are minimal

#### 3. Human Escalation

```python
manager.resolve_conflict("human", [45, 46])
```

**Behavior:**
- Escalate to human for decision
- Comment on GitHub issue
- Wait for human resolution

**Use when:**
- Complex refactoring
- Breaking changes
- Strategic decisions needed

### Conflict Detection

Conflicts detected by:
1. **Explicit relationships** (`conflicts_with` field)
2. **File overlap** (same files in `files` list)

Example:
```yaml
- id: 45
  files:
    - "src/components/ProjectCard.tsx"
    - "src/components/ProjectCard.test.tsx"

- id: 46
  files:
    - "src/components/ProjectCard.tsx"  # CONFLICT!
    - "src/components/ProjectCardActions.tsx"
```

**Result:** Issues 45 and 46 cannot run in parallel.

---

## Best Practices

### 1. Design Batches for Parallelism

**Good:**
```yaml
batch_1:
  name: "Foundation"
  issues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]  # All independent
```

**Bad:**
```yaml
batch_1:
  name: "Foundation"
  issues: [1, 2, 3]
  # Issue 2 depends on 1, Issue 3 depends on 2
  # No parallelism!
```

### 2. Use Soft Dependencies Wisely

**Good:**
```yaml
- id: 45
  depends_on: [12]       # MUST have API
  soft_depends_on: [3]   # Auth nice-to-have
```

**Bad:**
```yaml
- id: 45
  soft_depends_on: [12]  # API is critical, not soft!
```

### 3. Explicit Conflict Relationships

**Good:**
```yaml
- id: 45
  conflicts_with: [46]
  files: ["src/components/ProjectCard.tsx"]

- id: 46
  conflicts_with: [45]
  files: ["src/components/ProjectCard.tsx"]
```

**Why:** Makes conflicts visible in both directions.

### 4. Conservative Parallel Limits

Start with lower limits and increase:
```yaml
batch_1:
  parallel_limit: 5   # Start conservative
  # Increase after observing performance
```

### 5. Document File Dependencies

```yaml
- id: 45
  files:
    - "src/components/ProjectCard.tsx"      # Component
    - "src/components/ProjectCard.test.tsx" # Tests
    - "src/components/index.ts"             # Exports
```

**Why:**
- Conflict detection works correctly
- Visibility into scope
- Impact analysis

---

## Troubleshooting

### Issue Stuck in "Blocked" State

**Check dependencies:**
```bash
python .quetrex/scripts/check-dependencies.py --issue 45 --verbose
```

**Common causes:**
- Hard dependency not complete
- In-progress issue conflicts
- Batch parallel limit reached

**Solution:**
- Wait for dependency to complete
- Check progress of blocking issue
- Increase batch parallel limit if appropriate

### Progress Not Updating

**Check progress.json exists:**
```bash
ls -la .quetrex/progress.json
```

**If missing:**
- Will be auto-created on first `check-dependencies.py` run
- Or create manually from template

**Validate format:**
```bash
python -m json.tool .quetrex/progress.json
```

### Conflicts Not Detected

**Check file lists:**
```bash
python .quetrex/scripts/dependency-manager.py --conflicts 45
```

**Common causes:**
- Files not listed in `dependency-graph.yml`
- File paths don't match exactly

**Solution:**
- Add all modified files to issue definition
- Use consistent path format (relative to project root)

---

## Requirements

### Python Dependencies

```bash
pip install pyyaml python-dotenv
```

### File Structure

```
.quetrex/
├── dependency-graph.yml       # Required
└── progress.json              # Auto-generated
```

---

## Architecture Decisions

### Why YAML for Dependencies?

**Pros:**
- Human-readable and editable
- Comments support (document decisions)
- Git-friendly (easy to diff and review)
- Standard format (no custom syntax)

**Cons:**
- Requires manual updates
- No validation by default

**Decision:** YAML wins for human collaboration.

### Why JSON for Progress?

**Pros:**
- Machine-generated (no human edits)
- Fast parsing (Python native)
- Atomic updates (single file write)

**Cons:**
- Not human-readable (but use CLI for viewing)

**Decision:** JSON wins for runtime state.

### Why Not Database?

**Pros of files:**
- No infrastructure required
- Git-friendly (version controlled)
- Simple deployment
- Easy debugging (cat file)

**Cons of files:**
- Concurrency challenges (multiple agents)
- No transactions

**Decision:** Files adequate for current scale. Migrate to database if >1000 issues or high concurrency.

---

## Future Enhancements

### 1. Automatic Dependency Inference

Use Meta-Orchestrator to automatically detect:
- File dependencies (API files → UI files)
- Import relationships (uses X → depends on X)
- Database schema dependencies

### 2. Conflict Prediction

Analyze code changes to predict conflicts:
- Same function modifications
- Overlapping refactorings
- Breaking changes

### 3. Dynamic Batch Sizing

Automatically adjust parallel limits based on:
- Resource availability
- Merge conflict rate
- Review capacity

### 4. Progress Visualization

Web dashboard showing:
- Dependency graph visualization
- Real-time progress
- Blocked issue alerts
- Estimated completion time

---

## See Also

- [HANDOVER-2025-11-17-QUETREX-COMPLETE-VISION.md](../../HANDOVER-2025-11-17-QUETREX-COMPLETE-VISION.md) - Complete Quetrex vision
- [.quetrex/dependency-graph.example.yml](../dependency-graph.example.yml) - Example dependency graph
- [GitHub Actions Workflows](../../.github/workflows/) - Integration examples

---

**Last updated:** 2025-11-17
**Author:** Glen Barnhardt with Claude Code
**Part of:** Quetrex AI-Powered SaaS Factory
