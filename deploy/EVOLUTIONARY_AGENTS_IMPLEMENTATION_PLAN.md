# Sentra Evolutionary Agent System - Detailed Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for integrating evolutionary AI agents into the Sentra orchestration and observability system. The implementation will transform Sentra from a basic approval and monitoring system into an advanced self-learning development orchestration platform.

## Current State Analysis

### Existing Sentra Components
✅ **Already Implemented:**
- FastAPI backend with routes, security, MCP endpoint
- PostgreSQL database with basic schema
- Sentra Bridge for local command polling/replay
- Sentra Guard for dangerous command approval
- Basic orchestrator worker for task management
- Pushover notifications and OpenAI TTS integration
- Docker deployment infrastructure

❌ **Missing for Evolution System:**
- TypeScript frontend with evolutionary dashboards
- Advanced AI agent framework
- Vector database integration
- Cross-project learning mechanisms
- Pattern storage and mutation systems
- Real-time evolution monitoring

## Implementation Strategy

### Development Team Structure

We'll use Claude Code's sub-agent system to parallelize development across 5 specialized teams:

1. **Core Infrastructure Team** (Agent 1-2) - Foundation systems
2. **Agent Intelligence Team** (Agent 3-4) - AI reasoning and learning
3. **Learning Systems Team** (Agent 5-6) - Cross-project intelligence  
4. **Observability Team** (Agent 7) - Monitoring and analytics
5. **Integration Team** (Agent 8) - API and project bridging

## Phase 1: Foundation Infrastructure (Weeks 1-4)

### Week 1: Project Structure & TypeScript Setup

**Core Infrastructure Team Tasks:**

```bash
# Project structure setup
sentra/
├── packages/
│   ├── core/                    # Core evolution engine
│   │   ├── src/
│   │   │   ├── dna/            # DNA engine and mutations
│   │   │   ├── agents/         # Base agent classes
│   │   │   ├── memory/         # Memory networks
│   │   │   └── types/          # TypeScript definitions
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── dashboard/              # Vue 3 evolution dashboard
│   │   ├── src/
│   │   │   ├── components/     # Evolution UI components
│   │   │   ├── views/          # Dashboard pages
│   │   │   ├── stores/         # Pinia state management
│   │   │   └── composables/    # Vue composition API
│   │   └── package.json
│   ├── api/                    # Enhanced API layer
│   │   ├── src/
│   │   │   ├── evolution/      # Evolution endpoints
│   │   │   ├── agents/         # Agent management
│   │   │   └── learning/       # Learning system APIs
│   │   └── package.json
│   └── cli/                    # Enhanced Sentra CLI
│       ├── src/
│       │   ├── commands/       # Evolution commands
│       │   └── evolution/      # Evolution CLI features
│       └── package.json
├── services/                   # Existing services (enhanced)
│   ├── api/                    # Keep existing FastAPI
│   ├── bridge/                 # Enhanced bridge
│   ├── guard/                  # Enhanced guard
│   └── orchestrator/           # Enhanced orchestrator
├── docker-compose.evolution.yml # Development environment
└── package.json               # Monorepo root
```

**Deliverables Week 1:**
- Monorepo structure with TypeScript packages
- Strict TypeScript configuration
- Development environment setup
- Basic CI/CD pipeline

### Week 2: Database Schema Evolution

**Core Infrastructure Team Tasks:**

```sql
-- New evolutionary tables (extending existing schema)
CREATE TABLE evolution_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(50) NOT NULL,
    genetics JSONB NOT NULL,
    performance_metrics JSONB NOT NULL,
    project_context JSONB NOT NULL,
    generation INTEGER DEFAULT 1,
    parent_id UUID REFERENCES evolution_dna(id),
    embedding VECTOR(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    capabilities JSONB NOT NULL,
    reasoning_patterns JSONB NOT NULL DEFAULT '[]',
    performance_history JSONB NOT NULL DEFAULT '{}',
    learning_progress JSONB NOT NULL DEFAULT '{}',
    project_id UUID REFERENCES projects(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE learning_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agent_instances(id),
    project_id UUID REFERENCES projects(id),
    task_type VARCHAR(50) NOT NULL,
    outcome_type VARCHAR(20) NOT NULL, -- 'success', 'failure', 'improvement'
    performance_data JSONB NOT NULL,
    patterns_used TEXT[] DEFAULT '{}',
    learned_patterns JSONB DEFAULT '[]',
    context_embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE evolution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    agent_id UUID REFERENCES agent_instances(id),
    project_id UUID REFERENCES projects(id),
    event_data JSONB NOT NULL,
    impact_score FLOAT DEFAULT 0.0,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_evolution_dna_pattern_type ON evolution_dna(pattern_type);
CREATE INDEX idx_evolution_dna_generation ON evolution_dna(generation);
CREATE INDEX idx_evolution_dna_embedding ON evolution_dna USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_learning_outcomes_agent ON learning_outcomes(agent_id);
CREATE INDEX idx_learning_outcomes_project ON learning_outcomes(project_id);
CREATE INDEX idx_evolution_events_type ON evolution_events(event_type);
CREATE INDEX idx_evolution_events_timestamp ON evolution_events(timestamp DESC);
```

**Deliverables Week 2:**
- Enhanced database schema with vector support
- Drizzle ORM models for new tables
- Database migration system
- Vector database (Qdrant) integration setup

### Week 3: Core Type System & DNA Engine

**Core Infrastructure Team Implementation:**

```typescript
// packages/core/src/types/evolution.ts
export interface CodeDNA {
  readonly id: string;
  readonly patternType: PatternType;
  readonly context: ProjectContext;
  readonly genetics: GeneticMarkers;
  readonly performance: PerformanceMetrics;
  readonly mutations: readonly Mutation[];
  readonly embedding: readonly number[];
  readonly timestamp: Date;
  readonly generation: number;
  readonly parentId?: string;
}

export interface GeneticMarkers {
  readonly complexity: number;        // 0-1, code complexity
  readonly adaptability: number;      // 0-1, how well it adapts
  readonly successRate: number;       // 0-1, historical success
  readonly transferability: number;   // 0-1, cross-project potential
  readonly stability: number;         // 0-1, consistency of results
  readonly novelty: number;          // 0-1, uniqueness of approach
}

export interface Mutation {
  readonly id: string;
  readonly parentDNA: string;
  readonly changes: readonly CodeChange[];
  readonly reason: MutationReason;
  readonly outcome: MutationOutcome;
  readonly performanceImpact: number; // Positive/negative impact
  readonly timestamp: Date;
}

export interface ProjectContext {
  readonly projectId: string;
  readonly domain: ProjectDomain;
  readonly technologies: readonly Technology[];
  readonly constraints: readonly Constraint[];
  readonly goals: readonly ProjectGoal[];
  readonly teamSize: number;
  readonly timeline: ProjectTimeline;
}

export type PatternType = 
  | 'architectural' | 'algorithmic' | 'testing' | 'optimization' 
  | 'security' | 'integration' | 'debugging' | 'refactoring';

export type MutationReason = 
  | 'performance_optimization' | 'failure_adaptation' | 'context_adaptation'
  | 'simplification' | 'feature_enhancement' | 'error_correction';
```

```typescript
// packages/core/src/dna/dna-engine.ts
import { EventEmitter } from 'node:events';
import type { CodeDNA, Mutation, ProjectContext } from '../types/evolution.js';

export class DNAEngine extends EventEmitter {
  private readonly patterns = new Map<string, CodeDNA>();
  private readonly mutationHistory = new Map<string, readonly Mutation[]>();

  constructor(
    private readonly vectorDB: VectorDatabase,
    private readonly database: Database,
    private readonly openaiClient: OpenAI
  ) {
    super();
  }

  async evolvePattern(
    pattern: CodeDNA,
    context: ProjectContext,
    feedback: PerformanceFeedback
  ): Promise<CodeDNA> {
    // Generate multiple mutation strategies
    const mutations = await Promise.all([
      this.generateOptimizationMutation(pattern, feedback),
      this.generateAdaptationMutation(pattern, context),
      this.generateSimplificationMutation(pattern),
      this.generateHybridMutation(pattern, context)
    ]);

    const validMutations = mutations.filter(m => m !== null);
    if (validMutations.length === 0) return pattern;

    // Select best mutation using multi-criteria scoring
    const bestMutation = await this.selectOptimalMutation(validMutations, context);
    const evolvedPattern = await this.applyMutation(pattern, bestMutation);
    
    // Validate evolution doesn't break constraints
    await this.validateEvolution(evolvedPattern, context);
    
    // Store in database and vector store
    await this.storePattern(evolvedPattern);
    
    this.emit('pattern_evolved', { 
      original: pattern, 
      evolved: evolvedPattern, 
      mutation: bestMutation 
    });
    
    return evolvedPattern;
  }

  async findSimilarPatterns(
    context: ProjectContext,
    requirements: PatternRequirements,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<readonly CodeDNA[]> {
    // Create embedding from context and requirements
    const queryText = this.contextToEmbeddingText(context, requirements);
    const embedding = await this.createEmbedding(queryText);
    
    // Search vector database
    const results = await this.vectorDB.similaritySearch(embedding, {
      limit: options.limit ?? 50,
      threshold: options.threshold ?? 0.7,
      filter: {
        domain: context.domain,
        technologies: { $in: context.technologies }
      }
    });

    // Load full patterns and rank by fitness
    const patterns = await Promise.all(
      results.map(result => this.loadPattern(result.id))
    );

    return patterns
      .filter((p): p is CodeDNA => p !== null)
      .sort((a, b) => this.calculateFitness(b, context) - this.calculateFitness(a, context));
  }

  private async generateOptimizationMutation(
    pattern: CodeDNA,
    feedback: PerformanceFeedback
  ): Promise<Mutation | null> {
    if (feedback.performance >= pattern.performance.executionTime) {
      return null; // No optimization needed
    }

    const optimizationPrompt = `
    Optimize this code pattern for better performance:
    
    Current Pattern: ${JSON.stringify(pattern, null, 2)}
    Performance Feedback: ${JSON.stringify(feedback, null, 2)}
    
    Focus on:
    - Reducing time complexity
    - Optimizing memory usage
    - Eliminating bottlenecks
    - Improving cache utilization
    
    Return optimized code with explanations.
    `;

    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: optimizationPrompt }],
      temperature: 0.3
    });

    // Parse response and create mutation
    return this.parseMutationResponse(completion.choices[0].message.content, pattern, 'performance_optimization');
  }

  private calculateFitness(pattern: CodeDNA, context: ProjectContext): number {
    const weights = {
      contextMatch: 0.3,
      performance: 0.25,
      adaptability: 0.15,
      stability: 0.15,
      novelty: 0.1,
      generation: 0.05
    };

    const contextMatch = this.calculateContextMatch(pattern.context, context);
    const performanceScore = pattern.performance.successRate * pattern.performance.efficiency;
    const generationPenalty = Math.max(0, (pattern.generation - 5) * 0.02);

    return (
      contextMatch * weights.contextMatch +
      performanceScore * weights.performance +
      pattern.genetics.adaptability * weights.adaptability +
      pattern.genetics.stability * weights.stability +
      pattern.genetics.novelty * weights.novelty
    ) - generationPenalty;
  }
}
```

