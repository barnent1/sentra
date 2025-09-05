/**
 * Database relations for Sentra Evolutionary Agent System
 * Defines foreign key relationships between tables using Drizzle ORM
 */
export declare const projectsRelations: import("drizzle-orm").Relations<"projects", {
    tasks: import("drizzle-orm").Many<"tasks">;
    approvals: import("drizzle-orm").Many<"approvals">;
    events: import("drizzle-orm").Many<"events">;
    memoryItems: import("drizzle-orm").Many<"memory_items">;
    evolutionContexts: import("drizzle-orm").Many<"project_evolution_contexts">;
}>;
export declare const agentsRelations: import("drizzle-orm").Relations<"agents", {
    tasks: import("drizzle-orm").Many<"tasks">;
    events: import("drizzle-orm").Many<"events">;
    subagents: import("drizzle-orm").Many<"subagents">;
}>;
export declare const tasksRelations: import("drizzle-orm").Relations<"tasks", {
    project: import("drizzle-orm").One<"projects", false>;
    assignedAgent: import("drizzle-orm").One<"agents", false>;
    parentTask: import("drizzle-orm").One<"tasks", false>;
    childTasks: import("drizzle-orm").Many<"tasks">;
    events: import("drizzle-orm").Many<"events">;
    memoryItems: import("drizzle-orm").Many<"memory_items">;
    subagents: import("drizzle-orm").Many<"subagents">;
    learningOutcomes: import("drizzle-orm").Many<"learning_outcomes">;
}>;
export declare const approvalsRelations: import("drizzle-orm").Relations<"approvals", {
    project: import("drizzle-orm").One<"projects", false>;
    events: import("drizzle-orm").Many<"events">;
}>;
export declare const eventsRelations: import("drizzle-orm").Relations<"events", {
    project: import("drizzle-orm").One<"projects", false>;
    agent: import("drizzle-orm").One<"agents", false>;
    task: import("drizzle-orm").One<"tasks", false>;
    approval: import("drizzle-orm").One<"approvals", false>;
}>;
export declare const memoryItemsRelations: import("drizzle-orm").Relations<"memory_items", {
    project: import("drizzle-orm").One<"projects", false>;
    task: import("drizzle-orm").One<"tasks", false>;
}>;
export declare const subagentsRelations: import("drizzle-orm").Relations<"subagents", {
    agent: import("drizzle-orm").One<"agents", false>;
    task: import("drizzle-orm").One<"tasks", false>;
}>;
export declare const evolutionDnaRelations: import("drizzle-orm").Relations<"evolution_dna", {
    parent: import("drizzle-orm").One<"evolution_dna", false>;
    children: import("drizzle-orm").Many<"evolution_dna">;
    agentInstances: import("drizzle-orm").Many<"agent_instances">;
    learningOutcomes: import("drizzle-orm").Many<"learning_outcomes">;
    parentEvolutionEvents: import("drizzle-orm").Many<"evolution_events">;
    childEvolutionEvents: import("drizzle-orm").Many<"evolution_events">;
    projectContexts: import("drizzle-orm").Many<"project_evolution_contexts">;
}>;
export declare const agentInstancesRelations: import("drizzle-orm").Relations<"agent_instances", {
    evolutionDna: import("drizzle-orm").One<"evolution_dna", true>;
    currentTask: import("drizzle-orm").One<"tasks", false>;
    learningOutcomes: import("drizzle-orm").Many<"learning_outcomes">;
    evolutionEvents: import("drizzle-orm").Many<"evolution_events">;
}>;
export declare const learningOutcomesRelations: import("drizzle-orm").Relations<"learning_outcomes", {
    agentInstance: import("drizzle-orm").One<"agent_instances", true>;
    evolutionDna: import("drizzle-orm").One<"evolution_dna", true>;
    task: import("drizzle-orm").One<"tasks", true>;
}>;
export declare const evolutionEventsRelations: import("drizzle-orm").Relations<"evolution_events", {
    parentDna: import("drizzle-orm").One<"evolution_dna", true>;
    childDna: import("drizzle-orm").One<"evolution_dna", true>;
    agentInstance: import("drizzle-orm").One<"agent_instances", true>;
}>;
export declare const projectEvolutionContextsRelations: import("drizzle-orm").Relations<"project_evolution_contexts", {
    project: import("drizzle-orm").One<"projects", true>;
    evolutionDna: import("drizzle-orm").One<"evolution_dna", true>;
}>;
//# sourceMappingURL=relations.d.ts.map