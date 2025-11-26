-- Migration: Add Organizations and Multi-Tenancy Support
-- This migration adds organization, team, and invitation tables,
-- and updates existing tables to support multi-tenancy.

-- ============================================================================
-- Create Organization Tables
-- ============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Organization Members (junction table with role)
CREATE TABLE IF NOT EXISTS "organization_members" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text NOT NULL, -- owner, admin, member
  "invited_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "joined_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("org_id", "user_id")
);

-- Teams table
CREATE TABLE IF NOT EXISTS "teams" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Team Members (junction table with role)
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text NOT NULL, -- lead, member
  "joined_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("team_id", "user_id")
);

-- Organization Invitations table
CREATE TABLE IF NOT EXISTS "organization_invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text NOT NULL, -- admin, member
  "invited_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- Create Indexes for Organization Tables
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");
CREATE INDEX IF NOT EXISTS "organization_members_org_id_idx" ON "organization_members" ("org_id");
CREATE INDEX IF NOT EXISTS "organization_members_user_id_idx" ON "organization_members" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_org_user_idx" ON "organization_members" ("org_id", "user_id");
CREATE INDEX IF NOT EXISTS "teams_org_id_idx" ON "teams" ("org_id");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_user_idx" ON "team_members" ("team_id", "user_id");
CREATE INDEX IF NOT EXISTS "organization_invitations_org_id_idx" ON "organization_invitations" ("org_id");
CREATE INDEX IF NOT EXISTS "organization_invitations_email_idx" ON "organization_invitations" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "organization_invitations_token_idx" ON "organization_invitations" ("token");
CREATE INDEX IF NOT EXISTS "organization_invitations_status_idx" ON "organization_invitations" ("status");

-- ============================================================================
-- Alter Existing Tables to Add Organization Support
-- ============================================================================

-- Add organization columns to projects table
-- Note: We'll make orgId nullable first for migration, then make it required after data migration
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "org_id" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "team_id" text REFERENCES "teams"("id") ON DELETE SET NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "visibility" text NOT NULL DEFAULT 'private';

-- Add foreign key constraint for org_id (initially nullable for migration)
-- Projects will need to be migrated to have an org_id before making it NOT NULL

-- Add organization columns to agents table
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "org_id" text;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "triggered_by" text;

-- Add organization and user columns to costs table
ALTER TABLE "costs" ADD COLUMN IF NOT EXISTS "org_id" text;
ALTER TABLE "costs" ADD COLUMN IF NOT EXISTS "user_id" text;

-- Add organization and user columns to activities table
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "org_id" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "user_id" text;

-- ============================================================================
-- Create Indexes for Updated Tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS "projects_org_id_idx" ON "projects" ("org_id");
CREATE INDEX IF NOT EXISTS "projects_team_id_idx" ON "projects" ("team_id");
CREATE INDEX IF NOT EXISTS "agents_org_id_idx" ON "agents" ("org_id");
CREATE INDEX IF NOT EXISTS "costs_org_id_idx" ON "costs" ("org_id");
CREATE INDEX IF NOT EXISTS "costs_user_id_idx" ON "costs" ("user_id");
CREATE INDEX IF NOT EXISTS "activities_org_id_idx" ON "activities" ("org_id");
CREATE INDEX IF NOT EXISTS "activities_user_id_idx" ON "activities" ("user_id");

-- ============================================================================
-- Data Migration (Optional)
-- ============================================================================

-- IMPORTANT: After running this migration, you need to:
-- 1. Create a default organization for each user
-- 2. Migrate existing projects to belong to that organization
-- 3. Update agents, costs, and activities to reference the organization
-- 4. Then run the following to enforce constraints:
--
-- ALTER TABLE "projects" ALTER COLUMN "org_id" SET NOT NULL;
-- ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fk"
--   FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
--
-- ALTER TABLE "agents" ALTER COLUMN "org_id" SET NOT NULL;
-- ALTER TABLE "agents" ALTER COLUMN "triggered_by" SET NOT NULL;
-- ALTER TABLE "agents" ADD CONSTRAINT "agents_org_id_fk"
--   FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
-- ALTER TABLE "agents" ADD CONSTRAINT "agents_triggered_by_fk"
--   FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE CASCADE;
--
-- ALTER TABLE "costs" ALTER COLUMN "org_id" SET NOT NULL;
-- ALTER TABLE "costs" ALTER COLUMN "user_id" SET NOT NULL;
-- ALTER TABLE "costs" ADD CONSTRAINT "costs_org_id_fk"
--   FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
-- ALTER TABLE "costs" ADD CONSTRAINT "costs_user_id_fk"
--   FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--
-- ALTER TABLE "activities" ALTER COLUMN "org_id" SET NOT NULL;
-- ALTER TABLE "activities" ALTER COLUMN "user_id" SET NOT NULL;
-- ALTER TABLE "activities" ADD CONSTRAINT "activities_org_id_fk"
--   FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
-- ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fk"
--   FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- ============================================================================
-- Notes
-- ============================================================================

-- This migration supports the following organization model:
-- - Organizations contain multiple members with roles (owner, admin, member)
-- - Organizations can have teams for grouping members
-- - Projects belong to an organization and optionally to a team
-- - Projects have visibility levels (private, team, organization)
-- - All costs and activities are tracked at the organization level
-- - Agents track who triggered them for audit purposes
