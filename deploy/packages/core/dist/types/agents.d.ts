/**
 * Agent Interface System for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Abstract base classes and interfaces for all evolutionary agent types
 */
import type { AgentInstanceId, TaskId, ProjectContextId, Brand } from '@sentra/types';
import type { CodeDNA, PerformanceMetrics, ProjectContext, PerformanceFeedback, EvolutionParameters, EvolutionResult } from './evolution';
export type AgentCapabilityId = Brand<string, 'AgentCapabilityId'>;
export type AgentMemoryId = Brand<string, 'AgentMemoryId'>;
export type AgentEventId = Brand<string, 'AgentEventId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type LearningSessionId = Brand<string, 'LearningSessionId'>;
/**
 * Core agent capability types
 */
export declare const AgentCapabilityType: {
    readonly CODE_GENERATION: "code_generation";
    readonly CODE_REVIEW: "code_review";
    readonly CODE_REFACTORING: "code_refactoring";
    readonly CODE_DEBUGGING: "code_debugging";
    readonly TEST_GENERATION: "test_generation";
    readonly TEST_EXECUTION: "test_execution";
    readonly QUALITY_ANALYSIS: "quality_analysis";
    readonly PERFORMANCE_OPTIMIZATION: "performance_optimization";
    readonly DOCUMENTATION_WRITING: "documentation_writing";
    readonly API_DOCUMENTATION: "api_documentation";
    readonly USER_COMMUNICATION: "user_communication";
    readonly TECHNICAL_EXPLANATION: "technical_explanation";
    readonly SYSTEM_DESIGN: "system_design";
    readonly DATABASE_DESIGN: "database_design";
    readonly API_DESIGN: "api_design";
    readonly SECURITY_ANALYSIS: "security_analysis";
    readonly PATTERN_RECOGNITION: "pattern_recognition";
    readonly ERROR_ANALYSIS: "error_analysis";
    readonly KNOWLEDGE_TRANSFER: "knowledge_transfer";
    readonly CONTINUOUS_LEARNING: "continuous_learning";
    readonly PROJECT_COORDINATION: "project_coordination";
    readonly TEAM_COMMUNICATION: "team_communication";
    readonly CONFLICT_RESOLUTION: "conflict_resolution";
    readonly STAKEHOLDER_MANAGEMENT: "stakeholder_management";
};
export type AgentCapabilityTypeEnum = typeof AgentCapabilityType[keyof typeof AgentCapabilityType];
/**
 * Individual capability with proficiency and context
 */
export interface AgentCapability {
    readonly id: AgentCapabilityId;
    readonly type: AgentCapabilityTypeEnum;
    readonly proficiencyLevel: number;
    readonly confidenceLevel: number;
    readonly experienceCount: number;
    readonly lastUsed: Date;
    readonly averagePerformance: number;
    readonly contextSpecialization: readonly string[];
    readonly improvementRate: number;
    readonly isActive: boolean;
}
/**
 * Collection of capabilities for an agent
 */
export interface AgentCapabilities {
    readonly primary: readonly AgentCapability[];
    readonly secondary: readonly AgentCapability[];
    readonly emerging: readonly AgentCapability[];
    readonly dormant: readonly AgentCapability[];
    readonly learningTargets: readonly AgentCapabilityTypeEnum[];
}
/**
 * Agent specialization profiles
 */
export declare const AgentSpecialization: {
    readonly FULL_STACK_DEVELOPER: "full_stack_developer";
    readonly BACKEND_SPECIALIST: "backend_specialist";
    readonly FRONTEND_SPECIALIST: "frontend_specialist";
    readonly DEVOPS_ENGINEER: "devops_engineer";
    readonly DATA_ENGINEER: "data_engineer";
    readonly SECURITY_SPECIALIST: "security_specialist";
    readonly ARCHITECTURE_CONSULTANT: "architecture_consultant";
    readonly QA_SPECIALIST: "qa_specialist";
    readonly TECHNICAL_WRITER: "technical_writer";
    readonly PROJECT_MANAGER: "project_manager";
    readonly AI_ML_SPECIALIST: "ai_ml_specialist";
    readonly GENERALIST: "generalist";
};
export type AgentSpecializationEnum = typeof AgentSpecialization[keyof typeof AgentSpecialization];
/**
 * Types of memories agents can store
 */
export declare const MemoryType: {
    readonly EPISODIC: "episodic";
    readonly SEMANTIC: "semantic";
    readonly PROCEDURAL: "procedural";
    readonly WORKING: "working";
    readonly ASSOCIATIVE: "associative";
    readonly EMOTIONAL: "emotional";
};
export type MemoryTypeEnum = typeof MemoryType[keyof typeof MemoryType];
/**
 * Individual memory record
 */
export interface AgentMemory {
    readonly id: AgentMemoryId;
    readonly type: MemoryTypeEnum;
    readonly content: string;
    readonly context: MemoryContext;
    readonly embedding: readonly number[];
    readonly strength: number;
    readonly relevanceScore: number;
    readonly accessCount: number;
    readonly lastAccessed: Date;
    readonly createdAt: Date;
    readonly expiryDate?: Date;
    readonly tags: readonly string[];
    readonly isCore: boolean;
}
/**
 * Context in which memory was formed
 */
export interface MemoryContext {
    readonly taskId?: TaskId;
    readonly projectId?: ProjectContextId;
    readonly agentState: AgentStateEnum;
    readonly emotionalState: EmotionalState;
    readonly environmentFactors: readonly string[];
    readonly associatedAgents: readonly AgentInstanceId[];
    readonly successOutcome: boolean;
    readonly lessonLearned?: string;
}
/**
 * Memory management system interface
 */
export interface MemorySystem {
    /**
     * Store a new memory
     */
    store(memory: Omit<AgentMemory, 'id' | 'createdAt' | 'lastAccessed' | 'accessCount'>): Promise<AgentMemory>;
    /**
     * Retrieve memories based on query
     */
    recall(query: string, type?: MemoryTypeEnum, maxResults?: number, minRelevance?: number): Promise<readonly AgentMemory[]>;
    /**
     * Update memory strength based on usage
     */
    reinforce(memoryId: AgentMemoryId, strengthDelta: number): Promise<void>;
    /**
     * Forget memories based on criteria
     */
    forget(criteria: MemoryForgetCriteria): Promise<number>;
    /**
     * Consolidate memories (merge similar ones)
     */
    consolidate(): Promise<number>;
    /**
     * Get memory statistics
     */
    getStats(): Promise<MemoryStats>;
}
/**
 * Criteria for forgetting memories
 */
export interface MemoryForgetCriteria {
    readonly olderThan?: Date;
    readonly weakerThan?: number;
    readonly type?: MemoryTypeEnum;
    readonly unusedFor?: number;
    readonly excludeCore?: boolean;
}
/**
 * Memory system statistics
 */
export interface MemoryStats {
    readonly totalMemories: number;
    readonly memoryByType: Record<MemoryTypeEnum, number>;
    readonly averageStrength: number;
    readonly oldestMemory: Date;
    readonly mostAccessedMemory: AgentMemoryId;
    readonly memoryUtilization: number;
}
/**
 * Current state of the agent
 */
export declare const AgentState: {
    readonly IDLE: "idle";
    readonly THINKING: "thinking";
    readonly CODING: "coding";
    readonly LEARNING: "learning";
    readonly DEBUGGING: "debugging";
    readonly COLLABORATING: "collaborating";
    readonly EVOLVING: "evolving";
    readonly ERROR_RECOVERY: "error_recovery";
    readonly RESTING: "resting";
};
export type AgentStateEnum = typeof AgentState[keyof typeof AgentState];
/**
 * Emotional state affecting agent behavior
 */
export interface EmotionalState {
    readonly confidence: number;
    readonly curiosity: number;
    readonly frustration: number;
    readonly satisfaction: number;
    readonly anxiety: number;
    readonly enthusiasm: number;
    readonly empathy: number;
    readonly determination: number;
    readonly lastUpdated: Date;
}
/**
 * Learning session tracking
 */
export interface LearningSession {
    readonly id: LearningSessionId;
    readonly agentId: AgentInstanceId;
    readonly trigger: LearningTrigger;
    readonly objectives: readonly string[];
    readonly startTime: Date;
    readonly endTime?: Date;
    readonly progress: LearningProgress;
    readonly outcomes: readonly LearningOutcome[];
    readonly metabolizedKnowledge: readonly string[];
    readonly newCapabilities: readonly AgentCapabilityTypeEnum[];
    readonly improvementMetrics: LearningImprovementMetrics;
}
/**
 * What triggered this learning session
 */
