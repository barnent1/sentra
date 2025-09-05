#!/bin/bash

# SENTRA TMUX Integration Setup Script
# Sets up comprehensive TMUX development environment with monitoring and guard system

set -euo pipefail

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLATFORM="$(uname -s)"
USER_HOME="$HOME"
BIN_DIR="$USER_HOME/bin"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup directory structure
setup_directories() {
    log_info "Setting up directory structure..."
    
    # Create bin directory if it doesn't exist
    mkdir -p "$BIN_DIR"
    
    # Create SENTRA config directory
    mkdir -p "$USER_HOME/.config/sentra"
    mkdir -p "$USER_HOME/.local/share/sentra/logs"
    mkdir -p "$USER_HOME/.local/share/sentra/sessions"
    
    log_success "Directories created"
}

# Install TMUX if needed
install_tmux() {
    if command_exists tmux; then
        TMUX_VERSION=$(tmux -V | cut -d' ' -f2)
        log_success "TMUX $TMUX_VERSION already installed"
        return
    fi
    
    log_info "Installing TMUX..."
    case "$PLATFORM" in
        Darwin)
            if command_exists brew; then
                brew install tmux
            else
                log_error "Homebrew not found. Please install TMUX manually"
                exit 1
            fi
            ;;
        Linux)
            if command_exists apt; then
                sudo apt update && sudo apt install -y tmux
            elif command_exists yum; then
                sudo yum install -y tmux
            elif command_exists dnf; then
                sudo dnf install -y tmux
            else
                log_error "Package manager not found. Please install TMUX manually"
                exit 1
            fi
            ;;
        *)
            log_error "Unsupported platform: $PLATFORM"
            exit 1
            ;;
    esac
    
    log_success "TMUX installed successfully"
}

# Create enhanced TMUX startup script
create_tmux_startup_script() {
    log_info "Creating TMUX startup script..."
    
    cat > "$BIN_DIR/sentra-start" << 'EOF'
#!/bin/bash

# SENTRA TMUX Development Environment Launcher
# Enhanced version with comprehensive monitoring and development tools

set -euo pipefail

# Configuration
PROJECT_PATH="${1:-$(pwd)}"
PROJECT_NAME="${2:-SENTRA}"
SESSION_NAME="${3:-sentra-dev}"
SENTRA_CONFIG_DIR="$HOME/.config/sentra"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[SENTRA]${NC} $1"
}

success() {
    echo -e "${GREEN}[SENTRA]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[SENTRA]${NC} $1"
}

# Check if session exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    log "Session '$SESSION_NAME' already exists. Attaching..."
    tmux attach-session -t "$SESSION_NAME"
    exit 0
fi

# Validate project directory
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path '$PROJECT_PATH' does not exist"
    exit 1
fi

cd "$PROJECT_PATH"

# Check if this is a SENTRA project
if [ ! -f "package.json" ] || ! grep -q "sentra-evolutionary" package.json 2>/dev/null; then
    warn "This doesn't appear to be a SENTRA project. Continuing anyway..."
fi

log "Starting SENTRA development environment..."
log "Project: $PROJECT_NAME"
log "Path: $PROJECT_PATH"
log "Session: $SESSION_NAME"

# Create new TMUX session (detached)
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_PATH"

# Window 1: Main Development
tmux rename-window -t "$SESSION_NAME:0" "main"

# Split into 4 panes for comprehensive development view
# Top half: Code editing (left) and quick commands (right)
tmux split-window -t "$SESSION_NAME:main" -h -c "$PROJECT_PATH"

# Bottom half: Logs (left) and system monitor (right)
tmux split-window -t "$SESSION_NAME:main.0" -v -c "$PROJECT_PATH"
tmux split-window -t "$SESSION_NAME:main.1" -v -c "$PROJECT_PATH"

# Pane 0 (top-left): Main development area
tmux send-keys -t "$SESSION_NAME:main.0" "clear" Enter
tmux send-keys -t "$SESSION_NAME:main.0" "echo '🚀 SENTRA Development Environment'" Enter
tmux send-keys -t "$SESSION_NAME:main.0" "echo 'Ready for development...'" Enter

# Pane 1 (top-right): Quick commands and testing
tmux send-keys -t "$SESSION_NAME:main.1" "clear" Enter
tmux send-keys -t "$SESSION_NAME:main.1" "echo '⚡ Quick Commands'" Enter
tmux send-keys -t "$SESSION_NAME:main.1" "echo 'npm run dev          # Start dev servers'" Enter
tmux send-keys -t "$SESSION_NAME:main.1" "echo 'npm run test         # Run tests'" Enter
tmux send-keys -t "$SESSION_NAME:main.1" "echo 'npm run evolution:up # Start services'" Enter
tmux send-keys -t "$SESSION_NAME:main.1" "echo ''" Enter

