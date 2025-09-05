/**
 * Database operation utilities for Sentra Evolutionary Agent System
 * Provides high-level operations for evolutionary features
 */
import type { EvolutionDnaId, AgentInstanceId, ProjectContextId, GeneticMarkers, PerformanceMetrics, ProjectContext } from '@sentra/types';
/**
 * Create new evolution DNA
 */
export declare const createEvolutionDna: (dnaData: {
    patternType: string;
    genetics: GeneticMarkers;
    performance: PerformanceMetrics;
    projectContext: ProjectContext;
    generation?: number;
    parentId?: EvolutionDnaId;
    embedding?: number[];
}) => Promise<{
    id: string & {
        readonly __brand: "EvolutionDnaId";
    };
    createdAt: Date | null;
    updatedAt: Date | null;
    embedding: number[] | null;
    patternType: string;
    genetics: GeneticMarkers;
    performance: PerformanceMetrics;
    projectContext: ProjectContext;
    generation: number | null;
    parentId: (string & {
        readonly __brand: "EvolutionDnaId";
    }) | null;
} | undefined>;
/**
 * Spawn new agent instance with DNA
 */
export declare const spawnAgentInstance: (instanceData: {
    evolutionDnaId: EvolutionDnaId;
    name: string;
    role: string;
    status?: "active" | "inactive" | "archived";
    metadata?: Record<string, unknown>;
}) => Promise<{
    id: string & {
        readonly __brand: "AgentInstanceId";
    };
    name: string;
    role: string;
    status: string;
    metadata: Record<string, unknown> | null;
    evolutionDnaId: string & {
        readonly __brand: "EvolutionDnaId";
    };
    currentTaskId: (string & {
        readonly __brand: "TaskId";
    }) | null;
    spawnedAt: Date | null;
    lastActiveAt: Date | null;
    performanceHistory: readonly PerformanceMetrics[] | null;
} | undefined>;
/**
 * Record learning outcome from task execution
 */
export declare const recordLearningOutcome: (outcomeData: {
    agentInstanceId: AgentInstanceId;
    evolutionDnaId: EvolutionDnaId;
    taskId: string;
    outcomeType: "success" | "failure" | "partial" | "blocked";
    performanceImprovement: number;
    lessonLearned: string;
    contextFactors: readonly string[];
    applicabilityScore: number;
    embedding?: number[];
}) => Promise<{
    id: string & {
        readonly __brand: "LearningOutcomeId";
    };
    createdAt: Date | null;
    taskId: string & {
        readonly __brand: "TaskId";
    };
    embedding: number[] | null;
    evolutionDnaId: string & {
        readonly __brand: "EvolutionDnaId";
    };
    agentInstanceId: string & {
        readonly __brand: "AgentInstanceId";
    };
    outcomeType: string;
    performanceImprovement: number;
    lessonLearned: string;
    contextFactors: readonly string[];
    applicabilityScore: number;
} | undefined>;
/**
 * Get agent instance with its DNA and recent learning outcomes
 */
export declare const getAgentInstanceWithContext: (agentId: AgentInstanceId) => Promise<{
    recentOutcomes: {
        id: string & {
            readonly __brand: "LearningOutcomeId";
        };
        createdAt: Date | null;
        taskId: string & {
            readonly __brand: "TaskId";
        };
        embedding: number[] | null;
        evolutionDnaId: string & {
            readonly __brand: "EvolutionDnaId";
        };
        agentInstanceId: string & {
            readonly __brand: "AgentInstanceId";
        };
        outcomeType: string;
        performanceImprovement: number;
        lessonLearned: string;
        contextFactors: readonly string[];
        applicabilityScore: number;
    }[];
    agent?: {
        id: string & {
            readonly __brand: "AgentInstanceId";
        };
        name: string;
        role: string;
        status: string;
        metadata: Record<string, unknown> | null;
        evolutionDnaId: string & {
            readonly __brand: "EvolutionDnaId";
        };
        currentTaskId: (string & {
            readonly __brand: "TaskId";
        }) | null;
        spawnedAt: Date | null;
        lastActiveAt: Date | null;
        performanceHistory: readonly PerformanceMetrics[] | null;
    };
    dna?: {
        id: string & {
            readonly __brand: "EvolutionDnaId";
        };
        createdAt: Date | null;
        updatedAt: Date | null;
        embedding: number[] | null;
        patternType: string;
        genetics: GeneticMarkers;
        performance: PerformanceMetrics;
        projectContext: ProjectContext;
        generation: number | null;
        parentId: (string & {
            readonly __brand: "EvolutionDnaId";
        }) | null;
    };
} | null>;
/**
 * Find best performing DNA patterns for a project context
 */
export declare const findBestDnaForProject: (projectId: ProjectContextId, role?: string, limit?: number) => Promise<{
    dna: {
        id: string & {
            readonly __brand: "EvolutionDnaId";
        };
        createdAt: Date | null;
        updatedAt: Date | null;
        embedding: number[] | null;
        patternType: string;
        genetics: GeneticMarkers;
        performance: PerformanceMetrics;
        projectContext: ProjectContext;
        generation: number | null;
        parentId: (string & {
            readonly __brand: "EvolutionDnaId";
        }) | null;
    };
    context: {
        id: string;
        createdAt: Date | null;
        updatedAt: Date | null;
        projectId: string & {
            readonly __brand: "ProjectContextId";
        };
        evolutionDnaId: string & {
            readonly __brand: "EvolutionDnaId";
        };
        adaptationScore: number;
        usageCount: number | null;
        averagePerformance: PerformanceMetrics;
        lastUsedAt: Date | null;
    };
}[]>;
/**
 * Update agent performance history
 */
export declare const updateAgentPerformance: (agentId: AgentInstanceId, newPerformance: PerformanceMetrics) => Promise<void>;
/**
 * Get evolution lineage (parent-child DNA relationships)
 */
export declare const getEvolutionLineage: (dnaId: EvolutionDnaId) => Promise<{
    ancestors: any[];
    descendants: any[];
}>;
//# sourceMappingURL=operations.d.ts.map