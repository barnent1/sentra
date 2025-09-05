#!/bin/bash
set -e

# SENTRA System Health Check Script
# Comprehensive health assessment for all system components

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="/tmp/sentra-health-check-$(date +%Y%m%d-%H%M%S).log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

echo -e "${BLUE}🔍 SENTRA System Health Check${NC}"
echo "========================================"
echo "Started: $(date)"
echo "Log file: $LOG_FILE"
echo "========================================"

# Redirect all output to both console and log file
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Function to print status with color
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️ $message${NC}"
            ;;
    esac
}

# Function to check command availability
check_command() {
    if command -v $1 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# System Resource Checks
check_system_resources() {
    print_status "INFO" "Checking system resources..."
    
    # CPU Usage
    if check_command "top"; then
        CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
        if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
            print_status "WARNING" "High CPU usage: ${CPU_USAGE}%"
        else
            print_status "OK" "CPU usage: ${CPU_USAGE}%"
        fi
    fi
    
    # Memory Usage
    if check_command "free"; then
        MEMORY_USAGE=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')
        if (( $(echo "$MEMORY_USAGE > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
            print_status "WARNING" "High memory usage: ${MEMORY_USAGE}%"
        else
            print_status "OK" "Memory usage: ${MEMORY_USAGE}%"
        fi
    fi
    
    # Disk Usage
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
        print_status "WARNING" "High disk usage: ${DISK_USAGE}%"
    else
        print_status "OK" "Disk usage: ${DISK_USAGE}%"
    fi
    
    # Load Average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
    print_status "INFO" "Load average:$LOAD_AVG"
}

# Docker Services Check
check_docker_services() {
    print_status "INFO" "Checking Docker services..."
    
    if ! check_command "docker-compose"; then
        print_status "ERROR" "docker-compose not found"
        return 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_status "ERROR" "docker-compose.yml not found in current directory"
        return 1
    fi
    
    # Get service status
    echo "Docker Services Status:"
    echo "======================="
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || {
        print_status "ERROR" "Failed to get docker services status"
        return 1
    }
    
    # Check each service health
    SERVICES=$(docker-compose ps --services 2>/dev/null)
    for service in $SERVICES; do
        if docker-compose ps "$service" | grep -q "Up"; then
            print_status "OK" "Service $service: Running"
        else
            print_status "ERROR" "Service $service: Not running"
        fi
    done
}

# Database Connectivity Check
check_database() {
    print_status "INFO" "Checking database connectivity..."
    
    # Check PostgreSQL container
    if docker-compose ps postgres | grep -q "Up"; then
        print_status "OK" "PostgreSQL container: Running"
        
        # Test database connection
        if docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-sentra}" >/dev/null 2>&1; then
            print_status "OK" "PostgreSQL: Connection successful"
            
            # Check pgvector extension
            if docker-compose exec -T postgres psql -U "${POSTGRES_USER:-sentra}" -d "${POSTGRES_DB:-sentra}" -c "SELECT * FROM pg_extension WHERE extname='vector';" | grep -q "vector"; then
                print_status "OK" "pgvector extension: Available"
            else
                print_status "WARNING" "pgvector extension: Not found"
            fi
        else
            print_status "ERROR" "PostgreSQL: Connection failed"
        fi
    else
        print_status "ERROR" "PostgreSQL container: Not running"
    fi
}

# API Health Check
check_api_health() {
    print_status "INFO" "Checking API health..."
    
    # Check API container
    if docker-compose ps api | grep -q "Up"; then
        print_status "OK" "API container: Running"
        
        # Test API endpoint
        if curl -sf "http://localhost:8000/health" >/dev/null 2>&1; then
            print_status "OK" "API health endpoint: Responding"
            
            # Get API response
            API_RESPONSE=$(curl -s "http://localhost:8000/health" 2>/dev/null)
            if echo "$API_RESPONSE" | grep -q '"status":"healthy"'; then
                print_status "OK" "API status: Healthy"
            else
                print_status "WARNING" "API status: Unhealthy response"
            fi
        else
            print_status "ERROR" "API health endpoint: Not responding"
        fi
    else
        print_status "ERROR" "API container: Not running"
    fi
}

# Agent System Check
check_agent_system() {
    print_status "INFO" "Checking agent system..."
    
    # This would typically connect to the agent management API
    # For now, we'll check if the necessary files exist
    
    if [ -d "packages/core/src/agents" ]; then
        print_status "OK" "Agent source code: Found"
    else
        print_status "ERROR" "Agent source code: Not found"
    fi
    
    if [ -f "packages/core/src/types/agents.ts" ]; then
        print_status "OK" "Agent type definitions: Found"
    else
        print_status "ERROR" "Agent type definitions: Not found"
    fi
    
    # Check if agent logs exist and are recent
    if [ -f "/var/log/sentra/agents/execution.log" ]; then
        if find "/var/log/sentra/agents/execution.log" -mtime -1 | grep -q .; then
            print_status "OK" "Agent execution logs: Recent activity"
        else
            print_status "WARNING" "Agent execution logs: No recent activity"
        fi
    else
        print_status "INFO" "Agent execution logs: File not found (may be first run)"
    fi
}

# Evolution System Check
check_evolution_system() {
    print_status "INFO" "Checking evolution system..."
    
    if [ -f "packages/core/src/types/evolution.ts" ]; then
        print_status "OK" "Evolution type definitions: Found"
    else
        print_status "ERROR" "Evolution type definitions: Not found"
    fi
    
    if [ -d "packages/core/src/dna" ]; then
        print_status "OK" "DNA system: Found"
    else
        print_status "ERROR" "DNA system: Not found"
    fi
    
    if [ -f "docker-compose.evolution.yml" ]; then
        print_status "OK" "Evolution Docker configuration: Found"
    else
        print_status "WARNING" "Evolution Docker configuration: Not found"
    fi
}

# Dashboard Check
check_dashboard() {
    print_status "INFO" "Checking dashboard..."
    
    if [ -d "packages/dashboard" ]; then
        print_status "OK" "Dashboard source code: Found"
        
        # Check if dashboard is built
        if [ -d "packages/dashboard/dist" ]; then
            print_status "OK" "Dashboard build: Found"
        else
            print_status "WARNING" "Dashboard build: Not found (may need to run build)"
        fi
        
        # Check Vue.js components
        COMPONENT_COUNT=$(find packages/dashboard/src/components -name "*.vue" | wc -l)
        print_status "INFO" "Vue components found: $COMPONENT_COUNT"
        
    else
        print_status "ERROR" "Dashboard source code: Not found"
    fi
}

# Mobile App Check
check_mobile_app() {
    print_status "INFO" "Checking mobile app..."
    
    if [ -d "packages/mobile" ]; then
        print_status "OK" "Mobile app source code: Found"
        
        # Check PWA configuration
        if [ -f "packages/mobile/public/manifest.json" ]; then
            print_status "OK" "PWA manifest: Found"
        else
            print_status "WARNING" "PWA manifest: Not found"
        fi
        
        # Check service worker
        if [ -f "packages/mobile/src/sw.ts" ] || [ -f "packages/mobile/public/sw.js" ]; then
            print_status "OK" "Service worker: Found"
        else
            print_status "WARNING" "Service worker: Not found"
        fi
        
    else
        print_status "ERROR" "Mobile app source code: Not found"
    fi
}

# Network Connectivity Check
check_network() {
    print_status "INFO" "Checking network connectivity..."
    
    # Check port availability
    PORTS=(80 443 8000 5432)
    for port in "${PORTS[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_status "OK" "Port $port: Available"
        else
            print_status "WARNING" "Port $port: Not in use"
        fi
    done
    
    # Check DNS resolution
    if nslookup google.com >/dev/null 2>&1; then
        print_status "OK" "DNS resolution: Working"
    else
        print_status "ERROR" "DNS resolution: Failed"
    fi
    
    # Check internet connectivity
    if ping -c 1 google.com >/dev/null 2>&1; then
        print_status "OK" "Internet connectivity: Working"
    else
        print_status "WARNING" "Internet connectivity: Limited or unavailable"
    fi
}

# Security Check
check_security() {
    print_status "INFO" "Checking security configuration..."
    
    # Check for .env file
    if [ -f ".env" ]; then
        print_status "OK" "Environment configuration: Found"
        
        # Check for sensitive data exposure (basic check)
        if [ -r ".env" ]; then
            if grep -q "POSTGRES_PASSWORD=" ".env" && grep -q "OPENAI_API_KEY=" ".env"; then
                print_status "OK" "Environment variables: Properly configured"
            else
                print_status "WARNING" "Environment variables: Missing required variables"
            fi
        fi
    else
        print_status "WARNING" "Environment configuration: .env file not found"
    fi
    
    # Check file permissions
    if [ -f "docker-compose.yml" ]; then
        PERMISSIONS=$(stat -c "%a" docker-compose.yml 2>/dev/null || stat -f "%A" docker-compose.yml 2>/dev/null)
        if [[ "$PERMISSIONS" =~ ^[67][0-7][0-7]$ ]]; then
            print_status "OK" "docker-compose.yml permissions: Secure"
        else
            print_status "WARNING" "docker-compose.yml permissions: May be too permissive ($PERMISSIONS)"
        fi
    fi
}

# Generate Summary Report
generate_summary() {
    echo ""
    echo "========================================"
    echo -e "${BLUE}📊 HEALTH CHECK SUMMARY${NC}"
    echo "========================================"
    echo "Completed: $(date)"
    echo "Log file: $LOG_FILE"
    echo ""
    
    # Count status types from log
    OK_COUNT=$(grep -c "✅" "$LOG_FILE" 2>/dev/null || echo "0")
    WARNING_COUNT=$(grep -c "⚠️" "$LOG_FILE" 2>/dev/null || echo "0")
    ERROR_COUNT=$(grep -c "❌" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo "Results:"
    echo "  ✅ OK: $OK_COUNT"
    echo "  ⚠️ Warnings: $WARNING_COUNT"  
    echo "  ❌ Errors: $ERROR_COUNT"
    echo ""
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "${RED}🚨 CRITICAL ISSUES DETECTED${NC}"
        echo "Please review the errors above and take corrective action."
        exit 1
    elif [ "$WARNING_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️ WARNINGS DETECTED${NC}"
        echo "System is operational but may require attention."
        exit 1
    else
        echo -e "${GREEN}✅ SYSTEM HEALTHY${NC}"
        echo "All checks passed successfully."
        exit 0
    fi
}

# Main execution
main() {
    check_system_resources
    echo ""
    check_docker_services
    echo ""
    check_database
    echo ""
    check_api_health
    echo ""
    check_agent_system
    echo ""
    check_evolution_system
    echo ""
    check_dashboard
    echo ""
    check_mobile_app
    echo ""
    check_network
    echo ""
    check_security
    echo ""
    generate_summary
}

# Run main function
main "$@"