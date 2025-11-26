# Vector Schema Design for Voice Architect Memory

**Version:** 1.0
**Date:** 2025-11-22
**Author:** Glen Barnhardt with help from Claude Code
**Status:** Design Complete

---

## Overview

This document defines the vector database schema for Sentra's Voice Architect agent memory system. The schema enables semantic search across multi-session conversations, preserving context and enabling intelligent recall of architectural decisions.

### Design Principles

1. **Preserve Granularity:** Store both raw conversations and extracted entities
2. **Enable Discovery:** Support semantic search across all project knowledge
3. **Maintain Relationships:** Link embeddings to source data via foreign keys
4. **Support Filtering:** Rich metadata for project/session/category filters
5. **ACID Guarantees:** Transactional integrity with PostgreSQL

### Related Documentation

- **ADR-003:** Vector database selection decision
- **voice-architect.md:** Agent requirements and coverage areas
- **Prototype Migration:** `drizzle/migrations/XXXX_add_vector_support.sql`

---

## Collections (Tables)

The schema defines 5 vector collections, each serving a distinct purpose in the Voice Architect memory system.

### 1. architect_conversations

**Purpose:** Raw conversation turns with embeddings for full-text semantic search

**Use Cases:**
- "Find all discussions about authentication"
- "What did we discuss about payment processing?"
- Session context loading (retrieve last 10 turns)
- Conversation history replay

**Schema:**

```sql
CREATE TABLE architect_conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- text-embedding-3-small
  metadata JSONB, -- { mode: 'voice' | 'text', duration_ms: number, ... }
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT architect_conversations_project_session_turn UNIQUE(project_id, session_id, turn_number)
);

CREATE INDEX idx_architect_conversations_project ON architect_conversations(project_id);
CREATE INDEX idx_architect_conversations_session ON architect_conversations(session_id);
CREATE INDEX idx_architect_conversations_timestamp ON architect_conversations(timestamp);
CREATE INDEX idx_architect_conversations_role ON architect_conversations(role);

-- Vector index (HNSW for fast approximate search)
CREATE INDEX idx_architect_conversations_embedding ON architect_conversations
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Metadata Fields:**

```typescript
interface ConversationMetadata {
  mode: 'voice' | 'text';           // Interaction mode
  duration_ms?: number;              // Voice conversation duration
  voice_provider?: 'openai' | 'kokoro';
  tokens?: {
    input: number;
    output: number;
  };
  confidence?: number;               // Transcription confidence (voice)
  interruption?: boolean;            // User interrupted agent
}
```

**Embedding Strategy:**
- **Source:** Full conversation turn content
- **Chunk size:** No chunking (preserve conversational context)
- **Model:** OpenAI `text-embedding-3-small` (1536 dimensions)

**Example Row:**

```sql
INSERT INTO architect_conversations VALUES (
  'conv_abc123',
  'proj_bookmark_mgr',
  'sess_001',
  3,
  'user',
  'I want users to be able to tag bookmarks with multiple tags, like Gmail labels',
  '[0.023, -0.145, 0.892, ...]', -- embedding vector
  '{"mode": "voice", "duration_ms": 4200, "confidence": 0.95}',
  '2025-11-22 14:30:00'
);
```

---

### 2. architect_decisions

**Purpose:** Extracted architectural decisions with semantic search

**Use Cases:**
- "Find all authentication-related decisions"
- "What database decisions were made?"
- Cross-project pattern learning ("how did we handle auth in other projects?")
- Decision review and audit

**Schema:**

```sql
CREATE TABLE architect_decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL, -- business_requirements | database | api | ui | security | etc.
  decision TEXT NOT NULL,
  rationale TEXT,
  alternatives_considered JSONB, -- [{ option: string, why_rejected: string }]
  status TEXT NOT NULL DEFAULT 'proposed', -- proposed | approved | rejected | superseded
  confidence REAL NOT NULL DEFAULT 0.5, -- 0.0 - 1.0
  embedding VECTOR(1536),
  source_conversation_ids TEXT[], -- References to architect_conversations.id
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  superseded_by TEXT REFERENCES architect_decisions(id),

  -- Indexes
  CONSTRAINT check_confidence CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

