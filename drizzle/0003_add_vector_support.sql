-- Migration: Add pgvector support for semantic search
-- Date: 2025-11-22
-- Description: Enables vector similarity search for Voice Architect memory system
-- Related: ADR-003-VECTOR-DATABASE.md, VECTOR-SCHEMA.md

-- ============================================================================
-- STEP 1: Enable pgvector extension
-- ============================================================================

-- Create pgvector extension (enables VECTOR data type and similarity search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is installed
-- SELECT * FROM pg_extension WHERE extname = 'vector';


-- ============================================================================
-- STEP 2: Add vector columns to existing tables
-- ============================================================================

-- Add embedding column to architect_conversations
-- OpenAI text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE architect_conversations
  ADD COLUMN embedding VECTOR(1536);

-- Add embedding column to architect_decisions
ALTER TABLE architect_decisions
  ADD COLUMN embedding VECTOR(1536);


-- ============================================================================
-- STEP 3: Create new vector-enabled tables
-- ============================================================================

-- architect_screens: UI screen specifications with E2E test scenarios
CREATE TABLE architect_screens (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES architect_sessions(id) ON DELETE CASCADE,
  screen_name TEXT NOT NULL,
  route TEXT NOT NULL,
  description TEXT NOT NULL,
  figma_url TEXT,
  v0_export_path TEXT,
  behavior JSONB NOT NULL DEFAULT '{}',
  e2e_tests JSONB NOT NULL DEFAULT '[]',
  accessibility JSONB,
  responsive JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Unique constraint: one route per project
  CONSTRAINT architect_screens_project_route UNIQUE(project_id, route)
);

-- architect_flows: User journey flows across multiple screens
CREATE TABLE architect_flows (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES architect_sessions(id) ON DELETE CASCADE,
  flow_name TEXT NOT NULL,
  description TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  entry_points TEXT[],
  exit_points TEXT[],
  error_scenarios JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- architect_api_specs: API endpoint specifications
CREATE TABLE architect_api_specs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES architect_sessions(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  description TEXT NOT NULL,
  authentication TEXT,
  authorization TEXT,
  request_schema JSONB,
  response_schema JSONB,
  rate_limiting JSONB,
  error_responses JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Unique constraint: one endpoint+method per project
  CONSTRAINT architect_api_specs_project_endpoint_method UNIQUE(project_id, endpoint, method)
);


-- ============================================================================
-- STEP 4: Create B-tree indexes for metadata filtering
-- ============================================================================

-- architect_screens indexes
CREATE INDEX idx_architect_screens_project ON architect_screens(project_id);
CREATE INDEX idx_architect_screens_session ON architect_screens(session_id);
CREATE INDEX idx_architect_screens_screen_name ON architect_screens(screen_name);
CREATE INDEX idx_architect_screens_created_at ON architect_screens(created_at);

-- architect_flows indexes
CREATE INDEX idx_architect_flows_project ON architect_flows(project_id);
CREATE INDEX idx_architect_flows_session ON architect_flows(session_id);
CREATE INDEX idx_architect_flows_flow_name ON architect_flows(flow_name);
CREATE INDEX idx_architect_flows_created_at ON architect_flows(created_at);

-- architect_api_specs indexes
CREATE INDEX idx_architect_api_specs_project ON architect_api_specs(project_id);
CREATE INDEX idx_architect_api_specs_session ON architect_api_specs(session_id);
CREATE INDEX idx_architect_api_specs_endpoint ON architect_api_specs(endpoint);
CREATE INDEX idx_architect_api_specs_method ON architect_api_specs(method);
CREATE INDEX idx_architect_api_specs_authentication ON architect_api_specs(authentication);
CREATE INDEX idx_architect_api_specs_created_at ON architect_api_specs(created_at);


-- ============================================================================
-- STEP 5: Create HNSW vector indexes for semantic search
-- ============================================================================

-- HNSW (Hierarchical Navigable Small World) provides fast approximate nearest neighbor search
-- Parameters:
--   m = 16: Number of bi-directional links (higher = better recall, slower build)
--   ef_construction = 64: Size of dynamic candidate list during build (higher = better quality, slower)
-- Distance metric: cosine (vector_cosine_ops)

-- Index for architect_conversations.embedding
CREATE INDEX idx_architect_conversations_embedding ON architect_conversations
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for architect_decisions.embedding
CREATE INDEX idx_architect_decisions_embedding ON architect_decisions
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for architect_screens.embedding
CREATE INDEX idx_architect_screens_embedding ON architect_screens
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for architect_flows.embedding
CREATE INDEX idx_architect_flows_embedding ON architect_flows
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for architect_api_specs.embedding
CREATE INDEX idx_architect_api_specs_embedding ON architect_api_specs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ============================================================================
-- STEP 6: Add project_id to existing architect tables (if needed)
-- ============================================================================

-- Add project_id to architect_conversations for cross-project queries
-- Note: This requires backfilling data, so we'll add it as nullable first
ALTER TABLE architect_conversations
  ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;

-- Create index for project_id filtering
CREATE INDEX idx_architect_conversations_project ON architect_conversations(project_id);

-- Add project_id to architect_decisions
ALTER TABLE architect_decisions
  ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;

-- Create index for project_id filtering
CREATE INDEX idx_architect_decisions_project ON architect_decisions(project_id);


-- ============================================================================
-- STEP 7: Update existing indexes for better query performance
-- ============================================================================

-- Add composite index for common query pattern: project + session + turn_number
-- This index already exists from migration 0002, but we'll ensure it supports vector queries
CREATE INDEX IF NOT EXISTS idx_architect_conversations_project_session_turn
  ON architect_conversations(project_id, session_id, turn_number)
  WHERE project_id IS NOT NULL;


-- ============================================================================
-- STEP 8: Add helper functions for vector search
-- ============================================================================

-- Function to compute cosine similarity (1 - cosine distance)
-- Usage: SELECT cosine_similarity(vec1, vec2)
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 VECTOR, vec2 VECTOR)
RETURNS FLOAT
AS $$
BEGIN
  RETURN 1 - (vec1 <=> vec2);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- Function to search conversations by semantic similarity
-- Usage: SELECT * FROM search_conversations('proj_id', query_embedding, 0.7, 10)
CREATE OR REPLACE FUNCTION search_conversations(
  p_project_id TEXT,
  p_query_embedding VECTOR(1536),
  p_similarity_threshold FLOAT DEFAULT 0.7,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  session_id TEXT,
  turn_number INT,
  role TEXT,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMP
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.session_id,
    c.turn_number,
    c.role,
    c.content,
    (1 - (c.embedding <=> p_query_embedding))::FLOAT AS similarity,
    c.created_at
  FROM architect_conversations c
  WHERE c.project_id = p_project_id
    AND c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> p_query_embedding)) > p_similarity_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Function to search decisions by semantic similarity
