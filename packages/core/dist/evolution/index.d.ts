/**
 * Evolution Integration System - Main Index
 *
 * This module exports all evolution integration components and provides
 * a unified interface for connecting DNA evolution to project management workflow.
 *
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 */
export { EvolutionIntegrationService } from './evolution-service';
export type { EvolutionServiceId, EvolutionServiceConfig, EvolutionIntegrationResult, EvolutionEventData, CrossProjectPattern, EvolutionMetricsUpdate, ProjectLearningContext, } from './evolution-service';
export { PatternMatchingService, VectorOperations } from './pattern-matching';
export type { PatternMatchingId, EmbeddingVector, PatternSimilarityResult, PatternCluster, CrossProjectTransferCandidate, PatternMatchingConfig, } from './pattern-matching';
export { EvolutionMetricsService } from './metrics-service';
export type { MetricsServiceId, MetricId, EvolutionMetricPoint, MetricsAggregation, EvolutionTrend, EvolutionAlert, RealTimeEvolutionDashboard, MetricsServiceConfig, } from './metrics-service';
export { EvolutionMetricType } from './metrics-service';
export { EvolutionWebSocketBridge } from './websocket-bridge';
export type { WebSocketConnectionId, EvolutionWebSocketMessage, EvolutionSubscription, WebSocketConnection, } from './websocket-bridge';
export { EvolutionWebSocketMessageType, EvolutionSubscriptionType } from './websocket-bridge';
export { KnowledgeTransferService } from './knowledge-transfer';
export type { KnowledgeTransferId, LearningSessionId, KnowledgeItemId, KnowledgeItem, KnowledgeContent, KnowledgeApplicability, KnowledgeQuality, KnowledgeTransferRequest, KnowledgeTransferResult, CrossProjectLearningSession, } from './knowledge-transfer';
export { KnowledgeType, TransferType } from './knowledge-transfer';
import { EventEmitter } from 'events';
import type { CodeDNA, EvolutionDnaId, AgentInstanceId, ProjectContextId, TaskId, ProjectContext, Brand } from '@sentra/types';
import type { PerformanceFeedback } from '../types';
import { type EvolutionServiceConfig } from './evolution-service';
import { type PatternMatchingConfig } from './pattern-matching';
import { type MetricsServiceConfig } from './metrics-service';
import { EvolutionWebSocketBridge } from './websocket-bridge';
import { KnowledgeTransferService } from './knowledge-transfer';
export type EvolutionOrchestratorId = Brand<string, 'EvolutionOrchestratorId'>;
export interface EvolutionOrchestratorConfig {
    readonly evolution: Partial<EvolutionServiceConfig>;
    readonly patternMatching: Partial<PatternMatchingConfig>;
    readonly metrics: Partial<MetricsServiceConfig>;
    readonly realTimeUpdates: boolean;
    readonly knowledgeTransfer: boolean;
}
/**
 * Main orchestrator that coordinates all evolution integration services
 */
export declare class EvolutionOrchestrator extends EventEmitter {
    readonly id: EvolutionOrchestratorId;
    private readonly evolutionService;
    private readonly patternMatchingService;
    private readonly metricsService;
    private readonly webSocketBridge;
    private readonly knowledgeTransferService;
    private readonly config;
    constructor(config?: Partial<EvolutionOrchestratorConfig>);
    /**
     * Initialize agent with DNA for a project
     */
    initializeAgent(agentId: AgentInstanceId, projectContext: ProjectContext, taskId?: TaskId, seedPatterns?: readonly CodeDNA[]): Promise<{
        readonly success: boolean;
        readonly dnaId: EvolutionDnaId;
        readonly fitnessScore: number;
        readonly reason: string;
    }>;
    /**
     * Process task completion and trigger evolution if needed
     */
    processTaskCompletion(agentId: AgentInstanceId, taskId: TaskId, feedback: PerformanceFeedback): Promise<{
        readonly evolutionTriggered: boolean;
        readonly newDnaId?: EvolutionDnaId;
        readonly fitnessImprovement: number;
        readonly knowledgeExtracted: number;
    }>;
    /**
     * Get real-time evolution dashboard
     */
    getDashboard(): Promise<import('./metrics-service').RealTimeEvolutionDashboard>;
    /**
     * Get system health score
     */
    getSystemHealth(): number;
    /**
     * Find knowledge for agent
     */
    findKnowledgeForAgent(agentId: AgentInstanceId, projectId: ProjectContextId, context: ProjectContext, currentDna: CodeDNA): Promise<readonly import('./knowledge-transfer').KnowledgeItem[]>;
    /**
     * Get transfer statistics
     */
    getKnowledgeStats(): ReturnType<KnowledgeTransferService['getTransferStatistics']>;
    /**
     * Register WebSocket connection
     */
    registerWebSocketConnection(connectionId: import('./websocket-bridge').WebSocketConnectionId, clientType?: 'dashboard' | 'mobile' | 'tmux' | 'api'): void;
    /**
     * Get connection statistics
     */
    getConnectionStats(): ReturnType<EvolutionWebSocketBridge['getConnectionStats']>;
    private setupServiceIntegration;
    /**
     * Clean up all resources
     */
    destroy(): void;
}
export default EvolutionOrchestrator;
//# sourceMappingURL=index.d.ts.map