export interface LearningTrigger {
    readonly type: 'failure_analysis' | 'success_pattern' | 'user_feedback' | 'peer_observation' | 'scheduled_learning';
    readonly context: string;
    readonly severity?: 'low' | 'medium' | 'high' | 'critical';
    readonly sourceTaskId?: TaskId;
}
/**
 * Progress tracking for learning session
 */
export interface LearningProgress {
    readonly overallProgress: number;
    readonly objectiveProgress: Record<string, number>;
    readonly breakthroughs: readonly string[];
    readonly obstacles: readonly string[];
    readonly currentFocus: string;
}
/**
 * Specific learning outcome from session
 */
export interface LearningOutcome {
    readonly type: 'skill_improvement' | 'new_pattern' | 'knowledge_correction' | 'capability_unlock';
    readonly description: string;
    readonly confidence: number;
    readonly applicability: readonly string[];
    readonly verification: string;
}
/**
 * Metrics showing improvement from learning
 */
export interface LearningImprovementMetrics {
    readonly capabilityImprovements: Record<AgentCapabilityTypeEnum, number>;
    readonly performanceGains: PerformanceMetrics;
    readonly knowledgeRetention: number;
    readonly transferability: number;
}
/**
 * Abstract base class for all evolutionary agents
 * Defines core interface that all agents must implement
 */
export declare abstract class BaseEvolutionaryAgent<TCapabilities extends AgentCapabilities> {
    abstract readonly id: AgentInstanceId;
    abstract readonly type: AgentSpecializationEnum;
    abstract readonly capabilities: TCapabilities;
    abstract readonly dna: CodeDNA;
    abstract readonly memory: MemorySystem;
    abstract readonly state: AgentStateEnum;
    abstract readonly emotionalState: EmotionalState;
    abstract readonly currentTask?: TaskId;
    abstract readonly context: ProjectContext;
    abstract readonly createdAt: Date;
    abstract readonly lastActiveAt: Date;
    abstract readonly activationCount: number;
    /**
     * Learn from a completed task outcome
     */
    abstract learn(outcome: LearningOutcome): Promise<void>;
    /**
     * Adapt to a new project context
     */
    abstract adapt(context: ProjectContext): Promise<void>;
    /**
     * Evolve based on performance feedback
     */
    abstract evolve(feedback: PerformanceFeedback, parameters: EvolutionParameters): Promise<EvolutionResult>;
    /**
     * Execute a specific task
     */
    abstract executeTask(task: AgentTask): Promise<TaskResult>;
    /**
     * Communicate with user or other agents
     */
    abstract communicate(message: CommunicationMessage): Promise<CommunicationResponse>;
    /**
     * Reflect on recent performance and identify improvements
     */
    abstract reflect(): Promise<ReflectionResult>;
    /**
     * Share knowledge with another agent
     */
    abstract shareKnowledge(targetAgent: AgentInstanceId, topic: string): Promise<KnowledgeTransferResult>;
    /**
     * Update the agent's emotional state
     */
    abstract updateEmotionalState(changes: Partial<EmotionalState>): Promise<void>;
    /**
     * Change the agent's current state
     */
    abstract changeState(newState: AgentStateEnum, reason?: string): Promise<void>;
    /**
     * Get current performance metrics
     */
    abstract getPerformanceMetrics(): Promise<PerformanceMetrics>;
    /**
     * Get agent health and diagnostics
     */
    abstract getHealthStatus(): Promise<AgentHealth>;
}
/**
 * Task for agent execution
 */
export interface AgentTask {
    readonly id: TaskId;
    readonly type: AgentCapabilityTypeEnum;
    readonly description: string;
    readonly requirements: readonly string[];
    readonly context: ProjectContext;
    readonly priority: 'low' | 'medium' | 'high' | 'critical';
    readonly estimatedDuration: number;
    readonly deadline?: Date;
    readonly dependencies: readonly TaskId[];
    readonly resources: readonly string[];
    readonly successCriteria: readonly string[];
}
/**
 * Result of task execution
 */
