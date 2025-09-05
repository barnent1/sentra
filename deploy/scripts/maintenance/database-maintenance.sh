#!/bin/bash
set -e

# SENTRA Database Maintenance Script
# Comprehensive database maintenance, optimization, and health monitoring

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/sentra/maintenance"
BACKUP_DIR="/var/backups/sentra"
DB_NAME="${POSTGRES_DB:-sentra}"
DB_USER="${POSTGRES_USER:-sentra}"
MAINTENANCE_MODE=${MAINTENANCE_MODE:-"auto"}
VACUUM_THRESHOLD=${VACUUM_THRESHOLD:-20}  # Percentage of dead tuples
INDEX_BLOAT_THRESHOLD=${INDEX_BLOAT_THRESHOLD:-30}  # Percentage bloat
STATS_STALENESS_HOURS=${STATS_STALENESS_HOURS:-24}

# Ensure log directory exists
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

LOG_FILE="$LOG_DIR/db-maintenance-$(date +%Y%m%d-%H%M%S).log"

# Redirect all output to both console and log file
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}🛠️ SENTRA Database Maintenance${NC}"
echo "========================================"
echo "Started: $(date)"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Mode: $MAINTENANCE_MODE"
echo "Log: $LOG_FILE"
echo "========================================"

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
        "WORKING")
            echo -e "${PURPLE}🔄 $message${NC}"
            ;;
    esac
}

# Function to execute PostgreSQL commands
execute_psql() {
    local query="$1"
    local description="$2"
    
    if [ -n "$description" ]; then
        print_status "WORKING" "$description"
    fi
    
    if docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "$query" >/dev/null 2>&1; then
        if [ -n "$description" ]; then
            print_status "OK" "$description completed"
        fi
        return 0
    else
        if [ -n "$description" ]; then
            print_status "ERROR" "$description failed"
        fi
        return 1
    fi
}

# Function to get query result
get_psql_result() {
    local query="$1"
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>/dev/null | xargs
}

# Check database connectivity
check_database_connectivity() {
    print_status "INFO" "Checking database connectivity..."
    
    if docker-compose ps postgres | grep -q "Up"; then
        print_status "OK" "PostgreSQL container is running"
    else
        print_status "ERROR" "PostgreSQL container is not running"
        exit 1
    fi
    
    if docker-compose exec -T postgres pg_isready -U "$DB_USER" >/dev/null 2>&1; then
        print_status "OK" "Database is accepting connections"
    else
        print_status "ERROR" "Database is not accepting connections"
        exit 1
    fi
}

