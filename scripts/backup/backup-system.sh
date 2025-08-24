#!/bin/bash

# SENTRA Production Backup System
# Comprehensive backup and disaster recovery automation

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/data/backups/sentra}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ID="${BACKUP_ID:-backup_${TIMESTAMP}}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    set -o allexport
    source "$PROJECT_ROOT/.env.production"
    set +o allexport
fi

# Default configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-sentra}"
POSTGRES_USER="${POSTGRES_USER:-sentra_user}"
REDIS_HOST="${REDIS_HOST:-redis}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-sentra-backups-prod}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-9}"
ENCRYPTION_ENABLED="${ENCRYPTION_ENABLED:-true}"

echo -e "${BLUE}🚀 SENTRA Production Backup System${NC}"
echo "======================================="
echo "Backup ID: $BACKUP_ID"
echo "Timestamp: $(date)"
echo ""

# Create backup directory structure
create_backup_directories() {
    echo -e "${GREEN}📁 Creating backup directories...${NC}"
    
    local dirs=(
        "$BACKUP_BASE_DIR/$BACKUP_ID"
        "$BACKUP_BASE_DIR/$BACKUP_ID/database"
        "$BACKUP_BASE_DIR/$BACKUP_ID/redis"
        "$BACKUP_BASE_DIR/$BACKUP_ID/files"
        "$BACKUP_BASE_DIR/$BACKUP_ID/configs"
        "$BACKUP_BASE_DIR/$BACKUP_ID/logs"
        "$BACKUP_BASE_DIR/$BACKUP_ID/metadata"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    echo "Backup directories created at: $BACKUP_BASE_DIR/$BACKUP_ID"
}

# Database backup
backup_database() {
    echo -e "${GREEN}🗄️  Backing up PostgreSQL database...${NC}"
    
    local db_backup_file="$BACKUP_BASE_DIR/$BACKUP_ID/database/postgres_${BACKUP_ID}.sql"
    local db_backup_compressed="$db_backup_file.gz"
    
    # Create database dump
    if command -v docker &> /dev/null && docker ps | grep -q sentra-postgres; then
        # Use Docker container
        docker exec sentra-postgres pg_dump \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --no-password \
            --verbose \
            --clean \
            --if-exists \
            --create \
            --format=custom \
            --compress=0 > "$db_backup_file"
    else
        # Direct connection
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
            -h "$POSTGRES_HOST" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --no-password \
            --verbose \
            --clean \
            --if-exists \
            --create \
            --format=custom \
            --compress=0 > "$db_backup_file"
    fi
    
    # Compress backup
    gzip -$COMPRESSION_LEVEL "$db_backup_file"
    
    # Create metadata
    cat > "$BACKUP_BASE_DIR/$BACKUP_ID/metadata/database.json" << EOF
{
    "type": "postgresql",
    "database": "$POSTGRES_DB",
    "host": "$POSTGRES_HOST",
    "user": "$POSTGRES_USER",
    "backup_file": "$(basename "$db_backup_compressed")",
    "size": $(stat -c%s "$db_backup_compressed"),
    "timestamp": "$(date -Iseconds)",
    "compression": "gzip",
    "format": "custom"
}
EOF
    
    echo "Database backup completed: $db_backup_compressed"
    echo "Size: $(du -h "$db_backup_compressed" | cut -f1)"
}

# Redis backup
backup_redis() {
    echo -e "${GREEN}🔴 Backing up Redis data...${NC}"
    
    local redis_backup_file="$BACKUP_BASE_DIR/$BACKUP_ID/redis/redis_${BACKUP_ID}.rdb"
    local redis_backup_compressed="$redis_backup_file.gz"
    
    if command -v docker &> /dev/null && docker ps | grep -q sentra-redis; then
        # Use Docker container
        docker exec sentra-redis redis-cli \
            --rdb /tmp/dump.rdb
        docker cp sentra-redis:/tmp/dump.rdb "$redis_backup_file"
    else
        # Direct connection
        redis-cli -h "$REDIS_HOST" --rdb "$redis_backup_file"
    fi
    
    # Compress backup
    gzip -$COMPRESSION_LEVEL "$redis_backup_file"
    
    # Create metadata
    cat > "$BACKUP_BASE_DIR/$BACKUP_ID/metadata/redis.json" << EOF
{
    "type": "redis",
    "host": "$REDIS_HOST",
    "backup_file": "$(basename "$redis_backup_compressed")",
    "size": $(stat -c%s "$redis_backup_compressed"),
    "timestamp": "$(date -Iseconds)",
    "compression": "gzip",
    "format": "rdb"
}
EOF
    
    echo "Redis backup completed: $redis_backup_compressed"
    echo "Size: $(du -h "$redis_backup_compressed" | cut -f1)"
}

# Application files backup
backup_application_files() {
    echo -e "${GREEN}📋 Backing up application files...${NC}"
    
    local files_backup="$BACKUP_BASE_DIR/$BACKUP_ID/files/application_${BACKUP_ID}.tar.gz"
    
    # Files to backup
    local include_patterns=(
        "src/"
        "services/"
        "agents/"
        "shared/"
        "infrastructure/"
        "package.json"
        "package-lock.json"
        "docker-compose*.yml"
        "README.md"
        "docs/"
    )
    
    # Files to exclude
    local exclude_patterns=(
        "node_modules"
        "dist"
        "build"
        "*.log"
        ".git"
        "tmp"
        "temp"
        "cache"
    )
    
    cd "$PROJECT_ROOT"
    
    # Build tar command with includes and excludes
    local tar_cmd="tar -czf '$files_backup'"
    
    for exclude in "${exclude_patterns[@]}"; do
        tar_cmd="$tar_cmd --exclude='$exclude'"
    done
    
    for include in "${include_patterns[@]}"; do
        tar_cmd="$tar_cmd '$include'"
    done
    
    eval $tar_cmd
    
    # Create metadata
    cat > "$BACKUP_BASE_DIR/$BACKUP_ID/metadata/files.json" << EOF
{
    "type": "application_files",
    "backup_file": "$(basename "$files_backup")",
    "size": $(stat -c%s "$files_backup"),
    "timestamp": "$(date -Iseconds)",
    "compression": "gzip",
    "includes": $(printf '%s\n' "${include_patterns[@]}" | jq -R . | jq -s .),
    "excludes": $(printf '%s\n' "${exclude_patterns[@]}" | jq -R . | jq -s .)
}
EOF
    
    echo "Application files backup completed: $files_backup"
    echo "Size: $(du -h "$files_backup" | cut -f1)"
}

# Configuration backup
backup_configurations() {
    echo -e "${GREEN}⚙️  Backing up configurations...${NC}"
    
    local config_backup="$BACKUP_BASE_DIR/$BACKUP_ID/configs/configs_${BACKUP_ID}.tar.gz"
    
    # Configuration files to backup
    local config_files=(
        ".env.production.template"
        "infrastructure/nginx/nginx.conf"
        "infrastructure/nginx/conf.d/"
        "infrastructure/monitoring/"
        "scripts/setup-secrets.sh"
        "docker-compose.production.yml"
    )
    
    cd "$PROJECT_ROOT"
    
    # Create temporary directory for configs
    local temp_config_dir=$(mktemp -d)
    
    for config in "${config_files[@]}"; do
        if [[ -e "$config" ]]; then
            # Preserve directory structure
            local dest_dir="$temp_config_dir/$(dirname "$config")"
            mkdir -p "$dest_dir"
            cp -r "$config" "$dest_dir/"
        fi
    done
    
    # Create archive
    tar -czf "$config_backup" -C "$temp_config_dir" .
    
    # Cleanup
    rm -rf "$temp_config_dir"
    
    # Create metadata
    cat > "$BACKUP_BASE_DIR/$BACKUP_ID/metadata/configs.json" << EOF
{
    "type": "configurations",
    "backup_file": "$(basename "$config_backup")",
    "size": $(stat -c%s "$config_backup"),
    "timestamp": "$(date -Iseconds)",
    "compression": "gzip",
    "files": $(printf '%s\n' "${config_files[@]}" | jq -R . | jq -s .)
}
EOF
    
    echo "Configuration backup completed: $config_backup"
    echo "Size: $(du -h "$config_backup" | cut -f1)"
}

# System logs backup
backup_logs() {
    echo -e "${GREEN}📋 Backing up system logs...${NC}"
    
    local logs_backup="$BACKUP_BASE_DIR/$BACKUP_ID/logs/logs_${BACKUP_ID}.tar.gz"
    
    # Log directories and files
    local log_sources=(
        "/var/log/nginx/"
        "/var/log/postgresql/"
        "/var/log/redis/"
        "$PROJECT_ROOT/logs/"
    )
    
    # Find and backup recent logs (last 7 days)
    local temp_log_dir=$(mktemp -d)
    
    for log_source in "${log_sources[@]}"; do
        if [[ -d "$log_source" ]]; then
            find "$log_source" -name "*.log" -mtime -7 -exec cp {} "$temp_log_dir/" \; 2>/dev/null || true
        fi
    done
    
    # Include Docker logs if available
    if command -v docker &> /dev/null; then
        docker logs sentra-api-gateway > "$temp_log_dir/api-gateway.log" 2>&1 || true
        docker logs sentra-agent-orchestrator > "$temp_log_dir/agent-orchestrator.log" 2>&1 || true
        docker logs sentra-postgres > "$temp_log_dir/postgres.log" 2>&1 || true
        docker logs sentra-redis > "$temp_log_dir/redis.log" 2>&1 || true
    fi
    
    # Create archive
    if [[ -n "$(ls -A "$temp_log_dir")" ]]; then
        tar -czf "$logs_backup" -C "$temp_log_dir" .
        log_size=$(stat -c%s "$logs_backup")
    else
        echo "No recent logs found, creating empty archive"
        touch "$logs_backup"
        log_size=0
    fi
    
    # Cleanup
    rm -rf "$temp_log_dir"
    
    # Create metadata
    cat > "$BACKUP_BASE_DIR/$BACKUP_ID/metadata/logs.json" << EOF
{
    "type": "system_logs",
    "backup_file": "$(basename "$logs_backup")",
    "size": $log_size,
    "timestamp": "$(date -Iseconds)",
    "compression": "gzip",
    "log_retention_days": 7
}
EOF
    
    echo "Logs backup completed: $logs_backup"
    echo "Size: $(du -h "$logs_backup" | cut -f1)"
}

# Encrypt backup if enabled
encrypt_backup() {
    if [[ "$ENCRYPTION_ENABLED" == "true" ]]; then
        echo -e "${GREEN}🔒 Encrypting backup...${NC}"
        
        if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
            echo -e "${YELLOW}⚠️  BACKUP_ENCRYPTION_KEY not set, skipping encryption${NC}"
            return
        fi
        
        local backup_archive="$BACKUP_BASE_DIR/${BACKUP_ID}.tar.gz"
        local encrypted_archive="$backup_archive.enc"
        
        # Create main backup archive
        tar -czf "$backup_archive" -C "$BACKUP_BASE_DIR" "$BACKUP_ID"
        
        # Encrypt the archive
        openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
            -in "$backup_archive" \
            -out "$encrypted_archive" \
            -k "$BACKUP_ENCRYPTION_KEY"
        
        # Remove unencrypted archive
        rm "$backup_archive"
        
        echo "Backup encrypted: $encrypted_archive"
        echo "Encryption: AES-256-CBC with PBKDF2"
        
        return "$encrypted_archive"
    fi
}

# Upload to cloud storage
upload_to_s3() {
    if command -v aws &> /dev/null && [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
        echo -e "${GREEN}☁️  Uploading to S3...${NC}"
        
        local backup_archive="$BACKUP_BASE_DIR/${BACKUP_ID}.tar.gz"
        [[ "$ENCRYPTION_ENABLED" == "true" ]] && backup_archive="${backup_archive}.enc"
        
        # Create final archive if not encrypted
        if [[ "$ENCRYPTION_ENABLED" != "true" ]]; then
            tar -czf "$backup_archive" -C "$BACKUP_BASE_DIR" "$BACKUP_ID"
        fi
        
        local s3_key="sentra/backups/$BACKUP_ID/$(basename "$backup_archive")"
        
        # Upload with metadata
        aws s3 cp "$backup_archive" "s3://$S3_BACKUP_BUCKET/$s3_key" \
            --metadata "timestamp=$(date -Iseconds),backup-id=$BACKUP_ID,encrypted=$ENCRYPTION_ENABLED" \
            --storage-class STANDARD_IA
        
        # Upload metadata files
        aws s3 sync "$BACKUP_BASE_DIR/$BACKUP_ID/metadata/" \
            "s3://$S3_BACKUP_BUCKET/sentra/backups/$BACKUP_ID/metadata/" \
            --storage-class STANDARD
        
        echo "Backup uploaded to S3: s3://$S3_BACKUP_BUCKET/$s3_key"
        
        # Cross-region replication if configured
        if [[ -n "${BACKUP_CROSS_REGION:-}" && "${BACKUP_CROSS_REGION}" == "true" ]]; then
            local cross_region_bucket="${BACKUP_CROSS_REGION_BUCKET:-}"
            if [[ -n "$cross_region_bucket" ]]; then
                echo "Initiating cross-region replication..."
                aws s3 cp "s3://$S3_BACKUP_BUCKET/$s3_key" \
                    "s3://$cross_region_bucket/$s3_key" \
                    --source-region "$AWS_REGION" \
                    --region "${BACKUP_CROSS_REGION_AWS_REGION:-us-west-2}" \
                    --storage-class STANDARD_IA
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  AWS CLI not available or S3 bucket not configured${NC}"
    fi
}

# Verify backup integrity
verify_backup() {
    echo -e "${GREEN}🔍 Verifying backup integrity...${NC}"
    
    local backup_dir="$BACKUP_BASE_DIR/$BACKUP_ID"
    local verification_results=()
    
    # Check database backup
    if [[ -f "$backup_dir/database/postgres_${BACKUP_ID}.sql.gz" ]]; then
        if gzip -t "$backup_dir/database/postgres_${BACKUP_ID}.sql.gz"; then
            verification_results+=("Database backup: ✅ Valid")
        else
            verification_results+=("Database backup: ❌ Corrupted")
        fi
    fi
    
    # Check Redis backup
    if [[ -f "$backup_dir/redis/redis_${BACKUP_ID}.rdb.gz" ]]; then
        if gzip -t "$backup_dir/redis/redis_${BACKUP_ID}.rdb.gz"; then
            verification_results+=("Redis backup: ✅ Valid")
        else
            verification_results+=("Redis backup: ❌ Corrupted")
        fi
    fi
    
    # Check application files
    if [[ -f "$backup_dir/files/application_${BACKUP_ID}.tar.gz" ]]; then
        if tar -tzf "$backup_dir/files/application_${BACKUP_ID}.tar.gz" >/dev/null 2>&1; then
            verification_results+=("Application files: ✅ Valid")
        else
            verification_results+=("Application files: ❌ Corrupted")
        fi
    fi
    
    # Create verification report
    cat > "$backup_dir/metadata/verification.json" << EOF
{
    "backup_id": "$BACKUP_ID",
    "verification_timestamp": "$(date -Iseconds)",
    "results": $(printf '%s\n' "${verification_results[@]}" | jq -R . | jq -s .),
    "overall_status": "$(if [[ ! " ${verification_results[*]} " =~ " ❌ " ]]; then echo "PASSED"; else echo "FAILED"; fi)"
}
EOF
    
    echo "Backup verification completed:"
    printf '%s\n' "${verification_results[@]}"
}

# Create backup manifest
create_manifest() {
    echo -e "${GREEN}📋 Creating backup manifest...${NC}"
    
    local manifest_file="$BACKUP_BASE_DIR/$BACKUP_ID/MANIFEST.json"
    local total_size=$(du -sb "$BACKUP_BASE_DIR/$BACKUP_ID" | cut -f1)
    
    cat > "$manifest_file" << EOF
{
    "backup_id": "$BACKUP_ID",
    "timestamp": "$(date -Iseconds)",
    "version": "1.0",
    "system": "SENTRA",
    "environment": "${NODE_ENV:-production}",
    "total_size": $total_size,
    "encryption_enabled": $ENCRYPTION_ENABLED,
    "compression_level": $COMPRESSION_LEVEL,
    "retention_days": $BACKUP_RETENTION_DAYS,
    "components": {
        "database": {
            "included": true,
            "type": "postgresql",
            "database": "$POSTGRES_DB"
        },
        "redis": {
            "included": true,
            "type": "redis"
        },
        "application_files": {
            "included": true,
            "type": "source_code"
        },
        "configurations": {
            "included": true,
            "type": "system_configs"
        },
        "logs": {
            "included": true,
            "retention_days": 7
        }
    },
    "storage": {
        "local_path": "$BACKUP_BASE_DIR/$BACKUP_ID",
        "s3_bucket": "${S3_BACKUP_BUCKET:-null}",
        "cross_region": ${BACKUP_CROSS_REGION:-false}
    },
    "metadata": {
        "script_version": "1.0",
        "hostname": "$(hostname)",
        "user": "$(whoami)",
        "checksum": "$(find "$BACKUP_BASE_DIR/$BACKUP_ID" -type f -exec md5sum {} + | md5sum | cut -d' ' -f1)"
    }
}
EOF
    
    echo "Backup manifest created: $manifest_file"
}

# Cleanup old backups
cleanup_old_backups() {
    echo -e "${GREEN}🧹 Cleaning up old backups...${NC}"
    
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    local deleted_count=0
    
    # Clean local backups
    if [[ -d "$BACKUP_BASE_DIR" ]]; then
        while IFS= read -r -d '' backup_dir; do
            if [[ -f "$backup_dir/MANIFEST.json" ]]; then
                local backup_date=$(jq -r '.timestamp' "$backup_dir/MANIFEST.json" 2>/dev/null | cut -d'T' -f1)
                if [[ -n "$backup_date" ]]; then
                    local backup_age=$(( ($(date +%s) - $(date -d "$backup_date" +%s)) / 86400 ))
                    if [[ $backup_age -gt $retention_days ]]; then
                        echo "Deleting old backup: $(basename "$backup_dir") (${backup_age} days old)"
                        rm -rf "$backup_dir"
                        ((deleted_count++))
                    fi
                fi
            fi
        done < <(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "backup_*" -print0)
    fi
    
    # Clean S3 backups
    if command -v aws &> /dev/null && [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
        local cutoff_date=$(date -d "${retention_days} days ago" +%Y-%m-%d)
        aws s3api list-objects-v2 \
            --bucket "$S3_BACKUP_BUCKET" \
            --prefix "sentra/backups/" \
            --query "Contents[?LastModified<'${cutoff_date}'].Key" \
            --output text | \
        while read -r key; do
            if [[ -n "$key" && "$key" != "None" ]]; then
                aws s3 rm "s3://$S3_BACKUP_BUCKET/$key"
                ((deleted_count++))
            fi
        done
    fi
    
    echo "Cleanup completed: $deleted_count old backups removed"
}

# Send notifications
send_notifications() {
    local status=$1
    local message=$2
    
    echo -e "${GREEN}📧 Sending backup notifications...${NC}"
    
    # Webhook notification
    if [[ -n "${BACKUP_NOTIFICATION_WEBHOOK:-}" ]]; then
        curl -s -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"backup_id\": \"$BACKUP_ID\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"hostname\": \"$(hostname)\",
                \"environment\": \"${NODE_ENV:-production}\"
            }" || true
    fi
    
    # Email notification (if configured)
    if command -v mail &> /dev/null && [[ -n "${BACKUP_EMAIL_RECIPIENTS:-}" ]]; then
        echo "$message" | mail -s "SENTRA Backup $status - $BACKUP_ID" "$BACKUP_EMAIL_RECIPIENTS" || true
    fi
}

# Main execution flow
main() {
    local start_time=$(date +%s)
    
    echo "Starting backup process..."
    
    # Trap for cleanup on exit
    trap 'echo -e "${RED}❌ Backup interrupted${NC}"; send_notifications "FAILED" "Backup process was interrupted"; exit 1' INT TERM
    
    try {
        create_backup_directories
        backup_database
        backup_redis
        backup_application_files
        backup_configurations
        backup_logs
        verify_backup
        create_manifest
        encrypt_backup
        upload_to_s3
        cleanup_old_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local total_size=$(du -sh "$BACKUP_BASE_DIR/$BACKUP_ID" | cut -f1)
        
        local success_message="✅ SENTRA backup completed successfully!
Backup ID: $BACKUP_ID
Duration: ${duration}s
Total Size: $total_size
Location: $BACKUP_BASE_DIR/$BACKUP_ID"
        
        echo -e "${GREEN}$success_message${NC}"
        send_notifications "SUCCESS" "$success_message"
        
    } catch {
        local error_message="❌ SENTRA backup failed!
Backup ID: $BACKUP_ID
Error occurred during backup process
Check logs for details"
        
        echo -e "${RED}$error_message${NC}"
        send_notifications "FAILED" "$error_message"
        exit 1
    }
}

# Error handling functions
try() {
    [[ $- = *e* ]]; SAVED_OPT_E=$?
    set +e
}

catch() {
    export exception_code=$?
    (( SAVED_OPT_E )) && set +e
    return $exception_code
}

# Parse command line arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "verify")
        if [[ -n "${2:-}" ]]; then
            BACKUP_ID="$2"
            verify_backup
        else
            echo "Usage: $0 verify <backup_id>"
            exit 1
        fi
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "help")
        echo "SENTRA Backup System"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  backup    - Create a full system backup (default)"
        echo "  verify    - Verify backup integrity"
        echo "  cleanup   - Remove old backups"
        echo "  help      - Show this help message"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac