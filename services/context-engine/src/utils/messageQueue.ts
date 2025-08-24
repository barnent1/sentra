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

      logger.info('RabbitMQ connected successfully');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnecting = false;
      throw error;
    }

    this.isConnecting = false;
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

      // Set prefetch count for load balancing
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

  // Context-specific message operations
  async publishContextEvent(eventType: string, contextId: string, data: any): Promise<void> {
    const routingKey = `context.${eventType}`;
    const message = {
      eventType,
      contextId,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, message);
  }

  async subscribeToContextEvents(handler: MessageHandler): Promise<void> {
    await this.subscribe(
      'context-engine.context-events',
      ['context.*'],
      handler
    );
  }

  async publishContextRequest(requestType: string, contextId: string, data: any): Promise<void> {
    const routingKey = `context.request.${requestType}`;
    const message = {
      requestType,
      contextId,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, message);
  }

  async subscribeToContextRequests(handler: MessageHandler): Promise<void> {
    await this.subscribe(
      'context-engine.context-requests',
      ['context.request.*'],
      handler
    );
  }

  // Agent communication
  async publishToAgent(agentId: string, messageType: string, data: any): Promise<void> {
    const routingKey = `agent.${agentId}.${messageType}`;
    const message = {
      agentId,
      messageType,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, message);
  }

  async subscribeToAgentMessages(agentId: string, handler: MessageHandler): Promise<void> {
    await this.subscribe(
      `agent-${agentId}.messages`,
      [`agent.${agentId}.*`],
      handler
    );
  }

  // System-wide broadcasts
  async broadcastSystemMessage(messageType: string, data: any): Promise<void> {
    const routingKey = `system.${messageType}`;
    const message = {
      messageType,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.publish(routingKey, message);
  }

  async subscribeToSystemMessages(handler: MessageHandler): Promise<void> {
    await this.subscribe(
      'context-engine.system-messages',
      ['system.*'],
      handler
    );
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