/**
 * Main schema export file for Sentra Evolutionary Agent System
 * Combines base schema (existing tables) with evolution-specific tables
 */
// Export all base tables
export { projects, agents, tasks, approvals, events, memoryItems, subagents, } from './base';
// Export all evolution tables
export { evolutionDna, agentInstances, learningOutcomes, evolutionEvents, projectEvolutionContexts, } from './evolution';
// Export schema relations for Drizzle
export * from './relations';
//# sourceMappingURL=index.js.map