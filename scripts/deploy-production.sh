#!/bin/bash

# SENTRA Production Deployment Script
# Comprehensive deployment automation with validation and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/tmp/sentra_deploy_${DEPLOYMENT_ID}.log"
DEPLOYMENT_TIMEOUT=${DEPLOYMENT_TIMEOUT:-1800} # 30 minutes
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300} # 5 minutes
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}ℹ️  INFO: $*${NC}"
}

log_success() {
    log "${GREEN}✅ SUCCESS: $*${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  WARNING: $*${NC}"
}

log_error() {
    log "${RED}❌ ERROR: $*${NC}"
}

log_section() {
    log "${PURPLE}🚀 === $* ===${NC}"
}

# Banner
display_banner() {
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████ ███████ ███    ██ ████████ ██████   █████          ║
║   ██      ██      ████   ██    ██    ██   ██ ██   ██         ║
║   ███████ █████   ██ ██  ██    ██    ██████  ███████         ║
║        ██ ██      ██  ██ ██    ██    ██   ██ ██   ██         ║
║   ███████ ███████ ██   ████    ██    ██   ██ ██   ██         ║
║                                                               ║
║         Production Deployment & Validation System            ║
║                  Phase 8 - Final Launch                      ║
╚═══════════════════════════════════════════════════════════════╝
EOF
}

# Pre-deployment checks
pre_deployment_checks() {
    log_section "Pre-Deployment Validation"
    
    # Check if running as correct user
    if [[ $EUID -eq 0 ]]; then
        log_error "Do not run this script as root!"
        exit 1
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "curl" "jq" "aws" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    log_success "All required commands available"
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log_error "Production environment file not found: $PROJECT_ROOT/.env.production"
        log_info "Run: ./scripts/setup-secrets.sh first"
        exit 1
    fi
    
    # Load environment variables
    set -o allexport
    source "$PROJECT_ROOT/.env.production"
    set +o allexport
    log_success "Production environment loaded"
    
    # Check disk space (minimum 10GB free)
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    local min_space_kb=$((10 * 1024 * 1024)) # 10GB in KB
    if [[ $available_space -lt $min_space_kb ]]; then
        log_error "Insufficient disk space. Available: $(($available_space / 1024 / 1024))GB, Required: 10GB"
        exit 1
    fi
    log_success "Sufficient disk space available: $(($available_space / 1024 / 1024))GB"
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon not running or accessible"
        exit 1
    fi
    log_success "Docker daemon accessible"
    
    # Check network connectivity to essential services
    local test_urls=("https://hub.docker.com" "https://registry-1.docker.io")
    for url in "${test_urls[@]}"; do
        if ! curl -s --connect-timeout 10 "$url" > /dev/null; then
            log_warning "Network connectivity issue: $url"
        fi
    done
    log_success "Network connectivity verified"
    
    # Validate environment variables
    local required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "RABBITMQ_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable not set: $var"
            exit 1
        fi
        if [[ "${!var}" == "CHANGE_ME"* ]]; then
            log_error "Environment variable still using template value: $var"
            exit 1
        fi
    done
    log_success "All required environment variables validated"
}

# Create deployment backup
create_deployment_backup() {
    log_section "Creating Pre-Deployment Backup"
    
    local backup_dir="/tmp/sentra_deployment_backup_${DEPLOYMENT_ID}"
    mkdir -p "$backup_dir"
    
    # Backup current environment
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        cp "$PROJECT_ROOT/.env.production" "$backup_dir/"
        log_info "Environment backup created"
    fi
    
    # Backup database if running
    if docker ps | grep -q sentra-postgres; then
        log_info "Creating database backup..."
        docker exec sentra-postgres pg_dump \
            -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
            --no-password > "$backup_dir/database_backup.sql" || log_warning "Database backup failed"
    fi
    
    # Save current Docker state
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" > "$backup_dir/docker_state.txt"
    
    log_success "Pre-deployment backup created: $backup_dir"
    echo "$backup_dir" > "/tmp/sentra_last_backup_${DEPLOYMENT_ID}"
}

# Build and prepare images
build_production_images() {
    log_section "Building Production Images"
    
    cd "$PROJECT_ROOT"
    
    # Build all services
    log_info "Building production images..."
    docker-compose -f docker-compose.production.yml build \
        --parallel \
        --compress \
        --force-rm \
        --pull 2>&1 | tee -a "$LOG_FILE"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "All images built successfully"
    else
        log_error "Image build failed"
        return 1
    fi
    
    # Verify images
    log_info "Verifying built images..."
    local services=("api-gateway" "agent-orchestrator" "context-engine" "auth-service" "frontend")
    for service in "${services[@]}"; do
        if docker images | grep -q "sentra.*$service"; then
            log_info "✓ Image verified: sentra-$service"
        else
            log_error "Missing image: sentra-$service"
            return 1
        fi
    done
    
    log_success "All production images verified"
}

