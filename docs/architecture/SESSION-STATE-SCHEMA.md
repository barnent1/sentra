# Session State Schema Design

## Overview

This document defines the PostgreSQL database schema for managing multi-session voice architect conversations in Quetrex. The schema supports full context preservation across sessions, enabling the architect to resume conversations without re-asking questions or losing conversation history.

## Design Principles

1. **Full Context Preservation** - No lossy summaries; every conversation turn is stored
2. **Efficient Resume** - Fast loading of session state with intelligent context windowing
3. **Confidence Tracking** - Objective, auditable scoring of specification completeness
4. **Session Isolation** - Each project can have multiple independent architect sessions
5. **Edge-Compatible** - Uses Drizzle ORM for Vercel Edge Runtime support

## Schema Tables

### 1. architect_sessions

Primary table tracking overall session metadata and completion status.

```typescript
export const architectSessions = pgTable('architect_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // Session state
  status: text('status').notNull(), // 'active', 'paused', 'complete', 'abandoned'

  // Overall completion metrics
  overallCompletion: integer('overall_completion').notNull().default(0), // 0-100
  readinessScore: integer('readiness_score').notNull().default(0), // 0-100

  // Session metadata
  sessionName: text('session_name'), // Optional user-provided name
  lastTopic: text('last_topic'), // Last category discussed
  totalTurns: integer('total_turns').notNull().default(0),

  // Timestamps
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),

  // JSON metadata
  metadata: text('metadata'), // JSON: { user_preferences, session_tags, etc }

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('architect_sessions_project_id_idx').on(table.projectId),
  statusIdx: index('architect_sessions_status_idx').on(table.status),
  lastActiveIdx: index('architect_sessions_last_active_idx').on(table.lastActiveAt),
}));
```

**Fields Explanation:**

- `status`: Current session state
  - `active`: Session in progress, user actively conversing
  - `paused`: User stepped away, can resume anytime
  - `complete`: All categories at 90%+ confidence, spec generated
  - `abandoned`: Session inactive for 30+ days

- `overallCompletion`: Weighted average of all category completions (0-100%)
- `readinessScore`: Confidence that spec is ready for implementation (90-95% required)
- `lastTopic`: Last coverage category discussed (helps resume context)
- `totalTurns`: Total conversation turns in this session

### 2. architect_categories

Tracks completion and confidence for each coverage category.

```typescript
export const architectCategories = pgTable('architect_categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().references(() => architectSessions.id, { onDelete: 'cascade' }),

  // Category identification
  category: text('category').notNull(), // 'business_requirements', 'database_architecture', etc.

  // Completion metrics
  completion: integer('completion').notNull().default(0), // 0-100
  confidence: integer('confidence').notNull().default(0), // 0-100
  status: text('status').notNull().default('incomplete'), // 'incomplete', 'partial', 'complete', 'not_applicable'

  // Content tracking
  questionsAsked: integer('questions_asked').notNull().default(0),
  questionsAnswered: integer('questions_answered').notNull().default(0),
  subtopicsCovered: text('subtopics_covered'), // JSON array of subtopics discussed

  // Context for resume
  lastDiscussedAt: timestamp('last_discussed_at'),
  lastQuestion: text('last_question'), // Last question asked in this category
  missingItems: text('missing_items'), // JSON array of items still needed
  keyPoints: text('key_points'), // JSON array of critical decisions/facts

  // File references
  outputFile: text('output_file'), // Path to generated spec file

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('architect_categories_session_id_idx').on(table.sessionId),
  categoryIdx: index('architect_categories_category_idx').on(table.category),
  sessionCategoryUnique: uniqueIndex('architect_categories_session_category_unique')
    .on(table.sessionId, table.category),
}));
```

**Fields Explanation:**

- `category`: Matches coverage-checklist.yml categories
- `completion`: % of required questions answered (0-100)
- `confidence`: Calculated score based on completeness, specificity, consistency, coverage
- `questionsAsked`: Counter for tracking conversation depth
- `questionsAnswered`: Counter for tracking user engagement
- `subtopicsCovered`: JSON array like `["authentication", "authorization", "session_management"]`
- `missingItems`: JSON array like `["password_reset_flow", "oauth_providers"]`
- `keyPoints`: JSON array of critical facts, e.g., `["Using bcrypt with 10 rounds", "JWT expiration: 7 days"]`

### 3. architect_conversations

Stores every conversation turn for full context preservation.

```typescript
export const architectConversations = pgTable('architect_conversations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().references(() => architectSessions.id, { onDelete: 'cascade' }),

  // Turn identification
  turnNumber: integer('turn_number').notNull(), // Sequential turn in conversation
  role: text('role').notNull(), // 'user', 'assistant', 'system'

  // Content
  content: text('content').notNull(), // Full message content
  mode: text('mode'), // 'voice', 'text' (how user provided input)

  // Categorization
  relatedCategory: text('related_category'), // Which coverage category this relates to

  // Context metadata
  tokensUsed: integer('tokens_used'), // For budget tracking
  metadata: text('metadata'), // JSON: { audio_duration, transcription_confidence, etc }

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('architect_conversations_session_id_idx').on(table.sessionId),
  turnNumberIdx: index('architect_conversations_turn_number_idx').on(table.sessionId, table.turnNumber),
  createdAtIdx: index('architect_conversations_created_at_idx').on(table.createdAt),
}));
```

**Fields Explanation:**

- `turnNumber`: Sequential number (1, 2, 3...) for ordering
- `role`: Who spoke (user, assistant, system instruction)
- `content`: Full message text (never summarized or compressed)
- `mode`: How the message was delivered (voice vs text input)
- `relatedCategory`: Links conversation to coverage category for targeted resume

**Note on Embeddings:**
The original spec mentioned `embeddings VECTOR` for semantic search. For Phase 1, we'll use simple text search and chronological ordering. Vector embeddings can be added in Phase 2 using pgvector extension if needed for semantic session search.

### 4. architect_decisions

Tracks critical architectural decisions made during the session.

```typescript
export const architectDecisions = pgTable('architect_decisions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionId: text('session_id').notNull().references(() => architectSessions.id, { onDelete: 'cascade' }),

  // Decision context
  category: text('category').notNull(), // Related coverage category
  title: text('title').notNull(), // Brief decision title

  // Decision details
  decision: text('decision').notNull(), // The decision made
  rationale: text('rationale').notNull(), // Why this decision was made
  alternatives: text('alternatives'), // JSON array of alternatives considered
  tradeoffs: text('tradeoffs'), // JSON object of pros/cons

  // Decision metadata
  status: text('status').notNull().default('proposed'), // 'proposed', 'accepted', 'rejected', 'superseded'
  impact: text('impact'), // 'low', 'medium', 'high', 'critical'
  supersededBy: text('superseded_by'), // ID of decision that replaces this one

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
}, (table) => ({
  sessionIdIdx: index('architect_decisions_session_id_idx').on(table.sessionId),
  categoryIdx: index('architect_decisions_category_idx').on(table.category),
  statusIdx: index('architect_decisions_status_idx').on(table.status),
}));
```

**Fields Explanation:**

- `decision`: E.g., "Use Drizzle ORM instead of Prisma"
- `rationale`: E.g., "Edge Runtime compatibility required for Vercel deployment"
- `alternatives`: JSON like `["Prisma", "TypeORM", "Raw SQL"]`
- `tradeoffs`: JSON like `{"pros": ["Edge compatible", "Lightweight"], "cons": ["Smaller ecosystem", "Less tooling"]}`
- `supersededBy`: If decision is later changed, reference to new decision

## Database Indexes

### Performance-Critical Indexes

1. **Session Lookup**
   - `architect_sessions.project_id` - Find all sessions for a project
   - `architect_sessions.status` - Filter by active/paused sessions
   - `architect_sessions.last_active_at` - Find recently active sessions

2. **Category Queries**
   - `architect_categories.session_id` - Load all categories for a session
   - `architect_categories.session_id + category` - Unique constraint, fast category lookup

3. **Conversation History**
   - `architect_conversations.session_id` - Load all turns for a session
   - `architect_conversations.session_id + turn_number` - Ordered turn retrieval
   - `architect_conversations.created_at` - Chronological queries

4. **Decision Tracking**
   - `architect_decisions.session_id` - Load all decisions for a session
   - `architect_decisions.category` - Find decisions by coverage area

## Relationships

```
projects (1) ──→ (*) architect_sessions
    └─→ (1) architect_sessions ──→ (*) architect_categories
        └─→ (1) architect_sessions ──→ (*) architect_conversations
            └─→ (1) architect_sessions ──→ (*) architect_decisions
```

## Drizzle Relations

```typescript
// Session relations
export const architectSessionsRelations = relations(architectSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [architectSessions.projectId],
    references: [projects.id],
  }),
  categories: many(architectCategories),
  conversations: many(architectConversations),
  decisions: many(architectDecisions),
}));

// Category relations
export const architectCategoriesRelations = relations(architectCategories, ({ one }) => ({
  session: one(architectSessions, {
    fields: [architectCategories.sessionId],
    references: [architectSessions.id],
  }),
}));

// Conversation relations
export const architectConversationsRelations = relations(architectConversations, ({ one }) => ({
  session: one(architectSessions, {
    fields: [architectConversations.sessionId],
    references: [architectSessions.id],
  }),
}));

// Decision relations
export const architectDecisionsRelations = relations(architectDecisions, ({ one }) => ({
  session: one(architectSessions, {
    fields: [architectDecisions.sessionId],
    references: [architectSessions.id],
  }),
}));
```

## Type Exports

```typescript
export type ArchitectSession = typeof architectSessions.$inferSelect;
export type NewArchitectSession = typeof architectSessions.$inferInsert;

export type ArchitectCategory = typeof architectCategories.$inferSelect;
export type NewArchitectCategory = typeof architectCategories.$inferInsert;

export type ArchitectConversation = typeof architectConversations.$inferSelect;
export type NewArchitectConversation = typeof architectConversations.$inferInsert;

export type ArchitectDecision = typeof architectDecisions.$inferSelect;
export type NewArchitectDecision = typeof architectDecisions.$inferInsert;
```

## Storage Estimates

**Per Session Estimates:**

- Session record: ~500 bytes
- 10 categories: 10 × 2 KB = 20 KB
- 100 conversation turns: 100 × 1 KB = 100 KB
- 20 decisions: 20 × 1 KB = 20 KB
- **Total per session: ~140 KB**

**100 Sessions: ~14 MB**

This is extremely manageable for PostgreSQL and fits well within Vercel Postgres free tier limits.

## Migration Strategy

1. Add tables to `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/` directory
4. Apply migration: `npm run db:migrate`
5. Verify with Drizzle Studio: `npm run db:studio`

## Data Retention Policy

- **Active sessions**: Kept indefinitely
- **Paused sessions**: Kept for 90 days of inactivity
- **Complete sessions**: Kept for 1 year (reference for future projects)
- **Abandoned sessions**: Archived after 30 days, deleted after 1 year

## Security Considerations

1. **User Isolation**: All queries MUST filter by `project.userId` to ensure users only access their own sessions
2. **Cascading Deletes**: When a project is deleted, all architect sessions and related data are automatically deleted
3. **No PII**: Conversation content may contain business logic but should not contain personal identifying information
4. **Audit Trail**: All decisions and conversations are timestamped for accountability

## Future Enhancements (Phase 2+)

1. **Vector Embeddings**: Add `pgvector` extension for semantic search across conversations
2. **Session Branching**: Support forking sessions to explore alternative architectures
3. **Session Templates**: Pre-populated sessions for common project types
4. **Collaborative Sessions**: Multiple users contributing to same architect session
5. **Session Export**: Export full session as markdown/PDF for documentation

---

**Status**: Ready for implementation
**Last Updated**: 2025-11-22
**Author**: Glen Barnhardt with help from Claude Code
