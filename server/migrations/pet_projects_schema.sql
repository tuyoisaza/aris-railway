-- ============================================================
-- PET PROJECTS MIGRATION
-- ============================================================

-- 1. MODIFY PROJECTS TABLE
-- Add new columns and update existing ones to match Pet Projects spec

ALTER TABLE projects ADD COLUMN IF NOT EXISTS origin_topic_id TEXT REFERENCES topics(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('private', 'summary_shared', 'full_shared')) DEFAULT 'private';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS why_care TEXT; -- Renaming logic: New column, we can migrate data if needed or just use this
ALTER TABLE projects ADD COLUMN IF NOT EXISTS intent TEXT;    -- Renaming logic: New column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS support_notes JSONB DEFAULT '{}';

-- Update status check constraint if needed (existing: active, paused, completed. Spec: idea, active, paused, completed)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('idea', 'active', 'paused', 'completed', 'archived'));

-- 2. CREATE PROJECT ARTIFACTS TABLE
CREATE TABLE IF NOT EXISTS project_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('file', 'link', 'text', 'image')) NOT NULL,
    content TEXT, -- URL or text content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE PROJECT REFLECTIONS TABLE (Private by default, strictly owned)
CREATE TABLE IF NOT EXISTS project_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true, -- Redundant but explicit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE PROJECT COMMENTS TABLE (For parent supportive comments)
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Commenter
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ENABLE RLS
ALTER TABLE project_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
