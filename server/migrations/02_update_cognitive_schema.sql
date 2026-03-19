-- Migration: 02_update_cognitive_schema
-- Purpose: Add missing columns to 'topics' table for Cartographer agent

-- Add user_id to topics (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'user_id') THEN
        ALTER TABLE topics ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add conversation_id to topics (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'conversation_id') THEN
        ALTER TABLE topics ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add custom fields
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'relevance') THEN
        ALTER TABLE topics ADD COLUMN relevance FLOAT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'status') THEN
        ALTER TABLE topics ADD COLUMN status TEXT DEFAULT 'identified';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'updated_at') THEN
        ALTER TABLE topics ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add Unique Constraint for Upsert
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'topics_conversation_id_title_key') THEN
        ALTER TABLE topics ADD CONSTRAINT topics_conversation_id_title_key UNIQUE (conversation_id, title);
    END IF;
END $$;
