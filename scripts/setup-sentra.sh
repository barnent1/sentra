#!/bin/bash

# SENTRA Evolutionary Agent System - Setup Script
# This script automates the installation and setup process for different environments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SETUP_MODE="${1:-development}"
PLATFORM="$(uname -s)"

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

# Check system requirements
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Check OS
    case "$PLATFORM" in
        Darwin)
            log_success "macOS detected"
            ;;
        Linux)
            log_success "Linux detected"
            ;;
        *)
            log_error "Unsupported operating system: $PLATFORM"
            exit 1
            ;;
    esac
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_NODE_VERSION="18.0.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE_VERSION" ]; then
            log_success "Node.js $NODE_VERSION (>= $REQUIRED_NODE_VERSION)"
        else
            log_error "Node.js >= $REQUIRED_NODE_VERSION required, found $NODE_VERSION"
            exit 1
        fi
    else
        log_error "Node.js not found. Please install Node.js >= 18.0.0"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION"
    else
        log_error "npm not found"
        exit 1
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker $DOCKER_VERSION"
    else
        log_warning "Docker not found. Required for full functionality"
        if [ "$SETUP_MODE" != "development-minimal" ]; then
            exit 1
        fi
    fi
    
    # Check Python for FastAPI backend
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        log_success "Python $PYTHON_VERSION"
    else
        log_error "Python 3 not found. Required for FastAPI backend"
        exit 1
    fi
}

# Install system dependencies
install_system_dependencies() {
    log_info "Installing system dependencies..."
    
    case "$PLATFORM" in
        Darwin)
            if ! command_exists brew; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            log_info "Installing macOS dependencies..."
            brew install tmux postgresql@14 redis
            
            if ! command_exists docker; then
                log_info "Installing Docker Desktop..."
                brew install --cask docker
                log_warning "Please start Docker Desktop manually before continuing"
                read -p "Press Enter when Docker Desktop is running..."
            fi
            ;;
            
        Linux)
            # Detect Linux distribution
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                DISTRO=$ID
            else
                log_error "Cannot detect Linux distribution"
                exit 1
            fi
            
            case "$DISTRO" in
                ubuntu|debian)
                    log_info "Installing Ubuntu/Debian dependencies..."
                    sudo apt update
                    sudo apt install -y tmux postgresql-client-14 redis-tools curl wget
                    
                    if ! command_exists docker; then
                        log_info "Installing Docker..."
                        curl -fsSL https://get.docker.com | sudo sh
                        sudo usermod -aG docker $USER
                        log_warning "Please log out and log back in to use Docker without sudo"
                    fi
                    ;;
                    
                centos|rhel|fedora)
                    log_info "Installing RHEL/CentOS/Fedora dependencies..."
                    sudo yum install -y tmux postgresql redis curl wget
                    
                    if ! command_exists docker; then
                        log_info "Installing Docker..."
                        curl -fsSL https://get.docker.com | sudo sh
                        sudo systemctl start docker
                        sudo systemctl enable docker
                        sudo usermod -aG docker $USER
                    fi
                    ;;
                    
                *)
                    log_error "Unsupported Linux distribution: $DISTRO"
                    exit 1
                    ;;
            esac
            ;;
    esac
}

# Setup project environment
setup_project_environment() {
    log_info "Setting up project environment..."
    
    cd "$PROJECT_ROOT"
    
    # Install Node.js dependencies
    log_info "Installing Node.js dependencies..."
    npm install
    
    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies..."
        if command_exists pip3; then
            pip3 install -r requirements.txt
        else
            python3 -m pip install -r requirements.txt
        fi
    fi
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        log_info "Creating environment file..."
        if [ "$SETUP_MODE" = "production" ]; then
            cp .env.production.example .env
        else
            cp .env.example .env
        fi
        
        log_warning "Please edit .env file with your configuration"
        echo "Key settings to configure:"
        echo "- OPENAI_API_KEY: Your OpenAI API key"
        echo "- PUSHOVER_APP_TOKEN: Your Pushover app token"
        echo "- PUSHOVER_USER_KEY: Your Pushover user key"
        echo "- SENTRA_API_TOKEN: Generate a secure random token"
        echo "- Database passwords: Use secure passwords"
        
        read -p "Press Enter when you've configured the .env file..."
    else
        log_success ".env file already exists"
    fi
}