-- Usage: SELECT * FROM search_decisions('proj_id', query_embedding, 'approved', 0.6, 5)
CREATE OR REPLACE FUNCTION search_decisions(
  p_project_id TEXT,
  p_query_embedding VECTOR(1536),
  p_status TEXT DEFAULT NULL,
  p_similarity_threshold FLOAT DEFAULT 0.6,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  session_id TEXT,
  category TEXT,
  title TEXT,
  decision TEXT,
  rationale TEXT,
  status TEXT,
  similarity FLOAT,
  created_at TIMESTAMP
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.session_id,
    d.category,
    d.title,
    d.decision,
    d.rationale,
    d.status,
    (1 - (d.embedding <=> p_query_embedding))::FLOAT AS similarity,
    d.created_at
  FROM architect_decisions d
  WHERE d.project_id = p_project_id
    AND d.embedding IS NOT NULL
    AND (p_status IS NULL OR d.status = p_status)
    AND (1 - (d.embedding <=> p_query_embedding)) > p_similarity_threshold
  ORDER BY d.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;


-- ============================================================================
-- STEP 9: Add comments for documentation
-- ============================================================================

COMMENT ON EXTENSION vector IS 'pgvector: vector similarity search for PostgreSQL';

COMMENT ON COLUMN architect_conversations.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN architect_decisions.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN architect_screens.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN architect_flows.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN architect_api_specs.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';

COMMENT ON TABLE architect_screens IS 'UI screen specifications with behavior and E2E test scenarios';
COMMENT ON TABLE architect_flows IS 'User journey flows across multiple screens';
COMMENT ON TABLE architect_api_specs IS 'API endpoint specifications with request/response schemas';

COMMENT ON FUNCTION cosine_similarity IS 'Compute cosine similarity between two vectors (1 - cosine distance)';
COMMENT ON FUNCTION search_conversations IS 'Semantic search across conversation history';
COMMENT ON FUNCTION search_decisions IS 'Semantic search across architectural decisions';


-- ============================================================================
-- STEP 10: Performance tuning recommendations (commented out)
-- ============================================================================

-- Run ANALYZE after populating tables to update statistics
-- ANALYZE architect_conversations;
-- ANALYZE architect_decisions;
-- ANALYZE architect_screens;
-- ANALYZE architect_flows;
-- ANALYZE architect_api_specs;

-- Set runtime search parameters for better recall (per-session or per-query)
-- SET hnsw.ef_search = 100;  -- Default: 40, higher = better recall but slower

-- Monitor index build progress (if building on large dataset)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename LIKE 'architect_%'
-- ORDER BY idx_scan DESC;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification queries (uncomment to test):

-- 1. Verify pgvector extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- 2. Check vector columns were added
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name LIKE 'architect_%' AND column_name = 'embedding';

-- 3. List all vector indexes
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE indexdef LIKE '%hnsw%';

-- 4. Test semantic search function (requires data and embeddings)
-- SELECT * FROM search_conversations(
--   'proj_example',
--   '[0.1, 0.2, ...]'::VECTOR(1536),
--   0.7,
--   5
-- );
