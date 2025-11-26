# ADR-003: Vector Database Selection for Voice Architect Memory

**Status:** Accepted

**Date:** 2025-11-22

**Decision Maker:** Glen Barnhardt

**Context Author:** Glen Barnhardt with help from Claude Code

---

## Context

Sentra's Voice Architect agent is designed to maintain memory across multi-session conversations, building comprehensive SaaS specifications through progressive interaction. The agent must preserve conversation context, extract architectural decisions, and enable semantic search across all project knowledge.

### Current State

- **Agent:** Voice Architect (Claude Opus 4)
- **Memory System:** File-based (YAML/Markdown in `.sentra/architect-sessions/`)
- **Limitation:** No semantic search capability
- **Scale Target:** 1,000 → 100,000 documented features across all projects

### Problem

The current file-based memory system has critical limitations:

1. **No Semantic Search:** Cannot find "authentication flows" when user says "login process"
2. **Context Fragmentation:** Related decisions scattered across sessions
3. **Poor Recall:** Must reload entire conversation history to find relevant context
4. **No Cross-Project Learning:** Cannot leverage patterns from similar projects
5. **Scalability Issues:** Linear search doesn't scale beyond 10-20 sessions

### User Requirement

Glen's vision (from `voice-architect.md`):
> "It's so important that I don't have to keep going back and forth on how something should work. Sentra is designed to take me away from that stress."

The Voice Architect must:
- Recall ALL relevant context from previous sessions
- Surface related decisions automatically
- Never ask the same question twice
- Support semantic search ("find all payment-related decisions")

### Technical Requirements

**Performance:**
- P50 latency: < 100ms (interactive search)
- P95 latency: < 200ms (acceptable for session loading)
- P99 latency: < 500ms (rare edge cases)

**Scale:**
- Initial: 1,000 conversation turns (10 projects × 100 turns)
- Target: 100,000 conversation turns (1,000 projects × 100 turns)
- Growth: 10x per year

**Accuracy:**
- Recall@5 ≥ 95% (find all relevant context)
- Precision@5 ≥ 80% (minimize noise)

**Compatibility:**
- Must work with OpenAI `text-embedding-3-small` (1536 dimensions)
- Must support metadata filtering (project_id, session_id, category)
- Must integrate with existing PostgreSQL + Drizzle stack

### Architecture Context

**Existing Infrastructure (from CLAUDE.md):**
- **Database:** PostgreSQL (Vercel Postgres or Supabase)
- **ORM:** Drizzle (edge-compatible)
- **Deployment:** Vercel Edge Functions
- **Stack Philosophy:** Edge-first, minimal dependencies, leverage existing infrastructure

---

## Research: Vector Database Options

### Option 1: Pinecone (Managed SaaS)

**Architecture:**
- Fully managed, cloud-native vector database
- Serverless or pod-based deployment
- Proprietary HNSW index optimizations

**Performance (2025 Benchmarks):**
- Insertion: 50,000 ops/sec (1M vectors, 1536 dim)
- Query: 5,000 queries/sec
- P95 latency: ~20-30ms (performance-optimized p2 index)
- Recall@5: 99% (default settings)

**Pros:**
- ✅ Best-in-class performance
- ✅ Zero operational overhead
- ✅ Auto-scaling
- ✅ Production-ready from day 1
- ✅ Excellent documentation and SDKs

**Cons:**
- ❌ **Cost:** $70/month minimum (1M vectors), scales to $1000s/month
- ❌ **Vendor lock-in:** No self-hosted option
- ❌ **Separate infrastructure:** Another service to manage
- ❌ **No transactions:** Cannot join with PostgreSQL data atomically
- ❌ **Data duplication:** Must sync between Postgres and Pinecone

**Cost Analysis:**
- Starter (100K vectors): $70/month
- Standard (10M vectors): $200-500/month
- Enterprise (100M+ vectors): $1000s/month

**Decision:** ❌ Rejected - High cost for MVP, vendor lock-in, infrastructure duplication

---

### Option 2: Weaviate (Open-Source, Self-Hosted)

**Architecture:**
- Open-source vector database with GraphQL API
- Supports multiple vector indexes (HNSW, flat, dynamic)
- Can self-host or use Weaviate Cloud

**Performance (2025 Benchmarks):**
- Insertion: 35,000 ops/sec (1M vectors, 1536 dim)
- Query: 3,500 queries/sec
- P95 latency: ~40-60ms
- Recall@5: 95-98%

**Pros:**
- ✅ Open-source with managed option
- ✅ Rich feature set (GraphQL, modules, hybrid search)
- ✅ Good documentation
- ✅ Active community