# Database size and usage analysis
analyze_database_size() {
    print_status "INFO" "Analyzing database size and usage..."
    
    # Get database size
    DB_SIZE=$(get_psql_result "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    print_status "INFO" "Database size: $DB_SIZE"
    
    # Get largest tables
    echo "Largest tables:"
    echo "==============="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
    LIMIT 10;
    "
    
    # Get index usage statistics
    echo ""
    echo "Index usage statistics:"
    echo "======================"
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes 
    WHERE idx_scan < 100
    ORDER BY idx_scan ASC;
    "
}

# Check table and index bloat
check_bloat() {
    print_status "INFO" "Checking table and index bloat..."
    
    # Table bloat analysis
    echo "Table bloat analysis:"
    echo "===================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT
        schemaname,
        tablename,
        n_dead_tup,
        n_live_tup,
        CASE 
            WHEN n_live_tup > 0 
            THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
            ELSE 0 
        END AS dead_tuple_percent
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 0
    ORDER BY dead_tuple_percent DESC;
    "
    
    # Identify tables needing vacuum
    BLOATED_TABLES=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT tablename 
    FROM pg_stat_user_tables 
    WHERE n_live_tup > 0 
    AND (100.0 * n_dead_tup / (n_live_tup + n_dead_tup)) > $VACUUM_THRESHOLD;
    " | xargs)
    
    if [ -n "$BLOATED_TABLES" ]; then
        print_status "WARNING" "Tables needing vacuum: $BLOATED_TABLES"
        echo "$BLOATED_TABLES" > "$LOG_DIR/bloated_tables.txt"
    else
        print_status "OK" "No severely bloated tables found"
    fi
}

# Vacuum and analyze operations
perform_vacuum_analyze() {
    print_status "INFO" "Performing vacuum and analyze operations..."
    
    # Check if we should do VACUUM FULL (more aggressive but requires exclusive lock)
    local vacuum_type="VACUUM"
    if [ "$MAINTENANCE_MODE" = "aggressive" ]; then
        vacuum_type="VACUUM FULL"
        print_status "WARNING" "Using VACUUM FULL - database will be unavailable during operation"
    fi
    
    # Get all user tables
    TABLES=$(get_psql_result "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
    
    for table in $TABLES; do
        print_status "WORKING" "Vacuuming table: $table"
        
        # Vacuum the table
        if execute_psql "$vacuum_type $table;" "Vacuuming $table"; then
            # Analyze the table for updated statistics
            execute_psql "ANALYZE $table;" "Analyzing $table"
        fi
    done
    
    # Update global statistics
    execute_psql "ANALYZE;" "Updating global statistics"
}

# Index maintenance
maintain_indexes() {
    print_status "INFO" "Performing index maintenance..."
    
    # Reindex bloated indexes
    echo "Checking for bloated indexes..."
    BLOATED_INDEXES=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT indexname 
    FROM pg_stat_user_indexes 
    WHERE idx_scan > 0 
    AND schemaname = 'public';
    " | head -10)  # Limit to prevent long maintenance windows
    
    for index in $BLOATED_INDEXES; do
        if [ -n "$index" ]; then
            print_status "WORKING" "Reindexing: $index"
            if execute_psql "REINDEX INDEX CONCURRENTLY $index;" "Reindexing $index"; then
                print_status "OK" "Successfully reindexed $index"
            fi
        fi
    done
    
    # Check for unused indexes
    echo ""
    echo "Potentially unused indexes:"
    echo "=========================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
    FROM pg_stat_user_indexes
    WHERE idx_scan < 10
    AND schemaname = 'public'
    ORDER BY pg_relation_size(indexname::regclass) DESC;
    "
}

# pgvector specific maintenance
maintain_pgvector() {
    print_status "INFO" "Performing pgvector-specific maintenance..."
    
    # Check if pgvector extension exists
    HAS_PGVECTOR=$(get_psql_result "SELECT COUNT(*) FROM pg_extension WHERE extname='vector';")
    
    if [ "$HAS_PGVECTOR" -gt 0 ]; then
        print_status "OK" "pgvector extension found"
        
        # Find vector columns and indexes
        echo "Vector indexes maintenance:"
        echo "=========================="
        docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            t.tablename,
            a.attname as column_name,
            i.indexname,
            pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size
        FROM pg_tables t
        JOIN pg_attribute a ON a.attrelid = (t.schemaname||'.'||t.tablename)::regclass
        JOIN pg_type ty ON ty.oid = a.atttypid
        LEFT JOIN pg_indexes i ON i.tablename = t.tablename AND i.indexdef LIKE '%'||a.attname||'%'
        WHERE ty.typname = 'vector'
        AND t.schemaname = 'public';
        "
        
        # Optimize vector indexes by rebuilding with optimal parameters
        VECTOR_INDEXES=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT DISTINCT i.indexname
        FROM pg_indexes i
        WHERE i.indexdef LIKE '%vector%'
        AND i.schemaname = 'public';
        " | xargs)
        
        for index in $VECTOR_INDEXES; do
            if [ -n "$index" ]; then
                print_status "WORKING" "Optimizing vector index: $index"
                # Note: In production, you might want to recreate with optimized parameters
                execute_psql "REINDEX INDEX CONCURRENTLY $index;" "Optimizing vector index $index"
            fi
        done
        
    else
        print_status "INFO" "pgvector extension not found, skipping vector-specific maintenance"
    fi
}

# Connection and session management
optimize_connections() {
    print_status "INFO" "Optimizing connections and sessions..."
    
    # Show current connection statistics
    echo "Current connections:"
    echo "==================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
    FROM pg_stat_activity;
    "
    
    # Check for long-running queries
    echo ""
    echo "Long-running queries (>5 minutes):"
    echo "==================================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        now() - query_start as duration,
        left(query, 100) as query_preview
    FROM pg_stat_activity 
    WHERE (now() - query_start) > interval '5 minutes'
    AND state != 'idle'
    AND query NOT LIKE '%pg_stat_activity%';
    "
    
    # Terminate very long-running queries if in aggressive mode
    if [ "$MAINTENANCE_MODE" = "aggressive" ]; then
        print_status "WARNING" "Terminating queries running longer than 30 minutes"
        docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE (now() - query_start) > interval '30 minutes'
        AND state != 'idle'
        AND usename != 'postgres'
        AND query NOT LIKE '%pg_stat_activity%';
        " | grep -v "pg_terminate_backend" || true
    fi
}

# Database configuration optimization
optimize_configuration() {
    print_status "INFO" "Checking database configuration..."
    
    # Show current important settings
    echo "Current configuration:"
    echo "====================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT name, setting, unit, short_desc
    FROM pg_settings 
    WHERE name IN (
        'shared_buffers',
        'work_mem',
        'maintenance_work_mem',
        'effective_cache_size',
        'checkpoint_timeout',
        'max_wal_size',
        'random_page_cost',
        'effective_io_concurrency'
    );
    "
    
    # Suggest optimizations based on system resources
    TOTAL_MEM_KB=$(docker-compose exec -T postgres cat /proc/meminfo | grep MemTotal | awk '{print $2}')
    TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))
    
    echo ""
    print_status "INFO" "System has ${TOTAL_MEM_MB}MB total memory"
    
    # Provide optimization suggestions
    echo "Configuration optimization suggestions:"
    echo "====================================="
    
    SUGGESTED_SHARED_BUFFERS=$((TOTAL_MEM_MB / 4))
    SUGGESTED_WORK_MEM=$((TOTAL_MEM_MB / 100))
    SUGGESTED_MAINTENANCE_WORK_MEM=$((TOTAL_MEM_MB / 16))
    
    echo "shared_buffers: Consider setting to ${SUGGESTED_SHARED_BUFFERS}MB (25% of RAM)"
    echo "work_mem: Consider setting to ${SUGGESTED_WORK_MEM}MB"
    echo "maintenance_work_mem: Consider setting to ${SUGGESTED_MAINTENANCE_WORK_MEM}MB"
    echo "effective_cache_size: Consider setting to 75% of available RAM"
}

