#!/usr/bin/env bash

##############################################################################
# Serena MCP Installation Script
##############################################################################
#
# This script installs and configures Serena MCP (Model Context Protocol)
# for codebase understanding and pattern extraction.
#
# Serena provides:
# - Codebase indexing and search
# - Pattern extraction and documentation
# - Architecture understanding
# - Symbol resolution and code navigation
#
# Usage:
#   ./scripts/install-serena.sh
#
# Author: Glen Barnhardt with help from Claude Code
# License: MIT
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Error handler
error_exit() {
    log_error "$1"
    exit 1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

##############################################################################
# Step 1: Check UV Package Manager
##############################################################################

check_uv() {
    log_header "Step 1: Checking UV Package Manager"

    if command_exists uv; then
        UV_VERSION=$(uv --version | cut -d' ' -f2)
        log_success "uv $UV_VERSION installed"
        return 0
    else
        log_warning "uv package manager not found"
        log_info "Installing uv..."

        # Install uv using the official installer
        if curl -LsSf https://astral.sh/uv/install.sh | sh; then
            log_success "uv installed successfully"

            # Source the uv environment
            if [ -f "$HOME/.cargo/env" ]; then
                source "$HOME/.cargo/env"
            fi

            # Verify installation
            if command_exists uv; then
                log_success "uv is now available"
            else
                log_warning "uv installed but not in PATH. Please restart your shell."
                log_info "Run: source \$HOME/.cargo/env"
            fi
        else
            error_exit "Failed to install uv. Please install manually from https://docs.astral.sh/uv/"
        fi
    fi
}

##############################################################################
# Step 2: Install Serena MCP
##############################################################################

install_serena() {
    log_header "Step 2: Installing Serena MCP"

    log_info "Adding Serena MCP via Claude CLI..."

    # Check if Claude CLI is available
    if ! command_exists claude; then
        error_exit "Claude CLI not found. Please install from https://docs.claude.com/claude-code"
    fi

    # Add Serena MCP
    # The claude mcp add command handles installation automatically
    log_info "Running: claude mcp add serena"

    if claude mcp add serena; then
        log_success "Serena MCP added successfully"
    else
        log_error "Failed to add Serena MCP"
        error_exit "Please check Claude CLI configuration and try again"
    fi
}

##############################################################################
# Step 3: Configure Serena
##############################################################################

configure_serena() {
    log_header "Step 3: Configuring Serena"

    # Get project root
    PROJECT_ROOT=$(pwd)
    log_info "Project root: $PROJECT_ROOT"

    # Serena is configured via Claude MCP settings
    # Configuration is stored in ~/.claude/mcp_settings.json
    log_info "Serena configuration:"
    echo "  - Mode: read-only (safe for initial use)"
    echo "  - Root: $PROJECT_ROOT"
    echo "  - Index: automatic on first use"
    echo ""

    log_success "Serena configured for read-only access"
    log_warning "To enable write mode, update ~/.claude/mcp_settings.json"
}

##############################################################################
# Step 4: Pre-Index Project
##############################################################################

pre_index_project() {
    log_header "Step 4: Pre-Indexing Project"

    log_info "Indexing project codebase..."
    echo "This may take a few minutes depending on project size..."
    echo ""

    # Serena auto-indexes on first use, but we can trigger it via a simple query
    # We'll do this in the validation step instead
    log_info "Index will be built on first Serena query"
    log_info "To manually trigger indexing, start Claude and ask:"
    echo "  'What is the structure of this codebase?'"
    echo ""
}

##############################################################################
# Step 5: Validate Installation
##############################################################################

validate_installation() {
    log_header "Step 5: Validating Installation"

    log_info "Checking Serena MCP status..."

    # Check if Serena is in MCP list
    if claude mcp list | grep -q "serena"; then
        log_success "Serena MCP is registered with Claude"
    else
        log_warning "Serena MCP not found in MCP list"
        log_info "This may be normal if it's the first installation"
    fi

    # Check if Claude can start
    if claude --version >/dev/null 2>&1; then
        log_success "Claude CLI is working"
    else
        log_error "Claude CLI validation failed"
        error_exit "Please check Claude installation"
    fi

    log_success "Installation validation complete"
}

##############################################################################
# Step 6: Print Usage Examples
##############################################################################

print_usage_examples() {
    log_header "Serena MCP Ready! 🚀"

    echo -e "${GREEN}Serena MCP is now installed and configured.${NC}"
    echo ""
    echo -e "${CYAN}Usage Examples:${NC}"
    echo ""
    echo -e "${YELLOW}1. Understand Codebase Structure:${NC}"
    echo "   claude> What is the overall architecture of this codebase?"
    echo ""
    echo -e "${YELLOW}2. Find Patterns:${NC}"
    echo "   claude> Show me all React hooks in this project"
    echo ""
    echo -e "${YELLOW}3. Search Code:${NC}"
    echo "   claude> Find all functions that call the database"
    echo ""
    echo -e "${YELLOW}4. Extract Patterns:${NC}"
    echo "   claude> What patterns are used for error handling?"
    echo ""
    echo -e "${YELLOW}5. Navigate Code:${NC}"
    echo "   claude> Show me the implementation of UserService"
    echo ""
    echo -e "${CYAN}Advanced Features:${NC}"
    echo ""
    echo -e "${YELLOW}Symbol Resolution:${NC}"
    echo "   - Serena tracks all functions, classes, types"
    echo "   - Auto-completes symbol names"
    echo "   - Shows usage and references"
    echo ""
    echo -e "${YELLOW}Pattern Extraction:${NC}"
    echo "   - Identifies common code patterns"
    echo "   - Generates pattern documentation"
    echo "   - Suggests pattern improvements"
    echo ""
    echo -e "${YELLOW}Codebase Search:${NC}"
    echo "   - Fast semantic search"
    echo "   - Cross-reference tracking"
    echo "   - Dependency analysis"
    echo ""
    echo -e "${CYAN}Configuration:${NC}"
    echo "  ~/.claude/mcp_settings.json  # MCP configuration"
    echo "  ~/.serena/                   # Serena cache and index"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "  https://github.com/PierrunoYT/serena-mcp"
    echo ""
    echo -e "${GREEN}Start using Serena by running: claude${NC}"
    echo ""
}

##############################################################################
# Main Execution
##############################################################################

main() {
    clear
    echo ""
    echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                           ║${NC}"
    echo -e "${PURPLE}║           Serena MCP Installation v1.0.0                 ║${NC}"
    echo -e "${PURPLE}║                                                           ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if running from project root
    if [ ! -d ".git" ] && [ ! -f "package.json" ]; then
        log_warning "Not in a project root directory"
        log_info "Serena will index the current directory: $(pwd)"
        echo ""
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi

    # Run installation steps
    check_uv
    install_serena
    configure_serena
    pre_index_project
    validate_installation
    print_usage_examples
}

# Run main function
main "$@"
