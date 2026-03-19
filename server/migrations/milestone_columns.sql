-- Add type and metadata columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
