/**
 * Agent Factory - Creates and configures specialized evolutionary agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { OrchestratorAgent } from './orchestrator-agent';
import { DeveloperAgent } from './developer-agent';
/**
 * Factory for creating specialized evolutionary agents
 */
export class AgentFactory {
    agentRegistry = new Map();
    spawnCount = 0;
    constructor() {
        this.registerBuiltInAgents();
    }
    /**
     * Register built-in agent types
     */
    registerBuiltInAgents() {
        this.agentRegistry.set('orchestrator', OrchestratorAgent);
        this.agentRegistry.set('developer', DeveloperAgent);
        // Add more agent types as they're implemented:
        // this.agentRegistry.set('tester', TesterAgent);
        // this.agentRegistry.set('reviewer', ReviewerAgent);
        // this.agentRegistry.set('analyst', AnalystAgent);
        // this.agentRegistry.set('designer', DesignerAgent);
    }
    /**
     * Spawn a new agent instance
     */
    async spawnAgent(config) {
        try {
            const agentId = `agent_${config.type}_${Date.now()}_${this.spawnCount++}`;
            const dna = this.generateAgentDNA(config, agentId);
            const AgentClass = this.getAgentClass(config.type);
            const agent = AgentClass === OrchestratorAgent ? new OrchestratorAgent(agentId, dna) : new DeveloperAgent(agentId, dna);
            return {
                success: true,
                agent,
                metadata: {
                    agentId,
                    dnaId: dna.id,
                    type: config.type,
                    spawnTime: new Date(),
                },
            };
        }
        catch (error) {
            const agentId = `failed_${config.type}_${Date.now()}`;
            const dnaId = `failed_dna_${Date.now()}`;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown spawn error',
                metadata: {
                    agentId,
                    dnaId,
                    type: config.type,
                    spawnTime: new Date(),
                },
            };
        }
    }
    /**
     * Generate optimized DNA for specific agent type
     */
    generateAgentDNA(config, _agentId) {
        const baseGenetics = this.getOptimalGeneticsForType(config.type);
        const basePerformance = this.getExpectedPerformanceForType(config.type);
        // Apply customizations if provided
        const genetics = {
            ...baseGenetics,
            ...config.customGenetics,
        };
        const performance = {
            ...basePerformance,
            ...config.customPerformance,
        };
        const dnaId = `dna_${config.type}_${Date.now()}`;
        const baseDna = {
            id: dnaId,
            patternType: this.getPatternTypeForAgent(config.type),
            context: config.projectContext,
            genetics,
            performance,
            mutations: [],
            embedding: this.generateEmbedding(config.type, config.projectContext),
            timestamp: new Date(),
            generation: 0,
            birthContext: {
                trigger: 'agent_spawn',
                creationReason: `Spawned ${config.type} agent for ${config.projectContext.projectType} project`,
                initialPerformance: performance,
            },
            evolutionHistory: [],
            activationCount: 0,
            lastActivation: new Date(),
            fitnessScore: this.calculateInitialFitness(genetics, performance),
            viabilityAssessment: {
                overallScore: 0.8, // Default viability
                strengths: this.getStrengthsForType(config.type),
                weaknesses: this.getWeaknessesForType(config.type),
                recommendedContexts: this.getRecommendedContexts(config.type),
                avoidContexts: this.getAvoidContexts(config.type),
                lastAssessment: new Date(),
                confidenceLevel: 0.8,
            },
            reproductionPotential: 0.7, // Default reproduction potential
            tags: [config.type, config.projectContext.projectType, config.projectContext.complexity],
            notes: `Auto-generated ${config.type} agent DNA`,
            isArchived: false,
        };
        // Add parentId only if provided
        return config.parentDnaId
            ? { ...baseDna, parentId: config.parentDnaId }
            : baseDna;
    }
    /**
     * Get optimal genetics for specific agent type
     */
    getOptimalGeneticsForType(type) {
        const baseGenetics = {
            // Base genetics from GeneticMarkers
            complexity: 0.7,
            adaptability: 0.8,
            successRate: 0.85,
            transferability: 0.7,
            stability: 0.8,
            novelty: 0.5,
            // Enhanced genetics
            patternRecognition: 0.8,
            errorRecovery: 0.8,
            communicationClarity: 0.8,
            learningVelocity: 0.7,
            resourceEfficiency: 0.7,
            collaborationAffinity: 0.7,
            riskTolerance: 0.5,
            thoroughness: 0.8,
            creativity: 0.6,
            persistence: 0.8,
            empathy: 0.6,
            pragmatism: 0.7,
        };
        // Specialize genetics based on agent type
        switch (type) {
            case 'orchestrator':
                return {
                    ...baseGenetics,
                    complexity: 0.9,
                    adaptability: 0.9,
                    patternRecognition: 0.95,
                    thoroughness: 0.95,
                    pragmatism: 0.9,
                    collaborationAffinity: 0.9,
                    riskTolerance: 0.3, // Conservative approach
                };
            case 'developer':
                return {
                    ...baseGenetics,
                    complexity: 0.8,
                    thoroughness: 0.9,
                    patternRecognition: 0.85,
                    resourceEfficiency: 0.8,
                    persistence: 0.9,
                    creativity: 0.7,
                    pragmatism: 0.8,
                };
            case 'tester':
                return {
                    ...baseGenetics,
                    thoroughness: 0.95,
                    patternRecognition: 0.9,
                    errorRecovery: 0.9,
                    riskTolerance: 0.2, // Very conservative
                    persistence: 0.9,
                    pragmatism: 0.9,
                };
            case 'reviewer':
                return {
                    ...baseGenetics,
                    patternRecognition: 0.95,
                    thoroughness: 0.9,
                    communicationClarity: 0.9,
                    empathy: 0.8,
                    pragmatism: 0.8,
                };
            case 'analyst':
                return {
                    ...baseGenetics,
                    complexity: 0.9,
                    patternRecognition: 0.95,
                    thoroughness: 0.9,
                    communicationClarity: 0.9,
                    learningVelocity: 0.8,
                };
            case 'designer':
                return {
                    ...baseGenetics,
                    creativity: 0.9,
                    empathy: 0.9,
                    communicationClarity: 0.85,
                    patternRecognition: 0.8,
                    novelty: 0.8,
                };
            default:
                return baseGenetics;
        }
    }
    /**
     * Get expected performance metrics for agent type
     */
    getExpectedPerformanceForType(type) {
        const basePerformance = {
            successRate: 0.85,
            averageTaskCompletionTime: 15000, // 15 seconds
            codeQualityScore: 0.8,
            userSatisfactionRating: 0.8,
            adaptationSpeed: 0.7,
            errorRecoveryRate: 0.8,
            knowledgeRetention: 0.8,
            crossDomainTransfer: 0.6,
            computationalEfficiency: 0.7,
            responseLatency: 2000, // 2 seconds
            throughput: 1,
            resourceUtilization: 0.6,
            bugIntroductionRate: 0.1,
            testCoverage: 0.9,
            documentationQuality: 0.8,
            maintainabilityScore: 0.8,
            communicationEffectiveness: 0.8,
            teamIntegration: 0.7,
            feedbackIncorporation: 0.7,
            conflictResolution: 0.7,
        };
        // Specialize performance based on agent type
        switch (type) {
            case 'orchestrator':
                return {
                    ...basePerformance,
                    successRate: 0.95,
                    averageTaskCompletionTime: 30000, // Longer due to coordination
                    codeQualityScore: 0.95, // High standards
                    testCoverage: 1.0, // Perfect coverage required
                    communicationEffectiveness: 0.95,
                    teamIntegration: 0.95,
                };
            case 'developer':
                return {
                    ...basePerformance,
                    successRate: 0.9,
                    codeQualityScore: 0.9,
                    testCoverage: 1.0, // Always comprehensive tests
                    maintainabilityScore: 0.9,
                    bugIntroductionRate: 0.05, // Very low
                };
            case 'tester':
                return {
                    ...basePerformance,
                    successRate: 0.95,
                    testCoverage: 1.0, // Perfect testing
                    bugIntroductionRate: 0.02, // Extremely low
                    errorRecoveryRate: 0.95,
                };
            case 'reviewer':
                return {
                    ...basePerformance,
                    successRate: 0.9,
                    codeQualityScore: 0.95, // Excellent at assessing quality
                    communicationEffectiveness: 0.9,
                    feedbackIncorporation: 0.9,
                };
            case 'analyst':
                return {
                    ...basePerformance,
                    successRate: 0.9,
                    documentationQuality: 0.95,
                    communicationEffectiveness: 0.9,
                    knowledgeRetention: 0.9,
                };
            case 'designer':
                return {
                    ...basePerformance,
                    successRate: 0.85,
                    userSatisfactionRating: 0.9, // High user focus
                    communicationEffectiveness: 0.9,
                    adaptationSpeed: 0.8,
                };
            default:
                return basePerformance;
        }
    }
    /**
     * Get agent class constructor
     */
    getAgentClass(type) {
        const AgentClass = this.agentRegistry.get(type);
        if (!AgentClass) {
            throw new Error(`Agent type '${type}' not registered. Available types: ${Array.from(this.agentRegistry.keys()).join(', ')}`);
        }
        return AgentClass;
    }
    /**
     * Generate embedding for agent DNA
     */
    generateEmbedding(type, context) {
        // Generate contextual embedding based on agent type and project context
        const embedding = new Array(1536).fill(0);
        // Add type-specific patterns
        const typeHash = this.hashString(type);
        for (let i = 0; i < 100; i++) {
            embedding[i] = Math.sin(typeHash + i) * 0.5;
        }
        // Add context-specific patterns
        const contextHash = this.hashString(context.projectType + context.complexity);
        for (let i = 100; i < 200; i++) {
            embedding[i] = Math.cos(contextHash + i) * 0.3;
        }
        // Add random noise for uniqueness
        for (let i = 200; i < 1536; i++) {
            embedding[i] = (Math.random() - 0.5) * 0.1;
        }
        return Object.freeze(embedding);
    }
    /**
     * Simple string hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    /**
     * Calculate initial fitness score
     */
    calculateInitialFitness(genetics, performance) {
        const geneticsScore = Object.values(genetics).reduce((sum, val) => sum + val, 0) / Object.keys(genetics).length;
        const performanceScore = performance.successRate * 0.4 + performance.codeQualityScore * 0.3 + performance.userSatisfactionRating * 0.3;
        return (geneticsScore * 0.4 + performanceScore * 0.6);
    }
    /**
     * Get pattern type for agent
     */
    getPatternTypeForAgent(type) {
        const patterns = {
            orchestrator: 'coordination',
            developer: 'implementation',
            tester: 'validation',
            reviewer: 'assessment',
            analyst: 'analysis',
            designer: 'creative',
        };
        return patterns[type] || 'general';
    }
    /**
     * Get strengths for agent type
     */
    getStrengthsForType(type) {
        const strengths = {
            orchestrator: ['Task coordination', 'Quality assurance', 'Strategic planning'],
            developer: ['Code implementation', 'Technical problem solving', 'Documentation'],
            tester: ['Quality validation', 'Edge case identification', 'Test automation'],
            reviewer: ['Code analysis', 'Best practice enforcement', 'Mentoring'],
            analyst: ['Requirements analysis', 'Technical research', 'Documentation'],
            designer: ['User experience', 'Visual design', 'Accessibility'],
        };
        return strengths[type] || ['General problem solving'];
    }
    /**
     * Get weaknesses for agent type
     */
    getWeaknessesForType(type) {
        const weaknesses = {
            orchestrator: ['Direct implementation', 'Rapid prototyping'],
            developer: ['High-level strategy', 'User experience design'],
            tester: ['Creative problem solving', 'Rapid development'],
            reviewer: ['Rapid implementation', 'Experimental approaches'],
            analyst: ['Rapid execution', 'Creative solutions'],
            designer: ['Technical implementation', 'Performance optimization'],
        };
        return weaknesses[type] || ['Specialized domains'];
    }
    /**
     * Get recommended contexts for agent type
     */
    getRecommendedContexts(type) {
        const contexts = {
            orchestrator: ['enterprise', 'high', 'complex projects'],
            developer: ['api', 'web-app', 'library', 'implementation'],
            tester: ['quality-critical', 'production', 'enterprise'],
            reviewer: ['team projects', 'production', 'mentoring'],
            analyst: ['research', 'planning', 'requirements'],
            designer: ['web-app', 'user-facing', 'frontend'],
        };
        return contexts[type] || ['general'];
    }
    /**
     * Get contexts to avoid for agent type
     */
    getAvoidContexts(type) {
        const avoidContexts = {
            orchestrator: ['simple', 'rapid prototyping'],
            developer: ['pure design', 'high-level strategy'],
            tester: ['creative exploration', 'rapid prototyping'],
            reviewer: ['emergency fixes', 'rapid prototyping'],
            analyst: ['implementation deadlines', 'rapid execution'],
            designer: ['backend', 'low-level systems'],
        };
        return avoidContexts[type] || [];
    }
    /**
     * Register a custom agent type
     */
    registerAgentType(type, agentClass) {
        this.agentRegistry.set(type, agentClass);
    }
    /**
     * Get available agent types
     */
    getAvailableTypes() {
        return Object.freeze(Array.from(this.agentRegistry.keys()));
    }
    /**
     * Get factory statistics
     */
    getStats() {
        return {
            registeredTypes: this.agentRegistry.size,
            totalSpawned: this.spawnCount,
            availableTypes: this.getAvailableTypes(),
        };
    }
}
export default AgentFactory;
//# sourceMappingURL=agent-factory.js.map