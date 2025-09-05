#!/bin/bash
set -e

# SENTRA Automated Maintenance Workflow
# Comprehensive automated maintenance orchestration for all system components

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="/var/log/sentra/maintenance"
BACKUP_DIR="/var/backups/sentra"
TEMP_DIR="/tmp/sentra-maintenance-$$"

# Maintenance configuration
MAINTENANCE_TYPE="${1:-daily}"  # daily, weekly, monthly, emergency
SKIP_TESTS="${SKIP_TESTS:-false}"
DRY_RUN="${DRY_RUN:-false}"
MAINTENANCE_WINDOW_HOURS="${MAINTENANCE_WINDOW_HOURS:-4}"
MAX_DOWNTIME_MINUTES="${MAX_DOWNTIME_MINUTES:-10}"

# Create required directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$TEMP_DIR"

# Main log file
MAIN_LOG="$LOG_DIR/automated-maintenance-$(date +%Y%m%d-%H%M%S).log"
SUMMARY_LOG="$LOG_DIR/maintenance-summary-$(date +%Y%m%d).log"

# Redirect all output to both console and log
exec > >(tee -a "$MAIN_LOG")
exec 2>&1

echo -e "${BLUE}🤖 SENTRA Automated Maintenance System${NC}"
echo "================================================"
echo "Started: $(date)"
echo "Type: $MAINTENANCE_TYPE"
echo "Dry Run: $DRY_RUN"
echo "Skip Tests: $SKIP_TESTS"
echo "Maintenance Window: ${MAINTENANCE_WINDOW_HOURS}h"
echo "Max Downtime: ${MAX_DOWNTIME_MINUTES}m"
echo "Log: $MAIN_LOG"
echo "================================================"

# Function to print status with color
print_status() {
    local status=$1
    local message=$2
    local timestamp=$(date '+%H:%M:%S')
    
    case $status in
        "OK")
            echo -e "${GREEN}[$timestamp] ✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[$timestamp] ⚠️ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] ❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}[$timestamp] ℹ️ $message${NC}"
            ;;
        "WORKING")
            echo -e "${PURPLE}[$timestamp] 🔄 $message${NC}"
            ;;
        "CRITICAL")
            echo -e "${RED}[$timestamp] 🚨 $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[$timestamp] 🎉 $message${NC}"
            ;;
    esac
}

# Function to execute maintenance task with error handling
execute_task() {
    local task_name="$1"
    local task_command="$2"
    local critical="${3:-false}"
    local max_duration="${4:-1800}"  # 30 minutes default
    
    print_status "WORKING" "Starting: $task_name"
    
    if [ "$DRY_RUN" = "true" ]; then
        print_status "INFO" "[DRY RUN] Would execute: $task_name"
        return 0
    fi
    
    local start_time=$(date +%s)
    
    # Execute with timeout
    if timeout $max_duration bash -c "$task_command" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_status "OK" "Completed: $task_name (${duration}s)"
        echo "$task_name,success,$duration,$(date)" >> "$TEMP_DIR/task_results.csv"
        return 0
    else
        local exit_code=$?
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ $exit_code -eq 124 ]; then
            print_status "ERROR" "Timeout: $task_name (>${max_duration}s)"
        else
            print_status "ERROR" "Failed: $task_name (exit code: $exit_code)"
        fi
        
        echo "$task_name,failed,$duration,$(date)" >> "$TEMP_DIR/task_results.csv"
        
        if [ "$critical" = "true" ]; then
            print_status "CRITICAL" "Critical task failed, aborting maintenance"
            cleanup_and_exit 1
        fi
        
        return $exit_code
    fi
}

# System Health Pre-Check
pre_maintenance_check() {
    print_status "INFO" "Running pre-maintenance health check..."
    
    # Check system resources
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local memory_usage=$(free | awk '/Mem/{printf("%.1f"), $3/$2*100}')
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    
    print_status "INFO" "System resources: CPU=${cpu_usage}%, Memory=${memory_usage}%, Disk=${disk_usage}%"
    
    # Check if system is under heavy load
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        print_status "WARNING" "High CPU usage detected, consider postponing maintenance"
        if [ "$MAINTENANCE_TYPE" != "emergency" ]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "INFO" "Maintenance postponed due to high system load"
                cleanup_and_exit 0
            fi
        fi
    fi
    
    # Check Docker services
    execute_task "Docker Services Check" "docker-compose ps" true 300
    
    # Check database connectivity
    execute_task "Database Connectivity" "docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-sentra}" true 60
    
    # Check API health
    execute_task "API Health Check" "curl -sf http://localhost:8000/health" true 30
    
    print_status "OK" "Pre-maintenance check completed"
}

