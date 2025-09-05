/**
 * Agent Monitor - Real-time agent behavior tracking and analysis
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import type {
  AgentInstanceId,
  TaskId,
} from '@sentra/types';

import type { SessionId } from './event-hooks';
import type { ObservabilityManager } from './observability-manager';

// ============================================================================
// AGENT MONITOR INTERFACES
// ============================================================================

/**
 * Real-time agent metrics
 */
export interface AgentMetrics {
  readonly agentId: AgentInstanceId;
  readonly sessionId?: SessionId;
  readonly status: 'active' | 'idle' | 'error' | 'offline';
  readonly currentTask?: TaskId;
  readonly toolsInUse: readonly string[];
  readonly performance: {
    readonly responseTime: number;     // ms
    readonly throughput: number;       // tasks/minute
    readonly successRate: number;      // 0-1
    readonly errorRate: number;        // errors/minute
  };
  readonly resources: {
    readonly cpuUsage: number;         // 0-1
    readonly memoryUsage: number;      // bytes
    readonly networkUsage: number;     // bytes/second
  };
  readonly activity: {
    readonly lastSeen: Date;
    readonly totalDecisions: number;
    readonly totalToolUses: number;
    readonly memoryOperations: number;
  };
}

/**
 * Agent behavior pattern
 */
export interface AgentBehaviorPattern {
  readonly patternId: string;
  readonly agentId: AgentInstanceId;
  readonly type: 'efficiency' | 'error_prone' | 'learning' | 'collaboration';
  readonly confidence: number;        // 0-1
  readonly description: string;
  readonly detectedAt: Date;
  readonly evidence: readonly string[];
  readonly recommendations: readonly string[];
  readonly impact: 'low' | 'medium' | 'high';
}

/**
 * Agent health assessment
 */
export interface AgentHealthAssessment {
  readonly agentId: AgentInstanceId;
  readonly overallHealth: number;     // 0-1
  readonly assessmentTime: Date;
  readonly components: {
    readonly performance: number;      // 0-1
    readonly reliability: number;      // 0-1
    readonly efficiency: number;       // 0-1
    readonly learning: number;         // 0-1
    readonly collaboration: number;    // 0-1
  };
  readonly alerts: readonly {
    readonly level: 'info' | 'warning' | 'critical';
    readonly message: string;
    readonly metric?: string;
    readonly value?: number;
    readonly threshold?: number;
  }[];
  readonly recommendations: readonly string[];
}

// ============================================================================
// AGENT MONITOR
// ============================================================================

/**
 * Monitor for tracking and analyzing agent behavior in real-time
 */
export class AgentMonitor {
  private readonly observabilityManager: ObservabilityManager;
  private readonly logger: any; // TODO: Type when logger is configured

  // Agent metrics tracking
  private readonly agentMetrics = new Map<AgentInstanceId, AgentMetrics>();
  private readonly behaviorPatterns = new Map<AgentInstanceId, AgentBehaviorPattern[]>();
  private readonly healthAssessments = new Map<AgentInstanceId, AgentHealthAssessment>();

  // Monitoring intervals
  private metricsUpdateTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private patternAnalysisTimer?: NodeJS.Timeout;

  // Configuration
  private readonly config = {
    metricsUpdateInterval: 5000,      // 5 seconds
    healthCheckInterval: 30000,       // 30 seconds
    patternAnalysisInterval: 60000,   // 1 minute
    patternDetectionThreshold: 0.7,   // confidence threshold
  };

  constructor(observabilityManager: ObservabilityManager, logger?: any) {
    this.observabilityManager = observabilityManager;
    this.logger = logger;

    this.startMonitoring();
  }

  // ============================================================================
  // MONITORING LIFECYCLE
  // ============================================================================

  /**
   * Start monitoring all active agents
   */
  private startMonitoring(): void {
    this.metricsUpdateTimer = setInterval(() => {
      this.updateAgentMetrics();
    }, this.config.metricsUpdateInterval);

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    this.patternAnalysisTimer = setInterval(() => {
      this.analyzeBehaviorPatterns();
    }, this.config.patternAnalysisInterval);

    this.logger?.info('Agent monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.metricsUpdateTimer) {
      clearInterval(this.metricsUpdateTimer);
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.patternAnalysisTimer) {
      clearInterval(this.patternAnalysisTimer);
    }

    this.logger?.info('Agent monitoring stopped');
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  /**
   * Update metrics for all active agents
   */
  private updateAgentMetrics(): void {
    const stats = this.observabilityManager.getStats();
    
    // Update metrics for each active agent
    Object.entries(stats.sessionsByAgent).forEach(([agentId, sessionCount]) => {
      this.updateAgentMetric(agentId as AgentInstanceId);
    });
  }

  /**
   * Update metrics for a specific agent
   */
  private updateAgentMetric(agentId: AgentInstanceId): void {
    const currentMetrics = this.agentMetrics.get(agentId);
    const sessionId = this.observabilityManager.getActiveSession(agentId);

    // Calculate new metrics
    const newMetrics: AgentMetrics = {
      agentId,
      sessionId,
      status: this.determineAgentStatus(agentId),
      currentTask: this.getCurrentTask(agentId),
      toolsInUse: this.getActiveTools(agentId),
      performance: {
        responseTime: this.calculateResponseTime(agentId),
        throughput: this.calculateThroughput(agentId),
        successRate: this.calculateSuccessRate(agentId),
        errorRate: this.calculateErrorRate(agentId),
      },
      resources: {
        cpuUsage: this.calculateCpuUsage(agentId),
        memoryUsage: this.calculateMemoryUsage(agentId),
        networkUsage: this.calculateNetworkUsage(agentId),
      },
      activity: {
        lastSeen: new Date(),
        totalDecisions: this.getTotalDecisions(agentId),
        totalToolUses: this.getTotalToolUses(agentId),
        memoryOperations: this.getTotalMemoryOperations(agentId),
      },
    };

    this.agentMetrics.set(agentId, newMetrics);

    // Emit metrics update if significant change
    if (this.isSignificantChange(currentMetrics, newMetrics)) {
      this.emitMetricsUpdate(newMetrics);
    }
  }

  // ============================================================================
  // HEALTH ASSESSMENT
  // ============================================================================

  /**
   * Perform health checks on all monitored agents
   */
  private performHealthChecks(): void {
    for (const agentId of this.agentMetrics.keys()) {
      this.performHealthCheck(agentId);
    }
  }

  /**
   * Perform health check for a specific agent
   */
  private performHealthCheck(agentId: AgentInstanceId): void {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics) return;

    const assessment: AgentHealthAssessment = {
      agentId,
      overallHealth: 0,
      assessmentTime: new Date(),
      components: {
        performance: this.assessPerformanceHealth(metrics),
        reliability: this.assessReliabilityHealth(metrics),
        efficiency: this.assessEfficiencyHealth(metrics),
        learning: this.assessLearningHealth(agentId),
        collaboration: this.assessCollaborationHealth(agentId),
      },
      alerts: [],
      recommendations: [],
    };

    // Calculate overall health
    const componentScores = Object.values(assessment.components);
    assessment.overallHealth = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;

    // Generate alerts based on thresholds
    this.generateHealthAlerts(assessment, metrics);

    // Generate recommendations
    assessment.recommendations = this.generateHealthRecommendations(assessment, metrics);

    this.healthAssessments.set(agentId, assessment);

    // Log critical health issues
    const criticalAlerts = assessment.alerts.filter(alert => alert.level === 'critical');
    if (criticalAlerts.length > 0) {
      this.logger?.warn('Critical health issues detected', {
        agentId,
        overallHealth: assessment.overallHealth,
        criticalAlerts,
      });
    }
  }

  // ============================================================================
  // BEHAVIOR PATTERN ANALYSIS
  // ============================================================================

  /**
   * Analyze behavior patterns for all monitored agents
   */
  private analyzeBehaviorPatterns(): void {
    for (const agentId of this.agentMetrics.keys()) {
      this.analyzeBehaviorPattern(agentId);
    }
  }

  /**
   * Analyze behavior patterns for a specific agent
   */
  private analyzeBehaviorPattern(agentId: AgentInstanceId): void {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics) return;

    const recentEvents = this.observabilityManager.getRecentEvents(100);
    const agentEvents = recentEvents.filter(event => 
      (event as any).data?.agentId === agentId
    );

    if (agentEvents.length < 10) return; // Need sufficient data

    const patterns: AgentBehaviorPattern[] = [];

    // Detect efficiency patterns
    const efficiencyPattern = this.detectEfficiencyPattern(agentId, agentEvents, metrics);
    if (efficiencyPattern) patterns.push(efficiencyPattern);

    // Detect error patterns
    const errorPattern = this.detectErrorPattern(agentId, agentEvents, metrics);
    if (errorPattern) patterns.push(errorPattern);

    // Detect learning patterns
    const learningPattern = this.detectLearningPattern(agentId, agentEvents);
    if (learningPattern) patterns.push(learningPattern);

    // Detect collaboration patterns
    const collaborationPattern = this.detectCollaborationPattern(agentId, agentEvents);
    if (collaborationPattern) patterns.push(collaborationPattern);

    // Store patterns
    this.behaviorPatterns.set(agentId, patterns);

    // Log significant patterns
    const significantPatterns = patterns.filter(p => p.confidence >= this.config.patternDetectionThreshold);
    if (significantPatterns.length > 0) {
      this.logger?.info('Behavior patterns detected', {
        agentId,
        patterns: significantPatterns.map(p => ({ type: p.type, confidence: p.confidence })),
      });

      // Emit pattern events
      significantPatterns.forEach(pattern => {
        this.emitBehaviorPattern(pattern);
      });
    }
  }

  // ============================================================================
  // PATTERN DETECTION ALGORITHMS
  // ============================================================================

  /**
   * Detect efficiency patterns
   */
  private detectEfficiencyPattern(
    agentId: AgentInstanceId,
    events: any[],
    metrics: AgentMetrics
  ): AgentBehaviorPattern | null {
    const toolEvents = events.filter(e => e.type === 'tool_usage_completed');
    if (toolEvents.length < 5) return null;

    const avgDuration = toolEvents.reduce((sum, e) => sum + e.data.duration, 0) / toolEvents.length;
    const successRate = metrics.performance.successRate;

    if (avgDuration < 1000 && successRate > 0.9) { // Fast and accurate
      return {
        patternId: `efficiency_${agentId}_${Date.now()}`,
        agentId,
        type: 'efficiency',
        confidence: Math.min(0.95, successRate + (1000 - avgDuration) / 2000),
        description: 'Agent consistently completes tasks quickly with high success rate',
        detectedAt: new Date(),
        evidence: [
          `Average tool execution time: ${avgDuration.toFixed(0)}ms`,
          `Success rate: ${(successRate * 100).toFixed(1)}%`,
        ],
        recommendations: [
          'Consider increasing task complexity to better utilize capabilities',
          'Use as mentor for other agents',
        ],
        impact: 'high',
      };
    }

    return null;
  }

  /**
   * Detect error patterns
   */
  private detectErrorPattern(
    agentId: AgentInstanceId,
    events: any[],
    metrics: AgentMetrics
  ): AgentBehaviorPattern | null {
    const errorRate = metrics.performance.errorRate;
    
    if (errorRate > 5) { // More than 5 errors per minute
      const errorEvents = events.filter(e => e.type === 'error_occurred');
      const commonErrors = this.findCommonErrors(errorEvents);

      return {
        patternId: `error_prone_${agentId}_${Date.now()}`,
        agentId,
        type: 'error_prone',
        confidence: Math.min(0.95, errorRate / 10),
        description: 'Agent experiencing elevated error rates',
        detectedAt: new Date(),
        evidence: [
          `Error rate: ${errorRate.toFixed(1)} errors/minute`,
          `Most common errors: ${commonErrors.slice(0, 3).join(', ')}`,
        ],
        recommendations: [
          'Review recent changes to agent configuration',
          'Consider retraining or DNA evolution',
          'Implement additional error handling',
        ],
        impact: 'high',
      };
    }

    return null;
  }

  /**
   * Detect learning patterns
   */
  private detectLearningPattern(agentId: AgentInstanceId, events: any[]): AgentBehaviorPattern | null {
    const learningEvents = events.filter(e => 
      e.type === 'learning_breakthrough' || e.type === 'learning_outcome_recorded'
    );

    if (learningEvents.length >= 3) { // Active learning
      const improvementScore = learningEvents
        .filter(e => e.data.improvementScore !== undefined)
        .reduce((sum, e) => sum + e.data.improvementScore, 0) / learningEvents.length;

      if (improvementScore > 0.1) { // Positive learning trend
        return {
          patternId: `learning_${agentId}_${Date.now()}`,
          agentId,
          type: 'learning',
          confidence: Math.min(0.9, improvementScore * 5),
          description: 'Agent showing strong learning and adaptation behavior',
          detectedAt: new Date(),
          evidence: [
            `Learning events: ${learningEvents.length}`,
            `Average improvement score: ${(improvementScore * 100).toFixed(1)}%`,
          ],
          recommendations: [
            'Provide more challenging tasks to accelerate learning',
            'Consider knowledge sharing with other agents',
          ],
          impact: 'medium',
        };
      }
    }

    return null;
  }

  /**
   * Detect collaboration patterns
   */
  private detectCollaborationPattern(agentId: AgentInstanceId, events: any[]): AgentBehaviorPattern | null {
    const coordEvents = events.filter(e => 
      e.type === 'agent_coordination' && 
      (e.data.initiatorId === agentId || e.data.targetId === agentId)
    );

    if (coordEvents.length >= 2) { // Active in collaboration
      const initiatedCount = coordEvents.filter(e => e.data.initiatorId === agentId).length;
      const isInitiator = initiatedCount > coordEvents.length / 2;

      return {
        patternId: `collaboration_${agentId}_${Date.now()}`,
        agentId,
        type: 'collaboration',
        confidence: Math.min(0.85, coordEvents.length / 10),
        description: isInitiator ? 
          'Agent frequently initiates collaboration with other agents' :
          'Agent actively participates in collaborative tasks',
        detectedAt: new Date(),
        evidence: [
          `Coordination events: ${coordEvents.length}`,
          `Initiated: ${initiatedCount}, Participated: ${coordEvents.length - initiatedCount}`,
        ],
        recommendations: [
          'Leverage for team leadership roles',
          'Use as collaboration facilitator',
        ],
        impact: 'medium',
      };
    }

    return null;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Determine current agent status
   */
  private determineAgentStatus(agentId: AgentInstanceId): 'active' | 'idle' | 'error' | 'offline' {
    const sessionId = this.observabilityManager.getActiveSession(agentId);
    if (!sessionId) return 'offline';

    const recentEvents = this.observabilityManager.getRecentEvents(50);
    const agentEvents = recentEvents.filter(event => 
      (event as any).data?.agentId === agentId
    );

    if (agentEvents.length === 0) return 'idle';

    const latestEvent = agentEvents[agentEvents.length - 1];
    const timeSinceLastEvent = Date.now() - latestEvent.timestamp.getTime();

    if (timeSinceLastEvent > 300000) return 'idle'; // 5 minutes
    if (latestEvent.type === 'error_occurred') return 'error';

    return 'active';
  }

  // Mock calculation methods (would be implemented with real metrics)
  private getCurrentTask(agentId: AgentInstanceId): TaskId | undefined {
    return undefined; // Would be tracked from task assignment events
  }

  private getActiveTools(agentId: AgentInstanceId): readonly string[] {
    const recentEvents = this.observabilityManager.getRecentEvents(20);
    const toolStartEvents = recentEvents
      .filter(e => e.type === 'tool_usage_started' && (e as any).data.agentId === agentId)
      .slice(-5);
    
    return toolStartEvents.map(e => (e as any).data.toolName);
  }

  private calculateResponseTime(agentId: AgentInstanceId): number {
    return 150; // Mock response time
  }

  private calculateThroughput(agentId: AgentInstanceId): number {
    return 5.2; // Mock throughput
  }

  private calculateSuccessRate(agentId: AgentInstanceId): number {
    const recentEvents = this.observabilityManager.getRecentEvents(50);
    const taskEvents = recentEvents.filter(e => 
      (e.type === 'task_completed' || e.type === 'task_failed') &&
      (e as any).data.agentId === agentId
    );

    if (taskEvents.length === 0) return 1.0;

    const successful = taskEvents.filter(e => e.type === 'task_completed').length;
    return successful / taskEvents.length;
  }

  private calculateErrorRate(agentId: AgentInstanceId): number {
    return 0.5; // Mock error rate
  }

  private calculateCpuUsage(agentId: AgentInstanceId): number {
    return Math.random() * 0.3 + 0.1; // Mock CPU usage
  }

  private calculateMemoryUsage(agentId: AgentInstanceId): number {
    return Math.random() * 100000000 + 50000000; // Mock memory usage
  }

  private calculateNetworkUsage(agentId: AgentInstanceId): number {
    return Math.random() * 1000 + 100; // Mock network usage
  }

  private getTotalDecisions(agentId: AgentInstanceId): number {
    return 42; // Mock total decisions
  }

  private getTotalToolUses(agentId: AgentInstanceId): number {
    return 127; // Mock total tool uses
  }

  private getTotalMemoryOperations(agentId: AgentInstanceId): number {
    return 89; // Mock memory operations
  }

  private isSignificantChange(current: AgentMetrics | undefined, updated: AgentMetrics): boolean {
    if (!current) return true;
    
    // Check for significant changes in key metrics
    const performanceChange = Math.abs(current.performance.responseTime - updated.performance.responseTime) > 50;
    const statusChange = current.status !== updated.status;
    const toolsChange = current.toolsInUse.length !== updated.toolsInUse.length;

    return performanceChange || statusChange || toolsChange;
  }

  private assessPerformanceHealth(metrics: AgentMetrics): number {
    const responseScore = Math.max(0, 1 - (metrics.performance.responseTime / 5000));
    const successScore = metrics.performance.successRate;
    const throughputScore = Math.min(1, metrics.performance.throughput / 10);
    
    return (responseScore + successScore + throughputScore) / 3;
  }

  private assessReliabilityHealth(metrics: AgentMetrics): number {
    return Math.max(0, 1 - (metrics.performance.errorRate / 10));
  }

  private assessEfficiencyHealth(metrics: AgentMetrics): number {
    const cpuScore = 1 - metrics.resources.cpuUsage;
    const performanceScore = metrics.performance.successRate;
    
    return (cpuScore + performanceScore) / 2;
  }

  private assessLearningHealth(agentId: AgentInstanceId): number {
    // Mock learning health assessment
    return 0.8;
  }

  private assessCollaborationHealth(agentId: AgentInstanceId): number {
    // Mock collaboration health assessment
    return 0.75;
  }

  private generateHealthAlerts(assessment: AgentHealthAssessment, metrics: AgentMetrics): void {
    if (assessment.overallHealth < 0.5) {
      (assessment.alerts as any).push({
        level: 'critical',
        message: 'Agent health is critically low',
        metric: 'overallHealth',
        value: assessment.overallHealth,
        threshold: 0.5,
      });
    }

    if (metrics.performance.errorRate > 5) {
      (assessment.alerts as any).push({
        level: 'warning',
        message: 'High error rate detected',
        metric: 'errorRate',
        value: metrics.performance.errorRate,
        threshold: 5,
      });
    }

    if (metrics.performance.responseTime > 3000) {
      (assessment.alerts as any).push({
        level: 'warning',
        message: 'Response time is elevated',
        metric: 'responseTime',
        value: metrics.performance.responseTime,
        threshold: 3000,
      });
    }
  }

  private generateHealthRecommendations(assessment: AgentHealthAssessment, metrics: AgentMetrics): readonly string[] {
    const recommendations: string[] = [];

    if (assessment.components.performance < 0.7) {
      recommendations.push('Consider optimizing agent algorithms for better performance');
    }

    if (assessment.components.reliability < 0.7) {
      recommendations.push('Review error handling and implement additional safeguards');
    }

    if (metrics.resources.cpuUsage > 0.8) {
      recommendations.push('Investigate high CPU usage and optimize resource utilization');
    }

    return recommendations;
  }

  private findCommonErrors(errorEvents: any[]): string[] {
    const errorCounts = new Map<string, number>();
    
    errorEvents.forEach(event => {
      const errorType = event.data?.errorType || 'unknown';
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([error]) => error);
  }

  private emitMetricsUpdate(metrics: AgentMetrics): void {
    // Would emit to WebSocket or event system for real-time updates
    this.logger?.debug('Agent metrics updated', {
      agentId: metrics.agentId,
      status: metrics.status,
      responseTime: metrics.performance.responseTime,
    });
  }

  private emitBehaviorPattern(pattern: AgentBehaviorPattern): void {
    // Would emit behavior pattern for further processing or alerting
    this.logger?.info('Behavior pattern detected', {
      agentId: pattern.agentId,
      type: pattern.type,
      confidence: pattern.confidence,
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current metrics for an agent
   */
  getAgentMetrics(agentId: AgentInstanceId): AgentMetrics | undefined {
    return this.agentMetrics.get(agentId);
  }

  /**
   * Get all monitored agents metrics
   */
  getAllAgentMetrics(): Map<AgentInstanceId, AgentMetrics> {
    return new Map(this.agentMetrics);
  }

  /**
   * Get behavior patterns for an agent
   */
  getAgentBehaviorPatterns(agentId: AgentInstanceId): AgentBehaviorPattern[] {
    return this.behaviorPatterns.get(agentId) || [];
  }

  /**
   * Get health assessment for an agent
   */
  getAgentHealthAssessment(agentId: AgentInstanceId): AgentHealthAssessment | undefined {
    return this.healthAssessments.get(agentId);
  }

  /**
   * Force metrics update for an agent
   */
  forceMetricsUpdate(agentId: AgentInstanceId): void {
    this.updateAgentMetric(agentId);
  }

  /**
   * Force health check for an agent
   */
  forceHealthCheck(agentId: AgentInstanceId): void {
    this.performHealthCheck(agentId);
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    return {
      monitoredAgents: this.agentMetrics.size,
      totalBehaviorPatterns: Array.from(this.behaviorPatterns.values())
        .reduce((sum, patterns) => sum + patterns.length, 0),
      healthyAgents: Array.from(this.healthAssessments.values())
        .filter(assessment => assessment.overallHealth > 0.7).length,
      criticalAgents: Array.from(this.healthAssessments.values())
        .filter(assessment => assessment.overallHealth < 0.5).length,
    };
  }

  /**
   * Cleanup monitoring data for an agent
   */
  cleanupAgent(agentId: AgentInstanceId): void {
    this.agentMetrics.delete(agentId);
    this.behaviorPatterns.delete(agentId);
    this.healthAssessments.delete(agentId);
  }

  /**
   * Shutdown the monitor
   */
  shutdown(): void {
    this.stopMonitoring();
    this.agentMetrics.clear();
    this.behaviorPatterns.clear();
    this.healthAssessments.clear();

    this.logger?.info('Agent monitor shutdown complete');
  }
}