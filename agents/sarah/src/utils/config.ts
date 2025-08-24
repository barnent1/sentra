import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Agent identification
  agentId: process.env.AGENT_ID || 'sarah-qa-agent',
  agentType: 'qa',
  agentName: 'Sarah',

  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || '0.0.0.0',
  },

  // Anthropic AI configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000', 10),
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://sentra_user:sentra_dev_pass@localhost:5433/sentra',
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://:sentra_dev_redis@localhost:6379',
    keyPrefix: 'sentra:sarah:',
  },

  // Message queue configuration
  messageQueue: {
    url: process.env.RABBITMQ_URL || 'amqp://sentra:sentra_dev_rabbit@localhost:5672',
    exchange: 'sentra.agents',
    queues: {
      tasks: 'sarah.tasks',
      events: 'sarah.events',
      system: 'system.events',
    },
  },

  // Context Engine configuration
  contextEngine: {
    url: process.env.CONTEXT_ENGINE_URL || 'http://localhost:3002',
    timeout: 30000,
  },

  // Quality assurance specific configuration
  qualityAssurance: {
    // Sarah's zero-tolerance standards
    minimumQualityScore: 0.8,
    criticalIssuesThreshold: 0, // Zero tolerance for critical issues
    highIssuesThreshold: 2,
    mediumIssuesThreshold: 10,
    
    // Code complexity thresholds
    maxCyclomaticComplexity: 10,
    maxCognitiveComplexity: 15,
    maxLinesPerFunction: 50,
    maxFunctionParameters: 5,
    
    // Test coverage requirements
    minimumTestCoverage: 80,
    
    // Security standards
    enableSecurityScan: true,
    securityVulnerabilityThreshold: 0, // Zero tolerance
    
    // Performance standards
    enablePerformanceAnalysis: true,
    performanceIssueThreshold: 2,
    
    // TypeScript strictness
    enforceStrictTypeScript: true,
    allowAnyType: false,
    allowTsIgnore: false,
    
    // Architecture enforcement
    forbiddenPackages: ['prisma', '@prisma/client'],
    requiredPackages: ['drizzle-orm'],
    
    // Code style enforcement
    enforceJsxTextWrapping: true,
    enforceConsistentNaming: true,
  },

  // Task configuration
  tasks: {
    taskTimeout: parseInt(process.env.TASK_TIMEOUT || '600000', 10), // 10 minutes
    enableProgressReporting: process.env.ENABLE_PROGRESS_REPORTING === 'true',
    progressReportInterval: parseInt(process.env.PROGRESS_REPORT_INTERVAL || '5000', 10),
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '3', 10),
  },

  // Health monitoring
  health: {
    heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10),
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
    filename: process.env.LOG_FILENAME || 'logs/sarah-agent.log',
  },

  // Development configuration
  development: {
    workspaceRoot: process.env.WORKSPACE_ROOT || '/workspace',
    enableHotReload: process.env.ENABLE_HOT_RELOAD === 'true',
    debugMode: process.env.NODE_ENV === 'development',
  },
};

// Validation
if (!config.anthropic.apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required for Sarah QA Agent');
}

export default config;