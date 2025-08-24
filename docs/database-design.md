# SENTRA Database Design & Data Models
## Strategic Engineering Neural Technology for Rapid Automation

**Version**: 1.0  
**Date**: 2024-08-24  
**Document Type**: Database Architecture & Schema Specification  
**Architect**: System Architect Agent

---

## Executive Summary

This document defines the complete database architecture, schemas, and data models for SENTRA. The design supports multi-agent orchestration, context preservation, quality enforcement, timeline intelligence, and professional project management through a carefully structured PostgreSQL primary database with Redis caching layer.

**Database Architecture Principles:**
- PostgreSQL as primary transactional database
- Redis for caching, real-time features, and message queues
- Normalized design with strategic denormalization for performance
- Comprehensive audit trails and versioning
- Encryption-ready schema with sensitive data protection
- Horizontal scaling support through proper indexing and partitioning

---

## Database Architecture Overview

### 1. Database Stack

```
SENTRA Data Architecture
├── Primary Database (PostgreSQL 15)
│   ├── Transactional data storage
│   ├── Complex queries and analytics
│   ├── ACID compliance for critical operations
│   └── Full-text search capabilities
├── Cache Layer (Redis 7)
│   ├── Session management
│   ├── Real-time agent status
│   ├── Message queues and pub/sub
│   └── Temporary data caching
├── File Storage (Encrypted)
│   ├── Project source code backups
│   ├── Context archives
│   ├── Generated documentation
│   └── System logs and metrics
└── Search Engine (PostgreSQL + Redis)
    ├── Context semantic search
    ├── Code pattern matching
    ├── Project knowledge base
    └── Agent conversation history
```

### 2. Data Flow Architecture

```
Data Flow Patterns
├── Write Operations
│   ├── Application → PostgreSQL (persistent)
│   ├── Application → Redis (cache invalidation)
│   ├── Background → File Storage (backups)
│   └── Events → Message Queue (async processing)
├── Read Operations
│   ├── Application → Redis (cache first)
│   ├── Cache Miss → PostgreSQL (fallback)
│   ├── Search → Full-text indexes
│   └── Analytics → Read replicas
├── Real-time Updates
│   ├── WebSocket → Redis Pub/Sub
│   ├── Agent Status → Redis Hashes
│   ├── Progress Updates → Redis Streams
│   └── Notifications → Message Queues
└── Backup & Archive
    ├── Daily → Encrypted snapshots
    ├── Weekly → Full database backups
    ├── Monthly → Long-term archives
    └── Real-time → WAL shipping
```

---

## Core Database Schema

### 1. User Management & Authentication

```sql
-- Users table with comprehensive authentication support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    
    -- Two-factor authentication
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- Encrypted recovery codes
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Account status and metadata
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT NOW(),
    
    -- Security tracking
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_failed_login_at TIMESTAMP
);

-- User sessions for security and device tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Device and location information
    device_id VARCHAR(255),
    device_type VARCHAR(50), -- web, mobile, desktop
    device_name VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    location JSONB, -- { country, city, coordinates }
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    
    -- Security metadata
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255)
);

-- API keys for programmatic access
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
    
    -- Permissions and scope
    scopes TEXT[] NOT NULL DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    usage_count BIGINT DEFAULT 0,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255)
);

-- Indexes for user management
CREATE INDEX idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id) WHERE is_active = true;
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_api_keys_user_active ON api_keys(user_id) WHERE is_active = true;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### 2. Project Management Schema

```sql
-- Projects - Core entity for all development work
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic project information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    
    -- Project configuration
    tech_stack JSONB DEFAULT '{}', -- { "framework": "nextjs", "version": "15.x", ... }
    environment_config JSONB DEFAULT '{}', -- Environment variables, deployment settings
    quality_standards JSONB DEFAULT '{}', -- Custom quality rules and requirements
    
    -- Project status and metadata
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
    
    -- Repository and deployment information
    repository_url VARCHAR(500),
    repository_branch VARCHAR(100) DEFAULT 'main',
    deployment_url VARCHAR(500),
    staging_url VARCHAR(500),
    
    -- Timeline and estimation
    estimated_completion_date DATE,
    actual_completion_date DATE,
    total_estimated_hours DECIMAL(8,2),
    total_actual_hours DECIMAL(8,2),
    
    -- Client and business information
    client_name VARCHAR(255),
    client_contact_email VARCHAR(255),
    project_value DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    
    -- Soft deletion
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

-- Project team members and permissions
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role and permissions
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    permissions JSONB DEFAULT '{}',
    can_manage_agents BOOLEAN DEFAULT false,
    can_deploy BOOLEAN DEFAULT false,
    can_manage_settings BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    invited_at TIMESTAMP DEFAULT NOW(),
    joined_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    
    -- Metadata
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

-- Project settings and configuration
CREATE TABLE project_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Agent configuration
    max_concurrent_agents INTEGER DEFAULT 8,
    agent_preferences JSONB DEFAULT '{}',
    context_retention_days INTEGER DEFAULT 90,
    
    -- Quality settings
    quality_gate_strictness INTEGER DEFAULT 3 CHECK (quality_gate_strictness BETWEEN 1 AND 5),
    code_review_required BOOLEAN DEFAULT true,
    automated_testing_required BOOLEAN DEFAULT true,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT true,
    tts_notifications BOOLEAN DEFAULT false,
    mobile_notifications BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{}',
    
    -- Integration settings
    github_integration JSONB DEFAULT '{}',
    vercel_integration JSONB DEFAULT '{}',
    claude_code_settings JSONB DEFAULT '{}',
    
    -- Backup and security
    backup_enabled BOOLEAN DEFAULT true,
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    encryption_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for project management
CREATE INDEX idx_projects_user_status ON projects(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_slug ON projects(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_client ON projects(client_name) WHERE client_name IS NOT NULL;
CREATE INDEX idx_projects_last_activity ON projects(last_activity_at DESC);
CREATE INDEX idx_project_members_project ON project_members(project_id, status);
CREATE INDEX idx_project_members_user ON project_members(user_id, status);
```

### 3. Agent Management Schema

```sql
-- Agent definitions and capabilities
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent identity
    name VARCHAR(100) NOT NULL, -- "James", "Sarah", "Mike", etc.
    type VARCHAR(50) NOT NULL, -- "development", "qa", "pm", "analyst", etc.
    persona_description TEXT, -- Personality and working style description
    
    -- Technical capabilities
    capabilities JSONB NOT NULL DEFAULT '[]', -- ["javascript", "react", "api-design", ...]
    specializations JSONB DEFAULT '[]', -- ["authentication", "payment-processing", ...]
    tech_stack_preferences JSONB DEFAULT '{}', -- Preferred frameworks and tools
    
    -- Configuration and behavior
    max_concurrent_tasks INTEGER DEFAULT 3,
    quality_threshold DECIMAL(3,2) DEFAULT 0.85,
    context_window_size INTEGER DEFAULT 100000,
    response_style VARCHAR(50) DEFAULT 'professional', -- professional, casual, technical
    
    -- Status and performance
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'maintenance')),
    performance_score DECIMAL(3,2) DEFAULT 0.8,
    total_tasks_completed INTEGER DEFAULT 0,
    average_task_duration DECIMAL(8,2), -- Hours
    success_rate DECIMAL(3,2) DEFAULT 1.0,
    
    -- Learning and adaptation
    learning_enabled BOOLEAN DEFAULT true,
    adaptation_rate DECIMAL(3,2) DEFAULT 0.1,
    experience_level INTEGER DEFAULT 1 CHECK (experience_level BETWEEN 1 AND 10),
    
    -- Metadata
    version VARCHAR(20) DEFAULT '1.0',
    configuration JSONB DEFAULT '{}',
    custom_prompts JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP,
    
    -- System fields
    is_system_agent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Agent instances - Running agent containers
