/**
 * Agent Factory - Creates and configures specialized evolutionary agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import type { AgentInstanceId, AgentType, EvolutionDnaId, ProjectContext, EnhancedGeneticMarkers, EnhancedPerformanceMetrics } from '@sentra/types';
import { BaseEvolutionaryAgent } from './base-agent';
/**
 * Agent creation configuration
 */
export interface AgentCreationConfig {
    readonly type: AgentType;
    readonly specialization?: string;
    readonly projectContext: ProjectContext;
    readonly parentDnaId?: EvolutionDnaId;
    readonly customGenetics?: Partial<EnhancedGeneticMarkers>;
    readonly customPerformance?: Partial<EnhancedPerformanceMetrics>;
}
/**
 * Agent spawn result
 */
export interface AgentSpawnResult {
    readonly success: boolean;
    readonly agent?: BaseEvolutionaryAgent;
    readonly error?: string;
    readonly metadata: {
        readonly agentId: AgentInstanceId;
        readonly dnaId: EvolutionDnaId;
        readonly type: AgentType;
        readonly spawnTime: Date;
    };
}
/**
 * Factory for creating specialized evolutionary agents
 */
export declare class AgentFactory {
    private readonly agentRegistry;
    private spawnCount;
    constructor();
    /**
     * Register built-in agent types
     */
    private registerBuiltInAgents;
    /**
     * Spawn a new agent instance
     */
    spawnAgent(config: AgentCreationConfig): Promise<AgentSpawnResult>;
    /**
     * Generate optimized DNA for specific agent type
     */
    private generateAgentDNA;
    /**
     * Get optimal genetics for specific agent type
     */
    private getOptimalGeneticsForType;
    /**
     * Get expected performance metrics for agent type
     */
    private getExpectedPerformanceForType;
    /**
     * Get agent class constructor
     */
    private getAgentClass;
    /**
     * Generate embedding for agent DNA
     */
    private generateEmbedding;
    /**
     * Simple string hash function
     */
    private hashString;
    /**
     * Calculate initial fitness score
     */
    private calculateInitialFitness;
    /**
     * Get pattern type for agent
     */
    private getPatternTypeForAgent;
    /**
     * Get strengths for agent type
     */
    private getStrengthsForType;
    /**
     * Get weaknesses for agent type
     */
    private getWeaknessesForType;
    /**
     * Get recommended contexts for agent type
     */
    private getRecommendedContexts;
    /**
     * Get contexts to avoid for agent type
     */
    private getAvoidContexts;
    /**
     * Register a custom agent type
     */
    registerAgentType(type: AgentType, agentClass: typeof BaseEvolutionaryAgent): void;
    /**
     * Get available agent types
     */
    getAvailableTypes(): readonly AgentType[];
    /**
     * Get factory statistics
     */
    getStats(): {
        readonly registeredTypes: number;
        readonly totalSpawned: number;
        readonly availableTypes: readonly AgentType[];
    };
}
export default AgentFactory;
//# sourceMappingURL=agent-factory.d.ts.map