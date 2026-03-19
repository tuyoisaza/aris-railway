-- Migration: personalize_topic_content
-- Purpose: Add columns to user_topic_progress to store personalized content per user

CREATE TABLE IF NOT EXISTS user_topic_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    engagement FLOAT DEFAULT 0,
    depth INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_topic_progress' AND column_name = 'initial_intent') THEN
        ALTER TABLE user_topic_progress ADD COLUMN initial_intent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_topic_progress' AND column_name = 'personalized_content') THEN
        ALTER TABLE user_topic_progress ADD COLUMN personalized_content JSONB;
    END IF;
END $$;