# Pane 2 (bottom-left): Service logs
tmux send-keys -t "$SESSION_NAME:main.2" "clear" Enter
tmux send-keys -t "$SESSION_NAME:main.2" "echo '📋 Service Logs'" Enter
tmux send-keys -t "$SESSION_NAME:main.2" "echo 'Use: npm run evolution:logs'" Enter

# Pane 3 (bottom-right): System monitoring
tmux send-keys -t "$SESSION_NAME:main.3" "clear" Enter
if command -v htop >/dev/null 2>&1; then
    tmux send-keys -t "$SESSION_NAME:main.3" "htop" Enter
else
    tmux send-keys -t "$SESSION_NAME:main.3" "top" Enter
fi

# Window 2: Services and Database
tmux new-window -t "$SESSION_NAME" -n "services" -c "$PROJECT_PATH"

# Split for services monitoring
tmux split-window -t "$SESSION_NAME:services" -h -c "$PROJECT_PATH"
tmux split-window -t "$SESSION_NAME:services.0" -v -c "$PROJECT_PATH"

# Services overview (top-left)
tmux send-keys -t "$SESSION_NAME:services.0" "clear" Enter
tmux send-keys -t "$SESSION_NAME:services.0" "echo '🔧 SENTRA Services'" Enter
tmux send-keys -t "$SESSION_NAME:services.0" "docker-compose -f docker-compose.evolution.yml ps" Enter

# Database access (bottom-left)
tmux send-keys -t "$SESSION_NAME:services.1" "clear" Enter
tmux send-keys -t "$SESSION_NAME:services.1" "echo '🗄️  Database Access'" Enter
tmux send-keys -t "$SESSION_NAME:services.1" "echo 'docker exec -it sentra-evolution-postgres psql -U sentra -d sentra'" Enter

# API testing (right)
tmux send-keys -t "$SESSION_NAME:services.2" "clear" Enter
tmux send-keys -t "$SESSION_NAME:services.2" "echo '🔗 API Testing'" Enter
tmux send-keys -t "$SESSION_NAME:services.2" "echo 'curl http://localhost:3001/health'" Enter

# Window 3: Monitoring and Analytics
tmux new-window -t "$SESSION_NAME" -n "monitor" -c "$PROJECT_PATH"

# Split for comprehensive monitoring
tmux split-window -t "$SESSION_NAME:monitor" -h -c "$PROJECT_PATH"
tmux split-window -t "$SESSION_NAME:monitor.0" -v -c "$PROJECT_PATH"
tmux split-window -t "$SESSION_NAME:monitor.1" -v -c "$PROJECT_PATH"

# System status (top-left)
tmux send-keys -t "$SESSION_NAME:monitor.0" "clear" Enter
tmux send-keys -t "$SESSION_NAME:monitor.0" "echo '📊 System Status'" Enter
tmux send-keys -t "$SESSION_NAME:monitor.0" "watch -n 5 'curl -s http://localhost:3001/health | jq .'" Enter

# Docker stats (bottom-left)
tmux send-keys -t "$SESSION_NAME:monitor.1" "clear" Enter
tmux send-keys -t "$SESSION_NAME:monitor.1" "echo '📈 Container Stats'" Enter
tmux send-keys -t "$SESSION_NAME:monitor.1" "watch -n 3 'docker stats --no-stream'" Enter

# Git status and changes (top-right)
tmux send-keys -t "$SESSION_NAME:monitor.2" "clear" Enter
tmux send-keys -t "$SESSION_NAME:monitor.2" "echo '📚 Git Status'" Enter
tmux send-keys -t "$SESSION_NAME:monitor.2" "watch -n 10 'git status --porcelain && echo && git log --oneline -5'" Enter

# Event logs (bottom-right)
tmux send-keys -t "$SESSION_NAME:monitor.3" "clear" Enter
tmux send-keys -t "$SESSION_NAME:monitor.3" "echo '🔔 SENTRA Events'" Enter
tmux send-keys -t "$SESSION_NAME:monitor.3" "tail -f ~/.local/share/sentra/logs/events.log 2>/dev/null || echo 'No event log yet'"

# Window 4: Testing and Quality
tmux new-window -t "$SESSION_NAME" -n "testing" -c "$PROJECT_PATH"

# Split for different testing aspects
tmux split-window -t "$SESSION_NAME:testing" -h -c "$PROJECT_PATH"

