-- Migration: Add Database Constraints
-- Adds CHECK constraints for enums and validation rules

-- ============================================================================
-- Add CHECK Constraints to Organizations Table
-- ============================================================================

-- Validate organization type
ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_type_check"
CHECK ("type" IN ('personal', 'company'));

-- Validate subscription tier
ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_subscription_tier_check"
CHECK ("subscription_tier" IN ('free', 'pro', 'enterprise'));

-- Validate subscription price (must be >= 0)
ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_subscription_price_check"
CHECK ("subscription_price" >= 0);

-- Validate name is not empty string
ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_name_not_empty_check"
CHECK (LENGTH(TRIM("name")) > 0);

-- ============================================================================
-- Add CHECK Constraints to Organization Members Table
-- ============================================================================

-- Validate role enum (owner, admin, member, viewer)
ALTER TABLE "organization_members"
ADD CONSTRAINT "organization_members_role_check"
CHECK ("role" IN ('owner', 'admin', 'member', 'viewer'));

-- ============================================================================
-- Add CHECK Constraints to Team Members Table
-- ============================================================================

-- Validate role enum (lead, member)
ALTER TABLE "team_members"
ADD CONSTRAINT "team_members_role_check"
CHECK ("role" IN ('lead', 'member'));

-- ============================================================================
-- Add CHECK Constraints to Organization Invitations Table
-- ============================================================================

-- Validate role enum (admin, member, viewer)
ALTER TABLE "organization_invitations"
ADD CONSTRAINT "organization_invitations_role_check"
CHECK ("role" IN ('admin', 'member', 'viewer'));

-- ============================================================================
-- Notes
-- ============================================================================

-- These CHECK constraints enforce validation at the database level:
-- - Enum values for type, subscriptionTier, and role fields
-- - Non-negative subscription prices
-- - Non-empty organization names
--
-- This ensures data integrity even if application-level validation fails.
