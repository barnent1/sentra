/**
 * Evolution Integration Test Suite
 *
 * Comprehensive test to validate the evolution integration with existing systems,
 * database operations, and cross-project learning capabilities.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
export declare class EvolutionIntegrationTest {
    private orchestrator;
    private testResults;
    constructor();
    /**
     * Run the complete test suite
     */
    runTests(): Promise<{
        readonly totalTests: number;
        readonly passedTests: number;
        readonly failedTests: number;
        readonly results: Array<{
            readonly testName: string;
            readonly success: boolean;
            readonly message: string;
            readonly duration: number;
            readonly details?: Record<string, unknown>;
        }>;
        readonly summary: string;
    }>;
    private testAgentInitialization;
    private testTaskCompletionEvolution;
    private testCrossProjectLearning;
    private testRealTimeMetrics;
    private testWebSocketIntegration;
    private testKnowledgeTransfer;
    private testPatternMatching;
    private testSystemHealth;
    private recordTest;
    private printDetailedResults;
    private setupEventListeners;
    /**
     * Clean up test resources
     */
    destroy(): void;
}
export declare function runEvolutionIntegrationTest(): Promise<void>;
export default EvolutionIntegrationTest;
//# sourceMappingURL=evolution-integration-test.d.ts.map