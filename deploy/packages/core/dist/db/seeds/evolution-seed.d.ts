/**
 * Evolution seed data for testing evolutionary features
 * Creates sample DNA patterns, agent instances, and learning outcomes
 */
import type { EvolutionDnaId, AgentInstanceId, GeneticMarkers, PerformanceMetrics, ProjectContext } from '@sentra/types';
/**
 * Seed evolution DNA data
 */
export declare function seedEvolutionDna(): Promise<{
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
}[]>;
/**
 * Seed agent instances
 */
export declare function seedAgentInstances(dnaPatterns: Array<{
    id: EvolutionDnaId;
    patternType: string;
}>): Promise<{
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
}[]>;
/**
 * Seed learning outcomes (sample data for testing)
 */
export declare function seedLearningOutcomes(agents: Array<{
    id: AgentInstanceId;
    evolutionDnaId: EvolutionDnaId;
}>): Promise<{
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
}[]>;
/**
 * Main seeding function
 */
export declare function runEvolutionSeeds(): Promise<void>;
//# sourceMappingURL=evolution-seed.d.ts.map