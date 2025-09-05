/**
 * Demo Integration Script - Test Disler-style observability system
 * Following SENTRA project standards: strict TypeScript with branded types
 */
import { ObservabilityManager } from './observability-manager';
import { AgentMonitor } from './agent-monitor';
import { PerformanceTracker } from './performance-tracker';
import { MetricsCollector } from './metrics-collector';
// ============================================================================
// DEMO CONFIGURATION
// ============================================================================
const DEMO_CONFIG = {
    agentCount: 3,
    simulationDuration: 300000, // 5 minutes
    eventInterval: 2000, // Event every 2 seconds
    toolNames: ['code_analyzer', 'file_writer', 'test_runner', 'git_commit', 'debug_inspector'],
    decisionTypes: ['tool_selection', 'approach_choice', 'parameter_tuning', 'strategy_pivot'],
};
// ============================================================================
// DEMO SIMULATOR
// ============================================================================
/**
 * Simulate realistic agent behavior for observability testing
 */
export class ObservabilityDemoSimulator {
    observabilityManager;
    agentMonitor;
    performanceTracker;
    metricsCollector;
    logger;
    simulationTimer;
    isRunning = false;
    eventCount = 0;
    // Demo agents
    demoAgents = [];
    constructor(observabilityManager, agentMonitor, performanceTracker, metricsCollector, logger) {
        this.observabilityManager = observabilityManager;
        this.agentMonitor = agentMonitor;
        this.performanceTracker = performanceTracker;
        this.metricsCollector = metricsCollector;
        this.logger = logger;
        this.setupDemoAgents();
        this.setupBenchmarks();
    }
    // ============================================================================
    // SETUP METHODS
    // ============================================================================
    /**
     * Setup demo agents with different characteristics
     */
    setupDemoAgents() {
        this.demoAgents.push({
            id: 'agent-dev-001',
            name: 'Senior Developer Agent',
            type: 'developer',
            toolHistory: [],
            decisionCount: 0,
            errorRate: 0.05, // 5% error rate
            efficiency: 0.92,
        }, {
            id: 'agent-orch-001',
            name: 'Task Orchestrator',
            type: 'orchestrator',
            toolHistory: [],
            decisionCount: 0,
            errorRate: 0.02, // 2% error rate
            efficiency: 0.88,
        }, {
            id: 'agent-spec-001',
            name: 'Testing Specialist',
            type: 'specialist',
            toolHistory: [],
            decisionCount: 0,
            errorRate: 0.08, // 8% error rate (more experimental)
            efficiency: 0.85,
        });
        // Register agents with monitoring systems
        this.demoAgents.forEach(agent => {
            this.metricsCollector.addAgent(agent.id);
        });
        this.logger?.info('Demo agents setup complete', {
            agentCount: this.demoAgents.length,
            agents: this.demoAgents.map(a => ({ id: a.id, name: a.name, type: a.type })),
        });
    }
    /**
     * Setup performance benchmarks for testing
     */
    setupBenchmarks() {
        // Response time benchmarks
        this.performanceTracker.createBenchmark('Fast Response Time', 'Tools should complete within 2 seconds for optimal UX', 'tool_duration', 1500, // target: 1.5 seconds
        2000, // threshold: 2 seconds
        'ms', 'latency');
        this.performanceTracker.createBenchmark('High Success Rate', 'Tools should have >95% success rate', 'tool_success_rate', 0.95, // target: 95%
        0.90, // threshold: 90%
        'rate', 'reliability');
        this.performanceTracker.createBenchmark('High Decision Confidence', 'Agent decisions should have >80% confidence', 'decision_confidence', 0.80, // target: 80%
        0.70, // threshold: 70%
        'score', 'accuracy');
        this.logger?.info('Performance benchmarks setup complete');
    }
    // ============================================================================
    // SIMULATION CONTROL
    // ============================================================================
    /**
     * Start the observability demo simulation
     */
    startSimulation() {
        if (this.isRunning) {
            this.logger?.warn('Simulation is already running');
            return;
        }
        this.isRunning = true;
        this.eventCount = 0;
        // Start agent sessions
        this.demoAgents.forEach(agent => {
            agent.sessionId = this.observabilityManager.startSession(agent.id, this.generateTaskId());
        });
        // Start simulation timer
        this.simulationTimer = setInterval(() => {
            this.simulateAgentActivity();
        }, DEMO_CONFIG.eventInterval);
        // Stop simulation after configured duration
        setTimeout(() => {
            this.stopSimulation();
        }, DEMO_CONFIG.simulationDuration);
        this.logger?.info('Observability demo simulation started', {
            duration: DEMO_CONFIG.simulationDuration,
            eventInterval: DEMO_CONFIG.eventInterval,
            agentCount: this.demoAgents.length,
        });
    }
    /**
     * Stop the simulation
     */
    stopSimulation() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.simulationTimer) {
            clearInterval(this.simulationTimer);
            this.simulationTimer = undefined;
        }
        // End agent sessions
        this.demoAgents.forEach(agent => {
            if (agent.sessionId) {
                this.observabilityManager.endSession(agent.sessionId);
            }
        });
        this.logger?.info('Observability demo simulation stopped', {
            totalEvents: this.eventCount,
            averageEventsPerAgent: this.eventCount / this.demoAgents.length,
        });
        // Print summary
        this.printSimulationSummary();
    }
    // ============================================================================
    // SIMULATION LOGIC
    // ============================================================================
    /**
     * Simulate activity for a random agent
     */
    simulateAgentActivity() {
        const agent = this.getRandomAgent();
        const activityType = this.chooseActivityType();
        switch (activityType) {
            case 'tool_usage':
                this.simulateToolUsage(agent);
                break;
            case 'decision':
                this.simulateDecision(agent);
                break;
            case 'memory_operation':
                this.simulateMemoryOperation(agent);
                break;
            case 'coordination':
                this.simulateCoordination(agent);
                break;
        }
        this.eventCount++;
    }
    /**
     * Simulate tool usage with realistic timing and success rates
     */
    async simulateToolUsage(agent) {
        const toolName = this.getRandomTool();
        const parameters = this.generateToolParameters(toolName);
        const expectedDuration = this.calculateExpectedDuration(toolName, agent.efficiency);
        // Track tool start
        await this.observabilityManager.trackToolStart({
            agentId: agent.id,
            toolName,
            toolVersion: '1.0.0',
            parameters,
            expectedDuration,
            taskId: agent.currentTask,
            context: {
                userQuery: `Execute ${toolName} for current task`,
                previousTools: agent.toolHistory.slice(-3),
                chainOfThought: `Selected ${toolName} based on current task requirements`,
            },
        });
        // Simulate tool execution delay
        setTimeout(async () => {
            const actualDuration = this.calculateActualDuration(expectedDuration, agent.efficiency);
            const success = Math.random() > agent.errorRate;
            const tokensUsed = Math.floor(Math.random() * 1000) + 100;
            // Track tool completion
            await this.observabilityManager.trackToolComplete({
                agentId: agent.id,
                toolName,
                duration: actualDuration,
                success,
                result: success ? `${toolName} completed successfully` : undefined,
                tokensUsed,
                errorCount: success ? 0 : 1,
                warnings: success ? [] : ['Tool execution failed'],
                taskId: agent.currentTask,
                performanceMetrics: {
                    executionTime: actualDuration,
                    memoryUsed: Math.floor(Math.random() * 50000000) + 10000000, // 10-60MB
                    cpuTime: actualDuration * 0.8, // Assume 80% CPU utilization
                },
            });
            // Update agent state
            agent.toolHistory.push(toolName);
            if (agent.toolHistory.length > 10) {
                agent.toolHistory = agent.toolHistory.slice(-10);
            }
        }, Math.min(actualDuration || expectedDuration, 100)); // Cap simulation delay at 100ms
    }
    /**
     * Simulate agent decision making
     */
    async simulateDecision(agent) {
        const decisionType = this.getRandomDecisionType();
        const options = this.generateDecisionOptions(decisionType);
        const selectedOption = options[0]; // Always select first option
        const confidence = this.calculateDecisionConfidence(agent.efficiency);
        await this.observabilityManager.trackDecision({
            agentId: agent.id,
            taskId: agent.currentTask,
            decisionType,
            context: `Making ${decisionType} decision for current workflow`,
            options,
            selectedOption: selectedOption.name,
            confidence,
            reasoning: selectedOption.reasoning,
            factors: {
                experience: agent.efficiency,
                complexity: Math.random(),
                timeConstraint: Math.random() * 0.5 + 0.5,
                riskTolerance: agent.errorRate,
            },
        });
        agent.decisionCount++;
    }
    /**
     * Simulate memory operations
     */
    async simulateMemoryOperation(agent) {
        const operations = ['store', 'retrieve', 'update', 'forget'];
        const memoryTypes = ['working', 'episodic', 'semantic', 'procedural'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const memoryType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)];
        const key = `${memoryType}_data_${Date.now()}`;
        const dataSize = Math.floor(Math.random() * 10000) + 1000; // 1-11KB
        const relevanceScore = Math.random();
        await this.observabilityManager.trackMemoryOperation({
            agentId: agent.id,
            operation,
            memoryType,
            key,
            dataSize,
            relevanceScore,
            retentionPriority: relevanceScore > 0.7 ? 'high' : relevanceScore > 0.4 ? 'medium' : 'low',
            associatedConcepts: this.generateAssociatedConcepts(),
        });
    }
    /**
     * Simulate coordination between agents
     */
    async simulateCoordination(agent) {
        const targetAgent = this.getRandomAgent(agent.id);
        if (!targetAgent)
            return;
        const coordinationTypes = [
            'delegation', 'collaboration', 'information_sharing', 'conflict_resolution'
        ];
        const coordinationType = coordinationTypes[Math.floor(Math.random() * coordinationTypes.length)];
        const urgencyLevels = ['low', 'medium', 'high', 'critical'];
        const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)];
        await this.observabilityManager.trackCoordination(agent.id, targetAgent.id, {
            coordinationType,
            topic: `${coordinationType} request for task collaboration`,
            urgency,
            expectedOutcome: `Successful ${coordinationType} between agents`,
            context: {
                sharedTaskId: agent.currentTask,
                sharedResources: ['code_repository', 'test_suite', 'documentation'],
                dependencies: ['task_completion', 'quality_validation'],
            },
        });
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * Get random agent (excluding specific agent if provided)
     */
    getRandomAgent(excludeId) {
        const availableAgents = excludeId ?
            this.demoAgents.filter(agent => agent.id !== excludeId) :
            this.demoAgents;
        return availableAgents[Math.floor(Math.random() * availableAgents.length)];
    }
    /**
     * Choose random activity type weighted by frequency
     */
    chooseActivityType() {
        const weights = {
            tool_usage: 0.5, // 50% of activities
            decision: 0.25, // 25% of activities
            memory_operation: 0.15, // 15% of activities
            coordination: 0.1, // 10% of activities
        };
        const random = Math.random();
        let cumulative = 0;
        for (const [activity, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return activity;
            }
        }
        return 'tool_usage'; // fallback
    }
    /**
     * Get random tool name
     */
    getRandomTool() {
        return DEMO_CONFIG.toolNames[Math.floor(Math.random() * DEMO_CONFIG.toolNames.length)];
    }
    /**
     * Get random decision type
     */
    getRandomDecisionType() {
        return DEMO_CONFIG.decisionTypes[Math.floor(Math.random() * DEMO_CONFIG.decisionTypes.length)];
    }
    /**
     * Generate tool parameters based on tool type
     */
    generateToolParameters(toolName) {
        const baseParams = {
            timeout: 30000,
            retries: 3,
            verbose: false,
        };
        switch (toolName) {
            case 'code_analyzer':
                return { ...baseParams, language: 'typescript', includeTypes: true };
            case 'file_writer':
                return { ...baseParams, encoding: 'utf8', createDirs: true };
            case 'test_runner':
                return { ...baseParams, coverage: true, parallel: true };
            case 'git_commit':
                return { ...baseParams, signCommit: true, verify: true };
            case 'debug_inspector':
                return { ...baseParams, includeStackTrace: true, maxDepth: 10 };
            default:
                return baseParams;
        }
    }
    /**
     * Calculate expected tool duration based on type and agent efficiency
     */
    calculateExpectedDuration(toolName, efficiency) {
        const baseDurations = {
            code_analyzer: 2500,
            file_writer: 500,
            test_runner: 8000,
            git_commit: 1200,
            debug_inspector: 4000,
        };
        const baseDuration = baseDurations[toolName] || 2000;
        return Math.floor(baseDuration * (2 - efficiency)); // Higher efficiency = faster execution
    }
    /**
     * Calculate actual duration with some randomness
     */
    calculateActualDuration(expectedDuration, efficiency) {
        const variance = 0.3; // 30% variance
        const randomFactor = 1 + (Math.random() - 0.5) * variance;
        return Math.floor(expectedDuration * randomFactor);
    }
    /**
     * Calculate decision confidence based on agent efficiency
     */
    calculateDecisionConfidence(efficiency) {
        const baseConfidence = efficiency * 0.9; // Base confidence tied to efficiency
        const randomVariance = (Math.random() - 0.5) * 0.2; // ±10% variance
        return Math.max(0.1, Math.min(1.0, baseConfidence + randomVariance));
    }
    /**
     * Generate decision options
     */
    generateDecisionOptions(decisionType) {
        const options = [
            {
                name: `optimal_${decisionType}`,
                confidence: 0.85,
                reasoning: `This option provides the best balance of speed and reliability for ${decisionType}`,
            },
            {
                name: `alternative_${decisionType}`,
                confidence: 0.65,
                reasoning: `Alternative approach that might work but with lower confidence`,
            },
            {
                name: `experimental_${decisionType}`,
                confidence: 0.45,
                reasoning: `Experimental approach with potential for innovation but higher risk`,
            },
        ];
        // Shuffle and return subset
        return options.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
    }
    /**
     * Generate associated concepts for memory operations
     */
    generateAssociatedConcepts() {
        const concepts = [
            'code_quality', 'performance_optimization', 'error_handling', 'testing_strategy',
            'architecture_pattern', 'data_structure', 'algorithm_choice', 'security_concern',
            'scalability', 'maintainability', 'user_experience', 'deployment_strategy',
        ];
        const count = Math.floor(Math.random() * 4) + 1; // 1-4 concepts
        return concepts.sort(() => Math.random() - 0.5).slice(0, count);
    }
    /**
     * Generate task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    /**
     * Print simulation summary
     */
    printSimulationSummary() {
        console.log('\n=== Observability Demo Simulation Summary ===\n');
        // Overall stats
        const observabilityStats = this.observabilityManager.getStats();
        const performanceStats = this.performanceTracker.getStats();
        const monitoringStats = this.agentMonitor.getMonitoringStats();
        console.log('Overall Statistics:');
        console.log(`  Total Events Generated: ${this.eventCount}`);
        console.log(`  Active Sessions: ${observabilityStats.activeSessions}`);
        console.log(`  Event Buffer Size: ${observabilityStats.eventBufferSize}`);
        console.log(`  Performance Measurements: ${performanceStats.totalMeasurements}`);
        console.log(`  Monitored Agents: ${monitoringStats.monitoredAgents}`);
        console.log(`  Behavior Patterns Detected: ${monitoringStats.totalBehaviorPatterns}`);
        console.log(`  Healthy Agents: ${monitoringStats.healthyAgents}`);
        console.log(`  Critical Agents: ${monitoringStats.criticalAgents}\n`);
        // Agent details
        console.log('Agent Summary:');
        this.demoAgents.forEach(agent => {
            const healthAssessment = this.agentMonitor.getAgentHealthAssessment(agent.id);
            const behaviorPatterns = this.agentMonitor.getAgentBehaviorPatterns(agent.id);
            console.log(`  ${agent.name} (${agent.id}):`);
            console.log(`    Type: ${agent.type}`);
            console.log(`    Tools Used: ${agent.toolHistory.length}`);
            console.log(`    Decisions Made: ${agent.decisionCount}`);
            console.log(`    Health Score: ${healthAssessment ? (healthAssessment.overallHealth * 100).toFixed(1) : 'N/A'}%`);
            console.log(`    Behavior Patterns: ${behaviorPatterns.length}`);
            console.log('');
        });
        // Performance benchmarks
        console.log('Performance Benchmark Status:');
        const benchmarks = this.performanceTracker.getAllBenchmarks();
        benchmarks.forEach(benchmark => {
            console.log(`  ${benchmark.name}:`);
            console.log(`    Target: ${benchmark.target}${benchmark.unit}`);
            console.log(`    Threshold: ${benchmark.threshold}${benchmark.unit}`);
            console.log(`    Category: ${benchmark.category}`);
        });
        console.log('\n=== Demo Complete ===\n');
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Check if simulation is currently running
     */
    isSimulationRunning() {
        return this.isRunning;
    }
    /**
     * Get current event count
     */
    getEventCount() {
        return this.eventCount;
    }
    /**
     * Get demo agent information
     */
    getDemoAgents() {
        return this.demoAgents.map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            toolHistory: agent.toolHistory,
            decisionCount: agent.decisionCount,
            errorRate: agent.errorRate,
            efficiency: agent.efficiency,
        }));
    }
}
// ============================================================================
// DEMO RUNNER
// ============================================================================
/**
 * Run observability demo with mock event bus
 */
export async function runObservabilityDemo(logger) {
    logger?.info('Starting Disler-style observability demo...');
    // Create observability components
    const performanceTracker = new PerformanceTracker(logger);
    const metricsCollector = new MetricsCollector(performanceTracker, logger);
    // Create observability manager (without event bus for demo)
    const observabilityManager = new ObservabilityManager(undefined, // No event bus for demo
    {
        enabled: true,
        realTimeStreaming: true,
        performancePulseInterval: 5000,
        metricsRetentionDays: 1,
        maxSessionsInMemory: 100,
        eventBufferSize: 1000,
    }, logger);
    const agentMonitor = new AgentMonitor(observabilityManager, logger);
    // Create demo simulator
    const simulator = new ObservabilityDemoSimulator(observabilityManager, agentMonitor, performanceTracker, metricsCollector, logger);
    // Start simulation
    simulator.startSimulation();
    // Return simulation control to caller
    return new Promise((resolve) => {
        // Auto-resolve when simulation completes
        const checkInterval = setInterval(() => {
            if (!simulator.isSimulationRunning()) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 1000);
    });
}
// ============================================================================
// EXPORT DEMO COMPONENTS
// ============================================================================
export { DEMO_CONFIG, };
//# sourceMappingURL=demo-integration.js.map