CREATE INDEX idx_architect_decisions_project ON architect_decisions(project_id);
CREATE INDEX idx_architect_decisions_session ON architect_decisions(session_id);
CREATE INDEX idx_architect_decisions_category ON architect_decisions(category);
CREATE INDEX idx_architect_decisions_status ON architect_decisions(status);
CREATE INDEX idx_architect_decisions_timestamp ON architect_decisions(timestamp);

-- Vector index
CREATE INDEX idx_architect_decisions_embedding ON architect_decisions
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Categories (10 Voice Architect coverage areas):**

```typescript
type DecisionCategory =
  | 'business_requirements'
  | 'user_personas'
  | 'database_architecture'
  | 'api_design'
  | 'ui_screens'
  | 'security_model'
  | 'integrations'
  | 'performance'
  | 'deployment'
  | 'testing';
```

**Metadata Fields:**

```typescript
interface AlternativeConsidered {
  option: string;
  why_rejected: string;
  estimated_effort?: string;
  risk_level?: 'low' | 'medium' | 'high';
}
```

**Embedding Strategy:**
- **Source:** `decision + rationale` (concatenated)
- **Chunk size:** No chunking (decisions are typically < 500 tokens)
- **Model:** OpenAI `text-embedding-3-small`

**Example Row:**

```sql
INSERT INTO architect_decisions VALUES (
  'dec_abc123',
  'proj_bookmark_mgr',
  'sess_002',
  'database_architecture',
  'Use soft deletes for bookmarks with deleted_at timestamp',
  'Users may want to recover accidentally deleted bookmarks. Soft delete allows 30-day recovery window.',
  '[{"option": "Hard deletes", "why_rejected": "No recovery possible, poor UX"}]',
  'approved',
  0.95,
  '[0.145, -0.023, 0.456, ...]',
  ARRAY['conv_abc122', 'conv_abc123'],
  '2025-11-22 14:35:00',
  NULL
);
```

---

### 3. architect_screens

**Purpose:** UI screen specifications with behavior and E2E test scenarios

**Use Cases:**
- "Find all screens with authentication requirements"
- "What screens have loading states?"
- E2E test generation
- Implementation agent context

**Schema:**

```sql
CREATE TABLE architect_screens (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  screen_name TEXT NOT NULL,
  route TEXT NOT NULL,
  description TEXT NOT NULL, -- Visual + behavioral description
  figma_url TEXT,
  v0_export_path TEXT,
  behavior JSONB NOT NULL, -- { on_load: [], user_actions: [], states: [] }
  e2e_tests JSONB NOT NULL, -- [{ name: string, steps: string[] }]
  accessibility JSONB, -- { aria_labels: {}, keyboard_nav: [], ... }
  responsive JSONB, -- { mobile: {}, tablet: {}, desktop: {} }
  embedding VECTOR(1536),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT architect_screens_project_route UNIQUE(project_id, route)
);

CREATE INDEX idx_architect_screens_project ON architect_screens(project_id);
CREATE INDEX idx_architect_screens_session ON architect_screens(session_id);
CREATE INDEX idx_architect_screens_screen_name ON architect_screens(screen_name);
CREATE INDEX idx_architect_screens_timestamp ON architect_screens(timestamp);

-- Vector index
CREATE INDEX idx_architect_screens_embedding ON architect_screens
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Behavior Structure:**

```typescript
interface ScreenBehavior {
  on_load: string[];                   // Actions when page loads
  user_actions: {
    action: string;                    // "Click quick add button"
    trigger: string;                   // "FAB in bottom-right"
    result: string;                    // "Open QuickAddModal"
  }[];
  states: {
    name: string;                      // "loading" | "empty" | "error" | "populated"
    description: string;
    ui_changes: string[];
  }[];
}

