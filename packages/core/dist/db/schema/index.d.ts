/**
 * Main schema export file for Sentra Evolutionary Agent System
 * Combines base schema (existing tables) with evolution-specific tables
 */
export { projects, agents, tasks, approvals, events, memoryItems, subagents, } from './base';
export { evolutionDna, agentInstances, learningOutcomes, evolutionEvents, projectEvolutionContexts, } from './evolution';
export * from './relations';
//# sourceMappingURL=index.d.ts.map