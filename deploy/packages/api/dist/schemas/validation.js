"use strict";
/**
 * Comprehensive Zod validation schemas for Evolution API endpoints
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationMiddleware = exports.validateBrandedId = exports.PaginatedResponseSchema = exports.ApiSuccessSchema = exports.ApiErrorSchema = exports.WebSocketMessageSchema = exports.WebSocketUnsubscribeSchema = exports.WebSocketSubscribeSchema = exports.WebSocketAuthSchema = exports.RefreshTokenRequestSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = exports.MetricsQuerySchema = exports.EventListQuerySchema = exports.AgentListQuerySchema = exports.PatternListQuerySchema = exports.PaginationSchema = exports.RecordLearningRequestSchema = exports.SpawnAgentRequestSchema = exports.UpdatePatternRequestSchema = exports.CreatePatternRequestSchema = exports.EvolvePatternRequestSchema = exports.TaskSchema = exports.TaskPrioritySchema = exports.TaskStatusSchema = exports.ProjectContextSchema = exports.PerformanceMetricsSchema = exports.GeneticMarkersSchema = exports.EvolutionEventIdSchema = exports.LearningOutcomeIdSchema = exports.UserIdSchema = exports.TaskIdSchema = exports.ProjectContextIdSchema = exports.AgentInstanceIdSchema = exports.EvolutionDnaIdSchema = void 0;
const zod_1 = require("zod");
/**
 * Base branded type validation helpers
 */
const createBrandedId = (_brand) => zod_1.z.string().min(1).transform((val) => val);
/**
 * Branded ID schemas
 */
exports.EvolutionDnaIdSchema = createBrandedId('EvolutionDnaId');
exports.AgentInstanceIdSchema = createBrandedId('AgentInstanceId');
exports.ProjectContextIdSchema = createBrandedId('ProjectContextId');
exports.TaskIdSchema = createBrandedId('TaskId');
exports.UserIdSchema = createBrandedId('UserId');
exports.LearningOutcomeIdSchema = createBrandedId('LearningOutcomeId');
exports.EvolutionEventIdSchema = createBrandedId('EvolutionEventId');
/**
 * Core validation schemas
 */
exports.GeneticMarkersSchema = zod_1.z.object({
    complexity: zod_1.z.number().min(0).max(1),
    adaptability: zod_1.z.number().min(0).max(1),
    successRate: zod_1.z.number().min(0).max(1),
    transferability: zod_1.z.number().min(0).max(1),
    stability: zod_1.z.number().min(0).max(1),
    novelty: zod_1.z.number().min(0).max(1),
}).readonly();
exports.PerformanceMetricsSchema = zod_1.z.object({
    successRate: zod_1.z.number().min(0).max(1),
    averageTaskCompletionTime: zod_1.z.number().positive(),
    codeQualityScore: zod_1.z.number().min(0).max(1),
    userSatisfactionRating: zod_1.z.number().min(0).max(1),
    adaptationSpeed: zod_1.z.number().min(0).max(1),
    errorRecoveryRate: zod_1.z.number().min(0).max(1),
}).readonly();
exports.ProjectContextSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    projectType: zod_1.z.enum(['web-app', 'api', 'cli', 'library', 'infrastructure']),
    techStack: zod_1.z.array(zod_1.z.string()).readonly(),
    complexity: zod_1.z.enum(['low', 'medium', 'high', 'enterprise']),
    teamSize: zod_1.z.number().positive(),
    timeline: zod_1.z.string().min(1),
    requirements: zod_1.z.array(zod_1.z.string()).readonly(),
}).readonly();
exports.TaskStatusSchema = zod_1.z.enum(['pending', 'in_progress', 'completed', 'failed', 'blocked']);
exports.TaskPrioritySchema = zod_1.z.enum(['low', 'medium', 'high', 'critical']);
exports.TaskSchema = zod_1.z.object({
    id: exports.TaskIdSchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    status: exports.TaskStatusSchema,
    priority: exports.TaskPrioritySchema,
    assignedAgentId: exports.AgentInstanceIdSchema.optional(),
    projectContextId: exports.ProjectContextIdSchema,
    dependencies: zod_1.z.array(exports.TaskIdSchema).readonly(),
    estimatedDuration: zod_1.z.number().positive(),
    actualDuration: zod_1.z.number().positive().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    completedAt: zod_1.z.date().optional(),
}).readonly();
/**
 * Evolution API request schemas
 */
exports.EvolvePatternRequestSchema = zod_1.z.object({
    patternId: exports.EvolutionDnaIdSchema,
    context: exports.ProjectContextSchema,
    feedback: zod_1.z.object({
        performanceImprovement: zod_1.z.number().min(-1).max(1),
        specificIssues: zod_1.z.array(zod_1.z.string()).optional(),
        successMetrics: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
        userFeedback: zod_1.z.string().optional(),
    }),
    evolutionTrigger: zod_1.z.enum(['performance_threshold', 'manual', 'time_based', 'pattern_recognition']).optional(),
}).strict();
exports.CreatePatternRequestSchema = zod_1.z.object({
    patternType: zod_1.z.string().min(1).max(50),
    genetics: exports.GeneticMarkersSchema,
    projectContext: exports.ProjectContextSchema,
    initialPerformance: exports.PerformanceMetricsSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
}).strict();
exports.UpdatePatternRequestSchema = zod_1.z.object({
    genetics: exports.GeneticMarkersSchema.optional(),
    performance: exports.PerformanceMetricsSchema.optional(),
    projectContext: exports.ProjectContextSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
}).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });
exports.SpawnAgentRequestSchema = zod_1.z.object({
    evolutionDnaId: exports.EvolutionDnaIdSchema,
    name: zod_1.z.string().min(1).max(100),
    role: zod_1.z.string().min(1).max(50),
    capabilities: zod_1.z.array(zod_1.z.string()).min(1),
    projectContextId: exports.ProjectContextIdSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
}).strict();
exports.RecordLearningRequestSchema = zod_1.z.object({
    agentId: exports.AgentInstanceIdSchema,
    taskId: exports.TaskIdSchema,
    outcomeType: zod_1.z.enum(['success', 'failure', 'partial', 'blocked']),
    performanceImprovement: zod_1.z.number().min(-1).max(1),
    lessonLearned: zod_1.z.string().min(1).max(1000),
    contextFactors: zod_1.z.array(zod_1.z.string()),
    applicabilityScore: zod_1.z.number().min(0).max(1),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
}).strict();
/**
 * Query parameter schemas
 */
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.PatternListQuerySchema = exports.PaginationSchema.extend({
    patternType: zod_1.z.string().optional(),
    projectType: zod_1.z.enum(['web-app', 'api', 'cli', 'library', 'infrastructure']).optional(),
    complexity: zod_1.z.enum(['low', 'medium', 'high', 'enterprise']).optional(),
    minFitness: zod_1.z.coerce.number().min(0).max(1).optional(),
    maxFitness: zod_1.z.coerce.number().min(0).max(1).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'generation', 'fitness']).default('updatedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.AgentListQuerySchema = exports.PaginationSchema.extend({
    status: zod_1.z.enum(['active', 'inactive', 'archived']).optional(),
    role: zod_1.z.string().optional(),
    evolutionDnaId: exports.EvolutionDnaIdSchema.optional(),
    sortBy: zod_1.z.enum(['spawnedAt', 'lastActiveAt', 'name']).default('lastActiveAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.EventListQuerySchema = exports.PaginationSchema.extend({
    agentId: exports.AgentInstanceIdSchema.optional(),
    evolutionTrigger: zod_1.z.enum(['performance_threshold', 'manual', 'time_based', 'pattern_recognition']).optional(),
    fromDate: zod_1.z.coerce.date().optional(),
    toDate: zod_1.z.coerce.date().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'confidenceScore']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.MetricsQuerySchema = zod_1.z.object({
    timeRange: zod_1.z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    granularity: zod_1.z.enum(['minute', 'hour', 'day']).default('hour'),
    metricTypes: zod_1.z.array(zod_1.z.enum(['evolution_rate', 'success_rate', 'performance_improvement', 'agent_activity'])).optional(),
});
/**
 * Authentication schemas
 */
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    rememberMe: zod_1.z.boolean().default(false),
}).strict();
exports.RegisterRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    organization: zod_1.z.string().max(100).optional(),
}).strict();
exports.RefreshTokenRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
}).strict();
/**
 * WebSocket message schemas
 */
exports.WebSocketAuthSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    type: zod_1.z.literal('auth'),
});
exports.WebSocketSubscribeSchema = zod_1.z.object({
    type: zod_1.z.literal('subscribe'),
    channels: zod_1.z.array(zod_1.z.enum([
        'pattern:evolved',
        'agent:status',
        'learning:outcome',
        'metrics:update',
        'system:health'
    ])),
    filters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.WebSocketUnsubscribeSchema = zod_1.z.object({
    type: zod_1.z.literal('unsubscribe'),
    channels: zod_1.z.array(zod_1.z.string()),
});
exports.WebSocketMessageSchema = zod_1.z.discriminatedUnion('type', [
    exports.WebSocketAuthSchema,
    exports.WebSocketSubscribeSchema,
    exports.WebSocketUnsubscribeSchema,
]);
/**
 * Response schemas for OpenAPI documentation
 */
exports.ApiErrorSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.unknown().optional(),
    }),
    timestamp: zod_1.z.date(),
}).readonly();
const ApiSuccessSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.literal(true),
    data: dataSchema,
    timestamp: zod_1.z.date(),
}).readonly();
exports.ApiSuccessSchema = ApiSuccessSchema;
const PaginatedResponseSchema = (itemSchema) => zod_1.z.object({
    success: zod_1.z.literal(true),
    data: zod_1.z.object({
        items: zod_1.z.array(itemSchema),
        pagination: zod_1.z.object({
            page: zod_1.z.number().positive(),
            limit: zod_1.z.number().positive(),
            total: zod_1.z.number().nonnegative(),
            pages: zod_1.z.number().positive(),
        }),
    }),
    timestamp: zod_1.z.date(),
}).readonly();
exports.PaginatedResponseSchema = PaginatedResponseSchema;
/**
 * Utility functions for validation
 */
const validateBrandedId = (value, _brand) => {
    return typeof value === 'string' && value.length > 0;
};
exports.validateBrandedId = validateBrandedId;
const createValidationMiddleware = (schema) => {
    return (data) => {
        return schema.parse(data);
    };
};
exports.createValidationMiddleware = createValidationMiddleware;
//# sourceMappingURL=validation.js.map