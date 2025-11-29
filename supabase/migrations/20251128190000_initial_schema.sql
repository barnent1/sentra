-- Quetrex Initial Schema
-- Creates all tables in dependency order

-- ============================================================================
-- Organizations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'company')),
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_price REAL NOT NULL DEFAULT 0,
    billing_email TEXT,
    settings TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Organization Members Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS organization_members_org_id_idx ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON organization_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS organization_members_org_user_idx ON organization_members(org_id, user_id);

-- ============================================================================
-- Teams Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS teams_org_id_idx ON teams(org_id);

-- ============================================================================
-- Team Members Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_user_idx ON team_members(team_id, user_id);

-- ============================================================================
-- Organization Invitations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_invitations (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS organization_invitations_org_id_idx ON organization_invitations(org_id);
CREATE INDEX IF NOT EXISTS organization_invitations_email_idx ON organization_invitations(email);
CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_token_idx ON organization_invitations(token);

-- ============================================================================
-- Runners Table (Self-Hosted Runners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS runners (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('hetzner', 'aws', 'gcp', 'azure', 'other')),
    region TEXT NOT NULL,
    server_type TEXT NOT NULL,
    ip_address TEXT,
    ssh_key_id TEXT,
    api_token TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'provisioning', 'active', 'error', 'stopped', 'deleted')),
    last_heartbeat TIMESTAMP,
    error_message TEXT,
    cpu_usage REAL,
    memory_usage REAL,
    disk_usage REAL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS runners_user_id_idx ON runners(user_id);
CREATE INDEX IF NOT EXISTS runners_org_id_idx ON runners(org_id);
CREATE INDEX IF NOT EXISTS runners_status_idx ON runners(status);

-- ============================================================================
-- Projects Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    visibility TEXT NOT NULL DEFAULT 'private',
    settings TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_org_id_idx ON projects(org_id);
CREATE INDEX IF NOT EXISTS projects_team_id_idx ON projects(team_id);

-- ============================================================================
-- Agents Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    triggered_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    start_time TIMESTAMP DEFAULT NOW() NOT NULL,
    end_time TIMESTAMP,
    logs TEXT,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS agents_project_id_idx ON agents(project_id);
CREATE INDEX IF NOT EXISTS agents_org_id_idx ON agents(org_id);
CREATE INDEX IF NOT EXISTS agents_status_idx ON agents(status);

-- ============================================================================
-- Costs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS costs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS costs_project_id_idx ON costs(project_id);
CREATE INDEX IF NOT EXISTS costs_org_id_idx ON costs(org_id);
CREATE INDEX IF NOT EXISTS costs_user_id_idx ON costs(user_id);
CREATE INDEX IF NOT EXISTS costs_timestamp_idx ON costs(timestamp);
CREATE INDEX IF NOT EXISTS costs_provider_idx ON costs(provider);

-- ============================================================================
-- Activities Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS activities_project_id_idx ON activities(project_id);
CREATE INDEX IF NOT EXISTS activities_org_id_idx ON activities(org_id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_timestamp_idx ON activities(timestamp);
CREATE INDEX IF NOT EXISTS activities_type_idx ON activities(type);

-- ============================================================================
-- User Settings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    openai_api_key TEXT,
    anthropic_api_key TEXT,
    github_token TEXT,
    github_repo_owner TEXT,
    github_repo_name TEXT,
    voice_settings TEXT,
    notification_settings TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- ============================================================================
-- Architect Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS architect_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    overall_progress REAL NOT NULL DEFAULT 0,
    category_progress TEXT,
    blockers TEXT,
    gaps TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS architect_sessions_project_id_idx ON architect_sessions(project_id);
CREATE INDEX IF NOT EXISTS architect_sessions_user_id_idx ON architect_sessions(user_id);
CREATE INDEX IF NOT EXISTS architect_sessions_status_idx ON architect_sessions(status);

-- ============================================================================
-- Architect Conversations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS architect_conversations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES architect_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    mode TEXT NOT NULL,
    category TEXT,
    embedding TEXT,
    metadata TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS architect_conversations_session_id_idx ON architect_conversations(session_id);
CREATE INDEX IF NOT EXISTS architect_conversations_category_idx ON architect_conversations(category);
CREATE INDEX IF NOT EXISTS architect_conversations_timestamp_idx ON architect_conversations(timestamp);

-- ============================================================================
-- Architect Decisions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS architect_decisions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES architect_sessions(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    decision TEXT NOT NULL,
    rationale TEXT,
    confidence REAL NOT NULL DEFAULT 0,
    alternatives TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS architect_decisions_session_id_idx ON architect_decisions(session_id);
CREATE INDEX IF NOT EXISTS architect_decisions_category_idx ON architect_decisions(category);

-- ============================================================================
-- Prototypes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS prototypes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    v0_chat_id TEXT NOT NULL,
    v0_demo_url TEXT,
    deployment_url TEXT NOT NULL,
    deployment_status TEXT NOT NULL CHECK (deployment_status IN ('pending', 'deploying', 'ready', 'error')),
    title TEXT NOT NULL,
    description TEXT,
    spec_path TEXT,
    files JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    parent_id TEXT REFERENCES prototypes(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS prototypes_project_id_idx ON prototypes(project_id);
CREATE INDEX IF NOT EXISTS prototypes_deployment_status_idx ON prototypes(deployment_status);
CREATE INDEX IF NOT EXISTS prototypes_created_at_idx ON prototypes(created_at);
CREATE INDEX IF NOT EXISTS prototypes_parent_id_idx ON prototypes(parent_id);
CREATE INDEX IF NOT EXISTS prototypes_v0_chat_id_idx ON prototypes(v0_chat_id);

-- ============================================================================
-- Prototype Iterations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS prototype_iterations (
    id TEXT PRIMARY KEY,
    prototype_id TEXT NOT NULL REFERENCES prototypes(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    changes_applied TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS prototype_iterations_prototype_id_idx ON prototype_iterations(prototype_id);
CREATE INDEX IF NOT EXISTS prototype_iterations_created_at_idx ON prototype_iterations(created_at);
