import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { DatabaseManager } from '../utils/database';
import { RedisManager } from '../utils/redis';
import { MessageQueue } from '../utils/messageQueue';
import { MetricsCollector } from '../utils/metrics';
import { DockerManager, ContainerConfig } from './dockerManager';

export interface AgentDefinition {
  id: string;
  name: string;
  type: string;
  version: string;
  imageName: string;
  capabilities: string[];
  resourceRequirements: {
    memory: string;
    cpu: string;
    disk?: string;
  };
  configuration: Record<string, any>;
  healthCheck?: {
    endpoint: string;
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface TaskRequest {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  agentType?: string;
  data: any;
  timeout?: number;
  retries?: number;
  requiresContext?: string[];
  callbacks?: {
    onProgress?: string;
    onComplete?: string;
    onError?: string;
  };
}

export interface AgentInstance {
  id: string;
  definition: AgentDefinition;
  containerId?: string;
  status: 'starting' | 'idle' | 'busy' | 'error' | 'stopping' | 'stopped';
  currentTask?: string;
  lastHeartbeat?: Date;
  resourceUsage: {
    cpu: number;
    memory: number;
  };
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
}

export class AgentOrchestrator extends EventEmitter {
  private dockerManager: DockerManager;
  private agents = new Map<string, AgentInstance>();
  private taskQueue = new Map<string, TaskRequest[]>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private taskProcessorTimer: NodeJS.Timeout | null = null;

  constructor(dockerManager: DockerManager) {
    super();
    this.dockerManager = dockerManager;
    
    // Initialize task queues
    this.taskQueue.set('critical', []);
    this.taskQueue.set('high', []);
    this.taskQueue.set('medium', []);
    this.taskQueue.set('low', []);
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Agent Orchestrator...');

    try {
      // Setup message handlers
      await this.setupMessageHandlers();

      // Start background processes
      this.startHeartbeatMonitoring();
      this.startTaskProcessor();

      // Load existing agents from database
      await this.loadExistingAgents();

      logger.info('Agent Orchestrator initialized');
    } catch (error) {
      logger.error('Failed to initialize Agent Orchestrator:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Agent Orchestrator...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.taskProcessorTimer) {
      clearInterval(this.taskProcessorTimer);
      this.taskProcessorTimer = null;
    }

    // Stop all agents
    const shutdownPromises = Array.from(this.agents.keys()).map(agentId =>
      this.stopAgent(agentId).catch(error =>
        logger.error('Error stopping agent during shutdown:', { agentId, error })
      )
    );

    await Promise.all(shutdownPromises);

    logger.info('Agent Orchestrator shutdown complete');
  }

  async createAgent(definition: AgentDefinition): Promise<string> {
    const timer = MetricsCollector.startTimer();

    try {
      logger.info('Creating agent', {
        agentId: definition.id,
        type: definition.type,
        name: definition.name,
      });

      // Store agent definition in database
      await DatabaseManager.createAgent({
        name: definition.name,
        type: definition.type,
        version: definition.version,
        status: 'idle',
        configuration: definition.configuration,
        capabilities: definition.capabilities,
        resourceRequirements: definition.resourceRequirements,
      });

      // Create agent instance
      const agentInstance: AgentInstance = {
        id: definition.id,
        definition,
        status: 'starting',
        resourceUsage: { cpu: 0, memory: 0 },
        createdAt: new Date(),
      };

      this.agents.set(definition.id, agentInstance);

      // Publish agent creation event
      await MessageQueue.publishAgentEvent('created', definition.id, {
        agentType: definition.type,
        capabilities: definition.capabilities,
      });

      timer.end('create_agent', definition.type, 'success');
      MetricsCollector.updateActiveAgents(definition.type, 'starting', 1);

      logger.info('Agent created successfully', { agentId: definition.id });

      return definition.id;
    } catch (error) {
      timer.end('create_agent', definition.type || 'unknown', 'error');
      logger.error('Failed to create agent:', { agentId: definition.id, error });
      throw error;
    }
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status === 'idle' || agent.status === 'busy') {
      logger.info('Agent already started', { agentId });
      return;
    }

    const timer = MetricsCollector.startTimer();

    try {
      logger.info('Starting agent', { agentId, type: agent.definition.type });

      // Prepare container configuration
      const containerConfig: ContainerConfig = {
        agentId,
        agentType: agent.definition.type,
        imageName: agent.definition.imageName,
        environment: {
          AGENT_ID: agentId,
          AGENT_TYPE: agent.definition.type,
          DATABASE_URL: config.database.url,
          REDIS_URL: config.redis.url,
          RABBITMQ_URL: config.messageQueue.url,
          CONTEXT_ENGINE_URL: config.contextEngine.url,
          ...agent.definition.configuration,
        },
        resourceLimits: {
          memory: agent.definition.resourceRequirements.memory,
          cpu: agent.definition.resourceRequirements.cpu,
        },
        healthCheck: agent.definition.healthCheck ? {
          test: [`CMD-SHELL`, agent.definition.healthCheck.endpoint],
          interval: agent.definition.healthCheck.interval,
          timeout: agent.definition.healthCheck.timeout,
          retries: agent.definition.healthCheck.retries,
        } : undefined,
      };

      // Create and start container
      const containerId = await this.dockerManager.createContainer(containerConfig);
      await this.dockerManager.startContainer(containerId);

      // Update agent instance
      agent.containerId = containerId;
      agent.status = 'idle';
      agent.startedAt = new Date();
      this.agents.set(agentId, agent);

      // Register agent in Redis
      await RedisManager.registerAgent(agentId, {
        type: agent.definition.type,
        capabilities: agent.definition.capabilities,
        status: 'idle',
        containerId,
      });

      // Update database
      await DatabaseManager.updateAgent(agentId, { status: 'idle' });
      await DatabaseManager.updateAgentHeartbeat(agentId);

      // Publish start event
      await MessageQueue.publishAgentEvent('started', agentId, {
        containerId,
        capabilities: agent.definition.capabilities,
      });

      timer.end('start_agent', agent.definition.type, 'success');
      MetricsCollector.updateActiveAgents(agent.definition.type, 'idle', 1);

      logger.info('Agent started successfully', { agentId, containerId });

    } catch (error) {
      agent.status = 'error';
      this.agents.set(agentId, agent);
      
      timer.end('start_agent', agent.definition.type, 'error');
      logger.error('Failed to start agent:', { agentId, error });
      throw error;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status === 'stopped' || agent.status === 'stopping') {
      logger.info('Agent already stopped or stopping', { agentId });
      return;
    }

    const timer = MetricsCollector.startTimer();

    try {
      logger.info('Stopping agent', { agentId, containerId: agent.containerId });

      agent.status = 'stopping';
      this.agents.set(agentId, agent);

      // Stop container if it exists
      if (agent.containerId) {
        await this.dockerManager.stopContainer(agent.containerId, config.agents.shutdownTimeout / 1000);
        await this.dockerManager.removeContainer(agent.containerId);
      }

      // Unregister from Redis
      await RedisManager.unregisterAgent(agentId, agent.definition.type);

      // Update agent instance
      agent.status = 'stopped';
      agent.stoppedAt = new Date();
      this.agents.set(agentId, agent);

      // Update database
      await DatabaseManager.updateAgent(agentId, { status: 'maintenance' });

      // Publish stop event
      await MessageQueue.publishAgentEvent('stopped', agentId, {
        containerId: agent.containerId,
      });

      timer.end('stop_agent', agent.definition.type, 'success');
      MetricsCollector.updateActiveAgents(agent.definition.type, 'stopped', 1);

      logger.info('Agent stopped successfully', { agentId });

    } catch (error) {
      timer.end('stop_agent', agent.definition.type, 'error');
      logger.error('Failed to stop agent:', { agentId, error });
      throw error;
    }
  }

  async assignTask(taskRequest: TaskRequest): Promise<void> {
    const timer = MetricsCollector.startTimer();

    try {
      logger.info('Assigning task', {
        taskId: taskRequest.id,
        type: taskRequest.type,
        priority: taskRequest.priority,
      });

      // Add task to appropriate queue
      const queue = this.taskQueue.get(taskRequest.priority) || [];
      queue.push(taskRequest);
      this.taskQueue.set(taskRequest.priority, queue);

      // Cache task in Redis
      await RedisManager.addTaskToQueue(taskRequest.priority, taskRequest);

      // Update metrics
      MetricsCollector.updateTaskQueue(taskRequest.priority, queue.length);

      // Publish task event
      await MessageQueue.publishTaskEvent('queued', taskRequest.id, {
        type: taskRequest.type,
        priority: taskRequest.priority,
        queueSize: queue.length,
      });

      timer.end('assign_task', taskRequest.agentType || 'any', 'success');

      logger.info('Task queued successfully', {
        taskId: taskRequest.id,
        queueSize: queue.length,
      });

    } catch (error) {
      timer.end('assign_task', taskRequest.agentType || 'any', 'error');
      logger.error('Failed to assign task:', { taskId: taskRequest.id, error });
      throw error;
    }
  }

  private async setupMessageHandlers(): Promise<void> {
    // Handle agent events
    await MessageQueue.subscribeToAgentEvents(async (message, routingKey) => {
      try {
        const { eventType, agentId, data } = message;
        
        switch (eventType) {
          case 'heartbeat':
            await this.handleAgentHeartbeat(agentId, data);
            break;
          case 'task_completed':
            await this.handleTaskCompleted(agentId, data);
            break;
          case 'task_failed':
            await this.handleTaskFailed(agentId, data);
            break;
          case 'status_changed':
            await this.handleAgentStatusChanged(agentId, data);
            break;
          default:
            logger.debug('Unknown agent event:', { eventType, agentId });
        }
      } catch (error) {
        logger.error('Agent event handler error:', { routingKey, error });
      }
    });

    // Handle container events
    await MessageQueue.subscribeToContainerEvents(async (message, routingKey) => {
      try {
        const { eventType, containerId, data } = message;
        
        switch (eventType) {
          case 'health_changed':
            await this.handleContainerHealthChanged(containerId, data);
            break;
          case 'stopped':
            await this.handleContainerStopped(containerId, data);
            break;
          default:
            logger.debug('Unknown container event:', { eventType, containerId });
        }
      } catch (error) {
        logger.error('Container event handler error:', { routingKey, error });
      }
    });

    logger.info('Message handlers setup complete');
  }

  private async handleAgentHeartbeat(agentId: string, data: any): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lastHeartbeat = new Date();
    agent.resourceUsage = data.resourceUsage || agent.resourceUsage;
    
    // Update database
    await DatabaseManager.updateAgentHeartbeat(agentId);
    
    // Update Redis
    await RedisManager.setAgentStatus(agentId, {
      status: agent.status,
      lastHeartbeat: agent.lastHeartbeat,
      resourceUsage: agent.resourceUsage,
    });
  }

  private async handleTaskCompleted(agentId: string, data: any): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const { taskId, result } = data;

    // Mark agent as idle
    agent.status = 'idle';
    agent.currentTask = undefined;
    this.agents.set(agentId, agent);

    // Update database
    await DatabaseManager.updateAgentTask(taskId, {
      status: 'completed',
      outputData: result,
      completedAt: new Date(),
    });

    // Publish completion event
    await MessageQueue.publishTaskEvent('completed', taskId, {
      agentId,
      result,
    });

    MetricsCollector.recordTaskProcessing(
      data.taskType || 'unknown',
      agent.definition.type,
      Date.now() - (data.startTime || Date.now()),
      'success'
    );

    logger.info('Task completed', { taskId, agentId });
  }

