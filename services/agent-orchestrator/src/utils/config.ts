import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://sentra_user:sentra_dev_pass@localhost:5433/sentra',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://:sentra_dev_redis@localhost:6379',
    keyPrefix: 'sentra:orchestrator:',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
  },

  // Message Queue
  messageQueue: {
    url: process.env.RABBITMQ_URL || 'amqp://sentra:sentra_dev_rabbit@localhost:5672',
    exchange: 'sentra.orchestrator',
    reconnectDelay: parseInt(process.env.MQ_RECONNECT_DELAY || '5000'),
  },

  // Docker Configuration
  docker: {
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    networkName: process.env.DOCKER_NETWORK || 'sentra-network',
    agentImageRegistry: process.env.AGENT_IMAGE_REGISTRY || 'sentra',
    resourceLimits: {
      memory: process.env.AGENT_MEMORY_LIMIT || '512m',
      cpu: process.env.AGENT_CPU_LIMIT || '0.5',
      disk: process.env.AGENT_DISK_LIMIT || '1g',
    },
    healthCheckInterval: parseInt(process.env.DOCKER_HEALTH_CHECK_INTERVAL || '30000'),
  },

  // Agent Management
  agents: {
    maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '10'),
    defaultTimeout: parseInt(process.env.DEFAULT_AGENT_TIMEOUT || '300000'), // 5 minutes
    heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '10000'),
    startupTimeout: parseInt(process.env.AGENT_STARTUP_TIMEOUT || '60000'),
    shutdownTimeout: parseInt(process.env.AGENT_SHUTDOWN_TIMEOUT || '30000'),
  },

  // Task Management
  tasks: {
    maxQueueSize: parseInt(process.env.MAX_TASK_QUEUE_SIZE || '1000'),
    defaultPriority: process.env.DEFAULT_TASK_PRIORITY || 'medium',
    retryAttempts: parseInt(process.env.TASK_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.TASK_RETRY_DELAY || '5000'),
  },

  // Documentation Cache
  documentation: {
    refreshIntervalHours: parseInt(process.env.DOC_REFRESH_INTERVAL_HOURS || '24'),
    maxCacheSizeMB: parseInt(process.env.MAX_DOC_CACHE_MB || '500'),
    enablePatternExtraction: process.env.ENABLE_PATTERN_EXTRACTION !== 'false',
    sources: {
      nextjs: process.env.NEXTJS_DOC_URL || 'https://nextjs.org/docs',
      react: process.env.REACT_DOC_URL || 'https://react.dev',
      typescript: process.env.TYPESCRIPT_DOC_URL || 'https://www.typescriptlang.org/docs',
      nodejs: process.env.NODEJS_DOC_URL || 'https://nodejs.org/docs',
      drizzle: process.env.DRIZZLE_DOC_URL || 'https://orm.drizzle.team',
    },
  },

  // Quality Gates
  qualityGates: {
    enableStrictMode: process.env.ENABLE_STRICT_QUALITY_GATES === 'true',
    minimumTestCoverage: parseInt(process.env.MIN_TEST_COVERAGE || '80'),
    maximumComplexity: parseInt(process.env.MAX_COMPLEXITY || '10'),
    requireDocumentation: process.env.REQUIRE_DOCUMENTATION !== 'false',
    enforceCodeStyle: process.env.ENFORCE_CODE_STYLE !== 'false',
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Vault (for secrets)
  vault: {
    url: process.env.VAULT_URL || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN || 'sentra-dev-token',
    secretPath: process.env.VAULT_SECRET_PATH || 'sentra/agents',
  },

  // Context Engine
  contextEngine: {
    url: process.env.CONTEXT_ENGINE_URL || 'http://localhost:3002',
    timeout: parseInt(process.env.CONTEXT_ENGINE_TIMEOUT || '10000'),
  },

  // Monitoring
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9091'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
    enableFile: process.env.ENABLE_FILE_LOG === 'true',
    logFile: process.env.LOG_FILE || 'agent-orchestrator.log',
  },
};