**Cons:**
- ❌ **Complex setup:** Requires Kubernetes/Docker orchestration
- ❌ **Operational burden:** Self-hosting requires DevOps expertise
- ❌ **Cloud cost:** $25-153/month (varies by configuration)
- ❌ **Separate infrastructure:** Another service to deploy
- ❌ **No transactions:** Cannot join with PostgreSQL data

**Cost Analysis:**
- Cloud (1M vectors): $25-153/month (varies by compression)
- Self-hosted: $50-200/month (infrastructure costs)

**Decision:** ❌ Rejected - High operational complexity, separate infrastructure

---

### Option 3: Qdrant (Open-Source)

**Architecture:**
- Open-source vector database written in Rust
- Excellent performance and memory efficiency
- HNSW + Product Quantization

**Performance (2025 Benchmarks):**
- Insertion: 45,000 ops/sec (1M vectors, 1536 dim)
- Query: 4,500 queries/sec
- P95 latency: 5.50ms at 90% recall, 36.73ms at 99% recall (50M vectors)
- Recall@5: 99%

**Pros:**
- ✅ Excellent performance (2nd only to Pinecone)
- ✅ Open-source with commercial support
- ✅ Memory-efficient (Rust-based)
- ✅ Cloud option available

**Cons:**
- ❌ **Separate infrastructure:** Another service to deploy
- ❌ **Cost:** $27-102/month cloud, or self-hosting overhead
- ❌ **No transactions:** Cannot join with PostgreSQL data
- ❌ **Learning curve:** New system to learn and maintain

**Cost Analysis:**
- Cloud (1M vectors): $27-102/month (varies by quantization)
- Self-hosted: $30-150/month (infrastructure costs)

**Decision:** ❌ Rejected - Separate infrastructure, no transactional guarantees

---

### Option 4: pgvector (PostgreSQL Extension) ⭐ RECOMMENDED

**Architecture:**
- PostgreSQL extension for vector similarity search
- HNSW index support (added in v0.5.0)
- Native Postgres integration with ACID guarantees

**Performance (2025 Benchmarks with pgvectorscale):**
- Insertion: 30,000 ops/sec (1M vectors, 1536 dim)
- Query: 471 queries/sec at 99% recall (50M vectors)
- P95 latency: 13.30ms at 90% recall, 60.42ms at 99% recall (50M vectors)
- **28x lower p95 latency vs Pinecone s1 (storage-optimized)**
- **1.4x lower p95 latency vs Pinecone p2 at 90% recall (performance-optimized)**
- Recall@5: 95-99%

**Pros:**
- ✅ **Zero additional infrastructure:** Uses existing PostgreSQL
- ✅ **Zero additional cost:** No separate service fees
- ✅ **ACID transactions:** Atomic updates with relational data
- ✅ **Drizzle integration:** Works seamlessly with our ORM
- ✅ **SQL joins:** Combine vector search with metadata filters
- ✅ **Backup/restore:** Use existing Postgres backup strategies
- ✅ **Edge compatible:** Works with Vercel Postgres
- ✅ **Excellent performance:** Competitive with dedicated solutions at our scale

**Cons:**
- ⚠️ **Scale ceiling:** Realistically maxes at 10-100M vectors
- ⚠️ **Performance degrades:** Slower than Pinecone/Qdrant at 100M+ vectors
- ⚠️ **Resource sharing:** Competes with OLTP workload for resources

**Cost Analysis:**
- PostgreSQL: $0 (already using)
- pgvector extension: $0 (open-source)
- pgvectorscale extension: $0 (Timescale open-source)
- **Total additional cost: $0/month**

**Scale Analysis:**
- **Current need:** 1,000 conversations (well within limits)
- **Target (1 year):** 10,000 conversations (comfortable)
- **Target (2 years):** 100,000 conversations (still viable)
- **Migration trigger:** 10M+ vectors or P95 > 500ms

**Decision:** ✅ **ACCEPTED** - Optimal for MVP and growth phase

---

## Decision

**We will use pgvector (PostgreSQL extension) for Voice Architect memory.**

### Rationale

1. **Leverage Existing Infrastructure**
   - Already using PostgreSQL with Drizzle
   - No new services to deploy or monitor
   - No additional vendor relationships

2. **Zero Additional Cost**
   - No monthly SaaS fees ($70-1000+/month savings)
   - No infrastructure overhead
   - Budget can focus on AI model costs

3. **Transactional Integrity**
   - Atomic updates: conversation + embeddings in single transaction
   - No sync issues between systems
   - ACID guarantees for data consistency

