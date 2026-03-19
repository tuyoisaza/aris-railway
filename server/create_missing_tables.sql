-- ============================================================
-- Aris - Create Missing Tables
-- ============================================================
-- Run this script first if you get "relation does not exist" errors
-- NOTE: topics.id is TEXT type in your existing schema
-- ============================================================

-- RESOURCES TABLE (for Books, Papers, Videos, etc.)
-- Uses TEXT for topic_id to match existing topics table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('Book', 'Paper', 'Video', 'Interactable', 'Web')),
    url TEXT,
    view_status TEXT CHECK (view_status IN ('Locked', 'Available', 'Completed')) DEFAULT 'Locked',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_TOPIC_PROGRESS TABLE
-- Uses TEXT for topic_id to match existing topics table
CREATE TABLE IF NOT EXISTS user_topic_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    current_depth INTEGER DEFAULT 1,
    engagement_score INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

-- Add stripe columns to users if not present
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Reload schema
NOTIFY pgrst, 'reload config';
