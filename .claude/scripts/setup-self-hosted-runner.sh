#!/bin/bash
# Self-Hosted GitHub Actions Runner Setup for Sentra
# This allows running AI agents using your local Claude Code (Max Pro subscription)
# Instead of paying API credits!

set -e

RUNNER_DIR="$HOME/actions-runner"
REPO_URL="https://github.com/barnent1/sentra"

echo "================================================"
echo "  Sentra Self-Hosted Runner Setup"
echo "================================================"
echo ""
echo "This will set up a GitHub Actions runner on your Mac."
echo "Workflows will use YOUR Claude Code installation (Max Pro)."
echo "No API credits needed!"
echo ""

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo "ERROR: Claude Code CLI not found."
    echo "Please install Claude Code first: https://claude.ai/download"
    exit 1
fi

echo "✅ Claude Code found: $(which claude)"

# Check Claude authentication
if claude --version &> /dev/null; then
    echo "✅ Claude Code is working"
else
    echo "ERROR: Claude Code is not properly configured."
    echo "Please run 'claude' in terminal to authenticate first."
    exit 1
fi

# Create runner directory
if [ -d "$RUNNER_DIR" ]; then
    echo "Runner directory already exists at $RUNNER_DIR"
    read -p "Remove and reinstall? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$RUNNER_DIR"
    else
        echo "Exiting. Use existing runner or remove manually."
        exit 0
    fi
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Download latest runner for macOS ARM64
echo ""
echo "Downloading GitHub Actions runner..."
RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | grep -o '"tag_name": "v[^"]*' | cut -d'v' -f2)
curl -o actions-runner.tar.gz -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-osx-arm64-${RUNNER_VERSION}.tar.gz"

echo "Extracting runner..."
tar xzf actions-runner.tar.gz
rm actions-runner.tar.gz

# Get fresh registration token
echo ""
echo "Getting registration token..."
TOKEN=$(gh api -X POST repos/barnent1/sentra/actions/runners/registration-token --jq '.token')

if [ -z "$TOKEN" ]; then
    echo "ERROR: Could not get registration token."
    echo "Make sure you're authenticated with 'gh auth login'"
    exit 1
fi

# Configure the runner
echo ""
echo "Configuring runner..."
./config.sh --url "$REPO_URL" --token "$TOKEN" --name "sentra-mac-runner" --labels "self-hosted,macOS,ARM64,sentra" --work "_work" --unattended

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "To start the runner:"
echo "  cd $RUNNER_DIR && ./run.sh"
echo ""
echo "To run as a background service:"
echo "  cd $RUNNER_DIR && ./svc.sh install"
echo "  cd $RUNNER_DIR && ./svc.sh start"
echo ""
echo "The runner will execute workflows using YOUR Claude Code."
echo "No API credits - uses your Max Pro subscription!"
echo ""
