import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import simpleGit, { SimpleGit } from 'simple-git';
import chokidar from 'chokidar';
import ignore from 'ignore';
import { glob } from 'glob';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { MessageQueue } from '../utils/messageQueue';
import { ContextClient } from '../utils/contextClient';

export interface Task {
  id: string;
  type: string;
  data: any;
  timeout?: number;
  contextId?: string;
  startedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  progress: number;
  result?: any;
  error?: string;
}

export interface WorkspaceState {
  rootPath: string;
  gitInitialized: boolean;
  trackedFiles: Set<string>;
  ignoredPatterns: string[];
  activeFiles: Map<string, { content: string; lastModified: Date }>;
}

export class JamesAgent extends EventEmitter {
  private anthropic: Anthropic;
  private git: SimpleGit;
  private workspace: WorkspaceState;
  private activeTasks = new Map<string, Task>();
  private fileWatcher?: chokidar.FSWatcher;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private progressTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();

    // Initialize Anthropic AI client
    if (!config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });

    // Initialize workspace
    this.workspace = {
      rootPath: config.development.workspaceRoot,
      gitInitialized: false,
      trackedFiles: new Set(),
      ignoredPatterns: config.development.ignoredPatterns,
      activeFiles: new Map(),
    };

    // Initialize Git
    this.git = simpleGit(this.workspace.rootPath);
  }

  async initialize(): Promise<void> {
    logger.info('Initializing James Agent...');

    try {
      // Setup workspace
      await this.setupWorkspace();

      // Setup message handlers
      await this.setupMessageHandlers();

      // Start file watching if enabled
      if (config.development.enableFileWatching) {
        await this.startFileWatching();
      }

      // Start heartbeat
      this.startHeartbeat();

      // Start progress reporting
      if (config.tasks.enableProgressReporting) {
        this.startProgressReporting();
      }

      logger.info('James Agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize James Agent:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down James Agent...');

    // Stop timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    // Stop file watcher
    if (this.fileWatcher) {
      await this.fileWatcher.close();
      this.fileWatcher = undefined;
    }

    // Complete any active tasks
    for (const task of this.activeTasks.values()) {
      if (task.status === 'in_progress') {
        await this.failTask(task.id, new Error('Agent shutting down'));
      }
    }

    logger.info('James Agent shutdown complete');
  }

  private async setupWorkspace(): Promise<void> {
    try {
      // Ensure workspace directory exists
      await fs.ensureDir(this.workspace.rootPath);

      // Initialize Git repository if not exists
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        await this.git.init();
        await this.git.addConfig('user.name', config.development.gitConfig.name);
        await this.git.addConfig('user.email', config.development.gitConfig.email);
        
        // Create initial commit
        await fs.writeFile(
          path.join(this.workspace.rootPath, '.gitignore'),
          config.development.ignoredPatterns.join('\n')
        );
        await this.git.add('.gitignore');
        await this.git.commit('Initial commit by James Agent');
        
        this.workspace.gitInitialized = true;
        logger.info('Git repository initialized');
      } else {
        this.workspace.gitInitialized = true;
        logger.info('Existing Git repository found');
      }

      // Scan existing files
      await this.scanWorkspaceFiles();

    } catch (error) {
      logger.error('Failed to setup workspace:', error);
      throw error;
    }
  }

  private async scanWorkspaceFiles(): Promise<void> {
    try {
      const ig = ignore().add(this.workspace.ignoredPatterns);
      
      const files = await glob('**/*', {
        cwd: this.workspace.rootPath,
        nodir: true,
        ignore: this.workspace.ignoredPatterns,
      });

      for (const file of files) {
        if (!ig.ignores(file)) {
          this.workspace.trackedFiles.add(file);
        }
      }

      logger.info('Workspace scanned', {
        trackedFiles: this.workspace.trackedFiles.size,
      });

    } catch (error) {
      logger.error('Failed to scan workspace files:', error);
    }
  }

  private async startFileWatching(): Promise<void> {
    try {
      this.fileWatcher = chokidar.watch(this.workspace.rootPath, {
        ignored: this.workspace.ignoredPatterns,
        persistent: true,
        ignoreInitial: true,
      });

      this.fileWatcher
        .on('add', (filePath) => this.handleFileChange(filePath, 'created'))
        .on('change', (filePath) => this.handleFileChange(filePath, 'modified'))
        .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'));

      logger.info('File watching started');
    } catch (error) {
      logger.error('Failed to start file watching:', error);
    }
  }

  private async handleFileChange(filePath: string, changeType: 'created' | 'modified' | 'deleted'): Promise<void> {
    try {
      const relativePath = path.relative(this.workspace.rootPath, filePath);
      
      // Update workspace tracking
      if (changeType === 'created') {
        this.workspace.trackedFiles.add(relativePath);
      } else if (changeType === 'deleted') {
        this.workspace.trackedFiles.delete(relativePath);
        this.workspace.activeFiles.delete(relativePath);
      }

      // Update active file content
      if (changeType !== 'deleted') {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const stats = await fs.stat(filePath);
          
          this.workspace.activeFiles.set(relativePath, {
            content,
            lastModified: stats.mtime,
          });
        } catch (error) {
          // File might be temporarily unavailable
          logger.debug('Could not read file during change:', { filePath, error });
        }
      }

      // Track in active task contexts
      for (const task of this.activeTasks.values()) {
        if (task.contextId) {
          await ContextClient.trackFileChange(task.contextId, relativePath, changeType);
        }
      }

      logger.debug('File change tracked', { filePath: relativePath, changeType });
    } catch (error) {
      logger.error('Failed to handle file change:', { filePath, changeType, error });
    }
  }

  private async setupMessageHandlers(): Promise<void> {
    // Subscribe to agent-specific tasks
    await MessageQueue.subscribeToAgentTasks(async (message, routingKey) => {
      try {
        const { messageType, data } = message;
        
        switch (messageType) {
          case 'execute_task':
            await this.handleTaskExecution(data);
            break;
          case 'cancel_task':
            await this.handleTaskCancellation(data);
            break;
          case 'get_status':
            await this.handleStatusRequest(data);
            break;
          default:
            logger.warn('Unknown message type:', { messageType, routingKey });
        }
      } catch (error) {
        logger.error('Message handler error:', { routingKey, error });
      }
    });

    // Subscribe to system events
    await MessageQueue.subscribeToSystemEvents(async (message, routingKey) => {
      try {
        const { messageType, data } = message;
        
        switch (messageType) {
          case 'shutdown':
            logger.info('Received shutdown signal from system');
            await this.shutdown();
            break;
          case 'update_config':
            logger.info('Received config update signal');
            // Handle config updates if needed
            break;
          default:
            logger.debug('System event received:', { messageType, data });
        }
      } catch (error) {
        logger.error('System event handler error:', { routingKey, error });
      }
    });

    logger.info('Message handlers setup complete');
  }

  private async handleTaskExecution(taskData: any): Promise<void> {
    const { taskId, type, data, timeout } = taskData;
    
    try {
      logger.info('Starting task execution', { taskId, type });

      // Create task
      const task: Task = {
        id: taskId,
        type,
        data,
        timeout: timeout || config.tasks.taskTimeout,
        startedAt: new Date(),
        status: 'in_progress',
        progress: 0,
      };

      this.activeTasks.set(taskId, task);

      // Create task context
      const contextId = await ContextClient.createTaskContext(taskId, type, data);
      task.contextId = contextId;

      // Execute task based on type
      const result = await this.executeTask(task);

      // Complete task
      await this.completeTask(taskId, result);

    } catch (error) {
      logger.error('Task execution failed:', { taskId, error });
      await this.failTask(taskId, error as Error);
    }
  }

  private async executeTask(task: Task): Promise<any> {
    logger.info('Executing task', { taskId: task.id, type: task.type });

    try {
      switch (task.type) {
        case 'code_analysis':
          return await this.performCodeAnalysis(task);
        case 'code_generation':
          return await this.performCodeGeneration(task);
        case 'code_review':
          return await this.performCodeReview(task);
        case 'documentation_generation':
          return await this.performDocumentationGeneration(task);
        case 'refactoring':
          return await this.performRefactoring(task);
        case 'testing':
          return await this.performTesting(task);
        case 'file_operations':
          return await this.performFileOperations(task);
        case 'git_operations':
          return await this.performGitOperations(task);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      logger.error('Task execution error:', { taskId: task.id, type: task.type, error });
      throw error;
    }
  }

  private async performCodeAnalysis(task: Task): Promise<any> {
    const { filePath, analysisType } = task.data;
    
    this.updateTaskProgress(task.id, 10, 'Reading file...');

    // Read file content
    const fullPath = path.join(this.workspace.rootPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    this.updateTaskProgress(task.id, 30, 'Analyzing code...');

    // Prepare AI prompt for code analysis
    const prompt = this.buildCodeAnalysisPrompt(content, analysisType, filePath);

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const analysis = response.content[0]?.type === 'text' ? response.content[0].text : '';

    this.updateTaskProgress(task.id, 80, 'Generating report...');

    // Add to context
    if (task.contextId) {
      await ContextClient.addConversationEntry(task.contextId, 'user', prompt);
      await ContextClient.addConversationEntry(task.contextId, 'assistant', analysis);
      await ContextClient.addCodeSnippet(task.contextId, 'typescript', content, `Original code from ${filePath}`);
    }

    this.updateTaskProgress(task.id, 100, 'Analysis complete');

    return {
      filePath,
      analysisType,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }

  private async performCodeGeneration(task: Task): Promise<any> {
    const { prompt, language, framework } = task.data;
    
    this.updateTaskProgress(task.id, 10, 'Preparing code generation...');

    // Build enhanced prompt with context
    const enhancedPrompt = this.buildCodeGenerationPrompt(prompt, language, framework);

    this.updateTaskProgress(task.id, 30, 'Generating code...');

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      messages: [{ role: 'user', content: enhancedPrompt }],
    });

    const generatedCode = response.content[0]?.type === 'text' ? response.content[0].text : '';

    this.updateTaskProgress(task.id, 70, 'Validating generated code...');

    // Add to context
    if (task.contextId) {
      await ContextClient.addConversationEntry(task.contextId, 'user', enhancedPrompt);
      await ContextClient.addConversationEntry(task.contextId, 'assistant', generatedCode);
      await ContextClient.addCodeSnippet(task.contextId, language, generatedCode, 'Generated code');
    }

    this.updateTaskProgress(task.id, 100, 'Code generation complete');

    return {
      prompt,
      language,
      framework,
      generatedCode,
      timestamp: new Date().toISOString(),
    };
  }

  private async performFileOperations(task: Task): Promise<any> {
    const { operation, filePath, content, options } = task.data;
    const fullPath = path.join(this.workspace.rootPath, filePath);

    this.updateTaskProgress(task.id, 20, `Performing ${operation} operation...`);

    let result: any = {};

    switch (operation) {
      case 'create':
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
        result = { created: filePath };
        break;

      case 'read':
        result = { content: await fs.readFile(fullPath, 'utf-8') };
        break;

      case 'update':
        await fs.writeFile(fullPath, content);
        result = { updated: filePath };
        break;

      case 'delete':
        await fs.remove(fullPath);
        result = { deleted: filePath };
        break;

      case 'copy':
        const destPath = path.join(this.workspace.rootPath, options.destination);
        await fs.copy(fullPath, destPath);
        result = { copied: { from: filePath, to: options.destination } };
        break;

      case 'move':
        const newPath = path.join(this.workspace.rootPath, options.destination);
        await fs.move(fullPath, newPath);
        result = { moved: { from: filePath, to: options.destination } };
        break;

      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }

    this.updateTaskProgress(task.id, 100, 'File operation complete');

    return result;
  }

  private buildCodeAnalysisPrompt(content: string, analysisType: string, filePath: string): string {
    return `You are James, an expert TypeScript/Next.js development agent. Please analyze the following code:

File: ${filePath}
Analysis Type: ${analysisType}

Code:
\`\`\`typescript
${content}
\`\`\`

Please provide a comprehensive analysis focusing on:
1. Code quality and structure
2. Potential improvements
3. Security considerations
4. Performance optimizations
5. Best practices adherence
6. TypeScript/Next.js specific recommendations

Provide your analysis in a structured format with clear sections and actionable recommendations.`;
  }

  private buildCodeGenerationPrompt(prompt: string, language: string, framework: string): string {
    return `You are James, an expert ${framework} development agent specializing in ${language}. 

User Request: ${prompt}

Please generate high-quality code that follows these requirements:
1. Use TypeScript with strict type checking
2. Follow Next.js 14+ best practices
3. Use Drizzle ORM for database operations (never Prisma)
4. Wrap text with special characters in JSX with quotes and curly braces
5. Include proper error handling
6. Add TypeScript interfaces and types
7. Include JSDoc comments for complex functions
8. Follow the existing code style and patterns

Generate complete, production-ready code with proper imports and exports.`;
  }

  private updateTaskProgress(taskId: string, progress: number, message?: string): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.progress = progress;
      this.activeTasks.set(taskId, task);
    }

    // Send progress update to orchestrator
    MessageQueue.publishProgressUpdate(taskId, progress, message).catch(error => {
      logger.error('Failed to publish progress update:', { taskId, error });
    });

    logger.debug('Task progress updated', { taskId, progress, message });
  }

  private async completeTask(taskId: string, result: any): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.result = result;
    task.progress = 100;

    // Complete task context
    if (task.contextId) {
      await ContextClient.completeTaskContext(task.contextId, result);
    }

    // Send completion notification
    await MessageQueue.publishTaskResult(taskId, result, 'completed');

    this.activeTasks.delete(taskId);
    
    logger.info('Task completed', { taskId, type: task.type });
  }

  private async failTask(taskId: string, error: Error): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = error.message;

    // Fail task context
    if (task.contextId) {
      await ContextClient.failTaskContext(task.contextId, error);
    }

    // Send failure notification
    await MessageQueue.publishTaskResult(taskId, { error: error.message }, 'failed');

    this.activeTasks.delete(taskId);
    
    logger.error('Task failed', { taskId, type: task.type, error: error.message });
  }

  private async handleTaskCancellation(data: any): Promise<void> {
    const { taskId } = data;
    const task = this.activeTasks.get(taskId);
    
    if (task) {
      await this.failTask(taskId, new Error('Task cancelled by request'));
      logger.info('Task cancelled', { taskId });
    }
  }

  private async handleStatusRequest(data: any): Promise<void> {
    const status = {
      agentId: config.agentId,
      activeTasks: Array.from(this.activeTasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        startedAt: task.startedAt,
      })),
      workspace: {
        rootPath: this.workspace.rootPath,
        trackedFiles: this.workspace.trackedFiles.size,
        gitInitialized: this.workspace.gitInitialized,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Send status response (would need response routing)
    logger.info('Status requested', status);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await MessageQueue.sendHeartbeat();
      } catch (error) {
        logger.error('Heartbeat failed:', error);
      }
    }, config.health.heartbeatInterval);

    logger.info('Heartbeat started');
  }

  private startProgressReporting(): void {
    this.progressTimer = setInterval(() => {
      for (const task of this.activeTasks.values()) {
        if (task.status === 'in_progress') {
          // Auto-increment progress for long-running tasks
          if (task.progress < 90) {
            this.updateTaskProgress(task.id, task.progress + 1, 'Processing...');
          }
        }
      }
    }, config.tasks.progressReportInterval);

    logger.info('Progress reporting started');
  }

  // Placeholder methods for other task types
  private async performCodeReview(task: Task): Promise<any> {
    // Implementation would go here
    return { message: 'Code review not yet implemented' };
  }

  private async performDocumentationGeneration(task: Task): Promise<any> {
    // Implementation would go here
    return { message: 'Documentation generation not yet implemented' };
  }

  private async performRefactoring(task: Task): Promise<any> {
    // Implementation would go here
    return { message: 'Refactoring not yet implemented' };
  }

  private async performTesting(task: Task): Promise<any> {
    // Implementation would go here
    return { message: 'Testing not yet implemented' };
  }

  private async performGitOperations(task: Task): Promise<any> {
    // Implementation would go here
    return { message: 'Git operations not yet implemented' };
  }
}