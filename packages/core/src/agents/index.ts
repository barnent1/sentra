/**
 * Sentra Evolutionary Agent System - Agent Exports
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */

// Base agent class and interfaces
export { BaseEvolutionaryAgent } from './base-agent';
export type { 
  LearningOutcome, 
  TaskExecutionContext, 
  AgentExecutionResult 
} from './base-agent';

// Specialized agent implementations
export { OrchestratorAgent } from './orchestrator-agent';
export { DeveloperAgent } from './developer-agent';

// Agent factory and management
export { AgentFactory } from './agent-factory';
export { AgentManager } from './agent-manager';

// Re-export types for convenience
export type {
  AgentInstanceId,
  AgentType,
  AgentStatus,
  AgentCapabilities,
  CodeDNA,
} from '@sentra/types';