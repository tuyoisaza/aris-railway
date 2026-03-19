-- ============================================================
-- Aris Production RLS Policies (Fixed Recursion)
-- ============================================================
-- Apply this script to fix "Infinite recursion" errors.
-- It introduces SECURITY DEFINER functions to safely query membership.
-- ============================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (Break Recursion)
-- ============================================================
-- Function to get all family IDs a user belongs to
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid();
$$;

-- Function to check if user is a Parent in a specific family
CREATE OR REPLACE FUNCTION is_parent_in_family(lookup_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = lookup_family_id 
    AND user_id = auth.uid() 
    AND role = 'Parent'
  );
$$;

-- Function to check if current user is a Parent of a specific user
CREATE OR REPLACE FUNCTION is_parent_of_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members parent_fm
    JOIN family_members child_fm ON parent_fm.family_id = child_fm.family_id
    WHERE parent_fm.user_id = auth.uid()
    AND parent_fm.role = 'Parent'
    AND child_fm.user_id = target_user_id
    -- AND child_fm.role = 'Child' -- Optional: strict role check or just family association
  );
$$;

-- ============================================================
-- USERS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- FAMILIES TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can view families they belong to" ON families;
DROP POLICY IF EXISTS "Parents can update their family" ON families;
DROP POLICY IF EXISTS "Service role can insert families" ON families;

CREATE POLICY "Users can view families they belong to" ON families
    FOR SELECT USING (
        id IN (SELECT get_my_family_ids())
    );

CREATE POLICY "Parents can update their family" ON families
    FOR UPDATE USING (
        is_parent_in_family(id)
    );

CREATE POLICY "Service role can insert families" ON families
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- FAMILY_MEMBERS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Users can view family members in their family" ON family_members;
DROP POLICY IF EXISTS "Parents can insert family members" ON family_members;
DROP POLICY IF EXISTS "Parents can update family members" ON family_members;
DROP POLICY IF EXISTS "Parents can remove family members" ON family_members;

-- FIX: Use get_my_family_ids to avoid recursion on family_members lookup
CREATE POLICY "Users can view family members in their family" ON family_members
    FOR SELECT USING (
        family_id IN (SELECT get_my_family_ids())
    );

CREATE POLICY "Parents can insert family members" ON family_members
    FOR INSERT WITH CHECK (
        is_parent_in_family(family_id)
        OR auth.uid() = user_id -- Allow self-join (if invite logic allows)
    );

CREATE POLICY "Parents can update family members" ON family_members
    FOR UPDATE USING (
        is_parent_in_family(family_id)
    );

CREATE POLICY "Parents can remove family members" ON family_members
    FOR DELETE USING (
        is_parent_in_family(family_id)
    );

-- ============================================================
-- INVITATIONS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Parents can view invitations for their family" ON invitations;
DROP POLICY IF EXISTS "Parents can create invitations" ON invitations;
DROP POLICY IF EXISTS "Parents can delete invitations" ON invitations;

CREATE POLICY "Parents can view invitations for their family" ON invitations
    FOR SELECT USING (
        is_parent_in_family(family_id)
    );

CREATE POLICY "Parents can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        is_parent_in_family(family_id)
    );

CREATE POLICY "Parents can delete invitations" ON invitations
    FOR DELETE USING (
        is_parent_in_family(family_id)
    );

-- ============================================================
-- TOPICS TABLE (Public read)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view topics" ON topics;

CREATE POLICY "Anyone can view topics" ON topics
    FOR SELECT USING (true);

-- ============================================================
-- PROJECTS, CONVERSATIONS, MESSAGES (Unchanged)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (
        auth.uid() = user_id 
        OR is_parent_of_user(user_id) -- Parents can view project metadata (status/title)
    );

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (
        auth.uid() = user_id 
        -- Parents cannot update projects (read-only)
    );

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PET PROJECTS ARTIFACTS, REFLECTIONS, COMMENTS
-- ============================================================

-- Helper to check ownership securely (bypassing RLS on projects table if needed)
CREATE OR REPLACE FUNCTION check_is_project_owner(check_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = check_project_id
    AND user_id = auth.uid()
  );
$$;

-- ARTIFACTS
DROP POLICY IF EXISTS "View Artifacts" ON project_artifacts;
CREATE POLICY "View Artifacts" ON project_artifacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_artifacts.project_id
            AND (
                projects.user_id = auth.uid()
                OR (
                    is_parent_of_user(projects.user_id)
                    AND projects.visibility = 'full_shared'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Manage Artifacts" ON project_artifacts;
CREATE POLICY "Manage Artifacts" ON project_artifacts
    FOR ALL USING (
        check_is_project_owner(project_id)
    );

-- REFLECTIONS (Strictly Private)
DROP POLICY IF EXISTS "View Reflections" ON project_reflections;
CREATE POLICY "View Reflections" ON project_reflections
    FOR SELECT USING (
        check_is_project_owner(project_id)
    );

DROP POLICY IF EXISTS "Manage Reflections" ON project_reflections;
CREATE POLICY "Manage Reflections" ON project_reflections
    FOR ALL USING (
        check_is_project_owner(project_id)
    );

-- COMMENTS
DROP POLICY IF EXISTS "View Comments" ON project_comments;
CREATE POLICY "View Comments" ON project_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_comments.project_id
            AND (
                projects.user_id = auth.uid()
                OR is_parent_of_user(projects.user_id)
            )
        )
    );

DROP POLICY IF EXISTS "Insert Comments" ON project_comments;
CREATE POLICY "Insert Comments" ON project_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_comments.project_id
            AND (
                projects.user_id = auth.uid()
                OR is_parent_of_user(projects.user_id)
            )
        )
    );

-- Conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Messages (Linked to conversation)
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );
-- Note: Messages policy accesses Conversations. Non-recursive. Safe.

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- ============================================================
-- USER TOPIC PROGRESS
-- ============================================================
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View Topic Progress" ON user_topic_progress;
CREATE POLICY "View Topic Progress" ON user_topic_progress
    FOR SELECT USING (
        auth.uid() = user_id
        OR is_parent_of_user(user_id)
    );

DROP POLICY IF EXISTS "Update Topic Progress" ON user_topic_progress;
CREATE POLICY "Update Topic Progress" ON user_topic_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modify Topic Progress" ON user_topic_progress;
CREATE POLICY "Modify Topic Progress" ON user_topic_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- RELOAD SCHEMA
-- ============================================================
NOTIFY pgrst, 'reload config';
