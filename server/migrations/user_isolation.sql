-- Migration: Add User Isolation to Topics and Skills
-- 1. Add user_id column to topics
ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 2. Add user_id column to skills
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. ADOPTION: Assign all existing orphaned topics/skills to the first found Admin user
-- This ensures the current "Admin" doesn't lose their data
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Find the first user (assume it's the admin/creator)
    SELECT id INTO admin_id FROM users ORDER BY created_at ASC LIMIT 1;

    IF admin_id IS NOT NULL THEN
        -- Adopt Topics
        UPDATE topics SET user_id = admin_id WHERE user_id IS NULL;
        
        -- Adopt Skills
        UPDATE skills SET user_id = admin_id WHERE user_id IS NULL;
        
        RAISE NOTICE 'Adopted orphans to user %', admin_id;
    END IF;
END $$;

-- 4. Enable RLS (Already enabled, but we update policies)
-- Drop old permissive policies
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON skills;
DROP POLICY IF EXISTS "Edges are viewable by everyone" ON skill_edges;
-- Topics might not have had RLS fully configured, let's ensure.
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- 5. Create New Policies

-- TOPICS POLICIES
DROP POLICY IF EXISTS "Users can view own topics" ON topics;
CREATE POLICY "Users can view own topics" ON topics 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own topics" ON topics;
CREATE POLICY "Users can insert own topics" ON topics 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own topics" ON topics;
CREATE POLICY "Users can update own topics" ON topics 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own topics" ON topics;
CREATE POLICY "Users can delete own topics" ON topics 
    FOR DELETE USING (auth.uid() = user_id);

-- SKILLS POLICIES
DROP POLICY IF EXISTS "Users can view own skills" ON skills;
CREATE POLICY "Users can view own skills" ON skills 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skills" ON skills;
CREATE POLICY "Users can insert own skills" ON skills 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skills" ON skills;
CREATE POLICY "Users can update own skills" ON skills 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skills" ON skills;
CREATE POLICY "Users can delete own skills" ON skills 
    FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
