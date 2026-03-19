-- Add content column to skills table
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;
