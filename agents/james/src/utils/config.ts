import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  // Agent identification
  agentId: process.env.AGENT_ID || 'james-dev-agent',
  agentType: process.env.AGENT_TYPE || 'code_analyzer',
  
  // Server configuration
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Message Queue
  messageQueue: {
    url: process.env.RABBITMQ_URL || 'amqp://sentra:sentra_dev_rabbit@localhost:5672',
    exchange: 'sentra.agents',
    reconnectDelay: parseInt(process.env.MQ_RECONNECT_DELAY || '5000'),
  },

  // Context Engine
  contextEngine: {
    url: process.env.CONTEXT_ENGINE_URL || 'http://localhost:3002',
    timeout: parseInt(process.env.CONTEXT_ENGINE_TIMEOUT || '10000'),
  },

  // Anthropic AI
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
  },

  // Development environment
  development: {
    workspaceRoot: process.env.WORKSPACE_ROOT || '/tmp/james-workspace',
    gitConfig: {
      name: process.env.GIT_NAME || 'James Agent',
      email: process.env.GIT_EMAIL || 'james@sentra.ai',
    },
    enableFileWatching: process.env.ENABLE_FILE_WATCHING !== 'false',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '1048576'), // 1MB
    ignoredPatterns: [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      '.cache',
      'coverage',
      '*.log',
      '.env*',
    ],
  },

  // Context preservation
  context: {
    maxContextSizeMB: parseInt(process.env.MAX_CONTEXT_SIZE_MB || '50'),
    contextRetentionHours: parseInt(process.env.CONTEXT_RETENTION_HOURS || '24'),
    enableAutoSave: process.env.ENABLE_AUTO_SAVE !== 'false',
    autoSaveIntervalMinutes: parseInt(process.env.AUTO_SAVE_INTERVAL_MINUTES || '5'),
    snapshotOnTaskComplete: process.env.SNAPSHOT_ON_TASK_COMPLETE !== 'false',
  },

  // Task processing
  tasks: {
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '3'),
    taskTimeout: parseInt(process.env.TASK_TIMEOUT || '300000'), // 5 minutes
    enableProgressReporting: process.env.ENABLE_PROGRESS_REPORTING !== 'false',
    progressReportInterval: parseInt(process.env.PROGRESS_REPORT_INTERVAL || '30000'), // 30 seconds
  },

  // Quality controls
  quality: {
    enableLinting: process.env.ENABLE_LINTING !== 'false',
    enableTypeChecking: process.env.ENABLE_TYPE_CHECKING !== 'false',
    enableTesting: process.env.ENABLE_TESTING !== 'false',
    requireDocumentation: process.env.REQUIRE_DOCUMENTATION !== 'false',
    minTestCoverage: parseInt(process.env.MIN_TEST_COVERAGE || '80'),
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
    enableFile: process.env.ENABLE_FILE_LOG === 'true',
    logFile: process.env.LOG_FILE || 'james-agent.log',
  },

  // Health check
  health: {
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '15000'),
  },
};