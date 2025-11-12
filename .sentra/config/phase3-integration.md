# Phase 3 Integration Guide

This document explains how Phase 3 integrates with Phases 1 and 2 of the Architecture Intelligence System.

## Architecture Overview

```
PHASE 1 (Documenter)           PHASE 2 (Enforcer)              PHASE 3 (Evolver)
└─ patterns.md          ─────▶  └─ PreToolUse hooks     ─────▶  └─ Pattern Learner
└─ architecture-scanner        └─ PostToolUse hooks            └─ Auto-Refactor
└─ architecture-advisor        └─ Pattern-aware agents         └─ Metrics Collector
                               └─ CI/CD enforcement            └─ Dashboard Generator
                                                               └─ Pattern Evolution
                                                               └─ Cross-Project Sync
```

## Integration Points

### 1. Pattern Learning → patterns.md

**Flow:**
1. Pattern Learner analyzes codebase
2. Discovers undocumented patterns
3. Proposes patterns to user
4. On approval, updates `.sentra/memory/patterns.md`
5. Architecture scanner automatically picks up new patterns

**Files involved:**
- `.sentra/agents/pattern-learner.md` (Phase 3)
- `.sentra/memory/patterns.md` (Phase 1)
- `.claude/scripts/architecture-scanner.py` (Phase 1)

**Workflow:**
```bash
# User invokes pattern learner
@pattern-learner analyze codebase

# Pattern learner reads patterns.md to avoid duplicates
Read({ file_path: ".sentra/memory/patterns.md" })

# Discovers new patterns and proposes them
# User approves

# Pattern learner updates patterns.md
Edit({ file_path: ".sentra/memory/patterns.md", ... })

# Scanner automatically detects new patterns on next run
```

### 2. Auto-Refactor → Architecture Scanner

**Flow:**
1. Auto-refactor runs architecture scanner
2. Scanner detects violations
3. Auto-refactor fixes violations automatically
4. Runs tests to verify fixes
5. Commits if safe

**Files involved:**
- `.sentra/scripts/auto-refactor.py` (Phase 3)
- `.claude/scripts/architecture-scanner.py` (Phase 1)

**Workflow:**
```bash
# Auto-refactor calls scanner
python3 .claude/scripts/architecture-scanner.py . --format=json

# Parses violations
# Applies fixes based on risk level
# Tests after each fix
# Commits if successful
```

### 3. Metrics Collector → All Components

**Flow:**
1. Metrics collector reads from all Phase 1-2 outputs
2. Aggregates data into time-series
3. Dashboard visualizes trends

**Data sources:**
- Architecture scanner output (Phase 1)
- Test coverage reports (Phase 2)
- Git commit history (Phase 2)
- Auto-refactor logs (Phase 3)
- Pattern status (Phase 1)

### 4. Pattern Evolution → patterns.md

**Flow:**
1. Pattern evolution tracks pattern health
2. Detects patterns needing updates
3. Proposes pattern changes
4. Updates patterns.md with versions
5. Creates migration guides

**Versioning:**
```markdown
## Pattern: Example Pattern

**Version:** 2.0.0 (was 1.0.0)
**Last Updated:** 2025-11-12
**Change:** Improved error handling approach
**Migration Guide:** docs/migrations/example-v1-to-v2.md
```

### 5. Enforcement Hooks → Auto-Refactor

**Flow:**
1. PreToolUse hook detects violation before code written
2. Blocks the operation
3. Auto-refactor could fix it automatically
4. Next attempt passes hook validation

**Example:**
```python
# User tries to write code with 'any' type
Write({ content: "function foo(x: any)" })

# PreToolUse hook blocks it
# validate-architecture-intent.py returns continue: false

# Auto-refactor fixes it
auto-refactor.py --pattern=typescript_any

# User tries again
Write({ content: "function foo(x: unknown)" })

# PreToolUse hook allows it
```

## Unified Workflow

### Scenario: New Feature Development

**Phase 1 - Before coding:**
1. Developer checks patterns.md for relevant patterns
2. If uncertain, asks @architecture-advisor

**Phase 2 - During coding:**
1. PreToolUse hooks validate architectural intent
2. PostToolUse hooks validate actual changes
3. Pattern-aware agents follow documented patterns

