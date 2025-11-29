#!/bin/bash
# Quetrex CLI Installer
# Usage: curl -fsSL https://quetrex.com/install.sh | bash

set -e

QUETREX_VERSION="1.0.0"
INSTALL_DIR="${HOME}/.quetrex/bin"
CLI_URL="https://quetrex.com/cli/quetrex"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}Quetrex CLI Installer${NC}"
echo -e "${CYAN}=====================${NC}"
echo ""

# Check for required tools
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
fi

# Create install directory
echo -e "${YELLOW}Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"

# Download CLI
echo -e "${YELLOW}Downloading Quetrex CLI v${QUETREX_VERSION}...${NC}"
curl -fsSL "$CLI_URL" -o "$INSTALL_DIR/quetrex"
chmod +x "$INSTALL_DIR/quetrex"

# Add to PATH if not already there
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then
    SHELL_CONFIG="$HOME/.profile"
fi

PATH_EXPORT="export PATH=\"\$HOME/.quetrex/bin:\$PATH\""

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q ".quetrex/bin" "$SHELL_CONFIG" 2>/dev/null; then
        echo "" >> "$SHELL_CONFIG"
        echo "# Quetrex CLI" >> "$SHELL_CONFIG"
        echo "$PATH_EXPORT" >> "$SHELL_CONFIG"
        echo -e "${GREEN}Added Quetrex to PATH in $SHELL_CONFIG${NC}"
    fi
fi

# Success message
echo ""
echo -e "${GREEN}Quetrex CLI installed successfully!${NC}"
echo ""
echo -e "Installation path: ${CYAN}$INSTALL_DIR/quetrex${NC}"
echo ""
echo -e "${YELLOW}To get started:${NC}"
echo ""
echo "  1. Restart your terminal or run:"
echo -e "     ${CYAN}source $SHELL_CONFIG${NC}"
echo ""
echo "  2. Login to your Quetrex account:"
echo -e "     ${CYAN}quetrex login${NC}"
echo ""
echo "  3. Initialize a project:"
echo -e "     ${CYAN}cd your-project && quetrex init${NC}"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
echo ""