interface E2ETest {
  name: string;                        // "User adds first bookmark"
  priority: 'critical' | 'high' | 'medium' | 'low';
  steps: string[];                     // ["Navigate to /dashboard", "Click FAB", ...]
  expected_outcome: string;
}
```

**Embedding Strategy:**
- **Source:** `description + JSON.stringify(behavior) + JSON.stringify(e2e_tests)`
- **Chunk size:** May need chunking if > 2000 tokens
- **Model:** OpenAI `text-embedding-3-small`

**Example Row:**

```sql
INSERT INTO architect_screens VALUES (
  'screen_abc123',
  'proj_bookmark_mgr',
  'sess_003',
  'Dashboard',
  '/dashboard',
  'Grid layout showing user bookmarks with sidebar navigation and FAB for quick add',
  'https://figma.com/file/...',
  'docs/specs/v0-exports/dashboard.tsx',
  '{
    "on_load": ["Fetch user bookmarks", "Show skeleton loading"],
    "user_actions": [
      {
        "action": "Click quick add button",
        "trigger": "FAB in bottom-right",
        "result": "Open QuickAddModal"
      }
    ],
    "states": [
      {
        "name": "loading",
        "description": "Skeleton cards displayed",
        "ui_changes": ["Show 6 skeleton cards in grid"]
      }
    ]
  }',
  '[
    {
      "name": "User adds first bookmark",
      "priority": "critical",
      "steps": ["Navigate to /dashboard", "Verify empty state", "Click FAB", ...],
      "expected_outcome": "Bookmark appears in grid"
    }
  ]',
  '{"aria_labels": {"fab": "Add new bookmark"}, "keyboard_nav": ["Tab to FAB", "Enter to activate"]}',
  '{"mobile": {"layout": "single column"}, "desktop": {"layout": "3 column grid"}}',
  '[0.456, -0.089, 0.234, ...]',
  '2025-11-22 15:00:00'
);
```

---

### 4. architect_flows

**Purpose:** User journey flows across multiple screens

**Use Cases:**
- "Find all onboarding flows"
- "What flows involve payment?"
- E2E test planning
- User journey optimization

**Schema:**

```sql
CREATE TABLE architect_flows (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  flow_name TEXT NOT NULL,
  description TEXT NOT NULL,
  steps JSONB NOT NULL, -- [{ step: number, screen: string, action: string, ... }]
  entry_points TEXT[], -- Where users can start this flow
  exit_points TEXT[], -- Where users can end this flow
  error_scenarios JSONB, -- [{ condition: string, handling: string }]
  embedding VECTOR(1536),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_architect_flows_project ON architect_flows(project_id);
CREATE INDEX idx_architect_flows_session ON architect_flows(session_id);
CREATE INDEX idx_architect_flows_flow_name ON architect_flows(flow_name);
CREATE INDEX idx_architect_flows_timestamp ON architect_flows(timestamp);

-- Vector index
CREATE INDEX idx_architect_flows_embedding ON architect_flows
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Steps Structure:**

```typescript
interface FlowStep {
  step: number;
  screen: string;                    // Screen name or route
  action: string;                    // User action
  system_response: string;           // What the system does
  validation?: string;               // What gets validated
  error_handling?: string;           // What happens on error
}

interface ErrorScenario {
  condition: string;                 // "Payment fails"
  handling: string;                  // "Show error modal, return to payment screen"
  user_impact: string;               // "Can retry payment"
}
```

**Embedding Strategy:**
- **Source:** `flow_name + description + JSON.stringify(steps)`
- **Chunk size:** May chunk long flows (> 1000 tokens per chunk)
- **Model:** OpenAI `text-embedding-3-small`

**Example Row:**

```sql
INSERT INTO architect_flows VALUES (
  'flow_abc123',
  'proj_bookmark_mgr',
  'sess_003',
  'User Registration Flow',
  'New user signs up, verifies email, and completes profile setup',
  '[
    {
      "step": 1,
      "screen": "/signup",
      "action": "Enter email and password",
      "system_response": "Create user account, send verification email",
      "validation": "Email format, password strength"
    },
    {
      "step": 2,
      "screen": "/verify-email",
      "action": "Click verification link in email",
      "system_response": "Mark email as verified, redirect to profile setup"
    }
  ]',
  ARRAY['/signup', '/landing'],
  ARRAY['/dashboard', '/profile'],
  '[{"condition": "Email already exists", "handling": "Show error, suggest login"}]',
  '[0.234, -0.567, 0.123, ...]',
  '2025-11-22 15:15:00'
);
```

---

### 5. architect_api_specs

**Purpose:** API endpoint specifications with request/response schemas

**Use Cases:**
- "Find all authenticated endpoints"
- "What APIs handle user data?"
- Implementation planning
- Security audit

**Schema:**

```sql
CREATE TABLE architect_api_specs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL, -- GET | POST | PUT | PATCH | DELETE
  description TEXT NOT NULL,
  authentication TEXT, -- none | jwt | api_key | oauth
  authorization TEXT, -- RBAC rules, permissions required
  request_schema JSONB, -- JSON Schema or TypeScript type
  response_schema JSONB, -- JSON Schema or TypeScript type
  rate_limiting JSONB, -- { requests_per_minute: number, burst: number }
  error_responses JSONB, -- [{ code: number, condition: string }]
  embedding VECTOR(1536),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT architect_api_specs_project_endpoint_method UNIQUE(project_id, endpoint, method)
);

CREATE INDEX idx_architect_api_specs_project ON architect_api_specs(project_id);
CREATE INDEX idx_architect_api_specs_session ON architect_api_specs(session_id);
CREATE INDEX idx_architect_api_specs_endpoint ON architect_api_specs(endpoint);
CREATE INDEX idx_architect_api_specs_method ON architect_api_specs(method);
CREATE INDEX idx_architect_api_specs_authentication ON architect_api_specs(authentication);
CREATE INDEX idx_architect_api_specs_timestamp ON architect_api_specs(timestamp);

-- Vector index
CREATE INDEX idx_architect_api_specs_embedding ON architect_api_specs
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Schema Structures:**

```typescript
interface RateLimiting {
  requests_per_minute: number;
  burst: number;
  scope: 'user' | 'ip' | 'api_key';
}

interface ErrorResponse {
  code: number;                      // HTTP status code
  condition: string;                 // When this error occurs
  message: string;                   // Error message template
  retry_strategy?: string;           // How client should retry
}
```

**Embedding Strategy:**
- **Source:** `endpoint + method + description + JSON.stringify(request_schema + response_schema)`
- **Chunk size:** No chunking (APIs are typically < 1000 tokens)
- **Model:** OpenAI `text-embedding-3-small`

**Example Row:**

```sql
INSERT INTO architect_api_specs VALUES (
  'api_abc123',
  'proj_bookmark_mgr',
  'sess_002',
  '/api/bookmarks',
  'POST',
  'Create a new bookmark for the authenticated user',
  'jwt',
  'Must be authenticated user',
  '{
    "type": "object",
    "properties": {
      "url": {"type": "string", "format": "uri"},
      "title": {"type": "string"},
      "tags": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["url"]
  }',
  '{
    "type": "object",
    "properties": {
      "id": {"type": "string"},
      "url": {"type": "string"},
      "title": {"type": "string"},
      "created_at": {"type": "string", "format": "date-time"}
    }
  }',
  '{"requests_per_minute": 60, "burst": 10, "scope": "user"}',
  '[
    {"code": 401, "condition": "Missing or invalid JWT", "message": "Unauthorized"},
    {"code": 400, "condition": "Invalid URL format", "message": "Invalid URL"}
  ]',
  '[0.789, -0.234, 0.567, ...]',
  '2025-11-22 14:45:00'
);
```

---

## Embedding Generation

### Chunking Strategy

**For Conversations (architect_conversations):**
- **No chunking:** Preserve full conversational context
- Rationale: Turns are typically < 500 tokens, chunking would lose context

**For Decisions (architect_decisions):**
- **No chunking:** Decisions are atomic units
- Rationale: Decision + rationale typically < 500 tokens

**For Screens (architect_screens):**
- **Conditional chunking:** If total content > 2000 tokens
- Strategy: Create separate chunks for:
  1. Visual description
  2. Behavior specification
  3. E2E test scenarios
- Link chunks via `screen_id` metadata

**For Flows (architect_flows):**
- **Conditional chunking:** If total steps > 10 or content > 1500 tokens
- Strategy: Chunk by step groups (e.g., steps 1-5, 6-10)
- Link chunks via `flow_id` metadata

**For API Specs (architect_api_specs):**
- **No chunking:** Endpoints are typically < 1000 tokens
- Rationale: Request/response schemas are concise

### Embedding Model Configuration

**Model:** OpenAI `text-embedding-3-small`

**Parameters:**
- Dimensions: 1536
- Input token limit: 8191 tokens
- Cost: $0.02 / 1M tokens
- Performance: 62.3% on MTEB benchmark

**Generation Process:**

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });

  return response.data[0].embedding;
}
```

