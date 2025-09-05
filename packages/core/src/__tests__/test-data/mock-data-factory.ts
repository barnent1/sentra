/**
 * Mock Data Factory for SENTRA Test Suite
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

import type {
  AgentConfig,
  AgentInstanceId,
  EvolutionDna,
  EvolutionDnaId,
  Task,
  TaskId,
  ProjectContextId,
  GeneticMarkers,
  PerformanceMetrics,
  ProjectContext,
  EnhancedGeneticMarkers,
  EnhancedPerformanceMetrics,
  CodeDNA,
  FitnessScore,
  BirthContext,
  ViabilityAssessment,
  Mutation,
} from '@sentra/types';

/**
 * Counter for generating unique IDs in tests
 */
let idCounter = 0;
const generateId = () => ++idCounter;

/**
 * Factory for creating mock genetic markers
 */
export const createMockGeneticMarkers = (overrides?: Partial<GeneticMarkers>): GeneticMarkers => ({
  complexity: 0.7,
  adaptability: 0.8,
  successRate: 0.85,
  transferability: 0.6,
  stability: 0.9,
  novelty: 0.5,
  ...overrides,
});

/**
 * Factory for creating mock enhanced genetic markers
 */
export const createMockEnhancedGeneticMarkers = (
  overrides?: Partial<EnhancedGeneticMarkers>
): EnhancedGeneticMarkers => ({
  ...createMockGeneticMarkers(),
  patternRecognition: 0.75,
  errorRecovery: 0.8,
  communicationClarity: 0.7,
  learningVelocity: 0.85,
  resourceEfficiency: 0.9,
  collaborationAffinity: 0.6,
  riskTolerance: 0.4,
  thoroughness: 0.8,
  creativity: 0.6,
  persistence: 0.9,
  empathy: 0.5,
  pragmatism: 0.8,
  ...overrides,
});

/**
 * Factory for creating mock performance metrics
 */
export const createMockPerformanceMetrics = (
  overrides?: Partial<PerformanceMetrics>
): PerformanceMetrics => ({
  successRate: 0.85,
  averageTaskCompletionTime: 120,
  codeQualityScore: 0.8,
  userSatisfactionRating: 4.2,
  adaptationSpeed: 0.7,
  errorRecoveryRate: 0.75,
  ...overrides,
});

/**
 * Factory for creating mock enhanced performance metrics
 */
export const createMockEnhancedPerformanceMetrics = (
  overrides?: Partial<EnhancedPerformanceMetrics>
): EnhancedPerformanceMetrics => ({
  ...createMockPerformanceMetrics(),
  knowledgeRetention: 0.8,
  crossDomainTransfer: 0.6,
  computationalEfficiency: 0.85,
  responseLatency: 250,
  throughput: 0.9,
  resourceUtilization: 0.7,
  bugIntroductionRate: 0.05,
  testCoverage: 0.92,
  documentationQuality: 0.75,
  maintainabilityScore: 0.8,
  communicationEffectiveness: 0.85,
  teamIntegration: 0.7,
  feedbackIncorporation: 0.9,
  conflictResolution: 0.6,
  ...overrides,
});

/**
 * Factory for creating mock project context
 */
export const createMockProjectContext = (overrides?: Partial<ProjectContext>): ProjectContext => ({
  id: crypto.randomUUID() as ProjectContextId,
  projectType: 'web-app',
  techStack: ['typescript', 'react', 'node.js', 'postgresql'],
  complexity: 'medium',
  teamSize: 5,
  timeline: '6 months',
  requirements: ['scalable', 'maintainable', 'tested', 'documented'],
  ...overrides,
});

/**
 * Factory for creating mock mutation
 */
export const createMockMutation = (overrides?: Partial<Mutation>): Mutation => ({
  id: `mutation-${generateId()}`,
  strategy: 'optimization',
  changes: {
    adaptability: { from: 0.7, to: 0.8 },
    successRate: { from: 0.8, to: 0.85 },
  },
  timestamp: new Date(),
  reason: 'Performance improvement detected',
  impact: 0.05,
  ...overrides,
});

/**
 * Factory for creating mock birth context
 */
export const createMockBirthContext = (overrides?: Partial<BirthContext>): BirthContext => ({
  trigger: 'performance_threshold',
  creationReason: 'Spawned due to consistent high performance in TypeScript development tasks',
  initialPerformance: createMockEnhancedPerformanceMetrics(),
  ...overrides,
});

/**
 * Factory for creating mock viability assessment
 */
export const createMockViabilityAssessment = (
  overrides?: Partial<ViabilityAssessment>
): ViabilityAssessment => ({
  overallScore: 0.82,
  strengths: ['pattern recognition', 'error handling', 'code quality'],
  weaknesses: ['creativity', 'risk tolerance'],
  recommendedContexts: ['web development', 'api development', 'testing'],
  avoidContexts: ['creative design', 'experimental research'],
  lastAssessment: new Date(),
  confidenceLevel: 0.9,
  ...overrides,
});

/**
 * Factory for creating mock evolution DNA
 */
