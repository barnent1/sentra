import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Agent identification
  agentId: process.env.AGENT_ID || 'mike-pm-agent',
  agentType: 'pm',
  agentName: 'Mike',

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
    keyPrefix: 'sentra:mike:',
  },

  // Message queue configuration
  messageQueue: {
    url: process.env.RABBITMQ_URL || 'amqp://sentra:sentra_dev_rabbit@localhost:5672',
    exchange: 'sentra.agents',
    queues: {
      tasks: 'mike.tasks',
      events: 'mike.events',
      system: 'system.events',
    },
  },

  // Context Engine configuration
  contextEngine: {
    url: process.env.CONTEXT_ENGINE_URL || 'http://localhost:3002',
    timeout: 30000,
  },

  // Email configuration for client communication
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  },

  // Project management specific configuration
  projectManagement: {
    // Default estimation parameters
    defaultVelocity: 25, // story points per sprint
    sprintLengthWeeks: 2,
    hoursPerStoryPoint: 4,
    
    // Timeline intelligence settings
    enableTimelineLearning: true,
    predictionConfidenceThreshold: 0.7,
    historicalDataMinimum: 5, // minimum completed tasks for learning
    
    // Communication settings
    enableAutomatedReporting: true,
    dailyStatusTime: '09:00',
    weeklyReportDay: 5, // Friday
    monthlyReportDay: 1, // 1st of month
    
    // Risk management
    riskAssessmentFrequency: 3, // days
    criticalRiskEscalation: true,
    riskThresholds: {
      probability: 0.7,
      impact: 0.8,
    },
    
    // Story management
    maxStoriesInSprint: 15,
    maxStoryPoints: 13,
    complexityFactors: {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.5,
      very_complex: 2.2,
    },
  },

  // Task configuration
  tasks: {
    taskTimeout: parseInt(process.env.TASK_TIMEOUT || '600000', 10), // 10 minutes
    enableProgressReporting: process.env.ENABLE_PROGRESS_REPORTING === 'true',
    progressReportInterval: parseInt(process.env.PROGRESS_REPORT_INTERVAL || '10000', 10),
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '5', 10),
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
    filename: process.env.LOG_FILENAME || 'logs/mike-agent.log',
  },

  // Development configuration
  development: {
    workspaceRoot: process.env.WORKSPACE_ROOT || '/workspace',
    enableHotReload: process.env.ENABLE_HOT_RELOAD === 'true',
    debugMode: process.env.NODE_ENV === 'development',
  },

  // Timezone configuration
  timezone: process.env.TZ || 'UTC',
};

// Validation
if (!config.anthropic.apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required for Mike PM Agent');
}

export default config;