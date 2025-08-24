-- SENTRA Database Optimization and Performance Indexes
-- Phase 8: Production Optimization

-- Performance monitoring extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- User and Authentication Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users (email) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc 
ON users (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id_active 
ON user_sessions (user_id) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires_at 
ON user_sessions (expires_at) WHERE active = true;

-- Project and Repository Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner_id_active 
ON projects (owner_id) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at_desc 
ON projects (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_updated 
ON projects (status, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_project_id 
ON repositories (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_url_unique 
ON repositories (url) WHERE active = true;

-- Agent and Task Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_project_id_status 
ON agent_tasks (project_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_agent_id_created 
ON agent_tasks (agent_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_status_priority 
ON agent_tasks (status, priority DESC) WHERE status IN ('pending', 'running');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_queue_status 
ON agent_tasks (status, created_at ASC) WHERE status = 'pending';

-- Code Analysis Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_analysis_project_id_created 
ON code_analysis (project_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_analysis_file_path_gin 
ON code_analysis USING GIN (to_tsvector('english', file_path));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_analysis_language 
ON code_analysis (language) WHERE language IS NOT NULL;

-- Context and Intelligence Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_context_data_entity_type 
ON context_data (entity_type, entity_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_context_data_created_at 
ON context_data (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timeline_events_project_id_timestamp 
ON timeline_events (project_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timeline_events_event_type 
ON timeline_events (event_type, timestamp DESC);

-- Notification and Communication Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_unread 
ON notifications (user_id) WHERE read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at_desc 
ON notifications (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_websocket_connections_user_id_active 
ON websocket_connections (user_id) WHERE active = true;

-- Audit and Security Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id_timestamp 
ON audit_logs (user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs (action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_ip_timestamp 
ON security_events (source_ip, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_event_type_severity 
ON security_events (event_type, severity, timestamp DESC);

-- Backup and System Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_backup_records_created_at 
ON backup_records (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_backup_records_status 
ON backup_records (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_metric_name_timestamp 
ON system_metrics (metric_name, timestamp DESC);

-- Composite Indexes for Common Queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_status_updated 
ON projects (owner_id, status, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_project_status_created 
ON agent_tasks (project_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_context_search_composite 
ON context_data (entity_type, entity_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_name_description_fts 
ON projects USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_analysis_content_fts 
ON code_analysis USING GIN (to_tsvector('english', COALESCE(analysis_result, '')));

-- Partial indexes for specific conditions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verification_pending 
ON users (email) WHERE email_verified = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_recent_active 
ON projects (updated_at DESC) 
WHERE status = 'active' AND updated_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_failed_recent 
ON agent_tasks (created_at DESC) 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '7 days';

-- Performance optimization settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Auto-vacuum optimization
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '20s';
ALTER SYSTEM SET autovacuum_vacuum_threshold = 50;
ALTER SYSTEM SET autovacuum_analyze_threshold = 50;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- Connection and resource limits
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET max_locks_per_transaction = 256;

-- Logging for performance monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_temp_files = 0;
ALTER SYSTEM SET log_checkpoints = on;

-- Reload configuration
SELECT pg_reload_conf();

-- Create performance monitoring views
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY schemaname, tablename, attname;

CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent,
    mean_time,
    stddev_time
FROM pg_stat_statements 
ORDER BY total_time DESC
LIMIT 20;

CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

CREATE OR REPLACE VIEW table_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;