# Setup development environment
setup_development_environment() {
    log_info "Setting up development environment..."
    
    cd "$PROJECT_ROOT"
    
    # Build all packages
    log_info "Building packages..."
    npm run build
    
    # Setup database (development)
    log_info "Starting development services..."
    if command_exists docker; then
        # Start PostgreSQL with pgvector
        docker-compose -f docker-compose.evolution.yml up -d postgres
        
        # Wait for database to be ready
        log_info "Waiting for database to be ready..."
        sleep 10
        
        # Run database migrations
        log_info "Running database migrations..."
        npm run db:migrate || log_warning "Database migration failed - may need manual setup"
        
        # Start all development services
        log_info "Starting all development services..."
        npm run evolution:up
        
    else
        log_warning "Docker not available - manual database setup required"
    fi
}

# Setup production environment
setup_production_environment() {
    log_info "Setting up production environment..."
    
    cd "$PROJECT_ROOT"
    
    # Build for production
    log_info "Building for production..."
    npm run build
    
    # Setup SSL certificates (if domain is configured)
    if [ -n "${DOMAIN:-}" ]; then
        log_info "Setting up SSL certificates..."
        if command_exists certbot; then
            sudo certbot certonly --standalone -d "$DOMAIN" --email "${LETSENCRYPT_EMAIL:-admin@$DOMAIN}" --agree-tos --non-interactive
        else
            log_warning "Certbot not found - SSL certificates need manual setup"
        fi
    fi
    
    # Deploy with Docker Compose
    log_info "Deploying production services..."
    docker-compose -f deployment/docker-compose.production.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Run production database migrations
    log_info "Running production database migrations..."
    docker exec -it sentra-api-prod npm run db:migrate:prod || log_warning "Production migration failed"
}

# Setup TMUX integration
setup_tmux_integration() {
    log_info "Setting up TMUX integration..."
    
    # Copy TMUX scripts
    sudo cp "$PROJECT_ROOT/scripts/sentra-start" /usr/local/bin/ 2>/dev/null || cp "$PROJECT_ROOT/scripts/sentra-start" "$HOME/bin/"
    sudo cp "$PROJECT_ROOT/scripts/sentra-bridge.py" /usr/local/bin/ 2>/dev/null || cp "$PROJECT_ROOT/scripts/sentra-bridge.py" "$HOME/bin/"
    cp "$PROJECT_ROOT/scripts/sentra-guard.sh" "$HOME/.sentra-guard.sh"
    
    # Make scripts executable
    chmod +x /usr/local/bin/sentra-start 2>/dev/null || chmod +x "$HOME/bin/sentra-start"
    chmod +x /usr/local/bin/sentra-bridge.py 2>/dev/null || chmod +x "$HOME/bin/sentra-bridge.py"
    chmod +x "$HOME/.sentra-guard.sh"
    
    # Add to PATH if needed
    if ! echo "$PATH" | grep -q "$HOME/bin"; then
        echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
        echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
    fi
    
    # Add guard to shell initialization
    if ! grep -q "sentra-guard" "$HOME/.bashrc" 2>/dev/null; then
        echo '# SENTRA Guard Integration' >> "$HOME/.bashrc"
        echo 'if [[ -f ~/.sentra-guard.sh ]]; then' >> "$HOME/.bashrc"
        echo '    source ~/.sentra-guard.sh' >> "$HOME/.bashrc"
        echo 'fi' >> "$HOME/.bashrc"
    fi
    
    if [ -f "$HOME/.zshrc" ] && ! grep -q "sentra-guard" "$HOME/.zshrc"; then
        echo '# SENTRA Guard Integration' >> "$HOME/.zshrc"
        echo 'if [[ -f ~/.sentra-guard.sh ]]; then' >> "$HOME/.zshrc"
        echo '    source ~/.sentra-guard.sh' >> "$HOME/.zshrc"
        echo 'fi' >> "$HOME/.zshrc"
    fi
    
    log_success "TMUX integration setup complete"
    log_info "Usage: sentra-start /path/to/project ProjectName"
}

# Setup bridge service
setup_bridge_service() {
    log_info "Setting up bridge service..."
    
    case "$PLATFORM" in
        Darwin)
            # macOS launchd service
            cat > "$HOME/Library/LaunchAgents/com.sentra.bridge.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sentra.bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>$(echo $HOME)/bin/sentra-bridge.py</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>SENTRA_URL</key>
        <string>\${SENTRA_PUBLIC_URL}</string>
        <key>SENTRA_API_TOKEN</key>
        <string>\${SENTRA_API_TOKEN}</string>
        <key>SENTRA_MACHINE_ID</key>
        <string>$(hostname)-$(whoami)</string>
        <key>OPENAI_API_KEY</key>
        <string>\${OPENAI_API_KEY}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$(echo $HOME)/.sentra-bridge.log</string>
    <key>StandardErrorPath</key>
    <string>$(echo $HOME)/.sentra-bridge-error.log</string>
</dict>
</plist>
EOF
            
            launchctl load "$HOME/Library/LaunchAgents/com.sentra.bridge.plist"
            log_success "macOS bridge service configured"
            ;;
            
        Linux)
            # systemd user service
            mkdir -p "$HOME/.config/systemd/user"
            
            cat > "$HOME/.config/systemd/user/sentra-bridge.service" << EOF
[Unit]
Description=Sentra Bridge Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 %h/bin/sentra-bridge.py
Environment=SENTRA_URL=\${SENTRA_PUBLIC_URL}
Environment=SENTRA_API_TOKEN=\${SENTRA_API_TOKEN}
Environment=SENTRA_MACHINE_ID=$(hostname)-$(whoami)
Environment=OPENAI_API_KEY=\${OPENAI_API_KEY}
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF
            
            systemctl --user daemon-reload
            systemctl --user enable sentra-bridge
            systemctl --user start sentra-bridge
            log_success "Linux bridge service configured"
            ;;
    esac
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."
    
    cd "$PROJECT_ROOT"
    
    # Check if services are running
    if [ "$SETUP_MODE" = "development" ]; then
        # Development verification
        log_info "Checking development services..."
        
        # Check if containers are running
        if command_exists docker; then
            if docker-compose -f docker-compose.evolution.yml ps | grep -q "Up"; then
                log_success "Development containers are running"
            else
                log_error "Development containers not running"
            fi
        fi
        
        # Check service endpoints
        sleep 5
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            log_success "API service is responding"
        else
            log_warning "API service not responding - may still be starting"
        fi
        
        if curl -s http://localhost:3000/ > /dev/null 2>&1; then
            log_success "Dashboard is accessible"
        else
            log_warning "Dashboard not accessible - may still be starting"
        fi
        
    elif [ "$SETUP_MODE" = "production" ]; then
        # Production verification
        log_info "Checking production services..."
        
        if docker ps | grep -q "sentra.*Up"; then
            log_success "Production containers are running"
        else
            log_error "Production containers not running"
        fi
        
        # Check production endpoints
        if [ -n "${SENTRA_PUBLIC_URL:-}" ]; then
            if curl -s "$SENTRA_PUBLIC_URL/health" > /dev/null 2>&1; then
                log_success "Production API is responding"
            else
                log_warning "Production API not responding"
            fi
        fi
    fi
    
    # Check TMUX integration
    if command_exists sentra-start; then
        log_success "TMUX integration installed"
    else
        log_warning "TMUX integration not found in PATH"
    fi
    
    # Check bridge service
    case "$PLATFORM" in
        Darwin)
            if launchctl list | grep -q "com.sentra.bridge"; then
                log_success "Bridge service is running (macOS)"
            else
                log_warning "Bridge service not running"
            fi
            ;;
        Linux)
            if systemctl --user is-active --quiet sentra-bridge; then
                log_success "Bridge service is running (Linux)"
            else
                log_warning "Bridge service not running"
            fi
            ;;
    esac
}

