# Phase 3 Testing Strategy

This document outlines how to test and validate Phase 3: The Evolver components.

## Overview

Phase 3 introduces automation that modifies code. Testing is critical to ensure:
- No bugs are introduced by auto-refactoring
- Pattern learning is accurate
- Metrics are correct
- Dashboard reflects reality

## Component Testing

### 1. Pattern Learner Agent

**Test Scenarios:**

#### Test 1: Discover Consistent Patterns
```bash
# Setup: Create 3+ files with same pattern
mkdir -p test-patterns
cat > test-patterns/useAsync1.ts << 'EOF'
export function useAsyncOperation<T>(fn: () => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  // ... consistent implementation
}
EOF

# Copy pattern to 2 more files
cp test-patterns/useAsync1.ts test-patterns/useAsync2.ts
cp test-patterns/useAsync1.ts test-patterns/useAsync3.ts

# Test: Pattern learner should discover this
@pattern-learner analyze test-patterns

# Expected: Proposes "Custom Hook: useAsyncOperation" pattern
# Verify: Check that pattern is proposed
```

#### Test 2: Ignore Low-Quality Code
```bash
# Setup: Create file with < 75% coverage
# No test file for it

# Test: Pattern learner should ignore it
@pattern-learner analyze codebase

# Expected: Pattern NOT proposed
# Verify: Only high-quality patterns proposed
```

#### Test 3: Avoid Duplicate Patterns
```bash
# Setup: Pattern already exists in patterns.md

# Test: Pattern learner should detect duplicate
@pattern-learner analyze codebase

# Expected: "Pattern already documented as..."
# Verify: No duplicate patterns created
```

**Validation:**
- ✅ Only patterns with 3+ instances proposed
- ✅ Only patterns with 75%+ coverage proposed
- ✅ No duplicate patterns created
- ✅ Pattern documentation follows template

---

### 2. Auto-Refactor Engine

**Test Scenarios:**

#### Test 1: Fix TypeScript 'any' (LOW risk)
```bash
# Setup: Create file with 'any' type
cat > test-refactor/example.ts << 'EOF'
function processData(data: any) {
  return data.map((item: any) => item.value);
}
EOF

# Test: Auto-refactor should fix it
python3 .quetrex/scripts/auto-refactor.py --dry-run --pattern=typescript_any

# Expected: Changes 'any' to 'unknown'
# Verify: Dry-run shows expected changes

# Test: Apply fix
python3 .quetrex/scripts/auto-refactor.py --pattern=typescript_any

# Verify: File updated, tests pass, coverage maintained
```

#### Test 2: Rollback on Test Failure
```bash
# Setup: Create file that will break tests when refactored
cat > test-refactor/breaking.ts << 'EOF'
export function calculate(x: any) {
  return x + 1;  // Intentionally relies on 'any'
}
EOF

# Setup: Test that will fail after refactoring
cat > test-refactor/breaking.test.ts << 'EOF'
test('calculate', () => {
  expect(calculate("5")).toBe("51");  // String concat, breaks with 'unknown'
});
EOF

# Test: Auto-refactor should rollback
python3 .quetrex/scripts/auto-refactor.py --pattern=typescript_any

# Expected: Refactoring attempted, tests fail, rollback
# Verify: File unchanged, error logged
```

#### Test 3: Honor Risk Levels
```bash
# Setup: File with HIGH-risk violation

# Test: LOW risk auto-refactor should skip it
python3 .quetrex/scripts/auto-refactor.py --risk=low

# Expected: Violation reported but not fixed
# Verify: File unchanged

# Test: HIGH risk auto-refactor should fix it
python3 .quetrex/scripts/auto-refactor.py --risk=high --interactive

# Expected: Prompts for approval
# Verify: Requires manual confirmation
```

**Validation:**
- ✅ Tests pass before and after refactoring
- ✅ Coverage does not decrease
- ✅ Rollback on test failure
- ✅ Risk levels honored
- ✅ Git commits created per file
- ✅ Max files limit respected

---

### 3. Metrics Collector

**Test Scenarios:**

#### Test 1: Collect All Metrics
```bash
# Test: Run collector
python3 .quetrex/scripts/metrics-collector.py

# Expected: All metrics collected
# Verify: Check .quetrex/metrics/history.json contains:
cat .quetrex/metrics/history.json | jq '.[0] | keys'

# Should include:
# - pattern_consistency_score
# - total_violations
# - overall_coverage
# - estimated_fix_hours
# - etc.
```

#### Test 2: Compare with Past
```bash
# Setup: Run collector twice, 1 day apart
python3 .quetrex/scripts/metrics-collector.py
# ... make some improvements ...
python3 .quetrex/scripts/metrics-collector.py

# Test: Compare metrics
python3 .quetrex/scripts/metrics-collector.py --compare=1d

# Expected: Shows improvement trends
# Verify: Metrics comparison displayed
```

