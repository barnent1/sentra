/**
 * TMUX Session Management System
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This module provides comprehensive TMUX session management with:
 * - 4-project grid layout system
 * - Session scaling and load balancing
 * - Real-time WebSocket integration
 * - Session persistence and recovery
 * - CLI integration and automation
 *
 * @module tmux
 */
export type { SessionId, PanelId, WindowId, CommandId, WebSocketConnectionId, ActivityStreamId, TMUXSession, TMUXPanel, TMUXWindow, ProjectActivity, SessionCreationParams, SessionRecoveryInfo, TMUXSessionManagerConfig, TMUXSessionManagerHealth, CommandExecutionResult, CLICommand, CLIOperationResult, SessionMetrics, WebSocketMessage, BaseWebSocketMessage, ProjectActivityUpdateMessage, AgentStatusChangeMessage, TaskProgressUpdateMessage, SessionStateChangeMessage, PanelOutputUpdateMessage, ErrorNotificationMessage, HeartbeatMessage, SessionLayoutConfig, SessionScalingConfig, PanelPositionType, AgentActivityStatusType, TMUXSessionStatusType, SessionFactoryParams, } from './types';
export type { WebSocketClient, SubscriptionFilter, BroadcastConfig, ActivityStreamConfig, WebSocketStats, } from './WebSocketManager';
export type { GridLayoutConfiguration, PanelLayout, SessionGridLayout, } from './GridLayoutManager';
export type { ScalingMetrics, ScalingDecision, SessionLoad, LoadBalancingConfig, } from './SessionScalingManager';
export type { PersistenceConfig, PersistedSessionState, SessionCheckpoint, RecoveryStrategy, BackupMetadata, RecoveryResult, } from './SessionPersistenceManager';
export type { CLICommandDefinition, CLIOption, CLIExecutionContext, CLIOutputFormatter, InteractiveSession, } from './CLIIntegration';
export { TMUXSessionStatus, PanelPosition, AgentActivityStatus, WebSocketMessageType, CLICommandType, isValidSessionId, isValidPanelPosition, isWebSocketMessage, } from './types';
export { TMUXSessionManager } from './TMUXSessionManager';
export { GridLayoutManager } from './GridLayoutManager';
export { SessionScalingManager } from './SessionScalingManager';
export { WebSocketManager } from './WebSocketManager';
export { SessionPersistenceManager } from './SessionPersistenceManager';
export { CLIIntegration } from './CLIIntegration';
import { TMUXSessionManager } from './TMUXSessionManager';
import { GridLayoutManager } from './GridLayoutManager';
import { SessionScalingManager } from './SessionScalingManager';
import { WebSocketManager } from './WebSocketManager';
import { SessionPersistenceManager } from './SessionPersistenceManager';
import { CLIIntegration } from './CLIIntegration';
import type { TMUXSessionManagerConfig, SessionScalingConfig } from './types';
import type { GridLayoutConfiguration } from './GridLayoutManager';
import type { LoadBalancingConfig } from './SessionScalingManager';
import type { BroadcastConfig } from './WebSocketManager';
import type { PersistenceConfig } from './SessionPersistenceManager';
/**
 * Configuration for the complete TMUX system
 */
export interface TMUXSystemConfig {
    readonly sessionManager: TMUXSessionManagerConfig;
    readonly gridLayout?: Partial<GridLayoutConfiguration>;
    readonly scaling?: {
        readonly config: SessionScalingConfig;
        readonly loadBalancing?: Partial<LoadBalancingConfig>;
    };
    readonly webSocket?: {
        readonly port: number;
        readonly config?: Partial<BroadcastConfig>;
    };
    readonly persistence?: PersistenceConfig;
}
/**
 * Complete TMUX system instance
 */
export interface TMUXSystem {
    readonly sessionManager: TMUXSessionManager;
    readonly gridLayoutManager: GridLayoutManager;
    readonly scalingManager: SessionScalingManager;
    readonly webSocketManager: WebSocketManager;
    readonly persistenceManager: SessionPersistenceManager;
    readonly cliIntegration: CLIIntegration;
}
/**
 * Create a complete TMUX system with all components
 */
export declare function createTMUXSystem(config: TMUXSystemConfig): TMUXSystem;
/**
 * Create default session manager configuration
 */
export declare function createDefaultSessionManagerConfig(): TMUXSessionManagerConfig;
/**
 * Create default scaling configuration
 */
export declare function createDefaultScalingConfig(): SessionScalingConfig;
/**
 * Create default persistence configuration
 */
export declare function createDefaultPersistenceConfig(): PersistenceConfig;
/**
 * Validate TMUX system configuration
 */
export declare function validateTMUXSystemConfig(config: TMUXSystemConfig): readonly string[];
/**
 * Get TMUX system health status
 */
export declare function getTMUXSystemHealth(system: TMUXSystem): Promise<{
    readonly overall: 'healthy' | 'warning' | 'critical';
    readonly components: {
        readonly sessionManager: 'healthy' | 'warning' | 'critical';
        readonly webSocketManager: 'healthy' | 'warning' | 'critical';
        readonly scalingManager: 'healthy' | 'warning' | 'critical';
        readonly persistenceManager: 'healthy' | 'warning' | 'critical';
    };
    readonly metrics: {
        readonly totalSessions: number;
        readonly totalConnections: number;
        readonly totalPanels: number;
        readonly uptime: number;
    };
}>;
/**
 * Cleanup TMUX system resources
 */
export declare function cleanupTMUXSystem(system: TMUXSystem): Promise<void>;
/**
 * TMUX module version and metadata
 */
export declare const TMUX_MODULE_INFO: {
    readonly name: "Sentra TMUX Session Management";
    readonly version: "1.0.0";
    readonly description: "Complete TMUX session management system with 4-project grid layout";
    readonly capabilities: readonly ["4-project grid layout", "Auto-scaling sessions", "Real-time WebSocket updates", "Session persistence and recovery", "CLI integration and automation", "Performance monitoring", "Load balancing"];
    readonly requirements: {
        readonly tmux: "^3.0.0";
        readonly node: "^16.0.0";
        readonly typescript: "^4.5.0";
    };
};
/**
 * Export module info for documentation and debugging
 */
export default TMUX_MODULE_INFO;
//# sourceMappingURL=index.d.ts.map