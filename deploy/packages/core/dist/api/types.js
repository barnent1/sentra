/**
 * API Client Types for Sentra FastAPI Backend Integration
 *
 * Provides strict TypeScript interfaces for all FastAPI endpoints
 * following SENTRA project standards with branded types and readonly interfaces.
 *
 * @module APITypes
 */
// ============================================================================
// AGENT ROLE TYPES
// ============================================================================
export const AgentRole = {
    ANALYST: 'analyst',
    PM: 'pm',
    DEV: 'dev',
    QA: 'qa',
    UIUX: 'uiux',
    ORCHESTRATOR: 'orchestrator'
};
// ============================================================================
// TASK STATUS TYPES
// ============================================================================
export const TaskStatus = {
    QUEUED: 'queued',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
export const TaskPriority = {
    HIGH: 1,
    MEDIUM: 3,
    LOW: 5
};
// ============================================================================
// SUBAGENT STATUS TYPES
// ============================================================================
export const SubAgentStatus = {
    ACTIVE: 'active',
    IDLE: 'idle',
    TERMINATED: 'terminated'
};
// ============================================================================
// WEBSOCKET MESSAGE INTERFACES
// ============================================================================
export const WebSocketMessageType = {
    PROJECT_UPDATE: 'project_update',
    TASK_UPDATE: 'task_update',
    AGENT_UPDATE: 'agent_update',
    SYSTEM_UPDATE: 'system_update',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe'
};
// ============================================================================
// TYPE GUARDS
// ============================================================================
export const isAgentResponse = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        'role' in value &&
        'active' in value &&
        typeof value.active === 'boolean');
};
export const isTaskResponse = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'title' in value &&
        'status' in value &&
        'priority' in value &&
        typeof value.priority === 'number');
};
export const isWebSocketMessage = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        'id' in value &&
        'timestamp' in value &&
        'data' in value);
};
export const isAPIError = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'status_code' in value &&
        'message' in value &&
        'timestamp' in value &&
        typeof value.status_code === 'number');
};
//# sourceMappingURL=types.js.map