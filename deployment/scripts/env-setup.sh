#!/bin/bash

# SENTRA Environment Configuration Setup Script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$DEPLOYMENT_DIR/.." && pwd)"
ENV_DIR="$DEPLOYMENT_DIR/env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Generate secure random passwords
generate_password() {
    local length="${1:-32}"
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -hex 64
}

# Interactive environment setup
setup_environment() {
    local env_name="$1"
    local env_file="$ENV_DIR/.env.$env_name"
    
    log "Setting up $env_name environment configuration..."
    
    if [[ -f "$env_file" ]]; then
        read -p "Environment file $env_file already exists. Overwrite? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Skipping $env_name environment setup"
            return
        fi
    fi
    
    case "$env_name" in
        "production")
            setup_production_env "$env_file"
            ;;
        "staging")
            setup_staging_env "$env_file"
            ;;
        "local")
            setup_local_env "$env_file"
            ;;
        *)
            error "Unknown environment: $env_name"
            exit 1
            ;;
    esac
    
    success "$env_name environment configuration created at $env_file"
}

# Setup production environment
setup_production_env() {
    local env_file="$1"
    
    echo "# Production Environment - Generated on $(date)" > "$env_file"
    
    # Domain configuration
    read -p "Enter your production domain (e.g., sentra.example.com): " -r domain
    read -p "Enter your email for Let's Encrypt SSL certificates: " -r ssl_email
    
    # Database configuration
    local db_password=$(generate_password 24)
    local redis_password=$(generate_password 16)
    local api_token=$(generate_password 32)
    local jwt_secret=$(generate_jwt_secret)
    local grafana_password=$(generate_password 16)
    
    # External services
    read -p "Enter your OpenAI API key (optional): " -r openai_key
    read -p "Enter your Pushover App Token (optional): " -r pushover_app
    read -p "Enter your Pushover User Key (optional): " -r pushover_user
    read -p "Enter alert email address: " -r alert_email
    read -p "Enter Slack webhook URL for alerts (optional): " -r webhook_url
    
    # Write configuration
    cat >> "$env_file" << EOF

# Domain Configuration
DOMAIN=$domain
ROOT_URL=https://$domain
SENTRA_PUBLIC_URL=https://$domain

# Database Configuration
POSTGRES_USER=sentra_prod
POSTGRES_PASSWORD=$db_password
POSTGRES_DB=sentra_production
DATABASE_URL=postgresql://sentra_prod:$db_password@postgres:5432/sentra_production

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=$redis_password

# API Configuration
SENTRA_API_TOKEN=$api_token
JWT_SECRET=$jwt_secret

# External Services
OPENAI_API_KEY=$openai_key
PUSHOVER_APP_TOKEN=$pushover_app
PUSHOVER_USER_KEY=$pushover_user

# SSL Configuration
LETSENCRYPT_EMAIL=$ssl_email

# Monitoring and Alerts
ALERT_EMAIL=$alert_email
ALERT_WEBHOOK=$webhook_url
GRAFANA_PASSWORD=$grafana_password

# Application Configuration
NODE_ENV=production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://$domain,https://api.$domain,https://mobile.$domain
ALLOWED_HOSTS=$domain,api.$domain,mobile.$domain

# Performance
MAX_REQUEST_SIZE=50mb
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000

# File Storage
DATA_PATH=/var/sentra
BACKUP_PATH=/var/sentra/backups

# Docker Configuration
COMPOSE_PROJECT_NAME=sentra-prod
EOF
}

# Setup staging environment
setup_staging_env() {
    local env_file="$1"
    
    echo "# Staging Environment - Generated on $(date)" > "$env_file"
    
    read -p "Enter staging domain (e.g., staging.sentra.example.com): " -r staging_domain
    
    local db_password="staging_$(generate_password 16)"
    local api_token="staging_$(generate_password 16)"
    local jwt_secret=$(generate_jwt_secret)
    
    cat >> "$env_file" << EOF

# Domain Configuration  
DOMAIN=$staging_domain
ROOT_URL=http://$staging_domain:8080
SENTRA_PUBLIC_URL=http://$staging_domain:8080

# Database Configuration
POSTGRES_USER=sentra_staging
POSTGRES_PASSWORD=$db_password
POSTGRES_DB=sentra_staging
DATABASE_URL=postgresql://sentra_staging:$db_password@postgres:5432/sentra_staging

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=staging_redis

# API Configuration
SENTRA_API_TOKEN=$api_token
JWT_SECRET=$jwt_secret

# External Services (test keys)
OPENAI_API_KEY=
PUSHOVER_APP_TOKEN=
PUSHOVER_USER_KEY=

# Application Configuration
NODE_ENV=staging
ENVIRONMENT=staging
DEBUG=true
LOG_LEVEL=debug

# Security (permissive for testing)
CORS_ORIGIN=*
ALLOWED_HOSTS=*

# Performance
MAX_REQUEST_SIZE=100mb
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=10000

# Docker Configuration
COMPOSE_PROJECT_NAME=sentra-staging
EOF
}