#### Test 3: Handle Missing Data
```bash
# Setup: Delete scanner output
rm -rf /tmp/scanner-output.json

# Test: Collector should handle gracefully
python3 .quetrex/scripts/metrics-collector.py

# Expected: Defaults to 0 or skips unavailable metrics
# Verify: No crash, warning logged
```

**Validation:**
- ✅ All metrics collected successfully
- ✅ History appended to JSON file
- ✅ Timestamps accurate
- ✅ Git SHA captured
- ✅ Graceful error handling

---

### 4. Dashboard Generator

**Test Scenarios:**

#### Test 1: Generate Dashboard
```bash
# Setup: Run metrics collector first
python3 .quetrex/scripts/metrics-collector.py

# Test: Generate dashboard
python3 .quetrex/scripts/dashboard-generator.py

# Expected: HTML file created
# Verify: File exists and is valid HTML
[ -f .quetrex/metrics/dashboard.html ] && echo "✅ Dashboard created"

# Open in browser
open .quetrex/metrics/dashboard.html

# Verify:
# - Health score displayed
# - Charts render correctly
# - Metrics match history.json
```

#### Test 2: Handle Empty History
```bash
# Setup: Delete history
rm .quetrex/metrics/history.json

# Test: Try to generate dashboard
python3 .quetrex/scripts/dashboard-generator.py

# Expected: Error message, no crash
# Verify: Helpful error message
```

**Validation:**
- ✅ Valid HTML generated
- ✅ Charts render with data
- ✅ Health score calculated correctly
- ✅ All metrics displayed
- ✅ Responsive design works

---

## Integration Testing

### End-to-End Workflow Test

**Scenario: Complete Phase 3 Cycle**

```bash
# Step 1: Initial scan (Phase 1)
python3 .claude/scripts/architecture-scanner.py . --format=json > /tmp/scan1.json

# Step 2: Collect baseline metrics (Phase 3)
python3 .quetrex/scripts/metrics-collector.py

# Step 3: Introduce violations
cat > test-workflow/violation.ts << 'EOF'
function bad(x: any) {
  console.log(x);
  return x;
}
EOF

# Step 4: Scanner detects violations
python3 .claude/scripts/architecture-scanner.py . --format=json > /tmp/scan2.json

# Verify: More violations than before
violations_before=$(jq '.anti_patterns | map_values(length) | add' /tmp/scan1.json)
violations_after=$(jq '.anti_patterns | map_values(length) | add' /tmp/scan2.json)
[ "$violations_after" -gt "$violations_before" ] && echo "✅ Violations detected"

# Step 5: Auto-refactor fixes violations
python3 .quetrex/scripts/auto-refactor.py --risk=low --auto-commit

# Step 6: Scanner shows improvement
python3 .claude/scripts/architecture-scanner.py . --format=json > /tmp/scan3.json

violations_final=$(jq '.anti_patterns | map_values(length) | add' /tmp/scan3.json)
[ "$violations_final" -lt "$violations_after" ] && echo "✅ Violations fixed"

# Step 7: Metrics show improvement
python3 .quetrex/scripts/metrics-collector.py --compare=1d

# Step 8: Dashboard reflects changes
python3 .quetrex/scripts/dashboard-generator.py
open .quetrex/metrics/dashboard.html

# Verify:
# - Health score improved
# - Violations decreased
# - Auto-fixes recorded
```

---

## Safety Testing

### Test Rollback Mechanisms

**Test 1: Rollback on Test Failure**
```bash
# Setup: Create intentionally breaking refactoring
# (shown above in auto-refactor tests)

# Verify:
# 1. Original file content preserved
# 2. Git has no uncommitted changes
# 3. Error logged to .quetrex/metrics/audit.log
```

**Test 2: Rollback on Coverage Decrease**
```bash
# Setup: Delete tests for file being refactored
rm test-workflow/violation.test.ts

# Test: Auto-refactor should rollback
python3 .quetrex/scripts/auto-refactor.py

# Verify:
# - Coverage check fails
# - Refactoring rolled back
# - Warning logged
```

**Test 3: Max Files Limit**
```bash
# Setup: Create 20 files with violations

# Test: Auto-refactor with max 10
python3 .quetrex/scripts/auto-refactor.py --max-files=10

# Verify: Only 10 files refactored
```

---

## Performance Testing

### Test 1: Large Codebase Scanning
```bash
# Test: Scan large codebase
time python3 .claude/scripts/architecture-scanner.py .

# Expected: Completes in < 60 seconds for 1000 files
```

