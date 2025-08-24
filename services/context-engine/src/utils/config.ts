import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  port: parseInt(process.env.PORT || '3002'),
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
    keyPrefix: 'sentra:context:',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
  },

  // Message Queue
  messageQueue: {
    url: process.env.RABBITMQ_URL || 'amqp://sentra:sentra_dev_rabbit@localhost:5672',
    exchange: 'sentra.context',
    reconnectDelay: parseInt(process.env.MQ_RECONNECT_DELAY || '5000'),
  },

  // Context Engine Settings
  context: {
    // Never compact - use smart rotation instead
    maxHotContextSizeMB: parseInt(process.env.MAX_HOT_CONTEXT_MB || '100'),
    maxWarmContextSizeMB: parseInt(process.env.MAX_WARM_CONTEXT_MB || '500'),
    maxColdContextSizeMB: parseInt(process.env.MAX_COLD_CONTEXT_MB || '2000'),
    
    // Rotation thresholds
    hotToWarmThresholdHours: parseInt(process.env.HOT_TO_WARM_HOURS || '2'),
    warmToColdThresholdHours: parseInt(process.env.WARM_TO_COLD_HOURS || '24'),
    coldArchiveThresholdDays: parseInt(process.env.COLD_ARCHIVE_DAYS || '30'),
    
    // Compression settings
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    compressionAlgorithm: process.env.COMPRESSION_ALGORITHM || 'lz4',
    
    // Context injection settings
    maxContextInjectionSizeMB: parseInt(process.env.MAX_CONTEXT_INJECTION_MB || '50'),
    contextInjectionTimeoutMs: parseInt(process.env.CONTEXT_INJECTION_TIMEOUT || '5000'),
    
    // Snapshot settings
    enableSnapshots: process.env.ENABLE_SNAPSHOTS !== 'false',
    snapshotIntervalMinutes: parseInt(process.env.SNAPSHOT_INTERVAL_MINUTES || '15'),
    maxSnapshotsPerContext: parseInt(process.env.MAX_SNAPSHOTS_PER_CONTEXT || '10'),
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Vault (for sensitive context data)
  vault: {
    url: process.env.VAULT_URL || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN || 'sentra-dev-token',
    secretPath: process.env.VAULT_SECRET_PATH || 'sentra/context',
  },

  // Monitoring
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9093'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
    enableFile: process.env.ENABLE_FILE_LOG === 'true',
    logFile: process.env.LOG_FILE || 'context-engine.log',
  },
};