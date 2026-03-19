-- Add pin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin TEXT;