export interface TaskResult {
    readonly success: boolean;
    readonly taskId: TaskId;
    readonly agentId: AgentInstanceId;
    readonly output: TaskOutput;
    readonly performance: PerformanceMetrics;
    readonly duration: number;
    readonly resourcesUsed: readonly string[];
    readonly errors: readonly AgentError[];
    readonly warnings: readonly string[];
    readonly learningPoints: readonly string[];
    readonly completedAt: Date;
}
/**
 * Output from task execution
 */
export interface TaskOutput {
    readonly type: 'code' | 'text' | 'analysis' | 'design' | 'test' | 'documentation';
    readonly content: string;
    readonly metadata: Record<string, unknown>;
    readonly artifacts: readonly Artifact[];
    readonly qualityScore: number;
    readonly confidence: number;
}
/**
 * Artifact produced by agent
 */
export interface Artifact {
    readonly id: string;
    readonly type: 'file' | 'test' | 'documentation' | 'configuration' | 'design';
    readonly name: string;
    readonly content: string;
    readonly path?: string;
    readonly language?: string;
    readonly size: number;
    readonly checksumn?: string;
}
/**
 * Communication message
 */
export interface CommunicationMessage {
    readonly id: string;
    readonly conversationId: ConversationId;
    readonly from: AgentInstanceId | 'user';
    readonly to: AgentInstanceId | 'user';
    readonly type: 'question' | 'answer' | 'request' | 'notification' | 'error' | 'status';
    readonly content: string;
    readonly context?: string;
    readonly urgency: 'low' | 'medium' | 'high' | 'critical';
    readonly timestamp: Date;
    readonly metadata: Record<string, unknown>;
}
/**
 * Response to communication
 */
export interface CommunicationResponse {
    readonly messageId: string;
    readonly responseType: 'acknowledgment' | 'answer' | 'clarification' | 'action_taken' | 'delegated';
    readonly content: string;
    readonly additionalActions: readonly string[];
    readonly followUpNeeded: boolean;
    readonly confidence: number;
    readonly timestamp: Date;
}
/**
 * Result of self-reflection
 */
export interface ReflectionResult {
    readonly agentId: AgentInstanceId;
    readonly reflectionPeriod: {
        readonly from: Date;
        readonly to: Date;
    };
    readonly insights: readonly Insight[];
    readonly performanceAssessment: PerformanceAssessment;
    readonly improvementPlan: ImprovementPlan;
    readonly emotionalInsights: readonly string[];
    readonly knowledgeGaps: readonly string[];
    readonly strengthsIdentified: readonly string[];
    readonly nextActions: readonly string[];
}
/**
 * Insight from reflection
 */
export interface Insight {
    readonly type: 'performance' | 'behavioral' | 'knowledge' | 'emotional' | 'strategic';
    readonly description: string;
    readonly importance: 'low' | 'medium' | 'high' | 'critical';
    readonly actionable: boolean;
    readonly relatedTasks: readonly TaskId[];
    readonly confidence: number;
}
/**
 * Self-assessment of performance
 */
export interface PerformanceAssessment {
    readonly overallRating: number;
    readonly strengthAreas: readonly string[];
    readonly improvementAreas: readonly string[];
    readonly compareToBaseline: number;
    readonly trendAnalysis: 'improving' | 'stable' | 'declining' | 'volatile';
    readonly contributingFactors: readonly string[];
}
/**
 * Plan for improvement
 */
export interface ImprovementPlan {
    readonly objectives: readonly string[];
    readonly actions: readonly ImprovementAction[];
    readonly timeline: string;
    readonly successMetrics: readonly string[];
    readonly resourcesNeeded: readonly string[];
    readonly risks: readonly string[];
    readonly mitigations: readonly string[];
}
/**
 * Specific improvement action
 */
export interface ImprovementAction {
    readonly id: string;
    readonly description: string;
    readonly type: 'learning' | 'practice' | 'collaboration' | 'experimentation' | 'reflection';
    readonly priority: 'low' | 'medium' | 'high' | 'critical';
    readonly estimatedEffort: number;
    readonly deadline?: Date;
    readonly dependencies: readonly string[];
    readonly successCriteria: readonly string[];
}
/**
 * Knowledge transfer result
 */
