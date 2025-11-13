# Sentra Release Quickstart

**Fast reference for releasing Sentra - bookmark this page!**

Created by Glen Barnhardt with help from Claude Code

---

## TL;DR - Release in 3 Commands

```bash
# 1. Bump version (patch/minor/major)
npm run version:patch

# 2. Push commit
git push origin main

# 3. Push tag to trigger release
git push origin v$(jq -r .version package.json)
```

**Monitor:** https://github.com/barnent1/sentra/actions

---

## Version Scripts

```bash
# Patch release (1.0.0 → 1.0.1) - Bug fixes
npm run version:patch

# Minor release (1.0.0 → 1.1.0) - New features
npm run version:minor

# Major release (1.0.0 → 2.0.0) - Breaking changes
npm run version:major

# Specific version (e.g., 1.2.3)
npm run release:prepare 1.2.3
```

---

## Build Scripts

### Local Development Builds

```bash
# macOS (Universal - Intel + ARM)
npm run build:mac

# macOS (x64 only)
npm run build:mac:x64

# macOS (ARM64 only)
npm run build:mac:arm64

# Windows
npm run build:windows

# Linux
npm run build:linux

# All platforms (requires all toolchains)
npm run build:all
```

---

## Manual Release Process

### 1. Pre-Release Checks

```bash
# Run all quality checks
npm run type-check
npm run lint
npm test
npm run build

# Verify git is clean
git status
```

### 2. Version Bump

```bash
# Choose one:
./scripts/bump-version.sh patch
./scripts/bump-version.sh minor
./scripts/bump-version.sh major
./scripts/bump-version.sh 1.2.3

# Review changes
git show HEAD
```

### 3. Push to GitHub

```bash
# Push commit
git push origin main

# Push tag (triggers release workflow)
git push origin v1.0.1  # Replace with your version
```

### 4. Monitor Release

```bash
# Open GitHub Actions
open https://github.com/barnent1/sentra/actions

# Or use GitHub CLI
gh run list --workflow=release.yml
gh run watch
```

### 5. Verify Release

```bash
# Open releases page
open https://github.com/barnent1/sentra/releases/latest

# Check artifacts downloaded
curl -I https://github.com/barnent1/sentra/releases/download/v1.0.1/Sentra_1.0.1_macOS_universal.dmg
```

---

## Workflow Overview

The release workflow runs these jobs in parallel:

### Quality Gate (~10 min)
- ✅ TypeScript type checking
- ✅ ESLint validation
- ✅ Test suite execution
- ✅ Coverage verification (75%+)
- ✅ Production build

### Build macOS (~30 min)
- 🍎 Universal binary (Intel + Apple Silicon)
- 🍎 Signed and notarized (if configured)
- 🍎 DMG installer

### Build Windows (~30 min)
- 🪟 64-bit installer
- 🪟 Signed (if configured)
- 🪟 NSIS setup.exe

### Build Linux (~30 min)
- 🐧 AppImage (universal)
- 🐧 Debian package (.deb)

### Create Release (~5 min)
- 📦 Generate release notes from CHANGELOG
- 📦 Upload all artifacts with checksums
- 📦 Create update manifest for auto-updater

---

## Troubleshooting

### Script Fails - Missing jq

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Git Not Clean

```bash
# Commit changes
git add .
git commit -m "Your message"

# Or stash
git stash
```

### Build Fails

```bash
# macOS
xcode-select --install

# Linux
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev

# Windows
# Install Visual Studio Build Tools
```

### Workflow Fails

```bash
# View logs
gh run list --workflow=release.yml
gh run view <run-id> --log

# Common issues:
# - Tests failing → Fix tests first
# - Coverage below 75% → Add more tests
# - Rust compilation error → Check Cargo.toml dependencies
```

---

## Release Checklist

**Before Release:**
- [ ] Tests passing
- [ ] Coverage ≥75%
- [ ] TypeScript compiles
- [ ] No lint errors
- [ ] Git clean
- [ ] On main branch

**After Release:**
- [ ] Workflow passed
- [ ] Artifacts uploaded
- [ ] Release notes correct
- [ ] Test one platform

---

## Quick Links

- [Full Release Process Documentation](./RELEASE-PROCESS.md)
- [GitHub Actions](https://github.com/barnent1/sentra/actions)
- [Latest Release](https://github.com/barnent1/sentra/releases/latest)
- [CHANGELOG](../CHANGELOG.md)

---

**Need help?** See [RELEASE-PROCESS.md](./RELEASE-PROCESS.md) for detailed documentation.
