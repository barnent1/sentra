# Git Hooks for Sentra

This directory contains Git hooks that enforce quality standards before pushing code.

## Available Hooks

### Pre-Push Hook

Runs quality checks before allowing push to remote repository.

**Checks performed:**
- ✅ TypeScript type checking (strict mode)
- ✅ ESLint validation (0 errors, 0 warnings)
- ✅ Test suite (all tests must pass)
- ✅ Coverage reporting (warns if below 75%)
- ✅ Build verification

## Installation

### Automatic Installation (Recommended)

Run the installation script:

```bash
# From project root
./scripts/git-hooks/install.sh
```

This will:
1. Copy `pre-push` to `.git/hooks/pre-push`
2. Make it executable
3. Confirm installation

### Manual Installation

```bash
# From project root
cp scripts/git-hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

## Usage

Once installed, the pre-push hook runs automatically before every `git push`:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"

# Hook runs automatically on push
git push origin feature-branch

# Output:
# 🔍 Running pre-push quality checks...
#
# → TypeScript type checking...
# ✅ TypeScript type checking passed
# → ESLint validation...
# ✅ ESLint validation passed
# → Test suite...
# ✅ Test suite passed
# → Checking coverage...
# ✅ Coverage: 87.45%
# → Build verification...
# ✅ Build verification passed
#
# ✅ All pre-push checks PASSED!
```

## Bypassing the Hook

**WARNING: Not recommended!** Only use in emergencies.

```bash
# Skip the pre-push hook
git push --no-verify
```

**Important:** Even if you bypass the local hook, CI/CD will still enforce all quality checks on GitHub. Your PR will fail if checks don't pass.

## Troubleshooting

### Hook not running

Check if the hook is installed and executable:

```bash
ls -la .git/hooks/pre-push

# Should show:
# -rwxr-xr-x  1 user  staff  2847 Nov 13 12:00 .git/hooks/pre-push
```

If not executable:

```bash
chmod +x .git/hooks/pre-push
```

### Checks failing locally

Run checks individually to see detailed errors:

```bash
npm run type-check    # TypeScript
npm run lint          # ESLint
npm run test:run      # Tests
npm run test:coverage # Coverage
npm run build         # Build
```

### Hook running but git push fails

The hook is working correctly! Fix the issues shown in the error output before pushing.

## Uninstallation

To remove the pre-push hook:

```bash
rm .git/hooks/pre-push
```

## CI/CD Integration

The pre-push hook mirrors the checks performed by the CI/CD pipeline:

**Local (Pre-Push Hook):**
- Fast feedback before code reaches GitHub
- Catches issues in ~30-60 seconds
- Can be bypassed (but shouldn't be)

**Remote (CI/CD Quality Gate):**
- Enforced on all PRs (cannot be bypassed)
- Full test suite + E2E tests
- Rust checks (format, clippy, tests, build)
- Security audit
- Detailed coverage reports with PR comments

See `.github/workflows/quality-gate.yml` for the complete CI/CD configuration.

## Why Use This Hook?

**Benefits:**
1. **Faster feedback** - Catch issues in seconds instead of waiting for CI/CD
2. **Save CI/CD minutes** - Don't push code that will fail anyway
3. **Better commits** - Ensure every commit meets quality standards
4. **Reduced context switching** - Fix issues immediately instead of after push

**Philosophy:**

> "Make it hard to do the wrong thing, easy to do the right thing."

The pre-push hook makes it easy to verify quality before pushing, reducing the friction of maintaining high standards.

---

Created by Glen Barnhardt with help from Claude Code