# Setup local development environment
setup_local_env() {
    local env_file="$1"
    
    echo "# Local Development Environment - Generated on $(date)" > "$env_file"
    
    cat >> "$env_file" << EOF

# Domain Configuration
DOMAIN=localhost
ROOT_URL=http://localhost:3000
SENTRA_PUBLIC_URL=http://localhost:8000

# Database Configuration
POSTGRES_USER=sentra_dev
POSTGRES_PASSWORD=dev_password_123
POSTGRES_DB=sentra_development
DATABASE_URL=postgresql://sentra_dev:dev_password_123@localhost:5432/sentra_development

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# API Configuration
SENTRA_API_TOKEN=dev_api_token_123
JWT_SECRET=dev_jwt_secret_key_123_$(generate_password 16)

# External Services
OPENAI_API_KEY=
PUSHOVER_APP_TOKEN=
PUSHOVER_USER_KEY=

# Application Configuration
NODE_ENV=development
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug

# Security (very permissive)
CORS_ORIGIN=*
ALLOWED_HOSTS=*

# Performance (no restrictions)
MAX_REQUEST_SIZE=1GB
RATE_LIMIT_WINDOW=1000
RATE_LIMIT_MAX=1000000

# File Storage
DATA_PATH=./data
BACKUP_PATH=./data/backups

# Docker Configuration
COMPOSE_PROJECT_NAME=sentra-dev

# Development Tools
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
VITE_HMR_PORT=3100
EOF
}

# Validate environment configuration
validate_environment() {
    local env_name="$1"
    local env_file="$ENV_DIR/.env.$env_name"
    
    log "Validating $env_name environment configuration..."
    
    if [[ ! -f "$env_file" ]]; then
        error "Environment file $env_file not found"
        return 1
    fi
    
    # Load environment and check required variables
    set -a
    source "$env_file"
    set +a
    
    local required_vars=("DOMAIN" "DATABASE_URL" "SENTRA_API_TOKEN" "JWT_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required variable $var is not set in $env_file"
            return 1
        fi
    done
    
    # Environment-specific validation
    if [[ "$env_name" == "production" ]]; then
        local prod_required=("LETSENCRYPT_EMAIL" "POSTGRES_PASSWORD")
        for var in "${prod_required[@]}"; do
            if [[ -z "${!var:-}" ]]; then
                error "Production required variable $var is not set"
                return 1
            fi
        done
        
        # Check for secure passwords
        if [[ ${#POSTGRES_PASSWORD} -lt 16 ]]; then
            warning "PostgreSQL password should be at least 16 characters long"
        fi
        
        if [[ "$POSTGRES_PASSWORD" == *"CHANGE_THIS"* ]]; then
            error "Default passwords detected. Please run setup to generate secure passwords."
            return 1
        fi
    fi
    
    success "$env_name environment configuration is valid"
}

# Copy environment to project root
link_environment() {
    local env_name="$1"
    local env_file="$ENV_DIR/.env.$env_name"
    local target_file="$PROJECT_ROOT/.env"
    
    if [[ ! -f "$env_file" ]]; then
        error "Environment file $env_file not found"
        return 1
    fi
    
    log "Linking $env_name environment to project root..."
    
    # Backup existing .env if it exists
    if [[ -f "$target_file" ]]; then
        cp "$target_file" "$target_file.backup.$(date +%s)"
        warning "Existing .env backed up"
    fi
    
    # Copy environment file
    cp "$env_file" "$target_file"
    
    success "Environment $env_name linked to $target_file"
}

# Show environment status
show_status() {
    log "Environment Configuration Status:"
    
    local environments=("production" "staging" "local")
    
    for env in "${environments[@]}"; do
        local env_file="$ENV_DIR/.env.$env"
        if [[ -f "$env_file" ]]; then
            echo -e "  ${GREEN}✓${NC} $env: $env_file"
            
            # Show key configuration
            source "$env_file" 2>/dev/null || true
            echo "    Domain: ${DOMAIN:-not set}"
            echo "    Database: ${POSTGRES_DB:-not set}"
            echo "    Environment: ${ENVIRONMENT:-not set}"
            echo ""
        else
            echo -e "  ${RED}✗${NC} $env: Not configured"
        fi
    done
    
    # Show current project environment
    local current_env="$PROJECT_ROOT/.env"
    if [[ -f "$current_env" ]]; then
        echo -e "Current project environment: ${GREEN}Active${NC}"
        source "$current_env" 2>/dev/null || true
        echo "  Environment: ${ENVIRONMENT:-unknown}"
        echo "  Domain: ${DOMAIN:-unknown}"
    else
        echo -e "Current project environment: ${RED}Not configured${NC}"
    fi
}

# Main function
main() {
    local command="${1:-help}"
    
    case "$command" in
        "setup")
            local env_name="${2:-}"
            if [[ -z "$env_name" ]]; then
                error "Please specify environment: production, staging, or local"
                exit 1
            fi
            setup_environment "$env_name"
            ;;
        "validate")
            local env_name="${2:-}"
            if [[ -z "$env_name" ]]; then
                error "Please specify environment to validate"
                exit 1
            fi
            validate_environment "$env_name"
            ;;
        "link")
            local env_name="${2:-}"
            if [[ -z "$env_name" ]]; then
                error "Please specify environment to link"
                exit 1
            fi
            link_environment "$env_name"
            ;;
        "status")
            show_status
            ;;
        "init")
            log "Initializing all environments..."
            setup_environment "local"
            setup_environment "staging"
            setup_environment "production"
            link_environment "local"
            ;;
        "help")
            echo "SENTRA Environment Configuration Setup"
            echo ""
            echo "Usage: $0 <command> [environment]"
            echo ""
            echo "Commands:"
            echo "  setup <env>     - Setup environment configuration (production, staging, local)"
            echo "  validate <env>  - Validate environment configuration"
            echo "  link <env>      - Link environment to project root .env"
            echo "  status          - Show status of all environments"
            echo "  init            - Initialize all environments and link local"
            echo "  help            - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 setup production"
            echo "  $0 validate staging"
            echo "  $0 link local"
            echo "  $0 status"
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi