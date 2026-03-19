
-- Add is_archived column if it doesn't exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);
