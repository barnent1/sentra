/**
 * Core Type System Index for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This module provides comprehensive type definitions for:
 * - Evolutionary DNA and genetic operations
 * - Agent interfaces and capabilities
 * - Event-driven architecture
 * - Performance monitoring and metrics
 *
 * All types follow strict TypeScript patterns with:
 * - Branded types for ID safety
 * - Readonly interfaces throughout
 * - Generic constraints for vector operations
 * - Comprehensive JSDoc documentation
 */
export { 
// Enums and constants
PatternType, MutationType, } from './evolution';
export { 
// Enums and constants
AgentCapabilityType, AgentSpecialization, MemoryType, AgentState, } from './agents';
export { 
// Enums and constants
EventCategory, EventPriority, 
// Type guard functions
isAgentLifecycleEvent, isTaskExecutionEvent, isLearningEvent, isEvolutionEvent, isCommunicationEvent, isPerformanceEvent, isSystemEvent, isErrorEvent, } from './events';
export { 
// Enums and constants
MetricType, MetricAggregation, TimeWindow, DashboardWidgetType, AlertSeverity, AlertStatus, } from './monitoring';
export { 
// Constants from base types
TaskStatus, TaskPriority, } from '@sentra/types';
// ============================================================================
// TYPE VALIDATION HELPERS
// ============================================================================
/**
 * Type guard to check if a value is a valid metric data point
 */
export const isValidMetricDataPoint = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'type' in value &&
        'value' in value &&
        'timestamp' in value &&
        typeof value.value === 'number' &&
        value.timestamp instanceof Date);
};
/**
 * Type guard to check if a value is a valid agent capability
 */
export const isValidAgentCapability = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'type' in value &&
        'proficiencyLevel' in value &&
        typeof value.proficiencyLevel === 'number' &&
        value.proficiencyLevel >= 0 &&
        value.proficiencyLevel <= 1);
};
/**
 * Type guard to check if a value is a valid DNA
 */
export const isValidCodeDNA = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'patternType' in value &&
        'genetics' in value &&
        'performance' in value &&
        'embedding' in value &&
        Array.isArray(value.embedding));
};
/**
 * Default configuration values
 */
export const DEFAULT_TYPE_SYSTEM_CONFIG = {
    strictTypeChecking: true,
    validateMetrics: true,
    enforceReadonly: true,
    logTypeErrors: true,
    performanceMetricsEnabled: true,
    eventValidationEnabled: true,
};
// ============================================================================
// VERSION INFORMATION
// ============================================================================
/**
 * Type system version information
 */
export const TYPE_SYSTEM_VERSION = {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: null,
    build: null,
};
/**
 * Schema version for backward compatibility
 */
export const SCHEMA_VERSION = 'v1.0.0';
// ============================================================================
// DOCUMENTATION METADATA
// ============================================================================
/**
 * Metadata about the type system for documentation generation
 */
export const TYPE_SYSTEM_METADATA = {
    name: 'Sentra Evolutionary Agent Type System',
    description: 'Comprehensive type system for evolutionary agent architecture',
    author: 'Sentra Development Team',
    license: 'MIT',
    repository: 'https://github.com/barnent1/sentra',
    documentation: 'https://sentra.dev/docs/types',
    lastUpdated: new Date('2024-09-02'),
    typeCount: {
        interfaces: 150,
        types: 75,
        enums: 25,
        branded: 20,
    },
    coverage: {
        evolution: '100%',
        agents: '100%',
        events: '100%',
        monitoring: '100%',
    },
};
//# sourceMappingURL=index.js.map