**Deliverables Week 3:**
- Complete type system for evolutionary components
- Working DNA Engine with mutation capabilities
- Pattern storage and retrieval system
- Basic evolution algorithms

### Week 4: Vector Database & Pattern Storage

**Core Infrastructure Team Tasks:**

```typescript
// packages/core/src/storage/vector-store.ts
export class EvolutionVectorStore {
  constructor(
    private readonly qdrant: QdrantClient,
    private readonly openai: OpenAI
  ) {}

  async storePattern(pattern: CodeDNA): Promise<void> {
    const embedding = await this.createEmbedding(
      this.patternToEmbeddingText(pattern)
    );

    await this.qdrant.upsert('evolution_patterns', {
      wait: true,
      points: [{
        id: pattern.id,
        vector: embedding,
        payload: {
          patternType: pattern.patternType,
          generation: pattern.generation,
          projectId: pattern.context.projectId,
          domain: pattern.context.domain,
          technologies: pattern.context.technologies,
          genetics: pattern.genetics,
          performance: pattern.performance,
          createdAt: pattern.timestamp.toISOString()
        }
      }]
    });
  }

  async searchSimilarPatterns(
    query: PatternQuery,
    options: SearchOptions = {}
  ): Promise<readonly SimilarPattern[]> {
    const queryEmbedding = await this.createEmbedding(query.text);
    
    const searchResult = await this.qdrant.search('evolution_patterns', {
      vector: queryEmbedding,
      limit: options.limit ?? 20,
      score_threshold: options.threshold ?? 0.7,
      filter: this.buildFilter(query.filters)
    });

    return searchResult.map(result => ({
      id: result.id as string,
      score: result.score,
      pattern: this.payloadToPattern(result.payload),
      relevance: this.calculateRelevance(result, query)
    }));
  }

  private buildFilter(filters?: PatternFilters): Record<string, unknown> {
    if (!filters) return {};

    const filter: Record<string, unknown> = {};

    if (filters.patternType) {
      filter.patternType = { $eq: filters.patternType };
    }

    if (filters.domain) {
      filter.domain = { $eq: filters.domain };
    }

    if (filters.technologies && filters.technologies.length > 0) {
      filter.technologies = { $in: filters.technologies };
    }

    if (filters.minGeneration) {
      filter.generation = { $gte: filters.minGeneration };
    }

    if (filters.minSuccessRate) {
      filter['genetics.successRate'] = { $gte: filters.minSuccessRate };
    }

    return { must: [filter] };
  }
}
```

**Deliverables Week 4:**
- Vector database integration with Qdrant
- Pattern embedding and similarity search
- Advanced filtering and querying capabilities
- Performance optimization for large pattern sets

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze blueprint requirements and create implementation plan", "status": "completed", "activeForm": "Analyzing blueprint requirements and creating implementation plan"}, {"content": "Structure the development phases and sub-agent assignments", "status": "in_progress", "activeForm": "Structuring the development phases and sub-agent assignments"}, {"content": "Create detailed technical specifications", "status": "pending", "activeForm": "Creating detailed technical specifications"}, {"content": "Save implementation plan to file", "status": "pending", "activeForm": "Saving implementation plan to file"}]