4. **Sufficient Performance**
   - P95 < 100ms for our scale (1K-100K vectors)
   - Recall@5 ≥ 95% with HNSW index
   - Can optimize with pgvectorscale if needed

5. **Migration Path Exists**
   - If we exceed 10M vectors, can migrate to Pinecone/Qdrant
   - Export embeddings via standard Postgres backup
   - No vendor lock-in

6. **Developer Experience**
   - Use familiar SQL syntax
   - Drizzle ORM integration
   - Single query language for all data

### Implementation Strategy

**Phase 1: Foundation (Week 1)**
- Enable pgvector extension
- Create vector tables with HNSW indexes
- Add embedding generation service

**Phase 2: Integration (Week 2)**
- Integrate with Voice Architect agent
- Implement semantic search API
- Add conversation embedding pipeline

**Phase 3: Optimization (Week 3)**
- Add pgvectorscale for better performance
- Tune index parameters (m, ef_construction)
- Implement caching layer

**Phase 4: Migration Trigger (Future)**
- Monitor P95 latency and throughput
- If P95 > 500ms or vectors > 10M, evaluate Pinecone/Qdrant
- Export embeddings via pg_dump
- Parallel run during migration

---

## Consequences

### Positive

1. **Immediate Benefits**
   - Start using vector search today (no procurement/setup)
   - No additional cost to budget
   - Simplified architecture (one less service)

2. **Developer Productivity**
   - Familiar SQL tooling
   - Existing backup/restore procedures
   - No new tech to learn

3. **Data Consistency**
   - Transactional guarantees
   - No eventual consistency issues
   - Simplified error handling

4. **Future Flexibility**
   - Can migrate to dedicated vector DB if needed
   - No vendor lock-in
   - Migration trigger is clear (10M vectors or P95 > 500ms)

### Negative

1. **Performance Ceiling**
   - Will need migration at 10M+ vectors
   - P95 latency degrades faster than dedicated solutions
   - Not optimal for 100M+ vector scale

2. **Resource Contention**
   - Vector search competes with OLTP workload
   - May need separate read replicas at high scale
   - Requires monitoring of Postgres resource usage

3. **Feature Gaps**
   - No built-in multi-tenancy features
   - Less sophisticated filtering than Pinecone
   - Fewer pre-built integrations

### Mitigation Strategies

1. **Monitor Performance**
   - Track P95 latency in production
   - Alert if P95 > 300ms (migration trigger)
   - Regular benchmarking against targets

2. **Optimize Proactively**
   - Use pgvectorscale extension
   - Tune HNSW index parameters
   - Implement Redis caching for hot queries

3. **Plan Migration Path**
   - Document export process
   - Test migration to Pinecone in staging
   - Keep embeddings reproducible (same model + chunk strategy)

---

## Alternatives Considered

### Alternative 1: Start with Pinecone for Best Performance

**Approach:** Use Pinecone from day 1 to ensure best performance

**Pros:**
- Best-in-class performance
- Zero operational overhead
- Production-ready

**Cons:**
- $70-500/month cost for MVP phase
- Vendor lock-in
- Separate infrastructure to manage

**Decision:** ❌ Rejected - Premature optimization, high cost for unvalidated product

---

### Alternative 2: Hybrid (pgvector for MVP, migrate later)

**Approach:** Start with pgvector, plan migration to Pinecone/Qdrant when scale requires

**Pros:**
- Low initial cost
- Migration path defined
- Best of both worlds

**Cons:**
- Migration effort later (1-2 weeks)
- Risk of tech debt
- Performance cliff when migration is needed

**Decision:** ✅ This IS our chosen approach (same as recommended option)

---

### Alternative 3: Wait for AI Memory Solutions

**Approach:** Wait for OpenAI or Anthropic to release managed memory APIs

**Pros:**
- Native integration with AI models
- Potentially better semantic understanding
- No infrastructure to manage

**Cons:**
- Unknown timeline (6-12+ months)
- Blocks Voice Architect development
- May not meet our custom requirements

**Decision:** ❌ Rejected - Cannot wait, need solution now

---

## Technical Specifications

### Vector Configuration

**Embedding Model:**
- Model: `text-embedding-3-small` (OpenAI)
- Dimensions: 1536
- Cost: $0.02 / 1M tokens
- Performance: 62.3% on MTEB benchmark

**Index Configuration:**
- Algorithm: HNSW (Hierarchical Navigable Small World)
- Distance metric: Cosine similarity
- Index parameters:
  - `m`: 16 (number of bi-directional links)
  - `ef_construction`: 64 (size of dynamic candidate list)
  - `ef_search`: 40 (runtime search parameter)

