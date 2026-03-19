-- Add architecture and origin columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS architecture JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS origin TEXT;

-- Add checking constraints or indexes if needed later
-- For now, just the columns are sufficient
