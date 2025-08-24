import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { logger } from './logger';

export interface ContextData {
  id: string;
  type: string;
  name: string;
  description?: string;
  data: any;
  metadata: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextSnapshot {
  id: string;
  contextId: string;
  snapshotData: any;
  version: number;
  createdAt: Date;
}

class ContextClientClass {
  private client: AxiosInstance;
  private currentContextId: string | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.contextEngine.url,
      timeout: config.contextEngine.timeout,
      headers: {
        'User-Agent': `James-Agent/${config.agentId}`,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Context API request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('Context API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Context API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Context API response error:', {
          status: error.response?.status,
          url: error.config?.url,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async initialize(): Promise<void> {
    try {
      // Test connection to context engine
      const response = await this.client.get('/health/live');
      logger.info('Context engine connection established');

      // Start auto-save if enabled
      if (config.context.enableAutoSave) {
        this.startAutoSave();
      }

    } catch (error) {
      logger.error('Failed to connect to context engine:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Save current context before shutdown
    if (this.currentContextId) {
      await this.saveCurrentContext();
    }

    logger.info('Context client shutdown complete');
  }

  async createContext(type: string, name: string, data: any, metadata: any = {}): Promise<string> {
    try {
      const contextData = {
        type,
        name,
        description: `Context for James agent task: ${name}`,
        userId: config.agentId,
        data,
        metadata: {
          ...metadata,
          agentId: config.agentId,
          agentType: config.agentType,
          createdBy: 'james-agent',
        },
        tags: ['james-agent', type, config.agentType],
      };

      const response = await this.client.post('/api/context', contextData);
      const contextId = response.data.data.contextId;

      logger.info('Context created', { contextId, type, name });
      return contextId;

    } catch (error) {
      logger.error('Failed to create context:', { type, name, error });
      throw error;
    }
  }

  async getContext(contextId: string): Promise<ContextData | null> {
    try {
      const response = await this.client.get(`/api/context/${contextId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get context:', { contextId, error });
      throw error;
    }
  }

  async updateContext(contextId: string, updates: Partial<ContextData>): Promise<void> {
    try {
      await this.client.put(`/api/context/${contextId}`, updates);
      logger.debug('Context updated', { contextId });
    } catch (error) {
      logger.error('Failed to update context:', { contextId, error });
      throw error;
    }
  }

  async deleteContext(contextId: string): Promise<void> {
    try {
      await this.client.delete(`/api/context/${contextId}`);
      logger.info('Context deleted', { contextId });
    } catch (error) {
      logger.error('Failed to delete context:', { contextId, error });
      throw error;
    }
  }

  async createSnapshot(contextId: string): Promise<string> {
    try {
      const response = await this.client.post(`/api/context/${contextId}/snapshot`);
      const snapshotId = response.data.data.snapshotId;
      
      logger.info('Context snapshot created', { contextId, snapshotId });
      return snapshotId;
    } catch (error) {
      logger.error('Failed to create context snapshot:', { contextId, error });
      throw error;
    }
  }

  async getContextHistory(contextId: string, limit: number = 10): Promise<ContextSnapshot[]> {
    try {
      const response = await this.client.get(`/api/context/${contextId}/history`, {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get context history:', { contextId, error });
      throw error;
    }
  }

  async searchContexts(query: string): Promise<ContextData[]> {
    try {
      const response = await this.client.get('/api/context', {
        params: {
          q: query,
          userId: config.agentId,
        },
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to search contexts:', { query, error });
      throw error;
    }
  }

  // Task-specific context management
  async createTaskContext(taskId: string, taskType: string, taskData: any): Promise<string> {
    const contextName = `Task: ${taskType} (${taskId.slice(0, 8)})`;
    const contextData = {
      taskId,
      taskType,
      taskData,
      startedAt: new Date().toISOString(),
      workspace: {},
      fileChanges: [],
      codeSnippets: [],
      conversations: [],
      decisions: [],
    };

    const metadata = {
      taskId,
      taskType,
      priority: taskData.priority || 'medium',
      estimatedDuration: taskData.estimatedDuration,
    };

    const contextId = await this.createContext('task', contextName, contextData, metadata);
    this.currentContextId = contextId;

    logger.info('Task context created', { taskId, contextId, taskType });
    return contextId;
  }

  async updateTaskContext(contextId: string, updates: any): Promise<void> {
    try {
      const context = await this.getContext(contextId);
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }

      const updatedData = {
        ...context.data,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.updateContext(contextId, { data: updatedData });
    } catch (error) {
      logger.error('Failed to update task context:', { contextId, error });
      throw error;
    }
  }

  async addToTaskContext(contextId: string, key: string, value: any): Promise<void> {
    try {
      const context = await this.getContext(contextId);
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }

      const updatedData = { ...context.data };
      
      if (Array.isArray(updatedData[key])) {
        updatedData[key].push(value);
      } else if (typeof updatedData[key] === 'object') {
        updatedData[key] = { ...updatedData[key], ...value };
      } else {
        updatedData[key] = value;
      }

      await this.updateContext(contextId, { data: updatedData });
    } catch (error) {
      logger.error('Failed to add to task context:', { contextId, key, error });
      throw error;
    }
  }

  async completeTaskContext(contextId: string, result: any): Promise<void> {
    const updates = {
      completedAt: new Date().toISOString(),
      result,
      status: 'completed',
    };

    await this.updateTaskContext(contextId, updates);

    // Create snapshot if enabled
    if (config.context.snapshotOnTaskComplete) {
      await this.createSnapshot(contextId);
    }

    logger.info('Task context completed', { contextId });
  }

  async failTaskContext(contextId: string, error: any): Promise<void> {
    const updates = {
      failedAt: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      status: 'failed',
    };

    await this.updateTaskContext(contextId, updates);
    logger.error('Task context failed', { contextId, error: error.message });
  }

  // Conversation management
  async addConversationEntry(contextId: string, role: 'user' | 'assistant', content: string, metadata: any = {}): Promise<void> {
    const entry = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };

    await this.addToTaskContext(contextId, 'conversations', entry);
  }

  // File change tracking
  async trackFileChange(contextId: string, filePath: string, changeType: 'created' | 'modified' | 'deleted', content?: string): Promise<void> {
    const change = {
      id: uuidv4(),
      filePath,
      changeType,
      content,
      timestamp: new Date().toISOString(),
    };

    await this.addToTaskContext(contextId, 'fileChanges', change);
  }

  // Code snippet management
  async addCodeSnippet(contextId: string, language: string, code: string, description?: string): Promise<void> {
    const snippet = {
      id: uuidv4(),
      language,
      code,
      description,
      timestamp: new Date().toISOString(),
    };

    await this.addToTaskContext(contextId, 'codeSnippets', snippet);
  }

  // Decision tracking
  async recordDecision(contextId: string, decision: string, reasoning: string, alternatives?: string[]): Promise<void> {
    const decisionEntry = {
      id: uuidv4(),
      decision,
      reasoning,
      alternatives: alternatives || [],
      timestamp: new Date().toISOString(),
    };

    await this.addToTaskContext(contextId, 'decisions', decisionEntry);
  }

  private startAutoSave(): void {
    const interval = config.context.autoSaveIntervalMinutes * 60 * 1000;
    
    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveCurrentContext();
      } catch (error) {
        logger.error('Auto-save failed:', error);
      }
    }, interval);

    logger.info('Auto-save started', { 
      intervalMinutes: config.context.autoSaveIntervalMinutes 
    });
  }

  private async saveCurrentContext(): Promise<void> {
    if (!this.currentContextId) return;

    try {
      // This would save the current state
      // Implementation depends on what state needs to be saved
      logger.debug('Auto-save completed', { contextId: this.currentContextId });
    } catch (error) {
      logger.error('Auto-save error:', { contextId: this.currentContextId, error });
    }
  }

  getCurrentContextId(): string | null {
    return this.currentContextId;
  }

  setCurrentContextId(contextId: string | null): void {
    this.currentContextId = contextId;
  }
}

export const ContextClient = new ContextClientClass();