# Test runner (left)
tmux send-keys -t "$SESSION_NAME:testing.0" "clear" Enter
tmux send-keys -t "$SESSION_NAME:testing.0" "echo '🧪 Testing Environment'" Enter
tmux send-keys -t "$SESSION_NAME:testing.0" "echo 'npm run test:watch # Watch mode'" Enter
tmux send-keys -t "$SESSION_NAME:testing.0" "echo 'npm run test:unit  # Unit tests'" Enter
tmux send-keys -t "$SESSION_NAME:testing.0" "echo 'npm run test:e2e   # E2E tests'" Enter

# Code quality (right)
tmux send-keys -t "$SESSION_NAME:testing.1" "clear" Enter
tmux send-keys -t "$SESSION_NAME:testing.1" "echo '✨ Code Quality'" Enter
tmux send-keys -t "$SESSION_NAME:testing.1" "echo 'npm run lint       # Linting'" Enter
tmux send-keys -t "$SESSION_NAME:testing.1" "echo 'npm run type-check # TypeScript'" Enter
tmux send-keys -t "$SESSION_NAME:testing.1" "echo 'npm run format     # Formatting'" Enter

# Select main window and first pane
tmux select-window -t "$SESSION_NAME:main"
tmux select-pane -t "$SESSION_NAME:main.0"

# Save session configuration
echo "session_name=$SESSION_NAME" > "$SENTRA_CONFIG_DIR/last_session"
echo "project_path=$PROJECT_PATH" >> "$SENTRA_CONFIG_DIR/last_session"
echo "project_name=$PROJECT_NAME" >> "$SENTRA_CONFIG_DIR/last_session"

success "SENTRA development environment ready!"
echo ""
echo "Windows available:"
echo "  0: main     - Main development (4 panes)"
echo "  1: services - Services and database"
echo "  2: monitor  - System monitoring"
echo "  3: testing  - Testing and quality"
echo ""
echo "Key bindings:"
echo "  Ctrl+b %    - Split vertically"
echo "  Ctrl+b \"    - Split horizontally"
echo "  Ctrl+b o    - Switch panes"
echo "  Ctrl+b n    - Next window"
echo "  Ctrl+b p    - Previous window"
echo ""

# Attach to session
tmux attach-session -t "$SESSION_NAME"
EOF

    chmod +x "$BIN_DIR/sentra-start"
    log_success "TMUX startup script created"
}

# Create SENTRA guard system
create_guard_system() {
    log_info "Creating SENTRA guard system..."
    
    cat > "$USER_HOME/.sentra-guard.sh" << 'EOF'
#!/bin/bash

# SENTRA Guard System - Command Monitoring and Approval System
# This script intercepts potentially dangerous commands and requests approval

# Configuration - can be overridden by environment variables
SENTRA_URL="${SENTRA_URL:-http://localhost:3001}"
SENTRA_API_TOKEN="${SENTRA_API_TOKEN:-dev_token_12345}"
SENTRA_MACHINE_ID="${SENTRA_MACHINE_ID:-$(hostname)-$(whoami)}"
SENTRA_LOG_FILE="$HOME/.local/share/sentra/logs/guard.log"

# Ensure log directory exists
mkdir -p "$(dirname "$SENTRA_LOG_FILE")"

# Dangerous command patterns
DANGEROUS_PATTERNS=(
    "rm -rf"
    "sudo rm"
    "dd if="
    "mkfs"
    "fdisk"
    "parted"
    "> /dev/"
    "sudo shutdown"
    "sudo reboot"
    "sudo halt"
    "sudo poweroff"
    "kill -9"
    "killall"
    "sudo pkill"
    "chmod 777"
    "sudo chmod -R"
    "sudo chown -R"
    "> /etc/"
    "sudo mv /etc/"
    "sudo cp * /etc/"
    "curl.*|.*sh"
    "wget.*|.*sh"
    "docker rmi"
    "docker system prune"
    "npm uninstall -g"
    "sudo npm uninstall -g"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log_command() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" >> "$SENTRA_LOG_FILE"
}

# Check if command is dangerous
is_dangerous_command() {
    local cmd="$1"
    
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if [[ "$cmd" =~ $pattern ]]; then
            return 0  # Command is dangerous
        fi
    done
    
    return 1  # Command is safe
}

# Request approval from SENTRA API
request_approval() {
    local cmd="$1"
    local description="Command execution approval required: $cmd"
    
    local response=$(curl -s -X POST "$SENTRA_URL/api/approvals" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SENTRA_API_TOKEN" \
        -d "{
            \"approval_type\": \"dangerous_command\",
            \"description\": \"$description\",
            \"context\": {
                \"command\": \"$cmd\",
                \"machine_id\": \"$SENTRA_MACHINE_ID\",
                \"pwd\": \"$(pwd)\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            },
            \"phone_required\": true
        }" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        local approval_id=$(echo "$response" | jq -r '.approval_id' 2>/dev/null)
        if [ "$approval_id" != "null" ] && [ -n "$approval_id" ]; then
            echo "$approval_id"
            return 0
        fi
    fi
    
    return 1
}

# Check approval status
check_approval_status() {
    local approval_id="$1"
    
    local response=$(curl -s "$SENTRA_URL/api/approvals/$approval_id/status" \
        -H "Authorization: Bearer $SENTRA_API_TOKEN" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "$response" | jq -r '.status' 2>/dev/null || echo "pending"
    else
        echo "pending"
    fi
}

# Wait for approval
wait_for_approval() {
    local approval_id="$1"
    local timeout=300  # 5 minutes timeout
    local elapsed=0
    
    echo -e "${BLUE}⏳ Waiting for approval (ID: $approval_id)${NC}"
    echo -e "${YELLOW}Check your phone for notification${NC}"
    
    while [ $elapsed -lt $timeout ]; do
        local status=$(check_approval_status "$approval_id")
        
        case "$status" in
            "approved")
                echo -e "${GREEN}✅ Command approved!${NC}"
                return 0
                ;;
            "denied")
                echo -e "${RED}❌ Command denied${NC}"
                return 1
                ;;
            "expired")
                echo -e "${RED}⏰ Approval request expired${NC}"
                return 1
                ;;
            *)
                printf "."
                sleep 5
                elapsed=$((elapsed + 5))
                ;;
        esac
    done
    
    echo -e "\n${RED}⏰ Approval request timed out${NC}"
    return 1
}

