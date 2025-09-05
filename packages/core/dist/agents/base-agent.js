/**
 * Base Evolutionary Agent - Abstract foundation for all specialized agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
/**
 * Abstract base class for all evolutionary agents
 */
export class BaseEvolutionaryAgent extends EventEmitter {
    id;
    dnaId;
    dna;
    status = 'active';
    spawnedAt;
    lastActiveAt;
    performanceHistory = [];
    currentTaskId;
    // Learning and adaptation tracking
    learningOutcomes = [];
    adaptationCount = 0;
    totalTasksCompleted = 0;
    constructor(id, dna, capabilities) {
        super();
        this.id = id;
        this.dnaId = dna.id;
        this.dna = dna;
        this.spawnedAt = new Date();
        this.lastActiveAt = new Date();
        // Validate capabilities match agent type
        this.validateCapabilities(capabilities);
        // Set up event listeners for learning
        this.setupLearningHandlers();
    }
    /**
     * Get agent identifier
     */
    getId() {
        return this.id;
    }
    /**
     * Get current agent status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Get agent DNA
     */
    getDNA() {
        return this.dna;
    }
    /**
     * Update agent DNA (evolutionary process)
     */
    async evolveDNA(newDNA) {
        const oldDNA = this.dna;
        this.dna = newDNA;
        this.adaptationCount++;
        this.emit('dna_evolved', {
            agentId: this.id,
            oldDNA,
            newDNA,
            adaptationCount: this.adaptationCount,
        });
    }
    /**
     * Learn from task execution outcome
     */
    async learn(outcome) {
        this.learningOutcomes = [...this.learningOutcomes, outcome];
        // Update performance history
        this.performanceHistory = [...this.performanceHistory, outcome.performanceMetrics];
        // Keep only last 100 performance records
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }
        // Analyze patterns and adapt if needed
        await this.analyzeLearningPatterns();
        this.emit('learning_completed', {
            agentId: this.id,
            outcome,
            totalOutcomes: this.learningOutcomes.length,
        });
    }
    /**
     * Adapt behavior based on project context
     */
    async adaptToContext(context) {
        // Analyze how well current DNA fits the context
        const contextFitScore = this.calculateContextFit(context);
        if (contextFitScore < 0.7) {
            // Request DNA evolution to better fit context
            this.emit('adaptation_needed', {
                agentId: this.id,
                context,
                currentFitScore: contextFitScore,
                reason: 'Low context fit score',
            });
        }
        // Update last active timestamp
        this.lastActiveAt = new Date();
    }
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        if (this.performanceHistory.length === 0) {
            return {
                averageSuccessRate: 0,
                averageExecutionTime: 0,
                totalTasksCompleted: 0,
                adaptationCount: this.adaptationCount,
                recentPerformanceTrend: 'stable',
                contextFitScore: 0.5,
            };
        }
        const recent = this.performanceHistory.slice(-10);
        const averageSuccessRate = recent.reduce((sum, p) => sum + p.successRate, 0) / recent.length;
        const averageExecutionTime = recent.reduce((sum, p) => sum + p.averageTaskCompletionTime, 0) / recent.length;
        // Calculate performance trend
        let trend = 'stable';
        if (recent.length >= 5) {
            const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
            const secondHalf = recent.slice(Math.floor(recent.length / 2));
            const firstAvg = firstHalf.reduce((sum, p) => sum + p.successRate, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, p) => sum + p.successRate, 0) / secondHalf.length;
            if (secondAvg > firstAvg + 0.05)
                trend = 'improving';
            else if (secondAvg < firstAvg - 0.05)
                trend = 'declining';
        }
        return {
            averageSuccessRate,
            averageExecutionTime,
            totalTasksCompleted: this.totalTasksCompleted,
            adaptationCount: this.adaptationCount,
            recentPerformanceTrend: trend,
            contextFitScore: this.calculateCurrentContextFit(),
        };
    }
    /**
     * Activate agent for task execution
     */
    async activate(taskId) {
        if (this.status !== 'active') {
            throw new Error(`Agent ${this.id} is not in active status (current: ${this.status})`);
        }
        this.currentTaskId = taskId;
        this.lastActiveAt = new Date();
        this.emit('agent_activated', {
            agentId: this.id,
            taskId,
            timestamp: new Date(),
        });
    }
    /**
     * Deactivate agent after task completion
     */
    async deactivate() {
        const completedTaskId = this.currentTaskId;
        delete this.currentTaskId;
        this.totalTasksCompleted++;
        this.emit('agent_deactivated', {
            agentId: this.id,
            completedTaskId,
            totalCompleted: this.totalTasksCompleted,
            timestamp: new Date(),
        });
    }
    /**
     * Terminate agent (mark as archived)
     */
    async terminate(reason) {
        this.status = 'archived';
        this.emit('agent_terminated', {
            agentId: this.id,
            reason,
            finalStats: this.getPerformanceStats(),
            timestamp: new Date(),
        });
    }
    /**
     * Validate agent capabilities against requirements
     */
    validateCapabilities(capabilities) {
        // Basic validation - specialized agents can override
        if (!capabilities || typeof capabilities !== 'object') {
            throw new Error(`Invalid capabilities for agent ${this.id}`);
        }
    }
    /**
     * Set up learning event handlers
     */
    setupLearningHandlers() {
        this.on('task_completed', this.handleTaskCompletion.bind(this));
        this.on('task_failed', this.handleTaskFailure.bind(this));
    }
    /**
     * Handle task completion event
     */
    async handleTaskCompletion(event) {
        const outcome = {
            taskId: event.taskId,
            success: true,
            performanceMetrics: event.result.performanceMetrics,
            lessonsLearned: ['Task completed successfully'],
            contextFactors: [],
            timestamp: new Date(),
        };
        await this.learn(outcome);
    }
    /**
     * Handle task failure event
     */
    async handleTaskFailure(event) {
        const outcome = {
            taskId: event.taskId,
            success: false,
            performanceMetrics: this.createFailureMetrics(),
            lessonsLearned: event.errors,
            contextFactors: ['task_failure'],
            timestamp: new Date(),
        };
        await this.learn(outcome);
    }
    /**
     * Calculate how well agent fits a project context
     */
    calculateContextFit(context) {
        // Base implementation - can be overridden by specialized agents
        const genetics = this.dna.genetics;
        let fitScore = 0;
        // Complexity match
        const contextComplexityMap = {
            'low': 0.2,
            'medium': 0.5,
            'high': 0.8,
            'enterprise': 1.0,
            'research': 1.0,
        };
        const contextComplexity = contextComplexityMap[context.complexity];
        const complexityDiff = Math.abs(genetics.complexity - contextComplexity);
        fitScore += (1 - complexityDiff) * 0.3;
        // Adaptability for context
        fitScore += genetics.adaptability * 0.3;
        // Success rate potential
        fitScore += genetics.successRate * 0.4;
        return Math.min(1, Math.max(0, fitScore));
    }
    /**
     * Calculate current context fit (if context is available)
     */
    calculateCurrentContextFit() {
        // Use DNA's project context for current fit calculation
        return this.calculateContextFit(this.dna.context);
    }
    /**
     * Analyze learning patterns and trigger adaptations
     */
    async analyzeLearningPatterns() {
        if (this.learningOutcomes.length < 10)
            return; // Need enough data
        const recent = this.learningOutcomes.slice(-10);
        const successRate = recent.filter(o => o.success).length / recent.length;
        // If performance is declining, request evolution
        if (successRate < 0.6) {
            this.emit('evolution_requested', {
                agentId: this.id,
                reason: `Performance declining (${(successRate * 100).toFixed(1)}% success rate)`,
                currentPerformance: successRate,
                recommendedChanges: this.generateEvolutionRecommendations(recent),
            });
        }
    }
    /**
     * Generate evolution recommendations based on learning outcomes
     */
    generateEvolutionRecommendations(outcomes) {
        const recommendations = [];
        const failures = outcomes.filter(o => !o.success);
        if (failures.length > outcomes.length * 0.4) {
            recommendations.push('Improve error handling and recovery mechanisms');
            recommendations.push('Increase thoroughness in task analysis');
        }
        const avgExecutionTime = outcomes.reduce((sum, o) => sum + o.performanceMetrics.averageTaskCompletionTime, 0) / outcomes.length;
        if (avgExecutionTime > 30000) { // 30 seconds
            recommendations.push('Optimize for faster execution');
            recommendations.push('Improve resource efficiency');
        }
        return recommendations;
    }
    /**
     * Create failure performance metrics
     */
    createFailureMetrics() {
        return {
            successRate: 0,
            averageTaskCompletionTime: 0,
            codeQualityScore: 0,
            userSatisfactionRating: 0,
            adaptationSpeed: this.dna.performance.adaptationSpeed,
            errorRecoveryRate: 0,
            knowledgeRetention: this.dna.performance.knowledgeRetention,
            crossDomainTransfer: this.dna.performance.crossDomainTransfer,
            computationalEfficiency: 0,
            responseLatency: Infinity,
            throughput: 0,
            resourceUtilization: 1, // High utilization during failure
            bugIntroductionRate: 1, // Complete failure
            testCoverage: 0,
            documentationQuality: 0,
            maintainabilityScore: 0,
            communicationEffectiveness: 0,
            teamIntegration: this.dna.performance.teamIntegration,
            feedbackIncorporation: this.dna.performance.feedbackIncorporation,
            conflictResolution: this.dna.performance.conflictResolution,
        };
    }
}
export default BaseEvolutionaryAgent;
//# sourceMappingURL=base-agent.js.map