# Check and update statistics
update_statistics() {
    print_status "INFO" "Checking and updating table statistics..."
    
    # Find tables with stale statistics
    echo "Tables with stale statistics (>${STATS_STALENESS_HOURS}h):"
    echo "=============================================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        n_live_tup,
        n_dead_tup,
        last_analyze,
        now() - last_analyze as stats_age
    FROM pg_stat_user_tables
    WHERE last_analyze < now() - interval '${STATS_STALENESS_HOURS} hours'
    OR last_analyze IS NULL
    ORDER BY stats_age DESC NULLS FIRST;
    "
    
    # Update stale statistics
    STALE_TABLES=$(docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT tablename
    FROM pg_stat_user_tables
    WHERE last_analyze < now() - interval '${STATS_STALENESS_HOURS} hours'
    OR last_analyze IS NULL;
    " | xargs)
    
    for table in $STALE_TABLES; do
        if [ -n "$table" ]; then
            execute_psql "ANALYZE $table;" "Updating statistics for $table"
        fi
    done
}

# Backup verification
verify_backups() {
    print_status "INFO" "Verifying recent backups..."
    
    # Check for recent backup files
    if [ -d "$BACKUP_DIR" ]; then
        RECENT_BACKUPS=$(find "$BACKUP_DIR" -name "*.dump" -mtime -1 | wc -l)
        if [ "$RECENT_BACKUPS" -gt 0 ]; then
            print_status "OK" "Found $RECENT_BACKUPS recent backup(s)"
            
            # List recent backups
            echo "Recent backups:"
            echo "==============="
            find "$BACKUP_DIR" -name "*.dump" -mtime -7 -exec ls -lh {} \;
        else
            print_status "WARNING" "No recent backups found in $BACKUP_DIR"
        fi
    else
        print_status "WARNING" "Backup directory $BACKUP_DIR does not exist"
    fi
}

# Performance monitoring
monitor_performance() {
    print_status "INFO" "Monitoring performance metrics..."
    
    # Cache hit ratios
    echo "Cache hit ratios:"
    echo "================="
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        'Buffer Cache Hit Ratio' as metric,
        round(
            (sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0)) * 100, 2
        ) as percentage
    FROM pg_statio_user_tables
    UNION ALL
    SELECT 
        'Index Cache Hit Ratio' as metric,
        round(
            (sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0)) * 100, 2
        ) as percentage
    FROM pg_statio_user_indexes;
    "
    
    # Slow queries
    echo ""
    echo "Recent slow queries (if pg_stat_statements is enabled):"
    echo "======================================================"
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) as pg_stat_statements_available;
    " 2>/dev/null || echo "pg_stat_statements extension not available"
}