---

## Query Patterns

### 1. Semantic Search Across Conversations

**Use Case:** "Find all discussions about authentication"

```sql
SELECT
  c.id,
  c.content,
  c.role,
  c.timestamp,
  1 - (c.embedding <=> query_embedding) AS similarity
FROM architect_conversations c
WHERE c.project_id = $1
  AND 1 - (c.embedding <=> $2) > 0.7  -- Similarity threshold
ORDER BY c.embedding <=> $2  -- Cosine distance
LIMIT 10;
```

**Parameters:**
- `$1`: `project_id` (e.g., 'proj_bookmark_mgr')
- `$2`: Embedding of query "authentication"

---

### 2. Find Related Decisions by Category

**Use Case:** "What database decisions were made in this project?"

```sql
SELECT
  d.id,
  d.decision,
  d.rationale,
  d.status,
  d.confidence,
  1 - (d.embedding <=> query_embedding) AS similarity
FROM architect_decisions d
WHERE d.project_id = $1
  AND d.category = 'database_architecture'
  AND d.status = 'approved'
  AND 1 - (d.embedding <=> $2) > 0.6
ORDER BY d.timestamp DESC
LIMIT 5;
```

---

### 3. Cross-Project Pattern Learning

**Use Case:** "How did we handle authentication in other projects?"

