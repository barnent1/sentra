/**
 * Developer Agent - Specialized for code implementation with exceptional quality
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This agent:
 * - Implements features using current documentation
 * - Writes comprehensive code with 100% test coverage
 * - Follows modern TypeScript patterns (no any, strict types, branded types)
 * - Uses right-sized models (Claude for complex, GPT for standard)
 */
import { BaseEvolutionaryAgent, type TaskExecutionContext, type AgentExecutionResult } from './base-agent';
import type { AgentInstanceId, CodeDNA, AgentCapabilities, AgentType } from '@sentra/types';
/**
 * Developer Agent - Expert code implementation
 */
export declare class DeveloperAgent extends BaseEvolutionaryAgent {
    private readonly supportedLanguages;
    private readonly supportedFrameworks;
    constructor(id: AgentInstanceId, dna: CodeDNA);
    get type(): AgentType;
    get capabilities(): AgentCapabilities;
    /**
     * Check if developer can handle a task
     */
    canHandleTask(context: TaskExecutionContext): boolean;
    /**
     * Execute code implementation task
     */
    executeTask(context: TaskExecutionContext): Promise<AgentExecutionResult>;
    /**
     * Create implementation plan from requirements
     */
    private createImplementationPlan;
    /**
     * Fetch current documentation for technologies
     */
    private fetchCurrentDocumentation;
    /**
     * Generate code implementation with tests
     */
    private generateCode;
    /**
     * Validate implementation quality
     */
    private validateImplementation;
    private generateMainImplementation;
    private generateTypeDefinitions;
    private generateUtilities;
    private generateUnitTests;
    private generateIntegrationTests;
    private generateE2ETests;
    private generateReadme;
    private generateAPIDocumentation;
    private generateUsageExample;
    private generateAdvancedExample;
    private extractRequiredTechnologies;
    private canSupportTechnologies;
    private estimateComplexity;
    private determineApproach;
    private selectArchitecture;
    private selectPatterns;
    private getCurrentVersion;
    private calculateDeveloperMetrics;
    private assessCodeQuality;
    private assessMaintainability;
    private estimateTokensUsed;
    private estimateMemoryUsage;
    private calculateCodeComplexity;
    private createValidationFailureResult;
}
export default DeveloperAgent;
//# sourceMappingURL=developer-agent.d.ts.map