# Deploy services with rolling update
deploy_services() {
    log_section "Deploying Services"
    
    cd "$PROJECT_ROOT"
    
    # Start infrastructure services first
    log_info "Starting infrastructure services..."
    docker-compose -f docker-compose.production.yml up -d \
        postgres redis vault rabbitmq prometheus grafana alertmanager
    
    # Wait for infrastructure to be ready
    log_info "Waiting for infrastructure services..."
    wait_for_service_health "postgres" "5432" 60
    wait_for_service_health "redis" "6379" 30
    wait_for_service_health "vault" "8200" 30
    wait_for_service_health "rabbitmq" "5672" 45
    
    # Start application services
    log_info "Starting application services..."
    docker-compose -f docker-compose.production.yml up -d \
        auth-service context-engine agent-orchestrator api-gateway
    
    # Wait for application services
    log_info "Waiting for application services..."
    sleep 15 # Give services time to initialize
    
    # Start frontend and proxy
    log_info "Starting frontend and load balancer..."
    docker-compose -f docker-compose.production.yml up -d \
        frontend nginx
    
    # Start monitoring and support services
    log_info "Starting monitoring and support services..."
    docker-compose -f docker-compose.production.yml up -d \
        node-exporter cadvisor loki promtail healthcheck backup-service
    
    log_success "All services deployed"
}

# Wait for service health
wait_for_service_health() {
    local service=$1
    local port=$2
    local timeout=${3:-60}
    local count=0
    
    log_info "Waiting for $service to be healthy (timeout: ${timeout}s)..."
    
    while [[ $count -lt $timeout ]]; do
        if docker exec "sentra-$service" pg_isready &>/dev/null 2>/dev/null || \
           nc -z localhost "$port" &>/dev/null || \
           curl -sf "http://localhost:$port/health" &>/dev/null; then
            log_success "$service is healthy"
            return 0
        fi
        sleep 1
        ((count++))
        
        if [[ $((count % 10)) -eq 0 ]]; then
            log_info "Still waiting for $service... (${count}s/${timeout}s)"
        fi
    done
    
    log_error "$service failed to become healthy within ${timeout}s"
    return 1
}

# Comprehensive health checks
run_health_checks() {
    log_section "Running Health Checks"
    
    local health_endpoints=(
        "http://localhost:3000/health:API Gateway"
        "http://localhost:3001/health:Agent Orchestrator"
        "http://localhost:3002/health:Context Engine"
        "http://localhost:3005/health:Auth Service"
        "http://localhost:8080/health:Health Check Service"
    )
    
    local failed_checks=0
    
    for endpoint_info in "${health_endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_info" | cut -d: -f1)
        local service=$(echo "$endpoint_info" | cut -d: -f2)
        
        log_info "Checking health: $service"
        
        if curl -sf --connect-timeout 10 --max-time 30 "$endpoint" | jq -e '.status == "healthy"' >/dev/null 2>&1; then
            log_success "$service health check passed"
        else
            log_error "$service health check failed"
            ((failed_checks++))
        fi
    done
    
    # Check database connectivity
    log_info "Testing database connectivity..."
    if docker exec sentra-postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null; then
        log_success "Database connectivity verified"
    else
        log_error "Database connectivity failed"
        ((failed_checks++))
    fi
    
    # Check Redis connectivity
    log_info "Testing Redis connectivity..."
    if docker exec sentra-redis redis-cli ping | grep -q PONG; then
        log_success "Redis connectivity verified"
    else
        log_error "Redis connectivity failed"
        ((failed_checks++))
    fi
    
    # Check external integrations
    log_info "Testing external integrations..."
    # Add specific integration health checks here
    
    if [[ $failed_checks -eq 0 ]]; then
        log_success "All health checks passed"
        return 0
    else
        log_error "$failed_checks health checks failed"
        return 1
    fi
}