```sql
SELECT
  d.project_id,
  p.name AS project_name,
  d.decision,
  d.rationale,
  1 - (d.embedding <=> query_embedding) AS similarity
FROM architect_decisions d
JOIN projects p ON d.project_id = p.id
WHERE d.category = 'security_model'
  AND d.status = 'approved'
  AND 1 - (d.embedding <=> $1) > 0.7
ORDER BY d.embedding <=> $1
LIMIT 10;
```

---

### 4. Load Session Context

**Use Case:** "Retrieve last 20 conversation turns for session"

```sql
SELECT
  id,
  turn_number,
  role,
  content,
  metadata,
  timestamp
FROM architect_conversations
WHERE session_id = $1
ORDER BY turn_number DESC
LIMIT 20;
```

---

### 5. Find Screens Requiring Authentication

**Use Case:** "What screens need user authentication?"

```sql
SELECT
  s.id,
  s.screen_name,
  s.route,
  s.description,
  1 - (s.embedding <=> query_embedding) AS similarity
FROM architect_screens s
WHERE s.project_id = $1
  AND 1 - (s.embedding <=> $2) > 0.6
  AND s.behavior::jsonb @> '{"requires_auth": true}'
ORDER BY s.embedding <=> $2
LIMIT 10;
```

---

## Performance Optimization

### Index Tuning

**HNSW Index Parameters:**

```sql
-- Default (balanced)
CREATE INDEX idx_name ON table_name
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- High recall (slower build, faster search)
CREATE INDEX idx_name ON table_name
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 128);

-- Fast build (faster build, slower search)
CREATE INDEX idx_name ON table_name
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 8, ef_construction = 32);
```

**Runtime Search Parameter:**

```sql
-- Set per-session for high recall
SET hnsw.ef_search = 100;  -- Default: 40

-- Or per-query
SET LOCAL hnsw.ef_search = 100;
SELECT ...;
```

### Query Optimization

**1. Use Similarity Threshold:**

```sql
-- Good: Filter before ordering
WHERE 1 - (embedding <=> $1) > 0.7

-- Bad: Order entire table
ORDER BY embedding <=> $1
```

**2. Combine Vector + Metadata Filters:**

```sql
-- Good: Postgres can use both indexes
WHERE project_id = $1  -- B-tree index
  AND 1 - (embedding <=> $2) > 0.7  -- HNSW index

-- Bad: Vector search on all projects
WHERE 1 - (embedding <=> $1) > 0.7
```

**3. Use Covering Indexes:**

```sql
-- Include frequently queried columns
CREATE INDEX idx_decisions_project_status
  ON architect_decisions(project_id, status)
  INCLUDE (decision, confidence);
```

### Caching Strategy

**Hot Query Caching (Redis):**

