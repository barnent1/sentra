# Phase 3: Quick Start Guide

Get Phase 3 running in 10 minutes.

## Prerequisites

- Phases 1 and 2 already installed
- Python 3.8+ installed
- npm/Node.js installed (for tests)
- Git repository

## Installation (5 minutes)

### Step 1: Make scripts executable

```bash
chmod +x .sentra/scripts/*.py
```

### Step 2: Install cron jobs (optional)

```bash
# Preview cron jobs
cat .sentra/config/crontab

# Install (if you want automation)
crontab .sentra/config/crontab

# Verify installation
crontab -l
```

## First Run (5 minutes)

### Step 1: Collect baseline metrics

```bash
python3 .sentra/scripts/metrics-collector.py
```

Output:
```
📊 Collecting metrics...
✅ Metrics collected

📊 METRICS SUMMARY
==================
Health Score: 72/100
Pattern Consistency: 68.5%
Total Violations: 23
Test Coverage: 78.3%
Technical Debt: 12.5 hours
```

### Step 2: Generate dashboard

```bash
python3 .sentra/scripts/dashboard-generator.py
```

Output:
```
✅ Dashboard generated: .sentra/metrics/dashboard.html
Open with: open .sentra/metrics/dashboard.html
```

### Step 3: View dashboard

```bash
open .sentra/metrics/dashboard.html
```

You'll see:
- Overall health score (0-100)
- Pattern consistency trends
- Violation counts
- Technical debt estimation
- Refactoring activity

## First Auto-Refactor (Dry Run)

### Step 1: Preview changes

```bash
python3 .sentra/scripts/auto-refactor.py --dry-run --risk=low
```

Output:
```
🔧 AUTOMATIC REFACTORING ENGINE
Mode: DRY RUN
Risk Level: low
Max Files: 10

Step 1: Scanning for violations...
Found 12 violations at low risk level

Step 2: Getting baseline metrics...
✅ Tests passing, coverage: 78.3%

Step 3: Refactoring up to 10 files...

[1/10] src/components/Example.tsx
  Issue: TypeScript 'any' type used
  Risk: low
  ✅ Would fix: Change 'any' to 'unknown'

[2/10] src/utils/helper.ts
  Issue: @ts-ignore comment found
  Risk: low
  ✅ Would fix: Remove @ts-ignore

...

SUMMARY (DRY RUN)
Total files: 10
Would fix: 10
Estimated time saved: 1.0 hours
```

### Step 2: Apply fixes (if dry-run looks good)

```bash
python3 .sentra/scripts/auto-refactor.py --risk=low --auto-commit
```

Output:
```
🔧 AUTOMATIC REFACTORING ENGINE
Mode: LIVE
Risk Level: low

[1/10] src/components/Example.tsx
  Issue: TypeScript 'any' type used
  ✅ Fixed successfully
  Commit: a1b2c3d4

[2/10] src/utils/helper.ts
  Issue: @ts-ignore comment found
  ✅ Fixed successfully
  Commit: e5f6g7h8

...

REFACTORING SUMMARY
Total files processed: 10
✅ Successful: 10
❌ Failed: 0

⏱️  Estimated time saved: 1.0 hours
```

### Step 3: Verify changes

```bash
# Check git log
git log --oneline -5

# Run tests
npm test

# Collect new metrics
python3 .sentra/scripts/metrics-collector.py

# Regenerate dashboard
python3 .sentra/scripts/dashboard-generator.py

# View improvements
open .sentra/metrics/dashboard.html
```

## First Pattern Learning

### Invoke pattern learner agent

```bash
# In Claude Code
@pattern-learner analyze codebase for undocumented patterns
```

The agent will:
1. Scan your codebase
2. Find consistent patterns (3+ instances)
3. Check quality signals (test coverage, recency)
4. Propose patterns for standardization

Example output:
```
📚 PATTERN LEARNING RESULTS

Discovered 3 undocumented patterns:

1. Custom Hook: useAsyncOperation ⭐️ HIGH PRIORITY
   Found in: 12 files
   Test Coverage: 94%
   Recommendation: STANDARDIZE

   [Shows code example]

Shall I document this pattern? (y/n)
```