# Main guard function
sentra_guard() {
    local cmd="$*"
    
    # Log all commands (for analytics)
    log_command "EXECUTED: $cmd"
    
    # Check if command is dangerous
    if is_dangerous_command "$cmd"; then
        echo -e "${RED}🛡️  SENTRA Guard: Potentially dangerous command detected${NC}"
        echo -e "${YELLOW}Command: $cmd${NC}"
        echo ""
        
        # Request approval
        local approval_id
        approval_id=$(request_approval "$cmd")
        
        if [ $? -eq 0 ] && [ -n "$approval_id" ]; then
            echo -e "${BLUE}📱 Approval request sent to your phone${NC}"
            
            # Wait for approval
            if wait_for_approval "$approval_id"; then
                log_command "APPROVED: $approval_id - $cmd"
                echo -e "${GREEN}Executing approved command...${NC}"
                return 0  # Allow command execution
            else
                log_command "DENIED: $approval_id - $cmd"
                echo -e "${RED}Command execution blocked${NC}"
                return 1  # Block command execution
            fi
        else
            echo -e "${YELLOW}⚠️  Could not connect to SENTRA API${NC}"
            echo -e "${YELLOW}Command will be executed without approval${NC}"
            log_command "API_ERROR: $cmd"
            return 0  # Allow execution if API is unavailable
        fi
    fi
    
    return 0  # Command is safe, allow execution
}

# Override common dangerous commands
rm() {
    if sentra_guard "rm $*"; then
        command rm "$@"
    else
        echo "Command blocked by SENTRA Guard"
        return 1
    fi
}

sudo() {
    if sentra_guard "sudo $*"; then
        command sudo "$@"
    else
        echo "Command blocked by SENTRA Guard"
        return 1
    fi
}

# Status check function
sentra-guard-status() {
    echo -e "${BLUE}🛡️  SENTRA Guard Status${NC}"
    echo "Configuration:"
    echo "  API URL: $SENTRA_URL"
    echo "  Machine ID: $SENTRA_MACHINE_ID"
    echo "  Log file: $SENTRA_LOG_FILE"
    echo ""
    
    # Test API connectivity
    if curl -s "$SENTRA_URL/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ API connectivity: OK${NC}"
    else
        echo -e "${RED}❌ API connectivity: FAILED${NC}"
    fi
    
    # Show recent log entries
    if [ -f "$SENTRA_LOG_FILE" ]; then
        echo ""
        echo "Recent activity:"
        tail -5 "$SENTRA_LOG_FILE"
    fi
}

# Test function
sentra-guard-test() {
    echo -e "${BLUE}🧪 Testing SENTRA Guard...${NC}"
    echo "This will trigger the guard system:"
    echo ""
    rm -rf /tmp/sentra-guard-test-$$
}

# Export functions
export -f sentra_guard
export -f sentra-guard-status
export -f sentra-guard-test

# Initialize guard system
if [ -z "${SENTRA_GUARD_INITIALIZED:-}" ]; then
    export SENTRA_GUARD_INITIALIZED=1
    echo -e "${GREEN}🛡️  SENTRA Guard system loaded${NC}"
    echo "Use 'sentra-guard-status' to check status"
    echo "Use 'sentra-guard-test' to test functionality"
fi
EOF

    chmod +x "$USER_HOME/.sentra-guard.sh"
    log_success "SENTRA guard system created"
}

