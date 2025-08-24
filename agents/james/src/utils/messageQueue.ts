import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { config } from './config';
import { logger } from './logger';

export interface MessageHandler {
  (message: any, routingKey: string): Promise<void>;
}

class MessageQueueClass {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      logger.info('Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(config.messageQueue.url);
      this.channel = await this.connection.createChannel();

      // Setup exchange
      await this.channel.assertExchange(config.messageQueue.exchange, 'topic', {
        durable: true,
      });

      // Connection event handlers
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleConnectionError();
      });

      // Setup agent-specific queues
      await this.setupAgentQueues();

      logger.info('RabbitMQ connected successfully');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnecting = false;
      throw error;
    }

    this.isConnecting = false;
  }

  private async setupAgentQueues(): Promise<void> {
    if (!this.channel) return;

    // Agent-specific task queue
    const taskQueue = `agent.${config.agentId}.tasks`;
    await this.channel.assertQueue(taskQueue, { durable: true });
    await this.channel.bindQueue(taskQueue, config.messageQueue.exchange, `agent.${config.agentId}.*`);

    logger.info('Agent queues setup complete', { taskQueue });
  }

  private async handleConnectionError(): Promise<void> {
    this.connection = null;
    this.channel = null;

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Failed to reconnect to RabbitMQ:', error);
      }
    }, config.messageQueue.reconnectDelay);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      logger.info('RabbitMQ disconnected');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publish(routingKey: string, message: any, options: any = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('Message queue not connected');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      await this.channel.publish(
        config.messageQueue.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          ...options,
        }
      );

      logger.debug('Message published', { routingKey, messageSize: messageBuffer.length });
    } catch (error) {
      logger.error('Failed to publish message:', { routingKey, error });
      throw error;
    }
  }

  async subscribe(
    queueName: string,
    routingKeys: string[],
    handler: MessageHandler,
    options: any = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Message queue not connected');
    }

    try {
      // Assert queue
      await this.channel.assertQueue(queueName, {
        durable: true,
        ...options.queueOptions,
      });

      // Bind queue to routing keys
      for (const routingKey of routingKeys) {
        await this.channel.bindQueue(
          queueName,
          config.messageQueue.exchange,
          routingKey
        );
      }

      // Set prefetch count
      await this.channel.prefetch(options.prefetch || 1);

      // Start consuming
      await this.channel.consume(
        queueName,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const message = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            logger.debug('Message received', { routingKey, queueName });

            await handler(message, routingKey);

            // Acknowledge message
            this.channel?.ack(msg);
          } catch (error) {
            logger.error('Message handler error:', {
              routingKey: msg.fields.routingKey,
              error,
            });

            // Reject message and requeue
            this.channel?.nack(msg, false, true);
          }
        },
        options.consumerOptions
      );

      logger.info('Subscribed to queue', { queueName, routingKeys });
    } catch (error) {
      logger.error('Failed to subscribe to queue:', { queueName, error });
      throw error;
    }
  }

  // Agent-specific methods
  async publishAgentEvent(eventType: string, agentId: string, data: any): Promise<void> {
    const routingKey = `agent.${eventType}`;
    const message = {
      eventType,
      agentId,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, message);
  }

  async publishTaskResult(taskId: string, result: any, status: 'completed' | 'failed'): Promise<void> {
    const routingKey = `task.${status}`;
    const message = {
      taskId,
      agentId: config.agentId,
      result,
      status,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, message);
  }

  async publishProgressUpdate(taskId: string, progress: number, message?: string): Promise<void> {
    const routingKey = 'task.progress';
    const progressMessage = {
      taskId,
      agentId: config.agentId,
      progress,
      message,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, progressMessage);
  }

  async subscribeToAgentTasks(handler: MessageHandler): Promise<void> {
    const queueName = `agent.${config.agentId}.tasks`;
    await this.subscribe(
      queueName,
      [`agent.${config.agentId}.*`],
      handler,
      { prefetch: config.tasks.maxConcurrentTasks }
    );
  }

  async subscribeToSystemEvents(handler: MessageHandler): Promise<void> {
    const queueName = `agent.${config.agentId}.system`;
    await this.subscribe(
      queueName,
      ['system.*'],
      handler
    );
  }

  async sendHeartbeat(): Promise<void> {
    await this.publishAgentEvent('heartbeat', config.agentId, {
      status: 'active',
      timestamp: new Date().toISOString(),
      resourceUsage: {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
      },
    });
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      return !!(this.connection && !this.connection.connection.destroyed);
    } catch {
      return false;
    }
  }
}

export const MessageQueue = new MessageQueueClass();