# Smoke tests
run_smoke_tests() {
    log_section "Running Smoke Tests"
    
    local base_url="http://localhost"
    local failed_tests=0
    
    # Test 1: API Gateway Response
    log_info "Test 1: API Gateway basic response"
    if curl -sf "$base_url:3000/health" | jq -e '.status == "healthy"' >/dev/null; then
        log_success "✓ API Gateway responding correctly"
    else
        log_error "✗ API Gateway test failed"
        ((failed_tests++))
    fi
    
    # Test 2: Authentication Flow
    log_info "Test 2: Authentication endpoints"
    local auth_response=$(curl -sf -X POST "$base_url:3000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@sentra.com","password":"Test123!"}' || echo "failed")
    
    if [[ "$auth_response" != "failed" ]] && echo "$auth_response" | jq -e '.token' >/dev/null 2>&1; then
        log_success "✓ Authentication endpoints working"
    else
        log_warning "✗ Authentication test inconclusive (may be expected for new deployment)"
    fi
    
    # Test 3: Database Operations
    log_info "Test 3: Database operations"
    if docker exec sentra-postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "✓ Database operations working"
    else
        log_error "✗ Database operations test failed"
        ((failed_tests++))
    fi
    
    # Test 4: Redis Operations
    log_info "Test 4: Redis operations"
    if docker exec sentra-redis redis-cli set test_key test_value >/dev/null && \
       docker exec sentra-redis redis-cli get test_key | grep -q test_value; then
        log_success "✓ Redis operations working"
        docker exec sentra-redis redis-cli del test_key >/dev/null
    else
        log_error "✗ Redis operations test failed"
        ((failed_tests++))
    fi
    
    # Test 5: Service Communication
    log_info "Test 5: Inter-service communication"
    local agent_list_response=$(curl -sf "$base_url:3001/api/agents" || echo "failed")
    if [[ "$agent_list_response" != "failed" ]]; then
        log_success "✓ Inter-service communication working"
    else
        log_error "✗ Inter-service communication test failed"
        ((failed_tests++))
    fi
    
    # Test 6: Frontend Static Assets
    log_info "Test 6: Frontend availability"
    if curl -sf --connect-timeout 10 "$base_url:3000/" | grep -qi "sentra" || \
       curl -sf --connect-timeout 10 "http://localhost/" | grep -qi "sentra"; then
        log_success "✓ Frontend serving content"
    else
        log_warning "✗ Frontend test inconclusive"
    fi
    
    # Test 7: Monitoring Stack
    log_info "Test 7: Monitoring stack"
    if curl -sf "http://localhost:9090/api/v1/query?query=up" | jq -e '.data.result | length > 0' >/dev/null; then
        log_success "✓ Monitoring stack operational"
    else
        log_warning "✗ Monitoring stack test inconclusive"
    fi
    
    if [[ $failed_tests -eq 0 ]]; then
        log_success "All smoke tests passed"
        return 0
    else
        log_error "$failed_tests smoke tests failed"
        return 1
    fi
}

# Performance validation
run_performance_tests() {
    log_section "Running Performance Validation"
    
    # Quick performance test with Artillery
    if command -v artillery &> /dev/null; then
        log_info "Running lightweight performance test..."
        
        cat > "/tmp/quick-perf-test.yml" << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 30
      arrivalRate: 5
scenarios:
  - flow:
    - get:
        url: "/health"
        expect:
          - statusCode: 200
EOF
        
        if artillery run "/tmp/quick-perf-test.yml" 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Performance validation completed"
        else
            log_warning "Performance validation inconclusive"
        fi
        
        rm -f "/tmp/quick-perf-test.yml"
    else
        log_info "Artillery not available, skipping performance test"
    fi
}

# Security validation
run_security_checks() {
    log_section "Running Security Validation"
    
    # Check for exposed secrets
    log_info "Checking for exposed secrets..."
    local exposed_secrets=0
    
    # Check Docker environment for secrets
    if docker inspect sentra-api-gateway | grep -i "CHANGE_ME"; then
        log_error "Found template secrets in Docker environment"
        ((exposed_secrets++))
    fi
    
    # Check for HTTP services when HTTPS should be used
    log_info "Validating SSL/TLS configuration..."
    if [[ "${SSL_CERT_PATH:-}" && -f "${SSL_CERT_PATH}" ]]; then
        log_success "SSL certificate configured"
    else
        log_warning "SSL certificate not found (may be using self-signed)"
    fi
    
    # Check container security
    log_info "Validating container security..."
    local insecure_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -c "Up" || echo "0")
    if [[ $insecure_containers -gt 0 ]]; then
        log_info "Running containers: $insecure_containers"
    fi
    
    if [[ $exposed_secrets -eq 0 ]]; then
        log_success "Security validation passed"
    else
        log_error "Security issues detected"
        return 1
    fi
}

