/**
 * Comprehensive Zod validation schemas for Evolution API endpoints
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { z } from 'zod';

/**
 * Base branded type validation helpers
 */
const createBrandedId = <T extends string>(_brand: T) => 
  z.string().min(1).transform((val) => val as string & { readonly __brand: T });

/**
 * Branded ID schemas
 */
export const EvolutionDnaIdSchema = createBrandedId('EvolutionDnaId');
export const AgentInstanceIdSchema = createBrandedId('AgentInstanceId');
export const ProjectContextIdSchema = createBrandedId('ProjectContextId');
export const TaskIdSchema = createBrandedId('TaskId');
export const UserIdSchema = createBrandedId('UserId');
export const LearningOutcomeIdSchema = createBrandedId('LearningOutcomeId');
export const EvolutionEventIdSchema = createBrandedId('EvolutionEventId');

/**
 * Core validation schemas
 */
export const GeneticMarkersSchema = z.object({
  complexity: z.number().min(0).max(1),
  adaptability: z.number().min(0).max(1),
  successRate: z.number().min(0).max(1),
  transferability: z.number().min(0).max(1),
  stability: z.number().min(0).max(1),
  novelty: z.number().min(0).max(1),
}).readonly();

export const PerformanceMetricsSchema = z.object({
  successRate: z.number().min(0).max(1),
  averageTaskCompletionTime: z.number().positive(),
  codeQualityScore: z.number().min(0).max(1),
  userSatisfactionRating: z.number().min(0).max(1),
  adaptationSpeed: z.number().min(0).max(1),
  errorRecoveryRate: z.number().min(0).max(1),
}).readonly();

export const ProjectContextSchema = z.object({
  id: z.string().optional(),
  projectType: z.enum(['web-app', 'api', 'cli', 'library', 'infrastructure']),
  techStack: z.array(z.string()).readonly(),
  complexity: z.enum(['low', 'medium', 'high', 'enterprise']),
  teamSize: z.number().positive(),
  timeline: z.string().min(1),
  requirements: z.array(z.string()).readonly(),
}).readonly();

export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'blocked']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const TaskSchema = z.object({
  id: TaskIdSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  assignedAgentId: AgentInstanceIdSchema.optional(),
  projectContextId: ProjectContextIdSchema,
  dependencies: z.array(TaskIdSchema).readonly(),
  estimatedDuration: z.number().positive(),
  actualDuration: z.number().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
}).readonly();

/**
 * Evolution API request schemas
 */
export const EvolvePatternRequestSchema = z.object({
  patternId: EvolutionDnaIdSchema,
  context: ProjectContextSchema,
  feedback: z.object({
    performanceImprovement: z.number().min(-1).max(1),
    specificIssues: z.array(z.string()).optional(),
    successMetrics: z.record(z.string(), z.number()).optional(),
    userFeedback: z.string().optional(),
  }),
  evolutionTrigger: z.enum(['performance_threshold', 'manual', 'time_based', 'pattern_recognition']).optional(),
}).strict();

export const CreatePatternRequestSchema = z.object({
  patternType: z.string().min(1).max(50),
  genetics: GeneticMarkersSchema,
  projectContext: ProjectContextSchema,
  initialPerformance: PerformanceMetricsSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const UpdatePatternRequestSchema = z.object({
  genetics: GeneticMarkersSchema.optional(),
  performance: PerformanceMetricsSchema.optional(),
  projectContext: ProjectContextSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export const SpawnAgentRequestSchema = z.object({
  evolutionDnaId: EvolutionDnaIdSchema,
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(50),
  capabilities: z.array(z.string()).min(1),
  projectContextId: ProjectContextIdSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const RecordLearningRequestSchema = z.object({
  agentId: AgentInstanceIdSchema,
  taskId: TaskIdSchema,
  outcomeType: z.enum(['success', 'failure', 'partial', 'blocked']),
  performanceImprovement: z.number().min(-1).max(1),
  lessonLearned: z.string().min(1).max(1000),
  contextFactors: z.array(z.string()),
  applicabilityScore: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();

/**
 * Query parameter schemas
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const PatternListQuerySchema = PaginationSchema.extend({
  patternType: z.string().optional(),
  projectType: z.enum(['web-app', 'api', 'cli', 'library', 'infrastructure']).optional(),
  complexity: z.enum(['low', 'medium', 'high', 'enterprise']).optional(),
  minFitness: z.coerce.number().min(0).max(1).optional(),
  maxFitness: z.coerce.number().min(0).max(1).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'generation', 'fitness']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const AgentListQuerySchema = PaginationSchema.extend({
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  role: z.string().optional(),
  evolutionDnaId: EvolutionDnaIdSchema.optional(),
  sortBy: z.enum(['spawnedAt', 'lastActiveAt', 'name']).default('lastActiveAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const EventListQuerySchema = PaginationSchema.extend({
  agentId: AgentInstanceIdSchema.optional(),
  evolutionTrigger: z.enum(['performance_threshold', 'manual', 'time_based', 'pattern_recognition']).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'confidenceScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const MetricsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  granularity: z.enum(['minute', 'hour', 'day']).default('hour'),
  metricTypes: z.array(
    z.enum(['evolution_rate', 'success_rate', 'performance_improvement', 'agent_activity'])
  ).optional(),
});

/**
 * Authentication schemas
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().default(false),
}).strict();

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  organization: z.string().max(100).optional(),
}).strict();

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
}).strict();

/**
 * WebSocket message schemas
 */
export const WebSocketAuthSchema = z.object({
  token: z.string().min(1),
  type: z.literal('auth'),
});

export const WebSocketSubscribeSchema = z.object({
  type: z.literal('subscribe'),
  channels: z.array(z.enum([
    'pattern:evolved',
    'agent:status', 
    'learning:outcome',
    'metrics:update',
    'system:health'
  ])),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export const WebSocketUnsubscribeSchema = z.object({
  type: z.literal('unsubscribe'),
  channels: z.array(z.string()),
});

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  WebSocketAuthSchema,
  WebSocketSubscribeSchema,
  WebSocketUnsubscribeSchema,
]);

/**
 * Response schemas for OpenAPI documentation
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  timestamp: z.date(),
}).readonly();

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.date(),
  }).readonly();

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number().positive(),
        limit: z.number().positive(),
        total: z.number().nonnegative(),
        pages: z.number().positive(),
      }),
    }),
    timestamp: z.date(),
  }).readonly();

/**
 * Utility functions for validation
 */
export const validateBrandedId = <T extends string>(
  value: unknown,
  _brand: T
): value is string & { readonly __brand: T } => {
  return typeof value === 'string' && value.length > 0;
};

export const createValidationMiddleware = <T>(schema: z.ZodType<T>) => {
  return (data: unknown): T => {
    return schema.parse(data);
  };
};

/**
 * Type exports for use in API handlers
 */
export type EvolvePatternRequest = z.infer<typeof EvolvePatternRequestSchema>;
export type CreatePatternRequest = z.infer<typeof CreatePatternRequestSchema>;
export type UpdatePatternRequest = z.infer<typeof UpdatePatternRequestSchema>;
export type SpawnAgentRequest = z.infer<typeof SpawnAgentRequestSchema>;
export type RecordLearningRequest = z.infer<typeof RecordLearningRequestSchema>;
export type PatternListQuery = z.infer<typeof PatternListQuerySchema>;
export type AgentListQuery = z.infer<typeof AgentListQuerySchema>;
export type EventListQuery = z.infer<typeof EventListQuerySchema>;
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;