```typescript
interface CacheKey {
  type: 'semantic_search' | 'session_context';
  project_id: string;
  query_hash: string;  // Hash of query text
}

async function semanticSearch(
  projectId: string,
  query: string
): Promise<SearchResult[]> {
  const cacheKey = `search:${projectId}:${hash(query)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Query database
  const results = await db.execute(/* vector search */);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(results));

  return results;
}
```

---

## Monitoring & Alerts

### Key Metrics

**Performance Metrics:**
- P50, P95, P99 query latency
- Queries per second (QPS)
- Index build time
- Database size growth

**Quality Metrics:**
- Recall@5, Recall@10 (via offline eval)
- Precision@5, Precision@10
- User satisfaction (implicit: did user rephrase query?)

**Resource Metrics:**
- Postgres CPU usage
- Memory usage (index cache)
- Disk I/O
- Connection pool saturation

### Alert Thresholds

```yaml
alerts:
  - name: high_latency
    condition: p95_latency > 500ms
    severity: warning
    action: "Investigate query patterns, consider index tuning"

  - name: critical_latency
    condition: p95_latency > 1000ms
    severity: critical
    action: "Consider migration to dedicated vector DB"

  - name: low_throughput
    condition: qps < 100
    severity: warning
    action: "Check connection pool, index health"

  - name: high_resource_usage
    condition: postgres_cpu > 80%
    severity: warning
    action: "Consider read replicas or caching"
```

---

## Migration Strategy

### Data Export (for future migration to Pinecone/Qdrant)

**Export Embeddings:**

```sql
-- Export to JSON
COPY (
  SELECT
    id,
    project_id,
    content,
    embedding::text AS embedding_vector,
    metadata,
    timestamp
  FROM architect_conversations
) TO '/tmp/conversations.json' WITH (FORMAT json);
```

**Import to Pinecone:**

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('sentra-architect');

// Batch upsert
const vectors = conversations.map(c => ({
  id: c.id,
  values: c.embedding_vector,
  metadata: {
    project_id: c.project_id,
    content: c.content,
    ...c.metadata,
  },
}));

await index.upsert(vectors);
```

---

## Testing Strategy

### Unit Tests

**1. Embedding Generation:**
- Verify embeddings are 1536 dimensions
- Check for null/empty content handling
- Validate chunking logic

**2. Query Construction:**
- Test metadata filtering
- Verify similarity thresholds
- Check query parameter escaping

### Integration Tests

**1. End-to-End Search:**
- Insert test conversations
- Query with known semantics
- Verify expected results in top 5

**2. Performance Benchmarks:**
- Measure P95 latency at 1K, 10K, 100K vectors
- Verify recall@5 ≥ 95%
- Check query throughput

### Load Testing

**Scenario 1: Session Loading**
- 100 concurrent users
- Each loads session context (20 turns)
- Target: P95 < 200ms

**Scenario 2: Semantic Search**
- 50 queries/second
- Random project + query combinations
- Target: P95 < 300ms

---

## Open Questions

1. **Chunking Strategy for Long Flows:**
   - Should we chunk flows > 10 steps?
   - How to maintain flow coherence across chunks?

2. **Cross-Project Embeddings:**
   - Should we use separate vector indexes per project?
   - Or single index with project_id filtering?

3. **Embedding Model Upgrades:**
   - How to handle OpenAI model updates (e.g., `text-embedding-3-large`)?
   - Re-embed all content or hybrid approach?

4. **Real-Time Updates:**
   - Should embeddings be generated sync or async?
   - What's acceptable latency for search after conversation?

---

## Future Enhancements

### Phase 2: Advanced Features

**1. Hybrid Search:**
- Combine vector search + full-text search (PostgreSQL `tsvector`)
- Boost exact matches, fall back to semantic

**2. Multi-Modal Embeddings:**
- Embed Figma screenshots (CLIP model)
- Visual similarity search for UI components

**3. Temporal Awareness:**
- Weight recent decisions higher
- Decay confidence over time

**4. Cross-Project Recommendations:**
- "Projects similar to this used Stripe for payments"
- Proactive suggestion engine

### Phase 3: Scale Optimization

**1. pgvectorscale Extension:**
- Streaming DiskANN index for 100M+ vectors
- Time-based partitioning

**2. Read Replicas:**
- Separate read replica for vector search
- Reduce load on primary database

**3. Migration to Dedicated Vector DB:**
- If vectors > 10M or P95 > 500ms
- Pinecone or Qdrant

---

## Approval

**Approved by:** Glen Barnhardt
**Date:** 2025-11-22
**Status:** Design Complete

**Next Steps:**
1. Implement prototype migration SQL
2. Create embedding generation service
3. Build semantic search API
4. Integrate with Voice Architect agent

---

*Last updated: 2025-11-22 by Glen Barnhardt with help from Claude Code*
