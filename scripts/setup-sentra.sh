#!/usr/bin/env bash

##############################################################################
# Sentra AI-Powered SaaS Factory - Complete System Setup
##############################################################################
#
# This script sets up the complete Sentra development environment including:
# - Prerequisite validation (Python, Node.js, git, gh CLI)
# - Serena MCP installation and indexing
# - Directory structure creation
# - Python dependencies installation
# - Claude Code CLI validation
# - Skills activation testing
#
# Usage:
#   ./scripts/setup-sentra.sh
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

# Version comparison helper
version_ge() {
    printf '%s\n%s' "$2" "$1" | sort -V -C
}

##############################################################################
# Step 1: Check Prerequisites
##############################################################################

check_prerequisites() {
    log_header "Step 1: Checking Prerequisites"

    local all_good=true

    # Check Python
    log_info "Checking Python installation..."
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        if version_ge "$PYTHON_VERSION" "3.11.0"; then
            log_success "Python $PYTHON_VERSION (>= 3.11.0 required)"
        else
            log_error "Python $PYTHON_VERSION is too old (>= 3.11.0 required)"
            all_good=false
        fi
    else
        log_error "Python 3 not found. Install from https://python.org"
        all_good=false
    fi

    # Check Node.js
    log_info "Checking Node.js installation..."
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        if version_ge "$NODE_VERSION" "20.0.0"; then
            log_success "Node.js $NODE_VERSION (>= 20.0.0 required)"
        else
            log_error "Node.js $NODE_VERSION is too old (>= 20.0.0 required)"
            all_good=false
        fi
    else
        log_error "Node.js not found. Install from https://nodejs.org"
        all_good=false
    fi

    # Check git
    log_info "Checking git installation..."
    if command_exists git; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        log_success "git $GIT_VERSION"
    else
        log_error "git not found. Install from https://git-scm.com"
        all_good=false
    fi

    # Check gh CLI
    log_info "Checking GitHub CLI installation..."
    if command_exists gh; then
        GH_VERSION=$(gh --version | head -n1 | cut -d' ' -f3)
        log_success "gh CLI $GH_VERSION"

        # Check gh auth status
        if gh auth status >/dev/null 2>&1; then
            log_success "GitHub CLI authenticated"
        else
            log_warning "GitHub CLI not authenticated. Run: gh auth login"
        fi
    else
        log_error "GitHub CLI (gh) not found. Install from https://cli.github.com"
        all_good=false
    fi

    # Check Claude Code CLI
    log_info "Checking Claude Code CLI installation..."
    if command_exists claude; then
        CLAUDE_VERSION=$(claude --version 2>&1 | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
        log_success "Claude Code CLI $CLAUDE_VERSION"
    else
        log_error "Claude Code CLI not found. Install from https://docs.claude.com/claude-code"
        all_good=false
    fi

    if [ "$all_good" = false ]; then
        error_exit "Prerequisites check failed. Please install missing dependencies."
    fi

    log_success "All prerequisites satisfied"
}

##############################################################################
# Step 2: Install Serena MCP
##############################################################################

install_serena_mcp() {
    log_header "Step 2: Installing Serena MCP"

    if [ -f "./scripts/install-serena.sh" ]; then
        log_info "Running Serena installation script..."
        bash ./scripts/install-serena.sh
    else
        log_error "Serena installation script not found at ./scripts/install-serena.sh"
        error_exit "Cannot proceed without Serena MCP"
    fi
}

##############################################################################
# Step 3: Create Directory Structure
##############################################################################

create_directory_structure() {
    log_header "Step 3: Creating Directory Structure"

    # Create .sentra directory structure
    log_info "Creating .sentra directories..."

    mkdir -p .sentra/architect-sessions
    mkdir -p .sentra/scripts
    mkdir -p .sentra/memory
    mkdir -p .sentra/metrics
    mkdir -p .sentra/specs
    mkdir -p .sentra/telemetry

    log_success "Created .sentra/ directory structure"

    # Create docs directory structure
    log_info "Creating docs directories..."

    mkdir -p docs/specs/screens
    mkdir -p docs/specs/components
    mkdir -p docs/architecture
    mkdir -p docs/deployment
    mkdir -p docs/features
    mkdir -p docs/decisions

    log_success "Created docs/ directory structure"

    # Update .gitignore if needed
    log_info "Updating .gitignore..."

    if [ -f ".gitignore" ]; then
        # Add Sentra-specific ignores if not already present
        if ! grep -q "# Sentra runtime" .gitignore 2>/dev/null; then
            cat >> .gitignore <<'EOF'

# Sentra runtime
.sentra/progress.json
.sentra/architect-sessions/*/session-*.md
.sentra/metrics/*.json
.sentra/telemetry/*.log

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
EOF
            log_success "Updated .gitignore with Sentra patterns"
        else
            log_info ".gitignore already contains Sentra patterns"
        fi
    fi
}

##############################################################################
# Step 4: Install Python Dependencies
##############################################################################

install_python_dependencies() {
    log_header "Step 4: Installing Python Dependencies"

    # Create requirements.txt if it doesn't exist
    if [ ! -f "requirements.txt" ]; then
        log_info "Creating requirements.txt..."
        cat > requirements.txt <<'EOF'
# Sentra AI-Powered SaaS Factory - Python Dependencies
requests>=2.31.0
pyyaml>=6.0.1
python-dotenv>=1.0.0
rich>=13.7.0
click>=8.1.7
EOF
        log_success "Created requirements.txt"
    fi

    # Install dependencies
    log_info "Installing Python dependencies..."

    if python3 -m pip install -r requirements.txt --quiet; then
        log_success "Python dependencies installed"
    else
        log_error "Failed to install Python dependencies"
        error_exit "Run: python3 -m pip install -r requirements.txt"
    fi
}

##############################################################################
# Step 5: Install Node.js Dependencies
##############################################################################

install_node_dependencies() {
    log_header "Step 5: Installing Node.js Dependencies"

    if [ -f "package.json" ]; then
        log_info "Installing Node.js dependencies (this may take a few minutes)..."

        if npm install --silent; then
            log_success "Node.js dependencies installed"
        else
            log_error "Failed to install Node.js dependencies"
            error_exit "Run: npm install"
        fi
    else
        log_warning "No package.json found, skipping Node.js dependencies"
    fi
}

##############################################################################
# Step 6: Validate Claude Code CLI
##############################################################################

validate_claude_code() {
    log_header "Step 6: Validating Claude Code CLI"

    log_info "Checking Claude Code authentication..."

    # Try to run a simple claude command
    if claude --version >/dev/null 2>&1; then
        log_success "Claude Code CLI is working"

        # Check for .claude directory
        if [ -d ".claude" ]; then
            log_success "Found .claude configuration directory"

            # Check for agents
            if [ -d ".claude/agents" ]; then
                AGENT_COUNT=$(find .claude/agents -name "*.md" 2>/dev/null | wc -l)
                log_success "Found $AGENT_COUNT agent configuration(s)"
            fi

            # Check for hooks
            if [ -d ".claude/hooks" ]; then
                HOOK_COUNT=$(find .claude/hooks -type f 2>/dev/null | wc -l)
                log_success "Found $HOOK_COUNT quality hook(s)"
            fi
        else
            log_warning ".claude directory not found - Claude Code may not be configured for this project"
        fi
    else
        log_error "Claude Code CLI validation failed"
        error_exit "Please ensure Claude Code is properly installed and authenticated"
    fi
}

##############################################################################
# Step 7: Test Skills Activation
##############################################################################

test_skills_activation() {
    log_header "Step 7: Testing Skills Activation"

    log_info "Skills are activated when you:"
    echo "  1. Start Claude Code with: claude"
    echo "  2. Enable a Skill in the UI (e.g., Voice Architect)"
    echo "  3. Skill reads .sentra/memory/patterns.md and session history"
    echo ""

    # Check if patterns.md exists
    if [ -f ".sentra/memory/patterns.md" ]; then
        log_success "Found patterns.md (loaded by Skills)"
    else
        log_warning "patterns.md not found - Skills won't have pattern memory"
        log_info "Patterns will be created as you build features"
    fi

    # Check for session history
    if [ -d ".sentra/architect-sessions" ]; then
        SESSION_COUNT=$(find .sentra/architect-sessions -name "session-*.md" 2>/dev/null | wc -l)
        if [ "$SESSION_COUNT" -gt 0 ]; then
            log_success "Found $SESSION_COUNT architect session(s)"
        else
            log_info "No architect sessions yet - create your first project!"
        fi
    fi
}

##############################################################################
# Step 8: Success Message
##############################################################################

print_success_message() {
    log_header "Setup Complete! 🚀"

    echo -e "${GREEN}Sentra AI-Powered SaaS Factory is ready!${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}For NEW Projects:${NC}"
    echo "  python .sentra/scripts/init-project.py --name \"your-project-name\""
    echo ""
    echo -e "${YELLOW}For EXISTING Projects:${NC}"
    echo "  python .sentra/scripts/init-existing-project.py"
    echo ""
    echo -e "${YELLOW}Start Development:${NC}"
    echo "  npm run dev          # Start Next.js dev server"
    echo "  npm run dev:safe     # Start with crash recovery"
    echo "  npm test             # Run test suite"
    echo ""
    echo -e "${YELLOW}Activate Skills:${NC}"
    echo "  claude               # Start Claude Code"
    echo "  > Enable Voice Architect or Meta Orchestrator"
    echo "  > Skills auto-load patterns from .sentra/memory/"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "  .sentra/README.md    # Sentra system overview"
    echo "  CLAUDE.md            # Project instructions for Claude"
    echo "  docs/                # Feature and architecture docs"
    echo ""
    echo -e "${GREEN}Happy building! 🎨${NC}"
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
    echo -e "${PURPLE}║      Sentra AI-Powered SaaS Factory Setup v1.0.0         ║${NC}"
    echo -e "${PURPLE}║                                                           ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if running from project root
    if [ ! -f "package.json" ]; then
        error_exit "Please run this script from the Sentra project root directory"
    fi

    # Run setup steps
    check_prerequisites
    install_serena_mcp
    create_directory_structure
    install_python_dependencies
    install_node_dependencies
    validate_claude_code
    test_skills_activation
    print_success_message
}

# Run main function
main "$@"