**Chunking Strategy:**
- Chunk size: 512 tokens (~2000 characters)
- Overlap: 50 tokens (~200 characters)
- Method: Semantic chunking (preserve sentence boundaries)

### Performance Targets

**Latency:**
- P50: < 50ms
- P95: < 200ms
- P99: < 500ms

**Throughput:**
- Minimum: 100 queries/sec (session loading)
- Target: 500+ queries/sec (concurrent users)

**Accuracy:**
- Recall@5: ≥ 95%
- Precision@5: ≥ 80%

### Migration Triggers

Migrate to Pinecone/Qdrant if:
1. Total vectors > 10M
2. P95 latency > 500ms (sustained)
3. Query throughput < 100 QPS (sustained)
4. Resource contention impacts OLTP workload

---

## Implementation Checklist

### Week 1: Foundation
- [x] Research vector database options
- [x] Create ADR-003
- [ ] Enable pgvector extension in PostgreSQL
- [ ] Create vector schema (see VECTOR-SCHEMA.md)
- [ ] Create prototype migration
- [ ] Test basic vector operations (insert, search)

### Week 2: Integration
- [ ] Add embedding generation service
- [ ] Implement chunking strategy
- [ ] Create semantic search API
- [ ] Integrate with Voice Architect agent
- [ ] Add metadata filtering

### Week 3: Optimization
- [ ] Add pgvectorscale extension
- [ ] Tune HNSW index parameters
- [ ] Implement query caching (Redis)
- [ ] Add performance monitoring
- [ ] Load testing (1K, 10K, 100K vectors)

### Week 4: Production
- [ ] Deploy to staging
- [ ] Seed with test data
- [ ] Verify P95 < 200ms
- [ ] Deploy to production
- [ ] Monitor performance metrics

---

## Success Metrics

**Functional:**
- [ ] Voice Architect can recall relevant context from any session
- [ ] Semantic search works ("find authentication decisions")
- [ ] Cross-project learning enabled
- [ ] Zero data loss during conversation

**Performance:**
- [ ] P95 latency < 200ms (1K vectors)
- [ ] P95 latency < 300ms (10K vectors)
- [ ] Recall@5 ≥ 95%
- [ ] Query throughput > 100 QPS

**Business:**
- [ ] $0 additional monthly cost
- [ ] Zero operational incidents
- [ ] Voice Architect quality improves (fewer repeated questions)

---

## References

### Research Sources

**Vector Database Comparisons:**
- [Vector Database Comparison 2025: Pinecone vs Weaviate vs Chroma vs Qdrant (System Debug)](https://sysdebug.com/posts/vector-database-comparison-guide-2025/)
- [Choosing the Right Vector Database (Medium)](https://medium.com/@elisheba.t.anderson/choosing-the-right-vector-database-opensearch-vs-pinecone-vs-qdrant-vs-weaviate-vs-milvus-vs-037343926d7e)
- [Vector DBs: Pinecone vs. Weaviate vs. Qdrant vs. pgvector (wearemicro.co)](https://wearemicro.co/vector-database-comparison/)

**pgvector Performance:**
- [Pgvector vs. Pinecone: Vector Database Comparison (TigerData)](https://www.tigerdata.com/blog/pgvector-vs-pinecone)
- [Pgvector vs Qdrant: 1M OpenAI Benchmark (Nirant Kasliwal)](https://nirantk.com/writing/pgvector-vs-qdrant/)
- [Pgvector vs. Qdrant: Benchmarking Open-Source Vector Databases (Timescale)](https://medium.com/timescale/pgvector-vs-qdrant-open-source-vector-database-comparison-f40e59825ae5)
- [pgvectorscale GitHub (Timescale)](https://github.com/timescale/pgvectorscale)
- [Benchmarking pgvector RAG performance (Mastra.ai)](https://mastra.ai/blog/pgvector-perf)

**Technical Documentation:**
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Drizzle ORM: https://orm.drizzle.team/

### Internal Documentation

- `CLAUDE.md` - Sentra project context
- `docs/decisions/ADR-002-DRIZZLE-ORM-MIGRATION.md` - ORM decision rationale
- `.claude/agents/voice-architect.md` - Voice Architect requirements
- `drizzle/migrations/0000_steady_thunderball.sql` - Existing schema

---

## Approval

**Approved by:** Glen Barnhardt

**Date:** 2025-11-22

**Status:** Accepted

**Next Steps:**
1. Create VECTOR-SCHEMA.md (detailed schema design)
2. Create prototype migration `XXXX_add_vector_support.sql`
3. Begin Phase 1 implementation (Week 1)
4. Target: Vector search operational in 3 weeks

---

*Last updated: 2025-11-22 by Glen Barnhardt with help from Claude Code*