export interface KnowledgeTransferResult {
    readonly success: boolean;
    readonly fromAgent: AgentInstanceId;
    readonly toAgent: AgentInstanceId;
    readonly topic: string;
    readonly knowledgeTransferred: readonly string[];
    readonly transferEfficiency: number;
    readonly recipientConfidence: number;
    readonly timestamp: Date;
    readonly followUpRequired: boolean;
}
/**
 * Agent health and diagnostics
 */
export interface AgentHealth {
    readonly overall: 'healthy' | 'warning' | 'critical' | 'offline';
    readonly components: {
        readonly memory: ComponentHealth;
        readonly learning: ComponentHealth;
        readonly performance: ComponentHealth;
        readonly communication: ComponentHealth;
        readonly evolution: ComponentHealth;
    };
    readonly metrics: {
        readonly uptime: number;
        readonly responseTime: number;
        readonly errorRate: number;
        readonly resourceUtilization: number;
        readonly learningVelocity: number;
    };
    readonly issues: readonly HealthIssue[];
    readonly recommendations: readonly string[];
    readonly lastCheckup: Date;
}
/**
 * Individual component health
 */
export interface ComponentHealth {
    readonly status: 'healthy' | 'warning' | 'critical' | 'offline';
    readonly score: number;
    readonly lastUpdated: Date;
    readonly issues: readonly string[];
    readonly performance: number;
}
/**
 * Health issue
 */
export interface HealthIssue {
    readonly id: string;
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly component: string;
    readonly description: string;
    readonly impact: string;
    readonly recommendedAction: string;
    readonly detectedAt: Date;
    readonly isResolved: boolean;
}
/**
 * Agent error
 */
export interface AgentError {
    readonly id: string;
    readonly type: 'execution' | 'communication' | 'learning' | 'memory' | 'evolution';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly message: string;
    readonly context: string;
    readonly stackTrace?: string;
    readonly recoverable: boolean;
    readonly timestamp: Date;
    readonly resolved: boolean;
}
/**
 * Interface for agents specialized in code generation
 */
export interface CodeGeneratorAgent extends BaseEvolutionaryAgent<AgentCapabilities> {
    generateCode(specification: CodeSpecification): Promise<CodeGenerationResult>;
    reviewCode(code: string, context: ReviewContext): Promise<CodeReviewResult>;
    refactorCode(code: string, objectives: readonly string[]): Promise<RefactoringResult>;
}
/**
 * Interface for agents specialized in testing
 */
export interface TestingAgent extends BaseEvolutionaryAgent<AgentCapabilities> {
    generateTests(code: string, testType: TestType): Promise<TestGenerationResult>;
    executeTests(testSuite: TestSuite): Promise<TestExecutionResult>;
    analyzeTestCoverage(codebase: string, tests: readonly string[]): Promise<CoverageAnalysisResult>;
}
/**
 * Interface for agents specialized in project management
 */
