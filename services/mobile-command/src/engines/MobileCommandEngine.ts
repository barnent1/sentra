/**
 * Mobile Command Engine
 * Core logic for work-from-anywhere project management
 */

import { logger } from '../utils/logger';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';

export interface ProjectStatus {
  id: string;
  name: string;
  progress: number;
  activeAgents: AgentStatus[];
  recentActivity: ActivityItem[];
  blockersCount: number;
  estimatedCompletion: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentStatus {
  id: string;
  name: string;
  type: 'dev' | 'qa' | 'pm' | 'analyst' | 'ux' | 'devops' | 'security' | 'git';
  status: 'active' | 'idle' | 'blocked' | 'error';
  currentTask?: string;
  lastActivity: string;
  performance: {
    tasksCompleted: number;
    averageTime: number;
    successRate: number;
  };
}

export interface ActivityItem {
  id: string;
  type: 'task_completed' | 'task_started' | 'blocker' | 'communication' | 'deployment';
  message: string;
  timestamp: string;
  agentId?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RemoteScenario {
  type: 'walk_dog' | 'grocery_shopping' | 'meeting' | 'travel_day' | 'vacation';
  duration: number; // minutes
  autonomyLevel: 'full' | 'limited' | 'pause' | 'emergency_only';
  notificationMode: 'all' | 'critical' | 'silent';
  agentInstructions: string;
}

export class MobileCommandEngine {
  private db: DatabaseService;
  private redis: RedisService;

  constructor() {
    this.db = new DatabaseService();
    this.redis = new RedisService();
  }

  /**
   * Get all projects for a user with real-time status
   */
  async getUserProjects(userId: string): Promise<ProjectStatus[]> {
    try {
      logger.info(`Getting projects for user: ${userId}`);

      // Get projects from database
      const projects = await this.db.query(`
        SELECT 
          p.*,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.owner_id = $1 OR p.id IN (
          SELECT project_id FROM project_members WHERE user_id = $1
        )
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `, [userId]);

      const projectStatuses: ProjectStatus[] = [];

      for (const project of projects.rows) {
        const status = await this.getProjectStatus(userId, project.id);
        projectStatuses.push(status);
      }

      return projectStatuses;

    } catch (error) {
      logger.error('Error getting user projects:', error);
      throw error;
    }
  }

