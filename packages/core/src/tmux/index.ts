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

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Branded types
  SessionId,
  PanelId,
  WindowId,
  CommandId,
  WebSocketConnectionId,
  ActivityStreamId,

  // Core TMUX interfaces
  TMUXSession,
  TMUXPanel,
  TMUXWindow,
  ProjectActivity,
  SessionCreationParams,
  SessionRecoveryInfo,
  TMUXSessionManagerConfig,
  TMUXSessionManagerHealth,
  CommandExecutionResult,
  CLICommand,
  CLIOperationResult,
  SessionMetrics,

  // WebSocket types
  WebSocketMessage,
  BaseWebSocketMessage,
  ProjectActivityUpdateMessage,
  AgentStatusChangeMessage,
  TaskProgressUpdateMessage,
  SessionStateChangeMessage,
  PanelOutputUpdateMessage,
  ErrorNotificationMessage,
  HeartbeatMessage,

  // Layout types
  SessionLayoutConfig,
  SessionScalingConfig,
  PanelPositionType,
  AgentActivityStatusType,
  TMUXSessionStatusType,

  // Factory utility types
  SessionFactoryParams,
} from './types';

// Additional type exports from individual manager files
export type {
  // WebSocket management types
  WebSocketClient,
  SubscriptionFilter,
  BroadcastConfig,
  ActivityStreamConfig,
  WebSocketStats,
} from './WebSocketManager';

export type {
  // Grid layout types
  GridLayoutConfiguration,
  PanelLayout,
  SessionGridLayout,
} from './GridLayoutManager';

export type {
  // Scaling types
  ScalingMetrics,
  ScalingDecision,
  SessionLoad,
  LoadBalancingConfig,
} from './SessionScalingManager';

export type {
  // Persistence types
  PersistenceConfig,
  PersistedSessionState,
  SessionCheckpoint,
  RecoveryStrategy,
  BackupMetadata,
  RecoveryResult,
} from './SessionPersistenceManager';

export type {
  // CLI types
  CLICommandDefinition,
  CLIOption,
  CLIExecutionContext,
  CLIOutputFormatter,
  InteractiveSession,
} from './CLIIntegration';

export {
  // Enums and constants
  TMUXSessionStatus,
  PanelPosition,
  AgentActivityStatus,
  WebSocketMessageType,
  CLICommandType,

  // Type guards
  isValidSessionId,
  isValidPanelPosition,
  isWebSocketMessage,
} from './types';

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
import type {
  TMUXSessionManagerConfig,
  SessionScalingConfig,
} from './types';
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
export function createTMUXSystem(config: TMUXSystemConfig): TMUXSystem {
  // Create session manager
  const sessionManager = new TMUXSessionManager(config.sessionManager);

  // Create grid layout manager
  const gridLayoutManager = new GridLayoutManager(config.gridLayout);

  // Create persistence manager
  const persistenceManager = new SessionPersistenceManager(
    config.persistence || createDefaultPersistenceConfig()
  );

  // Create scaling manager
  const scalingManager = new SessionScalingManager(
    sessionManager,
    config.scaling?.config || createDefaultScalingConfig(),
    config.scaling?.loadBalancing
  );

  // Create WebSocket manager
  const webSocketManager = new WebSocketManager(
    config.webSocket?.port || 8080,
    config.webSocket?.config
  );

  // Create CLI integration
  const cliIntegration = new CLIIntegration(
    sessionManager,
    scalingManager,
    persistenceManager
  );

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
export function createDefaultSessionManagerConfig(): TMUXSessionManagerConfig {
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
export function createDefaultScalingConfig(): SessionScalingConfig {
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
export function createDefaultPersistenceConfig(): PersistenceConfig {
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
function setupCrossComponentEvents(system: TMUXSystem): void {
  const {
    sessionManager,
    gridLayoutManager,
    scalingManager,
    webSocketManager,
    persistenceManager,
    cliIntegration,
  } = system;

  // Session Manager -> Other Components
  sessionManager.on('session-created', (session) => {
    // Create grid layout for new session
    gridLayoutManager.createGridLayout(session.id, session.name, session.window.panels);
    
    // Save session state
    persistenceManager.saveSession(session);
    
    // Broadcast via WebSocket
    webSocketManager.broadcastMessage({
      id: require('uuid').v4(),
      type: 'SESSION_STATE_CHANGE' as any,
      timestamp: new Date(),
      sessionId: session.id,
      data: {
        oldStatus: 'inactive' as any,
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
      type: 'HEARTBEAT' as any, // Using heartbeat as placeholder
      timestamp: new Date(),
      sessionId: '' as any,
      data: {
        sessionHealth: 'healthy' as any,
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
    } catch (error) {
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
export function validateTMUXSystemConfig(config: TMUXSystemConfig): readonly string[] {
  const errors: string[] = [];

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
export async function getTMUXSystemHealth(system: TMUXSystem): Promise<{
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
}> {
  const sessionHealth = await system.sessionManager.getHealth();
  const wsStats = system.webSocketManager.getStats();
  const scalingMetrics = await system.scalingManager.getCurrentMetrics();
  const persistenceStats = system.persistenceManager.getStats();

  const componentHealth = {
    sessionManager: sessionHealth.isHealthy 
      ? 'healthy' as const 
      : sessionHealth.activeSessions === 0 
        ? 'critical' as const 
        : 'warning' as const,
    webSocketManager: wsStats.connectionErrors < 5 
      ? 'healthy' as const 
      : wsStats.connectionErrors > 20 
        ? 'critical' as const 
        : 'warning' as const,
    scalingManager: scalingMetrics.errorProjects === 0 
      ? 'healthy' as const 
      : scalingMetrics.errorProjects >= scalingMetrics.totalProjects * 0.5 
        ? 'critical' as const 
        : 'warning' as const,
    persistenceManager: persistenceStats.persistedSessions > 0 
      ? 'healthy' as const 
      : 'warning' as const,
  };

  const overallHealth = Object.values(componentHealth).every(status => status === 'healthy') 
    ? 'healthy' as const 
    : Object.values(componentHealth).some(status => status === 'critical') 
      ? 'critical' as const 
      : 'warning' as const;

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
export async function cleanupTMUXSystem(system: TMUXSystem): Promise<void> {
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
} as const;

/**
 * Export module info for documentation and debugging
 */
export default TMUX_MODULE_INFO;