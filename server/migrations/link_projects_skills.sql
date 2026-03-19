-- Add skill_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES skills(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_skill_id ON projects(skill_id);