CREATE TABLE agent_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Container information
    container_id VARCHAR(255) UNIQUE,
    container_name VARCHAR(255),
    docker_image VARCHAR(255),
    
    -- Resource allocation
    cpu_limit DECIMAL(5,2), -- CPU cores
    memory_limit INTEGER, -- MB
    disk_limit INTEGER, -- MB
    network_limit INTEGER, -- Mbps
    
    -- Instance status
    status VARCHAR(20) NOT NULL DEFAULT 'starting' CHECK (
        status IN ('starting', 'running', 'paused', 'stopping', 'stopped', 'error')
    ),
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (
        health_status IN ('healthy', 'unhealthy', 'unknown')
    ),
    
    -- Performance metrics
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    memory_usage INTEGER DEFAULT 0,
    disk_usage INTEGER DEFAULT 0,
    
    -- Instance lifecycle
    started_at TIMESTAMP,
    stopped_at TIMESTAMP,
    last_heartbeat_at TIMESTAMP,
    restart_count INTEGER DEFAULT 0,
    
    -- Assignment and tasks
    current_task_id UUID, -- Reference to tasks table
    tasks_completed INTEGER DEFAULT 0,
    
    -- Configuration
    environment_variables JSONB DEFAULT '{}',
    runtime_config JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent assignments to projects and tasks
CREATE TABLE agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Assignment details
    assignment_type VARCHAR(30) NOT NULL DEFAULT 'task' CHECK (
        assignment_type IN ('project', 'task', 'review', 'support')
    ),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    
    -- Status and timeline
    status VARCHAR(20) DEFAULT 'assigned' CHECK (
        status IN ('assigned', 'in_progress', 'blocked', 'completed', 'cancelled')
    ),
    assigned_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    
    -- Performance tracking
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    quality_score DECIMAL(3,2),
    
    -- Assignment context
    assignment_context JSONB DEFAULT '{}',
    special_instructions TEXT,
    dependencies UUID[] DEFAULT '{}', -- Array of task/assignment IDs
    
    -- Metadata
    assigned_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent performance tracking
CREATE TABLE agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Performance period
    metric_date DATE NOT NULL,
    metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),
    
    -- Productivity metrics
    tasks_started INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    lines_of_code INTEGER DEFAULT 0,
    commits_made INTEGER DEFAULT 0,
    
    -- Quality metrics
    reviews_passed INTEGER DEFAULT 0,
    reviews_failed INTEGER DEFAULT 0,
    bugs_introduced INTEGER DEFAULT 0,
    bugs_fixed INTEGER DEFAULT 0,
    
    -- Efficiency metrics
    average_task_time DECIMAL(8,2), -- Hours
    context_switches INTEGER DEFAULT 0,
    idle_time_minutes INTEGER DEFAULT 0,
    
    -- Collaboration metrics
    messages_sent INTEGER DEFAULT 0,
    help_requests INTEGER DEFAULT 0,
    help_provided INTEGER DEFAULT 0,
    
    -- Resource usage
    cpu_usage_avg DECIMAL(5,2),
    memory_usage_avg INTEGER,
    api_calls_made INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(agent_id, project_id, metric_date, metric_hour)
);

-- Indexes for agent management
CREATE INDEX idx_agents_type_status ON agents(type, status) WHERE is_active = true;
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);
CREATE INDEX idx_agent_instances_status ON agent_instances(status, project_id);
CREATE INDEX idx_agent_instances_container ON agent_instances(container_id) WHERE container_id IS NOT NULL;
CREATE INDEX idx_agent_assignments_status ON agent_assignments(status, project_id, agent_id);
CREATE INDEX idx_agent_assignments_task ON agent_assignments(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_agent_performance_date ON agent_performance_metrics(agent_id, metric_date);
```

### 4. Task & Story Management Schema

```sql
-- Tasks and user stories - Core work units
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Task identification
    task_number INTEGER NOT NULL, -- Auto-incrementing per project
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Task categorization
    type VARCHAR(50) NOT NULL DEFAULT 'feature' CHECK (
        type IN ('feature', 'bug', 'enhancement', 'refactor', 'documentation', 'test', 'chore')
    ),
    category VARCHAR(100), -- "authentication", "payment", "ui", etc.
    epic_id UUID REFERENCES tasks(id), -- Parent epic
    
    -- Priority and effort
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    story_points INTEGER CHECK (story_points > 0),
    complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 10),
    
    -- Status and workflow
    status VARCHAR(30) DEFAULT 'todo' CHECK (
        status IN ('todo', 'in_progress', 'review', 'testing', 'blocked', 'done', 'cancelled')
    ),
    workflow_state JSONB DEFAULT '{}', -- Custom workflow tracking
    
    -- Assignment and timeline
    assigned_agent_id UUID REFERENCES agents(id),
    reviewer_agent_id UUID REFERENCES agents(id),
    
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Dependencies and relationships
    dependencies UUID[] DEFAULT '{}', -- Array of task IDs
    blocks UUID[] DEFAULT '{}', -- Array of task IDs this blocks
    related_tasks UUID[] DEFAULT '{}',
    
    -- Technical details
    technical_requirements TEXT,
    acceptance_criteria TEXT,
    definition_of_done TEXT,
    git_branch VARCHAR(255),
    git_commits TEXT[],
    pull_request_url VARCHAR(500),
    
    -- Business context
    business_value INTEGER CHECK (business_value BETWEEN 1 AND 10),
    client_priority INTEGER CHECK (client_priority BETWEEN 1 AND 5),
    user_facing BOOLEAN DEFAULT false,
    
    -- Metadata and tracking
    tags TEXT[],
    labels JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    external_links JSONB DEFAULT '{}',
    
    -- Audit and history
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Change tracking
    version INTEGER DEFAULT 1,
    last_modified_by UUID REFERENCES users(id),
    
    UNIQUE(project_id, task_number)
);

-- Task comments and updates
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Comment details
    content TEXT NOT NULL,
    comment_type VARCHAR(30) DEFAULT 'comment' CHECK (
        comment_type IN ('comment', 'status_change', 'assignment', 'time_log', 'system')
    ),
    
    -- Author information
    author_id UUID REFERENCES users(id),
    author_type VARCHAR(20) DEFAULT 'user' CHECK (author_type IN ('user', 'agent', 'system')),
    agent_id UUID REFERENCES agents(id),
    
    -- Metadata
    is_internal BOOLEAN DEFAULT false,
    mentions UUID[] DEFAULT '{}', -- User IDs mentioned
    
    -- Attachments and links
    attachments JSONB DEFAULT '[]',
    external_links JSONB DEFAULT '{}',
    
    -- Threading
    parent_comment_id UUID REFERENCES task_comments(id),
    thread_position INTEGER DEFAULT 1,
    
    -- Status and moderation
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task time tracking
CREATE TABLE task_time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    user_id UUID REFERENCES users(id),
    
    -- Time tracking
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL DEFAULT 'development' CHECK (
        activity_type IN ('development', 'review', 'testing', 'research', 'meeting', 'debugging')
    ),
    description TEXT,
    
    -- Context
    work_location VARCHAR(100), -- "coding", "reviewing", "debugging"
    tools_used TEXT[],
    interruptions INTEGER DEFAULT 0,
    
    -- Quality and outcomes
    productivity_score INTEGER CHECK (productivity_score BETWEEN 1 AND 10),
    output_quality INTEGER CHECK (output_quality BETWEEN 1 AND 10),
    notes TEXT,
    
    -- Billing and tracking
    billable BOOLEAN DEFAULT true,
    billable_rate DECIMAL(8,2),
    invoiced BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task attachments and artifacts
CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Attachment metadata
    attachment_type VARCHAR(50) DEFAULT 'document' CHECK (
        attachment_type IN ('document', 'image', 'code', 'log', 'config', 'other')
    ),
    description TEXT,
    
    -- Access and security
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'team' CHECK (
        access_level IN ('private', 'team', 'project', 'public')
    ),
    checksum VARCHAR(64) NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    
    -- Audit
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes for task management
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent_id) WHERE assigned_agent_id IS NOT NULL;
CREATE INDEX idx_tasks_epic ON tasks(epic_id) WHERE epic_id IS NOT NULL;
CREATE INDEX idx_tasks_priority_status ON tasks(priority DESC, status);
CREATE INDEX idx_tasks_dependencies ON tasks USING GIN(dependencies);
CREATE INDEX idx_task_comments_task_created ON task_comments(task_id, created_at DESC);
CREATE INDEX idx_task_time_logs_task_start ON task_time_logs(task_id, start_time DESC);
CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
CREATE UNIQUE INDEX idx_task_number_project ON tasks(project_id, task_number);
```

### 5. Context Preservation Schema

```sql
-- Context storage for AI conversation preservation
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context identification
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Context classification
    context_type VARCHAR(20) NOT NULL CHECK (context_type IN ('hot', 'warm', 'cold')),
    context_category VARCHAR(50) DEFAULT 'general' CHECK (
        context_category IN ('general', 'technical', 'business', 'decision', 'error', 'learning')
    ),
    
    -- Context content
    content JSONB NOT NULL,
    raw_content TEXT, -- Original unprocessed content
    processed_content TEXT, -- Cleaned and structured content
    
    -- Context metadata
    token_count INTEGER DEFAULT 0,
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    relevance_keywords TEXT[],
    semantic_tags TEXT[],
    
    -- Context relationships
    parent_context_id UUID REFERENCES contexts(id),
    related_contexts UUID[] DEFAULT '{}',
    conversation_id UUID, -- Group related contexts
    sequence_number INTEGER DEFAULT 1,
    
    -- Access and lifecycle
    access_frequency INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    retention_priority INTEGER DEFAULT 3,
    
    -- Quality and integrity
    checksum VARCHAR(64) NOT NULL,
    compression_algorithm VARCHAR(20),
    is_compressed BOOLEAN DEFAULT false,
    validation_status VARCHAR(20) DEFAULT 'pending',
    
    -- Search and retrieval
    search_vector tsvector, -- Full-text search
    embedding_vector VECTOR(1536), -- For semantic search (if using pgvector)
    
    -- Audit and metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    archived_at TIMESTAMP,
    
    -- Custom metadata
    metadata JSONB DEFAULT '{}'
);

-- Context search and retrieval optimization
CREATE TABLE context_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
    
    -- Search terms and phrases
    search_term VARCHAR(255) NOT NULL,
    term_type VARCHAR(30) DEFAULT 'keyword' CHECK (
        term_type IN ('keyword', 'phrase', 'concept', 'entity', 'code_pattern')
    ),
    frequency INTEGER DEFAULT 1,
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    
    -- Context about the term
    context_snippet TEXT,
    position_in_content INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(context_id, search_term)
);

-- Context usage analytics
CREATE TABLE context_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
    
    -- Usage tracking
    accessed_by_agent_id UUID REFERENCES agents(id),
    accessed_by_user_id UUID REFERENCES users(id),
    access_type VARCHAR(30) DEFAULT 'retrieve' CHECK (
        access_type IN ('retrieve', 'inject', 'search', 'reference')
    ),
    
    -- Context of access
    project_id UUID REFERENCES projects(id),
    task_id UUID REFERENCES tasks(id),
    search_query TEXT,
    
    -- Performance metrics
    retrieval_time_ms INTEGER,
    usefulness_score INTEGER CHECK (usefulness_score BETWEEN 1 AND 5),
    
    -- Session information
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    
    accessed_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Context rotation and archival
CREATE TABLE context_rotation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rotation details
    agent_id UUID NOT NULL REFERENCES agents(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    rotation_type VARCHAR(30) DEFAULT 'capacity' CHECK (
        rotation_type IN ('capacity', 'time', 'manual', 'error')
    ),
    
    -- Context management
    contexts_saved INTEGER DEFAULT 0,
    contexts_archived INTEGER DEFAULT 0,
    contexts_deleted INTEGER DEFAULT 0,
    total_token_count INTEGER DEFAULT 0,
    
    -- Performance impact
    rotation_duration_ms INTEGER,
    memory_freed_mb INTEGER,
    
    -- Rotation triggers
    trigger_reason VARCHAR(100),
    capacity_threshold_reached BOOLEAN DEFAULT false,
    time_threshold_reached BOOLEAN DEFAULT false,
    
    -- Results and status
    rotation_successful BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    rotation_started_at TIMESTAMP DEFAULT NOW(),
    rotation_completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for context management
CREATE INDEX idx_contexts_project_agent ON contexts(project_id, agent_id);
CREATE INDEX idx_contexts_type_importance ON contexts(context_type, importance_score DESC);
CREATE INDEX idx_contexts_last_accessed ON contexts(last_accessed_at DESC);
CREATE INDEX idx_contexts_expires ON contexts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_contexts_conversation ON contexts(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_contexts_search_vector ON contexts USING GIN(search_vector);
CREATE INDEX idx_context_search_term ON context_search_index(search_term, term_type);
CREATE INDEX idx_context_usage_agent_time ON context_usage_analytics(accessed_by_agent_id, accessed_at DESC);
CREATE INDEX idx_context_rotation_agent_time ON context_rotation_log(agent_id, rotation_started_at DESC);
```

---

## Quality & Review Management Schema

### 1. Quality Gate System

```sql
-- Quality reviews and code audits
CREATE TABLE quality_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Review identification
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_agent_id UUID NOT NULL REFERENCES agents(id),
    
    -- Review details
    review_type VARCHAR(50) NOT NULL CHECK (
        review_type IN ('code_review', 'security_audit', 'performance_review', 'standards_compliance', 'architecture_review')
    ),
    review_round INTEGER DEFAULT 1,
    
    -- Review content
    code_diff TEXT, -- Git diff or code changes
    files_reviewed TEXT[] DEFAULT '{}',
    review_checklist JSONB DEFAULT '{}',
    
    -- Quality assessment
    overall_score DECIMAL(3,2) CHECK (overall_score BETWEEN 0 AND 1),
    quality_metrics JSONB DEFAULT '{}', -- Detailed scoring breakdown
    
    -- Review status
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'approved', 'rejected', 'needs_changes')
    ),
    decision VARCHAR(30) CHECK (
        decision IN ('approve', 'reject', 'approve_with_changes', 'needs_revision')
    ),
    
    -- Feedback and issues
    summary TEXT,
    detailed_feedback TEXT,
    recommendations TEXT,
    
    -- Timeline
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    -- Metadata
    review_configuration JSONB DEFAULT '{}',
    automated_checks JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality issues and violations
CREATE TABLE quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quality_review_id UUID NOT NULL REFERENCES quality_reviews(id) ON DELETE CASCADE,
    
    -- Issue identification
    issue_type VARCHAR(50) NOT NULL CHECK (
        issue_type IN ('syntax_error', 'type_violation', 'security_vulnerability', 'performance_issue', 
                       'standards_violation', 'logic_error', 'test_coverage', 'documentation')
    ),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (
        severity IN ('critical', 'high', 'medium', 'low', 'info')
    ),
    category VARCHAR(100), -- More specific categorization
    
    -- Issue details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,
    
    -- Location information
    file_path VARCHAR(1000),
    line_number INTEGER,
    column_number INTEGER,
    function_name VARCHAR(255),
    code_snippet TEXT,
    
    -- Issue status
    status VARCHAR(30) DEFAULT 'open' CHECK (
        status IN ('open', 'in_progress', 'resolved', 'wont_fix', 'duplicate')
    ),
    resolution TEXT,
    resolved_by UUID REFERENCES agents(id),
    resolved_at TIMESTAMP,
    
    -- Impact assessment
    business_impact VARCHAR(20) DEFAULT 'low' CHECK (
        business_impact IN ('critical', 'high', 'medium', 'low', 'none')
    ),
    technical_debt_score INTEGER CHECK (technical_debt_score BETWEEN 1 AND 10),
    effort_to_fix INTEGER, -- Estimated minutes
    
    -- References and links
    related_issues UUID[] DEFAULT '{}',
    external_references JSONB DEFAULT '{}',
    
    -- Metadata
    automated_detection BOOLEAN DEFAULT false,
    detection_tool VARCHAR(100),
    confidence_score DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality standards and rules configuration
CREATE TABLE quality_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Standard identification
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Rule definition
    rule_type VARCHAR(50) NOT NULL CHECK (
        rule_type IN ('typescript', 'security', 'performance', 'style', 'architecture', 'testing')
    ),
    rule_definition JSONB NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    
    -- Rule configuration
    is_active BOOLEAN DEFAULT true,
    is_blocking BOOLEAN DEFAULT false, -- Prevents deployment if violated
    auto_fix_available BOOLEAN DEFAULT false,
    
    -- Rule description
    description TEXT,
    rationale TEXT,
    examples JSONB DEFAULT '{}',
    
    -- Scope and application
    applies_to_file_patterns TEXT[] DEFAULT '{}',
    excludes_file_patterns TEXT[] DEFAULT '{}',
    applies_to_agent_types TEXT[] DEFAULT '{}',
    
    -- Metrics and tracking
    violations_count INTEGER DEFAULT 0,
    false_positives_count INTEGER DEFAULT 0,
    last_violation_at TIMESTAMP,
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    parent_standard_id UUID REFERENCES quality_standards(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Quality metrics and trends
CREATE TABLE quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric scope
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    task_id UUID REFERENCES tasks(id),
    
    -- Time period
    metric_date DATE NOT NULL,
    metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),
    
    -- Code quality metrics
    lines_of_code INTEGER DEFAULT 0,
    cyclomatic_complexity DECIMAL(6,2),
    code_duplication_percentage DECIMAL(5,2),
    test_coverage_percentage DECIMAL(5,2),
    
    -- Quality gate metrics
    quality_gate_score DECIMAL(3,2),
    reviews_passed INTEGER DEFAULT 0,
    reviews_failed INTEGER DEFAULT 0,
    issues_found INTEGER DEFAULT 0,
    issues_resolved INTEGER DEFAULT 0,
    
    -- Security metrics
    security_vulnerabilities INTEGER DEFAULT 0,
    security_score DECIMAL(3,2),
    
    -- Performance metrics
    performance_score DECIMAL(3,2),
    memory_efficiency_score DECIMAL(3,2),
    
    -- Standards compliance
    standards_compliance_score DECIMAL(3,2),
    style_violations INTEGER DEFAULT 0,
    
    -- Technical debt
    technical_debt_score INTEGER DEFAULT 0,
    maintainability_index DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(project_id, agent_id, task_id, metric_date, metric_hour)
);

-- Indexes for quality management
CREATE INDEX idx_quality_reviews_task_status ON quality_reviews(task_id, status);
CREATE INDEX idx_quality_reviews_reviewer_completed ON quality_reviews(reviewer_agent_id, completed_at DESC);
CREATE INDEX idx_quality_issues_review_severity ON quality_issues(quality_review_id, severity);
CREATE INDEX idx_quality_issues_status_created ON quality_issues(status, created_at DESC);
CREATE INDEX idx_quality_standards_project_active ON quality_standards(project_id) WHERE is_active = true;
CREATE INDEX idx_quality_metrics_project_date ON quality_metrics(project_id, metric_date DESC);
```

---

## Timeline Intelligence Schema

### 1. Estimation and Learning Data

```sql
-- Timeline learning and estimation data
CREATE TABLE timeline_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Task and project context
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    
    -- Estimation data
    initial_estimate_hours DECIMAL(6,2) NOT NULL,
    revised_estimates JSONB DEFAULT '[]', -- Array of estimate revisions
    final_estimate_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    
    -- Variance analysis
    variance_percentage DECIMAL(6,2), -- (actual - estimated) / estimated * 100
    variance_category VARCHAR(30) CHECK (
        variance_category IN ('underestimate', 'overestimate', 'accurate')
    ),
    accuracy_score DECIMAL(3,2), -- 1.0 = perfect, 0.0 = completely wrong
    
    -- Task complexity factors
    complexity_factors JSONB DEFAULT '{}', -- Factors that affected complexity
    risk_factors JSONB DEFAULT '{}', -- Risk factors identified
    completion_factors JSONB DEFAULT '{}', -- Factors that affected completion
    
    -- Learning insights
    lessons_learned TEXT,
    estimation_notes TEXT,
    improvement_suggestions TEXT,
    
    -- Timeline events
    estimation_date TIMESTAMP NOT NULL,
    start_date TIMESTAMP,
    first_delay_date TIMESTAMP,
    completion_date TIMESTAMP,
    
    -- Context and metadata
    estimation_method VARCHAR(50) DEFAULT 'ai_prediction',
    estimator_agent_id UUID REFERENCES agents(id),
    estimation_confidence DECIMAL(3,2),
    
    -- External factors
    blockers_encountered INTEGER DEFAULT 0,
    scope_changes INTEGER DEFAULT 0,
    external_dependencies INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Timeline predictions and models
CREATE TABLE timeline_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Prediction context
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Model information
    model_version VARCHAR(50) NOT NULL,
    prediction_algorithm VARCHAR(100),
    
    -- Prediction details
    predicted_hours DECIMAL(6,2) NOT NULL,
    confidence_interval_min DECIMAL(6,2),
    confidence_interval_max DECIMAL(6,2),
    confidence_percentage DECIMAL(3,2),
    
    -- Prediction factors
    input_features JSONB NOT NULL, -- Features used for prediction
    feature_weights JSONB DEFAULT '{}', -- Feature importance weights
    similar_tasks UUID[] DEFAULT '{}', -- Tasks used for comparison
    
    -- Risk assessment
    risk_score DECIMAL(3,2),
    risk_factors JSONB DEFAULT '[]',
    mitigation_suggestions TEXT[],
    
    -- Prediction outcomes
    actual_outcome_hours DECIMAL(6,2),
    prediction_accuracy DECIMAL(3,2),
    model_performance_score DECIMAL(3,2),
    
    -- Timeline
    predicted_at TIMESTAMP DEFAULT NOW(),
    prediction_for_date DATE,
    outcome_recorded_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Timeline learning patterns
CREATE TABLE timeline_learning_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern identification
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL CHECK (
        pattern_type IN ('task_similarity', 'agent_performance', 'complexity_correlation', 'risk_pattern')
    ),
    
    -- Pattern scope
    project_id UUID REFERENCES projects(id),
    agent_id UUID REFERENCES agents(id),
    task_types TEXT[] DEFAULT '{}',
    
    -- Pattern definition
    pattern_definition JSONB NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    
    -- Pattern performance
    instances_matched INTEGER DEFAULT 0,
    successful_predictions INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(3,2),
    
    -- Pattern evolution
    learning_rate DECIMAL(3,2) DEFAULT 0.1,
    last_updated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Pattern metadata
    description TEXT,
    examples JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Timeline adjustment events
