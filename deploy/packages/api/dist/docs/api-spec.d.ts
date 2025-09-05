/**
 * OpenAPI 3.0 specification for Sentra Evolution API
 * Following SENTRA project standards: strict TypeScript with branded types
 */
export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            url: string;
        };
        license: {
            name: string;
            url: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
        };
        schemas: {
            ApiResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    data: {
                        type: string;
                    };
                    error: {
                        type: string;
                        properties: {
                            code: {
                                type: string;
                            };
                            message: {
                                type: string;
                            };
                            details: {
                                type: string;
                            };
                        };
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            GeneticMarkers: {
                type: string;
                properties: {
                    patternRecognition: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    adaptabilityScore: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    communicationStyle: {
                        type: string;
                    };
                    problemSolvingApproach: {
                        type: string;
                    };
                    collaborationPreference: {
                        type: string;
                    };
                };
                required: string[];
            };
            PerformanceMetrics: {
                type: string;
                properties: {
                    successRate: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    averageTaskCompletionTime: {
                        type: string;
                        minimum: number;
                    };
                    codeQualityScore: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    userSatisfactionRating: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    adaptationSpeed: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    errorRecoveryRate: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                };
                required: string[];
            };
            ProjectContext: {
                type: string;
                properties: {
                    projectType: {
                        type: string;
                        enum: string[];
                    };
                    techStack: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    complexity: {
                        type: string;
                        enum: string[];
                    };
                    teamSize: {
                        type: string;
                        minimum: number;
                    };
                    timeline: {
                        type: string;
                    };
                    requirements: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
                required: string[];
            };
            EvolutionDna: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    patternType: {
                        type: string;
                    };
                    genetics: {
                        $ref: string;
                    };
                    performance: {
                        $ref: string;
                    };
                    projectContext: {
                        $ref: string;
                    };
                    generation: {
                        type: string;
                        minimum: number;
                    };
                    parentId: {
                        type: string;
                        nullable: boolean;
                    };
                    embedding: {
                        type: string;
                        items: {
                            type: string;
                        };
                        nullable: boolean;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            AgentInstance: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    evolutionDnaId: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                    role: {
                        type: string;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                    currentTaskId: {
                        type: string;
                        nullable: boolean;
                    };
                    spawnedAt: {
                        type: string;
                        format: string;
                    };
                    lastActiveAt: {
                        type: string;
                        format: string;
                    };
                    performanceHistory: {
                        type: string;
                        items: {
                            $ref: string;
                        };
                    };
                    metadata: {
                        type: string;
                        nullable: boolean;
                    };
                };
                required: string[];
            };
            EvolvePatternRequest: {
                type: string;
                properties: {
                    patternId: {
                        type: string;
                    };
                    context: {
                        $ref: string;
                    };
                    feedback: {
                        type: string;
                        properties: {
                            performanceImprovement: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            specificIssues: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                            successMetrics: {
                                type: string;
                                additionalProperties: {
                                    type: string;
                                };
                            };
                            userFeedback: {
                                type: string;
                            };
                        };
                        required: string[];
                    };
                    evolutionTrigger: {
                        type: string;
                        enum: string[];
                    };
                };
                required: string[];
            };
            CreatePatternRequest: {
                type: string;
                properties: {
                    patternType: {
                        type: string;
                        maxLength: number;
                    };
                    genetics: {
                        $ref: string;
                    };
                    projectContext: {
                        $ref: string;
                    };
                    initialPerformance: {
                        $ref: string;
                    };
                    metadata: {
                        type: string;
                    };
                };
                required: string[];
            };
            SpawnAgentRequest: {
                type: string;
                properties: {
                    evolutionDnaId: {
                        type: string;
                    };
                    name: {
                        type: string;
                        maxLength: number;
                    };
                    role: {
                        type: string;
                        maxLength: number;
                    };
                    capabilities: {
                        type: string;
                        items: {
                            type: string;
                        };
                        minItems: number;
                    };
                    projectContextId: {
                        type: string;
                    };
                    metadata: {
                        type: string;
                    };
                };
                required: string[];
            };
        };
    };
    paths: {
        '/health': {
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        type?: never;
                                        properties?: never;
                                    } | {
                                        type: string;
                                        properties: {
                                            data: {
                                                type: string;
                                                properties: {
                                                    status: {
                                                        type: string;
                                                    };
                                                    version: {
                                                        type: string;
                                                    };
                                                    uptime: {
                                                        type: string;
                                                    };
                                                    environment: {
                                                        type: string;
                                                    };
                                                    services: {
                                                        type: string;
                                                        properties: {
                                                            database: {
                                                                type: string;
                                                            };
                                                            vectorStore: {
                                                                type: string;
                                                            };
                                                            dnaEngine: {
                                                                type: string;
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        $ref?: never;
                                    })[];
                                };
                            };
                        };
                    };
                };
            };
        };
        '/api/evolution/patterns/evolve': {
            post: {
                summary: string;
                description: string;
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        type?: never;
                                        properties?: never;
                                    } | {
                                        type: string;
                                        properties: {
                                            data: {
                                                $ref: string;
                                            };
                                        };
                                        $ref?: never;
                                    })[];
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                    };
                    '401': {
                        description: string;
                    };
                    '403': {
                        description: string;
                    };
                    '404': {
                        description: string;
                    };
                    '422': {
                        description: string;
                    };
                };
            };
        };
        '/api/evolution/patterns': {
            get: {
                summary: string;
                description: string;
                security: {
                    bearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: never;
                        enum?: never;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                        enum?: never;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum?: never;
                        default?: never;
                        maximum?: never;
                        enum?: never;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        minimum?: never;
                        default?: never;
                        maximum?: never;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default?: never;
                        enum?: never;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        default: string;
                        minimum?: never;
                        maximum?: never;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        type?: never;
                                        properties?: never;
                                    } | {
                                        type: string;
                                        properties: {
                                            data: {
                                                type: string;
                                                properties: {
                                                    items: {
                                                        type: string;
                                                        items: {
                                                            $ref: string;
                                                        };
                                                    };
                                                    pagination: {
                                                        type: string;
                                                        properties: {
                                                            page: {
                                                                type: string;
                                                            };
                                                            limit: {
                                                                type: string;
                                                            };
                                                            total: {
                                                                type: string;
                                                            };
                                                            pages: {
                                                                type: string;
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        $ref?: never;
                                    })[];
                                };
                            };
                        };
                    };
                    '401': {
                        description: string;
                    };
                    '403': {
                        description: string;
                    };
                };
            };
            post: {
                summary: string;
                description: string;
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        type?: never;
                                        properties?: never;
                                    } | {
                                        type: string;
                                        properties: {
                                            data: {
                                                $ref: string;
                                            };
                                        };
                                        $ref?: never;
                                    })[];
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                    };
                    '401': {
                        description: string;
                    };
                    '403': {
                        description: string;
                    };
                };
            };
        };
        '/api/evolution/agents/spawn': {
            post: {
                summary: string;
                description: string;
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        type?: never;
                                        properties?: never;
                                    } | {
                                        type: string;
                                        properties: {
                                            data: {
                                                $ref: string;
                                            };
                                        };
                                        $ref?: never;
                                    })[];
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                    };
                    '401': {
                        description: string;
                    };
                    '403': {
                        description: string;
                    };
                    '404': {
                        description: string;
                    };
                };
            };
        };
        '/api/metrics': {
            get: {
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        type?: never;
                                        properties?: never;
                                    } | {
                                        type: string;
                                        properties: {
                                            data: {
                                                type: string;
                                                properties: {
                                                    performance: {
                                                        type: string;
                                                    };
                                                    websocket: {
                                                        type: string;
                                                    };
                                                    server: {
                                                        type: string;
                                                        properties: {
                                                            uptime: {
                                                                type: string;
                                                            };
                                                            memoryUsage: {
                                                                type: string;
                                                            };
                                                            cpuUsage: {
                                                                type: string;
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        $ref?: never;
                                    })[];
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    'x-websocket-events': {
        'pattern:evolved': {
            description: string;
            payload: {
                type: string;
                properties: {
                    parentDnaId: {
                        type: string;
                    };
                    childDnaId: {
                        type: string;
                    };
                    generation: {
                        type: string;
                    };
                    improvements: {
                        type: string;
                    };
                    confidenceScore: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
        'agent:status': {
            description: string;
            payload: {
                type: string;
                properties: {
                    agentId: {
                        type: string;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                    currentTaskId: {
                        type: string;
                    };
                    lastActiveAt: {
                        type: string;
                        format: string;
                    };
                    performanceSnapshot: {
                        $ref: string;
                    };
                };
            };
        };
        'learning:outcome': {
            description: string;
            payload: {
                type: string;
                properties: {
                    outcomeId: {
                        type: string;
                    };
                    agentId: {
                        type: string;
                    };
                    taskId: {
                        type: string;
                    };
                    outcomeType: {
                        type: string;
                        enum: string[];
                    };
                    performanceImprovement: {
                        type: string;
                    };
                    lessonLearned: {
                        type: string;
                    };
                    applicabilityScore: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
        'metrics:update': {
            description: string;
            payload: {
                type: string;
                properties: {
                    timestamp: {
                        type: string;
                        format: string;
                    };
                    metrics: {
                        type: string;
                    };
                    timeRange: {
                        type: string;
                    };
                    previousValues: {
                        type: string;
                    };
                };
            };
        };
        'system:health': {
            description: string;
            payload: {
                type: string;
                properties: {
                    timestamp: {
                        type: string;
                        format: string;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                    components: {
                        type: string;
                        additionalProperties: {
                            type: string;
                            properties: {
                                status: {
                                    type: string;
                                    enum: string[];
                                };
                                responseTime: {
                                    type: string;
                                };
                                errorRate: {
                                    type: string;
                                };
                            };
                        };
                    };
                    alerts: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=api-spec.d.ts.map