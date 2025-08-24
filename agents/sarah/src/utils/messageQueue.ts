import amqp, { Connection, Channel, Message } from 'amqplib';
import { EventEmitter } from 'events';
import { config } from './config';
import { logger } from './logger';

export interface MessageHandler {
  (message: any, routingKey: string): Promise<void>;
}

export class MessageQueue extends EventEmitter {
  private static instance: MessageQueue;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;

  private constructor() {
    super();
  }

  static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.connect();
      await this.setupExchangesAndQueues();
      logger.info('Sarah MessageQueue initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sarah MessageQueue:', error);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.messageQueue.url);
      this.channel = await this.connection.createChannel();
      
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('Sarah connected to message queue');
    } catch (error) {
      logger.error('Sarah failed to connect to message queue:', error);
      await this.handleReconnect();
    }
  }

  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    // Declare exchanges
    await this.channel.assertExchange(config.messageQueue.exchange, 'topic', {
      durable: true,
    });

    // Declare Sarah's specific queues
    await this.channel.assertQueue(config.messageQueue.queues.tasks, {
      durable: true,
      arguments: {
        'x-message-ttl': 600000, // 10 minutes
        'x-dead-letter-exchange': `${config.messageQueue.exchange}.dead`,
      },
    });

    await this.channel.assertQueue(config.messageQueue.queues.events, {
      durable: true,
    });

    // Bind queues to routing keys
    await this.channel.bindQueue(
      config.messageQueue.queues.tasks,
      config.messageQueue.exchange,
      `agent.${config.agentId}.tasks.*`
    );

    await this.channel.bindQueue(
      config.messageQueue.queues.tasks,
      config.messageQueue.exchange,
      'agent.qa.tasks.*'
    );

    await this.channel.bindQueue(
      config.messageQueue.queues.events,
      config.messageQueue.exchange,
      'system.*'
    );

    logger.info('Sarah message queue exchanges and queues setup complete');
  }

  private handleConnectionError(error: Error): void {
    logger.error('Sarah message queue connection error:', error);
    this.isConnected = false;
  }

  private handleConnectionClose(): void {
    logger.warn('Sarah message queue connection closed');
    this.isConnected = false;
    this.handleReconnect();
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Sarah max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Sarah attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(async () => {
      try {
        await this.connect();
        await this.setupExchangesAndQueues();
        this.emit('reconnected');
      } catch (error) {
        logger.error(`Sarah reconnection attempt ${this.reconnectAttempts} failed:`, error);
        await this.handleReconnect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  async subscribeToAgentTasks(handler: MessageHandler): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    await this.channel.consume(
      config.messageQueue.queues.tasks,
      async (message: Message | null) => {
        if (!message) return;

        try {
          const content = JSON.parse(message.content.toString());
          const routingKey = message.fields.routingKey;
          
          logger.debug('Sarah received task message:', { routingKey, messageType: content.messageType });
          
          await handler(content, routingKey);
          this.channel!.ack(message);
          
        } catch (error) {
          logger.error('Sarah task message handler error:', error);
          this.channel!.nack(message, false, false); // Don't requeue failed messages
        }
      },
      { noAck: false }
    );

    logger.info('Sarah subscribed to agent tasks');
  }

  async subscribeToSystemEvents(handler: MessageHandler): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    await this.channel.consume(
      config.messageQueue.queues.events,
      async (message: Message | null) => {
        if (!message) return;

        try {
          const content = JSON.parse(message.content.toString());
          const routingKey = message.fields.routingKey;
          
          await handler(content, routingKey);
          this.channel!.ack(message);
          
        } catch (error) {
          logger.error('Sarah system event handler error:', error);
          this.channel!.nack(message, false, true); // Requeue system events
        }
      },
      { noAck: false }
    );

    logger.info('Sarah subscribed to system events');
  }

  async publishTaskResult(taskId: string, result: any, status: 'completed' | 'failed'): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const message = {
      eventType: 'task_' + status,
      agentId: config.agentId,
      agentType: config.agentType,
      taskId,
      result,
      timestamp: new Date().toISOString(),
    };

    await this.channel.publish(
      config.messageQueue.exchange,
      `agent.${config.agentId}.events.task_${status}`,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.debug(`Sarah published task ${status} event:`, { taskId, status });
  }

  async publishProgressUpdate(taskId: string, progress: number, message?: string): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const updateMessage = {
      eventType: 'task_progress',
      agentId: config.agentId,
      agentType: config.agentType,
      taskId,
      progress,
      message,
      timestamp: new Date().toISOString(),
    };

    await this.channel.publish(
      config.messageQueue.exchange,
      `agent.${config.agentId}.events.progress`,
      Buffer.from(JSON.stringify(updateMessage)),
      { persistent: false } // Progress updates don't need persistence
    );
  }

  async publishQualityGateResult(taskId: string, approved: boolean, qualityScore: number, issues: any[]): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const message = {
      eventType: 'quality_gate_result',
      agentId: config.agentId,
      agentType: config.agentType,
      taskId,
      approved,
      qualityScore,
      issueCount: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      timestamp: new Date().toISOString(),
    };

    await this.channel.publish(
      config.messageQueue.exchange,
      `quality.gate.result`,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Sarah published quality gate result:`, { taskId, approved, qualityScore });
  }

  async publishSecurityAlert(taskId: string, vulnerabilities: any[]): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const criticalVulnerabilities = vulnerabilities.filter(v => v.severity === 'critical');
    
    if (criticalVulnerabilities.length > 0) {
      const message = {
        eventType: 'security_alert',
        agentId: config.agentId,
        agentType: config.agentType,
        taskId,
        alertLevel: 'critical',
        vulnerabilityCount: vulnerabilities.length,
        criticalCount: criticalVulnerabilities.length,
        vulnerabilities: criticalVulnerabilities.map(v => ({
          title: v.title,
          file: v.file,
          line: v.line,
          impact: v.impact
        })),
        timestamp: new Date().toISOString(),
      };

      await this.channel.publish(
        config.messageQueue.exchange,
        'security.alert.critical',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      logger.warn(`Sarah published critical security alert:`, { taskId, criticalCount: criticalVulnerabilities.length });
    }
  }

  async sendHeartbeat(additionalData?: any): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const heartbeatMessage = {
      eventType: 'heartbeat',
      agentId: config.agentId,
      agentType: config.agentType,
      agentName: config.agentName,
      status: 'active',
      capabilities: [
        'adversarial_code_review',
        'security_vulnerability_scanning', 
        'performance_analysis',
        'quality_gate_enforcement',
        'architecture_review',
        'test_coverage_analysis'
      ],
      resourceUsage: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
      },
      ...additionalData,
      timestamp: new Date().toISOString(),
    };

    await this.channel.publish(
      config.messageQueue.exchange,
      `agent.${config.agentId}.heartbeat`,
      Buffer.from(JSON.stringify(heartbeatMessage)),
      { persistent: false }
    );
  }

  async requestContextInjection(agentId: string, contextTypes: string[], options?: any): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const message = {
      eventType: 'context_injection_request',
      requestingAgentId: config.agentId,
      targetAgentId: agentId,
      contextTypes,
      options: {
        maxSizeMB: 50,
        priority: 'high',
        ...options,
      },
      timestamp: new Date().toISOString(),
    };

    await this.channel.publish(
      config.messageQueue.exchange,
      `context.injection.request.${agentId}`,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.debug('Sarah requested context injection:', { agentId, contextTypes });
  }

  async notifyAgentCoordination(eventType: string, targetAgentIds: string[], data: any): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    const message = {
      eventType: 'agent_coordination',
      coordinationEvent: eventType,
      initiatingAgentId: config.agentId,
      targetAgents: targetAgentIds,
      data,
      timestamp: new Date().toISOString(),
    };

    for (const targetAgentId of targetAgentIds) {
      await this.channel.publish(
        config.messageQueue.exchange,
        `agent.${targetAgentId}.coordination`,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    }

    logger.debug('Sarah sent agent coordination message:', { eventType, targetAgentIds });
  }

  isChannelReady(): boolean {
    return this.isConnected && !!this.channel;
  }

  async shutdown(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      logger.info('Sarah MessageQueue shutdown complete');
      
    } catch (error) {
      logger.error('Error during Sarah MessageQueue shutdown:', error);
    }
  }
}

// Export singleton instance
const messageQueueInstance = MessageQueue.getInstance();
export { messageQueueInstance as MessageQueue };