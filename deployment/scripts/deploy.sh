#!/bin/bash

# SENTRA MUP-style Zero-Downtime Deployment Script
# Inspired by Meteor Up (MUP) deployment patterns

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Load environment configuration
load_env() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        log "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
    else
        error "Environment file $env_file not found"
        exit 1
    fi
}

# Validate deployment prerequisites
validate_prerequisites() {
    log "Validating deployment prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if required environment variables are set
    local required_vars=("DOMAIN" "POSTGRES_PASSWORD" "LETSENCRYPT_EMAIL")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if deployment directory exists
    if [[ ! -d "$DEPLOYMENT_DIR" ]]; then
        error "Deployment directory $DEPLOYMENT_DIR not found"
        exit 1
    fi
    
    success "Prerequisites validated"
}

# Build all packages
build_packages() {
    log "Building all packages..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    npm run clean
    
    # Install dependencies
    npm ci --only=production
    
    # Build all packages
    npm run build
    
    success "All packages built successfully"
}

# Create deployment bundle
create_bundle() {
    local bundle_name="sentra-$(date +%s).tar.gz"
    local bundle_path="/tmp/$bundle_name"
    
    log "Creating deployment bundle: $bundle_name"
    
    cd "$PROJECT_ROOT"
    
    # Create bundle excluding unnecessary files
    tar -czf "$bundle_path" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="*.log" \
        --exclude=".env" \
        --exclude="coverage" \
        --exclude=".nyc_output" \
        --exclude="dist" \
        .
    
    echo "$bundle_path"
}

# Zero-downtime deployment strategy
deploy_with_zero_downtime() {
    local environment="$1"
    local compose_file="$DEPLOYMENT_DIR/docker-compose.$environment.yml"
    
    log "Starting zero-downtime deployment for $environment environment"
    
    if [[ ! -f "$compose_file" ]]; then
        error "Docker Compose file not found: $compose_file"
        exit 1
    fi
    
    # Generate unique deployment ID
    local deployment_id="deploy-$(date +%s)"
    
    # Create backup of current environment file
    cp "$DEPLOYMENT_DIR/env/.env.$environment" "$DEPLOYMENT_DIR/env/.env.$environment.backup-$deployment_id"
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$compose_file" pull
    
    # Build new images
    log "Building application images..."
    docker-compose -f "$compose_file" build --no-cache
    
    if [[ "$environment" == "production" ]]; then
        deploy_production_zero_downtime "$compose_file" "$deployment_id"
    else
        deploy_staging "$compose_file"
    fi
    
    success "Zero-downtime deployment completed successfully"
}

# Production zero-downtime deployment
deploy_production_zero_downtime() {
    local compose_file="$1"
    local deployment_id="$2"
    
    log "Executing production zero-downtime deployment..."
    
    # Step 1: Start new instances of API services (blue-green deployment)
    log "Starting new API instances..."
    docker-compose -f "$compose_file" up -d --scale api=2 --no-recreate postgres redis
    
    # Wait for new instances to be healthy
    log "Waiting for new API instances to become healthy..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$compose_file" ps | grep -q "Up (healthy).*api"; then
            log "API instances are healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "API instances failed to become healthy within timeout"
            rollback_deployment "$compose_file" "$deployment_id"
            exit 1
        fi
        
        log "Waiting for API health check... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Step 2: Update frontend services
    log "Updating frontend services..."
    docker-compose -f "$compose_file" up -d --force-recreate dashboard mobile
    
    # Step 3: Update nginx configuration and reload
    log "Reloading nginx configuration..."
    docker-compose -f "$compose_file" exec nginx nginx -s reload
    
    # Step 4: Scale down to desired number of API instances
    log "Scaling API instances to desired count..."
    docker-compose -f "$compose_file" up -d --scale api=1
    
    # Step 5: Clean up old images
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    # Step 6: Run post-deployment health checks
    run_health_checks "$compose_file"
}

