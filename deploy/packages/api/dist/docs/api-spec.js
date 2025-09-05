"use strict";
/**
 * OpenAPI 3.0 specification for Sentra Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiSpec = void 0;
exports.openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Sentra Evolution API',
        version: '1.0.0',
        description: 'Enhanced API layer for Sentra Evolutionary Agent System - EPIC 7 Implementation',
        contact: {
            name: 'Sentra Development Team',
            url: 'https://github.com/sentra/evolutionary-agents',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Development server',
        },
        {
            url: 'https://api.sentra-evolution.com',
            description: 'Production server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            // Base types
            ApiResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' },
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                            details: { type: 'object' },
                        },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                },
                required: ['success', 'timestamp'],
            },
            // Evolution types
            GeneticMarkers: {
                type: 'object',
                properties: {
                    patternRecognition: { type: 'number', minimum: 0, maximum: 1 },
                    adaptabilityScore: { type: 'number', minimum: 0, maximum: 1 },
                    communicationStyle: { type: 'string' },
                    problemSolvingApproach: { type: 'string' },
                    collaborationPreference: { type: 'string' },
                },
                required: ['patternRecognition', 'adaptabilityScore', 'communicationStyle', 'problemSolvingApproach', 'collaborationPreference'],
            },
            PerformanceMetrics: {
                type: 'object',
                properties: {
                    successRate: { type: 'number', minimum: 0, maximum: 1 },
                    averageTaskCompletionTime: { type: 'number', minimum: 0 },
                    codeQualityScore: { type: 'number', minimum: 0, maximum: 1 },
                    userSatisfactionRating: { type: 'number', minimum: 0, maximum: 1 },
                    adaptationSpeed: { type: 'number', minimum: 0, maximum: 1 },
                    errorRecoveryRate: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['successRate', 'averageTaskCompletionTime', 'codeQualityScore', 'userSatisfactionRating', 'adaptationSpeed', 'errorRecoveryRate'],
            },
            ProjectContext: {
                type: 'object',
                properties: {
                    projectType: {
                        type: 'string',
                        enum: ['web-app', 'api', 'cli', 'library', 'infrastructure'],
                    },
                    techStack: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                    complexity: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'enterprise'],
                    },
                    teamSize: { type: 'integer', minimum: 1 },
                    timeline: { type: 'string' },
                    requirements: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                required: ['projectType', 'techStack', 'complexity', 'teamSize', 'timeline', 'requirements'],
            },
            EvolutionDna: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    patternType: { type: 'string' },
                    genetics: { $ref: '#/components/schemas/GeneticMarkers' },
                    performance: { $ref: '#/components/schemas/PerformanceMetrics' },
                    projectContext: { $ref: '#/components/schemas/ProjectContext' },
                    generation: { type: 'integer', minimum: 0 },
                    parentId: { type: 'string', nullable: true },
                    embedding: {
                        type: 'array',
                        items: { type: 'number' },
                        nullable: true,
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'patternType', 'genetics', 'performance', 'projectContext', 'generation', 'createdAt', 'updatedAt'],
            },
            AgentInstance: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    evolutionDnaId: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive', 'archived'],
                    },
                    currentTaskId: { type: 'string', nullable: true },
                    spawnedAt: { type: 'string', format: 'date-time' },
                    lastActiveAt: { type: 'string', format: 'date-time' },
                    performanceHistory: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PerformanceMetrics' },
                    },
                    metadata: { type: 'object', nullable: true },
                },
                required: ['id', 'evolutionDnaId', 'name', 'role', 'status', 'spawnedAt', 'lastActiveAt', 'performanceHistory'],
            },
            // Request schemas
            EvolvePatternRequest: {
                type: 'object',
                properties: {
                    patternId: { type: 'string' },
                    context: { $ref: '#/components/schemas/ProjectContext' },
                    feedback: {
                        type: 'object',
                        properties: {
                            performanceImprovement: { type: 'number', minimum: -1, maximum: 1 },
                            specificIssues: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            successMetrics: {
                                type: 'object',
                                additionalProperties: { type: 'number' },
                            },
                            userFeedback: { type: 'string' },
                        },
                        required: ['performanceImprovement'],
                    },
                    evolutionTrigger: {
                        type: 'string',
                        enum: ['performance_threshold', 'manual', 'time_based', 'pattern_recognition'],
                    },
                },
                required: ['patternId', 'context', 'feedback'],
            },
            CreatePatternRequest: {
                type: 'object',
                properties: {
                    patternType: { type: 'string', maxLength: 50 },
                    genetics: { $ref: '#/components/schemas/GeneticMarkers' },
                    projectContext: { $ref: '#/components/schemas/ProjectContext' },
                    initialPerformance: { $ref: '#/components/schemas/PerformanceMetrics' },
                    metadata: { type: 'object' },
                },
                required: ['patternType', 'genetics', 'projectContext'],
            },
            SpawnAgentRequest: {
                type: 'object',
                properties: {
                    evolutionDnaId: { type: 'string' },
                    name: { type: 'string', maxLength: 100 },
                    role: { type: 'string', maxLength: 50 },
                    capabilities: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                    },
                    projectContextId: { type: 'string' },
                    metadata: { type: 'object' },
                },
                required: ['evolutionDnaId', 'name', 'role', 'capabilities'],
            },
        },
    },
    paths: {
        '/health': {
            get: {
                summary: 'Health check endpoint',
                description: 'Returns the current health status of the API and its dependencies',
                responses: {
                    '200': {
                        description: 'Service is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'object',
                                                    properties: {
                                                        status: { type: 'string' },
                                                        version: { type: 'string' },
                                                        uptime: { type: 'number' },
                                                        environment: { type: 'string' },
                                                        services: {
                                                            type: 'object',
                                                            properties: {
                                                                database: { type: 'string' },
                                                                vectorStore: { type: 'string' },
                                                                dnaEngine: { type: 'string' },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/evolution/patterns/evolve': {
            post: {
                summary: 'Evolve DNA pattern',
                description: 'Evolve an existing DNA pattern based on performance feedback',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/EvolvePatternRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Pattern evolved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/EvolutionDna' },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid request data',
                    },
                    '401': {
                        description: 'Unauthorized',
                    },
                    '403': {
                        description: 'Insufficient permissions',
                    },
                    '404': {
                        description: 'Pattern not found',
                    },
                    '422': {
                        description: 'Business logic error (e.g., archived pattern)',
                    },
                },
            },
        },
        '/api/evolution/patterns': {
            get: {
                summary: 'List DNA patterns',
                description: 'Retrieve a paginated list of DNA patterns with optional filtering',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    },
                    {
                        name: 'patternType',
                        in: 'query',
                        schema: { type: 'string' },
                    },
                    {
                        name: 'projectType',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['web-app', 'api', 'cli', 'library', 'infrastructure'],
                        },
                    },
                    {
                        name: 'complexity',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'enterprise'],
                        },
                    },
                    {
                        name: 'minFitness',
                        in: 'query',
                        schema: { type: 'number', minimum: 0, maximum: 1 },
                    },
                    {
                        name: 'maxFitness',
                        in: 'query',
                        schema: { type: 'number', minimum: 0, maximum: 1 },
                    },
                    {
                        name: 'sortBy',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['createdAt', 'updatedAt', 'generation', 'fitness'],
                            default: 'updatedAt',
                        },
                    },
                    {
                        name: 'sortOrder',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['asc', 'desc'],
                            default: 'desc',
                        },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Patterns retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'object',
                                                    properties: {
                                                        items: {
                                                            type: 'array',
                                                            items: { $ref: '#/components/schemas/EvolutionDna' },
                                                        },
                                                        pagination: {
                                                            type: 'object',
                                                            properties: {
                                                                page: { type: 'integer' },
                                                                limit: { type: 'integer' },
                                                                total: { type: 'integer' },
                                                                pages: { type: 'integer' },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized',
                    },
                    '403': {
                        description: 'Insufficient permissions',
                    },
                },
            },
            post: {
                summary: 'Create DNA pattern',
                description: 'Create a new DNA pattern with specified characteristics',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreatePatternRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Pattern created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/EvolutionDna' },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid request data',
                    },
                    '401': {
                        description: 'Unauthorized',
                    },
                    '403': {
                        description: 'Insufficient permissions',
                    },
                },
            },
        },
        '/api/evolution/agents/spawn': {
            post: {
                summary: 'Spawn agent instance',
                description: 'Create a new agent instance based on evolution DNA',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SpawnAgentRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Agent spawned successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/AgentInstance' },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid request data',
                    },
                    '401': {
                        description: 'Unauthorized',
                    },
                    '403': {
                        description: 'Insufficient permissions',
                    },
                    '404': {
                        description: 'DNA pattern not found',
                    },
                },
            },
        },
        '/api/metrics': {
            get: {
                summary: 'Get performance metrics',
                description: 'Retrieve system performance metrics and statistics',
                responses: {
                    '200': {
                        description: 'Metrics retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/ApiResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'object',
                                                    properties: {
                                                        performance: { type: 'object' },
                                                        websocket: { type: 'object' },
                                                        server: {
                                                            type: 'object',
                                                            properties: {
                                                                uptime: { type: 'number' },
                                                                memoryUsage: { type: 'object' },
                                                                cpuUsage: { type: 'object' },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    // WebSocket events documentation (non-standard OpenAPI)
    'x-websocket-events': {
        'pattern:evolved': {
            description: 'Emitted when a DNA pattern evolution is completed',
            payload: {
                type: 'object',
                properties: {
                    parentDnaId: { type: 'string' },
                    childDnaId: { type: 'string' },
                    generation: { type: 'integer' },
                    improvements: { type: 'object' },
                    confidenceScore: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' },
                },
            },
        },
        'agent:status': {
            description: 'Emitted when an agent status changes',
            payload: {
                type: 'object',
                properties: {
                    agentId: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
                    currentTaskId: { type: 'string' },
                    lastActiveAt: { type: 'string', format: 'date-time' },
                    performanceSnapshot: { $ref: '#/components/schemas/PerformanceMetrics' },
                },
            },
        },
        'learning:outcome': {
            description: 'Emitted when a learning outcome is recorded',
            payload: {
                type: 'object',
                properties: {
                    outcomeId: { type: 'string' },
                    agentId: { type: 'string' },
                    taskId: { type: 'string' },
                    outcomeType: { type: 'string', enum: ['success', 'failure', 'partial', 'blocked'] },
                    performanceImprovement: { type: 'number' },
                    lessonLearned: { type: 'string' },
                    applicabilityScore: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' },
                },
            },
        },
        'metrics:update': {
            description: 'Emitted when performance metrics are updated',
            payload: {
                type: 'object',
                properties: {
                    timestamp: { type: 'string', format: 'date-time' },
                    metrics: { type: 'object' },
                    timeRange: { type: 'string' },
                    previousValues: { type: 'object' },
                },
            },
        },
        'system:health': {
            description: 'Emitted when system health status changes',
            payload: {
                type: 'object',
                properties: {
                    timestamp: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: ['healthy', 'degraded', 'critical'] },
                    components: {
                        type: 'object',
                        additionalProperties: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', enum: ['up', 'down', 'degraded'] },
                                responseTime: { type: 'number' },
                                errorRate: { type: 'number' },
                            },
                        },
                    },
                    alerts: { type: 'array', items: { type: 'string' } },
                },
            },
        },
    },
};
//# sourceMappingURL=api-spec.js.map