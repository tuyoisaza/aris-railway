-- Migration: Create actions table for dynamic action registry
-- This table stores action definitions that can be managed via Admin

CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,           -- e.g., 'skill', 'book_recommendation'
    name VARCHAR(100) NOT NULL,                 -- e.g., 'Create Skill', 'Recommend a Book'
    description TEXT,                           -- What this action does
    agent_id VARCHAR(50) NOT NULL,              -- Which agent executes it: 'lugh', 'daedalus', etc.
    weight VARCHAR(10) DEFAULT 'light',         -- 'light' (quick) or 'heavy' (complex)
    artifact_type VARCHAR(50),                  -- Chat artifact type if any: 'skill_card', 'book_card'
    result_route VARCHAR(100),                  -- URL pattern: '/skills/:id', '/topics/:id'
    enabled BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick slug lookup
CREATE INDEX IF NOT EXISTS idx_actions_slug ON actions(slug);

-- Seed existing actions
INSERT INTO actions (slug, name, description, agent_id, weight, result_route, enabled) VALUES
('conversation', 'Start Conversation', 'Start a guided conversation with ARIS using provided context.', 'teacher', 'light', '/conversation/:id', true),
('skill', 'Create Skill', 'Create a new skill path with AI-generated curriculum.', 'lugh', 'heavy', '/skills/:id', true),
('project', 'Create Project', 'Create a new project idea with AI architecture.', 'daedalus', 'heavy', '/projects/:id', true),
('topic', 'Create Topic', 'Create a new topic with domain classification and knowledge mapping.', 'cartographer', 'heavy', '/topic/:id', true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    agent_id = EXCLUDED.agent_id,
    weight = EXCLUDED.weight,
    result_route = EXCLUDED.result_route,
    updated_at = NOW();

-- RLS Policy: Anyone can read actions, only admins can modify
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actions are viewable by all authenticated users"
    ON actions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Actions are editable by admins only"
    ON actions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
