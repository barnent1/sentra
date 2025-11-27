# Quetrex Release Process

**Complete guide to building, versioning, and releasing Quetrex across all platforms**

Last updated: 2025-11-13 by Glen Barnhardt with help from Claude Code

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Versioning Strategy](#versioning-strategy)
4. [Quick Release](#quick-release)
5. [Detailed Release Steps](#detailed-release-steps)
6. [Platform-Specific Builds](#platform-specific-builds)
7. [Auto-Update System](#auto-update-system)
8. [Troubleshooting](#troubleshooting)
9. [Release Checklist](#release-checklist)

---

## Overview

Quetrex uses a fully automated CI/CD pipeline for building and releasing desktop applications across macOS, Windows, and Linux. The release process is triggered by pushing a version tag to GitHub.

### Key Components

- **GitHub Actions**: Multi-platform build automation
- **Tauri**: Cross-platform desktop app framework
- **Semantic Versioning**: Standard version numbering (MAJOR.MINOR.PATCH)
- **Auto-Updater**: Automatic update delivery to users

### Release Workflow

```
1. Version Bump → 2. Quality Gate → 3. Multi-Platform Build → 4. GitHub Release → 5. Auto-Update
```

---

## Prerequisites

### Development Environment

**macOS (Primary Platform)**
```bash
# Xcode Command Line Tools
xcode-select --install

# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Dependencies
brew install jq         # For version script
brew install node       # Node.js 20+
brew install rust       # Rust toolchain
```

**Windows**
```powershell
# Install from official sites:
- Node.js 20+ (https://nodejs.org)
- Rust (https://rustup.rs)
- Visual Studio Build Tools (https://visualstudio.microsoft.com)

# Install dependencies
npm install -g @tauri-apps/cli
```

**Linux (Ubuntu/Debian)**
```bash
# System dependencies
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libasound2-dev \
  libssl-dev

# Node.js and Rust
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Repository Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/barnent1/quetrex.git
   cd quetrex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify build**
   ```bash
   npm run type-check
   npm run lint
   npm test
   npm run build
   ```

### GitHub Secrets (Optional)

For signed releases and auto-updates, configure these secrets in your GitHub repository:

**macOS Code Signing** (recommended for production)
- `APPLE_CERTIFICATE` - Base64-encoded .p12 certificate
- `CERTIFICATE_PASSWORD` - Certificate password
- `KEYCHAIN_PASSWORD` - Temporary keychain password
- `APPLE_SIGNING_IDENTITY` - Developer ID Application identity
- `APPLE_ID` - Apple ID for notarization
- `APPLE_APP_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Apple Developer Team ID

**Windows Code Signing** (optional)
- `WINDOWS_CERTIFICATE` - Base64-encoded .pfx certificate
- `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

**Tauri Update Signing** (required for auto-updates)
- `TAURI_PRIVATE_KEY` - Generated private key
- `TAURI_KEY_PASSWORD` - Key password

To generate Tauri signing keys:
```bash
npm run tauri signer generate
```

---

## Versioning Strategy

Quetrex follows **Semantic Versioning 2.0.0** (https://semver.org):

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes (incompatible API changes)
MINOR: New features (backward-compatible)
PATCH: Bug fixes (backward-compatible)
```

### Version Examples

- `1.0.0` - Initial stable release
- `1.1.0` - New feature added
- `1.1.1` - Bug fix
- `2.0.0` - Breaking change

### Pre-Release Versions

- `1.0.0-alpha.1` - Alpha release (internal testing)
- `1.0.0-beta.1` - Beta release (external testing)
- `1.0.0-rc.1` - Release candidate (final testing)

---

## Quick Release

**For experienced users - complete release in 3 commands:**

```bash
# 1. Bump version (patch/minor/major)
npm run version:patch

# 2. Push commit
git push origin main

# 3. Push tag to trigger release
git push origin v$(jq -r .version package.json)

# Monitor release
open https://github.com/barnent1/quetrex/actions
```

---

## Detailed Release Steps

### Step 1: Version Bump

The version bump script automatically updates all version references and creates a git commit + tag.

**Patch release (bug fixes)** - `1.0.0` → `1.0.1`
```bash
./scripts/bump-version.sh patch
# or
npm run version:patch
```

**Minor release (new features)** - `1.0.0` → `1.1.0`
```bash
./scripts/bump-version.sh minor
# or
npm run version:minor
```

**Major release (breaking changes)** - `1.0.0` → `2.0.0`
```bash
./scripts/bump-version.sh major
# or
npm run version:major
```

**Specific version**
```bash
./scripts/bump-version.sh 1.2.3
# or
npm run release:prepare 1.2.3
```

The script will:
1. ✅ Verify git working directory is clean
2. ✅ Update `package.json` version
3. ✅ Update `src-tauri/Cargo.toml` version
4. ✅ Update `src-tauri/tauri.conf.json` version
5. ✅ Update or create `CHANGELOG.md`
6. ✅ Update `package-lock.json`
7. ✅ Create git commit with version message
8. ✅ Create git tag (e.g., `v1.0.1`)

**Output example:**
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

### Step 2: Review Changes

Verify the version bump commit:

```bash
git show HEAD
```

Check modified files:
```bash
git diff HEAD~1 HEAD -- package.json
git diff HEAD~1 HEAD -- src-tauri/Cargo.toml
git diff HEAD~1 HEAD -- src-tauri/tauri.conf.json
git diff HEAD~1 HEAD -- CHANGELOG.md
```

### Step 3: Push Commit

Push the version bump commit to GitHub:

```bash
git push origin main
```

### Step 4: Trigger Release

Push the version tag to trigger the automated release workflow:

```bash
git push origin v1.0.1  # Replace with your version
```

**Or push all tags:**
```bash
git push --tags
```

### Step 5: Monitor Release

The GitHub Actions workflow will now:

1. **Quality Gate** (5-10 minutes)
   - TypeScript type checking
   - ESLint validation
   - Test suite execution
   - Coverage verification
   - Production build verification

2. **Multi-Platform Builds** (30-45 minutes in parallel)
   - **macOS**: Universal binary (Intel + Apple Silicon)
   - **Windows**: 64-bit installer
   - **Linux**: AppImage + Debian package

3. **Create GitHub Release** (2-5 minutes)
   - Generate release notes
   - Upload build artifacts
   - Create update manifest

**Monitor progress:**
```bash
open https://github.com/barnent1/quetrex/actions
```

Or use GitHub CLI:
```bash
gh run list --workflow=release.yml
gh run watch
```

### Step 6: Verify Release

Once complete, verify the release:

1. **GitHub Releases page**
   ```bash
   open https://github.com/barnent1/quetrex/releases/latest
   ```

2. **Check artifacts**
   - `Quetrex_1.0.1_macOS_universal.dmg` (+ .sha256)
   - `Quetrex_1.0.1_Windows_x64-setup.exe` (+ .sha256)
   - `Quetrex_1.0.1_Linux_x86_64.AppImage` (+ .sha256)
   - `Quetrex_1.0.1_Linux_amd64.deb` (+ .sha256)
   - `latest.json` (update manifest)

3. **Download and test** (recommended)
   ```bash
   # macOS
   curl -LO https://github.com/barnent1/quetrex/releases/download/v1.0.1/Quetrex_1.0.1_macOS_universal.dmg
   open Quetrex_1.0.1_macOS_universal.dmg
   ```

---

## Platform-Specific Builds

### Local Development Builds

**macOS Universal (Intel + Apple Silicon)**
```bash
npm run build:mac
# Output: src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

**macOS x64 Only**
```bash
npm run build:mac:x64
# Output: src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/
```

**macOS ARM64 Only**
```bash
npm run build:mac:arm64
# Output: src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
```

**Windows**
```bash
npm run build:windows
# Output: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/
```

**Linux**
```bash
npm run build:linux
# Output: src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/
```

**All Platforms** (requires all toolchains)
```bash
npm run build:all
```

### Build Output Locations

After running build commands:

```
src-tauri/target/
├── universal-apple-darwin/
│   └── release/bundle/dmg/
│       └── Quetrex_universal.dmg
├── x86_64-apple-darwin/
│   └── release/bundle/dmg/
│       └── Quetrex_x64.dmg
├── aarch64-apple-darwin/
│   └── release/bundle/dmg/
│       └── Quetrex_aarch64.dmg
├── x86_64-pc-windows-msvc/
│   └── release/bundle/nsis/
│       └── Quetrex_x64-setup.exe
└── x86_64-unknown-linux-gnu/
    └── release/bundle/
        ├── appimage/
        │   └── quetrex.AppImage
        └── deb/
            └── quetrex_amd64.deb
```

---

## Auto-Update System

Quetrex includes built-in automatic updates using Tauri's updater plugin.

### How It Works

1. **Startup Check** - App checks for updates 5 seconds after launch
2. **Periodic Checks** - Every 4 hours while running
3. **Update Available** - User is notified with dialog
4. **Download & Install** - Update downloaded in background
5. **Relaunch** - App restarts with new version

### Update Manifest

The release workflow automatically creates `latest.json`:

```json
{
  "version": "1.0.1",
  "notes": "See release notes at https://github.com/barnent1/quetrex/releases/tag/v1.0.1",
  "pub_date": "2025-11-13T18:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "",
      "url": "https://github.com/barnent1/quetrex/releases/download/v1.0.1/Quetrex_1.0.1_macOS_universal.dmg"
    },
    "darwin-aarch64": {
      "signature": "",
      "url": "https://github.com/barnent1/quetrex/releases/download/v1.0.1/Quetrex_1.0.1_macOS_universal.dmg"
    },
    "windows-x86_64": {
      "signature": "",
      "url": "https://github.com/barnent1/quetrex/releases/download/v1.0.1/Quetrex_1.0.1_Windows_x64-setup.exe"
    },
    "linux-x86_64": {
      "signature": "",
      "url": "https://github.com/barnent1/quetrex/releases/download/v1.0.1/Quetrex_1.0.1_Linux_x86_64.AppImage"
    }
  }
}
```

### Configuration

**Location:** `src-tauri/tauri.conf.json`

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/barnent1/quetrex/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### Usage in Code

```typescript
import { checkForUpdates, installUpdate, initializeUpdater } from '@/lib/updater'

// Initialize on app start
initializeUpdater()

// Manual check
const update = await checkForUpdates()
if (update) {
  console.log(`Update available: ${update.version}`)
  await installUpdate()
}
```

### Disabling Auto-Updates

Set `active: false` in `tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": false
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Version Script Fails

**Problem:** `jq: command not found`

**Solution:**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
choco install jq
```

#### 2. Git Status Not Clean

**Problem:** `Working directory is not clean`

**Solution:**
```bash
# Review changes
git status

# Commit or stash changes
git add .
git commit -m "Your message"

# Or stash
git stash
```

#### 3. Build Fails - Missing Dependencies

**macOS:**
```bash
xcode-select --install
brew install pkg-config
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libasound2-dev
```

**Windows:**
- Ensure Visual Studio Build Tools are installed
- Install Windows 10 SDK

#### 4. Release Workflow Fails

**Check workflow logs:**
```bash
gh run list --workflow=release.yml
gh run view <run-id> --log
```

**Common causes:**
- Quality gate failure (tests/lint/coverage)
- Missing GitHub secrets
- Network issues downloading dependencies
- Rust compilation errors

#### 5. Auto-Update Not Working

**Verify configuration:**
```bash
# Check tauri.conf.json
cat src-tauri/tauri.conf.json | jq '.plugins.updater'

# Verify update manifest exists
curl -I https://github.com/barnent1/quetrex/releases/latest/download/latest.json
```

**Enable debug logging:**
```typescript
// In your app
console.log('Checking for updates...')
const update = await checkForUpdates()
console.log('Update check result:', update)
```

---

## Release Checklist

Use this checklist for every release:

### Pre-Release

- [ ] All tests passing (`npm test`)
- [ ] Coverage meets thresholds (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Production build works (`npm run build`)
- [ ] CHANGELOG.md updated (auto-updated by script)
- [ ] Git working directory clean
- [ ] On correct branch (`main`)

### Release Process

- [ ] Version bumped using script
- [ ] Commit reviewed (`git show HEAD`)
- [ ] Commit pushed to GitHub
- [ ] Tag pushed to trigger release
- [ ] Release workflow started
- [ ] All workflow jobs passed

### Post-Release

- [ ] GitHub release created
- [ ] All artifacts uploaded (DMG, EXE, AppImage, DEB)
- [ ] Checksums generated (.sha256 files)
- [ ] Update manifest (`latest.json`) uploaded
- [ ] Release notes accurate
- [ ] Download and test at least one platform
- [ ] Verify auto-update works (optional)

### Communication (Optional)

- [ ] Announce on social media
- [ ] Update documentation
- [ ] Notify users via email/newsletter
- [ ] Post on community forums

---

## Additional Resources

### Documentation

- [Tauri Documentation](https://tauri.app/v2/)
- [Semantic Versioning](https://semver.org)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Keep a Changelog](https://keepachangelog.com)

### Quetrex Specific

- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Documentation](../docs/architecture/)
- [Development Guide](../DEVELOPMENT.md)

### Support

- GitHub Issues: https://github.com/barnent1/quetrex/issues
- Discussions: https://github.com/barnent1/quetrex/discussions

---

**Last updated:** 2025-11-13
**Maintained by:** Glen Barnhardt with help from Claude Code
