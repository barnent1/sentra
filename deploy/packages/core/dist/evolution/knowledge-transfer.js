/**
 * Knowledge Transfer System for Cross-Project Agent Learning
 *
 * This system enables intelligent pattern sharing and knowledge transfer
 * between agents working on different projects, facilitating collective learning.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
export const KnowledgeType = {
    PROBLEM_SOLVING_PATTERN: 'problem_solving_pattern',
    ERROR_RECOVERY_STRATEGY: 'error_recovery_strategy',
    OPTIMIZATION_TECHNIQUE: 'optimization_technique',
    COLLABORATION_APPROACH: 'collaboration_approach',
    ADAPTATION_STRATEGY: 'adaptation_strategy',
    PERFORMANCE_INSIGHT: 'performance_insight',
    CONTEXT_UNDERSTANDING: 'context_understanding',
    RESOURCE_MANAGEMENT: 'resource_management',
};
export const TransferType = {
    DIRECT_APPLICATION: 'direct_application',
    ADAPTIVE_TRANSFER: 'adaptive_transfer',
    INSPIRATIONAL_TRANSFER: 'inspirational_transfer',
    HYBRID_TRANSFER: 'hybrid_transfer',
};
// ============================================================================
// KNOWLEDGE TRANSFER SERVICE
// ============================================================================
export class KnowledgeTransferService extends EventEmitter {
    knowledgeBase = new Map();
    activeTransfers = new Map();
    transferHistory = [];
    learningSessionHistory = [];
    sessionCleanupTimer;
    constructor() {
        super();
        this.startSessionCleanup();
    }
    /**
     * Extract knowledge from agent DNA evolution events
     */
    async extractKnowledge(agentId, dnaId, projectId, taskId, evolutionHistory, performanceImprovement, context) {
        const extractedKnowledge = [];
        // Extract knowledge from successful mutations
        const successfulMutations = evolutionHistory.filter(mutation => {
            // Consider mutations that led to positive outcomes
            return mutation.delta > 0 && mutation.confidence > 0.6;
        });
        for (const mutation of successfulMutations) {
            const knowledgeItem = await this.createKnowledgeFromMutation(agentId, dnaId, projectId, taskId, mutation, performanceImprovement, context);
            if (knowledgeItem) {
                extractedKnowledge.push(knowledgeItem);
                this.knowledgeBase.set(knowledgeItem.id, knowledgeItem);
            }
        }
        // Extract pattern-based knowledge
        if (evolutionHistory.length > 0) {
            const patternKnowledge = await this.extractPatternKnowledge(agentId, dnaId, projectId, evolutionHistory, context);
            if (patternKnowledge) {
                extractedKnowledge.push(patternKnowledge);
                this.knowledgeBase.set(patternKnowledge.id, patternKnowledge);
            }
        }
        this.emit('knowledge_extracted', {
            agentId,
            dnaId,
            projectId,
            knowledgeCount: extractedKnowledge.length,
        });
        return extractedKnowledge;
    }
    /**
     * Find relevant knowledge for an agent in a specific context
     */
    async findRelevantKnowledge(targetAgentId, targetProjectId, targetContext, currentDna, maxResults = 10) {
        const allKnowledge = Array.from(this.knowledgeBase.values());
        const scoredKnowledge = [];
        for (const knowledge of allKnowledge) {
            // Skip knowledge from the same agent and project
            if (knowledge.sourceAgentId === targetAgentId && knowledge.sourceProjectId === targetProjectId) {
                continue;
            }
            const relevanceScore = await this.calculateRelevanceScore(knowledge, targetContext, currentDna);
            if (relevanceScore > 0.3) { // Minimum relevance threshold
                scoredKnowledge.push({ knowledge, relevanceScore });
            }
        }
        // Sort by relevance and return top results
        return scoredKnowledge
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, maxResults)
            .map(item => item.knowledge);
    }
    /**
     * Initiate knowledge transfer
     */
    async initiateKnowledgeTransfer(knowledgeId, targetAgentId, targetDnaId, targetProjectId, priority = 'medium') {
        const knowledge = this.knowledgeBase.get(knowledgeId);
        if (!knowledge) {
            throw new Error(`Knowledge item ${knowledgeId} not found`);
        }
        // Analyze adaptation requirements
        const adaptationRequired = await this.analyzeAdaptationRequirements(knowledge, targetProjectId);
        // Calculate expected outcome
        const expectedOutcome = await this.calculateTransferOutcome(knowledge, adaptationRequired);
        const transferRequest = {
            id: `transfer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            sourceKnowledge: knowledge,
            targetAgentId,
            targetDnaId,
            targetProjectId,
            transferType: this.determineTransferType(adaptationRequired),
            adaptationRequired,
            expectedOutcome,
            requestedAt: new Date(),
            priority,
        };
        this.activeTransfers.set(transferRequest.id, transferRequest);
        this.emit('transfer_initiated', {
            transferId: transferRequest.id,
            sourceKnowledge: knowledgeId,
            targetAgent: targetAgentId,
            expectedImprovement: expectedOutcome.expectedImprovement,
        });
        return transferRequest;
    }
    /**
     * Execute knowledge transfer
     */
    async executeKnowledgeTransfer(transferId, _targetDna) {
        const transferRequest = this.activeTransfers.get(transferId);
        if (!transferRequest) {
            throw new Error(`Transfer request ${transferId} not found`);
        }
        const startTime = Date.now();
        try {
            // Apply adaptations step by step
            const adaptationsApplied = [];
            for (const step of transferRequest.adaptationRequired.adaptationSteps) {
                // Simulate adaptation step execution
                adaptationsApplied.push(`${step.step}: ${step.description}`);
                // In production, this would apply actual genetic modifications
                await this.simulateAdaptationStep(step);
            }
            // Calculate actual improvement (simulated)
            const actualImprovement = this.simulatePerformanceImprovement(transferRequest.sourceKnowledge, transferRequest.expectedOutcome.expectedImprovement);
            const transferDuration = Date.now() - startTime;
            const success = actualImprovement > 0;
            const result = {
                transferId,
                success,
                actualImprovement,
                transferDuration,
                adaptationsApplied,
                lessonsLearned: this.extractLessonsLearned(transferRequest, actualImprovement),
                followUpActions: this.generateFollowUpActions(transferRequest, actualImprovement),
                validationStatus: success ? 'validated' : 'failed',
            };
            // Update knowledge usage statistics
            this.updateKnowledgeUsage(transferRequest.sourceKnowledge.id, success, actualImprovement);
            // Store result
            this.transferHistory.push(result);
            this.activeTransfers.delete(transferId);
            this.emit('transfer_completed', {
                transferId,
                success,
                actualImprovement,
                duration: transferDuration,
            });
            return result;
        }
        catch (error) {
            const result = {
                transferId,
                success: false,
                actualImprovement: 0,
                transferDuration: Date.now() - startTime,
                adaptationsApplied: [],
                lessonsLearned: [`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                followUpActions: ['Review transfer requirements', 'Consider alternative approaches'],
                validationStatus: 'failed',
            };
            this.transferHistory.push(result);
            this.activeTransfers.delete(transferId);
            this.emit('transfer_failed', { transferId, error });
            return result;
        }
    }
    /**
     * Start a cross-project learning session
     */
    async startLearningSession(participatingProjects, participatingAgents, sessionType) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        // Gather relevant knowledge from participating agents
        const sharedKnowledge = await this.gatherSharedKnowledge(participatingAgents, participatingProjects);
        const session = {
            id: sessionId,
            participatingProjects,
            participatingAgents,
            sessionType,
            sharedKnowledge,
            transfersInitiated: [],
            outcomes: [],
            startedAt: new Date(),
            sessionMetrics: {
                knowledgeItemsShared: sharedKnowledge.length,
                transfersAttempted: 0,
                transfersSuccessful: 0,
                avgImprovementAchieved: 0,
                participationLevel: 0,
                diversityIndex: this.calculateKnowledgeDiversity(sharedKnowledge),
                noveltyScore: this.calculateNoveltyScore(sharedKnowledge),
            },
        };
        this.learningSessionHistory.push(session);
        // Automatically identify and initiate promising transfers
        await this.facilitateKnowledgeExchange(session);
        this.emit('learning_session_started', {
            sessionId,
            participatingProjects: participatingProjects.length,
            participatingAgents: participatingAgents.length,
            sharedKnowledge: sharedKnowledge.length,
        });
        return sessionId;
    }
    /**
     * Get knowledge transfer statistics
     */
    getTransferStatistics() {
        const totalKnowledgeItems = this.knowledgeBase.size;
        const totalTransfers = this.transferHistory.length;
        const successfulTransfers = this.transferHistory.filter(t => t.success).length;
        const successRate = totalTransfers > 0 ? successfulTransfers / totalTransfers : 0;
        const totalImprovement = this.transferHistory
            .filter(t => t.success)
            .reduce((sum, t) => sum + t.actualImprovement, 0);
        const avgImprovement = successfulTransfers > 0 ? totalImprovement / successfulTransfers : 0;
        // Count knowledge by type
        const knowledgeByType = Array.from(this.knowledgeBase.values()).reduce((acc, knowledge) => {
            acc[knowledge.knowledgeType] = (acc[knowledge.knowledgeType] ?? 0) + 1;
            return acc;
        }, {});
        // Count transfers by type (from active and completed transfers)
        const allTransfers = [...this.transferHistory, ...Array.from(this.activeTransfers.values())];
        const transfersByType = allTransfers.reduce((acc, transfer) => {
            const type = 'transferType' in transfer ? transfer.transferType : TransferType.DIRECT_APPLICATION;
            acc[type] = (acc[type] ?? 0) + 1;
            return acc;
        }, {});
        // Get top performing knowledge
        const topPerformingKnowledge = Array.from(this.knowledgeBase.values())
            .filter(k => k.useCount > 0)
            .sort((a, b) => b.metadata.successRate - a.metadata.successRate)
            .slice(0, 10)
            .map(k => ({
            id: k.id,
            title: k.content.title,
            useCount: k.useCount,
            successRate: k.metadata.successRate,
            avgImprovement: k.metadata.avgImprovement,
        }));
        return {
            totalKnowledgeItems,
            totalTransfers,
            successRate,
            avgImprovement,
            knowledgeByType,
            transfersByType,
            topPerformingKnowledge,
        };
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    async createKnowledgeFromMutation(agentId, dnaId, projectId, taskId, mutation, performanceImprovement, context) {
        // Only create knowledge from significant improvements
        if (mutation.confidence < 0.6 || mutation.delta < 0.05) {
            return null;
        }
        const knowledgeType = this.classifyMutationType(mutation);
        const content = this.createKnowledgeContent(mutation, context);
        const applicability = this.determineApplicability(mutation, context);
        const quality = this.assessKnowledgeQuality(mutation, performanceImprovement);
        const knowledgeItem = {
            id: `knowledge_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            sourceAgentId: agentId,
            sourceDnaId: dnaId,
            sourceProjectId: projectId,
            knowledgeType,
            content,
            applicability,
            quality,
            metadata: {
                sourceTask: taskId,
                discoveryMethod: 'evolution',
                validationStatus: 'unvalidated',
                transferCount: 0,
                successRate: 0,
                avgImprovement: 0,
                tags: this.generateKnowledgeTags(mutation, context),
                relatedKnowledge: [],
            },
            createdAt: new Date(),
            lastUsed: new Date(),
            useCount: 0,
        };
        return knowledgeItem;
    }
    async extractPatternKnowledge(agentId, dnaId, projectId, evolutionHistory, context) {
        // Look for patterns in the evolution history
        if (evolutionHistory.length < 3)
            return null;
        const recentMutations = evolutionHistory.slice(-5); // Last 5 mutations
        const successfulMutations = recentMutations.filter(m => m.delta > 0);
        if (successfulMutations.length < 2)
            return null;
        // Find common patterns
        const commonGenes = this.findCommonTargetGenes(successfulMutations);
        const commonTriggers = this.findCommonTriggers(successfulMutations);
        if (commonGenes.length === 0 && commonTriggers.length === 0)
            return null;
        const knowledgeItem = {
            id: `pattern_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            sourceAgentId: agentId,
            sourceDnaId: dnaId,
            sourceProjectId: projectId,
            knowledgeType: KnowledgeType.PROBLEM_SOLVING_PATTERN,
            content: {
                title: `Evolution Pattern: ${commonGenes.join(', ')} Optimization`,
                description: `Successful pattern involving ${commonGenes.length} genetic markers`,
                keyInsights: [
                    `Mutations targeting ${commonGenes.join(', ')} show consistent positive results`,
                    `Common triggers: ${commonTriggers.join(', ')}`,
                    `Pattern observed across ${successfulMutations.length} successful mutations`,
                ],
                geneticMarkerPatterns: this.extractGeneticPatterns(successfulMutations),
                performanceImpacts: this.calculatePatternPerformanceImpacts(successfulMutations),
                contextualFactors: [context.projectType, context.complexity],
                prerequisites: ['Sufficient genetic diversity', 'Stable performance baseline'],
                contraindications: ['High-risk environments', 'Critical system changes'],
                examples: this.createPatternExamples(successfulMutations, context),
            },
            applicability: {
                projectTypes: [context.projectType],
                complexityLevels: [context.complexity],
                teamSizes: [context.teamSize],
                techStacks: context.techStack,
                contextualRequirements: ['Evolutionary pressure', 'Performance optimization needs'],
                exclusions: [],
            },
            quality: {
                reliability: this.calculatePatternReliability(successfulMutations),
                generalizability: 0.6, // Moderate generalizability for patterns
                specificity: 0.7,
                novelty: 0.5,
                impact: this.calculatePatternImpact(successfulMutations),
                confidence: 0.8,
            },
            metadata: {
                sourceTask: '', // Pattern spans multiple tasks
                discoveryMethod: 'analysis',
                validationStatus: 'partially_validated',
                transferCount: 0,
                successRate: 0,
                avgImprovement: 0,
                tags: ['pattern', 'evolution', context.projectType],
                relatedKnowledge: [],
            },
            createdAt: new Date(),
            lastUsed: new Date(),
            useCount: 0,
        };
        return knowledgeItem;
    }
    classifyMutationType(mutation) {
        switch (mutation.trigger.type) {
            case 'performance_decline':
                return KnowledgeType.ERROR_RECOVERY_STRATEGY;
            case 'pattern_recognition':
                return KnowledgeType.PROBLEM_SOLVING_PATTERN;
            case 'user_feedback':
                return KnowledgeType.ADAPTATION_STRATEGY;
            default:
                return KnowledgeType.OPTIMIZATION_TECHNIQUE;
        }
    }
    createKnowledgeContent(mutation, context) {
        return {
            title: `${mutation.targetGene} Optimization Strategy`,
            description: `Successful optimization of ${mutation.targetGene} genetic marker`,
            keyInsights: [
                `${mutation.targetGene} responds well to ${mutation.delta > 0 ? 'increases' : 'decreases'}`,
                `Trigger: ${mutation.trigger.details}`,
                `Context: ${context.projectType} project with ${context.complexity} complexity`,
            ],
            geneticMarkerPatterns: { [mutation.targetGene]: mutation.newValue },
            performanceImpacts: {}, // Would be populated based on actual performance data
            contextualFactors: [context.projectType, context.complexity],
            prerequisites: [`Baseline ${mutation.targetGene} value around ${mutation.previousValue}`],
            contraindications: [`Avoid when ${mutation.targetGene} is already optimized`],
            examples: [{
                    scenario: `${context.projectType} project requiring ${mutation.targetGene} improvement`,
                    application: `Applied ${mutation.delta > 0 ? 'positive' : 'negative'} adjustment`,
                    outcome: `Improved performance by ${(mutation.delta * 100).toFixed(1)}%`,
                    lessons: [`${mutation.targetGene} is sensitive to contextual changes`],
                }],
        };
    }
    determineApplicability(mutation, context) {
        return {
            projectTypes: [context.projectType],
            complexityLevels: [context.complexity],
            teamSizes: [context.teamSize],
            techStacks: context.techStack,
            contextualRequirements: [mutation.trigger.type],
            exclusions: [],
        };
    }
    assessKnowledgeQuality(mutation, performanceImprovement) {
        return {
            reliability: mutation.confidence,
            generalizability: 0.5, // Default moderate generalizability
            specificity: Math.abs(mutation.delta), // More specific if bigger change
            novelty: mutation.targetGene === 'novelty' ? 0.8 : 0.4, // Higher if novelty-related
            impact: Math.min(1, performanceImprovement * 2), // Scale performance improvement
            confidence: mutation.confidence,
        };
    }
    generateKnowledgeTags(mutation, context) {
        return [
            mutation.targetGene,
            mutation.trigger.type,
            context.projectType,
            context.complexity,
            'genetic_optimization',
        ];
    }
    async calculateRelevanceScore(knowledge, targetContext, targetDna) {
        let score = 0;
        // Context compatibility (40% weight)
        const contextScore = this.calculateContextCompatibility(knowledge, targetContext);
        score += contextScore * 0.4;
        // Genetic marker relevance (30% weight)
        const geneticScore = this.calculateGeneticRelevance(knowledge, targetDna.genetics);
        score += geneticScore * 0.3;
        // Knowledge quality (20% weight)
        const qualityScore = (knowledge.quality.reliability + knowledge.quality.impact) / 2;
        score += qualityScore * 0.2;
        // Usage success rate (10% weight)
        score += knowledge.metadata.successRate * 0.1;
        return Math.max(0, Math.min(1, score));
    }
    calculateContextCompatibility(knowledge, targetContext) {
        let compatibility = 0;
        // Project type match
        if (knowledge.applicability.projectTypes.includes(targetContext.projectType)) {
            compatibility += 0.4;
        }
        // Complexity level match
        if (knowledge.applicability.complexityLevels.includes(targetContext.complexity)) {
            compatibility += 0.3;
        }
        // Tech stack overlap
        const commonTech = knowledge.applicability.techStacks.filter(tech => targetContext.techStack.includes(tech));
        const techOverlap = commonTech.length / Math.max(knowledge.applicability.techStacks.length, 1);
        compatibility += techOverlap * 0.3;
        return compatibility;
    }
    calculateGeneticRelevance(knowledge, targetGenetics) {
        const knowledgePatterns = knowledge.content.geneticMarkerPatterns;
        const relevantGenes = Object.keys(knowledgePatterns);
        if (relevantGenes.length === 0)
            return 0.5; // Neutral if no genetic patterns
        let relevanceSum = 0;
        for (const gene of relevantGenes) {
            const knowledgeValue = knowledgePatterns[gene];
            const targetValue = targetGenetics[gene];
            // Higher relevance if target has room for improvement in this area
            const improvementPotential = Math.max(0, 1 - targetValue);
            const alignment = 1 - Math.abs(knowledgeValue - targetValue);
            relevanceSum += (improvementPotential + alignment) / 2;
        }
        return relevanceSum / relevantGenes.length;
    }
    async analyzeAdaptationRequirements(knowledge, _targetProjectId) {
        // Simulate adaptation analysis (would be more sophisticated in production)
        const riskLevel = knowledge.quality.generalizability > 0.7 ? 'low' :
            knowledge.quality.generalizability > 0.4 ? 'medium' : 'high';
        return {
            geneticModifications: knowledge.content.geneticMarkerPatterns,
            contextualAdjustments: ['Project type adaptation', 'Tech stack alignment'],
            performanceExpectations: knowledge.content.performanceImpacts,
            riskAssessment: {
                level: riskLevel,
                factors: ['Context mismatch', 'Genetic compatibility'],
                mitigations: ['Gradual application', 'Performance monitoring'],
            },
            adaptationSteps: [
                {
                    step: 1,
                    description: 'Prepare genetic modifications',
                    action: 'Calculate required genetic adjustments',
                    expectedDuration: 5000,
                    successCriteria: ['Genetic compatibility confirmed'],
                    rollbackPlan: 'Revert to original genetic markers',
                },
                {
                    step: 2,
                    description: 'Apply adaptations',
                    action: 'Modify genetic markers according to knowledge patterns',
                    expectedDuration: 10000,
                    successCriteria: ['Genetic markers updated', 'No regression detected'],
                    rollbackPlan: 'Restore previous genetic state',
                },
            ],
        };
    }
    async calculateTransferOutcome(knowledge, adaptation) {
        const baseImprovement = knowledge.quality.impact;
        const adaptationPenalty = adaptation.riskAssessment.level === 'high' ? 0.3 :
            adaptation.riskAssessment.level === 'medium' ? 0.1 : 0;
        const expectedImprovement = Math.max(0, baseImprovement - adaptationPenalty);
        const confidence = knowledge.quality.confidence * (1 - adaptationPenalty);
        return {
            expectedImprovement,
            confidence,
            timeline: adaptation.adaptationSteps.reduce((sum, step) => sum + step.expectedDuration, 0),
            successProbability: confidence * knowledge.quality.reliability,
            riskLevel: adaptation.riskAssessment.level,
        };
    }
    determineTransferType(adaptation) {
        const modificationCount = Object.keys(adaptation.geneticModifications).length;
        const riskLevel = adaptation.riskAssessment.level;
        if (modificationCount === 0)
            return TransferType.DIRECT_APPLICATION;
        if (riskLevel === 'low' && modificationCount < 3)
            return TransferType.ADAPTIVE_TRANSFER;
        if (riskLevel === 'high')
            return TransferType.INSPIRATIONAL_TRANSFER;
        return TransferType.HYBRID_TRANSFER;
    }
    async simulateAdaptationStep(step) {
        // Simulate step execution with delay
        await new Promise(resolve => setTimeout(resolve, Math.min(step.expectedDuration, 1000)));
    }
    simulatePerformanceImprovement(_knowledge, expectedImprovement) {
        // Add some realistic variance to expected improvement
        const variance = 0.2; // 20% variance
        const randomFactor = (Math.random() - 0.5) * 2 * variance;
        return Math.max(0, expectedImprovement * (1 + randomFactor));
    }
    extractLessonsLearned(transfer, actualImprovement) {
        const lessons = [];
        if (actualImprovement > transfer.expectedOutcome.expectedImprovement) {
            lessons.push('Transfer exceeded expectations');
            lessons.push('Knowledge generalizes better than anticipated');
        }
        else if (actualImprovement < transfer.expectedOutcome.expectedImprovement * 0.5) {
            lessons.push('Transfer underperformed significantly');
            lessons.push('More adaptation may be required for this context');
        }
        lessons.push(`${transfer.transferType} transfer approach was used`);
        lessons.push(`Adaptation risk level: ${transfer.adaptationRequired.riskAssessment.level}`);
        return lessons;
    }
    generateFollowUpActions(transfer, actualImprovement) {
        const actions = [];
        if (actualImprovement > 0) {
            actions.push('Monitor long-term performance stability');
            actions.push('Consider sharing this successful transfer pattern');
        }
        else {
            actions.push('Analyze failure causes');
            actions.push('Consider alternative knowledge sources');
            actions.push('Review adaptation strategy');
        }
        if (transfer.expectedOutcome.riskLevel === 'high') {
            actions.push('Validate risk mitigation effectiveness');
        }
        return actions;
    }
    updateKnowledgeUsage(knowledgeId, success, improvement) {
        const knowledge = this.knowledgeBase.get(knowledgeId);
        if (!knowledge)
            return;
        const updatedMetadata = {
            ...knowledge.metadata,
            transferCount: knowledge.metadata.transferCount + 1,
            successRate: (knowledge.metadata.successRate * knowledge.useCount + (success ? 1 : 0)) / (knowledge.useCount + 1),
            avgImprovement: (knowledge.metadata.avgImprovement * knowledge.useCount + improvement) / (knowledge.useCount + 1),
        };
        const updatedKnowledge = {
            ...knowledge,
            metadata: updatedMetadata,
            lastUsed: new Date(),
            useCount: knowledge.useCount + 1,
        };
        this.knowledgeBase.set(knowledgeId, updatedKnowledge);
    }
    async gatherSharedKnowledge(participatingAgents, participatingProjects) {
        return Array.from(this.knowledgeBase.values()).filter(knowledge => participatingAgents.includes(knowledge.sourceAgentId) ||
            participatingProjects.includes(knowledge.sourceProjectId));
    }
    async facilitateKnowledgeExchange(session) {
        // Automatically identify and suggest promising knowledge transfers
        // This is a simplified implementation
        const transfers = [];
        for (const knowledge of session.sharedKnowledge) {
            for (const targetProject of session.participatingProjects) {
                if (targetProject === knowledge.sourceProjectId)
                    continue;
                // Find target agents in this project
                const targetAgents = session.participatingAgents.filter(_agentId => {
                    // In production, would query database for agent-project associations
                    return true; // Simplified
                });
                for (const targetAgent of targetAgents.slice(0, 1)) { // Limit to prevent spam
                    try {
                        const transfer = await this.initiateKnowledgeTransfer(knowledge.id, targetAgent, 'temp_dna_id', // Would get actual DNA ID
                        targetProject, 'low');
                        transfers.push(transfer);
                    }
                    catch (error) {
                        // Continue with other transfers
                    }
                }
            }
        }
        // In production, would store the initiated transfers in the database
        // For now, we just emit an event about the transfers initiated during this session
        if (transfers.length > 0) {
            this.emit('session_transfers_initiated', {
                sessionId: session.id,
                transferCount: transfers.length,
                transfers: transfers.map(t => t.id)
            });
        }
    }
    calculateKnowledgeDiversity(knowledge) {
        if (knowledge.length === 0)
            return 0;
        const types = new Set(knowledge.map(k => k.knowledgeType));
        const projects = new Set(knowledge.map(k => k.sourceProjectId));
        // Simple diversity measure based on type and project variety
        return Math.min(1, (types.size + projects.size) / (knowledge.length + 1));
    }
    calculateNoveltyScore(knowledge) {
        if (knowledge.length === 0)
            return 0;
        const avgNovelty = knowledge.reduce((sum, k) => sum + k.quality.novelty, 0) / knowledge.length;
        return avgNovelty;
    }
    findCommonTargetGenes(mutations) {
        const geneCounts = new Map();
        for (const mutation of mutations) {
            const gene = mutation.targetGene;
            geneCounts.set(gene, (geneCounts.get(gene) ?? 0) + 1);
        }
        return Array.from(geneCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([gene]) => gene);
    }
    findCommonTriggers(mutations) {
        const triggerCounts = new Map();
        for (const mutation of mutations) {
            const trigger = mutation.trigger.type;
            triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1);
        }
        return Array.from(triggerCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([trigger]) => trigger);
    }
    extractGeneticPatterns(mutations) {
        const patterns = new Map();
        for (const mutation of mutations) {
            const gene = mutation.targetGene;
            const existingValue = patterns.get(gene);
            if (existingValue === undefined) {
                patterns.set(gene, mutation.newValue);
            }
            else {
                // Average multiple values
                patterns.set(gene, (existingValue + mutation.newValue) / 2);
            }
        }
        // Convert Map to Partial<GeneticMarkers> using Object.fromEntries
        return Object.fromEntries(patterns.entries());
    }
    calculatePatternPerformanceImpacts(_mutations) {
        // Simplified - would analyze actual performance correlations
        return {};
    }
    createPatternExamples(mutations, context) {
        return mutations.slice(0, 3).map((mutation, index) => ({
            scenario: `${context.projectType} optimization scenario ${index + 1}`,
            application: `Applied ${mutation.targetGene} adjustment`,
            outcome: `Performance improvement of ${(mutation.delta * 100).toFixed(1)}%`,
            lessons: [`${mutation.targetGene} responds well to ${mutation.trigger.type} triggers`],
        }));
    }
    calculatePatternReliability(mutations) {
        const avgConfidence = mutations.reduce((sum, m) => sum + m.confidence, 0) / mutations.length;
        return avgConfidence;
    }
    calculatePatternImpact(mutations) {
        const avgImpact = mutations.reduce((sum, m) => sum + Math.abs(m.delta), 0) / mutations.length;
        return Math.min(1, avgImpact * 2); // Scale to 0-1 range
    }
    startSessionCleanup() {
        this.sessionCleanupTimer = setInterval(() => {
            // Clean up old completed sessions
            const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            const initialLength = this.learningSessionHistory.length;
            for (let i = this.learningSessionHistory.length - 1; i >= 0; i--) {
                const session = this.learningSessionHistory[i];
                if (session.completedAt && session.completedAt < cutoff) {
                    this.learningSessionHistory.splice(i, 1);
                }
            }
            const cleaned = initialLength - this.learningSessionHistory.length;
            if (cleaned > 0) {
                console.log(`Cleaned up ${cleaned} old learning sessions`);
            }
        }, 60 * 60 * 1000); // Run every hour
    }
    /**
     * Clean up resources
     */
    destroy() {
        if (this.sessionCleanupTimer)
            clearInterval(this.sessionCleanupTimer);
        this.removeAllListeners();
    }
}
export default KnowledgeTransferService;
//# sourceMappingURL=knowledge-transfer.js.map