export interface ProjectManagerAgent extends BaseEvolutionaryAgent<AgentCapabilities> {
    planProject(requirements: ProjectRequirements): Promise<ProjectPlan>;
    trackProgress(projectId: ProjectContextId): Promise<ProjectStatus>;
    optimizeWorkflow(currentWorkflow: Workflow): Promise<WorkflowOptimization>;
    manageCrisis(crisis: ProjectCrisis): Promise<CrisisResponse>;
}
export type ProjectRequirements = {
    readonly objectives: readonly string[];
    readonly constraints: readonly string[];
    readonly timeline: string;
    readonly resources: readonly string[];
};
export type ProjectPlan = {
    readonly phases: readonly ProjectPhase[];
    readonly milestones: readonly Milestone[];
    readonly timeline: string;
    readonly riskFactors: readonly string[];
};
export type ProjectPhase = {
    readonly id: string;
    readonly name: string;
    readonly duration: number;
    readonly dependencies: readonly string[];
    readonly deliverables: readonly string[];
};
export type Milestone = {
    readonly id: string;
    readonly name: string;
    readonly dueDate: Date;
    readonly criteria: readonly string[];
};
export type ProjectStatus = {
    readonly overallProgress: number;
    readonly currentPhase: string;
    readonly completedMilestones: number;
    readonly upcomingDeadlines: readonly Date[];
    readonly blockers: readonly string[];
};
export type Workflow = {
    readonly id: string;
    readonly steps: readonly WorkflowStep[];
    readonly efficiency: number;
    readonly bottlenecks: readonly string[];
};
export type WorkflowStep = {
    readonly id: string;
    readonly name: string;
    readonly duration: number;
    readonly dependencies: readonly string[];
};
export type WorkflowOptimization = {
    readonly improvedWorkflow: Workflow;
    readonly optimizations: readonly string[];
    readonly expectedImprovement: number;
};
export type ProjectCrisis = {
    readonly type: 'timeline' | 'budget' | 'quality' | 'resource';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly description: string;
    readonly impact: readonly string[];
};
export type CrisisResponse = {
    readonly strategy: string;
    readonly actions: readonly string[];
    readonly timeline: string;
    readonly resources: readonly string[];
};
export type CodeSpecification = {
    readonly requirements: readonly string[];
    readonly constraints: readonly string[];
    readonly language: string;
    readonly framework?: string;
    readonly style: string;
};
export type CodeGenerationResult = TaskResult & {
    readonly generatedCode: string;
    readonly explanation: string;
    readonly testSuggestions: readonly string[];
    readonly optimizationOpportunities: readonly string[];
};
export type ReviewContext = {
    readonly codebase: string;
    readonly focusAreas: readonly string[];
    readonly standards: readonly string[];
    readonly severity: 'minor' | 'major' | 'critical';
};
export type CodeReviewResult = {
    readonly overallScore: number;
    readonly issues: readonly CodeIssue[];
    readonly suggestions: readonly string[];
    readonly strengths: readonly string[];
    readonly securityConcerns: readonly string[];
    readonly performanceNotes: readonly string[];
};
export type CodeIssue = {
    readonly type: 'bug' | 'smell' | 'security' | 'performance' | 'style';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly description: string;
    readonly location: string;
    readonly suggestion: string;
    readonly autoFixable: boolean;
};
export type RefactoringResult = TaskResult & {
    readonly refactoredCode: string;
    readonly changes: readonly RefactoringChange[];
    readonly improvements: readonly string[];
    readonly risks: readonly string[];
};
export type RefactoringChange = {
    readonly type: 'rename' | 'extract' | 'inline' | 'move' | 'restructure';
    readonly description: string;
    readonly impact: 'low' | 'medium' | 'high';
    readonly reason: string;
};
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
export type TestGenerationResult = TaskResult & {
    readonly testCode: string;
    readonly testCases: readonly TestCase[];
    readonly coverageEstimate: number;
    readonly testStrategy: string;
};
export type TestCase = {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly type: TestType;
    readonly expectedResult: string;
    readonly testData: readonly unknown[];
    readonly priority: 'low' | 'medium' | 'high';
};
export type TestSuite = {
    readonly id: string;
    readonly name: string;
    readonly tests: readonly TestCase[];
    readonly configuration: Record<string, unknown>;
    readonly environment: string;
};
export type TestExecutionResult = {
    readonly success: boolean;
    readonly totalTests: number;
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
    readonly duration: number;
    readonly coverage: number;
    readonly failures: readonly TestFailure[];
    readonly performance: TestPerformanceMetrics;
};
export type TestFailure = {
    readonly testId: string;
    readonly reason: string;
    readonly expected: string;
    readonly actual: string;
    readonly stackTrace: string;
};
export type TestPerformanceMetrics = {
    readonly averageTestTime: number;
    readonly slowestTest: string;
    readonly fastestTest: string;
    readonly memoryUsage: number;
    readonly resourceUtilization: number;
};
export type CoverageAnalysisResult = {
    readonly overallCoverage: number;
    readonly lineCoverage: number;
    readonly branchCoverage: number;
    readonly functionCoverage: number;
    readonly uncoveredAreas: readonly string[];
    readonly recommendations: readonly string[];
    readonly riskAssessment: CoverageRiskAssessment;
};
export type CoverageRiskAssessment = {
    readonly overallRisk: 'low' | 'medium' | 'high' | 'critical';
    readonly riskFactors: readonly string[];
    readonly criticalUncoveredFunctions: readonly string[];
    readonly recommendations: readonly string[];
};
export type { CodeDNA, PerformanceMetrics, ProjectContext, PerformanceFeedback, GeneticMarkers, EvolutionParameters, EvolutionResult, } from './evolution';
//# sourceMappingURL=agents.d.ts.map