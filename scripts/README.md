# Quetrex Scripts

Automation scripts for development, building, and releasing Quetrex.

Created by Glen Barnhardt with help from Claude Code

---

## Version Management

### bump-version.sh

Automated version bumping script that updates all version references across the project.

**Usage:**
```bash
./scripts/bump-version.sh [major|minor|patch|VERSION]

# Or use npm scripts:
npm run version:patch   # 1.0.0 → 1.0.1
npm run version:minor   # 1.0.0 → 1.1.0
npm run version:major   # 1.0.0 → 2.0.0
npm run release:prepare 1.2.3  # Set to specific version
```

**What it does:**
1. Verifies git working directory is clean
2. Gets current version from `package.json`
3. Calculates new version based on bump type
4. Updates version in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
   - `CHANGELOG.md` (creates or updates)
5. Updates `package-lock.json`
6. Creates git commit with standardized message
7. Creates annotated git tag (e.g., `v1.0.1`)
8. Displays next steps

**Requirements:**
- `jq` command-line JSON processor
  ```bash
  # macOS
  brew install jq

  # Linux
  sudo apt-get install jq

  # Windows
  choco install jq
  ```

**Examples:**

```bash
# Patch release (bug fixes)
./scripts/bump-version.sh patch
# 1.0.0 → 1.0.1

# Minor release (new features)
./scripts/bump-version.sh minor
# 1.0.0 → 1.1.0

# Major release (breaking changes)
./scripts/bump-version.sh major
# 1.0.0 → 2.0.0

# Specific version
./scripts/bump-version.sh 2.1.5
# Sets to 2.1.5 exactly
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUCCESS: Version bump complete!

  Old version: 1.0.0
  New version: 1.0.1
  Git tag:     v1.0.1

Next steps:

  1. Review the changes:
     git show HEAD

  2. Push to remote:
     git push origin main

  3. Push the tag to trigger release workflow:
     git push origin v1.0.1

  4. Monitor the release workflow:
     https://github.com/barnent1/quetrex/actions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Safety Features:**
- ✅ Verifies git working directory is clean before proceeding
- ✅ Validates version format (semantic versioning)
- ✅ Prompts for confirmation before making changes
- ✅ Atomic operations - all files updated together
- ✅ Creates git commit + tag in one operation

**Error Handling:**
- Exits if git working directory has uncommitted changes
- Validates version format matches semver (X.Y.Z)
- Checks for required tools (jq, git)
- Prevents overwriting existing tags

---

## Git Hooks

Git hooks for quality enforcement (located in `scripts/git-hooks/`):

### pre-push

Runs before `git push` to enforce quality gates:
- TypeScript type checking
- ESLint validation
- Test suite execution
- Build verification

**Install:**
```bash
./scripts/git-hooks/install.sh
```

**Bypass (not recommended):**
```bash
git push --no-verify  # ⚠️ BLOCKED by Claude Code hooks
```

---

## Build Scripts

See `package.json` for all available build scripts:

```bash
# Platform-specific builds
npm run build:mac          # macOS Universal (Intel + ARM)
npm run build:mac:x64      # macOS Intel only
npm run build:mac:arm64    # macOS Apple Silicon only
npm run build:windows      # Windows 64-bit
npm run build:linux        # Linux (AppImage + .deb)
npm run build:all          # All platforms (requires toolchains)

# Development
npm run dev                # Next.js dev server
npm run tauri:dev          # Tauri dev mode
npm run build              # Production frontend build
npm run tauri:build        # Tauri production build

# Quality
npm run type-check         # TypeScript compilation check
npm run lint               # ESLint
npm run test               # Vitest (watch mode)
npm run test:run           # Vitest (single run)
npm run test:coverage      # Coverage report
npm run test:e2e           # Playwright E2E tests

# Database
npm run db:migrate         # Run Prisma migrations
npm run db:seed            # Seed database
npm run db:reset           # Reset database (dev only)
```

---

## CI/CD Scripts

Automated workflows in `.github/workflows/`:

### release.yml
Multi-platform build and release workflow triggered by version tags.

**Trigger:**
```bash
git push origin v1.0.1
```

**Jobs:**
1. Quality gate (type-check, lint, test, coverage, build)
2. Build macOS (Universal binary)
3. Build Windows (64-bit installer)
4. Build Linux (AppImage + .deb)
5. Create GitHub release with artifacts

### quality-gate.yml
Runs on PRs and pushes to main/develop branches.

**Checks:**
- TypeScript type checking
- ESLint (0 errors, 0 warnings)
- Test suite (all passing)
- Coverage (≥75% overall)
- Rust checks (format, clippy, tests)
- E2E tests

---

## Development Workflow

**Daily Development:**
```bash
# Start dev server
npm run dev

# In another terminal, start Tauri
npm run tauri:dev

# Run tests in watch mode
npm run test
```

**Before Committing:**
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Test
npm run test:run

# E2E tests
npm run test:e2e
```

**Creating a Release:**
```bash
# 1. Bump version
npm run version:patch

# 2. Push commit
git push origin main

# 3. Push tag (triggers release)
git push origin v$(jq -r .version package.json)

# 4. Monitor
open https://github.com/barnent1/quetrex/actions
```

---

## Troubleshooting

### Permission Denied

```bash
chmod +x scripts/bump-version.sh
chmod +x scripts/git-hooks/install.sh
```

### jq Not Found

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
choco install jq
```

### Git Not Clean

```bash
git status
git add .
git commit -m "Your message"
# Then retry script
```

---

## Documentation

- [Release Process](../docs/RELEASE-PROCESS.md) - Complete release documentation
- [Release Quickstart](../docs/RELEASE-QUICKSTART.md) - Fast reference guide
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines
- [CHANGELOG](../CHANGELOG.md) - Version history

---

**Last updated:** 2025-11-13
**Maintained by:** Glen Barnhardt with help from Claude Code
