import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userKeys = pgTable('user_keys', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text().notNull(), // 'github' | 'google' | 'password'
  providerUserId: text().notNull(),
  hashedPassword: text(), // Only for password provider
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  publicKey: text().notNull(), // Base64-encoded Ed25519 public key
  name: text().notNull(), // Human-readable name for the key
  lastUsedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  revokedAt: timestamp(),
});

export const auditLog = pgTable('audit_log', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => users.id, { onDelete: 'set null' }),
  action: text().notNull(),
  resourceType: text().notNull(),
  resourceId: text(),
  metadata: text(), // JSONB stored as text for type safety
  ipAddress: text(),
  userAgent: text(),
  timestamp: timestamp().notNull().defaultNow(),
});

export type UserKey = typeof userKeys.$inferSelect;
export type NewUserKey = typeof userKeys.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