# Staging deployment (simpler, can have brief downtime)
deploy_staging() {
    local compose_file="$1"
    
    log "Deploying to staging environment..."
    
    # Stop existing services
    docker-compose -f "$compose_file" down
    
    # Start all services
    docker-compose -f "$compose_file" up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Run health checks
    run_health_checks "$compose_file"
}

# Run comprehensive health checks
run_health_checks() {
    local compose_file="$1"
    
    log "Running post-deployment health checks..."
    
    # Check if all services are running
    local failed_services=""
    local services=("postgres" "api" "dashboard" "mobile" "nginx" "redis")
    
    for service in "${services[@]}"; do
        if ! docker-compose -f "$compose_file" ps "$service" | grep -q "Up"; then
            failed_services="$failed_services $service"
        fi
    done
    
    if [[ -n "$failed_services" ]]; then
        error "The following services failed to start:$failed_services"
        return 1
    fi
    
    # Test API endpoint
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost/api/health" >/dev/null; then
            success "API health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "API health check failed"
            return 1
        fi
        
        log "API health check attempt $attempt/$max_attempts"
        sleep 5
        ((attempt++))
    done
    
    # Test frontend accessibility
    if curl -f -s "http://localhost/" >/dev/null; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    success "All health checks passed"
    return 0
}

# Rollback deployment
rollback_deployment() {
    local compose_file="$1"
    local deployment_id="$2"
    
    error "Deployment failed. Initiating rollback..."
    
    # Restore previous environment file
    if [[ -f "$DEPLOYMENT_DIR/env/.env.production.backup-$deployment_id" ]]; then
        cp "$DEPLOYMENT_DIR/env/.env.production.backup-$deployment_id" "$DEPLOYMENT_DIR/env/.env.production"
    fi
    
    # Rollback to previous version
    docker-compose -f "$compose_file" down
    docker-compose -f "$compose_file" up -d
    
    warning "Rollback completed. Please investigate the deployment failure."
}

# Database migration
run_database_migration() {
    local environment="$1"
    local compose_file="$DEPLOYMENT_DIR/docker-compose.$environment.yml"
    
    log "Running database migrations for $environment..."
    
    # Wait for database to be ready
    docker-compose -f "$compose_file" exec -T postgres pg_isready
    
    # Run migrations
    docker-compose -f "$compose_file" exec -T api python -m alembic upgrade head
    
    success "Database migrations completed"
}

# SSL certificate setup
setup_ssl_certificates() {
    local domain="$1"
    
    log "Setting up SSL certificates for $domain..."
    
    # Initial certificate request
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.production.yml" run --rm \
        certbot certonly --webroot -w /var/www/certbot \
        --email "$LETSENCRYPT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$domain" -d "www.$domain" -d "api.$domain" -d "mobile.$domain"
    
    success "SSL certificates configured"
}

# Main deployment function
main() {
    local environment="${1:-production}"
    local skip_build="${2:-false}"
    
    log "Starting SENTRA deployment to $environment environment"
    
    # Load environment configuration
    load_env "$DEPLOYMENT_DIR/env/.env.$environment"
    
    # Validate prerequisites
    validate_prerequisites
    
    # Build packages (unless skipped)
    if [[ "$skip_build" != "true" ]]; then
        build_packages
    fi
    
    # Run database migrations
    run_database_migration "$environment"
    
    # Setup SSL certificates for production
    if [[ "$environment" == "production" && ! -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
        setup_ssl_certificates "$DOMAIN"
    fi
    
    # Deploy with zero-downtime strategy
    deploy_with_zero_downtime "$environment"
    
    # Final success message
    success "SENTRA deployment to $environment completed successfully!"
    
    if [[ "$environment" == "production" ]]; then
        log "Production URL: https://$DOMAIN"
        log "API Documentation: https://api.$DOMAIN"
        log "Mobile PWA: https://mobile.$DOMAIN"
    else
        log "Staging URL: http://localhost:8080"
        log "API: http://localhost:8001"
    fi
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi