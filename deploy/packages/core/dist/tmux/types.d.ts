/**
 * TMUX Session Management Types
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 *
 * This module provides comprehensive type definitions for TMUX session management:
 * - 4-project grid layout system
 * - Session scaling and management
 * - Real-time WebSocket integration
 * - Session persistence and recovery
 */
import type { Brand } from '@sentra/types';
import type { AgentInstanceId, TaskId, ProjectContextId } from '@sentra/types';
/**
 * Branded types for TMUX session management system
 */
export type SessionId = Brand<string, 'SessionId'>;
export type PanelId = Brand<string, 'PanelId'>;
export type WindowId = Brand<string, 'WindowId'>;
export type CommandId = Brand<string, 'CommandId'>;
export type WebSocketConnectionId = Brand<string, 'WebSocketConnectionId'>;
export type ActivityStreamId = Brand<string, 'ActivityStreamId'>;
/**
 * TMUX session status enumeration
 */
export declare const TMUXSessionStatus: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly STARTING: "starting";
    readonly STOPPING: "stopping";
    readonly ERROR: "error";
    readonly RECONNECTING: "reconnecting";
};
export type TMUXSessionStatusType = typeof TMUXSessionStatus[keyof typeof TMUXSessionStatus];
/**
 * Panel position in 4-project grid layout
 */
export declare const PanelPosition: {
    readonly TOP_LEFT: "top-left";
    readonly TOP_RIGHT: "top-right";
    readonly BOTTOM_LEFT: "bottom-left";
    readonly BOTTOM_RIGHT: "bottom-right";
};
export type PanelPositionType = typeof PanelPosition[keyof typeof PanelPosition];
/**
 * Agent activity status in panels
 */
export declare const AgentActivityStatus: {
    readonly IDLE: "idle";
    readonly WORKING: "working";
    readonly WAITING: "waiting";
    readonly ERROR: "error";
    readonly COMPLETED: "completed";
    readonly BLOCKED: "blocked";
};
export type AgentActivityStatusType = typeof AgentActivityStatus[keyof typeof AgentActivityStatus];
/**
 * Project activity metadata
 */
export interface ProjectActivity {
    readonly projectId: ProjectContextId;
    readonly agentId: AgentInstanceId;
    readonly currentTaskId?: TaskId;
    readonly status: AgentActivityStatusType;
    readonly lastUpdate: Date;
    readonly progressPercentage: number;
    readonly currentCommand?: string;
    readonly outputBuffer: readonly string[];
    readonly errorBuffer: readonly string[];
    readonly resourceUsage: {
        readonly cpu: number;
        readonly memory: number;
        readonly networkIO: number;
    };
}
/**
 * TMUX panel configuration
 */
export interface TMUXPanel {
    readonly id: PanelId;
    readonly position: PanelPositionType;
    readonly projectActivity: ProjectActivity;
    readonly dimensions: {
        readonly width: number;
        readonly height: number;
    };
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly lastActivityAt: Date;
}
/**
 * TMUX window containing 4-project grid
 */
export interface TMUXWindow {
    readonly id: WindowId;
    readonly sessionId: SessionId;
    readonly name: string;
    readonly panels: readonly [TMUXPanel, TMUXPanel, TMUXPanel, TMUXPanel];
    readonly isActive: boolean;
    readonly createdAt: Date;
}
/**
 * TMUX session containing projects
 */
export interface TMUXSession {
    readonly id: SessionId;
    readonly name: string;
    readonly status: TMUXSessionStatusType;
    readonly window: TMUXWindow;
    readonly projectRange: {
        readonly start: number;
        readonly end: number;
    };
    readonly websocketConnections: readonly WebSocketConnectionId[];
    readonly persistenceConfig: {
        readonly enabled: boolean;
        readonly saveInterval: number;
        readonly lastSave: Date;
    };
    readonly createdAt: Date;
    readonly lastActivityAt: Date;
}
/**
 * Session layout configuration for 4-project grid
 */
