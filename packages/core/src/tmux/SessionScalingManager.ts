/**
 * TMUX Session Scaling Manager
 * Following SENTRA project standards: strict TypeScript with branded types and readonly interfaces
 * 
 * This class manages automatic scaling of TMUX sessions based on project load,
 * handling creation, destruction, and load balancing of multiple sessions.
 */

import { EventEmitter } from 'events';
import type {
  SessionId,
  TMUXSession,
  SessionScalingConfig,
  SessionCreationParams,
  ProjectActivity,
} from './types';
import {
  AgentActivityStatus,
} from './types';
import type { ProjectContextId, AgentInstanceId } from '@sentra/types';
import type { TMUXSessionManager } from './TMUXSessionManager';

/**
 * Scaling metrics for decision making
 */
export interface ScalingMetrics {
  readonly timestamp: Date;
  readonly totalProjects: number;
  readonly activeProjects: number;
  readonly idleProjects: number;
  readonly errorProjects: number;
  readonly completedProjects: number;
  readonly totalSessions: number;
  readonly activeSessions: number;
  readonly averageProjectsPerSession: number;
  readonly systemLoad: {
    readonly cpu: number;
    readonly memory: number;
    readonly activePanels: number;
  };
}

/**
 * Scaling decision result
 */
export interface ScalingDecision {
  readonly action: 'scale_up' | 'scale_down' | 'maintain' | 'rebalance';
  readonly reason: string;
  readonly targetSessionCount: number;
  readonly projectsToMove?: readonly {
    readonly projectId: ProjectContextId;
    readonly fromSessionId: SessionId;
    readonly toSessionId: SessionId;
  }[];
  readonly sessionsToCreate: number;
  readonly sessionsToDestroy: readonly SessionId[];
  readonly confidence: number; // 0.0 to 1.0
  readonly expectedImpact: {
    readonly performanceImprovement: number;
    readonly resourceSavings: number;
    readonly downtime: number;
  };
}

/**
 * Session load information
 */
export interface SessionLoad {
  readonly sessionId: SessionId;
  readonly projectCount: number;
  readonly activeProjects: number;
  readonly totalCpuUsage: number;
  readonly totalMemoryUsage: number;
  readonly averageResponseTime: number;
  readonly errorRate: number;
  readonly utilizationScore: number; // 0.0 to 1.0
  readonly canAcceptMoreProjects: boolean;
  readonly healthScore: number; // 0.0 to 1.0
}

/**
 * Load balancing strategy configuration
 */
export interface LoadBalancingConfig {
  readonly strategy: 'round_robin' | 'least_loaded' | 'performance_based' | 'hybrid';
  readonly rebalanceThreshold: number; // When to trigger rebalancing
  readonly maxProjectsPerSession: number;
  readonly minProjectsPerSession: number;
  readonly healthThreshold: number; // Minimum health score
  readonly performanceThreshold: number; // Minimum performance score
}

/**
 * Session scaling manager
 */
export class SessionScalingManager extends EventEmitter {
  private readonly sessionManager: TMUXSessionManager;
  private readonly scalingConfig: SessionScalingConfig;
  private readonly loadBalancingConfig: LoadBalancingConfig;
  private readonly scalingMetrics: Map<Date, ScalingMetrics> = new Map();
  private scalingInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private lastScalingAction: Date = new Date();
  private readonly cooldownPeriod: number;

  constructor(
    sessionManager: TMUXSessionManager,
    scalingConfig: SessionScalingConfig,
    loadBalancingConfig?: Partial<LoadBalancingConfig>
  ) {
    super();
    this.sessionManager = sessionManager;
    this.scalingConfig = scalingConfig;
    this.loadBalancingConfig = this.mergeLoadBalancingConfig(loadBalancingConfig);
    this.cooldownPeriod = scalingConfig.autoScaling.cooldownPeriod || 60000; // 1 minute default
    
    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION AND LIFECYCLE
  // ============================================================================

  private initialize(): void {
    if (this.scalingConfig.autoScaling.enabled) {
      this.startAutoScaling();
    }
    this.startMetricsCollection();
    this.setupEventHandlers();
  }

  private startAutoScaling(): void {
    this.scalingInterval = setInterval(async () => {
      await this.performScalingCheck();
    }, 10000); // Check every 10 seconds
  }

  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      const metrics = await this.collectScalingMetrics();
      this.scalingMetrics.set(new Date(), metrics);
      
      // Keep only last 100 metrics entries
      if (this.scalingMetrics.size > 100) {
        const oldestKey = Array.from(this.scalingMetrics.keys())[0];
        if (oldestKey !== undefined) {
          this.scalingMetrics.delete(oldestKey);
        }
      }
      
      this.emit('metrics-collected', metrics);
    }, 5000); // Collect every 5 seconds
  }

  private setupEventHandlers(): void {
    this.on('scaling-decision', (decision: ScalingDecision) => {
      this.executeScalingDecision(decision);
    });
  }

  // ============================================================================
  // SCALING DECISION MAKING
  // ============================================================================

  /**
   * Perform scaling check and make decisions
   */
  async performScalingCheck(): Promise<ScalingDecision> {
    // Check cooldown period
    if (this.isInCooldownPeriod()) {
      const decision: ScalingDecision = {
        action: 'maintain',
        reason: 'Cooldown period active',
        targetSessionCount: this.sessionManager.getActiveSessions().length,
        sessionsToCreate: 0,
        sessionsToDestroy: [],
        confidence: 1.0,
        expectedImpact: { performanceImprovement: 0, resourceSavings: 0, downtime: 0 },
      };
      return decision;
    }

    const metrics = await this.collectScalingMetrics();
    const sessionLoads = await this.calculateSessionLoads();
    const decision = this.makeScalingDecision(metrics, sessionLoads);

    this.emit('scaling-decision', decision);
    return decision;
  }

  /**
   * Make scaling decision based on metrics
   */
  private makeScalingDecision(
    metrics: ScalingMetrics,
    sessionLoads: readonly SessionLoad[]
  ): ScalingDecision {
    // Check for scale up conditions
    if (this.shouldScaleUp(metrics, sessionLoads)) {
      return this.createScaleUpDecision(metrics, sessionLoads);
    }

    // Check for scale down conditions
    if (this.shouldScaleDown(metrics, sessionLoads)) {
      return this.createScaleDownDecision(metrics, sessionLoads);
    }

    // Check for rebalancing needs
    if (this.shouldRebalance(sessionLoads)) {
      return this.createRebalanceDecision(sessionLoads);
    }

    // No action needed
    return {
      action: 'maintain',
      reason: 'System is optimally scaled',
      targetSessionCount: metrics.activeSessions,
      sessionsToCreate: 0,
      sessionsToDestroy: [],
      confidence: 0.8,
      expectedImpact: { performanceImprovement: 0, resourceSavings: 0, downtime: 0 },
    };
  }

  /**
   * Check if system should scale up
   */
  private shouldScaleUp(metrics: ScalingMetrics, sessionLoads: readonly SessionLoad[]): boolean {
    // Too many projects per session
    if (metrics.averageProjectsPerSession > this.loadBalancingConfig.maxProjectsPerSession) {
      return true;
    }

    // High system load
    if (metrics.systemLoad.cpu > this.scalingConfig.autoScaling.scaleUpThreshold) {
      return true;
    }

    // Poor session health
    const unhealthySessions = sessionLoads.filter(load => load.healthScore < this.loadBalancingConfig.healthThreshold);
    if (unhealthySessions.length > metrics.activeSessions * 0.5) {
      return true;
    }

    // No sessions can accept more projects
    const availableSessions = sessionLoads.filter(load => load.canAcceptMoreProjects);
    if (availableSessions.length === 0 && metrics.activeProjects > 0) {
      return true;
    }

    return false;
  }

  /**
   * Check if system should scale down
   */
  private shouldScaleDown(metrics: ScalingMetrics, sessionLoads: readonly SessionLoad[]): boolean {
    // Too few projects per session
    if (metrics.averageProjectsPerSession < this.loadBalancingConfig.minProjectsPerSession) {
      return true;
    }

    // Low system load
    if (metrics.systemLoad.cpu < this.scalingConfig.autoScaling.scaleDownThreshold) {
      return true;
    }

    // Too many idle sessions
    const idleSessions = sessionLoads.filter(load => 
      load.activeProjects === 0 && load.utilizationScore < 0.1
    );
    if (idleSessions.length > 1) { // Keep at least one session
      return true;
    }

    return false;
  }

  /**
   * Check if system needs rebalancing
   */
  private shouldRebalance(sessionLoads: readonly SessionLoad[]): boolean {
    if (sessionLoads.length < 2) return false;

    const utilizationVariance = this.calculateUtilizationVariance(sessionLoads);
    return utilizationVariance > this.loadBalancingConfig.rebalanceThreshold;
  }

  // ============================================================================
  // SCALING DECISION CREATION
  // ============================================================================

  /**
   * Create scale up decision
   */
  private createScaleUpDecision(
    metrics: ScalingMetrics,
    _sessionLoads: readonly SessionLoad[]
  ): ScalingDecision {
    const sessionsToCreate = Math.min(
      Math.ceil(metrics.totalProjects / 4) - metrics.activeSessions,
      this.scalingConfig.maxSessionsPerInstance - metrics.activeSessions
    );

    return {
      action: 'scale_up',
      reason: 'High load detected, scaling up sessions',
      targetSessionCount: metrics.activeSessions + sessionsToCreate,
      sessionsToCreate,
      sessionsToDestroy: [],
      confidence: 0.85,
      expectedImpact: {
        performanceImprovement: 0.2,
        resourceSavings: 0,
        downtime: sessionsToCreate * 5000, // 5 seconds per new session
      },
    };
  }

  /**
   * Create scale down decision
   */
  private createScaleDownDecision(
    metrics: ScalingMetrics,
    sessionLoads: readonly SessionLoad[]
  ): ScalingDecision {
    // Find sessions that can be safely removed
    const candidatesForRemoval = sessionLoads
      .filter(load => 
        load.activeProjects === 0 || 
        (load.utilizationScore < 0.1 && load.canAcceptMoreProjects)
      )
      .sort((a, b) => a.utilizationScore - b.utilizationScore)
      .slice(0, Math.floor(sessionLoads.length / 2)); // Remove up to half

    const sessionsToDestroy = candidatesForRemoval.slice(0, -1).map(load => load.sessionId); // Keep at least one

    return {
      action: 'scale_down',
      reason: 'Low utilization detected, scaling down sessions',
      targetSessionCount: metrics.activeSessions - sessionsToDestroy.length,
      sessionsToCreate: 0,
      sessionsToDestroy,
      confidence: 0.7,
      expectedImpact: {
        performanceImprovement: 0,
        resourceSavings: 0.15 * sessionsToDestroy.length,
        downtime: sessionsToDestroy.length * 2000, // 2 seconds per destroyed session
      },
    };
  }

  /**
   * Create rebalance decision
   */
  private createRebalanceDecision(sessionLoads: readonly SessionLoad[]): ScalingDecision {
    const projectsToMove = this.calculateOptimalProjectDistribution(sessionLoads);

    return {
      action: 'rebalance',
      reason: 'Uneven load distribution detected',
      targetSessionCount: sessionLoads.length,
      projectsToMove: projectsToMove || [],
      sessionsToCreate: 0,
      sessionsToDestroy: [],
      confidence: 0.6,
      expectedImpact: {
        performanceImprovement: 0.1,
        resourceSavings: 0.05,
        downtime: (projectsToMove?.length || 0) * 1000, // 1 second per moved project
      },
    };
  }

  // ============================================================================
  // SCALING EXECUTION
  // ============================================================================

  /**
   * Execute scaling decision
   */
  private async executeScalingDecision(decision: ScalingDecision): Promise<void> {
    try {
      this.emit('scaling-started', decision);

      switch (decision.action) {
        case 'scale_up':
          await this.executeScaleUp(decision);
          break;
        case 'scale_down':
          await this.executeScaleDown(decision);
          break;
        case 'rebalance':
          await this.executeRebalance(decision);
          break;
        case 'maintain':
          // No action needed
          break;
      }

      this.lastScalingAction = new Date();
      this.emit('scaling-completed', decision);

    } catch (error) {
      this.emit('scaling-failed', { decision, error });
      throw error;
    }
  }

  /**
   * Execute scale up operation
   */
  private async executeScaleUp(decision: ScalingDecision): Promise<void> {
    const existingSessions = this.sessionManager.getActiveSessions();
    const newSessionIds: SessionId[] = [];

    for (let i = 0; i < decision.sessionsToCreate; i++) {
      const startProjectNumber = (existingSessions.length + i) * 4 + 1;
      const sessionParams = this.createSessionParamsForScaling(startProjectNumber);
      
      const newSession = await this.sessionManager.createSession(sessionParams);
      newSessionIds.push(newSession.id);
    }

    this.emit('sessions-created', newSessionIds);
  }

  /**
   * Execute scale down operation
   */
  private async executeScaleDown(decision: ScalingDecision): Promise<void> {
    for (const sessionId of decision.sessionsToDestroy) {
      // Move any active projects to other sessions before destroying
      await this.migrateProjectsFromSession(sessionId);
      await this.sessionManager.destroySession(sessionId);
    }

    this.emit('sessions-destroyed', decision.sessionsToDestroy);
  }

  /**
   * Execute rebalance operation
   */
  private async executeRebalance(decision: ScalingDecision): Promise<void> {
    if (!decision.projectsToMove || decision.projectsToMove.length === 0) return;

    for (const projectMove of decision.projectsToMove) {
      await this.moveProject(
        projectMove.projectId,
        projectMove.fromSessionId,
        projectMove.toSessionId
      );
    }

    this.emit('projects-rebalanced', decision.projectsToMove);
  }

  // ============================================================================
  // PROJECT MIGRATION AND LOAD BALANCING
  // ============================================================================

  /**
   * Migrate all projects from a session to other sessions
   */
  private async migrateProjectsFromSession(sessionId: SessionId): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) return;

    const activeProjects = session.window.panels
      .map(panel => panel.projectActivity)
      .filter(activity => activity.status !== AgentActivityStatus.IDLE);

    for (const projectActivity of activeProjects) {
      const targetSessionId = await this.findBestSessionForProject(projectActivity.projectId);
      if (targetSessionId && targetSessionId !== sessionId) {
        await this.moveProject(projectActivity.projectId, sessionId, targetSessionId);
      }
    }
  }

  /**
   * Find the best session for a project based on load balancing strategy
   */
  private async findBestSessionForProject(_projectId: ProjectContextId): Promise<SessionId | null> {
    const sessionLoads = await this.calculateSessionLoads();
    const availableSessions = sessionLoads.filter(load => load.canAcceptMoreProjects);

    if (availableSessions.length === 0) return null;

    switch (this.loadBalancingConfig.strategy) {
      case 'least_loaded': {
        const leastLoaded = availableSessions.sort((a, b) => a.utilizationScore - b.utilizationScore)[0];
        return leastLoaded ? leastLoaded.sessionId : null;
      }
      case 'performance_based': {
        const bestPerformance = availableSessions.sort((a, b) => b.healthScore - a.healthScore)[0];
        return bestPerformance ? bestPerformance.sessionId : null;
      }
      case 'round_robin': {
        const randomSession = availableSessions[Math.floor(Math.random() * availableSessions.length)];
        return randomSession ? randomSession.sessionId : null;
      }
      case 'hybrid':
      default: {
        // Weighted score combining utilization and health
        const scoredSessions = availableSessions.map(load => ({
          sessionId: load.sessionId,
          score: (1 - load.utilizationScore) * 0.6 + load.healthScore * 0.4,
        }));
        const bestScored = scoredSessions.sort((a, b) => b.score - a.score)[0];
        return bestScored ? bestScored.sessionId : null;
      }
    }
  }

  /**
   * Move project from one session to another
   */
  private async moveProject(
    projectId: ProjectContextId,
    fromSessionId: SessionId,
    toSessionId: SessionId
  ): Promise<void> {
    // In a real implementation, this would involve:
    // 1. Pause project activity in source session
    // 2. Transfer project state and context
    // 3. Resume project activity in target session
    // 4. Update session panel assignments
    
    console.log(`Moving project ${projectId} from session ${fromSessionId} to ${toSessionId}`);
    this.emit('project-moved', { projectId, fromSessionId, toSessionId });
  }

  // ============================================================================
  // METRICS AND MONITORING
  // ============================================================================

  /**
   * Collect current scaling metrics
   */
  private async collectScalingMetrics(): Promise<ScalingMetrics> {
    const activeSessions = this.sessionManager.getActiveSessions();
    const allActivities = this.getAllProjectActivities(activeSessions);

    const totalProjects = allActivities.length;
    const activeProjects = allActivities.filter(a => a.status === AgentActivityStatus.WORKING).length;
    const idleProjects = allActivities.filter(a => a.status === AgentActivityStatus.IDLE).length;
    const errorProjects = allActivities.filter(a => a.status === AgentActivityStatus.ERROR).length;
    const completedProjects = allActivities.filter(a => a.status === AgentActivityStatus.COMPLETED).length;

    return {
      timestamp: new Date(),
      totalProjects,
      activeProjects,
      idleProjects,
      errorProjects,
      completedProjects,
      totalSessions: activeSessions.length,
      activeSessions: activeSessions.length,
      averageProjectsPerSession: totalProjects / Math.max(activeSessions.length, 1),
      systemLoad: await this.getSystemLoad(),
    };
  }

  /**
   * Calculate load for each session
   */
  private async calculateSessionLoads(): Promise<readonly SessionLoad[]> {
    const activeSessions = this.sessionManager.getActiveSessions();
    const sessionLoads: SessionLoad[] = [];

    for (const session of activeSessions) {
      const projectActivities = session.window.panels.map(panel => panel.projectActivity);
      const activeProjects = projectActivities.filter(a => a.status === AgentActivityStatus.WORKING).length;
      const totalCpuUsage = projectActivities.reduce((sum, a) => sum + a.resourceUsage.cpu, 0);
      const totalMemoryUsage = projectActivities.reduce((sum, a) => sum + a.resourceUsage.memory, 0);

      const sessionMetrics = await this.sessionManager.getSessionMetrics(session.id);
      const averageResponseTime = sessionMetrics?.averageResponseTime || 0;
      const errorRate = sessionMetrics?.errorRate || 0;

      const utilizationScore = Math.min(
        (activeProjects / 4) * 0.5 + (totalCpuUsage / 100) * 0.3 + (totalMemoryUsage / 1000) * 0.2,
        1.0
      );

      const healthScore = Math.max(0, 1 - errorRate - (averageResponseTime / 10000));

      sessionLoads.push({
        sessionId: session.id,
        projectCount: projectActivities.length,
        activeProjects,
        totalCpuUsage,
        totalMemoryUsage,
        averageResponseTime,
        errorRate,
        utilizationScore,
        canAcceptMoreProjects: activeProjects < this.loadBalancingConfig.maxProjectsPerSession,
        healthScore,
      });
    }

    return sessionLoads;
  }

  /**
   * Get all project activities from sessions
   */
  private getAllProjectActivities(sessions: readonly TMUXSession[]): readonly ProjectActivity[] {
    return sessions.flatMap(session => 
      session.window.panels.map(panel => panel.projectActivity)
    );
  }

  /**
   * Get system load information
   */
  private async getSystemLoad(): Promise<ScalingMetrics['systemLoad']> {
    const health = await this.sessionManager.getHealth();
    
    return {
      cpu: health.cpuUsage,
      memory: health.memoryUsage,
      activePanels: health.totalPanels,
    };
  }

  /**
   * Calculate utilization variance across sessions
   */
  private calculateUtilizationVariance(sessionLoads: readonly SessionLoad[]): number {
    if (sessionLoads.length < 2) return 0;

    const mean = sessionLoads.reduce((sum, load) => sum + load.utilizationScore, 0) / sessionLoads.length;
    const squaredDiffs = sessionLoads.map(load => Math.pow(load.utilizationScore - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / sessionLoads.length;
  }

  /**
   * Calculate optimal project distribution for rebalancing
   */
  private calculateOptimalProjectDistribution(
    sessionLoads: readonly SessionLoad[]
  ): ScalingDecision['projectsToMove'] {
    // Simplified rebalancing - move projects from overloaded to underloaded sessions
    const overloaded = sessionLoads.filter(load => 
      load.utilizationScore > 0.8 || load.activeProjects > this.loadBalancingConfig.maxProjectsPerSession * 0.8
    );
    const underloaded = sessionLoads.filter(load => 
      load.utilizationScore < 0.4 && load.canAcceptMoreProjects
    );

    if (overloaded.length === 0 || underloaded.length === 0) return [];

    // Simple strategy: move one project from most overloaded to least loaded
    const mostOverloaded = overloaded.sort((a, b) => b.utilizationScore - a.utilizationScore)[0];
    const leastLoaded = underloaded.sort((a, b) => a.utilizationScore - b.utilizationScore)[0];

    if (!mostOverloaded || !leastLoaded) return [];

    // In a real implementation, would identify specific projects to move
    return [{
      projectId: 'example-project' as ProjectContextId, // Placeholder
      fromSessionId: mostOverloaded.sessionId,
      toSessionId: leastLoaded.sessionId,
    }];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if we're in cooldown period
   */
  private isInCooldownPeriod(): boolean {
    return Date.now() - this.lastScalingAction.getTime() < this.cooldownPeriod;
  }

  /**
   * Create session parameters for scaling
   */
  private createSessionParamsForScaling(startProjectNumber: number): SessionCreationParams {
    // Generate placeholder project and agent IDs for new session
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
      sessionName: `scaled-session-projects-${startProjectNumber}-${startProjectNumber + 3}`,
      projectIds,
      agentIds,
      layoutConfig: {
        layout: 'tiled',
        panelSpacing: 1,
        borderStyle: 'single',
        statusLineEnabled: true,
        mouseEnabled: true,
        prefixKey: 'C-b',
      },
      persistenceEnabled: true,
    };
  }

  /**
   * Merge default load balancing configuration
   */
  private mergeLoadBalancingConfig(config?: Partial<LoadBalancingConfig>): LoadBalancingConfig {
    const defaultConfig: LoadBalancingConfig = {
      strategy: 'hybrid',
      rebalanceThreshold: 0.3,
      maxProjectsPerSession: 4,
      minProjectsPerSession: 1,
      healthThreshold: 0.7,
      performanceThreshold: 0.8,
    };

    return { ...defaultConfig, ...config };
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Get current scaling metrics
   */
  async getCurrentMetrics(): Promise<ScalingMetrics> {
    return this.collectScalingMetrics();
  }

  /**
   * Get historical scaling metrics
   */
  getHistoricalMetrics(limit = 50): readonly ScalingMetrics[] {
    return Array.from(this.scalingMetrics.values()).slice(-limit);
  }

  /**
   * Get current session loads
   */
  async getCurrentSessionLoads(): Promise<readonly SessionLoad[]> {
    return this.calculateSessionLoads();
  }

  /**
   * Force scaling check
   */
  async forceScalingCheck(): Promise<ScalingDecision> {
    return this.performScalingCheck();
  }

  /**
   * Update scaling configuration
   */
  updateScalingConfig(newConfig: Partial<SessionScalingConfig>): void {
    Object.assign(this.scalingConfig, newConfig);
    
    // Restart auto scaling if configuration changed
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
      if (this.scalingConfig.autoScaling.enabled) {
        this.startAutoScaling();
      }
    }
  }

  /**
   * Update load balancing configuration
   */
  updateLoadBalancingConfig(newConfig: Partial<LoadBalancingConfig>): void {
    Object.assign(this.loadBalancingConfig, newConfig);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
    }
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    this.scalingMetrics.clear();
  }
}