export const createMockEvolutionDna = (overrides?: Partial<EvolutionDna>): EvolutionDna => {
  const base = {
    id: `dna-${generateId()}` as EvolutionDnaId,
    patternType: 'analytical',
    genetics: createMockGeneticMarkers(),
    performance: createMockPerformanceMetrics(),
    projectContext: createMockProjectContext(),
    generation: 1,
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  
  return base;
};

/**
 * Factory for creating mock enhanced Code DNA
 */
export const createMockCodeDNA = (overrides?: Partial<CodeDNA>): CodeDNA => ({
  id: `dna-${generateId()}` as EvolutionDnaId,
  patternType: 'analytical',
  context: createMockProjectContext(),
  genetics: createMockEnhancedGeneticMarkers(),
  performance: createMockEnhancedPerformanceMetrics(),
  mutations: [createMockMutation(), createMockMutation()],
  embedding: Array.from({ length: 256 }, () => Math.random() - 0.5),
  timestamp: new Date(),
  generation: 3,
  parentId: `dna-parent-${generateId()}` as EvolutionDnaId,
  birthContext: createMockBirthContext(),
  evolutionHistory: [
    'Initial spawn from high-performance TypeScript agent',
    'Mutation: Improved adaptability (+0.1)',
    'Mutation: Enhanced error recovery (+0.05)',
  ],
  activationCount: 42,
  lastActivation: new Date(),
  fitnessScore: 0.87 as FitnessScore,
  viabilityAssessment: createMockViabilityAssessment(),
  reproductionPotential: 0.75,
  tags: ['typescript', 'testing', 'web-development', 'high-performance'],
  notes: 'Consistently performs well in TypeScript development and testing scenarios',
  isArchived: false,
  ...overrides,
});

/**
 * Factory for creating mock agent configuration
 */
export const createMockAgentConfig = (overrides?: Partial<AgentConfig>): AgentConfig => ({
  id: `agent-${generateId()}` as AgentInstanceId,
  name: `TestAgent-${generateId()}`,
  specialization: 'TypeScript Development',
  capabilities: ['typescript', 'testing', 'debugging', 'code-review'],
  evolutionDnaId: `dna-${generateId()}` as EvolutionDnaId,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Factory for creating mock task
 */
export const createMockTask = (overrides?: Partial<Task>): Task => {
  const base = {
    id: `task-${generateId()}` as TaskId,
    title: `Test Task ${generateId()}`,
    description: 'Implement TypeScript unit tests for the core evolutionary agent system',
    status: 'pending' as const,
    priority: 'medium' as const,
    projectContextId: `context-${generateId()}` as ProjectContextId,
    dependencies: [] as readonly TaskId[],
    estimatedDuration: 180,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  
  return base;
};

/**
 * Specialized factories for different agent types
 */
export const MockAgentTypes = {
  developer: () => createMockAgentConfig({
    specialization: 'Software Development',
    capabilities: ['typescript', 'javascript', 'react', 'node.js', 'testing'],
  }),

  tester: () => createMockAgentConfig({
    specialization: 'Quality Assurance',
    capabilities: ['testing', 'debugging', 'automation', 'performance-analysis'],
  }),

  orchestrator: () => createMockAgentConfig({
    specialization: 'Project Orchestration',
    capabilities: ['coordination', 'planning', 'monitoring', 'communication'],
  }),

  analyst: () => createMockAgentConfig({
    specialization: 'Code Analysis',
    capabilities: ['analysis', 'optimization', 'security', 'performance'],
  }),
};

/**
 * Specialized factories for different DNA patterns
 */
export const MockDnaPatterns = {
  analytical: () => createMockEvolutionDna({
    patternType: 'analytical',
    genetics: createMockGeneticMarkers({
      complexity: 0.9,
      adaptability: 0.6,
      successRate: 0.85,
      stability: 0.95,
    }),
  }),

  creative: () => createMockEvolutionDna({
    patternType: 'creative',
    genetics: createMockGeneticMarkers({
      complexity: 0.7,
      adaptability: 0.9,
      successRate: 0.7,
      novelty: 0.95,
    }),
  }),

  systematic: () => createMockEvolutionDna({
    patternType: 'systematic',
    genetics: createMockGeneticMarkers({
      complexity: 0.8,
      adaptability: 0.5,
      successRate: 0.95,
      stability: 0.99,
    }),
  }),

  optimization: () => createMockEvolutionDna({
    patternType: 'optimization',
    genetics: createMockGeneticMarkers({
      complexity: 0.85,
      adaptability: 0.8,
      successRate: 0.9,
      transferability: 0.9,
    }),
  }),
};

/**
 * Factory for creating sets of related test data
 */
export const createMockAgentFamily = (count: number = 3) => {
  const parentDna = createMockEvolutionDna({ generation: 1 });
  const agents: AgentConfig[] = [];
  const dnaList: EvolutionDna[] = [parentDna];

  for (let i = 0; i < count; i++) {
    const childDna = createMockEvolutionDna({
      generation: parentDna.generation + 1,
      parentId: parentDna.id,
      genetics: createMockGeneticMarkers({
        // Slight variations from parent
        complexity: Math.min(1.0, parentDna.genetics.complexity + (Math.random() - 0.5) * 0.2),
        adaptability: Math.min(1.0, parentDna.genetics.adaptability + (Math.random() - 0.5) * 0.2),
        successRate: Math.min(1.0, parentDna.genetics.successRate + (Math.random() - 0.5) * 0.1),
      }),
    });

    const agent = createMockAgentConfig({
      evolutionDnaId: childDna.id,
      name: `EvolutionAgent-Gen${childDna.generation}-${i + 1}`,
    });

    dnaList.push(childDna);
    agents.push(agent);
  }

  return { parentDna, agents, dnaList };
};

/**
 * Reset ID counter for deterministic tests
 */
export const resetMockIdCounter = () => {
  idCounter = 0;
};