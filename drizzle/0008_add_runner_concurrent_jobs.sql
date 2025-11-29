-- Migration: Add max_concurrent_jobs column to runners table
-- Date: 2025-11-29
-- Description: Allows users to choose runner capacity (1, 2, 4, or 8 concurrent jobs)

ALTER TABLE "runners" ADD COLUMN IF NOT EXISTS "max_concurrent_jobs" integer DEFAULT 1 NOT NULL;

-- Update the drizzle meta journal
