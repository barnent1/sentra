#!/bin/bash

# Install Git Hooks for Quetrex
# This script installs the pre-push hook to enforce quality checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}  Quetrex Git Hooks Installation${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo "${RED}❌ Error: Not a git repository${NC}"
  echo "   Run this script from inside the Quetrex project directory"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install pre-push hook
echo "${BLUE}→${NC} Installing pre-push hook..."

if [ -f "$HOOKS_DIR/pre-push" ]; then
  echo "${YELLOW}⚠️  Pre-push hook already exists${NC}"
  read -p "   Overwrite? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "${YELLOW}⏭️  Skipping pre-push hook installation${NC}"
  else
    cp "$SCRIPT_DIR/pre-push" "$HOOKS_DIR/pre-push"
    chmod +x "$HOOKS_DIR/pre-push"
    echo "${GREEN}✅ Pre-push hook installed (overwritten)${NC}"
  fi
else
  cp "$SCRIPT_DIR/pre-push" "$HOOKS_DIR/pre-push"
  chmod +x "$HOOKS_DIR/pre-push"
  echo "${GREEN}✅ Pre-push hook installed${NC}"
fi

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}Installation complete!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "The pre-push hook will now run before every git push to ensure:"
echo "  • TypeScript type checking passes"
echo "  • ESLint validation passes (0 errors, 0 warnings)"
echo "  • All tests pass"
echo "  • Coverage meets thresholds"
echo "  • Build succeeds"
echo ""
echo "To skip the hook (${RED}not recommended${NC}):"
echo "  ${YELLOW}git push --no-verify${NC}"
echo ""
echo "Note: CI/CD will still enforce all checks even if you bypass the hook."
echo ""
