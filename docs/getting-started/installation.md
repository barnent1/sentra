# Installation Guide

Get Sentra running on your Mac in 10 minutes.

---

## Prerequisites

### System Requirements

- **Operating System:**
  - macOS 10.15+ (Catalina or later)
  - Windows 10+ (64-bit)
  - Linux (Ubuntu 20.04+, Fedora 35+, or equivalent)
- **Memory:** 4GB RAM minimum (8GB recommended)
- **Disk Space:** 500MB for app + dependencies
- **Internet:** Required for AI services

### Software Requirements

1. **Node.js 18+**

   **macOS:**
   ```bash
   # Check version
   node --version  # Should be >= 18.0.0

   # Install if needed (using Homebrew)
   brew install node
   ```

   **Windows:**
   ```powershell
   # Download installer from nodejs.org
   # Or use Chocolatey
   choco install nodejs

   # Verify
   node --version
   ```

   **Linux:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Fedora
   sudo dnf install nodejs

   # Verify
   node --version
   ```

2. **Rust** (installed automatically by Tauri)
   - No manual installation needed
   - Tauri installs Rust toolchain on first build

3. **OpenAI API Key**
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Create API key in dashboard
   - Keep it safe - you'll need it shortly

4. **Platform-Specific Audio Libraries**

   **Linux Only:** Audio libraries required for voice notifications
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libasound2-dev

   # Fedora/RHEL
   sudo dnf install alsa-lib-devel

   # Arch Linux
   sudo pacman -S alsa-lib
   ```

   **macOS/Windows:** No additional audio libraries needed

### Optional (for development)

5. **Git** (for cloning repository)
   ```bash
   # Check if installed
   git --version

   # Install via Xcode Command Line Tools
   xcode-select --install
   ```

6. **GitHub CLI** (for automation features)

   **macOS:**
   ```bash
   # Install
   brew install gh

   # Authenticate
   gh auth login
   ```

   **Windows:**
   ```powershell
   # Download installer from cli.github.com
   # Or use Chocolatey
   choco install gh

   # Authenticate
   gh auth login
   ```

   **Linux:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh

   # Fedora
   sudo dnf install gh

   # Authenticate
   gh auth login
   ```

---

## Installation Steps

### Step 1: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/yourusername/sentra.git
cd sentra
```

Or download ZIP from GitHub and extract.

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

This will take 2-3 minutes. It installs:
- Next.js and React
- Tauri CLI
- Testing libraries
- UI components

### Step 3: Configure Environment

```bash
# Create environment file
cp .env.example .env.local

# Edit with your favorite editor
nano .env.local  # or code .env.local or vim .env.local
```

Add your OpenAI API key:

```env
# Required: OpenAI API Key for voice and AI features
OPENAI_API_KEY=sk-...your-key-here...

# Optional: GitHub token for automation (can add later)
GITHUB_TOKEN=ghp_...your-token...

# Optional: Project configuration
NEXT_PUBLIC_APP_NAME=Sentra
```

**Security Note:** Never commit `.env.local` to git. It's already in `.gitignore`.

### Step 4: Run Development Build

```bash
# Start Tauri app in development mode
npm run tauri:dev
```

**First run will take 5-10 minutes** because:
1. Tauri installs Rust toolchain
2. Rust compiles native code
3. Next.js builds frontend

**Subsequent runs take ~30 seconds.**

### Step 5: Verify Installation

When the app opens, you should see:

- Sentra dashboard with "Welcome" screen
- Settings icon in top-right
- "Chat with Architect" button

**Click Settings** and verify:
- OpenAI API Key shows as "Configured ✓"
- Voice Mode shows "Available"

**Click "Chat with Architect"** and:
- Allow microphone access when prompted
- You should hear a greeting from Sentra

---

## Troubleshooting

### Rust Installation Fails

**Problem:** `error: could not find rust toolchain`

**Solution:**
```bash
# Install Rust manually
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal, then retry
npm run tauri:dev
```

### Microphone Access Denied

**Problem:** No audio in voice conversations

**Solution:**
1. Open **System Preferences** → **Security & Privacy** → **Microphone**
2. Enable microphone for "Sentra" (or your terminal/browser)
3. Restart Sentra app

### OpenAI API Key Not Working

**Problem:** "API key invalid" error

**Solution:**
```bash
# Verify key starts with sk-
echo $OPENAI_API_KEY

# Test key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Should return list of models, not error
```

If error persists:
- Check key hasn't expired (OpenAI dashboard)
- Verify billing is set up (OpenAI requires payment method)
- Create new key and update `.env.local`

### Voice Notifications Not Working

**Problem:** No audio when voice notifications are enabled

**macOS:**
1. Open **System Preferences** → **Security & Privacy** → **Microphone**
2. Enable microphone for "Sentra" (or your terminal/browser)
3. Check system volume is not muted
4. Restart Sentra app

**Windows:**
1. Open **Settings** → **Privacy** → **Microphone**
2. Enable microphone access for Sentra
3. Check system volume and audio device
4. Restart Sentra app

**Linux:**
```bash
# Check audio system is running
systemctl --user status pulseaudio

# Or for ALSA
aplay -l

# Test audio output
speaker-test -t wav -c 2

# If no sound, check volume
alsamixer
```

If issues persist:
- Verify audio libraries are installed (see Prerequisites)
- Check application logs for audio errors
- Try a different audio device

### Port Already in Use

**Problem:** `Error: Port 3000 already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run tauri:dev
```

### Build Errors After Update

**Problem:** Build fails after `git pull` or dependency update

**Solution:**
```bash
# Clean everything
rm -rf node_modules
rm -rf src-tauri/target
rm -rf .next

# Reinstall
npm install

# Rebuild
npm run tauri:dev
```

---

## Updating Sentra

### Update to Latest Version

```bash
# Pull latest code
git pull origin main

# Update dependencies
npm install

# Rebuild (first build after update will be slow)
npm run tauri:dev
```

### Check Current Version

```bash
# Check version in package.json
cat package.json | grep version

# Or in the app
# Click Settings → About
```

---

## Uninstalling

### Remove Application

```bash
# Delete repository
cd ..
rm -rf sentra
```

### Remove Generated Data

```bash
# Remove Sentra data directory (if any)
rm -rf ~/.sentra

# Remove Tauri cache
rm -rf ~/Library/Caches/com.sentra.app
```

### Remove Rust (if installed)

```bash
# Only if you don't use Rust for other projects
rustup self uninstall
```

---

## Production Build (Optional)

For a standalone .app file:

```bash
# Build production version
npm run tauri:build
```

Output location:
```
src-tauri/target/release/bundle/macos/Sentra.app
```

You can:
- Move to `/Applications`
- Double-click to run
- Distribute to others (must have same macOS version)

**Note:** Production builds are code-signed for distribution. For personal use, development mode is fine.

---

## Next Steps

Now that Sentra is installed:

1. **[Quick Start →](quick-start.md)** - Your first voice conversation (5 minutes)
2. **[First Steps →](first-steps.md)** - Learn the interface and workflow
3. **[Development Setup →](development-setup.md)** - Set up testing and tools (for developers)

---

## Need Help?

- **Documentation:** [docs/README.md](../README.md)
- **Common Issues:** Check [GitHub Issues](https://github.com/yourusername/sentra/issues)
- **Questions:** Open new issue with `question` label

---

**Installation Time:** ~10 minutes (first time), ~2 minutes (updates)
**Last Updated:** 2025-11-13
