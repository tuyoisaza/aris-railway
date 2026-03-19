-- ============================================================
-- Schema Migration: Add Stripe Columns to Users
-- ============================================================
-- Run this migration to add billing-related columns

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription 
ON users (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