CREATE TABLE timeline_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Adjustment context
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),
    
    -- Adjustment details
    adjustment_type VARCHAR(50) NOT NULL CHECK (
        adjustment_type IN ('scope_change', 'blocker', 'resource_change', 'requirement_change', 'external_dependency')
    ),
    
    -- Impact measurement
    original_estimate_hours DECIMAL(6,2),
    adjusted_estimate_hours DECIMAL(6,2),
    impact_hours DECIMAL(6,2),
    impact_percentage DECIMAL(6,2),
    
    -- Adjustment reasons
    reason TEXT NOT NULL,
    detailed_explanation TEXT,
    trigger_event VARCHAR(255),
    
    -- Approval and authorization
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
        approval_status IN ('pending', 'approved', 'rejected')
    ),
    
    -- Client communication
    client_notified BOOLEAN DEFAULT false,
    client_approved BOOLEAN DEFAULT false,
    client_notification_sent_at TIMESTAMP,
    
    -- Timeline impact
    original_due_date DATE,
    adjusted_due_date DATE,
    cascade_impact JSONB DEFAULT '{}', -- Impact on dependent tasks
    
    -- Metadata
    adjustment_date TIMESTAMP DEFAULT NOW(),
    effective_date TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for timeline intelligence
CREATE INDEX idx_timeline_data_project_task ON timeline_data(project_id, task_id);
CREATE INDEX idx_timeline_data_variance ON timeline_data(variance_percentage, accuracy_score);
CREATE INDEX idx_timeline_predictions_project_date ON timeline_predictions(project_id, predicted_at DESC);
CREATE INDEX idx_timeline_patterns_active ON timeline_learning_patterns(pattern_type) WHERE is_active = true;
CREATE INDEX idx_timeline_adjustments_project_date ON timeline_adjustments(project_id, adjustment_date DESC);
```

---

## Communication & Notification Schema

### 1. Client Communication System

```sql
-- Client communication and updates
CREATE TABLE client_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Communication context
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Communication details
    communication_type VARCHAR(50) NOT NULL CHECK (
        communication_type IN ('status_update', 'change_request', 'milestone_reached', 'issue_report', 'timeline_update', 'invoice', 'general')
    ),
    channel VARCHAR(30) DEFAULT 'email' CHECK (
        channel IN ('email', 'sms', 'phone', 'meeting', 'portal', 'automated')
    ),
    
    -- Message content
    subject VARCHAR(255) NOT NULL,
    message_body TEXT NOT NULL,
    formatted_message JSONB DEFAULT '{}', -- Rich formatting, attachments, etc.
    
    -- Recipients
    primary_recipients TEXT[] DEFAULT '{}', -- Email addresses
    cc_recipients TEXT[] DEFAULT '{}',
    bcc_recipients TEXT[] DEFAULT '{}',
    
    -- Status and delivery
    status VARCHAR(30) DEFAULT 'draft' CHECK (
        status IN ('draft', 'scheduled', 'sent', 'delivered', 'read', 'replied', 'failed')
    ),
    scheduled_send_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Responses and engagement
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMP,
    client_response TEXT,
    client_responded_at TIMESTAMP,
    
    -- Tracking and analytics
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(3,2),
    
    -- Templates and automation
    template_id UUID,
    is_automated BOOLEAN DEFAULT false,
    automation_trigger VARCHAR(100),
    
    -- Attachments and links
    attachments JSONB DEFAULT '[]',
    external_links JSONB DEFAULT '{}',
    
    -- Priority and urgency
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    is_urgent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Notification target
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (
        notification_type IN ('task_update', 'agent_status', 'quality_alert', 'timeline_change', 'system_alert', 'client_message')
    ),
    
    -- Delivery channels
    channels JSONB DEFAULT '[]', -- ["email", "tts", "mobile", "web"]
    delivery_preferences JSONB DEFAULT '{}',
    
    -- Context and metadata
    project_id UUID REFERENCES projects(id),
    task_id UUID REFERENCES tasks(id),
    related_entity_id UUID, -- Generic reference
    related_entity_type VARCHAR(50),
    
    -- Priority and urgency
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'critical')
    ),
    urgency_score INTEGER DEFAULT 3 CHECK (urgency_score BETWEEN 1 AND 5),
    
    -- Delivery status
    status VARCHAR(30) DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'delivered', 'read', 'dismissed', 'failed')
    ),
    
    -- Delivery tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    
    -- TTS specific
    tts_voice_profile VARCHAR(50),
    tts_message TEXT, -- Optimized for speech
    tts_delivered BOOLEAN DEFAULT false,
    
    -- Mobile specific
    mobile_delivered BOOLEAN DEFAULT false,
    mobile_clicked BOOLEAN DEFAULT false,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_retry_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Communication templates
