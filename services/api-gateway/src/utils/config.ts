import dotenv from 'dotenv';

dotenv.config();

interface Config {
    nodeEnv: string;
    port: number;
    
    // Database
    database: {
        url: string;
        poolSize: number;
    };
    
    // Redis
    redis: {
        url: string;
        password: string;
    };
    
    // JWT
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    
    // CORS
    cors: {
        origins: string[];
    };
    
    // Rate limiting
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
    };
    
    // WebSocket
    websocket: {
        port: number;
    };
    
    // Services
    services: {
        agentOrchestrator: {
            port: number;
            url: string;
        };
        contextEngine: {
            port: number;
            url: string;
        };
        qualityGuardian: {
            port: number;
            url: string;
        };
        timelineIntelligence: {
            port: number;
            url: string;
        };
        authService: {
            port: number;
            url: string;
        };
    };
    
    // Vault
    vault: {
        url: string;
        token: string;
    };
    
    // Logging
    logging: {
        level: string;
        format: string;
    };
    
    // Security
    security: {
        encryptionKey: string;
        hmacSecret: string;
    };
    
    // File upload
    fileUpload: {
        maxSize: number;
        allowedTypes: string[];
    };
}

export const config: Config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    
    database: {
        url: process.env.DATABASE_URL || 'postgresql://sentra_user:sentra_dev_pass@localhost:5432/sentra',
        poolSize: parseInt(process.env.CONNECTION_POOL_SIZE || '20', 10),
    },
    
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || '',
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'sentra-dev-jwt-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    
    cors: {
        origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    },
    
    rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    
    websocket: {
        port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
    },
    
    services: {
        agentOrchestrator: {
            port: parseInt(process.env.AGENT_ORCHESTRATOR_PORT || '3001', 10),
            url: process.env.AGENT_ORCHESTRATOR_URL || 'http://agent-orchestrator:3001',
        },
        contextEngine: {
            port: parseInt(process.env.CONTEXT_ENGINE_PORT || '3002', 10),
            url: process.env.CONTEXT_ENGINE_URL || 'http://context-engine:3002',
        },
        qualityGuardian: {
            port: parseInt(process.env.QUALITY_GUARDIAN_PORT || '3003', 10),
            url: process.env.QUALITY_GUARDIAN_URL || 'http://quality-guardian:3003',
        },
        timelineIntelligence: {
            port: parseInt(process.env.TIMELINE_INTELLIGENCE_PORT || '3004', 10),
            url: process.env.TIMELINE_INTELLIGENCE_URL || 'http://timeline-intelligence:3004',
        },
        authService: {
            port: parseInt(process.env.AUTH_SERVICE_PORT || '3005', 10),
            url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3005',
        },
    },
    
    vault: {
        url: process.env.VAULT_URL || 'http://localhost:8200',
        token: process.env.VAULT_TOKEN || 'sentra-dev-token',
    },
    
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
    
    security: {
        encryptionKey: process.env.ENCRYPTION_KEY || 'sentra_encryption_dev_key_32_chars',
        hmacSecret: process.env.HMAC_SECRET || 'sentra_hmac_dev_secret_key',
    },
    
    fileUpload: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
        allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'h'
        ],
    },
};

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}