# Create bridge service script
create_bridge_service() {
    log_info "Creating SENTRA bridge service..."
    
    cat > "$BIN_DIR/sentra-bridge.py" << 'EOF'
#!/usr/bin/env python3

"""
SENTRA Bridge Service

This service polls the SENTRA API for pending approvals and handles:
- Command approval requests
- Notification delivery
- Audio playback for approvals
- Automatic command execution after approval
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional

try:
    import httpx
    from openai import OpenAI
except ImportError:
    print("Error: Required dependencies not installed")
    print("Please run: pip install httpx openai")
    sys.exit(1)

# Configuration from environment variables
SENTRA_URL = os.getenv('SENTRA_URL', 'http://localhost:3001')
SENTRA_API_TOKEN = os.getenv('SENTRA_API_TOKEN', 'dev_token_12345')
SENTRA_MACHINE_ID = os.getenv('SENTRA_MACHINE_ID', f"{os.uname().nodename}-{os.getenv('USER', 'unknown')}")
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
LOG_FILE = os.path.expanduser('~/.local/share/sentra/logs/bridge.log')

# Ensure log directory exists
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('sentra-bridge')

class SentraBridge:
    def __init__(self):
        self.client = httpx.AsyncClient(
            base_url=SENTRA_URL,
            headers={'Authorization': f'Bearer {SENTRA_API_TOKEN}'},
            timeout=30.0
        )
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.processed_approvals = set()
        
    async def check_api_connectivity(self) -> bool:
        """Test API connectivity"""
        try:
            response = await self.client.get('/health')
            return response.status_code == 200
        except Exception as e:
            logger.error(f"API connectivity check failed: {e}")
            return False
    
    async def get_pending_approvals(self) -> List[Dict]:
        """Get pending approval requests for this machine"""
        try:
            response = await self.client.get('/api/approvals', params={
                'status': 'pending',
                'machine_id': SENTRA_MACHINE_ID
            })
            
            if response.status_code == 200:
                data = response.json()
                return data.get('approvals', [])
            else:
                logger.warning(f"Failed to get approvals: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting pending approvals: {e}")
            return []
    
    async def get_approved_commands(self) -> List[Dict]:
        """Get recently approved commands that need execution"""
        try:
            response = await self.client.get('/api/approvals', params={
                'status': 'approved',
                'machine_id': SENTRA_MACHINE_ID,
                'limit': 10
            })
            
            if response.status_code == 200:
                data = response.json()
                return data.get('approvals', [])
            else:
                logger.warning(f"Failed to get approved commands: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting approved commands: {e}")
            return []
    
    def generate_speech(self, text: str) -> Optional[str]:
        """Generate speech using OpenAI TTS"""
        if not self.openai_client:
            logger.warning("OpenAI client not configured - skipping TTS")
            return None
        
        try:
            response = self.openai_client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text[:500]  # Limit text length
            )
            
            # Save audio to temp file
            audio_file = f"/tmp/sentra-audio-{int(time.time())}.mp3"
            response.stream_to_file(audio_file)
            return audio_file
            
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            return None
    
    def play_audio(self, audio_file: str):
        """Play audio file using system player"""
        if not os.path.exists(audio_file):
            logger.warning(f"Audio file not found: {audio_file}")
            return
        
        try:
            # Try different audio players based on platform
            import subprocess
            import platform
            
            system = platform.system()
            if system == "Darwin":  # macOS
                subprocess.run(['afplay', audio_file], check=True)
            elif system == "Linux":
                # Try different Linux audio players
                for player in ['paplay', 'aplay', 'mpg123', 'ffplay']:
                    if subprocess.run(['which', player], capture_output=True).returncode == 0:
                        subprocess.run([player, audio_file], check=True)
                        break
            
            # Clean up audio file
            os.remove(audio_file)
            
        except Exception as e:
            logger.error(f"Error playing audio: {e}")
    
    async def handle_approval_notification(self, approval: Dict):
        """Handle notification for new approval request"""
        approval_id = approval.get('id')
        description = approval.get('description', 'Command approval required')
        
        if approval_id in self.processed_approvals:
            return
        
        self.processed_approvals.add(approval_id)
        
        logger.info(f"New approval request: {approval_id}")
        print(f"\n🔔 SENTRA Approval Request")
        print(f"ID: {approval_id}")
        print(f"Description: {description}")
        print(f"Context: {approval.get('context', {})}")
        
        # Generate and play audio notification
        if self.openai_client:
            speech_text = f"SENTRA approval required. {description}"
            audio_file = self.generate_speech(speech_text)
            if audio_file:
                self.play_audio(audio_file)
    
    async def execute_approved_command(self, approval: Dict):
        """Execute an approved command"""
        approval_id = approval.get('id')
        context = approval.get('context', {})
        command = context.get('command')
        
        if not command:
            logger.warning(f"No command found in approval {approval_id}")
            return
        
        logger.info(f"Executing approved command: {command}")
        print(f"\n✅ Executing approved command: {command}")
        
        try:
            import subprocess
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # Log execution result
            await self.client.post(f'/api/approvals/{approval_id}/execution', json={
                'status': 'completed' if result.returncode == 0 else 'failed',
                'return_code': result.returncode,
                'stdout': result.stdout[:1000],  # Limit output size
                'stderr': result.stderr[:1000],
                'executed_at': datetime.utcnow().isoformat()
            })
            
            if result.returncode == 0:
                logger.info(f"Command executed successfully")
                print("Command executed successfully")
            else:
                logger.error(f"Command failed with return code {result.returncode}")
                print(f"Command failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logger.error("Command execution timed out")
            print("Command execution timed out")
        except Exception as e:
            logger.error(f"Error executing command: {e}")
            print(f"Error executing command: {e}")
    
    async def run_polling_loop(self):
        """Main polling loop"""
        logger.info("Starting SENTRA Bridge service")
        logger.info(f"Machine ID: {SENTRA_MACHINE_ID}")
        logger.info(f"API URL: {SENTRA_URL}")
        
        # Test initial connectivity
        if not await self.check_api_connectivity():
            logger.error("Cannot connect to SENTRA API - exiting")
            return
        
        logger.info("API connectivity OK - starting polling loop")
        
        while True:
            try:
                # Check for new pending approvals (for notifications)
                pending_approvals = await self.get_pending_approvals()
                for approval in pending_approvals:
                    await self.handle_approval_notification(approval)
                
                # Check for newly approved commands (for execution)
                approved_commands = await self.get_approved_commands()
                for approval in approved_commands:
                    approval_id = approval.get('id')
                    if (approval_id not in self.processed_approvals and 
                        not approval.get('executed', False)):
                        await self.execute_approved_command(approval)
                
                # Wait before next poll
                await asyncio.sleep(10)
                
            except KeyboardInterrupt:
                logger.info("Received interrupt signal - shutting down")
                break
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                await asyncio.sleep(30)  # Wait longer on error
        
        await self.client.aclose()
        logger.info("SENTRA Bridge service stopped")

async def main():
    """Main entry point"""
    bridge = SentraBridge()
    await bridge.run_polling_loop()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopping SENTRA Bridge service...")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
EOF

    chmod +x "$BIN_DIR/sentra-bridge.py"
    log_success "SENTRA bridge service created"
}

# Create TMUX configuration
create_tmux_config() {
    log_info "Creating enhanced TMUX configuration..."
    
    cat > "$USER_HOME/.tmux.conf" << 'EOF'
# SENTRA Enhanced TMUX Configuration
# Optimized for development workflow with SENTRA integration

# Set prefix to Ctrl-a (easier than Ctrl-b)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Basic settings
set -g default-terminal "screen-256color"
set -g mouse on
set -g history-limit 10000
set -g base-index 1
setw -g pane-base-index 1

# Window and pane management
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind c new-window -c "#{pane_current_path}"

# Pane navigation (Vim-style)
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Pane resizing
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

# Window navigation
bind -n M-Left select-window -p
bind -n M-Right select-window -n

# Copy mode (Vi-style)
setw -g mode-keys vi
bind [ copy-mode
bind -T copy-mode-vi v send -X begin-selection
bind -T copy-mode-vi y send -X copy-selection-and-cancel

# Reload configuration
bind r source-file ~/.tmux.conf \; display "TMUX config reloaded!"

# Status bar configuration
set -g status-position top
set -g status-justify centre
set -g status-style "bg=colour234,fg=colour255"

# Left status: session name and current window
set -g status-left-length 40
set -g status-left "#[fg=colour39]#S #[fg=colour245]#I:#P"

# Right status: SENTRA info, date, time
set -g status-right-length 80
set -g status-right "#[fg=colour39]🚀 SENTRA #[fg=colour245]| #[fg=colour255]%Y-%m-%d %H:%M"

# Window status
setw -g window-status-current-style "bg=colour39,fg=colour234,bold"
setw -g window-status-current-format " #I: #W "
setw -g window-status-style "fg=colour245"
setw -g window-status-format " #I: #W "

# Pane borders
set -g pane-border-style "fg=colour238"
set -g pane-active-border-style "fg=colour39"

# Message style
set -g message-style "bg=colour39,fg=colour234"
set -g message-command-style "bg=colour245,fg=colour234"

# SENTRA-specific key bindings
bind S new-window -n "sentra-monitor" 'npm run evolution:logs'
bind A new-window -n "sentra-api" 'curl -s http://localhost:3001/health | jq .'
bind D new-window -n "sentra-db" 'docker exec -it sentra-evolution-postgres psql -U sentra -d sentra'
bind T new-window -n "sentra-test" 'npm run test:watch'

# Development helpers
bind G new-window -n "git" 'git status'
bind N new-window -n "npm" 'npm run dev'
bind E new-window -n "editor" 'code .'

# Quick pane layouts
bind M-1 select-layout even-horizontal
bind M-2 select-layout even-vertical
bind M-3 select-layout main-horizontal
bind M-4 select-layout main-vertical
bind M-5 select-layout tiled

# Plugin configuration (if tpm is installed)
# set -g @plugin 'tmux-plugins/tpm'
# set -g @plugin 'tmux-plugins/tmux-resurrect'
# set -g @plugin 'tmux-plugins/tmux-continuum'

# Initialize TMUX plugin manager (keep this line at the very bottom)
# run '~/.tmux/plugins/tpm/tpm'

# SENTRA integration indicators
set -g status-interval 5
EOF

    log_success "Enhanced TMUX configuration created"
}

# Create session management utilities
create_session_utilities() {
    log_info "Creating session management utilities..."
    
    # Session manager script
    cat > "$BIN_DIR/sentra-sessions" << 'EOF'
#!/bin/bash

# SENTRA Session Management Utility
# Manage multiple SENTRA development sessions

SESSIONS_DIR="$HOME/.local/share/sentra/sessions"
mkdir -p "$SESSIONS_DIR"

case "${1:-list}" in
    list|ls)
        echo "Active TMUX sessions:"
        tmux list-sessions 2>/dev/null | grep -E "(sentra|SENTRA)" || echo "No SENTRA sessions found"
        
        echo ""
        echo "Saved sessions:"
        ls -1 "$SESSIONS_DIR" 2>/dev/null || echo "No saved sessions"
        ;;
        
    save)
        SESSION_NAME="${2:-$(tmux display-message -p '#S')}"
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            tmux capture-pane -t "$SESSION_NAME" -p > "$SESSIONS_DIR/$SESSION_NAME.session"
            echo "Session '$SESSION_NAME' saved"
        else
            echo "Session '$SESSION_NAME' not found"
        fi
        ;;
        
    restore)
        SESSION_NAME="$2"
        if [ -z "$SESSION_NAME" ]; then
            echo "Usage: sentra-sessions restore <session_name>"
            exit 1
        fi
        
        if [ -f "$SESSIONS_DIR/$SESSION_NAME.session" ]; then
            echo "Restoring session '$SESSION_NAME'..."
            # This is a simplified restore - full session restore would need tmux-resurrect
            sentra-start "$(pwd)" "$SESSION_NAME" "$SESSION_NAME"
        else
            echo "Saved session '$SESSION_NAME' not found"
        fi
        ;;
        
    kill)
        SESSION_NAME="$2"
        if [ -n "$SESSION_NAME" ]; then
            tmux kill-session -t "$SESSION_NAME" 2>/dev/null && echo "Session '$SESSION_NAME' killed"
        else
            echo "Usage: sentra-sessions kill <session_name>"
        fi
        ;;
        
    killall)
        echo "Killing all SENTRA sessions..."
        tmux list-sessions 2>/dev/null | grep -E "(sentra|SENTRA)" | cut -d: -f1 | \
            xargs -I {} tmux kill-session -t {}
        echo "All SENTRA sessions killed"
        ;;
        
    *)
        echo "SENTRA Session Manager"
        echo ""
        echo "Usage: sentra-sessions <command> [args]"
        echo ""
        echo "Commands:"
        echo "  list, ls              List active and saved sessions"
        echo "  save [session_name]   Save current session"
        echo "  restore <session>     Restore saved session"
        echo "  kill <session>        Kill specific session"
        echo "  killall               Kill all SENTRA sessions"
        ;;
esac
EOF

    chmod +x "$BIN_DIR/sentra-sessions"
    
    # Quick launcher script
    cat > "$BIN_DIR/sentra-dev" << 'EOF'
#!/bin/bash

# Quick SENTRA development launcher
# Launches SENTRA with predefined configurations

PROJECT_PATH="${1:-$(pwd)}"
CONFIG="${2:-default}"

case "$CONFIG" in
    api)
        sentra-start "$PROJECT_PATH" "SENTRA-API" "sentra-api-dev"
        ;;
    dashboard)
        sentra-start "$PROJECT_PATH" "SENTRA-Dashboard" "sentra-dash-dev"
        ;;
    mobile)
        sentra-start "$PROJECT_PATH" "SENTRA-Mobile" "sentra-mobile-dev"
        ;;
    fullstack|full)
        sentra-start "$PROJECT_PATH" "SENTRA-FullStack" "sentra-full-dev"
        ;;
    *)
        sentra-start "$PROJECT_PATH" "SENTRA-Dev" "sentra-default-dev"
        ;;
esac
EOF

    chmod +x "$BIN_DIR/sentra-dev"
    
    log_success "Session management utilities created"
}

# Setup shell integration
setup_shell_integration() {
    log_info "Setting up shell integration..."
    
    # Determine shell configuration file
    SHELL_NAME=$(basename "$SHELL")
    case "$SHELL_NAME" in
        bash)
            SHELL_CONFIG="$USER_HOME/.bashrc"
            ;;
        zsh)
            SHELL_CONFIG="$USER_HOME/.zshrc"
            ;;
        fish)
            SHELL_CONFIG="$USER_HOME/.config/fish/config.fish"
            log_warning "Fish shell detected - manual configuration may be needed"
            ;;
        *)
            SHELL_CONFIG="$USER_HOME/.profile"
            log_warning "Unknown shell - using .profile"
            ;;
    esac
    
    # Add SENTRA configuration to shell
    if ! grep -q "# SENTRA TMUX Integration" "$SHELL_CONFIG" 2>/dev/null; then
        cat >> "$SHELL_CONFIG" << EOF

# SENTRA TMUX Integration
export PATH="\$HOME/bin:\$PATH"

# SENTRA environment variables
export SENTRA_CONFIG_DIR="\$HOME/.config/sentra"
export SENTRA_LOG_DIR="\$HOME/.local/share/sentra/logs"

# Load SENTRA guard system
if [[ -f ~/.sentra-guard.sh ]] && [[ -z "\${SENTRA_GUARD_LOADED}" ]]; then
    source ~/.sentra-guard.sh
    export SENTRA_GUARD_LOADED=1
fi

# SENTRA aliases and functions
alias sentra-start='sentra-start'
alias sentra-dev='sentra-dev'
alias sentra-sessions='sentra-sessions'
alias sentra-guard-status='sentra-guard-status'

# Quick SENTRA functions
sentra-quick() {
    local project_path="\${1:-\$(pwd)}"
    sentra-start "\$project_path" "SENTRA-Quick" "quick-\$(date +%s)"
}

sentra-monitor() {
    tmux new-session -d -s sentra-monitor -c "\$(pwd)" \
        'watch -n 2 "curl -s http://localhost:3001/health | jq ."'
}

# Auto-completion (basic)
if [[ \$SHELL == *"bash"* ]]; then
    complete -W "development production development-minimal" sentra-start
    complete -W "list save restore kill killall" sentra-sessions
    complete -W "api dashboard mobile fullstack" sentra-dev
fi
EOF
        
        log_success "Shell integration configured in $SHELL_CONFIG"
        log_info "Restart your shell or run: source $SHELL_CONFIG"
    else
        log_success "Shell integration already configured"
    fi
}

# Main installation function
main() {
    echo "==========================================="
    echo "   SENTRA TMUX Integration Setup"
    echo "==========================================="
    echo ""
    
    log_info "Platform: $PLATFORM"
    log_info "Setting up comprehensive TMUX development environment..."
    echo ""
    
    # Run setup steps
    setup_directories
    install_tmux
    create_tmux_startup_script
    create_guard_system
    create_bridge_service
    create_tmux_config
    create_session_utilities
    setup_shell_integration
    
    echo ""
    log_success "SENTRA TMUX integration setup complete!"
    echo ""
    echo "🚀 Available Commands:"
    echo "  sentra-start <path> [name] [session]  - Start comprehensive dev environment"
    echo "  sentra-dev <path> [config]            - Quick development launcher"
    echo "  sentra-sessions <command>             - Session management"
    echo "  sentra-guard-status                   - Check guard system status"
    echo "  sentra-bridge.py                      - Start approval bridge service"
    echo ""
    echo "📖 Usage Examples:"
    echo "  sentra-start ~/Projects/sentra-evolutionary SentraEvo"
    echo "  sentra-dev ~/Projects/my-app api"
    echo "  sentra-sessions list"
    echo ""
    echo "🛡️  Guard System:"
    echo "  The guard system monitors dangerous commands and requests approval"
    echo "  Restart your shell to activate: source ~/.bashrc (or ~/.zshrc)"
    echo ""
    echo "🔧 Configuration:"
    echo "  TMUX config: ~/.tmux.conf"
    echo "  Guard system: ~/.sentra-guard.sh" 
    echo "  Bridge service: ~/bin/sentra-bridge.py"
    echo "  Session data: ~/.local/share/sentra/"
    echo ""
    log_info "For full functionality, ensure SENTRA API is running and configured"
    
}

# Run main setup
main "$@"