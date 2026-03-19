-- Add unique constraint for project titles per user to prevent exact duplicates
-- This fixes the duplication issue where multiple project proposals create the same project

-- First, clean up existing exact duplicates (keep first one)
WITH duplicates AS (
    SELECT 
        id,
        user_id,
        LOWER(TRIM(title)) as normalized_title,
        ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(TRIM(title)) ORDER BY created_at ASC) as rn
    FROM projects
),
to_delete AS (
    SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM projects WHERE id IN (SELECT id FROM to_delete);

-- Add unique constraint on normalized titles per user
ALTER TABLE projects 
ADD CONSTRAINT unique_project_title_per_user 
UNIQUE (user_id, lower(trim(title)));

-- Add index for better performance
CREATE INDEX idx_projects_user_normalized_title ON projects (user_id, lower(trim(title)));

-- Add comment to document the constraint
COMMENT ON CONSTRAINT unique_project_title_per_user ON projects IS 'Prevents exact duplicate project titles per user';