  private async handleTaskFailed(agentId: string, data: any): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const { taskId, error } = data;

    // Mark agent as idle
    agent.status = 'idle';
    agent.currentTask = undefined;
    this.agents.set(agentId, agent);

    // Update database
    await DatabaseManager.updateAgentTask(taskId, {
      status: 'failed',
      errorDetails: error,
      completedAt: new Date(),
    });

    // Publish failure event
    await MessageQueue.publishTaskEvent('failed', taskId, {
      agentId,
      error,
    });

    MetricsCollector.recordTaskProcessing(
      data.taskType || 'unknown',
      agent.definition.type,
      Date.now() - (data.startTime || Date.now()),
      'error'
    );

    logger.warn('Task failed', { taskId, agentId, error });
  }

  private async handleAgentStatusChanged(agentId: string, data: any): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const { newStatus } = data;
    agent.status = newStatus;
    this.agents.set(agentId, agent);

    // Update database
    await DatabaseManager.updateAgent(agentId, { status: newStatus });

    logger.info('Agent status changed', { agentId, newStatus });
  }

  private async handleContainerHealthChanged(containerId: string, data: any): Promise<void> {
    const agent = Array.from(this.agents.values()).find(a => a.containerId === containerId);
    if (!agent) return;

    const { healthStatus } = data;
    
    if (healthStatus === 'unhealthy') {
      logger.warn('Agent container unhealthy', {
        agentId: agent.id,
        containerId,
      });
      
      // Consider restarting the agent
      if (agent.status === 'idle') {
        await this.restartAgent(agent.id);
      }
    }
  }

  private async handleContainerStopped(containerId: string, data: any): Promise<void> {
    const agent = Array.from(this.agents.values()).find(a => a.containerId === containerId);
    if (!agent) return;

    if (agent.status !== 'stopping') {
      logger.warn('Agent container stopped unexpectedly', {
        agentId: agent.id,
        containerId,
      });
      
      agent.status = 'error';
      this.agents.set(agent.id, agent);
    }
  }

  private async restartAgent(agentId: string): Promise<void> {
    try {
      logger.info('Restarting agent', { agentId });
      await this.stopAgent(agentId);
      await this.startAgent(agentId);
    } catch (error) {
      logger.error('Failed to restart agent:', { agentId, error });
    }
  }

  private startHeartbeatMonitoring(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.checkAgentHeartbeats();
      } catch (error) {
        logger.error('Heartbeat monitoring error:', error);
      }
    }, config.agents.heartbeatInterval);

    logger.info('Heartbeat monitoring started');
  }

  private async checkAgentHeartbeats(): Promise<void> {
    const now = new Date();
    const timeout = config.agents.healthCheckTimeout;

    for (const [agentId, agent] of this.agents) {
      if (agent.status !== 'idle' && agent.status !== 'busy') continue;

      if (agent.lastHeartbeat) {
        const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat > timeout) {
          logger.warn('Agent missed heartbeat', {
            agentId,
            timeSinceHeartbeat,
            timeout,
          });
          
          // Mark agent as error and consider restarting
          agent.status = 'error';
          this.agents.set(agentId, agent);
          
          // Attempt restart
          await this.restartAgent(agentId);
        }
      }
    }
  }

  private startTaskProcessor(): void {
    this.taskProcessorTimer = setInterval(async () => {
      try {
        await this.processTaskQueues();
      } catch (error) {
        logger.error('Task processor error:', error);
      }
    }, 1000); // Process every second

    logger.info('Task processor started');
  }

  private async processTaskQueues(): Promise<void> {
    const priorities = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const queue = this.taskQueue.get(priority) || [];
      if (queue.length === 0) continue;

      // Find available agent
      const task = queue[0];
      const availableAgent = await this.findAvailableAgent(task.agentType);

      if (availableAgent) {
        // Remove task from queue
        queue.shift();
        this.taskQueue.set(priority, queue);
        
        // Assign task to agent
        await this.executeTask(availableAgent.id, task);
        
        // Update queue metrics
        MetricsCollector.updateTaskQueue(priority, queue.length);
      }
    }
  }

  private async findAvailableAgent(agentType?: string): Promise<AgentInstance | null> {
    for (const agent of this.agents.values()) {
      if (agent.status !== 'idle') continue;
      
      if (agentType && agent.definition.type !== agentType) continue;
      
      return agent;
    }
    
    return null;
  }

  private async executeTask(agentId: string, task: TaskRequest): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      logger.info('Executing task', {
        taskId: task.id,
        agentId,
        type: task.type,
      });

      // Mark agent as busy
      agent.status = 'busy';
      agent.currentTask = task.id;
      this.agents.set(agentId, agent);

      // Create agent task record
      await DatabaseManager.createAgentTask({
        agentId,
        taskId: task.id,
        status: 'in_progress',
        inputData: task.data,
        startedAt: new Date(),
      });

      // Request context injection if needed
      if (task.requiresContext && task.requiresContext.length > 0) {
        await MessageQueue.requestContextInjection(agentId, task.requiresContext, {
          maxSizeMB: config.context.maxContextInjectionSizeMB,
        });
      }

      // Send task to agent
      await MessageQueue.sendToAgent(agentId, 'execute_task', {
        taskId: task.id,
        type: task.type,
        data: task.data,
        timeout: task.timeout || config.agents.defaultTimeout,
      });

      // Publish task start event
      await MessageQueue.publishTaskEvent('started', task.id, {
        agentId,
        type: task.type,
      });

      logger.info('Task sent to agent', { taskId: task.id, agentId });

    } catch (error) {
      logger.error('Failed to execute task:', { taskId: task.id, agentId, error });
      
      // Mark agent as idle on error
      agent.status = 'idle';
      agent.currentTask = undefined;
      this.agents.set(agentId, agent);
    }
  }

  private async loadExistingAgents(): Promise<void> {
    try {
      const dbAgents = await DatabaseManager.getActiveAgents();
      
      for (const dbAgent of dbAgents) {
        // Recreate agent instance from database
        const agentInstance: AgentInstance = {
          id: dbAgent.id,
          definition: {
            id: dbAgent.id,
            name: dbAgent.name,
            type: dbAgent.type,
            version: dbAgent.version,
            imageName: `${dbAgent.type}:${dbAgent.version}`,
            capabilities: dbAgent.capabilities,
            resourceRequirements: dbAgent.resource_requirements,
            configuration: dbAgent.configuration,
          },
          status: 'stopped',
          resourceUsage: { cpu: 0, memory: 0 },
          createdAt: new Date(dbAgent.created_at),
          lastHeartbeat: dbAgent.last_heartbeat ? new Date(dbAgent.last_heartbeat) : undefined,
        };

        this.agents.set(dbAgent.id, agentInstance);
      }

      logger.info(`Loaded ${dbAgents.length} existing agents`);
    } catch (error) {
      logger.error('Failed to load existing agents:', error);
    }
  }

  // Public API methods
  getAgent(agentId: string): AgentInstance | null {
    return this.agents.get(agentId) || null;
  }

  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  getAgentsByType(agentType: string): AgentInstance[] {
    return Array.from(this.agents.values()).filter(agent => agent.definition.type === agentType);
  }

  getActiveAgents(): AgentInstance[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status === 'idle' || agent.status === 'busy'
    );
  }

  async getQueueStatus(): Promise<Record<string, number>> {
    const status: Record<string, number> = {};
    
    for (const [priority, queue] of this.taskQueue) {
      status[priority] = queue.length;
    }

    return status;
  }
}