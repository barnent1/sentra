/**
 * TMUX Session Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This class manages TMUX sessions with 4-project grid layout, session scaling,
 * real-time WebSocket updates, and session persistence/recovery.
 */
import { EventEmitter } from 'events';
import type { SessionId, PanelId, TMUXSession, SessionCreationParams, TMUXSessionManagerConfig, TMUXSessionManagerHealth, CLICommand, CLIOperationResult, SessionMetrics } from './types';
/**
 * TMUX Session Manager class for handling 4-project grid sessions
 */
export declare class TMUXSessionManager extends EventEmitter {
    private readonly config;
    private readonly sessions;
    private readonly commandHistory;
    private readonly websocketConnections;
    private readonly activityStreams;
    private healthCheckInterval?;
    private persistenceInterval?;
    constructor(config: TMUXSessionManagerConfig);
    private initializeManager;
    private startHealthChecking;
    private startPersistenceSystem;
    private setupEventHandlers;
    private discoverExistingSessions;
    /**
     * Create a new TMUX session with 4-project grid layout
     */
    createSession(params: SessionCreationParams): Promise<TMUXSession>;
    /**
     * Create 4-project grid layout within a TMUX session
     */
    private create4ProjectGrid;
    /**
     * Create a single panel with project activity
     */
    private createPanel;
    /**
     * Apply layout configuration to session
     */
    private applyLayoutConfiguration;
    /**
     * Scale sessions based on project load
     */
    scaleSessionsForProjects(projectCount: number): Promise<readonly SessionId[]>;
    /**
     * Check if a session can be safely removed
     */
    private canSafelyRemoveSession;
    /**
     * Create default session parameters for scaling
     */
    private createDefaultSessionParams;
    /**
     * Start activity monitoring for a session
     */
    private startActivityMonitoring;
    /**
     * Stop activity monitoring for a session
     */
    private stopActivityMonitoring;
    /**
     * Update project activities and broadcast changes
     */
    private updateProjectActivities;
    /**
     * Capture output from a specific panel
     */
    private capturePanelOutput;
    /**
     * Get panel index for TMUX commands
     */
    private getPanelIndex;
    /**
     * Check if panel output has changed
     */
    private hasOutputChanged;
    /**
     * Update panel activity with new output
     */
    private updatePanelActivity;
    /**
     * Infer activity status from output
     */
    private inferActivityStatus;
    /**
     * Broadcast message to all WebSocket connections
     */
    private broadcastMessage;
    /**
     * Persist session state for recovery
     */
    persistSession(sessionId: SessionId): Promise<void>;
    /**
     * Persist all sessions
     */
    private persistAllSessions;
    /**
     * Recover a session from saved state
     */
    recoverSession(sessionName: string): Promise<SessionId | null>;
    /**
     * Reconstruct session object from existing TMUX session
     */
    private reconstructSessionFromTmux;
    /**
     * Reconstruct window from TMUX session
     */
    private reconstructWindowFromTmux;
    /**
     * Execute CLI command on session
     */
    executeCLICommand(command: CLICommand): Promise<CLIOperationResult>;
    /**
     * Send keys to specific panel
     */
    sendKeysToPanel(sessionId: SessionId, panelId: PanelId, keys: string): Promise<void>;
    /**
     * Capture panel content
     */
    capturePanelContent(sessionId: SessionId, panelId: PanelId): Promise<string>;
    /**
     * List all active sessions
     */
    listSessions(): readonly TMUXSession[];
    /**
     * Get active sessions
     */
    getActiveSessions(): readonly TMUXSession[];
    /**
     * Get session by ID
     */
    getSession(sessionId: SessionId): TMUXSession | undefined;
    /**
     * Get session metrics
     */
    getSessionMetrics(sessionId: SessionId): Promise<SessionMetrics | undefined>;
    /**
     * Get manager health status
     */
    getHealth(): Promise<TMUXSessionManagerHealth>;
    /**
     * Attach to existing session
     */
    attachToSession(sessionId: SessionId): Promise<void>;
    /**
     * Destroy session
     */
    destroySession(sessionId: SessionId): Promise<void>;
    /**
     * Cleanup manager resources
     */
    cleanup(): Promise<void>;
    private generateSessionId;
    private generatePanelId;
    private generateWindowId;
    private calculateProjectRangeStart;
    private extractSessionIdFromName;
    private getCommandCountForSession;
    private getAverageResponseTimeForSession;
    private getErrorRateForSession;
    private getCommandCountForPanel;
    private getAverageExecutionTimeForPanel;
    private isPanelInSession;
    private isManagerHealthy;
    private getMemoryUsage;
    private getCpuUsage;
    private getHealthIssues;
}
//# sourceMappingURL=TMUXSessionManager.d.ts.map