CREATE TABLE communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template identification
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    
    -- Template content
    subject_template VARCHAR(500),
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Available template variables
    
    -- Template configuration
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false,
    supports_html BOOLEAN DEFAULT true,
    supports_tts BOOLEAN DEFAULT false,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    
    -- Template metadata
    description TEXT,
    tags TEXT[],
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    parent_template_id UUID REFERENCES communication_templates(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Indexes for communication system
CREATE INDEX idx_client_communications_project_date ON client_communications(project_id, created_at DESC);
CREATE INDEX idx_client_communications_status ON client_communications(status, scheduled_send_at);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_created_priority ON notifications(created_at DESC, priority);
CREATE INDEX idx_communication_templates_type_active ON communication_templates(template_type) WHERE is_active = true;
```

---

## Redis Data Structures & Caching Strategy

### 1. Real-time Data Management

```javascript
// Redis Key Patterns and Data Structures for SENTRA

// Agent Status Management (Hash)
const agentStatusKeys = {
  // Agent real-time status
  "agent:status:{agent-id}": {
    status: "active|busy|offline|maintenance",
    current_task_id: "task-uuid",
    project_id: "project-uuid", 
    cpu_usage: "45.2",
    memory_usage: "512",
    last_heartbeat: "1692864000",
    tasks_completed_today: "3",
    current_context_tokens: "75000"
  },
  
  // Agent performance metrics (today)
  "agent:metrics:{agent-id}:today": {
    tasks_started: "5",
    tasks_completed: "3",
    lines_of_code: "247",
    quality_gate_passes: "2",
    quality_gate_fails: "1",
    average_task_time: "2.5",
    context_switches: "8"
  }
};

// Project Dashboard Data (Hash)
const projectDashboardKeys = {
  "project:dashboard:{project-id}": {
    total_tasks: "25",
    completed_tasks: "18",
    in_progress_tasks: "4",
    blocked_tasks: "1",
    active_agents: "3",
    estimated_completion: "2024-08-30T15:00:00Z",
    current_velocity: "3.2", // tasks per day
    budget_used: "47000",
    budget_total: "65000",
    client_satisfaction: "4.8"
  },
  
  // Real-time project activity feed
  "project:activity:{project-id}": [
    '{"timestamp":"2024-08-24T14:30:00Z","agent":"dev-james","action":"completed","task":"AUTH-001","message":"Completed JWT authentication implementation"}',
    '{"timestamp":"2024-08-24T14:25:00Z","agent":"qa-sarah","action":"review_passed","task":"AUTH-001","message":"Code review passed with minor suggestions"}',
    '{"timestamp":"2024-08-24T14:15:00Z","agent":"pm-mike","action":"created","task":"AUTH-002","message":"Created password reset functionality story"}'
  ]
};

// Task Queue Management (Lists with Priority)
const taskQueueKeys = {
  // Priority-based task queues
  "queue:critical": ["AUTH-001", "PAY-005"],
  "queue:high": ["UI-003", "API-012"], 
  "queue:normal": ["DOC-001", "TEST-008"],
  "queue:low": ["REFACTOR-002"],
  
  // Agent-specific queues
  "queue:agent:dev-james": ["AUTH-002", "USER-001"],
  "queue:agent:qa-sarah": ["REVIEW-AUTH-001"],
  
  // Blocked tasks queue
  "queue:blocked": ["PAY-003", "INT-007"]
};

// Real-time Communication (Pub/Sub)
const pubSubChannels = {
  // Project-specific updates
  "updates:project:{project-id}": [
    '{"type":"task_completed","taskId":"AUTH-001","agent":"dev-james","timestamp":"2024-08-24T14:30:00Z"}',
    '{"type":"agent_status_change","agentId":"qa-sarah","status":"available","timestamp":"2024-08-24T14:31:00Z"}',
    '{"type":"quality_gate_result","taskId":"AUTH-001","result":"passed","reviewer":"qa-sarah"}'
  ],
  
  // Global system updates
  "updates:system": [
    '{"type":"system_health","status":"healthy","timestamp":"2024-08-24T14:32:00Z"}',
    '{"type":"maintenance_scheduled","start":"2024-08-25T02:00:00Z","duration":"30min"}'
  ],
  
  // Agent coordination
  "coordination:agents": [
    '{"type":"resource_request","agent":"dev-james","resource":"database_schema","project":"xyz-123"}',
    '{"type":"context_share","from":"dev-james","to":"qa-sarah","contextId":"ctx-456"}'
  ]
};

// Context Caching (String with TTL)
const contextCacheKeys = {
  // Hot context (immediate access)
  "context:hot:{agent-id}:{project-id}": {
    value: '{"currentTask":"AUTH-001","recentDecisions":[...],"activeContext":"implementing JWT tokens"}',
    ttl: 3600 // 1 hour
  },
  
  // Warm context (project-specific)
  "context:warm:{project-id}": {
    value: '{"techStack":{"framework":"nextjs","version":"15.x"},"patterns":[...],"decisions":[...]}',
    ttl: 86400 // 24 hours
  },
  
  // Context search results
  "context:search:{query-hash}": {
    value: '{"results":[{"contextId":"ctx-123","relevance":0.95,"snippet":"..."}],"timestamp":"..."}',
    ttl: 1800 // 30 minutes
  }
};

// Session Management (Hash with TTL)
const sessionKeys = {
  "session:user:{user-id}": {
    user_id: "user-456",
    email: "user@example.com",
    active_projects: "xyz-123,abc-789",
    current_project: "xyz-123",
    permissions: "read:projects,write:projects",
    device_type: "web",
    last_activity: "1692864000",
    preferences: '{"tts_enabled":true,"notifications":"all"}'
  },
  
  // Agent session data
  "session:agent:{agent-id}": {
    agent_id: "dev-james",
    project_id: "xyz-123", 
    current_context_id: "ctx-789",
    conversation_state: "active",
    token_count: "75000",
    last_context_rotation: "1692860400"
  }
};

// Timeline Intelligence Cache (Hash)
const timelineKeys = {
  // Prediction cache
  "timeline:prediction:{task-id}": {
    estimated_hours: "6.5",
    confidence: "0.87",
    similar_tasks: "AUTH-005,USER-003,LOGIN-001",
    risk_factors: '["new_technology","complex_integration"]',
    cached_at: "1692864000"
  },
  
  // Learning patterns cache
  "timeline:patterns:{project-id}": {
    pattern_data: '{"auth_tasks_avg":"4.2","ui_tasks_avg":"2.8","api_tasks_avg":"5.1"}',
    last_updated: "1692850000",
    sample_size: "47"
  }
};

// Quality Gate Cache (Sets and Hashes)
const qualityKeys = {
  // Failed quality checks
  "quality:failed:{project-id}": [
    "AUTH-001:typescript-any-type",
    "USER-002:security-validation-missing",
    "PAY-001:performance-n-plus-one"
  ],
  
  // Quality standards cache
  "quality:standards:{project-id}": {
    no_any_types: "true",
    security_validation_required: "true",
    test_coverage_minimum: "90",
    performance_budget_ms: "2000",
    last_updated: "1692850000"
  }
};

// Message Queues (Lists + Streams)
const messageQueueKeys = {
  // Agent task assignments
  "queue:assignments": [
    '{"agent":"dev-james","task":"AUTH-002","priority":"high","assigned_at":"1692864000"}',
    '{"agent":"qa-sarah","task":"REVIEW-AUTH-001","priority":"normal","assigned_at":"1692864060"}'
  ],
  
  // System events stream
  "stream:system_events": {
    // Redis Streams for event sourcing
    "1692864000000-0": {
      event_type: "task_completed",
      task_id: "AUTH-001", 
      agent_id: "dev-james",
      project_id: "xyz-123",
      metadata: '{"duration":"4.2","quality_score":"0.95"}'
    }
  }
};

// Monitoring and Analytics (Sorted Sets)
const analyticsKeys = {
  // Agent performance leaderboard
  "analytics:agent_performance:today": {
    "dev-james": 95.5,
    "qa-sarah": 92.3,
    "pm-mike": 88.7
  },
  
  // Project velocity tracking
  "analytics:project_velocity:{project-id}": {
    "2024-08-24": 3.2,
    "2024-08-23": 2.8,
    "2024-08-22": 3.5
  },
  
  // Quality trends
  "analytics:quality_trends:{project-id}": {
    "2024-08-24": 94.2,
    "2024-08-23": 91.8,
    "2024-08-22": 95.1
  }
};
```

### 2. Cache Management Strategy

```javascript
// Cache Management and Invalidation Strategy

class SENTRACacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.cacheTTLs = {
      hot_context: 3600,        // 1 hour
      warm_context: 86400,      // 24 hours
      cold_context: 604800,     // 7 days
      agent_status: 300,        // 5 minutes
      project_dashboard: 600,   // 10 minutes
      quality_standards: 86400, // 24 hours
      timeline_predictions: 1800, // 30 minutes
      search_results: 1800      // 30 minutes
    };
  }

  // Context caching with intelligent eviction
  async cacheContext(agentId, projectId, contextType, contextData) {
    const key = `context:${contextType}:${agentId}:${projectId}`;
    const ttl = this.cacheTTLs[`${contextType}_context`];
    
    await this.redis.setex(key, ttl, JSON.stringify({
      data: contextData,
      cached_at: Date.now(),
      token_count: this.calculateTokenCount(contextData),
      checksum: this.generateChecksum(contextData)
    }));
    
    // Update context access patterns
    await this.redis.zadd(
      `access_patterns:${agentId}:${projectId}`,
      Date.now(),
      key
    );
  }

  // Agent status caching with real-time updates
  async updateAgentStatus(agentId, statusData) {
    const key = `agent:status:${agentId}`;
    const multi = this.redis.multi();
    
    // Update all status fields
    Object.entries(statusData).forEach(([field, value]) => {
      multi.hset(key, field, value);
    });
    
    multi.hset(key, 'last_updated', Date.now());
    multi.expire(key, this.cacheTTLs.agent_status);
    
    // Publish status change
    multi.publish('updates:agent_status', JSON.stringify({
      agent_id: agentId,
      ...statusData,
      timestamp: new Date().toISOString()
    }));
    
    await multi.exec();
  }

  // Project dashboard caching with smart invalidation
  async updateProjectDashboard(projectId, dashboardData) {
    const key = `project:dashboard:${projectId}`;
    
    // Cache dashboard data
    await this.redis.hmset(key, {
      ...dashboardData,
      last_updated: Date.now()
    });
    
    await this.redis.expire(key, this.cacheTTLs.project_dashboard);
    
    // Invalidate related caches
    await this.invalidateRelatedCaches(projectId, 'project_update');
  }

  // Intelligent cache invalidation
  async invalidateRelatedCaches(entityId, changeType) {
    const invalidationRules = {
      task_update: [
        `project:dashboard:${entityId}`,
        `timeline:prediction:${entityId}`,
        'analytics:project_velocity:*'
      ],
      agent_status_change: [
        `project:dashboard:*`,
        `queue:agent:${entityId}`
      ],
      quality_gate_result: [
        `quality:standards:${entityId}`,
        `analytics:quality_trends:${entityId}`
      ]
    };
    
    const keysToInvalidate = invalidationRules[changeType] || [];
    
    for (const keyPattern of keysToInvalidate) {
      if (keyPattern.includes('*')) {
        const keys = await this.redis.keys(keyPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.del(keyPattern);
      }
    }
  }

  // Cache warming strategy
  async warmCaches(projectId) {
    // Pre-load frequently accessed data
    const warmingTasks = [
      this.warmProjectData(projectId),
      this.warmAgentStatuses(projectId),
      this.warmQualityStandards(projectId),
      this.warmTimelinePredictions(projectId)
    ];
    
    await Promise.all(warmingTasks);
  }

  // Memory management and cleanup
  async performCacheCleanup() {
    // Remove expired keys
    const expiredKeys = await this.redis.eval(`
      local expired = {}
      local cursor = 0
      repeat
        local scan = redis.call('SCAN', cursor, 'MATCH', '*', 'COUNT', 1000)
        cursor = scan[1]
        for i, key in ipairs(scan[2]) do
          if redis.call('TTL', key) == -1 then
            table.insert(expired, key)
          end
        end
      until cursor == '0'
      return expired
    `, 0);
    
    if (expiredKeys.length > 0) {
      await this.redis.del(...expiredKeys);
    }
    
    // Clean up low-access context
    await this.cleanupLowAccessContexts();
  }
}
```

---

## Database Optimization & Performance

### 1. Indexing Strategy

```sql
-- Comprehensive indexing strategy for optimal performance