export interface SessionLayoutConfig {
    readonly layout: 'tiled' | 'even-horizontal' | 'even-vertical' | 'main-horizontal';
    readonly panelSpacing: number;
    readonly borderStyle: 'single' | 'double' | 'rounded' | 'thick';
    readonly statusLineEnabled: boolean;
    readonly mouseEnabled: boolean;
    readonly prefixKey: string;
}
/**
 * Session scaling configuration
 */
export interface SessionScalingConfig {
    readonly maxSessionsPerInstance: number;
    readonly projectsPerSession: 4;
    readonly autoScaling: {
        readonly enabled: boolean;
        readonly scaleUpThreshold: number;
        readonly scaleDownThreshold: number;
        readonly cooldownPeriod: number;
    };
}
/**
 * WebSocket message types for real-time updates
 */
export declare const WebSocketMessageType: {
    readonly PROJECT_ACTIVITY_UPDATE: "project_activity_update";
    readonly AGENT_STATUS_CHANGE: "agent_status_change";
    readonly TASK_PROGRESS_UPDATE: "task_progress_update";
    readonly SESSION_STATE_CHANGE: "session_state_change";
    readonly PANEL_OUTPUT_UPDATE: "panel_output_update";
    readonly ERROR_NOTIFICATION: "error_notification";
    readonly HEARTBEAT: "heartbeat";
};
export type WebSocketMessageType = typeof WebSocketMessageType[keyof typeof WebSocketMessageType];
/**
 * Base WebSocket message structure
 */
export interface BaseWebSocketMessage {
    readonly id: string;
    readonly type: WebSocketMessageType;
    readonly timestamp: Date;
    readonly sessionId: SessionId;
}
/**
 * Project activity update message
 */
export interface ProjectActivityUpdateMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.PROJECT_ACTIVITY_UPDATE;
    readonly data: {
        readonly panelId: PanelId;
        readonly activity: ProjectActivity;
    };
}
/**
 * Agent status change message
 */
export interface AgentStatusChangeMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.AGENT_STATUS_CHANGE;
    readonly data: {
        readonly agentId: AgentInstanceId;
        readonly oldStatus: AgentActivityStatusType;
        readonly newStatus: AgentActivityStatusType;
        readonly reason?: string;
    };
}
/**
 * Task progress update message
 */
export interface TaskProgressUpdateMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.TASK_PROGRESS_UPDATE;
    readonly data: {
        readonly taskId: TaskId;
        readonly agentId: AgentInstanceId;
        readonly progress: number;
        readonly details: string;
    };
}
/**
 * Session state change message
 */
export interface SessionStateChangeMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.SESSION_STATE_CHANGE;
    readonly data: {
        readonly oldStatus: TMUXSessionStatusType;
        readonly newStatus: TMUXSessionStatusType;
        readonly reason: string;
    };
}
/**
 * Panel output update message
 */
export interface PanelOutputUpdateMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.PANEL_OUTPUT_UPDATE;
    readonly data: {
        readonly panelId: PanelId;
        readonly outputType: 'stdout' | 'stderr';
        readonly content: string;
    };
}
/**
 * Error notification message
 */
export interface ErrorNotificationMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.ERROR_NOTIFICATION;
    readonly data: {
        readonly errorCode: string;
        readonly message: string;
        readonly panelId?: PanelId;
        readonly agentId?: AgentInstanceId;
        readonly severity: 'low' | 'medium' | 'high' | 'critical';
    };
}
/**
 * Heartbeat message
 */
export interface HeartbeatMessage extends BaseWebSocketMessage {
    readonly type: typeof WebSocketMessageType.HEARTBEAT;
    readonly data: {
        readonly sessionHealth: 'healthy' | 'warning' | 'critical';
        readonly activePanels: number;
        readonly totalConnections: number;
    };
}
/**
 * Union type for all WebSocket messages
 */
export type WebSocketMessage = ProjectActivityUpdateMessage | AgentStatusChangeMessage | TaskProgressUpdateMessage | SessionStateChangeMessage | PanelOutputUpdateMessage | ErrorNotificationMessage | HeartbeatMessage;
/**
 * Session creation parameters
 */
