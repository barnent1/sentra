/**
 * TMUX Session Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This class manages TMUX sessions with 4-project grid layout, session scaling,
 * real-time WebSocket updates, and session persistence/recovery.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import type { 
  SessionId,
  PanelId,
  WindowId,
  CommandId,
  WebSocketConnectionId,
  TMUXSession,
  TMUXPanel,
  TMUXWindow,
  ProjectActivity,
  SessionCreationParams,
  TMUXSessionManagerConfig,
  TMUXSessionManagerHealth,
  CommandExecutionResult,
  CLICommand,
  CLIOperationResult,
  SessionMetrics,
  WebSocketMessage,
  PanelPositionType,
  AgentActivityStatusType,
  SessionLayoutConfig,
} from './types';
import {
  TMUXSessionStatus,
  PanelPosition,
  AgentActivityStatus,
  WebSocketMessageType,
  CLICommandType,
} from './types';
import type { AgentInstanceId, ProjectContextId } from '@sentra/types';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

/**
 * TMUX Session Manager class for handling 4-project grid sessions
 */
export class TMUXSessionManager extends EventEmitter {
  private readonly config: TMUXSessionManagerConfig;
  private readonly sessions: Map<SessionId, TMUXSession> = new Map();
  private readonly commandHistory: Map<CommandId, CommandExecutionResult> = new Map();
  private readonly websocketConnections: Map<WebSocketConnectionId, WebSocket> = new Map();
  private readonly activityStreams: Map<SessionId, NodeJS.Timeout> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private persistenceInterval?: NodeJS.Timeout;

  constructor(config: TMUXSessionManagerConfig) {
    super();
    this.config = config;
    this.initializeManager();
  }

  // ============================================================================
  // INITIALIZATION AND LIFECYCLE
  // ============================================================================

  private initializeManager(): void {
    this.startHealthChecking();
    this.startPersistenceSystem();
    this.setupEventHandlers();
    this.discoverExistingSessions();
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.getHealth();
      this.emit('health-update', health);
      
      if (!health.isHealthy) {
        this.emit('health-warning', health);
      }
    }, this.config.heartbeatInterval);
  }

  private startPersistenceSystem(): void {
    this.persistenceInterval = setInterval(async () => {
      await this.persistAllSessions();
    }, 30000); // Save every 30 seconds
  }

  private setupEventHandlers(): void {
    this.on('session-created', (session: TMUXSession) => {
      this.startActivityMonitoring(session.id);
    });

    this.on('session-destroyed', (sessionId: SessionId) => {
      this.stopActivityMonitoring(sessionId);
    });
  }

  private async discoverExistingSessions(): Promise<void> {
    try {
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}"');
      const existingSessions = stdout.trim().split('\n').filter(Boolean);
      
      for (const sessionName of existingSessions) {
        if (sessionName.startsWith(this.config.sessionPrefix)) {
          await this.recoverSession(sessionName);
        }
      }
    } catch (error) {
      // No existing sessions or tmux not running
      console.debug('No existing TMUX sessions found or TMUX not running');
    }
  }

  // ============================================================================
  // SESSION CREATION AND MANAGEMENT
  // ============================================================================

  /**
   * Create a new TMUX session with 4-project grid layout
   */
  async createSession(params: SessionCreationParams): Promise<TMUXSession> {
    const sessionId = this.generateSessionId();
    const sessionName = params.sessionName || `${this.config.sessionPrefix}-${sessionId}`;

    try {
      // Create base TMUX session
      await execAsync(`tmux new-session -d -s "${sessionName}"`);

      // Create 4-panel grid layout
      const window = await this.create4ProjectGrid(sessionId, sessionName, params);

      // Initialize session object
      const session: TMUXSession = {
        id: sessionId,
        name: sessionName,
        status: TMUXSessionStatus.ACTIVE,
        window,
        projectRange: {
          start: this.calculateProjectRangeStart(sessionId),
          end: this.calculateProjectRangeStart(sessionId) + 3,
        },
        websocketConnections: [],
        persistenceConfig: {
          enabled: params.persistenceEnabled,
          saveInterval: 30000,
          lastSave: new Date(),
        },
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      // Apply layout configuration
      await this.applyLayoutConfiguration(sessionId, params.layoutConfig);

      // Store session
      this.sessions.set(sessionId, session);

      // Start monitoring
      this.emit('session-created', session);

      return session;
    } catch (error) {
      throw new Error(`Failed to create TMUX session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create 4-project grid layout within a TMUX session
   */
  private async create4ProjectGrid(
    sessionId: SessionId,
    sessionName: string,
    params: SessionCreationParams
  ): Promise<TMUXWindow> {
    const windowId = this.generateWindowId();

    // Split window into 4 panels
    await execAsync(`tmux split-window -h -t "${sessionName}"`); // Create right panel
    await execAsync(`tmux split-window -v -t "${sessionName}.0"`); // Split left panel vertically
    await execAsync(`tmux split-window -v -t "${sessionName}.2"`); // Split right panel vertically

    // Create panel objects
    const panels: [TMUXPanel, TMUXPanel, TMUXPanel, TMUXPanel] = [
      await this.createPanel(PanelPosition.TOP_LEFT, params.projectIds[0], params.agentIds[0]),
      await this.createPanel(PanelPosition.TOP_RIGHT, params.projectIds[1], params.agentIds[1]),
      await this.createPanel(PanelPosition.BOTTOM_LEFT, params.projectIds[2], params.agentIds[2]),
      await this.createPanel(PanelPosition.BOTTOM_RIGHT, params.projectIds[3], params.agentIds[3]),
    ];

    const window: TMUXWindow = {
      id: windowId,
      sessionId,
      name: `${sessionName}-main`,
      panels,
      isActive: true,
      createdAt: new Date(),
    };

    return window;
  }

  /**
   * Create a single panel with project activity
   */
  private async createPanel(
    position: PanelPositionType,
    projectId: ProjectContextId,
    agentId: AgentInstanceId
  ): Promise<TMUXPanel> {
    const panelId = this.generatePanelId();

    const projectActivity: ProjectActivity = {
      projectId,
      agentId,
      status: AgentActivityStatus.IDLE,
      lastUpdate: new Date(),
      progressPercentage: 0,
      outputBuffer: [],
      errorBuffer: [],
      resourceUsage: {
        cpu: 0,
        memory: 0,
        networkIO: 0,
      },
    };

    const panel: TMUXPanel = {
      id: panelId,
      position,
      projectActivity,
      dimensions: {
        width: 80,
        height: 24,
      },
      isActive: position === PanelPosition.TOP_LEFT, // First panel is active by default
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    return panel;
  }

  /**
   * Apply layout configuration to session
   */
  private async applyLayoutConfiguration(
    sessionId: SessionId,
    layoutConfig: SessionLayoutConfig
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // Apply TMUX layout
      await execAsync(`tmux select-layout -t "${session.name}" ${layoutConfig.layout}`);

      // Configure status line
      if (layoutConfig.statusLineEnabled) {
        await execAsync(`tmux set-option -t "${session.name}" status on`);
        await execAsync(`tmux set-option -t "${session.name}" status-position bottom`);
      } else {
        await execAsync(`tmux set-option -t "${session.name}" status off`);
      }

      // Configure mouse support
      if (layoutConfig.mouseEnabled) {
        await execAsync(`tmux set-option -t "${session.name}" mouse on`);
      }

      // Set prefix key if different from default
      if (layoutConfig.prefixKey !== 'C-b') {
        await execAsync(`tmux set-option -t "${session.name}" prefix ${layoutConfig.prefixKey}`);
      }

    } catch (error) {
      console.error(`Failed to apply layout configuration: ${error}`);
    }
  }

  // ============================================================================
  // SESSION SCALING AND MANAGEMENT
  // ============================================================================

  /**
   * Scale sessions based on project load
   */
  async scaleSessionsForProjects(projectCount: number): Promise<readonly SessionId[]> {
    const sessionsNeeded = Math.ceil(projectCount / 4); // 4 projects per session
    const currentSessions = this.getActiveSessions().length;

    if (sessionsNeeded > currentSessions) {
      // Scale up
      const newSessions: SessionId[] = [];
      for (let i = currentSessions; i < sessionsNeeded; i++) {
        const startProjectNumber = i * 4 + 1;
        const sessionParams = this.createDefaultSessionParams(startProjectNumber);
        const session = await this.createSession(sessionParams);
        newSessions.push(session.id);
      }
      return newSessions;
    } else if (sessionsNeeded < currentSessions && this.config.defaultScaling.autoScaling.enabled) {
      // Scale down
      const sessionsToRemove = currentSessions - sessionsNeeded;
      const activeSessions = this.getActiveSessions();
      const sessionsRemoved: SessionId[] = [];
      
      for (let i = 0; i < sessionsToRemove; i++) {
        const sessionToRemove = activeSessions[activeSessions.length - 1 - i];
        if (sessionToRemove && this.canSafelyRemoveSession(sessionToRemove.id)) {
          await this.destroySession(sessionToRemove.id);
          sessionsRemoved.push(sessionToRemove.id);
        }
      }
      return sessionsRemoved;
    }

    return [];
  }

  /**
   * Check if a session can be safely removed
   */
  private canSafelyRemoveSession(sessionId: SessionId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;

    // Check if any panels have active work
    return session.window.panels.every(panel => 
      panel.projectActivity.status === AgentActivityStatus.IDLE ||
      panel.projectActivity.status === AgentActivityStatus.COMPLETED
    );
  }

  /**
   * Create default session parameters for scaling
   */
  private createDefaultSessionParams(startProjectNumber: number): SessionCreationParams {
    // Generate placeholder project and agent IDs
    const projectIds: [ProjectContextId, ProjectContextId, ProjectContextId, ProjectContextId] = [
      `project-${startProjectNumber}` as ProjectContextId,
      `project-${startProjectNumber + 1}` as ProjectContextId,
      `project-${startProjectNumber + 2}` as ProjectContextId,
      `project-${startProjectNumber + 3}` as ProjectContextId,
    ];

    const agentIds: [AgentInstanceId, AgentInstanceId, AgentInstanceId, AgentInstanceId] = [
      `agent-${startProjectNumber}` as AgentInstanceId,
      `agent-${startProjectNumber + 1}` as AgentInstanceId,
      `agent-${startProjectNumber + 2}` as AgentInstanceId,
      `agent-${startProjectNumber + 3}` as AgentInstanceId,
    ];

    return {
      sessionName: `${this.config.sessionPrefix}-projects-${startProjectNumber}-${startProjectNumber + 3}`,
      projectIds,
      agentIds,
      layoutConfig: this.config.defaultLayout,
      scalingConfig: this.config.defaultScaling,
      persistenceEnabled: true,
    };
  }

  // ============================================================================
  // REAL-TIME WEBSOCKET INTEGRATION
  // ============================================================================

  /**
   * Start activity monitoring for a session
   */
  private startActivityMonitoring(sessionId: SessionId): void {
    const interval = setInterval(async () => {
      await this.updateProjectActivities(sessionId);
    }, 1000); // Update every second

    this.activityStreams.set(sessionId, interval);
  }

  /**
   * Stop activity monitoring for a session
   */
  private stopActivityMonitoring(sessionId: SessionId): void {
    const interval = this.activityStreams.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.activityStreams.delete(sessionId);
    }
  }

  /**
   * Update project activities and broadcast changes
   */
  private async updateProjectActivities(sessionId: SessionId): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const panel of session.window.panels) {
      try {
        // Capture panel output
        const output = await this.capturePanelOutput(session.name, panel.position);
        
        // Update activity if output changed
        if (this.hasOutputChanged(panel, output)) {
          const updatedActivity = this.updatePanelActivity(panel.projectActivity, output);
          
          // Broadcast update via WebSocket
          const message: WebSocketMessage = {
            id: uuidv4(),
            type: WebSocketMessageType.PROJECT_ACTIVITY_UPDATE,
            timestamp: new Date(),
            sessionId,
            data: {
              panelId: panel.id,
              activity: updatedActivity,
            },
          };

          this.broadcastMessage(message);
        }
      } catch (error) {
        console.error(`Failed to update activity for panel ${panel.id}: ${error}`);
      }
    }
  }

  /**
   * Capture output from a specific panel
   */
  private async capturePanelOutput(sessionName: string, position: PanelPositionType): Promise<string> {
    const panelIndex = this.getPanelIndex(position);
    const { stdout } = await execAsync(`tmux capture-pane -t "${sessionName}.${panelIndex}" -p`);
    return stdout.trim();
  }

  /**
   * Get panel index for TMUX commands
   */
  private getPanelIndex(position: PanelPositionType): number {
    switch (position) {
      case PanelPosition.TOP_LEFT: return 0;
      case PanelPosition.TOP_RIGHT: return 1;
      case PanelPosition.BOTTOM_LEFT: return 2;
      case PanelPosition.BOTTOM_RIGHT: return 3;
    }
  }

  /**
   * Check if panel output has changed
   */
  private hasOutputChanged(panel: TMUXPanel, newOutput: string): boolean {
    const lastOutput = panel.projectActivity.outputBuffer[panel.projectActivity.outputBuffer.length - 1];
    return lastOutput !== newOutput;
  }

  /**
   * Update panel activity with new output
   */
  private updatePanelActivity(activity: ProjectActivity, output: string): ProjectActivity {
    return {
      ...activity,
      lastUpdate: new Date(),
      outputBuffer: [...activity.outputBuffer.slice(-99), output], // Keep last 100 lines
      status: this.inferActivityStatus(output),
    };
  }

  /**
   * Infer activity status from output
   */
  private inferActivityStatus(output: string): AgentActivityStatusType {
    if (output.includes('Error') || output.includes('error')) {
      return AgentActivityStatus.ERROR;
    }
    if (output.includes('Completed') || output.includes('Done')) {
      return AgentActivityStatus.COMPLETED;
    }
    if (output.includes('Running') || output.includes('Processing')) {
      return AgentActivityStatus.WORKING;
    }
    if (output.includes('Waiting') || output.includes('Blocked')) {
      return AgentActivityStatus.WAITING;
    }
    return AgentActivityStatus.IDLE;
  }

  /**
   * Broadcast message to all WebSocket connections
   */
  private broadcastMessage(message: WebSocketMessage): void {
    const messageString = JSON.stringify(message);
    
    this.websocketConnections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageString);
      } else {
        // Clean up dead connections
        this.websocketConnections.delete(connectionId);
      }
    });
  }

  // ============================================================================
  // SESSION PERSISTENCE AND RECOVERY
  // ============================================================================

  /**
   * Persist session state for recovery
   */
  async persistSession(sessionId: SessionId): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.persistenceConfig.enabled) return;

    try {
      const sessionState = JSON.stringify(session);
      // In a real implementation, this would save to a database or file system
      console.debug(`Persisted session ${sessionId} state: ${sessionState.length} bytes`);
      
      // Update last save time
      const updatedSession: TMUXSession = {
        ...session,
        persistenceConfig: {
          ...session.persistenceConfig,
          lastSave: new Date(),
        },
      };
      
      this.sessions.set(sessionId, updatedSession);
    } catch (error) {
      console.error(`Failed to persist session ${sessionId}: ${error}`);
    }
  }

  /**
   * Persist all sessions
   */
  private async persistAllSessions(): Promise<void> {
    const persistPromises = Array.from(this.sessions.keys()).map(sessionId =>
      this.persistSession(sessionId)
    );

    await Promise.allSettled(persistPromises);
  }

  /**
   * Recover a session from saved state
   */
  async recoverSession(sessionName: string): Promise<SessionId | null> {
    try {
      // Check if TMUX session still exists
      await execAsync(`tmux has-session -t "${sessionName}"`);
      
      // Session exists, reconstruct our internal state
      const sessionId = this.extractSessionIdFromName(sessionName);
      const session = await this.reconstructSessionFromTmux(sessionId, sessionName);
      
      this.sessions.set(sessionId, session);
      this.emit('session-recovered', session);
      
      return sessionId;
    } catch (error) {
      console.error(`Failed to recover session ${sessionName}: ${error}`);
      return null;
    }
  }

  /**
   * Reconstruct session object from existing TMUX session
   */
  private async reconstructSessionFromTmux(
    sessionId: SessionId,
    sessionName: string
  ): Promise<TMUXSession> {
    // In a real implementation, this would restore from persisted state
    // For now, create a minimal session object
    const window = await this.reconstructWindowFromTmux(sessionId, sessionName);

    return {
      id: sessionId,
      name: sessionName,
      status: TMUXSessionStatus.ACTIVE,
      window,
      projectRange: {
        start: this.calculateProjectRangeStart(sessionId),
        end: this.calculateProjectRangeStart(sessionId) + 3,
      },
      websocketConnections: [],
      persistenceConfig: {
        enabled: true,
        saveInterval: 30000,
        lastSave: new Date(),
      },
      createdAt: new Date(), // Would be restored from persistence
      lastActivityAt: new Date(),
    };
  }

  /**
   * Reconstruct window from TMUX session
   */
  private async reconstructWindowFromTmux(
    sessionId: SessionId,
    sessionName: string
  ): Promise<TMUXWindow> {
    const windowId = this.generateWindowId();
    
    // Create placeholder panels - in real implementation, restore from persistence
    const panels: [TMUXPanel, TMUXPanel, TMUXPanel, TMUXPanel] = [
      await this.createPanel(PanelPosition.TOP_LEFT, 'recovered-project-1' as ProjectContextId, 'recovered-agent-1' as AgentInstanceId),
      await this.createPanel(PanelPosition.TOP_RIGHT, 'recovered-project-2' as ProjectContextId, 'recovered-agent-2' as AgentInstanceId),
      await this.createPanel(PanelPosition.BOTTOM_LEFT, 'recovered-project-3' as ProjectContextId, 'recovered-agent-3' as AgentInstanceId),
      await this.createPanel(PanelPosition.BOTTOM_RIGHT, 'recovered-project-4' as ProjectContextId, 'recovered-agent-4' as AgentInstanceId),
    ];

    return {
      id: windowId,
      sessionId,
      name: `${sessionName}-main`,
      panels,
      isActive: true,
      createdAt: new Date(),
    };
  }

  // ============================================================================
  // CLI INTEGRATION METHODS
  // ============================================================================

  /**
   * Execute CLI command on session
   */
  async executeCLICommand(command: CLICommand): Promise<CLIOperationResult> {
    const startTime = Date.now();

    try {
      let result: unknown;
      
      switch (command.type) {
        case CLICommandType.CREATE_SESSION:
          result = await this.createSession(command.parameters as unknown as SessionCreationParams);
          break;
        case CLICommandType.LIST_SESSIONS:
          result = this.listSessions();
          break;
        case CLICommandType.ATTACH_SESSION:
          result = await this.attachToSession(command.sessionId!);
          break;
        case CLICommandType.KILL_SESSION:
          result = await this.destroySession(command.sessionId!);
          break;
        case CLICommandType.SEND_KEYS:
          result = await this.sendKeysToPanel(command.sessionId!, command.panelId!, (command.parameters as any)['keys'] as string);
          break;
        case CLICommandType.CAPTURE_PANE:
          result = await this.capturePanelContent(command.sessionId!, command.panelId!);
          break;
        default:
          throw new Error(`Unsupported command type: ${command.type}`);
      }

      const executionTime = Date.now() - startTime;
      return {
        success: true,
        data: result,
        executionTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: {
          code: 'CLI_COMMAND_FAILED',
          message: error instanceof Error ? error.message : String(error),
        },
        executionTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send keys to specific panel
   */
  async sendKeysToPanel(sessionId: SessionId, panelId: PanelId, keys: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const panel = session.window.panels.find(p => p.id === panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found in session ${sessionId}`);
    }

    const panelIndex = this.getPanelIndex(panel.position);
    await execAsync(`tmux send-keys -t "${session.name}.${panelIndex}" "${keys}" C-m`);
  }

  /**
   * Capture panel content
   */
  async capturePanelContent(sessionId: SessionId, panelId: PanelId): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const panel = session.window.panels.find(p => p.id === panelId);
    if (!panel) {
      throw new Error(`Panel ${panelId} not found in session ${sessionId}`);
    }

    return this.capturePanelOutput(session.name, panel.position);
  }

  // ============================================================================
  // SESSION QUERY AND STATUS METHODS
  // ============================================================================

  /**
   * List all active sessions
   */
  listSessions(): readonly TMUXSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === TMUXSessionStatus.ACTIVE
    );
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): readonly TMUXSession[] {
    return this.listSessions();
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: SessionId): TMUXSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(sessionId: SessionId): Promise<SessionMetrics | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const uptime = Date.now() - session.createdAt.getTime();
    
    return {
      sessionId,
      uptime,
      totalCommands: this.getCommandCountForSession(sessionId),
      averageResponseTime: this.getAverageResponseTimeForSession(sessionId),
      errorRate: this.getErrorRateForSession(sessionId),
      panelActivity: session.window.panels.map(panel => ({
        panelId: panel.id,
        commandsExecuted: this.getCommandCountForPanel(panel.id),
        lastActivity: panel.lastActivityAt,
        averageExecutionTime: this.getAverageExecutionTimeForPanel(panel.id),
      })),
    };
  }

  /**
   * Get manager health status
   */
  async getHealth(): Promise<TMUXSessionManagerHealth> {
    const activeSessions = this.getActiveSessions();
    const totalPanels = activeSessions.reduce((sum, session) => sum + session.window.panels.length, 0);
    
    return {
      isHealthy: this.isManagerHealthy(),
      activeSessions: activeSessions.length,
      totalPanels,
      websocketConnections: this.websocketConnections.size,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      lastHealthCheck: new Date(),
      issues: this.getHealthIssues(),
    };
  }

  // ============================================================================
  // SESSION LIFECYCLE METHODS
  // ============================================================================

  /**
   * Attach to existing session
   */
  async attachToSession(sessionId: SessionId): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await execAsync(`tmux attach-session -t "${session.name}"`);
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: SessionId): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await execAsync(`tmux kill-session -t "${session.name}"`);
      this.sessions.delete(sessionId);
      this.emit('session-destroyed', sessionId);
    } catch (error) {
      throw new Error(`Failed to destroy session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cleanup manager resources
   */
  async cleanup(): Promise<void> {
    // Stop intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }

    // Stop activity monitoring
    this.activityStreams.forEach((interval) => {
      clearInterval(interval);
    });
    this.activityStreams.clear();

    // Close WebSocket connections
    this.websocketConnections.forEach((ws) => {
      ws.close();
    });
    this.websocketConnections.clear();

    // Persist final state
    await this.persistAllSessions();
  }

  // ============================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================

  private generateSessionId(): SessionId {
    return uuidv4() as SessionId;
  }

  private generatePanelId(): PanelId {
    return uuidv4() as PanelId;
  }

  private generateWindowId(): WindowId {
    return uuidv4() as WindowId;
  }


  private calculateProjectRangeStart(sessionId: SessionId): number {
    // Simple calculation based on session creation order
    const sessionIndex = Array.from(this.sessions.keys()).indexOf(sessionId);
    return sessionIndex * 4 + 1;
  }

  private extractSessionIdFromName(sessionName: string): SessionId {
    // Extract session ID from name - simplified implementation
    const parts = sessionName.split('-');
    return (parts[parts.length - 1] || uuidv4()) as SessionId;
  }

  private getCommandCountForSession(sessionId: SessionId): number {
    return Array.from(this.commandHistory.values())
      .filter(result => result.panelId && this.isPanelInSession(result.panelId, sessionId))
      .length;
  }

  private getAverageResponseTimeForSession(sessionId: SessionId): number {
    const commands = Array.from(this.commandHistory.values())
      .filter(result => result.panelId && this.isPanelInSession(result.panelId, sessionId));
    
    if (commands.length === 0) return 0;
    
    const totalTime = commands.reduce((sum, cmd) => sum + cmd.executionTime, 0);
    return totalTime / commands.length;
  }

  private getErrorRateForSession(sessionId: SessionId): number {
    const commands = Array.from(this.commandHistory.values())
      .filter(result => result.panelId && this.isPanelInSession(result.panelId, sessionId));
    
    if (commands.length === 0) return 0;
    
    const errorCount = commands.filter(cmd => !cmd.success).length;
    return errorCount / commands.length;
  }

  private getCommandCountForPanel(panelId: PanelId): number {
    return Array.from(this.commandHistory.values())
      .filter(result => result.panelId === panelId)
      .length;
  }

  private getAverageExecutionTimeForPanel(panelId: PanelId): number {
    const commands = Array.from(this.commandHistory.values())
      .filter(result => result.panelId === panelId);
    
    if (commands.length === 0) return 0;
    
    const totalTime = commands.reduce((sum, cmd) => sum + cmd.executionTime, 0);
    return totalTime / commands.length;
  }

  private isPanelInSession(panelId: PanelId, sessionId: SessionId): boolean {
    const session = this.sessions.get(sessionId);
    return session ? session.window.panels.some(panel => panel.id === panelId) : false;
  }

  private isManagerHealthy(): boolean {
    const activeSessions = this.getActiveSessions();
    return activeSessions.every(session => session.status === TMUXSessionStatus.ACTIVE);
  }

  private getMemoryUsage(): number {
    // Simplified memory usage calculation
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }

  private getCpuUsage(): number {
    // Simplified CPU usage - in real implementation would use proper CPU monitoring
    return 0; // Placeholder
  }

  private getHealthIssues(): readonly string[] {
    const issues: string[] = [];
    
    this.getActiveSessions().forEach(session => {
      if (session.status !== TMUXSessionStatus.ACTIVE) {
        issues.push(`Session ${session.id} is not active`);
      }
      
      session.window.panels.forEach(panel => {
        if (panel.projectActivity.status === AgentActivityStatus.ERROR) {
          issues.push(`Panel ${panel.id} has error status`);
        }
      });
    });

    return issues;
  }
}