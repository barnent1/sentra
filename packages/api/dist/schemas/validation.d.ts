/**
 * Comprehensive Zod validation schemas for Evolution API endpoints
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { z } from 'zod';
/**
 * Branded ID schemas
 */
export declare const EvolutionDnaIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "EvolutionDnaId";
}, string>;
export declare const AgentInstanceIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "AgentInstanceId";
}, string>;
export declare const ProjectContextIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "ProjectContextId";
}, string>;
export declare const TaskIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "TaskId";
}, string>;
export declare const UserIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "UserId";
}, string>;
export declare const LearningOutcomeIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "LearningOutcomeId";
}, string>;
export declare const EvolutionEventIdSchema: z.ZodEffects<z.ZodString, string & {
    readonly __brand: "EvolutionEventId";
}, string>;
/**
 * Core validation schemas
 */
export declare const GeneticMarkersSchema: z.ZodReadonly<z.ZodObject<{
    complexity: z.ZodNumber;
    adaptability: z.ZodNumber;
    successRate: z.ZodNumber;
    transferability: z.ZodNumber;
    stability: z.ZodNumber;
    novelty: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    complexity: number;
    adaptability: number;
    successRate: number;
    transferability: number;
    stability: number;
    novelty: number;
}, {
    complexity: number;
    adaptability: number;
    successRate: number;
    transferability: number;
    stability: number;
    novelty: number;
}>>;
export declare const PerformanceMetricsSchema: z.ZodReadonly<z.ZodObject<{
    successRate: z.ZodNumber;
    averageTaskCompletionTime: z.ZodNumber;
    codeQualityScore: z.ZodNumber;
    userSatisfactionRating: z.ZodNumber;
    adaptationSpeed: z.ZodNumber;
    errorRecoveryRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    successRate: number;
    averageTaskCompletionTime: number;
    codeQualityScore: number;
    userSatisfactionRating: number;
    adaptationSpeed: number;
    errorRecoveryRate: number;
}, {
    successRate: number;
    averageTaskCompletionTime: number;
    codeQualityScore: number;
    userSatisfactionRating: number;
    adaptationSpeed: number;
    errorRecoveryRate: number;
}>>;
export declare const ProjectContextSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    projectType: z.ZodEnum<["web-app", "api", "cli", "library", "infrastructure"]>;
    techStack: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
    complexity: z.ZodEnum<["low", "medium", "high", "enterprise"]>;
    teamSize: z.ZodNumber;
    timeline: z.ZodString;
    requirements: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    complexity: "high" | "low" | "medium" | "enterprise";
    projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
    techStack: readonly string[];
    teamSize: number;
    timeline: string;
    requirements: readonly string[];
    id?: string | undefined;
}, {
    complexity: "high" | "low" | "medium" | "enterprise";
    projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
    techStack: readonly string[];
    teamSize: number;
    timeline: string;
    requirements: readonly string[];
    id?: string | undefined;
}>>;
export declare const TaskStatusSchema: z.ZodEnum<["pending", "in_progress", "completed", "failed", "blocked"]>;
export declare const TaskPrioritySchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
export declare const TaskSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string & {
        readonly __brand: "TaskId";
    }, string>;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["pending", "in_progress", "completed", "failed", "blocked"]>;
    priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
    assignedAgentId: z.ZodOptional<z.ZodEffects<z.ZodString, string & {
        readonly __brand: "AgentInstanceId";
    }, string>>;
    projectContextId: z.ZodEffects<z.ZodString, string & {
        readonly __brand: "ProjectContextId";
    }, string>;
    dependencies: z.ZodReadonly<z.ZodArray<z.ZodEffects<z.ZodString, string & {
        readonly __brand: "TaskId";
    }, string>, "many">>;
    estimatedDuration: z.ZodNumber;
    actualDuration: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
    id: string & {
        readonly __brand: "TaskId";
    };
    title: string;
    description: string;
    priority: "high" | "low" | "medium" | "critical";
    projectContextId: string & {
        readonly __brand: "ProjectContextId";
    };
    dependencies: readonly (string & {
        readonly __brand: "TaskId";
    })[];
    estimatedDuration: number;
    createdAt: Date;
    updatedAt: Date;
    assignedAgentId?: (string & {
        readonly __brand: "AgentInstanceId";
    }) | undefined;
    actualDuration?: number | undefined;
    completedAt?: Date | undefined;
}, {
    status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
    id: string;
    title: string;
    description: string;
    priority: "high" | "low" | "medium" | "critical";
    projectContextId: string;
    dependencies: readonly string[];
    estimatedDuration: number;
    createdAt: Date;
    updatedAt: Date;
    assignedAgentId?: string | undefined;
    actualDuration?: number | undefined;
    completedAt?: Date | undefined;
}>>;
/**
 * Evolution API request schemas
 */
export declare const EvolvePatternRequestSchema: z.ZodObject<{
    patternId: z.ZodEffects<z.ZodString, string & {
        readonly __brand: "EvolutionDnaId";
    }, string>;
    context: z.ZodReadonly<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        projectType: z.ZodEnum<["web-app", "api", "cli", "library", "infrastructure"]>;
        techStack: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
        complexity: z.ZodEnum<["low", "medium", "high", "enterprise"]>;
        teamSize: z.ZodNumber;
        timeline: z.ZodString;
        requirements: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }, {
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>>;
    feedback: z.ZodObject<{
        performanceImprovement: z.ZodNumber;
        specificIssues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        successMetrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        userFeedback: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        performanceImprovement: number;
        specificIssues?: string[] | undefined;
        successMetrics?: Record<string, number> | undefined;
        userFeedback?: string | undefined;
    }, {
        performanceImprovement: number;
        specificIssues?: string[] | undefined;
        successMetrics?: Record<string, number> | undefined;
        userFeedback?: string | undefined;
    }>;
    evolutionTrigger: z.ZodOptional<z.ZodEnum<["performance_threshold", "manual", "time_based", "pattern_recognition"]>>;
}, "strict", z.ZodTypeAny, {
    patternId: string & {
        readonly __brand: "EvolutionDnaId";
    };
    context: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>;
    feedback: {
        performanceImprovement: number;
        specificIssues?: string[] | undefined;
        successMetrics?: Record<string, number> | undefined;
        userFeedback?: string | undefined;
    };
    evolutionTrigger?: "performance_threshold" | "manual" | "time_based" | "pattern_recognition" | undefined;
}, {
    patternId: string;
    context: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>;
    feedback: {
        performanceImprovement: number;
        specificIssues?: string[] | undefined;
        successMetrics?: Record<string, number> | undefined;
        userFeedback?: string | undefined;
    };
    evolutionTrigger?: "performance_threshold" | "manual" | "time_based" | "pattern_recognition" | undefined;
}>;
export declare const CreatePatternRequestSchema: z.ZodObject<{
    patternType: z.ZodString;
    genetics: z.ZodReadonly<z.ZodObject<{
        complexity: z.ZodNumber;
        adaptability: z.ZodNumber;
        successRate: z.ZodNumber;
        transferability: z.ZodNumber;
        stability: z.ZodNumber;
        novelty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }, {
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }>>;
    projectContext: z.ZodReadonly<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        projectType: z.ZodEnum<["web-app", "api", "cli", "library", "infrastructure"]>;
        techStack: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
        complexity: z.ZodEnum<["low", "medium", "high", "enterprise"]>;
        teamSize: z.ZodNumber;
        timeline: z.ZodString;
        requirements: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }, {
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>>;
    initialPerformance: z.ZodOptional<z.ZodReadonly<z.ZodObject<{
        successRate: z.ZodNumber;
        averageTaskCompletionTime: z.ZodNumber;
        codeQualityScore: z.ZodNumber;
        userSatisfactionRating: z.ZodNumber;
        adaptationSpeed: z.ZodNumber;
        errorRecoveryRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }, {
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }>>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    patternType: string;
    genetics: Readonly<{
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }>;
    projectContext: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>;
    initialPerformance?: Readonly<{
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }> | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    patternType: string;
    genetics: Readonly<{
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }>;
    projectContext: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>;
    initialPerformance?: Readonly<{
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }> | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const UpdatePatternRequestSchema: z.ZodEffects<z.ZodObject<{
    genetics: z.ZodOptional<z.ZodReadonly<z.ZodObject<{
        complexity: z.ZodNumber;
        adaptability: z.ZodNumber;
        successRate: z.ZodNumber;
        transferability: z.ZodNumber;
        stability: z.ZodNumber;
        novelty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }, {
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }>>>;
    performance: z.ZodOptional<z.ZodReadonly<z.ZodObject<{
        successRate: z.ZodNumber;
        averageTaskCompletionTime: z.ZodNumber;
        codeQualityScore: z.ZodNumber;
        userSatisfactionRating: z.ZodNumber;
        adaptationSpeed: z.ZodNumber;
        errorRecoveryRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }, {
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }>>>;
    projectContext: z.ZodOptional<z.ZodReadonly<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        projectType: z.ZodEnum<["web-app", "api", "cli", "library", "infrastructure"]>;
        techStack: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
        complexity: z.ZodEnum<["low", "medium", "high", "enterprise"]>;
        teamSize: z.ZodNumber;
        timeline: z.ZodString;
        requirements: z.ZodReadonly<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }, {
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }>>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    genetics?: Readonly<{
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }> | undefined;
    projectContext?: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }> | undefined;
    metadata?: Record<string, unknown> | undefined;
    performance?: Readonly<{
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }> | undefined;
}, {
    genetics?: Readonly<{
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }> | undefined;
    projectContext?: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }> | undefined;
    metadata?: Record<string, unknown> | undefined;
    performance?: Readonly<{
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }> | undefined;
}>, {
    genetics?: Readonly<{
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }> | undefined;
    projectContext?: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }> | undefined;
    metadata?: Record<string, unknown> | undefined;
    performance?: Readonly<{
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }> | undefined;
}, {
    genetics?: Readonly<{
        complexity: number;
        adaptability: number;
        successRate: number;
        transferability: number;
        stability: number;
        novelty: number;
    }> | undefined;
    projectContext?: Readonly<{
        complexity: "high" | "low" | "medium" | "enterprise";
        projectType: "web-app" | "api" | "cli" | "library" | "infrastructure";
        techStack: readonly string[];
        teamSize: number;
        timeline: string;
        requirements: readonly string[];
        id?: string | undefined;
    }> | undefined;
    metadata?: Record<string, unknown> | undefined;
    performance?: Readonly<{
        successRate: number;
        averageTaskCompletionTime: number;
        codeQualityScore: number;
        userSatisfactionRating: number;
        adaptationSpeed: number;
        errorRecoveryRate: number;
    }> | undefined;
}>;
export declare const SpawnAgentRequestSchema: z.ZodObject<{
    evolutionDnaId: z.ZodEffects<z.ZodString, string & {
        readonly __brand: "EvolutionDnaId";
    }, string>;
    name: z.ZodString;
    role: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    projectContextId: z.ZodOptional<z.ZodEffects<z.ZodString, string & {
        readonly __brand: "ProjectContextId";
    }, string>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    role: string;
    evolutionDnaId: string & {
        readonly __brand: "EvolutionDnaId";
    };
    name: string;
    capabilities: string[];
    projectContextId?: (string & {
        readonly __brand: "ProjectContextId";
    }) | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    role: string;
    evolutionDnaId: string;
    name: string;
    capabilities: string[];
    projectContextId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const RecordLearningRequestSchema: z.ZodObject<{
    agentId: z.ZodEffects<z.ZodString, string & {
        readonly __brand: "AgentInstanceId";
    }, string>;
    taskId: z.ZodEffects<z.ZodString, string & {
        readonly __brand: "TaskId";
    }, string>;
    outcomeType: z.ZodEnum<["success", "failure", "partial", "blocked"]>;
    performanceImprovement: z.ZodNumber;
    lessonLearned: z.ZodString;
    contextFactors: z.ZodArray<z.ZodString, "many">;
    applicabilityScore: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    performanceImprovement: number;
    agentId: string & {
        readonly __brand: "AgentInstanceId";
    };
    taskId: string & {
        readonly __brand: "TaskId";
    };
    outcomeType: "success" | "blocked" | "failure" | "partial";
    lessonLearned: string;
    contextFactors: string[];
    applicabilityScore: number;
    metadata?: Record<string, unknown> | undefined;
}, {
    performanceImprovement: number;
    agentId: string;
    taskId: string;
    outcomeType: "success" | "blocked" | "failure" | "partial";
    lessonLearned: string;
    contextFactors: string[];
    applicabilityScore: number;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Query parameter schemas
 */
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const PatternListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    patternType: z.ZodOptional<z.ZodString>;
    projectType: z.ZodOptional<z.ZodEnum<["web-app", "api", "cli", "library", "infrastructure"]>>;
    complexity: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "enterprise"]>>;
    minFitness: z.ZodOptional<z.ZodNumber>;
    maxFitness: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "updatedAt", "generation", "fitness"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "updatedAt" | "generation" | "fitness";
    sortOrder: "asc" | "desc";
    complexity?: "high" | "low" | "medium" | "enterprise" | undefined;
    projectType?: "web-app" | "api" | "cli" | "library" | "infrastructure" | undefined;
    patternType?: string | undefined;
    minFitness?: number | undefined;
    maxFitness?: number | undefined;
}, {
    complexity?: "high" | "low" | "medium" | "enterprise" | undefined;
    projectType?: "web-app" | "api" | "cli" | "library" | "infrastructure" | undefined;
    patternType?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    minFitness?: number | undefined;
    maxFitness?: number | undefined;
    sortBy?: "createdAt" | "updatedAt" | "generation" | "fitness" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const AgentListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "archived"]>>;
    role: z.ZodOptional<z.ZodString>;
    evolutionDnaId: z.ZodOptional<z.ZodEffects<z.ZodString, string & {
        readonly __brand: "EvolutionDnaId";
    }, string>>;
    sortBy: z.ZodDefault<z.ZodEnum<["spawnedAt", "lastActiveAt", "name"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "name" | "spawnedAt" | "lastActiveAt";
    sortOrder: "asc" | "desc";
    role?: string | undefined;
    status?: "active" | "inactive" | "archived" | undefined;
    evolutionDnaId?: (string & {
        readonly __brand: "EvolutionDnaId";
    }) | undefined;
}, {
    role?: string | undefined;
    status?: "active" | "inactive" | "archived" | undefined;
    evolutionDnaId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "name" | "spawnedAt" | "lastActiveAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const EventListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    agentId: z.ZodOptional<z.ZodEffects<z.ZodString, string & {
        readonly __brand: "AgentInstanceId";
    }, string>>;
    evolutionTrigger: z.ZodOptional<z.ZodEnum<["performance_threshold", "manual", "time_based", "pattern_recognition"]>>;
    fromDate: z.ZodOptional<z.ZodDate>;
    toDate: z.ZodOptional<z.ZodDate>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "confidenceScore"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "confidenceScore";
    sortOrder: "asc" | "desc";
    evolutionTrigger?: "performance_threshold" | "manual" | "time_based" | "pattern_recognition" | undefined;
    agentId?: (string & {
        readonly __brand: "AgentInstanceId";
    }) | undefined;
    fromDate?: Date | undefined;
    toDate?: Date | undefined;
}, {
    evolutionTrigger?: "performance_threshold" | "manual" | "time_based" | "pattern_recognition" | undefined;
    agentId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "confidenceScore" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    fromDate?: Date | undefined;
    toDate?: Date | undefined;
}>;
export declare const MetricsQuerySchema: z.ZodObject<{
    timeRange: z.ZodDefault<z.ZodEnum<["1h", "24h", "7d", "30d"]>>;
    granularity: z.ZodDefault<z.ZodEnum<["minute", "hour", "day"]>>;
    metricTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["evolution_rate", "success_rate", "performance_improvement", "agent_activity"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    timeRange: "1h" | "24h" | "7d" | "30d";
    granularity: "day" | "hour" | "minute";
    metricTypes?: ("evolution_rate" | "success_rate" | "performance_improvement" | "agent_activity")[] | undefined;
}, {
    timeRange?: "1h" | "24h" | "7d" | "30d" | undefined;
    granularity?: "day" | "hour" | "minute" | undefined;
    metricTypes?: ("evolution_rate" | "success_rate" | "performance_improvement" | "agent_activity")[] | undefined;
}>;
/**
 * Authentication schemas
 */
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe: boolean;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    organization: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organization?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organization?: string | undefined;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strict", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
/**
 * WebSocket message schemas
 */
export declare const WebSocketAuthSchema: z.ZodObject<{
    token: z.ZodString;
    type: z.ZodLiteral<"auth">;
}, "strip", z.ZodTypeAny, {
    type: "auth";
    token: string;
}, {
    type: "auth";
    token: string;
}>;
export declare const WebSocketSubscribeSchema: z.ZodObject<{
    type: z.ZodLiteral<"subscribe">;
    channels: z.ZodArray<z.ZodEnum<["pattern:evolved", "agent:status", "learning:outcome", "metrics:update", "system:health"]>, "many">;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "subscribe";
    channels: ("system:health" | "pattern:evolved" | "agent:status" | "learning:outcome" | "metrics:update")[];
    filters?: Record<string, unknown> | undefined;
}, {
    type: "subscribe";
    channels: ("system:health" | "pattern:evolved" | "agent:status" | "learning:outcome" | "metrics:update")[];
    filters?: Record<string, unknown> | undefined;
}>;
export declare const WebSocketUnsubscribeSchema: z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe">;
    channels: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "unsubscribe";
    channels: string[];
}, {
    type: "unsubscribe";
    channels: string[];
}>;
export declare const WebSocketMessageSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    token: z.ZodString;
    type: z.ZodLiteral<"auth">;
}, "strip", z.ZodTypeAny, {
    type: "auth";
    token: string;
}, {
    type: "auth";
    token: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"subscribe">;
    channels: z.ZodArray<z.ZodEnum<["pattern:evolved", "agent:status", "learning:outcome", "metrics:update", "system:health"]>, "many">;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "subscribe";
    channels: ("system:health" | "pattern:evolved" | "agent:status" | "learning:outcome" | "metrics:update")[];
    filters?: Record<string, unknown> | undefined;
}, {
    type: "subscribe";
    channels: ("system:health" | "pattern:evolved" | "agent:status" | "learning:outcome" | "metrics:update")[];
    filters?: Record<string, unknown> | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe">;
    channels: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "unsubscribe";
    channels: string[];
}, {
    type: "unsubscribe";
    channels: string[];
}>]>;
/**
 * Response schemas for OpenAPI documentation
 */
