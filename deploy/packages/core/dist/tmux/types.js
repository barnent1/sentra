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
// ============================================================================
// CORE TMUX INTERFACES
// ============================================================================
/**
 * TMUX session status enumeration
 */
export const TMUXSessionStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    STARTING: 'starting',
    STOPPING: 'stopping',
    ERROR: 'error',
    RECONNECTING: 'reconnecting',
};
/**
 * Panel position in 4-project grid layout
 */
export const PanelPosition = {
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
};
/**
 * Agent activity status in panels
 */
export const AgentActivityStatus = {
    IDLE: 'idle',
    WORKING: 'working',
    WAITING: 'waiting',
    ERROR: 'error',
    COMPLETED: 'completed',
    BLOCKED: 'blocked',
};
// ============================================================================
// WEBSOCKET AND REAL-TIME TYPES
// ============================================================================
/**
 * WebSocket message types for real-time updates
 */
export const WebSocketMessageType = {
    PROJECT_ACTIVITY_UPDATE: 'project_activity_update',
    AGENT_STATUS_CHANGE: 'agent_status_change',
    TASK_PROGRESS_UPDATE: 'task_progress_update',
    SESSION_STATE_CHANGE: 'session_state_change',
    PANEL_OUTPUT_UPDATE: 'panel_output_update',
    ERROR_NOTIFICATION: 'error_notification',
    HEARTBEAT: 'heartbeat',
};
// ============================================================================
// CLI INTEGRATION TYPES
// ============================================================================
/**
 * CLI command types for TMUX operations
 */
export const CLICommandType = {
    CREATE_SESSION: 'create_session',
    LIST_SESSIONS: 'list_sessions',
    ATTACH_SESSION: 'attach_session',
    KILL_SESSION: 'kill_session',
    SEND_KEYS: 'send_keys',
    SPLIT_WINDOW: 'split_window',
    SELECT_PANEL: 'select_panel',
    RESIZE_PANEL: 'resize_panel',
    CAPTURE_PANE: 'capture_pane',
};
/**
 * Type guard functions
 */
export const isValidSessionId = (value) => {
    return typeof value === 'string' && value.length > 0;
};
export const isValidPanelPosition = (value) => {
    return Object.values(PanelPosition).includes(value);
};
export const isWebSocketMessage = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'type' in value &&
        'timestamp' in value &&
        'sessionId' in value &&
        Object.values(WebSocketMessageType).includes(value.type));
};
// Export all constants for external use (already exported above, no need to re-export)
//# sourceMappingURL=types.js.map