export interface SessionCreationParams {
    readonly sessionName?: string;
    readonly projectIds: readonly [ProjectContextId, ProjectContextId, ProjectContextId, ProjectContextId];
    readonly agentIds: readonly [AgentInstanceId, AgentInstanceId, AgentInstanceId, AgentInstanceId];
    readonly layoutConfig: SessionLayoutConfig;
    readonly scalingConfig?: SessionScalingConfig;
    readonly persistenceEnabled: boolean;
}
/**
 * Session recovery information
 */
export interface SessionRecoveryInfo {
    readonly sessionId: SessionId;
    readonly lastKnownState: TMUXSession;
    readonly recoveryAttempts: number;
    readonly lastAttempt: Date;
    readonly canRecover: boolean;
    readonly recoveryStrategy: 'restart' | 'reconnect' | 'rebuild';
}
/**
 * Session manager configuration
 */
export interface TMUXSessionManagerConfig {
    readonly tmuxSocketPath?: string;
    readonly sessionPrefix: string;
    readonly maxSessions: number;
    readonly defaultLayout: SessionLayoutConfig;
    readonly defaultScaling: SessionScalingConfig;
    readonly websocketPort: number;
    readonly heartbeatInterval: number;
    readonly recoveryAttempts: number;
    readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}
/**
 * Session manager health status
 */
export interface TMUXSessionManagerHealth {
    readonly isHealthy: boolean;
    readonly activeSessions: number;
    readonly totalPanels: number;
    readonly websocketConnections: number;
    readonly memoryUsage: number;
    readonly cpuUsage: number;
    readonly lastHealthCheck: Date;
    readonly issues: readonly string[];
}
/**
 * Command execution result
 */
export interface CommandExecutionResult {
    readonly commandId: CommandId;
    readonly success: boolean;
    readonly output: string;
    readonly errorOutput?: string;
    readonly exitCode: number;
    readonly executionTime: number;
    readonly panelId?: PanelId;
    readonly timestamp: Date;
}
/**
 * CLI command types for TMUX operations
 */
export declare const CLICommandType: {
    readonly CREATE_SESSION: "create_session";
    readonly LIST_SESSIONS: "list_sessions";
    readonly ATTACH_SESSION: "attach_session";
    readonly KILL_SESSION: "kill_session";
    readonly SEND_KEYS: "send_keys";
    readonly SPLIT_WINDOW: "split_window";
    readonly SELECT_PANEL: "select_panel";
    readonly RESIZE_PANEL: "resize_panel";
    readonly CAPTURE_PANE: "capture_pane";
};
export type CLICommandType = typeof CLICommandType[keyof typeof CLICommandType];
/**
 * CLI command interface
 */
export interface CLICommand {
    readonly type: CLICommandType;
    readonly sessionId?: SessionId;
    readonly panelId?: PanelId;
    readonly parameters: Record<string, unknown>;
    readonly timeout?: number;
}
/**
 * CLI operation result
 */
export interface CLIOperationResult<T = unknown> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: {
        readonly code: string;
        readonly message: string;
        readonly details?: unknown;
    };
    readonly executionTime: number;
    readonly timestamp: Date;
}
/**
 * Utility type for session metrics
 */
export type SessionMetrics = {
    readonly sessionId: SessionId;
    readonly uptime: number;
    readonly totalCommands: number;
    readonly averageResponseTime: number;
    readonly errorRate: number;
    readonly panelActivity: readonly {
        readonly panelId: PanelId;
        readonly commandsExecuted: number;
        readonly lastActivity: Date;
        readonly averageExecutionTime: number;
    }[];
};
/**
 * Type guard functions
 */
export declare const isValidSessionId: (value: unknown) => value is SessionId;
export declare const isValidPanelPosition: (value: unknown) => value is PanelPositionType;
export declare const isWebSocketMessage: (value: unknown) => value is WebSocketMessage;
/**
 * Utility type for creating session factory parameters
 */
export type SessionFactoryParams = {
    readonly startingProjectNumber: number;
    readonly sessionNamePrefix: string;
    readonly config: TMUXSessionManagerConfig;
};
//# sourceMappingURL=types.d.ts.map