Approve patterns you want to standardize.

## Daily Workflow

### Morning

```bash
# Check dashboard
open .sentra/metrics/dashboard.html
```

### During work

- Phase 2 hooks enforce patterns automatically
- Write code as usual

### Evening

```bash
# Auto-fix violations
python3 .sentra/scripts/auto-refactor.py --risk=low --auto-commit
```

### Weekly

```bash
# Review metrics
python3 .sentra/scripts/metrics-collector.py --compare=7d

# Learn new patterns
@pattern-learner analyze codebase

# Review dashboard
open .sentra/metrics/dashboard.html
```

## Common Commands

```bash
# Auto-refactor
python3 .sentra/scripts/auto-refactor.py --dry-run           # Preview
python3 .sentra/scripts/auto-refactor.py --risk=low          # Fix low-risk
python3 .sentra/scripts/auto-refactor.py --interactive       # Approve each
python3 .sentra/scripts/auto-refactor.py --pattern=typescript_any  # Fix specific

# Metrics
python3 .sentra/scripts/metrics-collector.py                 # Collect
python3 .sentra/scripts/metrics-collector.py --compare=7d    # Compare
python3 .sentra/scripts/metrics-collector.py --export=out.json  # Export

# Dashboard
python3 .sentra/scripts/dashboard-generator.py               # Generate
open .sentra/metrics/dashboard.html                          # View

# Pattern Learning
@pattern-learner analyze codebase                            # Learn patterns
```

## Troubleshooting

### Tests fail during auto-refactor

**Solution:** Auto-refactor automatically rolls back. Fix tests first, then retry.

```bash
# Check which tests are failing
npm test

# Fix tests
# ...

# Retry auto-refactor
python3 .sentra/scripts/auto-refactor.py --risk=low
```

### Dashboard shows no data

**Solution:** Run metrics collector first.

```bash
python3 .sentra/scripts/metrics-collector.py
python3 .sentra/scripts/dashboard-generator.py
```

### Pattern learner finds nothing

**Solution:** Check test coverage. Pattern learner only analyzes code with 75%+ coverage.

```bash
# Check coverage
npm test -- --coverage

# Improve coverage for files you want patterns from
# Then re-run pattern learner
```

### Auto-refactor skips files

**Solution:** Check risk level. Low-risk only fixes simple violations.

```bash
# Try medium risk (with approval)
python3 .sentra/scripts/auto-refactor.py --risk=medium --interactive
```

## Configuration

### Adjust risk tolerance

Edit `.sentra/config/auto-refactor.json`:

```json
{
  "risk_levels": {
    "low": {
      "auto_commit": true  // Change to false for manual review
    }
  }
}
```

### Adjust cron schedule

Edit `.sentra/config/crontab`:

```cron
# Change from 2 AM to 11 PM
0 23 * * * cd /path/to/project && python3 .sentra/scripts/auto-refactor.py --risk=low
```

Re-install:
```bash
crontab .sentra/config/crontab
```

## What's Next?

### Week 1: Baseline & Quick Wins

- Establish baseline metrics
- Fix low-risk violations
- Learn existing patterns
- Get familiar with dashboard

### Weeks 2-4: Pattern Standardization

- Approve learned patterns
- Update patterns.md
- Run auto-refactor on MEDIUM risk
- Track improvements

### Month 2+: Full Automation

- Enable all cron jobs
- Regular pattern learning
- Continuous refactoring
- Architectural health maintained

## Getting Help

**Documentation:**
- Phase 3 Architecture: `.sentra/memory/PHASE_3_EVOLVER.md`
- Integration Guide: `.sentra/config/phase3-integration.md`
- Testing Strategy: `.sentra/config/testing-strategy.md`
- Complete README: `.sentra/README.md`

**AI Agents:**
- `@pattern-learner` - Learn patterns from code
- `@architecture-advisor` - Architecture advice
- `@refactoring-agent` - Help with refactoring

**Tools:**
- Auto-refactor: `.sentra/scripts/auto-refactor.py`
- Metrics: `.sentra/scripts/metrics-collector.py`
- Dashboard: `.sentra/scripts/dashboard-generator.py`

---

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Author:** Glen Barnhardt with help from Claude Code
