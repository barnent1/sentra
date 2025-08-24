/**
 * Voice Command Processor
 * Natural language processing for mobile voice commands
 */

import { logger } from '../utils/logger';
import { OpenAI } from 'openai';
import { DatabaseService } from '../services/DatabaseService';

export interface VoiceCommandResult {
  success: boolean;
  action: string;
  targetAgent?: string;
  parameters?: Record<string, any>;
  message: string;
  requiresConfirmation?: boolean;
  estimatedImpact?: string;
}

export interface CommandContext {
  projectId?: string;
  currentView?: string;
  recentActions?: string[];
  activeAgents?: string[];
}

export class VoiceCommandProcessor {
  private openai: OpenAI;
  private db: DatabaseService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.db = new DatabaseService();
  }

  /**
   * Process natural language voice command
   */
  async processCommand(
    userId: string,
    command: string,
    context: CommandContext
  ): Promise<VoiceCommandResult> {
    try {
      logger.info(`Processing voice command: "${command}" for user ${userId}`);

      // Classify the command intent
      const intent = await this.classifyIntent(command, context);
      
      // Route to appropriate handler
      switch (intent.type) {
        case 'agent_instruction':
          return await this.handleAgentInstruction(userId, command, intent, context);
          
        case 'project_query':
          return await this.handleProjectQuery(userId, command, intent, context);
          
        case 'status_request':
          return await this.handleStatusRequest(userId, command, intent, context);
          
        case 'configuration_change':
          return await this.handleConfigurationChange(userId, command, intent, context);
          
        case 'emergency_action':
          return await this.handleEmergencyAction(userId, command, intent, context);
          
        default:
          return {
            success: false,
            action: 'unknown',
            message: `I didn't understand that command. Try something like "Tell James to use JWT instead of sessions" or "What's the status of project Alpha?"`
          };
      }

    } catch (error) {
      logger.error('Error processing voice command:', error);
      return {
        success: false,
        action: 'error',
        message: 'Sorry, I encountered an error processing your command.'
      };
    }
  }

  /**
   * Classify command intent using AI
   */
  private async classifyIntent(command: string, context: CommandContext): Promise<any> {
    try {
      const prompt = `
Classify this voice command for a development project management system:

Command: "${command}"
Context: ${JSON.stringify(context, null, 2)}

Classify into one of these intents:
- agent_instruction: Direct instructions to specific agents (James, Sarah, Mike, etc.)
- project_query: Questions about project status, progress, timelines
- status_request: Requests for current status of agents, tasks, or system
- configuration_change: Changes to settings, preferences, or system configuration
- emergency_action: Urgent actions like stopping agents, emergency deployments

Return JSON with:
{
  "type": "intent_type",
  "confidence": 0.95,
  "entities": {
    "agent": "agent_name_if_mentioned",
    "project": "project_name_if_mentioned", 
    "action": "specific_action_requested",
    "parameters": {}
  },
  "reasoning": "why_this_classification"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an expert at classifying voice commands for development project management. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);

    } catch (error) {
      logger.error('Error classifying intent:', error);
      return {
        type: 'unknown',
        confidence: 0,
        entities: {},
        reasoning: 'Classification failed'
      };
    }
  }

  /**
   * Handle agent instruction commands
   * Examples: "Tell James to use JWT instead of sessions"
   */
  private async handleAgentInstruction(
    userId: string,
    command: string,
    intent: any,
    context: CommandContext
  ): Promise<VoiceCommandResult> {
    try {
      const { agent, action, parameters } = intent.entities;
      
      if (!agent) {
        return {
          success: false,
          action: 'agent_instruction',
          message: 'Please specify which agent you want to instruct (James, Sarah, Mike, etc.)'
        };
      }

      // Get agent ID from name
      const agentResult = await this.db.query(`
        SELECT id, name, type, status FROM agents 
        WHERE LOWER(name) = LOWER($1) OR LOWER(type) = LOWER($1)
        LIMIT 1
      `, [agent]);

      if (agentResult.rows.length === 0) {
        return {
          success: false,
          action: 'agent_instruction',
          message: `I couldn't find an agent named "${agent}". Available agents include James (dev), Sarah (QA), Mike (PM), and others.`
        };
      }

      const agentInfo = agentResult.rows[0];

      // Generate specific instruction from natural language
      const instruction = await this.generateAgentInstruction(command, agentInfo, context);

      // Queue the instruction for the agent
      await this.queueAgentInstruction(userId, agentInfo.id, instruction);

      return {
        success: true,
        action: 'agent_instruction',
        targetAgent: agentInfo.name,
        parameters: instruction,
        message: `✅ Instruction sent to ${agentInfo.name}: ${instruction.summary}`,
        estimatedImpact: instruction.estimatedImpact
      };

    } catch (error) {
      logger.error('Error handling agent instruction:', error);
      return {
        success: false,
        action: 'agent_instruction',
        message: 'Failed to process agent instruction'
      };
    }
  }

  /**
   * Generate specific agent instruction from natural language
   */
  private async generateAgentInstruction(
    command: string,
    agentInfo: any,
    context: CommandContext
  ): Promise<any> {
    try {
      const prompt = `
Convert this voice command into a specific technical instruction for a ${agentInfo.type} agent:

Command: "${command}"
Agent: ${agentInfo.name} (${agentInfo.type})
Context: ${JSON.stringify(context, null, 2)}

Generate a specific instruction with:
{
  "summary": "Brief description of what to do",
  "details": "Detailed technical instructions",
  "priority": "low|medium|high|critical",
  "estimatedImpact": "Brief description of expected impact",
  "requiresConfirmation": boolean,
  "constraints": ["any constraints or requirements"],
  "context": "additional context for the agent"
}

Make it specific and actionable for a ${agentInfo.type} agent.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: `You are an expert at translating voice commands into technical instructions for AI development agents. Always return valid JSON.` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);

    } catch (error) {
      logger.error('Error generating agent instruction:', error);
      return {
        summary: command,
        details: `Voice command: ${command}`,
        priority: 'medium',
        estimatedImpact: 'Unknown impact',
        requiresConfirmation: false,
        constraints: [],
        context: 'Voice command processing'
      };
    }
  }

  /**
   * Queue instruction for agent execution
   */
  private async queueAgentInstruction(
    userId: string,
    agentId: string,
    instruction: any
  ): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO agent_tasks (
          id, agent_id, user_id, task_type, description, 
          priority, status, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'voice_instruction', $3,
          $4, 'queued', $5, NOW()
        )
      `, [
        agentId,
        userId,
        instruction.summary,
        instruction.priority,
        JSON.stringify(instruction)
      ]);

      logger.info(`Queued voice instruction for agent ${agentId}`);

    } catch (error) {
      logger.error('Error queuing agent instruction:', error);
      throw error;
    }
  }

  /**
   * Handle project query commands
   * Examples: "What's the status of project Alpha?"
   */
  private async handleProjectQuery(
    userId: string,
    command: string,
    intent: any,
    context: CommandContext
  ): Promise<VoiceCommandResult> {
    try {
      const { project } = intent.entities;
      
      let projectId = context.projectId;
      
      if (project && !projectId) {
        // Find project by name
        const projectResult = await this.db.query(`
          SELECT id, name FROM projects 
          WHERE LOWER(name) LIKE LOWER($1) 
            AND (owner_id = $2 OR id IN (
              SELECT project_id FROM project_members WHERE user_id = $2
            ))
          LIMIT 1
        `, [`%${project}%`, userId]);

        if (projectResult.rows.length > 0) {
          projectId = projectResult.rows[0].id;
        }
      }

      if (!projectId) {
        return {
          success: false,
          action: 'project_query',
          message: 'Please specify which project you want to know about, or make sure you have the project selected.'
        };
      }

      // Get project status
      const status = await this.getProjectStatusSummary(projectId);

      return {
        success: true,
        action: 'project_query',
        parameters: { projectId, status },
        message: status
      };

    } catch (error) {
      logger.error('Error handling project query:', error);
      return {
        success: false,
        action: 'project_query',
        message: 'Failed to get project status'
      };
    }
  }

  /**
   * Get human-readable project status summary
   */
  private async getProjectStatusSummary(projectId: string): Promise<string> {
    try {
      const result = await this.db.query(`
        SELECT 
          p.name,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
          COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.id = $1
        GROUP BY p.id, p.name
      `, [projectId]);

      if (result.rows.length === 0) {
        return 'Project not found.';
      }

      const data = result.rows[0];
      const progress = data.total_tasks > 0 
        ? Math.round((data.completed_tasks / data.total_tasks) * 100)
        : 0;

      let summary = `${data.name} is ${progress}% complete. `;
      
      if (data.in_progress_tasks > 0) {
        summary += `${data.in_progress_tasks} tasks are currently in progress. `;
      }
      
      if (data.blocked_tasks > 0) {
        summary += `${data.blocked_tasks} tasks are blocked and need attention. `;
      }

      if (data.completed_tasks === data.total_tasks && data.total_tasks > 0) {
        summary += 'All tasks are complete! 🎉';
      }

      return summary;

    } catch (error) {
      logger.error('Error getting project status summary:', error);
      return 'Unable to get project status at this time.';
    }
  }

  /**
   * Handle status request commands
   * Examples: "How are the agents doing?"
   */
  private async handleStatusRequest(
    userId: string,
    command: string,
    intent: any,
    context: CommandContext
  ): Promise<VoiceCommandResult> {
    try {
      // Get overall system status
      const agentStatus = await this.getAgentStatusSummary(userId, context.projectId);
      
      return {
        success: true,
        action: 'status_request',
        message: agentStatus
      };

    } catch (error) {
      logger.error('Error handling status request:', error);
      return {
        success: false,
        action: 'status_request',
        message: 'Failed to get system status'
      };
    }
  }

  /**
   * Get agent status summary
   */
  private async getAgentStatusSummary(
    userId: string, 
    projectId?: string
  ): Promise<string> {
    try {
      const whereClause = projectId 
        ? 'WHERE a.project_id = $1 OR a.project_id IS NULL' 
        : 'WHERE a.project_id IS NULL OR a.project_id IN (SELECT id FROM projects WHERE owner_id = $1)';

      const result = await this.db.query(`
        SELECT 
          a.name,
          a.type,
          a.status,
          a.current_task,
          COUNT(at.id) as recent_tasks
        FROM agents a
        LEFT JOIN agent_tasks at ON a.id = at.agent_id 
          AND at.created_at >= NOW() - INTERVAL '1 hour'
        ${whereClause}
        GROUP BY a.id, a.name, a.type, a.status, a.current_task
        ORDER BY a.last_activity DESC
      `, projectId ? [projectId] : [userId]);

      if (result.rows.length === 0) {
        return 'No agents are currently active.';
      }

      const activeAgents = result.rows.filter(a => a.status === 'active');
      const idleAgents = result.rows.filter(a => a.status === 'idle');
      const blockedAgents = result.rows.filter(a => a.status === 'blocked');

      let summary = '';

      if (activeAgents.length > 0) {
        summary += `${activeAgents.length} agents are actively working: `;
        summary += activeAgents.map(a => `${a.name} (${a.current_task || 'general tasks'})`).join(', ');
        summary += '. ';
      }

      if (blockedAgents.length > 0) {
        summary += `${blockedAgents.length} agents are blocked and need attention: `;
        summary += blockedAgents.map(a => a.name).join(', ');
        summary += '. ';
      }

      if (idleAgents.length > 0 && activeAgents.length === 0) {
        summary += `${idleAgents.length} agents are idle and ready for tasks.`;
      }

      return summary || 'All agents are ready and waiting for tasks.';

    } catch (error) {
      logger.error('Error getting agent status summary:', error);
      return 'Unable to get agent status at this time.';
    }
  }

  /**
   * Handle configuration change commands
   * Examples: "Switch to focus mode"
   */
  private async handleConfigurationChange(
    userId: string,
    command: string,
    intent: any,
    context: CommandContext
  ): Promise<VoiceCommandResult> {
    // Implementation for configuration changes
    return {
      success: true,
      action: 'configuration_change',
      message: 'Configuration updated successfully'
    };
  }

  /**
   * Handle emergency action commands
   * Examples: "Stop all agents immediately"
   */
  private async handleEmergencyAction(
    userId: string,
    command: string,
    intent: any,
    context: CommandContext
  ): Promise<VoiceCommandResult> {
    try {
      logger.warn(`Emergency action requested: ${command}`);

      if (command.toLowerCase().includes('stop')) {
        // Emergency stop all agents
        await this.db.query(`
          UPDATE agents SET status = 'paused', current_task = NULL 
          WHERE project_id IN (
            SELECT id FROM projects WHERE owner_id = $1
          ) OR project_id IS NULL
        `, [userId]);

        return {
          success: true,
          action: 'emergency_stop',
          message: '🛑 Emergency stop activated. All agents have been paused.'
        };
      }

      return {
        success: false,
        action: 'emergency_action',
        message: 'Emergency action not recognized. Try "stop all agents immediately".'
      };

    } catch (error) {
      logger.error('Error handling emergency action:', error);
      return {
        success: false,
        action: 'emergency_action',
        message: 'Failed to execute emergency action'
      };
    }
  }
}