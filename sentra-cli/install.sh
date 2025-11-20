#!/bin/bash
# Sentra CLI Installation Script
# Created by Glen Barnhardt with help from Claude Code

set -e

echo "🚀 Installing Sentra CLI..."
echo ""

# Determine installation directory
if [ -n "$PREFIX" ]; then
    INSTALL_DIR="$PREFIX/bin"
elif [ -d "$HOME/.local/bin" ]; then
    INSTALL_DIR="$HOME/.local/bin"
elif [ -d "/usr/local/bin" ]; then
    INSTALL_DIR="/usr/local/bin"
else
    echo "❌ Could not find installation directory"
    echo "   Create ~/.local/bin or set PREFIX environment variable"
    exit 1
fi

echo "📁 Installation directory: $INSTALL_DIR"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Copy sentra script
echo "📦 Copying sentra CLI..."
cp "$SCRIPT_DIR/sentra" "$INSTALL_DIR/sentra"
chmod +x "$INSTALL_DIR/sentra"

# Check if in PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
    echo ""
    echo "⚠️  $INSTALL_DIR is not in your PATH"
    echo "   Add this to your ~/.bashrc or ~/.zshrc:"
    echo ""
    echo "   export PATH=\"$INSTALL_DIR:\$PATH\""
    echo ""
else
    echo "✅ Installed successfully!"
    echo ""
    echo "Try it out:"
    echo "  sentra --version"
    echo "  sentra doctor"
    echo "  sentra init"
    echo ""
fi
