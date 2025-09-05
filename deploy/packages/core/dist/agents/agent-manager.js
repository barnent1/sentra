/**
 * Agent Manager - Manages lifecycle and orchestration of evolutionary agents
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
import { EventEmitter } from 'events';
import { AgentFactory } from './agent-factory';
import { DNAEngine } from '../dna/dna-engine';
/**
 * Agent Manager - Centralized agent lifecycle and task orchestration
 */
export class AgentManager extends EventEmitter {
    config;
    agentFactory;
    dnaEngine;
    // Agent tracking
    activeAgents = new Map();
    agentsByType = new Map();
    taskAssignments = new Map();
    agentMetrics = new Map();
    // Queue management
    taskQueue = [];
    waitingTasks = new Set();
    constructor(config = {}) {
        super();
        this.config = {
            maxConcurrentAgents: 10,
            maxAgentsPerType: 3,
            idleTimeoutMs: 300000, // 5 minutes
            evolutionThreshold: 0.7, // Evolve if performance drops below 70%
            retirementAge: 10, // Retire after 10 generations
            ...config,
        };
        this.agentFactory = new AgentFactory();
        this.dnaEngine = new DNAEngine();
        this.setupEventHandlers();
        this.startMaintenanceLoop();
    }
    /**
     * Create and spawn a new agent
     */
    async spawnAgent(config) {
        try {
            // Check pool limits
            if (this.activeAgents.size >= this.config.maxConcurrentAgents) {
                return {
                    success: false,
                    error: `Agent pool full (${this.activeAgents.size}/${this.config.maxConcurrentAgents})`,
                    metadata: {
                        agentId: 'pool_full',
                        dnaId: config.parentDnaId || 'none',
                        type: config.type,
                        spawnTime: new Date(),
                    },
                };
            }
            const typeCount = this.agentsByType.get(config.type)?.size || 0;
            if (typeCount >= this.config.maxAgentsPerType) {
                return {
                    success: false,
                    error: `Too many agents of type '${config.type}' (${typeCount}/${this.config.maxAgentsPerType})`,
                    metadata: {
                        agentId: 'type_limit',
                        dnaId: config.parentDnaId || 'none',
                        type: config.type,
                        spawnTime: new Date(),
                    },
                };
            }
            // Spawn the agent
            const spawnResult = await this.agentFactory.spawnAgent(config);
            if (spawnResult.success && spawnResult.agent) {
                this.registerAgent(spawnResult.agent);
                this.emit('agent_spawned', {
                    agentId: spawnResult.metadata.agentId,
                    type: config.type,
                    projectContext: config.projectContext,
                    timestamp: new Date(),
                });
            }
            return spawnResult;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown spawn error',
                metadata: {
                    agentId: 'spawn_error',
                    dnaId: config.parentDnaId || 'none',
                    type: config.type,
                    spawnTime: new Date(),
                },
            };
        }
    }
    /**
     * Assign a task to the most suitable agent
     */
    async assignTask(context) {
        try {
            // Find capable agents
            const capableAgents = Array.from(this.activeAgents.values()).filter(agent => agent.getStatus() === 'active' && agent.canHandleTask(context));
            if (capableAgents.length === 0) {
                // Try to spawn a suitable agent
                const suggestedType = this.determineBestAgentType(context);
                const spawnResult = await this.spawnAgent({
                    type: suggestedType,
                    projectContext: this.extractProjectContext(context),
                });
                if (spawnResult.success && spawnResult.agent) {
                    return this.assignTaskToAgent(spawnResult.agent.getId(), context);
                }
                // Add to queue if can't spawn
                this.taskQueue.push(context);
                this.waitingTasks.add(context.taskId);
                return {
                    success: false,
                    reason: 'No capable agents available, task queued',
                    alternativeSuggestions: [suggestedType],
                };
            }
            // Select best agent based on performance and context fit
            const bestAgent = this.selectBestAgent(capableAgents, context);
            return this.assignTaskToAgent(bestAgent.getId(), context);
        }
        catch (error) {
            return {
                success: false,
                reason: `Task assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Execute a task with automatic agent assignment
     */
    async executeTask(context) {
        const assignment = await this.assignTask(context);
        if (!assignment.success || !assignment.assignedAgent) {
            return {
                success: false,
                output: null,
                performanceMetrics: this.createFailureMetrics(),
                resourcesUsed: {
                    tokensConsumed: 0,
                    executionTime: 0,
                    memoryUsed: 0,
                },
                errors: [assignment.reason],
            };
        }
        const agent = this.activeAgents.get(assignment.assignedAgent);
        if (!agent) {
            return {
                success: false,
                output: null,
                performanceMetrics: this.createFailureMetrics(),
                resourcesUsed: {
                    tokensConsumed: 0,
                    executionTime: 0,
                    memoryUsed: 0,
                },
                errors: ['Assigned agent not found'],
            };
        }
        try {
            await agent.activate(context.taskId);
            const result = await agent.executeTask(context);
            await agent.deactivate();
            // Update agent performance metrics
            await this.updateAgentMetrics(assignment.assignedAgent, result);
            // Check if agent needs evolution
            await this.checkForEvolution(assignment.assignedAgent);
            this.emit('task_completed', {
                taskId: context.taskId,
                agentId: assignment.assignedAgent,
                success: result.success,
                executionTime: result.resourcesUsed.executionTime,
                timestamp: new Date(),
            });
            return result;
        }
        catch (error) {
            await agent.deactivate();
            return {
                success: false,
                output: null,
                performanceMetrics: this.createFailureMetrics(),
                resourcesUsed: {
                    tokensConsumed: 0,
                    executionTime: 0,
                    memoryUsed: 0,
                },
                errors: [`Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            };
        }
        finally {
            // Remove task assignment
            this.taskAssignments.delete(context.taskId);
        }
    }
    /**
     * Get agent performance summary
     */
    getAgentPerformance(agentId) {
        return this.agentMetrics.get(agentId) || null;
    }
    /**
     * Get all agent performance summaries
     */
    getAllAgentPerformance() {
        return Object.freeze(Array.from(this.agentMetrics.values()));
    }
    /**
     * Get manager statistics
     */
    getManagerStats() {
        const agentsByType = {};
        for (const [type, agents] of this.agentsByType.entries()) {
            agentsByType[type] = agents.size;
        }
        const performances = Array.from(this.agentMetrics.values());
        const averagePerformance = performances.length > 0
            ? performances.reduce((sum, p) => sum + p.performance.successRate, 0) / performances.length
            : 0;
        const completedTasks = performances.reduce((sum, p) => sum + p.performance.tasksCompleted, 0);
        return {
            activeAgents: this.activeAgents.size,
            agentsByType: agentsByType,
            queuedTasks: this.taskQueue.length,
            completedTasks,
            averagePerformance,
        };
    }
    /**
     * Terminate an agent
     */
    async terminateAgent(agentId, reason = 'Manual termination') {
        const agent = this.activeAgents.get(agentId);
        if (!agent)
            return false;
        try {
            await agent.terminate(reason);
            this.unregisterAgent(agentId);
            this.emit('agent_terminated', {
                agentId,
                reason,
                finalStats: this.agentMetrics.get(agentId),
                timestamp: new Date(),
            });
            return true;
        }
        catch (error) {
            this.emit('agent_termination_failed', {
                agentId,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
            });
            return false;
        }
    }
    /**
     * Shutdown manager and all agents
     */
    async shutdown() {
        const terminations = Array.from(this.activeAgents.keys()).map(agentId => this.terminateAgent(agentId, 'System shutdown'));
        await Promise.all(terminations);
        this.emit('manager_shutdown', {
            timestamp: new Date(),
            terminatedAgents: terminations.length,
        });
    }
    // Private methods for internal operations
    /**
     * Register an agent in the manager
     */
    registerAgent(agent) {
        const agentId = agent.getId();
        const agentType = agent.type;
        this.activeAgents.set(agentId, agent);
        if (!this.agentsByType.has(agentType)) {
            this.agentsByType.set(agentType, new Set());
        }
        this.agentsByType.get(agentType).add(agentId);
        // Initialize metrics
        this.agentMetrics.set(agentId, {
            agentId,
            type: agentType,
            status: 'active',
            performance: {
                successRate: 0,
                averageExecutionTime: 0,
                tasksCompleted: 0,
                currentFitness: agent.getDNA().fitnessScore,
            },
            utilization: {
                activeTime: 0,
                idleTime: 0,
                utilizationRate: 0,
            },
            evolution: {
                generation: agent.getDNA().generation,
                adaptationCount: 0,
                lastEvolution: null,
            },
        });
        // Set up agent event listeners
        this.setupAgentEventListeners(agent);
    }
    /**
     * Unregister an agent from the manager
     */
    unregisterAgent(agentId) {
        const agent = this.activeAgents.get(agentId);
        if (!agent)
            return;
        const agentType = agent.type;
        this.activeAgents.delete(agentId);
        this.agentsByType.get(agentType)?.delete(agentId);
        // Keep metrics for historical analysis but mark as archived
        const metrics = this.agentMetrics.get(agentId);
        if (metrics) {
            this.agentMetrics.set(agentId, {
                ...metrics,
                status: 'archived',
            });
        }
        // Remove agent event listeners
        agent.removeAllListeners();
    }
    /**
     * Assign task to specific agent
     */
    assignTaskToAgent(agentId, context) {
        this.taskAssignments.set(context.taskId, agentId);
        return {
            success: true,
            assignedAgent: agentId,
            reason: 'Agent assigned based on capability and performance',
        };
    }
    /**
     * Select best agent for task
     */
    selectBestAgent(candidates, _context) {
        if (candidates.length === 1)
            return candidates[0];
        // Score each candidate
        const scoredAgents = candidates.map(agent => {
            const metrics = this.agentMetrics.get(agent.getId());
            const performance = metrics?.performance || { successRate: 0.5, averageExecutionTime: 10000, currentFitness: 0.5 };
            // Calculate selection score based on multiple factors
            const performanceScore = performance.successRate * 0.4 + performance.currentFitness * 0.3;
            const efficiencyScore = Math.max(0, 1 - (performance.averageExecutionTime / 60000)); // Normalize execution time
            const availabilityScore = agent.getStatus() === 'active' ? 1 : 0;
            const totalScore = performanceScore * 0.5 + efficiencyScore * 0.3 + availabilityScore * 0.2;
            return { agent, score: totalScore };
        });
        // Sort by score and return best
        scoredAgents.sort((a, b) => b.score - a.score);
        return scoredAgents[0].agent;
    }
    /**
     * Determine best agent type for task
     */
    determineBestAgentType(context) {
        // Analyze task requirements to suggest best agent type
        const requirements = context.requirements.join(' ').toLowerCase();
        if (requirements.includes('coordinate') || requirements.includes('orchestrate') || requirements.includes('manage')) {
            return 'orchestrator';
        }
        if (requirements.includes('implement') || requirements.includes('code') || requirements.includes('develop')) {
            return 'developer';
        }
        if (requirements.includes('test') || requirements.includes('validate') || requirements.includes('verify')) {
            return 'tester';
        }
        if (requirements.includes('review') || requirements.includes('analyze') || requirements.includes('assess')) {
            return 'reviewer';
        }
        if (requirements.includes('design') || requirements.includes('ui') || requirements.includes('ux')) {
            return 'designer';
        }
        if (requirements.includes('research') || requirements.includes('analyze') || requirements.includes('study')) {
            return 'analyst';
        }
        // Default to developer for code-related tasks
        return 'developer';
    }
    /**
     * Extract project context from task context
     */
    extractProjectContext(context) {
        return context.projectContext || {
            projectType: 'web-app',
            techStack: ['typescript', 'react'],
            complexity: 'medium',
            teamSize: 1,
            timeline: '1 week',
            requirements: context.requirements,
        };
    }
    /**
     * Update agent performance metrics
     */
    async updateAgentMetrics(agentId, _result) {
        const currentMetrics = this.agentMetrics.get(agentId);
        if (!currentMetrics)
            return;
        const agent = this.activeAgents.get(agentId);
        if (!agent)
            return;
        const stats = agent.getPerformanceStats();
        this.agentMetrics.set(agentId, {
            ...currentMetrics,
            performance: {
                successRate: stats.averageSuccessRate,
                averageExecutionTime: stats.averageExecutionTime,
                tasksCompleted: stats.totalTasksCompleted,
                currentFitness: stats.contextFitScore,
            },
            evolution: {
                ...currentMetrics.evolution,
                adaptationCount: stats.adaptationCount,
            },
        });
    }
    /**
     * Check if agent needs evolution and trigger if necessary
     */
    async checkForEvolution(agentId) {
        const metrics = this.agentMetrics.get(agentId);
        const agent = this.activeAgents.get(agentId);
        if (!metrics || !agent)
            return;
        // Check if performance is below threshold
        if (metrics.performance.successRate < this.config.evolutionThreshold) {
            try {
                const currentDNA = agent.getDNA();
                // Use DNA engine to evolve the pattern
                const evolutionResult = await this.dnaEngine.evolvePattern(currentDNA, currentDNA.context, {
                    targetFitness: this.config.evolutionThreshold,
                    maxIterations: 5,
                    allowableRisk: 0.1,
                    priorityWeights: {
                        performance: 0.4,
                        stability: 0.3,
                        adaptability: 0.3,
                    },
                });
                if (evolutionResult.success) {
                    await agent.evolveDNA(evolutionResult.evolvedPattern);
                    // Update metrics - create new objects for readonly properties
                    const updatedMetrics = {
                        ...metrics,
                        evolution: {
                            ...metrics.evolution,
                            lastEvolution: new Date(),
                            generation: evolutionResult.evolvedPattern.generation,
                        }
                    };
                    this.agentMetrics.set(agentId, updatedMetrics);
                    this.emit('agent_evolved', {
                        agentId,
                        oldFitness: currentDNA.fitnessScore,
                        newFitness: evolutionResult.evolvedPattern.fitnessScore,
                        improvement: evolutionResult.fitnessImprovement,
                        generation: evolutionResult.evolvedPattern.generation,
                        timestamp: new Date(),
                    });
                }
            }
            catch (error) {
                this.emit('evolution_failed', {
                    agentId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                });
            }
        }
        // Check retirement age
        if (metrics.evolution.generation >= this.config.retirementAge) {
            await this.terminateAgent(agentId, 'Reached retirement age');
        }
    }
    /**
     * Setup agent event listeners
     */
    setupAgentEventListeners(agent) {
        agent.on('learning_completed', (event) => {
            this.emit('agent_learning', event);
        });
        agent.on('adaptation_needed', (event) => {
            this.emit('agent_adaptation_needed', event);
        });
        agent.on('evolution_requested', (event) => {
            this.checkForEvolution(event.agentId);
        });
    }
    /**
     * Setup manager event handlers
     */
    setupEventHandlers() {
        // Handle task queue processing
        this.on('agent_spawned', () => {
            this.processTaskQueue();
        });
        this.on('task_completed', () => {
            this.processTaskQueue();
        });
    }
    /**
     * Process queued tasks
     */
    async processTaskQueue() {
        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            if (!task)
                break;
            const assignment = await this.assignTask(task);
            if (assignment.success) {
                this.waitingTasks.delete(task.taskId);
            }
            else {
                // Put back in queue if still can't assign
                this.taskQueue.unshift(task);
                break;
            }
        }
    }
    /**
     * Start maintenance loop for idle cleanup and optimization
     */
    startMaintenanceLoop() {
        setInterval(() => {
            this.performMaintenance();
        }, 60000); // Run every minute
    }
    /**
     * Perform routine maintenance
     */
    performMaintenance() {
        const now = Date.now();
        // Check for idle agents
        for (const [agentId, agent] of this.activeAgents.entries()) {
            const metrics = this.agentMetrics.get(agentId);
            if (!metrics)
                continue;
            const idleTime = now - agent.getDNA().lastActivation.getTime();
            if (idleTime > this.config.idleTimeoutMs && agent.getStatus() === 'active') {
                // Mark as inactive but don't terminate (may be needed again)
                this.emit('agent_idle', {
                    agentId,
                    idleTime,
                    timestamp: new Date(),
                });
            }
        }
        // Emit maintenance stats
        this.emit('maintenance_completed', {
            activeAgents: this.activeAgents.size,
            queuedTasks: this.taskQueue.length,
            timestamp: new Date(),
        });
    }
    /**
     * Create failure metrics for error cases
     */
    createFailureMetrics() {
        return {
            successRate: 0,
            averageTaskCompletionTime: 0,
            codeQualityScore: 0,
            userSatisfactionRating: 0,
            adaptationSpeed: 0,
            errorRecoveryRate: 0,
            knowledgeRetention: 0,
            crossDomainTransfer: 0,
            computationalEfficiency: 0,
            responseLatency: 0,
            throughput: 0,
            resourceUtilization: 0,
            bugIntroductionRate: 1,
            testCoverage: 0,
            documentationQuality: 0,
            maintainabilityScore: 0,
            communicationEffectiveness: 0,
            teamIntegration: 0,
            feedbackIncorporation: 0,
            conflictResolution: 0,
        };
    }
}
export default AgentManager;
//# sourceMappingURL=agent-manager.js.map