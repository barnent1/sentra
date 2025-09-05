/**
 * Event System Types for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive event-driven architecture for agent communication and system coordination
 */
// ============================================================================
// CORE EVENT TYPES
// ============================================================================
/**
 * Categories of events in the system
 */
export const EventCategory = {
    AGENT_LIFECYCLE: 'agent_lifecycle', // Agent creation, activation, deactivation
    TASK_EXECUTION: 'task_execution', // Task-related events
    LEARNING: 'learning', // Learning and knowledge events
    EVOLUTION: 'evolution', // DNA evolution and mutation events
    COMMUNICATION: 'communication', // Inter-agent communication
    PERFORMANCE: 'performance', // Performance monitoring events
    SYSTEM: 'system', // System-level events
    ERROR: 'error', // Error and exception events
    AUDIT: 'audit', // Audit and compliance events
    INTEGRATION: 'integration', // External system integration events
};
/**
 * Priority levels for events
 */
export const EventPriority = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    CRITICAL: 'critical',
    EMERGENCY: 'emergency',
};
/**
 * Type guard functions for event types
 */
export const isAgentLifecycleEvent = (event) => event.category === EventCategory.AGENT_LIFECYCLE;
export const isTaskExecutionEvent = (event) => event.category === EventCategory.TASK_EXECUTION;
export const isLearningEvent = (event) => event.category === EventCategory.LEARNING;
export const isEvolutionEvent = (event) => event.category === EventCategory.EVOLUTION;
export const isCommunicationEvent = (event) => event.category === EventCategory.COMMUNICATION;
export const isPerformanceEvent = (event) => event.category === EventCategory.PERFORMANCE;
export const isSystemEvent = (event) => event.category === EventCategory.SYSTEM;
export const isErrorEvent = (event) => event.category === EventCategory.ERROR;
export const isObservabilityEvent = (event) => event.category === EventCategory.AUDIT ||
    (event.category === EventCategory.PERFORMANCE && event.type === 'performance_pulse') ||
    (event.category === EventCategory.COMMUNICATION && event.type === 'agent_coordination') ||
    (event.category === EventCategory.LEARNING && event.type === 'agent_learning_pattern');
//# sourceMappingURL=events.js.map