### Test 2: Metrics Collection Performance
```bash
# Test: Metrics collection speed
time python3 .quetrex/scripts/metrics-collector.py

# Expected: Completes in < 30 seconds
```

### Test 3: Dashboard Generation Performance
```bash
# Test: Dashboard generation speed
time python3 .quetrex/scripts/dashboard-generator.py

# Expected: Completes in < 5 seconds
```

---

## Regression Testing

### Automated Test Suite

Create `.quetrex/tests/phase3-tests.sh`:

```bash
#!/bin/bash
set -e

echo "🧪 Running Phase 3 Test Suite"

# Test 1: Pattern Learner
echo "Test 1: Pattern Learner..."
# TODO: Add pattern learner tests

# Test 2: Auto-Refactor
echo "Test 2: Auto-Refactor..."
python3 .quetrex/scripts/auto-refactor.py --dry-run --risk=low
echo "✅ Auto-refactor dry-run passed"

# Test 3: Metrics Collector
echo "Test 3: Metrics Collector..."
python3 .quetrex/scripts/metrics-collector.py
[ -f .quetrex/metrics/history.json ] && echo "✅ Metrics collected"

# Test 4: Dashboard Generator
echo "Test 4: Dashboard Generator..."
python3 .quetrex/scripts/dashboard-generator.py
[ -f .quetrex/metrics/dashboard.html ] && echo "✅ Dashboard generated"

echo "✅ All Phase 3 tests passed!"
```

Run with:
```bash
chmod +x .quetrex/tests/phase3-tests.sh
.quetrex/tests/phase3-tests.sh
```

---

## Continuous Integration

### GitHub Actions Workflow

Add to `.github/workflows/phase3-tests.yml`:

```yaml
name: Phase 3 Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 8 * * 1'  # Weekly Monday 8 AM

jobs:
  test-phase3:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          npm install
          pip install -r requirements.txt

      - name: Run architecture scanner
        run: python3 .claude/scripts/architecture-scanner.py . --format=json

      - name: Test auto-refactor (dry-run)
        run: python3 .quetrex/scripts/auto-refactor.py --dry-run --risk=low

      - name: Collect metrics
        run: python3 .quetrex/scripts/metrics-collector.py

      - name: Generate dashboard
        run: python3 .quetrex/scripts/dashboard-generator.py

      - name: Upload dashboard artifact
        uses: actions/upload-artifact@v3
        with:
          name: dashboard
          path: .quetrex/metrics/dashboard.html

      - name: Check health score
        run: |
          # Fail if health score < 60
          python3 -c "
          import json
          with open('.quetrex/metrics/history.json', 'r') as f:
              history = json.load(f)
              latest = history[-1]
              score = latest.get('overall_health_score', 0)
              if score < 60:
                  raise Exception(f'Health score too low: {score}')
              print(f'✅ Health score: {score}')
          "
```

---

## Manual Testing Checklist

Before releasing Phase 3:

- [ ] Pattern learner discovers valid patterns
- [ ] Pattern learner ignores low-quality code
- [ ] Auto-refactor fixes LOW-risk violations
- [ ] Auto-refactor requires approval for MEDIUM/HIGH
- [ ] Auto-refactor rolls back on test failure
- [ ] Auto-refactor rolls back on coverage drop
- [ ] Metrics collector captures all metrics
- [ ] Metrics collector handles missing data
- [ ] Dashboard generates valid HTML
- [ ] Dashboard charts render correctly
- [ ] Integration with Phase 1 scanner works
- [ ] Integration with Phase 2 hooks works
- [ ] Cron jobs run successfully
- [ ] Git commits created correctly
- [ ] Audit log records all operations
- [ ] Performance meets benchmarks
- [ ] Documentation is complete

---

## Known Issues & Limitations

### Current Limitations

1. **Pattern Learning Requires Manual Approval**
   - Patterns are proposed, not automatically adopted
   - Requires human judgment

2. **Auto-Refactor Limited to Simple Fixes**
   - Complex refactorings (SSE migration) need manual work
   - Some patterns require Claude Code agent

3. **Metrics Depend on External Tools**
   - Jest for coverage
   - Git for history
   - Scanner for violations

4. **Dashboard is Static HTML**
   - No real-time updates
   - Must regenerate to see new data

### Future Improvements

1. **ML-Based Pattern Learning**
   - Train model on successful patterns
   - Automatic pattern extraction

2. **Advanced Refactoring**
   - Use Claude Code agents for complex fixes
   - Interactive refactoring mode

3. **Real-Time Dashboard**
   - WebSocket updates
   - Live metrics

4. **Cross-Project Sync**
   - Share patterns across repositories
   - Organization-wide metrics

---

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Part of:** Phase 3 - The Evolver
