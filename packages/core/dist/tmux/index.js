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
export { 
// Enums and constants
TMUXSessionStatus, PanelPosition, AgentActivityStatus, WebSocketMessageType, CLICommandType, 
// Type guards
isValidSessionId, isValidPanelPosition, isWebSocketMessage, } from './types';
// ============================================================================
// CLASS EXPORTS
// ============================================================================
export { TMUXSessionManager } from './TMUXSessionManager';
export { GridLayoutManager } from './GridLayoutManager';
export { SessionScalingManager } from './SessionScalingManager';
export { WebSocketManager } from './WebSocketManager';
export { SessionPersistenceManager } from './SessionPersistenceManager';
export { CLIIntegration } from './CLIIntegration';
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
import { TMUXSessionManager } from './TMUXSessionManager';
import { GridLayoutManager } from './GridLayoutManager';
import { SessionScalingManager } from './SessionScalingManager';
import { WebSocketManager } from './WebSocketManager';
import { SessionPersistenceManager } from './SessionPersistenceManager';
import { CLIIntegration } from './CLIIntegration';
/**
 * Create a complete TMUX system with all components
 */
export function createTMUXSystem(config) {
    // Create session manager
    const sessionManager = new TMUXSessionManager(config.sessionManager);
    // Create grid layout manager
    const gridLayoutManager = new GridLayoutManager(config.gridLayout);
    // Create persistence manager
    const persistenceManager = new SessionPersistenceManager(config.persistence || createDefaultPersistenceConfig());
    // Create scaling manager
    const scalingManager = new SessionScalingManager(sessionManager, config.scaling?.config || createDefaultScalingConfig(), config.scaling?.loadBalancing);
    // Create WebSocket manager
    const webSocketManager = new WebSocketManager(config.webSocket?.port || 8080, config.webSocket?.config);
    // Create CLI integration
    const cliIntegration = new CLIIntegration(sessionManager, scalingManager, persistenceManager);
    // Set up cross-component event handling
    setupCrossComponentEvents({
        sessionManager,
        gridLayoutManager,
        scalingManager,
        webSocketManager,
        persistenceManager,
        cliIntegration,
    });
    return {
        sessionManager,
        gridLayoutManager,
        scalingManager,
        webSocketManager,
        persistenceManager,
        cliIntegration,
    };
}
/**
 * Create default session manager configuration
 */
export function createDefaultSessionManagerConfig() {
    return {
        sessionPrefix: 'sentra',
        maxSessions: 10,
        defaultLayout: {
            layout: 'tiled',
            panelSpacing: 1,
            borderStyle: 'single',
            statusLineEnabled: true,
            mouseEnabled: true,
            prefixKey: 'C-b',
        },
        defaultScaling: {
            maxSessionsPerInstance: 10,
            projectsPerSession: 4,
            autoScaling: {
                enabled: true,
                scaleUpThreshold: 80,
                scaleDownThreshold: 30,
                cooldownPeriod: 60000,
            },
        },
        websocketPort: 8080,
        heartbeatInterval: 30000,
        recoveryAttempts: 3,
        logLevel: 'info',
    };
}
/**
 * Create default scaling configuration
 */
export function createDefaultScalingConfig() {
    return {
        maxSessionsPerInstance: 10,
        projectsPerSession: 4,
        autoScaling: {
            enabled: true,
            scaleUpThreshold: 80,
            scaleDownThreshold: 30,
            cooldownPeriod: 60000,
        },
    };
}
/**
 * Create default persistence configuration
 */
export function createDefaultPersistenceConfig() {
    const dataDirectory = process.env['TMUX_DATA_DIR'] || './data/tmux';
    return {
        dataDirectory,
        enableCompression: true,
        encryptionEnabled: false,
        maxBackups: 5,
        backupInterval: 300000, // 5 minutes
        autoSaveInterval: 30000, // 30 seconds
        recoveryTimeout: 60000, // 1 minute
        enableIncrementalBackups: true,
    };
}
/**
 * Setup cross-component event handling
 */
function setupCrossComponentEvents(system) {
    const { sessionManager, gridLayoutManager, scalingManager, webSocketManager, persistenceManager, cliIntegration, } = system;
    // Session Manager -> Other Components
    sessionManager.on('session-created', (session) => {
        // Create grid layout for new session
        gridLayoutManager.createGridLayout(session.id, session.name, session.window.panels);
        // Save session state
        persistenceManager.saveSession(session);
        // Broadcast via WebSocket
        webSocketManager.broadcastMessage({
            id: require('uuid').v4(),
            type: 'SESSION_STATE_CHANGE',
            timestamp: new Date(),
            sessionId: session.id,
            data: {
                oldStatus: 'inactive',
                newStatus: session.status,
                reason: 'Session created',
            },
        });
    });
    sessionManager.on('session-destroyed', (sessionId) => {
        // Clean up grid layout
        gridLayoutManager.clearSessionLayout(sessionId);
        // Clean up persistence
        persistenceManager.deleteSession(sessionId);
    });
    // Scaling Manager -> WebSocket Manager
    scalingManager.on('scaling-decision', () => {
        webSocketManager.broadcastMessage({
            id: require('uuid').v4(),
            type: 'HEARTBEAT', // Using heartbeat as placeholder
            timestamp: new Date(),
            sessionId: '',
            data: {
                sessionHealth: 'healthy',
                activePanels: 0,
                totalConnections: 0,
            },
        });
    });
    // WebSocket Manager -> CLI Integration
    webSocketManager.on('command-received', async ({ command }) => {
        try {
            // Execute command via CLI integration
            const context = cliIntegration.parseCommandLine([command.type, ...command.parameters || []]);
            const result = await cliIntegration.executeCommand(context);
            // Send result back via WebSocket (in a real implementation)
            console.log(`Command executed: ${command.type}`, result);
        }
        catch (error) {
            console.error('Failed to execute WebSocket command:', error);
        }
    });
    // Persistence Manager -> Session Manager
    persistenceManager.on('session-recovered', (session) => {
        console.log(`Session ${session.id} recovered successfully`);
    });
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Validate TMUX system configuration
 */
export function validateTMUXSystemConfig(config) {
    const errors = [];
    // Validate session manager config
    if (!config.sessionManager.sessionPrefix) {
        errors.push('Session prefix is required');
    }
    if (config.sessionManager.maxSessions <= 0) {
        errors.push('Max sessions must be greater than 0');
    }
    // Validate WebSocket config
    if (config.webSocket) {
        if (config.webSocket.port <= 0 || config.webSocket.port > 65535) {
            errors.push('WebSocket port must be between 1 and 65535');
        }
    }
    // Validate scaling config
    if (config.scaling) {
        if (config.scaling.config.projectsPerSession !== 4) {
            errors.push('Projects per session must be exactly 4 for grid layout');
        }
    }
    // Validate persistence config
    if (config.persistence) {
        if (!config.persistence.dataDirectory) {
            errors.push('Persistence data directory is required');
        }
    }
    return errors;
}
/**
 * Get TMUX system health status
 */
export async function getTMUXSystemHealth(system) {
    const sessionHealth = await system.sessionManager.getHealth();
    const wsStats = system.webSocketManager.getStats();
    const scalingMetrics = await system.scalingManager.getCurrentMetrics();
    const persistenceStats = system.persistenceManager.getStats();
    const componentHealth = {
        sessionManager: sessionHealth.isHealthy
            ? 'healthy'
            : sessionHealth.activeSessions === 0
                ? 'critical'
                : 'warning',
        webSocketManager: wsStats.connectionErrors < 5
            ? 'healthy'
            : wsStats.connectionErrors > 20
                ? 'critical'
                : 'warning',
        scalingManager: scalingMetrics.errorProjects === 0
            ? 'healthy'
            : scalingMetrics.errorProjects >= scalingMetrics.totalProjects * 0.5
                ? 'critical'
                : 'warning',
        persistenceManager: persistenceStats.persistedSessions > 0
            ? 'healthy'
            : 'warning',
    };
    const overallHealth = Object.values(componentHealth).every(status => status === 'healthy')
        ? 'healthy'
        : Object.values(componentHealth).some(status => status === 'critical')
            ? 'critical'
            : 'warning';
    return {
        overall: overallHealth,
        components: componentHealth,
        metrics: {
            totalSessions: sessionHealth.activeSessions,
            totalConnections: wsStats.connectedClients,
            totalPanels: sessionHealth.totalPanels,
            uptime: wsStats.uptime,
        },
    };
}
/**
 * Cleanup TMUX system resources
 */
export async function cleanupTMUXSystem(system) {
    await Promise.all([
        system.sessionManager.cleanup(),
        system.webSocketManager.cleanup(),
        system.persistenceManager.cleanup(),
    ]);
    system.scalingManager.cleanup();
}
// ============================================================================
// MODULE METADATA
// ============================================================================
/**
 * TMUX module version and metadata
 */
export const TMUX_MODULE_INFO = {
    name: 'Sentra TMUX Session Management',
    version: '1.0.0',
    description: 'Complete TMUX session management system with 4-project grid layout',
    capabilities: [
        '4-project grid layout',
        'Auto-scaling sessions',
        'Real-time WebSocket updates',
        'Session persistence and recovery',
        'CLI integration and automation',
        'Performance monitoring',
        'Load balancing',
    ],
    requirements: {
        tmux: '^3.0.0',
        node: '^16.0.0',
        typescript: '^4.5.0',
    },
};
/**
 * Export module info for documentation and debugging
 */
export default TMUX_MODULE_INFO;
//# sourceMappingURL=index.js.map