**Phase 3 - After coding:**
1. Metrics collector captures quality metrics
2. Pattern learner detects new successful patterns
3. Auto-refactor fixes any violations automatically
4. Dashboard shows impact on architectural health

### Scenario: Legacy Code Cleanup

**Phase 1:**
1. Run architecture scanner: `python3 .claude/scripts/architecture-scanner.py .`
2. Identify violations

**Phase 2:**
1. Hooks would block new violations
2. Existing violations remain

**Phase 3:**
1. Auto-refactor fixes violations automatically: `python3 .sentra/scripts/auto-refactor.py --risk=low`
2. Metrics track cleanup progress
3. Dashboard shows debt reduction

## Configuration

### Enable/Disable Phase 3 Features

```bash
# .env
PHASE3_AUTO_REFACTOR_ENABLED=true
PHASE3_PATTERN_LEARNING_ENABLED=true
PHASE3_METRICS_ENABLED=true
```

### Adjust Risk Tolerance

```json
// .sentra/config/auto-refactor.json
{
  "risk_levels": {
    "low": { "auto_commit": true },
    "medium": { "auto_commit": false, "require_approval": true },
    "high": { "require_approval": true }
  }
}
```

## Testing Integration

### Test Phase 3 with Phase 1/2

```bash
# 1. Run scanner (Phase 1)
python3 .claude/scripts/architecture-scanner.py . --format=json

# 2. Verify hooks work (Phase 2)
# Try to write code with violations - should be blocked

# 3. Run auto-refactor (Phase 3)
python3 .sentra/scripts/auto-refactor.py --dry-run

# 4. Collect metrics (Phase 3)
python3 .sentra/scripts/metrics-collector.py

# 5. Generate dashboard (Phase 3)
python3 .sentra/scripts/dashboard-generator.py
open .sentra/metrics/dashboard.html
```

## Troubleshooting

### Pattern learner not detecting patterns

**Issue:** Pattern learner doesn't find patterns you know exist

**Solution:**
- Check test coverage: Pattern learner only analyzes files with 75%+ coverage
- Check consistency: Need 3+ instances of pattern
- Check recency: Pattern must be used in last 6 months

### Auto-refactor not fixing violations

**Issue:** Auto-refactor reports violations but doesn't fix them

**Solution:**
- Check risk level: `--risk=low` only fixes safe violations
- Check fix strategy: Some patterns require manual intervention
- Check tests: If tests fail, refactoring is rolled back

### Metrics showing stale data

**Issue:** Dashboard shows old metrics

**Solution:**
- Run metrics collector: `python3 .sentra/scripts/metrics-collector.py`
- Regenerate dashboard: `python3 .sentra/scripts/dashboard-generator.py`
- Check cron jobs are running

### Hooks blocking Phase 3 operations

**Issue:** Phase 3 scripts can't write files due to hooks

**Solution:**
Phase 3 scripts should bypass hooks or run outside hook context. Use:
- Direct file I/O (not Write/Edit tools)
- Run as cron jobs (not in Claude Code session)
- Configure hooks to allow Phase 3 operations

## Migration from Phases 1-2

If you have Phases 1-2 already deployed:

### Step 1: Install Phase 3 Components

```bash
# All components are in .sentra/
# No changes to Phase 1-2 code required
```

### Step 2: Run Initial Metrics Collection

```bash
python3 .sentra/scripts/metrics-collector.py
python3 .sentra/scripts/dashboard-generator.py
```

### Step 3: Test Auto-Refactor (Dry Run)

```bash
python3 .sentra/scripts/auto-refactor.py --dry-run --risk=low
```

### Step 4: Enable Cron Jobs

```bash
crontab .sentra/config/crontab
```

### Step 5: Monitor Dashboard

```bash
open .sentra/metrics/dashboard.html
```

## Best Practices

### DO:

- Run metrics collector weekly minimum
- Review dashboard before sprint planning
- Let auto-refactor fix low-risk violations automatically
- Manually review medium/high-risk refactorings
- Update patterns.md when team approaches change

### DON'T:

- Run auto-refactor on code being actively developed
- Skip testing after auto-refactoring
- Ignore dashboard warnings
- Disable hooks to bypass enforcement
- Let technical debt accumulate (use auto-refactor!)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Part of:** Phase 3 - The Evolver
