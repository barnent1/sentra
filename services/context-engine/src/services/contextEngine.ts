import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import lz4 from 'lz4';
import { DatabaseManager } from '../utils/database';
import { RedisManager } from '../utils/redis';
import { MessageQueue } from '../utils/messageQueue';
import { MetricsCollector } from '../utils/metrics';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface ContextData {
  id: string;
  type: string;
  name: string;
  description?: string;
  parentId?: string;
  projectId?: string;
  userId: string;
  data: any;
  metadata: any;
  tags: string[];
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextSnapshot {
  id: string;
  contextId: string;
  snapshotData: any;
  checksum: string;
  version: number;
  createdAt: Date;
}

export interface ContextInjectionRequest {
  agentId: string;
  contextIds: string[];
  maxSizeMB?: number;
  priority?: 'low' | 'medium' | 'high';
  includeHistory?: boolean;
}

export interface ContextInjectionResponse {
  success: boolean;
  contexts: ContextData[];
  totalSizeMB: number;
  compressionRatio?: number;
  injectionId: string;
}

export class ContextEngine extends EventEmitter {
  private rotationTimer: NodeJS.Timeout | null = null;
  private snapshotTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Context Engine...');

    // Subscribe to message queue events
    await this.setupMessageHandlers();

    // Start background processes
    this.startRotationProcess();
    this.startSnapshotProcess();
    this.startCleanupProcess();

    // Initialize context storage tiers
    await this.initializeStorageTiers();

    logger.info('Context Engine initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Context Engine...');

    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    logger.info('Context Engine shutdown complete');
  }

  // Core context operations
  async createContext(contextData: Partial<ContextData>): Promise<string> {
    const timer = MetricsCollector.startTimer();

    try {
      const context = {
        id: uuidv4(),
        type: contextData.type || 'conversation',
        name: contextData.name || 'Untitled Context',
        description: contextData.description,
        parentId: contextData.parentId,
        projectId: contextData.projectId,
        userId: contextData.userId!,
        data: contextData.data || {},
        metadata: contextData.metadata || {},
        tags: contextData.tags || [],
        isActive: true,
        expiresAt: contextData.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in database
      const contextId = await DatabaseManager.createContext(context);

      // Store in hot cache
      await this.storeInHotCache(contextId, context);

      // Record metrics
      const dataSize = Buffer.from(JSON.stringify(context.data)).length;
      MetricsCollector.recordContextSize(context.type, dataSize);

      // Publish event
      await MessageQueue.publishContextEvent('created', contextId, { context });

      timer.end('create_context');
      logger.info('Context created', { contextId, type: context.type });

      return contextId;
    } catch (error) {
      timer.end('create_context', 'error');
      logger.error('Failed to create context:', error);
      throw error;
    }
  }

  async getContext(contextId: string, includeHistory: boolean = false): Promise<ContextData | null> {
    const timer = MetricsCollector.startTimer();

    try {
      // Try hot cache first
      let context = await RedisManager.getContextHot(contextId);
      if (context) {
        MetricsCollector.recordCacheHit('hot');
        timer.end('get_context');
        return context;
      }

      // Try warm cache
      context = await RedisManager.getContextWarm(contextId);
      if (context) {
        MetricsCollector.recordCacheHit('warm');
        // Promote to hot cache
        await this.storeInHotCache(contextId, context);
        timer.end('get_context');
        return context;
      }

      // Fall back to database (cold storage)
      MetricsCollector.recordCacheMiss('cold');
      context = await DatabaseManager.getContext(contextId);
      
      if (context) {
        // Store in warm cache
        await this.storeInWarmCache(contextId, context);
        timer.end('get_context');
        return context;
      }

      timer.end('get_context');
      return null;
    } catch (error) {
      timer.end('get_context', 'error');
      logger.error('Failed to get context:', { contextId, error });
      throw error;
    }
  }

  async updateContext(contextId: string, updates: Partial<ContextData>): Promise<void> {
    const timer = MetricsCollector.startTimer();

    try {
      // Update in database
      await DatabaseManager.updateContext(contextId, updates);

      // Invalidate caches
      await RedisManager.removeContextFromCache(contextId);

      // Get fresh context and store in hot cache
      const context = await DatabaseManager.getContext(contextId);
      if (context) {
        await this.storeInHotCache(contextId, context);
      }

      // Publish event
      await MessageQueue.publishContextEvent('updated', contextId, { updates });

      timer.end('update_context');
      logger.info('Context updated', { contextId });
    } catch (error) {
      timer.end('update_context', 'error');
      logger.error('Failed to update context:', { contextId, error });
      throw error;
    }
  }

  async deleteContext(contextId: string): Promise<void> {
    const timer = MetricsCollector.startTimer();

    try {
      // Soft delete in database
      await DatabaseManager.updateContext(contextId, { isActive: false });

      // Remove from caches
      await RedisManager.removeContextFromCache(contextId);

      // Publish event
      await MessageQueue.publishContextEvent('deleted', contextId, {});

      timer.end('delete_context');
      logger.info('Context deleted', { contextId });
    } catch (error) {
      timer.end('delete_context', 'error');
      logger.error('Failed to delete context:', { contextId, error });
      throw error;
    }
  }

  // Context injection for agents
  async injectContext(request: ContextInjectionRequest): Promise<ContextInjectionResponse> {
    const timer = MetricsCollector.startTimer();
    const injectionId = uuidv4();

    try {
      const contexts: ContextData[] = [];
      let totalSize = 0;
      const maxSizeBytes = (request.maxSizeMB || config.context.maxContextInjectionSizeMB) * 1024 * 1024;

      logger.info('Starting context injection', {
        injectionId,
        agentId: request.agentId,
        contextIds: request.contextIds,
      });

      for (const contextId of request.contextIds) {
        const context = await this.getContext(contextId, request.includeHistory);
        if (!context) {
          logger.warn('Context not found for injection', { contextId, injectionId });
          continue;
        }

        const contextSize = Buffer.from(JSON.stringify(context.data)).length;
        
        if (totalSize + contextSize > maxSizeBytes) {
          logger.warn('Context injection size limit reached', {
            injectionId,
            totalSizeMB: totalSize / 1024 / 1024,
            maxSizeMB: request.maxSizeMB,
          });
          break;
        }

        contexts.push(context);
        totalSize += contextSize;
      }

      // Compress contexts if enabled
      let compressionRatio: number | undefined;
      if (config.context.enableCompression && contexts.length > 0) {
        const originalData = JSON.stringify(contexts);
        const compressed = lz4.encode(Buffer.from(originalData));
        compressionRatio = compressed.length / Buffer.from(originalData).length;
        MetricsCollector.recordCompressionRatio(compressionRatio);
      }

      const duration = timer.end('inject_context');
      MetricsCollector.recordContextInjection(duration);

      const response: ContextInjectionResponse = {
        success: true,
        contexts,
        totalSizeMB: totalSize / 1024 / 1024,
        compressionRatio,
        injectionId,
      };

      // Publish injection event
      await MessageQueue.publishContextEvent('injected', '', {
        injectionId,
        agentId: request.agentId,
        contextCount: contexts.length,
        totalSizeMB: response.totalSizeMB,
      });

      logger.info('Context injection completed', {
        injectionId,
        contextCount: contexts.length,
        totalSizeMB: response.totalSizeMB,
      });

      return response;
    } catch (error) {
      timer.end('inject_context', 'error');
      logger.error('Context injection failed:', { injectionId, error });
      throw error;
    }
  }

  // Context snapshots
  async createSnapshot(contextId: string): Promise<string> {
    const timer = MetricsCollector.startTimer();

    try {
      const context = await this.getContext(contextId);
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }

      const snapshotData = {
        ...context,
        snapshotCreatedAt: new Date(),
      };

      const checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(snapshotData))
        .digest('hex');

      const snapshotId = await DatabaseManager.createContextSnapshot(contextId, snapshotData, checksum);

      timer.end('create_snapshot');
      logger.info('Context snapshot created', { contextId, snapshotId });

      return snapshotId;
    } catch (error) {
      timer.end('create_snapshot', 'error');
      logger.error('Failed to create snapshot:', { contextId, error });
      throw error;
    }
  }

  // Storage tier management
  private async storeInHotCache(contextId: string, context: any): Promise<void> {
    const ttl = config.context.hotToWarmThresholdHours * 3600;
    await RedisManager.setContextHot(contextId, context, ttl);
  }

  private async storeInWarmCache(contextId: string, context: any): Promise<void> {
    const ttl = config.context.warmToColdThresholdHours * 3600;
    await RedisManager.setContextWarm(contextId, context, ttl);
  }

  // Background processes
  private startRotationProcess(): void {
    const intervalMs = 60 * 60 * 1000; // Run every hour
    
    this.rotationTimer = setInterval(async () => {
      try {
        await this.rotateContexts();
      } catch (error) {
        logger.error('Context rotation failed:', error);
      }
    }, intervalMs);

    logger.info('Context rotation process started');
  }

  private async rotateContexts(): Promise<void> {
    logger.info('Starting context rotation');

    try {
      // Get cache statistics
      const stats = await RedisManager.getCacheStats();
      logger.info('Context rotation stats', stats);

      // Hot to warm rotation happens automatically via TTL
      // We just need to monitor and update metrics
      MetricsCollector.updateActiveContexts('all', 'hot', stats.hotContexts);
      MetricsCollector.updateActiveContexts('all', 'warm', stats.warmContexts);

    } catch (error) {
      logger.error('Context rotation error:', error);
    }
  }

  private startSnapshotProcess(): void {
    if (!config.context.enableSnapshots) return;

    const intervalMs = config.context.snapshotIntervalMinutes * 60 * 1000;
    
    this.snapshotTimer = setInterval(async () => {
      try {
        await this.createPeriodicSnapshots();
      } catch (error) {
        logger.error('Periodic snapshot creation failed:', error);
      }
    }, intervalMs);

    logger.info('Snapshot process started');
  }

  private async createPeriodicSnapshots(): Promise<void> {
    logger.info('Creating periodic snapshots');
    
    // This would be implemented based on specific business rules
    // For now, we'll just log that it's running
    logger.debug('Periodic snapshot creation completed');
  }

  private startCleanupProcess(): void {
    const intervalMs = 24 * 60 * 60 * 1000; // Run daily
    
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredContexts();
      } catch (error) {
        logger.error('Context cleanup failed:', error);
      }
    }, intervalMs);

    logger.info('Context cleanup process started');
  }

  private async cleanupExpiredContexts(): Promise<void> {
    logger.info('Starting context cleanup');

    try {
      const expiredCount = await DatabaseManager.cleanupExpiredContexts();
      logger.info(`Cleaned up ${expiredCount} expired contexts`);
    } catch (error) {
      logger.error('Context cleanup error:', error);
    }
  }

  private async initializeStorageTiers(): Promise<void> {
    logger.info('Initializing context storage tiers');
    
    // Get initial cache statistics
    const stats = await RedisManager.getCacheStats();
    MetricsCollector.updateActiveContexts('all', 'hot', stats.hotContexts);
    MetricsCollector.updateActiveContexts('all', 'warm', stats.warmContexts);
    
    logger.info('Storage tiers initialized', stats);
  }

  private async setupMessageHandlers(): Promise<void> {
    // Handle context requests from agents
    await MessageQueue.subscribeToContextRequests(async (message, routingKey) => {
      try {
        const { requestType, contextId, data } = message;
        
        switch (requestType) {
          case 'get':
            const context = await this.getContext(contextId);
            await MessageQueue.publishContextEvent('response', contextId, { context });
            break;
            
          case 'inject':
            const response = await this.injectContext(data);
            await MessageQueue.publishContextEvent('injection_response', '', response);
            break;
            
          default:
            logger.warn('Unknown context request type:', requestType);
        }
      } catch (error) {
        logger.error('Context request handler error:', error);
      }
    });

    logger.info('Message handlers setup complete');
  }

  // Search contexts
  async searchContexts(query: string, userId: string, projectId?: string): Promise<ContextData[]> {
    const timer = MetricsCollector.startTimer();

    try {
      // First try Redis search for quick results
      const contextIds = await RedisManager.searchContexts(query);
      const contexts: ContextData[] = [];

      for (const contextId of contextIds.slice(0, 20)) { // Limit to 20 results
        const context = await this.getContext(contextId);
        if (context && context.userId === userId) {
          if (!projectId || context.projectId === projectId) {
            contexts.push(context);
          }
        }
      }

      timer.end('search_contexts');
      return contexts;
    } catch (error) {
      timer.end('search_contexts', 'error');
      logger.error('Context search failed:', { query, userId, error });
      throw error;
    }
  }

  // Get context history/snapshots
  async getContextHistory(contextId: string, limit: number = 10): Promise<ContextSnapshot[]> {
    const timer = MetricsCollector.startTimer();

    try {
      const snapshots = await DatabaseManager.getContextSnapshots(contextId, limit);
      timer.end('get_context_history');
      return snapshots;
    } catch (error) {
      timer.end('get_context_history', 'error');
      logger.error('Failed to get context history:', { contextId, error });
      throw error;
    }
  }
}