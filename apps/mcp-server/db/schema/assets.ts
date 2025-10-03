import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { users } from './users';

export const screenshots = pgTable('screenshots', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  filePath: text().notNull(),
  fileName: text().notNull(),
  mimeType: text().notNull(),
  fileSize: integer().notNull(),
  uploadedBy: integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
});

export const designAssets = pgTable('design_assets', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  filePath: text().notNull(),
  fileName: text().notNull(),
  mimeType: text().notNull(),
  fileSize: integer().notNull(),
  assetType: text().notNull(), // 'figma' | 'sketch' | 'image' | 'pdf'
  uploadedBy: integer()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  metadata: text(), // JSONB stored as text for type safety
  createdAt: timestamp().notNull().defaultNow(),
});

export type Screenshot = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;
export type DesignAsset = typeof designAssets.$inferSelect;
export type NewDesignAsset = typeof designAssets.$inferInsert;
