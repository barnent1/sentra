/**
 * Evolution Type System for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Comprehensive type definitions for evolutionary learning, DNA patterns, and genetic operations
 */
// ============================================================================
// PATTERN AND MUTATION TYPES
// ============================================================================
/**
 * Types of evolutionary patterns that can emerge
 */
export const PatternType = {
    ANALYTICAL: 'analytical',
    CREATIVE: 'creative',
    SYSTEMATIC: 'systematic',
    ADAPTIVE: 'adaptive',
    COLLABORATIVE: 'collaborative',
    OPTIMIZATION_FOCUSED: 'optimization_focused',
    ERROR_RECOVERY: 'error_recovery',
    LEARNING_ACCELERATED: 'learning_accelerated',
};
/**
 * Types of mutations that can occur in evolutionary DNA
 */
export const MutationType = {
    GENETIC_DRIFT: 'genetic_drift', // Random small changes
    TARGETED_IMPROVEMENT: 'targeted_improvement', // Specific skill enhancement
    CROSSOVER: 'crossover', // Combining traits from parents
    INNOVATION: 'innovation', // Novel approach emergence  
    REGRESSION: 'regression', // Reverting unsuccessful changes
    ADAPTATION: 'adaptation', // Context-specific adjustments
};
//# sourceMappingURL=evolution.js.map