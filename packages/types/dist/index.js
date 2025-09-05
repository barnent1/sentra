// Sentra Evolutionary Agent System - Core Types
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
/**
 * Pattern types for evolutionary DNA
 */
export const PatternType = {
    ANALYTICAL: 'analytical',
    CREATIVE: 'creative',
    SYSTEMATIC: 'systematic',
    OPTIMIZATION: 'optimization',
    DEBUGGING: 'debugging',
    INTEGRATION: 'integration',
};
/**
 * Agent types for specialized roles
 */
export const AgentType = {
    DEVELOPER: 'developer',
    TESTER: 'tester',
    REVIEWER: 'reviewer',
    ORCHESTRATOR: 'orchestrator',
    ANALYST: 'analyst',
    DESIGNER: 'designer',
};
/**
 * Agent status enumeration
 */
export const AgentStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived',
    SPAWNING: 'spawning',
    TERMINATING: 'terminating',
};
/**
 * Task types for classification
 */
export const TaskType = {
    DEVELOPMENT: 'development',
    TESTING: 'testing',
    REVIEW: 'review',
    DEPLOYMENT: 'deployment',
    ANALYSIS: 'analysis',
    DESIGN: 'design',
};
/**
 * Learning outcome types
 */
export const OutcomeType = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    PARTIAL: 'partial',
    BLOCKED: 'blocked',
    IMPROVEMENT: 'improvement',
};
/**
 * Evolution event types
 */
export const EventType = {
    DNA_EVOLUTION: 'dna_evolution',
    AGENT_SPAWN: 'agent_spawn',
    AGENT_TERMINATE: 'agent_terminate',
    LEARNING_EVENT: 'learning_event',
    PERFORMANCE_MILESTONE: 'performance_milestone',
};
/**
 * Task status enumeration
 */
export const TaskStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    BLOCKED: 'blocked',
};
/**
 * Task priority levels
 */
export const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};
// Re-export all types for convenience
export * from './index';
//# sourceMappingURL=index.js.map