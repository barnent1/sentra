/**
 * DNA Evolution Engine Index - Export all DNA evolution components
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

// Core DNA Engine (Production Implementation)
export { DNAEngine } from './dna-engine';
export type { DNAEngineConfig, MutationStrategyType } from './dna-engine';
export { MutationStrategy } from './dna-engine';

// Test DNA Engine (Working implementation for development)
export { TestDNAEngine } from './test-engine';
export { runEvolutionTest } from './test-evolution';

// Fitness Evaluation (Commented out due to type compatibility issues)
// export { FitnessEvaluator, default as DefaultFitnessEvaluator } from './fitness/fitness-evaluator';

// Mutation Strategies (Commented out due to type compatibility issues) 
// export { BaseMutator } from './mutators/base-mutator';

// Genetic Operators (Commented out due to type compatibility issues)
// export { GeneticOperators, default as DefaultGeneticOperators } from './genetic/genetic-operators';

// Validation (Commented out due to type compatibility issues)
// export { MutationValidator, default as DefaultMutationValidator } from './validation/mutation-validator';

// Metrics (Commented out due to type compatibility issues)
// export { EvolutionMetrics, default as DefaultEvolutionMetrics } from './metrics/evolution-metrics';

// Re-export types from core types for convenience
export type {
  CodeDNA,
  EvolutionResult,
  EvolutionParameters,
  PerformanceFeedback,
  ProjectContext,
  GeneticMarkers,
  Mutation,
  MutationType,
  PatternType,
  FitnessScore
} from '../types';