# Print next steps
print_next_steps() {
    log_success "SENTRA setup complete!"
    echo ""
    echo "Next steps:"
    echo ""
    
    if [ "$SETUP_MODE" = "development" ]; then
        echo "Development Environment:"
        echo "  • Dashboard: http://localhost:3000"
        echo "  • API: http://localhost:3001"
        echo "  • Mobile PWA: http://localhost:3002"
        echo "  • Database: localhost:5433"
        echo ""
        echo "Development Commands:"
        echo "  • Start TMUX session: sentra-start $PROJECT_ROOT SentraEvo"
        echo "  • View logs: npm run evolution:logs"
        echo "  • Run tests: npm run test"
        echo "  • Stop services: npm run evolution:down"
        
    elif [ "$SETUP_MODE" = "production" ]; then
        echo "Production Environment:"
        if [ -n "${SENTRA_PUBLIC_URL:-}" ]; then
            echo "  • Application: $SENTRA_PUBLIC_URL"
            echo "  • API: $SENTRA_PUBLIC_URL/api"
        fi
        echo ""
        echo "Production Commands:"
        echo "  • View logs: docker-compose -f deployment/docker-compose.production.yml logs -f"
        echo "  • Restart services: docker-compose -f deployment/docker-compose.production.yml restart"
        echo "  • Update deployment: ./deployment/scripts/deploy.sh"
    fi
    
    echo ""
    echo "TMUX Integration:"
    echo "  • Start development session: sentra-start /path/to/project ProjectName"
    echo "  • Guard system: Automatic command monitoring and approval"
    echo "  • Bridge service: Handles approvals and notifications"
    echo ""
    echo "Configuration:"
    echo "  • Environment file: .env (edit for your settings)"
    echo "  • API keys: Configure OpenAI and Pushover in .env"
    echo "  • Database: PostgreSQL with pgvector extension"
    echo ""
    echo "Documentation:"
    echo "  • Installation Guide: docs/INSTALLATION_GUIDE.md"
    echo "  • Development Guide: docs/DEVELOPMENT_GUIDE.md"
    echo "  • API Documentation: docs/API_DOCUMENTATION.md"
    echo "  • TMUX Usage: TMUX_USAGE_GUIDE.md"
    echo ""
    log_info "For support, check the documentation or create an issue on GitHub"
}

# Main setup function
main() {
    echo "=========================================="
    echo "  SENTRA Evolutionary Agent System Setup"
    echo "=========================================="
    echo ""
    
    case "$SETUP_MODE" in
        development|dev)
            log_info "Setting up DEVELOPMENT environment"
            SETUP_MODE="development"
            ;;
        production|prod)
            log_info "Setting up PRODUCTION environment"
            SETUP_MODE="production"
            ;;
        development-minimal|dev-minimal)
            log_info "Setting up MINIMAL DEVELOPMENT environment (no Docker)"
            SETUP_MODE="development-minimal"
            ;;
        *)
            log_error "Invalid setup mode. Use: development, production, or development-minimal"
            exit 1
            ;;
    esac
    
    echo ""
    
    # Run setup steps
    check_system_requirements
    install_system_dependencies
    setup_project_environment
    
    if [ "$SETUP_MODE" = "development" ] || [ "$SETUP_MODE" = "development-minimal" ]; then
        setup_development_environment
    elif [ "$SETUP_MODE" = "production" ]; then
        setup_production_environment
    fi
    
    setup_tmux_integration
    setup_bridge_service
    
    # Verify and finish
    verify_installation
    print_next_steps
    
    echo ""
    log_success "Setup completed successfully!"
}

# Handle script arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [development|production|development-minimal]"
    echo ""
    echo "Setup modes:"
    echo "  development         - Full development setup with Docker"
    echo "  production         - Production deployment setup"
    echo "  development-minimal - Development without Docker (limited functionality)"
    echo ""
    exit 1
fi

# Run main setup
main "$@"