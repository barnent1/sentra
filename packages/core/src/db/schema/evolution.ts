/**
 * Evolution-specific schema definitions for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import { pgTable, uuid, text, timestamp, jsonb, integer, real, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { 
  EvolutionDnaId, 
  AgentInstanceId, 
  TaskId,
  ProjectContextId,
  LearningOutcomeId,
  EvolutionEventId,
  GeneticMarkers,
  PerformanceMetrics,
  ProjectContext,
} from '@sentra/types';
import { projects, tasks } from './base';

// Enable UUID generation
export const uuidGenerateV4 = sql`uuid_generate_v4()`;

// Custom vector type for pgvector
export const vector = (name: string, config?: { dimensions: number }) => {
  return customType<{ data: number[]; driverData: string }>({
    dataType() {
      return config ? `vector(${config.dimensions})` : 'vector';
    },
  })(name);
};

/**
 * Evolution DNA table - stores genetic patterns and performance data for evolutionary learning
 */
export const evolutionDna = pgTable('evolution_dna', {
  id: uuid('id').primaryKey().$type<EvolutionDnaId>().default(uuidGenerateV4),
  patternType: text('pattern_type').notNull(), // e.g., 'analytical', 'creative', 'systematic'
  genetics: jsonb('genetics').$type<GeneticMarkers>().notNull(),
  performance: jsonb('performance_metrics').$type<PerformanceMetrics>().notNull(),
  projectContext: jsonb('project_context').$type<ProjectContext>().notNull(),
  generation: integer('generation').default(1),
  parentId: uuid('parent_id').$type<EvolutionDnaId>(),
  embedding: vector('embedding', { dimensions: 1536 }), // Vector embedding for similarity matching
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Agent instances table - specific instances of evolutionary agents with their DNA
 */
export const agentInstances = pgTable('agent_instances', {
  id: uuid('id').primaryKey().$type<AgentInstanceId>().default(uuidGenerateV4),
  evolutionDnaId: uuid('evolution_dna_id').$type<EvolutionDnaId>().references(() => evolutionDna.id).notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // inherited from DNA but can specialize
  status: text('status').notNull().default('active'), // active, inactive, archived
  currentTaskId: uuid('current_task_id').$type<TaskId>().references(() => tasks.id),
  spawnedAt: timestamp('spawned_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  performanceHistory: jsonb('performance_history').$type<readonly PerformanceMetrics[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
});

/**
 * Learning outcomes table - captures learning from task execution for evolution
 */
export const learningOutcomes = pgTable('learning_outcomes', {
  id: uuid('id').primaryKey().$type<LearningOutcomeId>().default(uuidGenerateV4),
  agentInstanceId: uuid('agent_instance_id').$type<AgentInstanceId>().references(() => agentInstances.id).notNull(),
  evolutionDnaId: uuid('evolution_dna_id').$type<EvolutionDnaId>().references(() => evolutionDna.id).notNull(),
  taskId: uuid('task_id').$type<TaskId>().references(() => tasks.id).notNull(),
  outcomeType: text('outcome_type').notNull(), // success, failure, partial, blocked
  performanceImprovement: real('performance_improvement').notNull(), // -1.0 to 1.0
  lessonLearned: text('lesson_learned').notNull(),
  contextFactors: jsonb('context_factors').$type<readonly string[]>().notNull(),
  applicabilityScore: real('applicability_score').notNull(), // 0.0 to 1.0
  embedding: vector('embedding', { dimensions: 1536 }), // Vector embedding for similarity
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Evolution events table - tracks DNA evolution events and genetic changes
 */
export const evolutionEvents = pgTable('evolution_events', {
  id: uuid('id').primaryKey().$type<EvolutionEventId>().default(uuidGenerateV4),
  parentDnaId: uuid('parent_dna_id').$type<EvolutionDnaId>().references(() => evolutionDna.id).notNull(),
  childDnaId: uuid('child_dna_id').$type<EvolutionDnaId>().references(() => evolutionDna.id).notNull(),
  agentInstanceId: uuid('agent_instance_id').$type<AgentInstanceId>().references(() => agentInstances.id).notNull(),
  evolutionTrigger: text('evolution_trigger').notNull(), // performance_threshold, manual, time_based, pattern_recognition
  geneticChanges: jsonb('genetic_changes').$type<Record<string, { from: unknown; to: unknown }>>().notNull(),
  performanceDelta: jsonb('performance_delta').$type<PerformanceMetrics>().notNull(),
  confidenceScore: real('confidence_score').notNull(), // 0.0 to 1.0
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Project evolution contexts table - tracks project-specific evolutionary adaptations
 */
export const projectEvolutionContexts = pgTable('project_evolution_contexts', {
  id: uuid('id').primaryKey().default(uuidGenerateV4),
  projectId: uuid('project_id').$type<ProjectContextId>().references(() => projects.id).notNull(),
  evolutionDnaId: uuid('evolution_dna_id').$type<EvolutionDnaId>().references(() => evolutionDna.id).notNull(),
  adaptationScore: real('adaptation_score').notNull(), // how well this DNA performs in this project context
  usageCount: integer('usage_count').default(0),
  averagePerformance: jsonb('average_performance').$type<PerformanceMetrics>().notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});