/**
 * Agent Interface System for Sentra Evolutionary Agent System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * Abstract base classes and interfaces for all evolutionary agent types
 */
// ============================================================================
// AGENT CAPABILITIES AND SPECIALIZATIONS
// ============================================================================
/**
 * Core agent capability types
 */
export const AgentCapabilityType = {
    // Code generation and modification
    CODE_GENERATION: 'code_generation',
    CODE_REVIEW: 'code_review',
    CODE_REFACTORING: 'code_refactoring',
    CODE_DEBUGGING: 'code_debugging',
    // Testing and quality assurance
    TEST_GENERATION: 'test_generation',
    TEST_EXECUTION: 'test_execution',
    QUALITY_ANALYSIS: 'quality_analysis',
    PERFORMANCE_OPTIMIZATION: 'performance_optimization',
    // Documentation and communication
    DOCUMENTATION_WRITING: 'documentation_writing',
    API_DOCUMENTATION: 'api_documentation',
    USER_COMMUNICATION: 'user_communication',
    TECHNICAL_EXPLANATION: 'technical_explanation',
    // Architecture and design
    SYSTEM_DESIGN: 'system_design',
    DATABASE_DESIGN: 'database_design',
    API_DESIGN: 'api_design',
    SECURITY_ANALYSIS: 'security_analysis',
    // Learning and adaptation
    PATTERN_RECOGNITION: 'pattern_recognition',
    ERROR_ANALYSIS: 'error_analysis',
    KNOWLEDGE_TRANSFER: 'knowledge_transfer',
    CONTINUOUS_LEARNING: 'continuous_learning',
    // Collaboration and coordination
    PROJECT_COORDINATION: 'project_coordination',
    TEAM_COMMUNICATION: 'team_communication',
    CONFLICT_RESOLUTION: 'conflict_resolution',
    STAKEHOLDER_MANAGEMENT: 'stakeholder_management',
};
/**
 * Agent specialization profiles
 */
export const AgentSpecialization = {
    FULL_STACK_DEVELOPER: 'full_stack_developer',
    BACKEND_SPECIALIST: 'backend_specialist',
    FRONTEND_SPECIALIST: 'frontend_specialist',
    DEVOPS_ENGINEER: 'devops_engineer',
    DATA_ENGINEER: 'data_engineer',
    SECURITY_SPECIALIST: 'security_specialist',
    ARCHITECTURE_CONSULTANT: 'architecture_consultant',
    QA_SPECIALIST: 'qa_specialist',
    TECHNICAL_WRITER: 'technical_writer',
    PROJECT_MANAGER: 'project_manager',
    AI_ML_SPECIALIST: 'ai_ml_specialist',
    GENERALIST: 'generalist',
};
// ============================================================================
// AGENT MEMORY AND LEARNING SYSTEMS
// ============================================================================
/**
 * Types of memories agents can store
 */
export const MemoryType = {
    EPISODIC: 'episodic', // Specific events and experiences
    SEMANTIC: 'semantic', // General knowledge and facts
    PROCEDURAL: 'procedural', // How to perform tasks
    WORKING: 'working', // Short-term active memory
    ASSOCIATIVE: 'associative', // Connections between concepts
    EMOTIONAL: 'emotional', // Emotional context and responses
};
// ============================================================================
// AGENT STATES AND EMOTIONS
// ============================================================================
/**
 * Current state of the agent
 */
export const AgentState = {
    IDLE: 'idle',
    THINKING: 'thinking',
    CODING: 'coding',
    LEARNING: 'learning',
    DEBUGGING: 'debugging',
    COLLABORATING: 'collaborating',
    EVOLVING: 'evolving',
    ERROR_RECOVERY: 'error_recovery',
    RESTING: 'resting',
};
// ============================================================================
// ABSTRACT BASE AGENT CLASS
// ============================================================================
/**
 * Abstract base class for all evolutionary agents
 * Defines core interface that all agents must implement
 */
export class BaseEvolutionaryAgent {
}
//# sourceMappingURL=agents.js.map