  /**
   * Get detailed project status including agent activity
   */
  async getProjectStatus(userId: string, projectId: string): Promise<ProjectStatus> {
    try {
      logger.info(`Getting project status: ${projectId}`);

      // Get project basic info
      const projectResult = await this.db.query(`
        SELECT * FROM projects WHERE id = $1
      `, [projectId]);

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectResult.rows[0];

      // Get task completion stats
      const taskStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks
        FROM tasks 
        WHERE project_id = $1
      `, [projectId]);

      const stats = taskStats.rows[0];
      const progress = stats.total_tasks > 0 
        ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
        : 0;

      // Get active agents
      const activeAgents = await this.getProjectAgents(projectId);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(projectId);

      // Get estimated completion from timeline intelligence
      const estimatedCompletion = await this.getEstimatedCompletion(projectId);

      return {
        id: project.id,
        name: project.name,
        progress,
        activeAgents,
        recentActivity,
        blockersCount: parseInt(stats.blocked_tasks) || 0,
        estimatedCompletion,
        priority: project.priority || 'medium'
      };

    } catch (error) {
      logger.error('Error getting project status:', error);
      throw error;
    }
  }

  /**
   * Get active agents for a project
   */
  private async getProjectAgents(projectId: string): Promise<AgentStatus[]> {
    try {
      const agentsResult = await this.db.query(`
        SELECT 
          a.*,
          COUNT(at.id) as tasks_completed,
          AVG(EXTRACT(EPOCH FROM (at.completed_at - at.started_at))/60) as avg_minutes,
          COUNT(CASE WHEN at.status = 'completed' THEN 1 END)::float / 
          NULLIF(COUNT(at.id), 0) as success_rate
        FROM agents a
        LEFT JOIN agent_tasks at ON a.id = at.agent_id 
          AND at.project_id = $1 
          AND at.created_at >= NOW() - INTERVAL '7 days'
        WHERE a.project_id = $1 OR a.project_id IS NULL
        GROUP BY a.id
        ORDER BY a.last_activity DESC
      `, [projectId]);

      return agentsResult.rows.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status || 'idle',
        currentTask: agent.current_task,
        lastActivity: agent.last_activity,
        performance: {
          tasksCompleted: parseInt(agent.tasks_completed) || 0,
          averageTime: parseFloat(agent.avg_minutes) || 0,
          successRate: parseFloat(agent.success_rate) || 0
        }
      }));

    } catch (error) {
      logger.error('Error getting project agents:', error);
      return [];
    }
  }

  /**
   * Get recent project activity
   */
  private async getRecentActivity(projectId: string, limit: number = 10): Promise<ActivityItem[]> {
    try {
      const activityResult = await this.db.query(`
        SELECT 
          tl.*,
          a.name as agent_name
        FROM timeline_events tl
        LEFT JOIN agents a ON tl.agent_id = a.id
        WHERE tl.project_id = $1
        ORDER BY tl.created_at DESC
        LIMIT $2
      `, [projectId, limit]);

      return activityResult.rows.map(event => ({
        id: event.id,
        type: event.event_type,
        message: event.description || `${event.agent_name || 'System'}: ${event.event_type}`,
        timestamp: event.created_at,
        agentId: event.agent_id,
        priority: event.priority || 'medium'
      }));

    } catch (error) {
      logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get estimated project completion
   */
  private async getEstimatedCompletion(projectId: string): Promise<string> {
    try {
      // Check if timeline intelligence service is available
      const cachedEstimate = await this.redis.get(`project:${projectId}:completion_estimate`);
      
      if (cachedEstimate) {
        return cachedEstimate;
      }

      // Fallback calculation based on current progress and velocity
      const velocityResult = await this.db.query(`
        SELECT 
          COUNT(*) as completed_last_week
        FROM tasks 
        WHERE project_id = $1 
          AND status = 'completed' 
          AND completed_at >= NOW() - INTERVAL '7 days'
      `, [projectId]);

      const weeklyVelocity = parseInt(velocityResult.rows[0].completed_last_week) || 1;
      
      const remainingResult = await this.db.query(`
        SELECT COUNT(*) as remaining_tasks
        FROM tasks 
        WHERE project_id = $1 AND status != 'completed'
      `, [projectId]);

      const remainingTasks = parseInt(remainingResult.rows[0].remaining_tasks) || 0;
      
      const estimatedWeeks = Math.ceil(remainingTasks / weeklyVelocity);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + (estimatedWeeks * 7));

      const estimate = completionDate.toLocaleDateString();
      
      // Cache for 1 hour
      await this.redis.setex(`project:${projectId}:completion_estimate`, 3600, estimate);
      
      return estimate;

    } catch (error) {
      logger.error('Error getting estimated completion:', error);
      return 'Calculating...';
    }
  }

  /**
   * Configure remote work scenario
   */
  async configureRemoteScenario(
    userId: string, 
    scenario: RemoteScenario
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.info(`Configuring remote scenario: ${scenario.type} for ${scenario.duration} minutes`);

      // Store scenario configuration
      await this.redis.setex(
        `user:${userId}:remote_scenario`,
        scenario.duration * 60, // Convert to seconds
        JSON.stringify(scenario)
      );

      // Update agent autonomy levels
      const projects = await this.getUserProjects(userId);
      
      for (const project of projects) {
        for (const agent of project.activeAgents) {
          await this.configureAgentAutonomy(agent.id, scenario);
        }
      }

      // Setup notification preferences
      await this.configureNotifications(userId, scenario);

      return {
        success: true,
        message: `Remote scenario configured: ${scenario.type}. Agents will operate with ${scenario.autonomyLevel} autonomy for ${scenario.duration} minutes.`
      };

    } catch (error) {
      logger.error('Error configuring remote scenario:', error);
      return {
        success: false,
        message: 'Failed to configure remote scenario'
      };
    }
  }

  /**
   * Configure agent autonomy based on remote scenario
   */
  private async configureAgentAutonomy(agentId: string, scenario: RemoteScenario): Promise<void> {
    const autonomyConfig = {
      agentId,
      level: scenario.autonomyLevel,
      duration: scenario.duration,
      instructions: scenario.agentInstructions,
      allowedActions: this.getAutonomyActions(scenario.autonomyLevel),
      pauseTriggers: this.getPauseTriggers(scenario.autonomyLevel)
    };

    await this.redis.setex(
      `agent:${agentId}:autonomy`,
      scenario.duration * 60,
      JSON.stringify(autonomyConfig)
    );
  }

  /**
   * Get allowed actions based on autonomy level
   */
  private getAutonomyActions(level: string): string[] {
    switch (level) {
      case 'full':
        return [
          'code_implementation', 'unit_testing', 'documentation', 
          'dependency_updates', 'build_fixes', 'formatting'
        ];
      case 'limited':
        return [
          'code_implementation', 'unit_testing', 'formatting'
        ];
      case 'pause':
        return [];
      case 'emergency_only':
        return ['critical_bug_fixes', 'security_patches'];
      default:
        return ['code_implementation'];
    }
  }

  /**
   * Get pause triggers based on autonomy level
   */
  private getPauseTriggers(level: string): string[] {
    const baseTriggers = [
      'architectural_decisions', 'security_implementations', 
      'database_schema_changes', 'external_integrations'
    ];

    switch (level) {
      case 'full':
        return ['critical_errors', 'security_vulnerabilities'];
      case 'limited':
        return [...baseTriggers, 'business_logic_changes'];
      case 'pause':
        return ['any_decision_required'];
      case 'emergency_only':
        return [...baseTriggers, 'any_non_emergency_task'];
      default:
        return baseTriggers;
    }
  }

  /**
   * Configure notification preferences for remote scenario
   */
  private async configureNotifications(userId: string, scenario: RemoteScenario): Promise<void> {
    const notificationConfig = {
      userId,
      mode: scenario.notificationMode,
      duration: scenario.duration,
      enabledTypes: this.getNotificationTypes(scenario.notificationMode),
      preferredChannels: this.getPreferredChannels(scenario.type)
    };

    await this.redis.setex(
      `user:${userId}:notifications`,
      scenario.duration * 60,
      JSON.stringify(notificationConfig)
    );
  }

  /**
   * Get notification types based on notification mode
   */
  private getNotificationTypes(mode: string): string[] {
    switch (mode) {
      case 'all':
        return [
          'task_completed', 'task_blocked', 'agent_error', 
          'deployment_status', 'client_messages', 'system_alerts'
        ];
      case 'critical':
        return [
          'agent_error', 'deployment_failures', 'security_alerts', 
          'system_outages', 'client_urgent'
        ];
      case 'silent':
        return ['system_outages'];
      default:
        return ['task_blocked', 'agent_error'];
    }
  }

  /**
   * Get preferred notification channels based on scenario
   */
  private getPreferredChannels(scenarioType: string): string[] {
    switch (scenarioType) {
      case 'walk_dog':
        return ['push_notification', 'sms'];
      case 'grocery_shopping':
        return ['push_notification'];
      case 'meeting':
        return ['silent_push'];
      case 'travel_day':
        return ['email', 'push_notification'];
      case 'vacation':
        return ['email'];
      default:
        return ['push_notification'];
    }
  }
}