-- User and Authentication Indexes
CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE is_active = true;
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;
CREATE INDEX idx_api_keys_usage ON api_keys(usage_count DESC, last_used_at DESC) WHERE is_active = true;

-- Project Management Indexes
CREATE INDEX idx_projects_client_priority ON projects(client_name, priority DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_tech_stack ON projects USING GIN(tech_stack);
CREATE INDEX idx_projects_completion_date ON projects(estimated_completion_date) WHERE status = 'active';
CREATE INDEX idx_project_members_role ON project_members(role, project_id) WHERE status = 'active';

-- Agent Performance Indexes
CREATE INDEX idx_agents_capabilities_gin ON agents USING GIN(capabilities);
CREATE INDEX idx_agents_performance ON agents(performance_score DESC, status) WHERE is_active = true;
CREATE INDEX idx_agent_instances_container ON agent_instances(container_id) WHERE status = 'running';
CREATE INDEX idx_agent_assignments_due ON agent_assignments(due_date) WHERE status IN ('assigned', 'in_progress');
CREATE INDEX idx_agent_metrics_performance ON agent_performance_metrics(agent_id, metric_date DESC);

-- Task Management Indexes
CREATE INDEX idx_tasks_priority_status ON tasks(priority DESC, status, project_id);
CREATE INDEX idx_tasks_assignee_status ON tasks(assigned_agent_id, status) WHERE assigned_agent_id IS NOT NULL;
CREATE INDEX idx_tasks_epic_status ON tasks(epic_id, status) WHERE epic_id IS NOT NULL;
CREATE INDEX idx_tasks_completion_tracking ON tasks(estimated_end_date, actual_end_date);
CREATE INDEX idx_tasks_dependencies_gin ON tasks USING GIN(dependencies);
CREATE INDEX idx_task_time_logs_billing ON task_time_logs(billable, created_at DESC) WHERE billable = true;

-- Context and Search Indexes
CREATE INDEX idx_contexts_importance ON contexts(importance_score DESC, context_type);
CREATE INDEX idx_contexts_conversation ON contexts(conversation_id, sequence_number);
CREATE INDEX idx_contexts_semantic_search ON contexts USING GIN(search_vector);
CREATE INDEX idx_context_search_relevance ON context_search_index(relevance_score DESC, search_term);
CREATE INDEX idx_context_usage_frequency ON context_usage_analytics(accessed_at DESC, usefulness_score DESC);

-- Quality Management Indexes
CREATE INDEX idx_quality_reviews_completion ON quality_reviews(completed_at DESC, status);
CREATE INDEX idx_quality_issues_severity ON quality_issues(severity, status, created_at DESC);
CREATE INDEX idx_quality_standards_blocking ON quality_standards(is_blocking, is_active) WHERE is_active = true;
CREATE INDEX idx_quality_metrics_trends ON quality_metrics(project_id, metric_date DESC, quality_gate_score);

-- Timeline Intelligence Indexes
CREATE INDEX idx_timeline_accuracy ON timeline_data(accuracy_score DESC, variance_percentage);
CREATE INDEX idx_timeline_predictions_confidence ON timeline_predictions(confidence_percentage DESC, predicted_at DESC);
CREATE INDEX idx_timeline_patterns_performance ON timeline_learning_patterns(accuracy_rate DESC) WHERE is_active = true;

-- Communication Indexes
CREATE INDEX idx_client_communications_priority ON client_communications(priority, status, scheduled_send_at);
CREATE INDEX idx_notifications_delivery ON notifications(status, priority, created_at DESC);
CREATE INDEX idx_communication_templates_usage ON communication_templates(usage_count DESC) WHERE is_active = true;

-- Composite indexes for common queries
CREATE INDEX idx_tasks_project_agent_status ON tasks(project_id, assigned_agent_id, status);
CREATE INDEX idx_agent_assignments_project_priority ON agent_assignments(project_id, priority DESC, status);
CREATE INDEX idx_quality_reviews_task_reviewer ON quality_reviews(task_id, reviewer_agent_id, status);
CREATE INDEX idx_timeline_data_project_variance ON timeline_data(project_id, variance_percentage, completion_date);
```

### 2. Database Partitioning Strategy

```sql
-- Partitioning strategy for high-volume tables

-- Partition agent performance metrics by date
CREATE TABLE agent_performance_metrics_template (
    LIKE agent_performance_metrics INCLUDING ALL
) PARTITION BY RANGE (metric_date);

-- Create monthly partitions for performance data
CREATE TABLE agent_performance_metrics_2024_08 PARTITION OF agent_performance_metrics_template
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE agent_performance_metrics_2024_09 PARTITION OF agent_performance_metrics_template
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

-- Partition context storage by project and date
CREATE TABLE contexts_template (
    LIKE contexts INCLUDING ALL
) PARTITION BY HASH (project_id);

-- Create hash partitions for context distribution
CREATE TABLE contexts_partition_0 PARTITION OF contexts_template
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE contexts_partition_1 PARTITION OF contexts_template  
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE contexts_partition_2 PARTITION OF contexts_template
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE contexts_partition_3 PARTITION OF contexts_template
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Partition timeline data by date for efficient archival
CREATE TABLE timeline_data_template (
    LIKE timeline_data INCLUDING ALL
) PARTITION BY RANGE (completion_date);

CREATE TABLE timeline_data_2024_q3 PARTITION OF timeline_data_template
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE timeline_data_2024_q4 PARTITION OF timeline_data_template
    FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
```

### 3. Database Maintenance and Monitoring

```sql
-- Database maintenance procedures

-- Automated vacuum and analyze
CREATE OR REPLACE FUNCTION maintain_database_performance()
RETURNS void AS $$
BEGIN
    -- Vacuum frequently updated tables
    VACUUM ANALYZE tasks;
    VACUUM ANALYZE agent_instances;
    VACUUM ANALYZE contexts;
    VACUUM ANALYZE quality_reviews;
    VACUUM ANALYZE notifications;
    
    -- Update table statistics
    ANALYZE projects;
    ANALYZE agents;
    ANALYZE timeline_data;
    
    -- Clean up expired data
    DELETE FROM user_sessions WHERE expires_at < NOW();
    DELETE FROM notifications WHERE expires_at < NOW();
    DELETE FROM contexts WHERE expires_at < NOW();
    
    -- Archive old performance data
    INSERT INTO agent_performance_metrics_archive 
    SELECT * FROM agent_performance_metrics 
    WHERE metric_date < CURRENT_DATE - INTERVAL '90 days';
    
    DELETE FROM agent_performance_metrics 
    WHERE metric_date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance job
SELECT cron.schedule('database-maintenance', '0 2 * * *', 'SELECT maintain_database_performance();');

-- Performance monitoring queries
CREATE OR REPLACE VIEW database_performance_summary AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query performance monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
WHERE calls > 100 AND mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

---

## Data Migration & Backup Strategy

### 1. Migration Scripts

```sql
-- Database migration framework
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT,
    checksum VARCHAR(64)
);

-- Migration: Add context embedding support
-- Migration Version: 001_add_context_embeddings
BEGIN;

-- Add vector extension for semantic search (if using pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to contexts table
ALTER TABLE contexts 
ADD COLUMN embedding_vector VECTOR(1536) DEFAULT NULL,
ADD COLUMN embedding_model VARCHAR(100) DEFAULT NULL,
ADD COLUMN embedding_created_at TIMESTAMP DEFAULT NULL;

-- Create index for vector similarity search
CREATE INDEX ON contexts USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- Update migration tracking
INSERT INTO schema_migrations (version, description, checksum)
VALUES ('001_add_context_embeddings', 'Add vector embeddings for semantic context search', 
        md5('001_add_context_embeddings'));

COMMIT;

-- Migration: Add advanced timeline features
-- Migration Version: 002_timeline_enhancements
BEGIN;

-- Add machine learning model tracking
CREATE TABLE timeline_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    training_data_size INTEGER,
    accuracy_score DECIMAL(5,4),
    features_used JSONB DEFAULT '{}',
    hyperparameters JSONB DEFAULT '{}',
    trained_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT false,
    performance_metrics JSONB DEFAULT '{}'
);

-- Add model reference to predictions
ALTER TABLE timeline_predictions
ADD COLUMN model_id UUID REFERENCES timeline_models(id),
ADD COLUMN feature_importance JSONB DEFAULT '{}';

-- Insert migration record
INSERT INTO schema_migrations (version, description, checksum)
VALUES ('002_timeline_enhancements', 'Add ML model tracking for timeline predictions',
        md5('002_timeline_enhancements'));

COMMIT;
```

### 2. Backup and Recovery Strategy

```bash
#!/bin/bash
# SENTRA Database Backup Strategy

# Configuration
DB_NAME="sentra"
DB_USER="sentra"
BACKUP_DIR="/opt/sentra/backups"
S3_BUCKET="sentra-backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
backup_database() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${DB_NAME}_${backup_type}_${timestamp}.sql.gz"
    
    echo "Starting $backup_type backup at $(date)"
    
    # Create compressed backup
    pg_dump -h localhost -U $DB_USER -d $DB_NAME \
        --verbose --format=custom --compress=9 \
        --file="$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "Backup completed: $backup_file"
        
        # Upload to S3 with encryption
        aws s3 cp "$backup_file" "s3://$S3_BUCKET/database/" \
            --server-side-encryption AES256
        
        # Verify backup integrity
        pg_restore --list "$backup_file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "Backup integrity verified"
        else
            echo "ERROR: Backup integrity check failed"
            exit 1
        fi
    else
        echo "ERROR: Backup failed"
        exit 1
    fi
}

# Incremental backup using WAL files
backup_wal_files() {
    local wal_archive="/var/lib/postgresql/wal_archive"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Archive WAL files
    tar -czf "$BACKUP_DIR/wal_${timestamp}.tar.gz" -C "$wal_archive" .
    
    # Upload to S3
    aws s3 cp "$BACKUP_DIR/wal_${timestamp}.tar.gz" "s3://$S3_BUCKET/wal/"
    
    # Clean up local WAL files older than 2 days
    find "$wal_archive" -name "*.backup" -mtime +2 -delete
}

# Context and file backup
backup_contexts_and_files() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local context_dir="/opt/sentra/data/contexts"
    local file_storage="/opt/sentra/data/files"
    
    # Backup context files
    if [ -d "$context_dir" ]; then
        tar -czf "$BACKUP_DIR/contexts_${timestamp}.tar.gz" -C "$context_dir" .
        aws s3 cp "$BACKUP_DIR/contexts_${timestamp}.tar.gz" "s3://$S3_BUCKET/contexts/"
    fi
    
    # Backup file storage
    if [ -d "$file_storage" ]; then
        tar -czf "$BACKUP_DIR/files_${timestamp}.tar.gz" -C "$file_storage" .
        aws s3 cp "$BACKUP_DIR/files_${timestamp}.tar.gz" "s3://$S3_BUCKET/files/"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    echo "Cleaning up backups older than $RETENTION_DAYS days"
    
    # Local cleanup
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # S3 cleanup (requires lifecycle policy or manual script)
    aws s3api list-objects --bucket "$S3_BUCKET" \
        --query "Contents[?LastModified<='$(date -d "${RETENTION_DAYS} days ago" --iso-8601)'].Key" \
        --output text | xargs -I {} aws s3 rm "s3://$S3_BUCKET/{}"
}

# Recovery procedures
recover_database() {
    local backup_file=$1
    local target_db=$2
    
    echo "Starting database recovery from $backup_file"
    
    # Create target database
    createdb -h localhost -U $DB_USER "$target_db"
    
    # Restore from backup
    pg_restore -h localhost -U $DB_USER -d "$target_db" \
        --verbose --clean --if-exists "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "Database recovery completed successfully"
    else
        echo "ERROR: Database recovery failed"
        exit 1
    fi
}

# Point-in-time recovery
point_in_time_recovery() {
    local target_time=$1
    local recovery_db=$2
    
    echo "Starting point-in-time recovery to $target_time"
    
    # Stop PostgreSQL
    systemctl stop postgresql
    
    # Restore base backup
    rm -rf /var/lib/postgresql/data/*
    tar -xzf "$BACKUP_DIR/base_backup_latest.tar.gz" -C /var/lib/postgresql/data/
    
    # Create recovery configuration
    cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '$target_time'
recovery_target_action = 'promote'
EOF
    
    # Start PostgreSQL for recovery
    systemctl start postgresql
    
    echo "Point-in-time recovery initiated"
}

# Main execution based on argument
case "$1" in
    "full")
        backup_database "full"
        ;;
    "incremental")
        backup_wal_files
        ;;
    "contexts")
        backup_contexts_and_files
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "recover")
        recover_database "$2" "$3"
        ;;
    "pitr")
        point_in_time_recovery "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {full|incremental|contexts|cleanup|recover <backup_file> <target_db>|pitr <target_time> <recovery_db>}"
        exit 1
        ;;
esac
```

---

## Conclusion

This comprehensive database design provides the foundation for SENTRA's advanced AI Code Engineering Platform. The schema supports:

1. **Multi-Agent Orchestration**: Complete agent lifecycle, task distribution, and coordination tracking
2. **Context Preservation**: Intelligent context storage with search and retrieval capabilities  
3. **Quality Enforcement**: Comprehensive quality review and issue tracking systems
4. **Timeline Intelligence**: Machine learning-ready data structures for accurate estimation
5. **Professional Communication**: Client communication and notification management
6. **Performance Optimization**: Strategic indexing, partitioning, and caching for scale
7. **Data Integrity**: Comprehensive backup, recovery, and migration strategies

The design emphasizes:
- **Scalability**: Partitioned tables and optimized indexes for growth
- **Performance**: Redis caching layer and query optimization
- **Reliability**: Comprehensive backup and point-in-time recovery
- **Security**: Encrypted storage and audit trails throughout
- **Extensibility**: Flexible JSONB fields for future enhancements

**Next Steps**: Implement the API specifications and service architecture that will interact with this database foundation.

---

*This database design serves as the complete data foundation for the SENTRA platform and should be implemented alongside the system architecture for optimal performance.*