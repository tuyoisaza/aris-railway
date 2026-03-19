-- Add language column to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en-US';
