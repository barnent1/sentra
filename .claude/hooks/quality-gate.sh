#!/bin/bash
# .claude/hooks/quality-gate.sh
#
# Stop Hook: UNBYPASSABLE Quality Gate
#
# This hook runs when Claude tries to finish a conversation.
# Exit code 2 = BLOCKED (Claude CANNOT finish until all checks pass)
#
# Purpose: Ensure NO bugs are ever committed
# This is the final defense layer that prevents the 9-month bug pain.

set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  QUALITY GATE: Comprehensive validation before finishing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAILED=0
WARNINGS=0

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "ℹ️  Not a git repository - skipping quality gate"
    exit 0
fi

# Check if there are any changes
if ! git diff --quiet HEAD 2>/dev/null; then
    HAS_CHANGES=1
else
    HAS_CHANGES=0
fi

# If no changes, allow finishing
if [ $HAS_CHANGES -eq 0 ]; then
    echo "✅ No changes detected - quality gate passed"
    exit 0
fi

echo "📊 Changes detected - running comprehensive checks..."
echo ""

# ============================================================================
# 1. TypeScript Type Check
# ============================================================================
echo "→ [1/6] TypeScript type checking..."
if [ -f "tsconfig.json" ] && command -v npx > /dev/null; then
    if npx tsc --noEmit --skipLibCheck 2>&1 | tee /tmp/typecheck.log; then
        echo "   ✅ Type check passed"
    else
        echo "   ❌ Type check FAILED" >&2
        echo "" >&2
        echo "   Errors:" >&2
        tail -20 /tmp/typecheck.log >&2
        FAILED=1
    fi
else
    echo "   ⊘  Skipped (tsconfig.json or npx not found)"
fi
echo ""

# ============================================================================
# 2. ESLint Check
# ============================================================================
echo "→ [2/6] Running ESLint..."
if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
    if npm run lint 2>&1 | tee /tmp/lint.log; then
        echo "   ✅ Lint passed"
    else
        echo "   ❌ Lint FAILED" >&2
        FAILED=1
    fi
else
    echo "   ⊘  Skipped (no lint script found)"
fi
echo ""

# ============================================================================
# 3. Tests with Coverage
# ============================================================================
echo "→ [3/6] Running tests with coverage..."
if [ -f "package.json" ] && grep -q "\"test:coverage\"" package.json; then
    # Run tests with coverage using Vitest
    if npm run test:coverage 2>&1 | tee /tmp/test.log; then
        echo "   ✅ Tests passed"

        # Check coverage threshold
        if [ -f "coverage/coverage-summary.json" ]; then
            # Extract coverage percentage (requires jq)
            if command -v jq > /dev/null; then
                COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
                COVERAGE_INT=$(printf "%.0f" "$COVERAGE")

                echo "   📊 Coverage: ${COVERAGE_INT}%"

                if [ "$COVERAGE_INT" -lt 75 ]; then
                    echo "   ⚠️  Coverage below 75% (current: ${COVERAGE_INT}%)" >&2
                    WARNINGS=$((WARNINGS + 1))
                else
                    echo "   ✅ Coverage meets 75% threshold"
                fi
            else
                echo "   ⊘  Coverage check skipped (jq not installed)"
            fi
        else
            echo "   ⚠️  No coverage report found" >&2
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "   ❌ Tests FAILED" >&2
        echo "" >&2
        echo "   Last 20 lines of test output:" >&2
        tail -20 /tmp/test.log >&2
        FAILED=1
    fi
else
    echo "   ⊘  Skipped (no test:coverage script found)"
fi
echo ""

# ============================================================================
# 4. Build Check
# ============================================================================
echo "→ [4/6] Attempting build..."
if [ -f "package.json" ] && grep -q "\"build\"" package.json; then
    if npm run build 2>&1 | tee /tmp/build.log; then
        echo "   ✅ Build successful"
    else
        echo "   ❌ Build FAILED" >&2
        echo "" >&2
        echo "   Last 30 lines of build output:" >&2
        tail -30 /tmp/build.log >&2
        FAILED=1
    fi
else
    echo "   ⊘  Skipped (no build script found)"
fi
echo ""

# ============================================================================
# 5. Security Audit (Warnings Only)
# ============================================================================
echo "→ [5/6] Security audit..."
if [ -f "package.json" ] && command -v npm > /dev/null; then
    # Check for high/critical vulnerabilities only
    if npm audit --audit-level=high 2>&1 | tee /tmp/audit.log; then
        echo "   ✅ No high/critical vulnerabilities"
    else
        echo "   ⚠️  Security vulnerabilities found (review recommended)" >&2
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⊘  Skipped (npm not available)"
fi
echo ""

# ============================================================================
# 6. Git Status Check
# ============================================================================
echo "→ [6/6] Git status check..."

# Check for untracked critical files
UNTRACKED=$(git ls-files --others --exclude-standard)
if echo "$UNTRACKED" | grep -qE "\.(env|key|pem|p12)$"; then
    echo "   ⚠️  Untracked sensitive files detected:" >&2
    echo "$UNTRACKED" | grep -E "\.(env|key|pem|p12)$" >&2
    echo "   These should be added to .gitignore" >&2
    WARNINGS=$((WARNINGS + 1))
fi

# Check if we're on main/master with uncommitted changes
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    if [ $HAS_CHANGES -eq 1 ]; then
        echo "   ⚠️  Working directly on $CURRENT_BRANCH branch" >&2
        echo "   Consider creating a feature branch" >&2
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo "   ✅ Git status check complete"
echo ""

# ============================================================================
# Final Result
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo "✅ QUALITY GATE PASSED"
        echo ""
        echo "All checks passed successfully. Claude can finish."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 0
    else
        echo "✅ QUALITY GATE PASSED (with ${WARNINGS} warnings)"
        echo ""
        echo "All critical checks passed. Review warnings above."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 0
    fi
else
    echo "❌ QUALITY GATE FAILED"
    echo ""
    echo "Claude CANNOT finish until all checks pass."
    echo "Fix the issues above and try again."
    echo ""
    echo "This prevents bugs from being committed (the 9-month pain)."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 2  # Exit code 2 = BLOCKED
fi
