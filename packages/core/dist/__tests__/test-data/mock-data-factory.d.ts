/**
 * Mock Data Factory for SENTRA Test Suite
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import type { AgentConfig, EvolutionDna, Task, GeneticMarkers, PerformanceMetrics, ProjectContext, EnhancedGeneticMarkers, EnhancedPerformanceMetrics, CodeDNA, BirthContext, ViabilityAssessment, Mutation } from '@sentra/types';
/**
 * Factory for creating mock genetic markers
 */
export declare const createMockGeneticMarkers: (overrides?: Partial<GeneticMarkers>) => GeneticMarkers;
/**
 * Factory for creating mock enhanced genetic markers
 */
export declare const createMockEnhancedGeneticMarkers: (overrides?: Partial<EnhancedGeneticMarkers>) => EnhancedGeneticMarkers;
/**
 * Factory for creating mock performance metrics
 */
export declare const createMockPerformanceMetrics: (overrides?: Partial<PerformanceMetrics>) => PerformanceMetrics;
/**
 * Factory for creating mock enhanced performance metrics
 */
export declare const createMockEnhancedPerformanceMetrics: (overrides?: Partial<EnhancedPerformanceMetrics>) => EnhancedPerformanceMetrics;
/**
 * Factory for creating mock project context
 */
export declare const createMockProjectContext: (overrides?: Partial<ProjectContext>) => ProjectContext;
/**
 * Factory for creating mock mutation
 */
export declare const createMockMutation: (overrides?: Partial<Mutation>) => Mutation;
/**
 * Factory for creating mock birth context
 */
export declare const createMockBirthContext: (overrides?: Partial<BirthContext>) => BirthContext;
/**
 * Factory for creating mock viability assessment
 */
export declare const createMockViabilityAssessment: (overrides?: Partial<ViabilityAssessment>) => ViabilityAssessment;
/**
 * Factory for creating mock evolution DNA
 */
export declare const createMockEvolutionDna: (overrides?: Partial<EvolutionDna>) => EvolutionDna;
/**
 * Factory for creating mock enhanced Code DNA
 */
export declare const createMockCodeDNA: (overrides?: Partial<CodeDNA>) => CodeDNA;
/**
 * Factory for creating mock agent configuration
 */
export declare const createMockAgentConfig: (overrides?: Partial<AgentConfig>) => AgentConfig;
/**
 * Factory for creating mock task
 */
export declare const createMockTask: (overrides?: Partial<Task>) => Task;
/**
 * Specialized factories for different agent types
 */
export declare const MockAgentTypes: {
    developer: () => AgentConfig;
    tester: () => AgentConfig;
    orchestrator: () => AgentConfig;
    analyst: () => AgentConfig;
};
/**
 * Specialized factories for different DNA patterns
 */
export declare const MockDnaPatterns: {
    analytical: () => EvolutionDna;
    creative: () => EvolutionDna;
    systematic: () => EvolutionDna;
    optimization: () => EvolutionDna;
};
/**
 * Factory for creating sets of related test data
 */
export declare const createMockAgentFamily: (count?: number) => {
    parentDna: EvolutionDna;
    agents: AgentConfig[];
    dnaList: EvolutionDna[];
};
/**
 * Reset ID counter for deterministic tests
 */
export declare const resetMockIdCounter: () => void;
//# sourceMappingURL=mock-data-factory.d.ts.map