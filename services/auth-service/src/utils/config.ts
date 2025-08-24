import { z } from 'zod';

const configSchema = z.object({
  environment: z.enum(['development', 'production', 'testing']),
  server: z.object({
    port: z.number().default(3005),
    host: z.string().default('0.0.0.0')
  }),
  database: z.object({
    url: z.string(),
    ssl: z.boolean().default(false),
    maxConnections: z.number().default(10)
  }),
  redis: z.object({
    url: z.string(),
    maxRetries: z.number().default(3),
    retryDelayOnFailover: z.number().default(100)
  }),
  jwt: z.object({
    secret: z.string().min(32),
    refreshSecret: z.string().min(32),
    accessTokenExpiry: z.string().default('15m'),
    refreshTokenExpiry: z.string().default('7d')
  }),
  encryption: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyDerivationIterations: z.number().default(100000),
    saltLength: z.number().default(32),
    ivLength: z.number().default(16)
  }),
  session: z.object({
    secret: z.string().min(32),
    maxAge: z.number().default(12 * 60 * 60 * 1000), // 12 hours
    secure: z.boolean().default(true),
    httpOnly: z.boolean().default(true),
    sameSite: z.enum(['strict', 'lax', 'none']).default('strict')
  }),
  mfa: z.object({
    issuer: z.string().default('SENTRA Platform'),
    digits: z.number().default(6),
    period: z.number().default(30),
    algorithm: z.string().default('SHA256'),
    window: z.number().default(2) // Allow ±2 time steps
  }),
  security: z.object({
    passwordMinLength: z.number().default(12),
    passwordRequireUppercase: z.boolean().default(true),
    passwordRequireLowercase: z.boolean().default(true),
    passwordRequireNumbers: z.boolean().default(true),
    passwordRequireSpecial: z.boolean().default(true),
    maxFailedAttempts: z.number().default(5),
    lockoutDuration: z.number().default(30 * 60 * 1000), // 30 minutes
    sessionTimeout: z.number().default(12 * 60 * 60 * 1000), // 12 hours
    requireEmailVerification: z.boolean().default(true),
    requireMfaForPrivilegedAccess: z.boolean().default(true)
  }),
  email: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    user: z.string().optional(),
    password: z.string().optional(),
    from: z.string().default('noreply@sentra.dev')
  }),
  cors: z.object({
    allowedOrigins: z.array(z.string()).default(['http://localhost:3000'])
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'text']).default('json')
  })
});

// Load and validate configuration
const createConfig = () => {
  const rawConfig = {
    environment: (process.env.NODE_ENV as any) || 'development',
    server: {
      port: parseInt(process.env.PORT || '3005', 10),
      host: process.env.HOST || '0.0.0.0'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://sentra_user:sentra_dev_pass@localhost:5432/sentra',
      ssl: process.env.DATABASE_SSL === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10)
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10)
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'sentra-dev-jwt-secret-change-in-production',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'sentra-dev-refresh-secret-change-in-production',
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    },
    encryption: {
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      keyDerivationIterations: parseInt(process.env.KEY_DERIVATION_ITERATIONS || '100000', 10),
      saltLength: parseInt(process.env.SALT_LENGTH || '32', 10),
      ivLength: parseInt(process.env.IV_LENGTH || '16', 10)
    },
    session: {
      secret: process.env.SESSION_SECRET || 'sentra-dev-session-secret-change-in-production',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '43200000', 10), // 12 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: (process.env.SESSION_SAME_SITE as any) || 'strict'
    },
    mfa: {
      issuer: process.env.MFA_ISSUER || 'SENTRA Platform',
      digits: parseInt(process.env.MFA_DIGITS || '6', 10),
      period: parseInt(process.env.MFA_PERIOD || '30', 10),
      algorithm: process.env.MFA_ALGORITHM || 'SHA256',
      window: parseInt(process.env.MFA_WINDOW || '2', 10)
    },
    security: {
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12', 10),
      passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1800000', 10), // 30 minutes
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '43200000', 10), // 12 hours
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
      requireMfaForPrivilegedAccess: process.env.REQUIRE_MFA_PRIVILEGED !== 'false'
    },
    email: {
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM || 'noreply@sentra.dev'
    },
    cors: {
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
        ? process.env.CORS_ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'https://sentra.dev']
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: (process.env.LOG_FORMAT as any) || 'json'
    }
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
};

export const config = createConfig();

// Type exports
export type Config = z.infer<typeof configSchema>;