-- Migration: Add prototype generation tables
-- Date: 2025-11-24
-- Description: Enables v0 integration for prototype generation and iteration
-- Related: .sentra/DESIGN-GENERATION-SPEC.md

-- ============================================================================
-- STEP 1: Create prototypes table
-- ============================================================================

CREATE TABLE prototypes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- v0 Integration
  v0_chat_id TEXT NOT NULL,
  v0_demo_url TEXT,

  -- Sentra Hosting
  deployment_url TEXT NOT NULL,
  deployment_status TEXT NOT NULL CHECK (deployment_status IN ('pending', 'deploying', 'ready', 'error')),

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  spec_path TEXT,

  -- Code
  files JSONB,

  -- Iteration tracking
  version INTEGER NOT NULL DEFAULT 1,
  parent_id TEXT REFERENCES prototypes(id) ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create prototype_iterations table
-- ============================================================================

CREATE TABLE prototype_iterations (
  id TEXT PRIMARY KEY,
  prototype_id TEXT NOT NULL REFERENCES prototypes(id) ON DELETE CASCADE,

  feedback TEXT NOT NULL,
  changes_applied TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Prototypes indexes
CREATE INDEX idx_prototypes_project_id ON prototypes(project_id);
CREATE INDEX idx_prototypes_deployment_status ON prototypes(deployment_status);
CREATE INDEX idx_prototypes_created_at ON prototypes(created_at);
CREATE INDEX idx_prototypes_parent_id ON prototypes(parent_id);
CREATE INDEX idx_prototypes_v0_chat_id ON prototypes(v0_chat_id);

-- Prototype iterations indexes
CREATE INDEX idx_prototype_iterations_prototype_id ON prototype_iterations(prototype_id);
CREATE INDEX idx_prototype_iterations_created_at ON prototype_iterations(created_at);

-- ============================================================================
-- STEP 4: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE prototypes IS 'Interactive prototypes generated via v0 Platform API';
COMMENT ON TABLE prototype_iterations IS 'Iteration history for prototype refinement';

COMMENT ON COLUMN prototypes.v0_chat_id IS 'v0 chat ID for iteration API calls';
COMMENT ON COLUMN prototypes.v0_demo_url IS 'Original v0-hosted demo URL';
COMMENT ON COLUMN prototypes.deployment_url IS 'Sentra-hosted preview URL';
COMMENT ON COLUMN prototypes.deployment_status IS 'Deployment status: pending, deploying, ready, error';
COMMENT ON COLUMN prototypes.files IS 'JSON array of generated code files';
COMMENT ON COLUMN prototypes.version IS 'Iteration version number (starts at 1)';
COMMENT ON COLUMN prototypes.parent_id IS 'Previous version ID for iteration tracking';

COMMENT ON COLUMN prototype_iterations.feedback IS 'User feedback in natural language';
COMMENT ON COLUMN prototype_iterations.changes_applied IS 'Description of changes applied by v0';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification queries (uncomment to test):

-- 1. Check tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('prototypes', 'prototype_iterations');

-- 2. List all prototype-related indexes
-- SELECT schemaname, tablename, indexname
-- FROM pg_indexes
-- WHERE tablename LIKE 'prototype%';

-- 3. Verify foreign key constraints
-- SELECT tc.constraint_name, tc.table_name, kcu.column_name,
--        ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY'
-- AND tc.table_name LIKE 'prototype%';
