/**
 * Database relations for Sentra Evolutionary Agent System
 * Defines foreign key relationships between tables using Drizzle ORM
 */
import { relations } from 'drizzle-orm';
import { projects, agents, tasks, approvals, events, memoryItems, subagents, evolutionDna, agentInstances, learningOutcomes, evolutionEvents, projectEvolutionContexts, } from './index';
// Base table relations
export const projectsRelations = relations(projects, ({ many }) => ({
    tasks: many(tasks),
    approvals: many(approvals),
    events: many(events),
    memoryItems: many(memoryItems),
    evolutionContexts: many(projectEvolutionContexts),
}));
export const agentsRelations = relations(agents, ({ many }) => ({
    tasks: many(tasks),
    events: many(events),
    subagents: many(subagents),
}));
export const tasksRelations = relations(tasks, ({ one, many }) => ({
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
    assignedAgent: one(agents, {
        fields: [tasks.assignedAgent],
        references: [agents.id],
    }),
    parentTask: one(tasks, {
        fields: [tasks.parentTaskId],
        references: [tasks.id],
    }),
    childTasks: many(tasks),
    events: many(events),
    memoryItems: many(memoryItems),
    subagents: many(subagents),
    learningOutcomes: many(learningOutcomes),
}));
export const approvalsRelations = relations(approvals, ({ one, many }) => ({
    project: one(projects, {
        fields: [approvals.projectId],
        references: [projects.id],
    }),
    events: many(events),
}));
export const eventsRelations = relations(events, ({ one }) => ({
    project: one(projects, {
        fields: [events.projectId],
        references: [projects.id],
    }),
    agent: one(agents, {
        fields: [events.agentId],
        references: [agents.id],
    }),
    task: one(tasks, {
        fields: [events.taskId],
        references: [tasks.id],
    }),
    approval: one(approvals, {
        fields: [events.approvalId],
        references: [approvals.id],
    }),
}));
export const memoryItemsRelations = relations(memoryItems, ({ one }) => ({
    project: one(projects, {
        fields: [memoryItems.projectId],
        references: [projects.id],
    }),
    task: one(tasks, {
        fields: [memoryItems.taskId],
        references: [tasks.id],
    }),
}));
export const subagentsRelations = relations(subagents, ({ one }) => ({
    agent: one(agents, {
        fields: [subagents.agentId],
        references: [agents.id],
    }),
    task: one(tasks, {
        fields: [subagents.taskId],
        references: [tasks.id],
    }),
}));
// Evolution table relations
export const evolutionDnaRelations = relations(evolutionDna, ({ one, many }) => ({
    parent: one(evolutionDna, {
        fields: [evolutionDna.parentId],
        references: [evolutionDna.id],
    }),
    children: many(evolutionDna),
    agentInstances: many(agentInstances),
    learningOutcomes: many(learningOutcomes),
    parentEvolutionEvents: many(evolutionEvents, {
        relationName: 'parentDna',
    }),
    childEvolutionEvents: many(evolutionEvents, {
        relationName: 'childDna',
    }),
    projectContexts: many(projectEvolutionContexts),
}));
export const agentInstancesRelations = relations(agentInstances, ({ one, many }) => ({
    evolutionDna: one(evolutionDna, {
        fields: [agentInstances.evolutionDnaId],
        references: [evolutionDna.id],
    }),
    currentTask: one(tasks, {
        fields: [agentInstances.currentTaskId],
        references: [tasks.id],
    }),
    learningOutcomes: many(learningOutcomes),
    evolutionEvents: many(evolutionEvents),
}));
export const learningOutcomesRelations = relations(learningOutcomes, ({ one }) => ({
    agentInstance: one(agentInstances, {
        fields: [learningOutcomes.agentInstanceId],
        references: [agentInstances.id],
    }),
    evolutionDna: one(evolutionDna, {
        fields: [learningOutcomes.evolutionDnaId],
        references: [evolutionDna.id],
    }),
    task: one(tasks, {
        fields: [learningOutcomes.taskId],
        references: [tasks.id],
    }),
}));
export const evolutionEventsRelations = relations(evolutionEvents, ({ one }) => ({
    parentDna: one(evolutionDna, {
        fields: [evolutionEvents.parentDnaId],
        references: [evolutionDna.id],
        relationName: 'parentDna',
    }),
    childDna: one(evolutionDna, {
        fields: [evolutionEvents.childDnaId],
        references: [evolutionDna.id],
        relationName: 'childDna',
    }),
    agentInstance: one(agentInstances, {
        fields: [evolutionEvents.agentInstanceId],
        references: [agentInstances.id],
    }),
}));
export const projectEvolutionContextsRelations = relations(projectEvolutionContexts, ({ one }) => ({
    project: one(projects, {
        fields: [projectEvolutionContexts.projectId],
        references: [projects.id],
    }),
    evolutionDna: one(evolutionDna, {
        fields: [projectEvolutionContexts.evolutionDnaId],
        references: [evolutionDna.id],
    }),
}));
//# sourceMappingURL=relations.js.map