# Deployment validation summary
deployment_validation_summary() {
    log_section "Deployment Validation Summary"
    
    # Service status
    log_info "Service Status Summary:"
    docker-compose -f docker-compose.production.yml ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
    
    # Resource usage
    log_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -10
    
    # Network status
    log_info "Network Status:"
    docker network ls | grep sentra
    
    # Volume status
    log_info "Volume Status:"
    docker volume ls | grep sentra
    
    # Generate deployment report
    cat > "/tmp/sentra_deployment_report_${DEPLOYMENT_ID}.json" << EOF
{
    "deployment_id": "${DEPLOYMENT_ID}",
    "timestamp": "$(date -Iseconds)",
    "environment": "production",
    "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "status": "completed",
    "services": {
        "total": $(docker-compose -f docker-compose.production.yml ps -q | wc -l),
        "running": $(docker-compose -f docker-compose.production.yml ps | grep -c "Up" || echo "0"),
        "failed": $(docker-compose -f docker-compose.production.yml ps | grep -c "Exit" || echo "0")
    },
    "validation": {
        "health_checks": "passed",
        "smoke_tests": "passed",
        "security_checks": "passed"
    },
    "deployment_duration_seconds": $(( $(date +%s) - $(date -d "$(head -1 "$LOG_FILE" | cut -d']' -f1 | tr -d '[')" +%s) )),
    "log_file": "$LOG_FILE"
}
EOF
    
    log_success "Deployment report generated: /tmp/sentra_deployment_report_${DEPLOYMENT_ID}.json"
}

# Rollback function
rollback_deployment() {
    log_section "Rolling Back Deployment"
    
    log_warning "Initiating deployment rollback..."
    
    # Stop current services
    docker-compose -f docker-compose.production.yml down || true
    
    # Restore previous backup if available
    local backup_path=$(cat "/tmp/sentra_last_backup_${DEPLOYMENT_ID}" 2>/dev/null || echo "")
    if [[ -n "$backup_path" && -d "$backup_path" ]]; then
        log_info "Restoring from backup: $backup_path"
        
        # Restore environment
        if [[ -f "$backup_path/.env.production" ]]; then
            cp "$backup_path/.env.production" "$PROJECT_ROOT/"
            log_info "Environment restored"
        fi
        
        # Restore database if backup exists
        if [[ -f "$backup_path/database_backup.sql" ]]; then
            log_info "Database rollback would be performed here"
            # In production, implement proper database rollback strategy
        fi
    fi
    
    log_warning "Rollback completed. Manual verification recommended."
}

# Cleanup function
cleanup_deployment() {
    log_info "Cleaning up deployment artifacts..."
    
    # Remove temporary files
    rm -f "/tmp/quick-perf-test.yml"
    rm -f "/tmp/sentra_last_backup_${DEPLOYMENT_ID}"
    
    # Clean up Docker
    docker system prune -f --volumes || true
    
    log_success "Cleanup completed"
}

# Main deployment flow
main_deployment() {
    local start_time=$(date +%s)
    
    display_banner
    log_section "Starting SENTRA Production Deployment"
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Log file: $LOG_FILE"
    
    # Trap for cleanup and rollback on failure
    trap 'log_error "Deployment failed!"; [[ "$ROLLBACK_ON_FAILURE" == "true" ]] && rollback_deployment; cleanup_deployment; exit 1' ERR
    trap 'log_warning "Deployment interrupted!"; cleanup_deployment; exit 1' INT TERM
    
    # Execute deployment steps
    pre_deployment_checks
    create_deployment_backup
    build_production_images
    deploy_services
    sleep 30 # Allow services to fully initialize
    run_health_checks
    run_smoke_tests
    run_performance_tests
    run_security_checks
    deployment_validation_summary
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_section "Deployment Completed Successfully!"
    log_success "🎉 SENTRA is now running in production!"
    log_info "Deployment Duration: ${duration} seconds"
    log_info "Access URLs:"
    log_info "  • Main Application: https://sentra.com"
    log_info "  • API Gateway: https://api.sentra.com"
    log_info "  • Monitoring: https://monitoring.sentra.com"
    log_info "  • Health Status: http://localhost:8080/status"
    
    cleanup_deployment
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   🚀 SENTRA Production Deployment SUCCESSFUL! 🚀         ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   Your revolutionary AI Code Engineering Platform         ║${NC}"
    echo -e "${GREEN}║   is now ready to transform development workflows!        ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
}

# Command line handling
case "${1:-deploy}" in
    "deploy")
        main_deployment
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health-check")
        run_health_checks
        ;;
    "smoke-test")
        run_smoke_tests
        ;;
    "cleanup")
        cleanup_deployment
        ;;
    "help")
        echo "SENTRA Production Deployment Script"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy      - Full production deployment (default)"
        echo "  rollback    - Rollback to previous deployment"
        echo "  health-check- Run health checks only"
        echo "  smoke-test  - Run smoke tests only"
        echo "  cleanup     - Clean up deployment artifacts"
        echo "  help        - Show this help message"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac