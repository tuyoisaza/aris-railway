-- ============================================================
-- DATABASE HARDENING
-- ============================================================
-- Purpose: Add performance indexes and enforce foreign key integrity.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1. PERFORMANCE INDEXES
-- Speed up permission checks (RLS often filters by user_id/family_id)
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_invitations_family ON invitations(family_id);

-- Speed up chat loading
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- Speed up project retrieval
CREATE INDEX IF NOT EXISTS idx_project_artifacts_project ON project_artifacts(project_id);

-- 2. INTEGRITY CONSTRAINTS (Cascading Deletes)
-- Ensure that deleting a parent record automatically cleans up children.
-- Note: You may need to drop existing constraints first if they lack CASCADE.
-- The below commands try to ADD constraints. If they exist without CASCADE, 
-- you might need to manually DROP them first in the dashboard.

-- Messages -> Conversations
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey,
ADD CONSTRAINT messages_conversation_id_fkey
    FOREIGN KEY (conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE;

-- Project Artifacts -> Projects
ALTER TABLE project_artifacts
DROP CONSTRAINT IF EXISTS project_artifacts_project_id_fkey,
ADD CONSTRAINT project_artifacts_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE;

-- Project Reflections -> Projects
ALTER TABLE project_reflections
DROP CONSTRAINT IF EXISTS project_reflections_project_id_fkey,
ADD CONSTRAINT project_reflections_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE;

-- Project Comments -> Projects
ALTER TABLE project_comments
DROP CONSTRAINT IF EXISTS project_comments_project_id_fkey,
ADD CONSTRAINT project_comments_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE;

-- User Badges -> Users (If user is deleted, remove their badges)
ALTER TABLE user_badges
DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey,
ADD CONSTRAINT user_badges_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
