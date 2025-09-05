/**
 * Evolution-specific schema definitions for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import type { EvolutionDnaId, AgentInstanceId, TaskId, ProjectContextId, LearningOutcomeId, EvolutionEventId, GeneticMarkers, PerformanceMetrics, ProjectContext } from '@sentra/types';
export declare const uuidGenerateV4: import("drizzle-orm").SQL<unknown>;
export declare const vector: (name: string, config?: {
    dimensions: number;
}) => import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
    name: string;
    dataType: "custom";
    columnType: "PgCustomColumn";
    data: number[];
    driverParam: string;
    enumValues: undefined;
}>;
/**
 * Evolution DNA table - stores genetic patterns and performance data for evolutionary learning
 */
export declare const evolutionDna: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "evolution_dna";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "evolution_dna";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        patternType: import("drizzle-orm/pg-core").PgColumn<{
            name: "pattern_type";
            tableName: "evolution_dna";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        genetics: import("drizzle-orm/pg-core").PgColumn<{
            name: "genetics";
            tableName: "evolution_dna";
            dataType: "json";
            columnType: "PgJsonb";
            data: GeneticMarkers;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        performance: import("drizzle-orm/pg-core").PgColumn<{
            name: "performance_metrics";
            tableName: "evolution_dna";
            dataType: "json";
            columnType: "PgJsonb";
            data: PerformanceMetrics;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        projectContext: import("drizzle-orm/pg-core").PgColumn<{
            name: "project_context";
            tableName: "evolution_dna";
            dataType: "json";
            columnType: "PgJsonb";
            data: ProjectContext;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        generation: import("drizzle-orm/pg-core").PgColumn<{
            name: "generation";
            tableName: "evolution_dna";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        parentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "parent_id";
            tableName: "evolution_dna";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        embedding: import("drizzle-orm/pg-core").PgColumn<{
            name: string;
            tableName: "evolution_dna";
            dataType: "custom";
            columnType: "PgCustomColumn";
            data: number[];
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "evolution_dna";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "evolution_dna";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Agent instances table - specific instances of evolutionary agents with their DNA
 */
export declare const agentInstances: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "agent_instances";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "agent_instances";
            dataType: "string";
            columnType: "PgUUID";
            data: AgentInstanceId;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        evolutionDnaId: import("drizzle-orm/pg-core").PgColumn<{
            name: "evolution_dna_id";
            tableName: "agent_instances";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "agent_instances";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        role: import("drizzle-orm/pg-core").PgColumn<{
            name: "role";
            tableName: "agent_instances";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "agent_instances";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        currentTaskId: import("drizzle-orm/pg-core").PgColumn<{
            name: "current_task_id";
            tableName: "agent_instances";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        spawnedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "spawned_at";
            tableName: "agent_instances";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        lastActiveAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_active_at";
            tableName: "agent_instances";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        performanceHistory: import("drizzle-orm/pg-core").PgColumn<{
            name: "performance_history";
            tableName: "agent_instances";
            dataType: "json";
            columnType: "PgJsonb";
            data: readonly PerformanceMetrics[];
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "agent_instances";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Learning outcomes table - captures learning from task execution for evolution
 */
export declare const learningOutcomes: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "learning_outcomes";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "learning_outcomes";
            dataType: "string";
            columnType: "PgUUID";
            data: LearningOutcomeId;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        agentInstanceId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_instance_id";
            tableName: "learning_outcomes";
            dataType: "string";
            columnType: "PgUUID";
            data: AgentInstanceId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        evolutionDnaId: import("drizzle-orm/pg-core").PgColumn<{
            name: "evolution_dna_id";
            tableName: "learning_outcomes";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        taskId: import("drizzle-orm/pg-core").PgColumn<{
            name: "task_id";
            tableName: "learning_outcomes";
            dataType: "string";
            columnType: "PgUUID";
            data: TaskId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        outcomeType: import("drizzle-orm/pg-core").PgColumn<{
            name: "outcome_type";
            tableName: "learning_outcomes";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        performanceImprovement: import("drizzle-orm/pg-core").PgColumn<{
            name: "performance_improvement";
            tableName: "learning_outcomes";
            dataType: "number";
            columnType: "PgReal";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        lessonLearned: import("drizzle-orm/pg-core").PgColumn<{
            name: "lesson_learned";
            tableName: "learning_outcomes";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        contextFactors: import("drizzle-orm/pg-core").PgColumn<{
            name: "context_factors";
            tableName: "learning_outcomes";
            dataType: "json";
            columnType: "PgJsonb";
            data: readonly string[];
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        applicabilityScore: import("drizzle-orm/pg-core").PgColumn<{
            name: "applicability_score";
            tableName: "learning_outcomes";
            dataType: "number";
            columnType: "PgReal";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        embedding: import("drizzle-orm/pg-core").PgColumn<{
            name: string;
            tableName: "learning_outcomes";
            dataType: "custom";
            columnType: "PgCustomColumn";
            data: number[];
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "learning_outcomes";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Evolution events table - tracks DNA evolution events and genetic changes
 */
export declare const evolutionEvents: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "evolution_events";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "evolution_events";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionEventId;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        parentDnaId: import("drizzle-orm/pg-core").PgColumn<{
            name: "parent_dna_id";
            tableName: "evolution_events";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        childDnaId: import("drizzle-orm/pg-core").PgColumn<{
            name: "child_dna_id";
            tableName: "evolution_events";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        agentInstanceId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_instance_id";
            tableName: "evolution_events";
            dataType: "string";
            columnType: "PgUUID";
            data: AgentInstanceId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        evolutionTrigger: import("drizzle-orm/pg-core").PgColumn<{
            name: "evolution_trigger";
            tableName: "evolution_events";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        geneticChanges: import("drizzle-orm/pg-core").PgColumn<{
            name: "genetic_changes";
            tableName: "evolution_events";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, {
                from: unknown;
                to: unknown;
            }>;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        performanceDelta: import("drizzle-orm/pg-core").PgColumn<{
            name: "performance_delta";
            tableName: "evolution_events";
            dataType: "json";
            columnType: "PgJsonb";
            data: PerformanceMetrics;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        confidenceScore: import("drizzle-orm/pg-core").PgColumn<{
            name: "confidence_score";
            tableName: "evolution_events";
            dataType: "number";
            columnType: "PgReal";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "evolution_events";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * Project evolution contexts table - tracks project-specific evolutionary adaptations
 */
export declare const projectEvolutionContexts: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "project_evolution_contexts";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "project_evolution_contexts";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        projectId: import("drizzle-orm/pg-core").PgColumn<{
            name: "project_id";
            tableName: "project_evolution_contexts";
            dataType: "string";
            columnType: "PgUUID";
            data: ProjectContextId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        evolutionDnaId: import("drizzle-orm/pg-core").PgColumn<{
            name: "evolution_dna_id";
            tableName: "project_evolution_contexts";
            dataType: "string";
            columnType: "PgUUID";
            data: EvolutionDnaId;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        adaptationScore: import("drizzle-orm/pg-core").PgColumn<{
            name: "adaptation_score";
            tableName: "project_evolution_contexts";
            dataType: "number";
            columnType: "PgReal";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        usageCount: import("drizzle-orm/pg-core").PgColumn<{
            name: "usage_count";
            tableName: "project_evolution_contexts";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        averagePerformance: import("drizzle-orm/pg-core").PgColumn<{
            name: "average_performance";
            tableName: "project_evolution_contexts";
            dataType: "json";
            columnType: "PgJsonb";
            data: PerformanceMetrics;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        lastUsedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_used_at";
            tableName: "project_evolution_contexts";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "project_evolution_contexts";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "project_evolution_contexts";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
//# sourceMappingURL=evolution.d.ts.map