export declare const ApiErrorSchema: z.ZodReadonly<z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        details?: unknown;
    }, {
        message: string;
        code: string;
        details?: unknown;
    }>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        code: string;
        details?: unknown;
    };
    timestamp: Date;
    success: false;
}, {
    error: {
        message: string;
        code: string;
        details?: unknown;
    };
    timestamp: Date;
    success: false;
}>>;
export declare const ApiSuccessSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodReadonly<z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
    timestamp: z.ZodDate;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
    timestamp: z.ZodDate;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>>;
export declare const PaginatedResponseSchema: <T extends z.ZodType>(itemSchema: T) => z.ZodReadonly<z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        items: z.ZodArray<T, "many">;
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            pages: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            total: number;
            pages: number;
        }, {
            page: number;
            limit: number;
            total: number;
            pages: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        items: T["_output"][];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }, {
        items: T["_input"][];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    timestamp: Date;
    success: true;
    data: {
        items: T["_output"][];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}, {
    timestamp: Date;
    success: true;
    data: {
        items: T["_input"][];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}>>;
/**
 * Utility functions for validation
 */
export declare const validateBrandedId: <T extends string>(value: unknown, _brand: T) => value is string & {
    readonly __brand: T;
};
export declare const createValidationMiddleware: <T>(schema: z.ZodType<T>) => (data: unknown) => T;
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
//# sourceMappingURL=validation.d.ts.map