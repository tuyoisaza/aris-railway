-- Add description column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Update the comments/docs if needed
COMMENT ON COLUMN users.description IS 'User bio or personal context for AI';
