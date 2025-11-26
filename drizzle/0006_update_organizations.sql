-- Migration: Update Organizations Schema
-- Adds missing fields to organizations table and fixes organization_invitations

-- ============================================================================
-- Update Organizations Table
-- ============================================================================

-- Add new fields to organizations table
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'personal';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscription_tier" text NOT NULL DEFAULT 'free';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscription_price" real NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "billing_email" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "settings" text; -- JSON string

-- ============================================================================
-- Update Organization Invitations Table
-- ============================================================================

-- Drop the old status index
DROP INDEX IF EXISTS "organization_invitations_status_idx";

-- Add acceptedAt column
ALTER TABLE "organization_invitations" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp;

-- Migrate existing data: if status = 'accepted', set acceptedAt to current timestamp
UPDATE "organization_invitations"
SET "accepted_at" = "created_at"
WHERE "status" = 'accepted';

-- Drop the status column
ALTER TABLE "organization_invitations" DROP COLUMN IF EXISTS "status";

-- ============================================================================
-- Notes
-- ============================================================================

-- Organizations table now supports:
-- - type: 'personal' or 'company'
-- - subscriptionTier: 'free', 'pro', or 'enterprise'
-- - subscriptionPrice: numeric value (must be >= 0)
-- - billingEmail: optional billing email address
-- - settings: JSON string for organization settings

-- Organization invitations now use acceptedAt timestamp:
-- - NULL = invitation pending
-- - Non-NULL = invitation accepted (timestamp of acceptance)