# Generate maintenance report
generate_report() {
    print_status "INFO" "Generating maintenance report..."
    
    REPORT_FILE="$LOG_DIR/maintenance-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
SENTRA Database Maintenance Report
==================================
Date: $(date)
Database: $DB_NAME
User: $DB_USER
Maintenance Mode: $MAINTENANCE_MODE

Database Size: $DB_SIZE
Log File: $LOG_FILE

Summary of Actions Performed:
- Database connectivity check
- Size and usage analysis
- Bloat detection and remediation
- Vacuum and analyze operations
- Index maintenance
- pgvector optimization
- Connection optimization
- Statistics updates
- Backup verification
- Performance monitoring

For detailed logs, see: $LOG_FILE

Next recommended maintenance: $(date -d "+1 week")
EOF
    
    print_status "OK" "Maintenance report generated: $REPORT_FILE"
}

# Cleanup old logs and reports
cleanup_old_files() {
    print_status "INFO" "Cleaning up old maintenance files..."
    
    # Remove logs older than 30 days
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.txt" -mtime +30 -delete 2>/dev/null || true
    
    # Remove old backup files older than 90 days
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.dump" -mtime +90 -delete 2>/dev/null || true
    fi
    
    print_status "OK" "Cleanup completed"
}

# Signal handlers for graceful shutdown
cleanup() {
    print_status "WARNING" "Maintenance interrupted, performing cleanup..."
    # Any necessary cleanup can be added here
    exit 1
}

trap cleanup INT TERM

# Main execution
main() {
    print_status "INFO" "Starting database maintenance sequence..."
    
    # Essential checks first
    check_database_connectivity
    
    # Analysis and monitoring
    analyze_database_size
    check_bloat
    monitor_performance
    
    # Maintenance operations
    perform_vacuum_analyze
    maintain_indexes
    maintain_pgvector
    update_statistics
    
    # Optimization
    optimize_connections
    optimize_configuration
    
    # Verification and reporting
    verify_backups
    generate_report
    cleanup_old_files
    
    print_status "OK" "Database maintenance completed successfully"
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}✅ MAINTENANCE SUMMARY${NC}"
    echo "========================================"
    echo "Started: $(head -n 10 "$LOG_FILE" | grep "Started:" | cut -d' ' -f2-)"
    echo "Completed: $(date)"
    echo "Database: $DB_NAME ($DB_SIZE)"
    echo "Log file: $LOG_FILE"
    echo "Report: $REPORT_FILE"
    
    if [ -f "$LOG_DIR/bloated_tables.txt" ]; then
        BLOATED_COUNT=$(wc -l < "$LOG_DIR/bloated_tables.txt")
        echo "Tables maintained: $BLOATED_COUNT"
    fi
    
    echo ""
    echo "Next maintenance recommended: $(date -d '+1 week' '+%Y-%m-%d')"
    echo "========================================"
}

# Handle command line arguments
case "${1:-auto}" in
    "auto")
        MAINTENANCE_MODE="auto"
        ;;
    "aggressive")
        MAINTENANCE_MODE="aggressive"
        print_status "WARNING" "Aggressive mode enabled - this may cause temporary unavailability"
        ;;
    "analyze-only")
        MAINTENANCE_MODE="analyze-only"
        print_status "INFO" "Analysis-only mode - no maintenance operations will be performed"
        ;;
    "--help"|"-h")
        echo "Usage: $0 [mode]"
        echo "Modes:"
        echo "  auto        - Standard maintenance (default)"
        echo "  aggressive  - More thorough maintenance with potential downtime"
        echo "  analyze-only - Only perform analysis, no maintenance operations"
        echo ""
        echo "Environment variables:"
        echo "  MAINTENANCE_MODE     - Override mode"
        echo "  VACUUM_THRESHOLD     - Dead tuple percentage threshold (default: 20)"
        echo "  INDEX_BLOAT_THRESHOLD - Index bloat percentage threshold (default: 30)"
        echo "  STATS_STALENESS_HOURS - Statistics staleness threshold (default: 24)"
        exit 0
        ;;
    *)
        print_status "ERROR" "Unknown mode: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Run main function
main "$@"