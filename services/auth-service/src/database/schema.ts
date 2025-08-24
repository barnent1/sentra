import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  
  // Authentication
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  passwordHashAlgorithm: varchar('password_hash_algorithm', { length: 50 }).notNull().default('argon2id'),
  
  // Multi-factor authentication
  totpSecret: text('totp_secret'),
  totpBackupCodes: jsonb('totp_backup_codes').default([]),
  isMfaEnabled: boolean('is_mfa_enabled').default(false),
  mfaMethod: varchar('mfa_method', { length: 50 }),
  
  // Account status
  isActive: boolean('is_active').default(true),
  isEmailVerified: boolean('is_email_verified').default(false),
  isLocked: boolean('is_locked').default(false),
  lockReason: varchar('lock_reason', { length: 255 }),
  lockedAt: timestamp('locked_at'),
  lockedUntil: timestamp('locked_until'),
  
  // Failed login tracking
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lastFailedLoginAt: timestamp('last_failed_login_at'),
  lastSuccessfulLoginAt: timestamp('last_successful_login_at'),
  
  // Profile
  role: varchar('role', { length: 50 }).notNull().default('user'),
  permissions: jsonb('permissions').default([]),
  preferences: jsonb('preferences').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastPasswordChangeAt: timestamp('last_password_change_at'),
  
  // Security settings
  securitySettings: jsonb('security_settings').default({
    requirePasswordChange: false,
    sessionTimeout: 43200000, // 12 hours
    allowMultipleSessions: true,
    requireMfaForPrivilegedActions: true
  })
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  roleIdx: index('users_role_idx').on(table.role),
  activeIdx: index('users_active_idx').on(table.isActive),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt)
}));

// User sessions
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: text('session_token').notNull().unique(),
  refreshToken: text('refresh_token'),
  
  // Session metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 50 }),
  deviceFingerprint: text('device_fingerprint'),
  
  // Location data
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }),
  
  // Session status
  isActive: boolean('is_active').default(true),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Security flags
  isSuspicious: boolean('is_suspicious').default(false),
  suspiciousReason: varchar('suspicious_reason', { length: 255 }),
  
  // MFA verification
  mfaVerified: boolean('mfa_verified').default(false),
  mfaVerifiedAt: timestamp('mfa_verified_at')
}, (table) => ({
  userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
  sessionTokenIdx: uniqueIndex('user_sessions_token_idx').on(table.sessionToken),
  activeIdx: index('user_sessions_active_idx').on(table.isActive),
  expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt)
}));

// Authentication attempts
export const authAttempts = pgTable('auth_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Attempt details
  attemptType: varchar('attempt_type', { length: 50 }).notNull(), // login, password_reset, mfa_verify
  success: boolean('success').notNull(),
  failureReason: varchar('failure_reason', { length: 255 }),
  
  // Request metadata
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 100 }),
  
  // Risk assessment
  riskScore: integer('risk_score').default(0),
  riskFactors: jsonb('risk_factors').default([]),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // Additional data
  metadata: jsonb('metadata').default({})
}, (table) => ({
  emailIdx: index('auth_attempts_email_idx').on(table.email),
  userIdIdx: index('auth_attempts_user_id_idx').on(table.userId),
  ipAddressIdx: index('auth_attempts_ip_idx').on(table.ipAddress),
  createdAtIdx: index('auth_attempts_created_at_idx').on(table.createdAt),
  successIdx: index('auth_attempts_success_idx').on(table.success)
}));

// Email verification tokens
export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  token: text('token').notNull().unique(),
  
  // Token status
  isUsed: boolean('is_used').default(false),
  usedAt: timestamp('used_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Request metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent')
}, (table) => ({
  userIdIdx: index('email_verifications_user_id_idx').on(table.userId),
  tokenIdx: uniqueIndex('email_verifications_token_idx').on(table.token),
  expiresAtIdx: index('email_verifications_expires_at_idx').on(table.expiresAt)
}));

// Password reset tokens
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  token: text('token').notNull().unique(),
  
  // Token status
  isUsed: boolean('is_used').default(false),
  usedAt: timestamp('used_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Request metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent')
}, (table) => ({
  userIdIdx: index('password_resets_user_id_idx').on(table.userId),
  tokenIdx: uniqueIndex('password_resets_token_idx').on(table.token),
  expiresAtIdx: index('password_resets_expires_at_idx').on(table.expiresAt)
}));

// Security events
export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: uuid('session_id').references(() => userSessions.id, { onDelete: 'set null' }),
  
  // Event details
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventCategory: varchar('event_category', { length: 50 }).notNull(), // authentication, authorization, data_access, security_violation
  severity: varchar('severity', { length: 20 }).notNull(), // low, medium, high, critical
  
  // Event data
  description: text('description').notNull(),
  details: jsonb('details').default({}),
  
  // Request context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  endpoint: varchar('endpoint', { length: 255 }),
  method: varchar('method', { length: 10 }),
  
  // Risk assessment
  riskScore: integer('risk_score').default(0),
  riskFactors: jsonb('risk_factors').default([]),
  
  // Response actions
  actionsNeeded: jsonb('actions_needed').default([]),
  actionsTaken: jsonb('actions_taken').default([]),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // Investigation status
  status: varchar('status', { length: 50 }).default('open'), // open, investigating, resolved, false_positive
  investigatedBy: uuid('investigated_by').references(() => users.id),
  investigatedAt: timestamp('investigated_at'),
  resolution: text('resolution')
}, (table) => ({
  userIdIdx: index('security_events_user_id_idx').on(table.userId),
  eventTypeIdx: index('security_events_type_idx').on(table.eventType),
  severityIdx: index('security_events_severity_idx').on(table.severity),
  createdAtIdx: index('security_events_created_at_idx').on(table.createdAt),
  ipAddressIdx: index('security_events_ip_idx').on(table.ipAddress),
  statusIdx: index('security_events_status_idx').on(table.status)
}));

// API keys
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Key details
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: text('key_hash').notNull(), // Hashed version of the API key
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(), // First few characters for identification
  
  // Permissions and scope
  scopes: jsonb('scopes').notNull().default([]),
  permissions: jsonb('permissions').notNull().default([]),
  
  // Usage tracking
  lastUsedAt: timestamp('last_used_at'),
  usageCount: integer('usage_count').default(0),
  
  // Rate limiting
  rateLimit: integer('rate_limit').default(1000), // requests per hour
  rateLimitWindow: varchar('rate_limit_window', { length: 20 }).default('hour'),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  
  // Security
  allowedIps: jsonb('allowed_ips').default([]),
  allowedDomains: jsonb('allowed_domains').default([])
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
  keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(table.keyHash),
  activeIdx: index('api_keys_active_idx').on(table.isActive),
  expiresAtIdx: index('api_keys_expires_at_idx').on(table.expiresAt)
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type AuthAttempt = typeof authAttempts.$inferSelect;
export type NewAuthAttempt = typeof authAttempts.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;