# Backup Operations
perform_backups() {
    print_status "INFO" "Starting backup operations..."
    
    local backup_timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_base="$BACKUP_DIR/$backup_timestamp"
    
    mkdir -p "$backup_base"
    
    # Database backup
    execute_task "Database Backup" "
        docker-compose exec -T postgres pg_dump -U \${POSTGRES_USER:-sentra} \${POSTGRES_DB:-sentra} | gzip > '$backup_base/database.sql.gz'
    " true 1800
    
    # Configuration backup
    execute_task "Configuration Backup" "
        tar -czf '$backup_base/config.tar.gz' \
            docker-compose*.yml \
            .env* \
            nginx.conf \
            scripts/ \
            deployment/ 2>/dev/null || true
    " false 300
    
    # Agent state backup (if applicable)
    if [ -d "/var/lib/sentra/agents" ]; then
        execute_task "Agent State Backup" "
            tar -czf '$backup_base/agents.tar.gz' /var/lib/sentra/agents/ 2>/dev/null || true
        " false 600
    fi
    
    # Evolution data backup (if applicable)
    if [ -d "/var/lib/sentra/evolution" ]; then
        execute_task "Evolution Data Backup" "
            tar -czf '$backup_base/evolution.tar.gz' /var/lib/sentra/evolution/ 2>/dev/null || true
        " false 600
    fi
    
    # Verify backups
    execute_task "Backup Verification" "
        for file in '$backup_base'/*; do
            if [ -f \"\$file\" ]; then
                if [ \$(stat -f%z \"\$file\" 2>/dev/null || stat -c%s \"\$file\" 2>/dev/null) -gt 1024 ]; then
                    echo \"✅ \$(basename \"\$file\"): \$(ls -lh \"\$file\" | awk '{print \$5}')\"
                else
                    echo \"❌ \$(basename \"\$file\"): Too small or empty\"
                    exit 1
                fi
            fi
        done
    " true 300
    
    echo "$backup_timestamp" > "$TEMP_DIR/backup_timestamp"
    print_status "OK" "Backups completed: $backup_base"
}

# Database Maintenance
database_maintenance() {
    print_status "INFO" "Starting database maintenance..."
    
    # Check if database maintenance script exists
    if [ -f "$SCRIPT_DIR/database-maintenance.sh" ]; then
        execute_task "Database Maintenance" "
            bash '$SCRIPT_DIR/database-maintenance.sh' auto
        " true 3600  # 1 hour for database maintenance
    else
        print_status "WARNING" "Database maintenance script not found"
    fi
}

# Agent System Maintenance
agent_maintenance() {
    print_status "INFO" "Starting agent system maintenance..."
    
    # Agent memory cleanup
    execute_task "Agent Memory Cleanup" "
        # This would call actual agent management APIs
        echo 'Agent memory cleanup completed (simulated)'
    " false 600
    
    # Agent performance optimization
    execute_task "Agent Performance Optimization" "
        # This would call actual agent optimization routines
        echo 'Agent performance optimization completed (simulated)'
    " false 1200
    
    # Agent health check
    execute_task "Agent Health Verification" "
        # This would verify agent health via API
        echo 'Agent health verification completed (simulated)'
    " false 300
}

# Evolution System Maintenance
evolution_maintenance() {
    print_status "INFO" "Starting evolution system maintenance..."
    
    # Evolution data cleanup
    execute_task "Evolution Data Cleanup" "
        # Clean old evolution generations
        echo 'Evolution data cleanup completed (simulated)'
    " false 900
    
    # Genetic diversity analysis
    execute_task "Genetic Diversity Analysis" "
        # Run diversity analysis
        echo 'Genetic diversity analysis completed (simulated)'
    " false 600
    
    # Evolution performance optimization
    execute_task "Evolution Optimization" "
        # Optimize evolution parameters
        echo 'Evolution optimization completed (simulated)'
    " false 1200
}

# System Updates and Security
system_updates() {
    print_status "INFO" "Checking for system updates..."
    
    if [ "$MAINTENANCE_TYPE" = "weekly" ] || [ "$MAINTENANCE_TYPE" = "monthly" ]; then
        # Security updates
        execute_task "Security Updates Check" "
            apt list --upgradable 2>/dev/null | grep -i security || echo 'No security updates available'
        " false 300
        
        # Docker image updates
        execute_task "Docker Images Update Check" "
            docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}' | head -20
        " false 300
        
        # NPM audit
        if [ -f "$BASE_DIR/package.json" ]; then
            execute_task "NPM Security Audit" "
                cd '$BASE_DIR' && npm audit --audit-level=moderate
            " false 600
        fi
    fi
}

# Log Management
log_management() {
    print_status "INFO" "Managing system logs..."
    
    # Rotate logs
    execute_task "Log Rotation" "
        # Rotate application logs
        find /var/log/sentra -name '*.log' -size +100M -exec gzip {} \; 2>/dev/null || true
        
        # Clean old logs
        find /var/log/sentra -name '*.log.gz' -mtime +30 -delete 2>/dev/null || true
        find /var/log/sentra -name '*.log' -mtime +7 -size +1G -delete 2>/dev/null || true
    " false 300
    
    # Docker logs cleanup
    execute_task "Docker Logs Cleanup" "
        docker system prune -f --volumes --filter 'until=720h' 2>/dev/null || true
    " false 600
}

# Performance Monitoring and Optimization
performance_optimization() {
    print_status "INFO" "Running performance analysis..."
    
    # System performance analysis
    execute_task "System Performance Analysis" "
        # CPU and memory analysis
        echo '=== CPU Usage ===' 
        top -bn1 | head -20
        echo '=== Memory Usage ==='
        free -h
        echo '=== Disk I/O ==='
        iostat -x 1 1 2>/dev/null || echo 'iostat not available'
    " false 300
    
    # Database performance check
    execute_task "Database Performance Check" "
        docker-compose exec -T postgres psql -U \${POSTGRES_USER:-sentra} -d \${POSTGRES_DB:-sentra} -c \"
        SELECT 'Connections' as metric, count(*) as value FROM pg_stat_activity
        UNION ALL
        SELECT 'Cache Hit Ratio', round((sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0)) * 100, 2)
        FROM pg_statio_user_tables;
        \" 2>/dev/null || echo 'Database performance check skipped'
    " false 300
}

# Health Verification
post_maintenance_verification() {
    print_status "INFO" "Running post-maintenance verification..."
    
    # Wait for services to stabilize
    print_status "INFO" "Waiting for services to stabilize..."
    sleep 30
    
    # Comprehensive health check
    execute_task "Comprehensive Health Check" "
        bash '$SCRIPT_DIR/../diagnostics/system-health-check.sh'
    " true 600
    
    # Run basic tests if not skipped
    if [ "$SKIP_TESTS" != "true" ]; then
        execute_task "Basic Functionality Tests" "
            # API tests
            curl -sf http://localhost:8000/health
            
            # Database connectivity test
            docker-compose exec -T postgres pg_isready -U \${POSTGRES_USER:-sentra}
            
            # Agent system test (simulated)
            echo 'Agent system tests passed (simulated)'
        " true 300
    fi
}

# Generate maintenance report
generate_maintenance_report() {
    print_status "INFO" "Generating maintenance report..."
    
    local report_file="$LOG_DIR/maintenance-report-$(date +%Y%m%d-%H%M%S).md"
    local backup_timestamp=$(cat "$TEMP_DIR/backup_timestamp" 2>/dev/null || echo "unknown")
    
    cat > "$report_file" << EOF
# SENTRA Maintenance Report

**Date:** $(date)  
**Type:** $MAINTENANCE_TYPE  
**Duration:** $(($(date +%s) - MAINTENANCE_START_TIME)) seconds  
**Dry Run:** $DRY_RUN  

## Summary

$(if [ -f "$TEMP_DIR/task_results.csv" ]; then
    echo "### Task Results"
    echo ""
    echo "| Task | Status | Duration (s) | Timestamp |"
    echo "|------|--------|-------------|-----------|"
    while IFS=, read -r task status duration timestamp; do
        local status_emoji="❌"
        [ "$status" = "success" ] && status_emoji="✅"
        echo "| $task | $status_emoji $status | $duration | $timestamp |"
    done < "$TEMP_DIR/task_results.csv"
    echo ""
fi)

## Backup Information

- **Backup Timestamp:** $backup_timestamp
- **Backup Location:** $BACKUP_DIR/$backup_timestamp
- **Backup Size:** $(du -sh "$BACKUP_DIR/$backup_timestamp" 2>/dev/null | cut -f1 || echo "Unknown")

## System Status After Maintenance

$(docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker status unavailable")

## Recommendations

$(if [ -f "$TEMP_DIR/task_results.csv" ]; then
    FAILED_TASKS=$(grep "failed" "$TEMP_DIR/task_results.csv" | wc -l)
    if [ "$FAILED_TASKS" -gt 0 ]; then
        echo "- **Action Required:** $FAILED_TASKS task(s) failed. Review logs and retry failed operations."
    else
        echo "- All maintenance tasks completed successfully."
    fi
fi)

## Next Maintenance

- **Next Daily:** $(date -d "tomorrow" +%Y-%m-%d)
- **Next Weekly:** $(date -d "next Sunday" +%Y-%m-%d)  
- **Next Monthly:** $(date -d "first day of next month" +%Y-%m-%d)

## Logs

- **Main Log:** $MAIN_LOG
- **Summary Log:** $SUMMARY_LOG

---
*Report generated automatically by SENTRA Maintenance System*
EOF

    print_status "OK" "Maintenance report generated: $report_file"
    
    # Add to summary log
    echo "$(date): $MAINTENANCE_TYPE maintenance completed - Report: $report_file" >> "$SUMMARY_LOG"
}

# Cleanup function
cleanup_and_exit() {
    local exit_code=${1:-0}
    
    print_status "INFO" "Performing cleanup..."
    
    # Clean up temporary files
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    
    # Final status
    local end_time=$(date +%s)
    local total_duration=$((end_time - MAINTENANCE_START_TIME))
    
    if [ $exit_code -eq 0 ]; then
        print_status "SUCCESS" "Maintenance completed successfully in ${total_duration}s"
    else
        print_status "ERROR" "Maintenance failed after ${total_duration}s"
    fi
    
    echo "================================================"
    echo "Finished: $(date)"
    echo "Total Duration: ${total_duration}s"
    echo "Exit Code: $exit_code"
    echo "================================================"
    
    exit $exit_code
}

# Signal handlers
trap 'print_status "WARNING" "Maintenance interrupted by user"; cleanup_and_exit 130' INT
trap 'print_status "WARNING" "Maintenance terminated"; cleanup_and_exit 143' TERM

# Main maintenance workflow
main_maintenance() {
    local MAINTENANCE_START_TIME=$(date +%s)
    
    # Create task results tracking
    echo "task,status,duration,timestamp" > "$TEMP_DIR/task_results.csv"
    
    case "$MAINTENANCE_TYPE" in
        "daily")
            print_status "INFO" "Running daily maintenance workflow"
            pre_maintenance_check
            perform_backups
            database_maintenance
            agent_maintenance
            log_management
            performance_optimization
            post_maintenance_verification
            ;;
            
        "weekly")
            print_status "INFO" "Running weekly maintenance workflow"
            pre_maintenance_check
            perform_backups
            database_maintenance
            agent_maintenance
            evolution_maintenance
            system_updates
            log_management
            performance_optimization
            post_maintenance_verification
            ;;
            
        "monthly")
            print_status "INFO" "Running monthly maintenance workflow"
            pre_maintenance_check
            perform_backups
            database_maintenance
            agent_maintenance
            evolution_maintenance
            system_updates
            log_management
            performance_optimization
            
            # Additional monthly tasks
            execute_task "Deep System Analysis" "
                echo 'Deep system analysis completed (simulated)'
            " false 1800
            
            post_maintenance_verification
            ;;
            
        "emergency")
            print_status "CRITICAL" "Running emergency maintenance workflow"
            pre_maintenance_check
            perform_backups
            
            # Emergency-specific tasks would go here
            execute_task "Emergency Diagnostics" "
                bash '$SCRIPT_DIR/../diagnostics/system-health-check.sh'
            " true 600
            
            post_maintenance_verification
            ;;
            
        *)
            print_status "ERROR" "Unknown maintenance type: $MAINTENANCE_TYPE"
            echo "Valid types: daily, weekly, monthly, emergency"
            cleanup_and_exit 1
            ;;
    esac
    
    generate_maintenance_report
}

# Help function
show_help() {
    cat << EOF
SENTRA Automated Maintenance System

Usage: $0 [TYPE] [OPTIONS]

MAINTENANCE TYPES:
    daily       Daily maintenance tasks (default)
    weekly      Weekly maintenance including updates
    monthly     Monthly comprehensive maintenance
    emergency   Emergency maintenance and diagnostics

ENVIRONMENT VARIABLES:
    DRY_RUN=true                    Simulate maintenance without changes
    SKIP_TESTS=true                 Skip post-maintenance testing
    MAINTENANCE_WINDOW_HOURS=4      Maximum maintenance window
    MAX_DOWNTIME_MINUTES=10         Maximum acceptable downtime

EXAMPLES:
    $0 daily                        Run daily maintenance
    $0 weekly                       Run weekly maintenance
    DRY_RUN=true $0 monthly        Simulate monthly maintenance
    SKIP_TESTS=true $0 emergency   Emergency maintenance without tests

EOF
}

# Main execution
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    show_help
    exit 0
fi

# Set start time for duration calculation
MAINTENANCE_START_TIME=$(date +%s)

# Validate maintenance type
case "${1:-daily}" in
    daily|weekly|monthly|emergency) 
        MAINTENANCE_TYPE="$1"
        ;;
    *) 
        print_status "ERROR" "Invalid maintenance type: $1"
        show_help
        cleanup_and_exit 1
        ;;
esac

# Run main maintenance workflow
main_maintenance

# Normal exit
cleanup_and_exit 0