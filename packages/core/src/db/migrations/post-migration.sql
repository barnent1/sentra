-- Post-migration script for Sentra Evolution Database
-- Adds required extensions, indexes, and functions

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Performance indexes for existing base tables
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_approvals_machine_status ON approvals(machine_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_expires ON approvals(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_project_type ON events(project_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_project_kind ON memory_items(project_id, kind);
CREATE INDEX IF NOT EXISTS idx_subagents_machine_status ON subagents(machine_id, status);

-- Performance indexes for evolution tables
CREATE INDEX IF NOT EXISTS idx_evolution_dna_pattern_generation ON evolution_dna(pattern_type, generation);
CREATE INDEX IF NOT EXISTS idx_evolution_dna_parent ON evolution_dna(parent_id);
CREATE INDEX IF NOT EXISTS idx_agent_instances_dna ON agent_instances(evolution_dna_id);
CREATE INDEX IF NOT EXISTS idx_agent_instances_status ON agent_instances(status);
CREATE INDEX IF NOT EXISTS idx_agent_instances_role ON agent_instances(role);
CREATE INDEX IF NOT EXISTS idx_learning_outcomes_agent ON learning_outcomes(agent_instance_id);
CREATE INDEX IF NOT EXISTS idx_learning_outcomes_dna ON learning_outcomes(evolution_dna_id);
CREATE INDEX IF NOT EXISTS idx_learning_outcomes_type ON learning_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_evolution_events_parent_dna ON evolution_events(parent_dna_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_child_dna ON evolution_events(child_dna_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_trigger ON evolution_events(evolution_trigger);
CREATE INDEX IF NOT EXISTS idx_project_evolution_contexts_project ON project_evolution_contexts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_evolution_contexts_dna ON project_evolution_contexts(evolution_dna_id);
CREATE INDEX IF NOT EXISTS idx_project_evolution_contexts_score ON project_evolution_contexts(adaptation_score);

-- Vector search indexes using ivfflat for memory items
CREATE INDEX IF NOT EXISTS idx_memory_embedding ON memory_items USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Vector search indexes for evolution tables  
CREATE INDEX IF NOT EXISTS idx_evolution_dna_embedding ON evolution_dna USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_learning_outcomes_embedding ON learning_outcomes USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers for tables with updated_at columns
CREATE TRIGGER IF NOT EXISTS update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_memory_items_updated_at BEFORE UPDATE ON memory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_evolution_dna_updated_at BEFORE UPDATE ON evolution_dna
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_project_evolution_contexts_updated_at BEFORE UPDATE ON project_evolution_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old approvals
CREATE OR REPLACE FUNCTION expire_old_approvals()
RETURNS void AS $$
BEGIN
    UPDATE approvals 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Function to search memory items by similarity
CREATE OR REPLACE FUNCTION search_memory(
    p_project_id UUID,
    p_query_embedding vector(1536),
    p_kind TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    kind TEXT,
    similarity FLOAT,
    metadata JSONB,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.content,
        m.kind,
        (1 - (m.embedding <=> p_query_embedding)) as similarity,
        m.metadata,
        m.created_at
    FROM memory_items m
    WHERE m.project_id = p_project_id
    AND (p_kind IS NULL OR m.kind = p_kind)
    ORDER BY m.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search evolution DNA patterns by similarity
CREATE OR REPLACE FUNCTION search_evolution_dna(
    p_query_embedding vector(1536),
    p_pattern_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    pattern_type TEXT,
    genetics JSONB,
    performance_metrics JSONB,
    project_context JSONB,
    generation INTEGER,
    similarity FLOAT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.pattern_type,
        e.genetics,
        e.performance_metrics,
        e.project_context,
        e.generation,
        (1 - (e.embedding <=> p_query_embedding)) as similarity,
        e.created_at
    FROM evolution_dna e
    WHERE e.embedding IS NOT NULL
    AND (p_pattern_type IS NULL OR e.pattern_type = p_pattern_type)
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find learning outcomes by similarity
CREATE OR REPLACE FUNCTION search_learning_outcomes(
    p_query_embedding vector(1536),
    p_outcome_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    agent_instance_id UUID,
    outcome_type TEXT,
    lesson_learned TEXT,
    context_factors JSONB,
    applicability_score REAL,
    similarity FLOAT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.agent_instance_id,
        l.outcome_type,
        l.lesson_learned,
        l.context_factors,
        l.applicability_score,
        (1 - (l.embedding <=> p_query_embedding)) as similarity,
        l.created_at
    FROM learning_outcomes l
    WHERE l.embedding IS NOT NULL
    AND (p_outcome_type IS NULL OR l.outcome_type = p_outcome_type)
    ORDER BY l.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;