// Sentra Evolutionary Agent System - Core Package
// Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
/**
 * Core evolutionary agent class following strict TypeScript patterns
 */
export class EvolutionaryAgent {
    config;
    dna;
    constructor(config, dna) {
        this.config = config;
        this.dna = dna;
    }
    getId = () => {
        return this.config.id;
    };
    getName = () => {
        return this.config.name;
    };
    getSpecialization = () => {
        return this.config.specialization;
    };
    getCapabilities = () => {
        return this.config.capabilities;
    };
    getDnaId = () => {
        return this.dna.id;
    };
    getGeneration = () => {
        return this.dna.generation;
    };
    isActive = () => {
        return this.config.isActive;
    };
    /**
     * Process a task using the agent's evolutionary capabilities
     */
    processTask = async (task) => {
        try {
            // Basic task processing logic - to be expanded in later epics
            if (!this.config.isActive) {
                return {
                    success: false,
                    error: {
                        code: 'AGENT_INACTIVE',
                        message: `Agent ${this.config.name} is not active`,
                    },
                    timestamp: new Date(),
                };
            }
            // Simulate task processing based on agent capabilities
            const canHandle = this.config.capabilities.some(capability => task.description.toLowerCase().includes(capability.toLowerCase()));
            if (!canHandle) {
                return {
                    success: false,
                    error: {
                        code: 'CAPABILITY_MISMATCH',
                        message: `Agent ${this.config.name} lacks required capabilities for this task`,
                    },
                    timestamp: new Date(),
                };
            }
            // Return success response
            return {
                success: true,
                data: {
                    ...task,
                    status: 'in_progress',
                    assignedAgentId: this.config.id,
                    updatedAt: new Date(),
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'PROCESSING_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    details: error,
                },
                timestamp: new Date(),
            };
        }
    };
}
/**
 * Factory function for creating evolutionary agents with proper type safety
 */
export const createEvolutionaryAgent = (config, dna) => {
    return new EvolutionaryAgent(config, dna);
};
/**
 * Utility functions for evolutionary system
 */
export var EvolutionUtils;
(function (EvolutionUtils) {
    /**
     * Calculate similarity between two DNA profiles using vector operations
     */
    EvolutionUtils.calculateDnaSimilarity = (dna1, dna2) => {
        if (!dna1.embedding || !dna2.embedding) {
            return 0;
        }
        // Cosine similarity calculation
        const dotProduct = dna1.embedding.reduce((sum, val, idx) => sum + val * (dna2.embedding?.[idx] ?? 0), 0);
        const magnitude1 = Math.sqrt(dna1.embedding.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(dna2.embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    };
    /**
     * Generate next generation DNA based on performance metrics
     */
    EvolutionUtils.evolveGeneticMarkers = (parentDna, performanceImprovement) => {
        const { genetics } = parentDna;
        return {
            complexity: Math.min(1.0, genetics.complexity * (1 + performanceImprovement * 0.05)),
            adaptability: Math.min(1.0, genetics.adaptability * (1 + performanceImprovement * 0.1)),
            successRate: Math.min(1.0, genetics.successRate * (1 + performanceImprovement * 0.15)),
            transferability: Math.min(1.0, genetics.transferability * (1 + performanceImprovement * 0.05)),
            stability: Math.min(1.0, genetics.stability * (1 + performanceImprovement * 0.08)),
            novelty: Math.min(1.0, genetics.novelty * (1 + performanceImprovement * 0.03)),
        };
    };
})(EvolutionUtils || (EvolutionUtils = {}));
// Export database functionality
export * from './db';
// Export comprehensive type system
export * from './types';
// Export DNA Evolution Engine
export * from './dna';
// Export Evolution Integration System - Complete DNA evolution integration with project management
export { 
// Main orchestrator
EvolutionOrchestrator, 
// Core services
EvolutionIntegrationService, PatternMatchingService, VectorOperations, EvolutionMetricsService, EvolutionWebSocketBridge, KnowledgeTransferService, EvolutionWebSocketMessageType, } from './evolution';
// Export Vector Database Integration (EPIC 5) - selective exports to avoid conflicts
export { EvolutionVectorStore, EmbeddingService, PatternSearchEngine, RelevanceScorer, SearchCache, VectorDatabaseService, createVectorDatabaseService, createTestVectorDatabaseService, PerformanceMonitor, OperationType, RankingAlgorithm, } from './storage';
// Export TMUX Session Management System - comprehensive session management with grid layout
export { 
// Core TMUX classes
TMUXSessionManager, GridLayoutManager, SessionScalingManager, WebSocketManager, SessionPersistenceManager, CLIIntegration, 
// Factory functions
createTMUXSystem, createDefaultSessionManagerConfig, createDefaultScalingConfig, createDefaultPersistenceConfig, 
// Utility functions
validateTMUXSystemConfig, getTMUXSystemHealth, cleanupTMUXSystem, 
// Constants and module info
TMUX_MODULE_INFO, } from './tmux';
//# sourceMappingURL=index.js.map