-- 1. Create topic_events table
CREATE TABLE IF NOT EXISTS topic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    topic_name TEXT NOT NULL,
    domain TEXT,
    region TEXT,
    weight INTEGER DEFAULT 1,
    xp_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on topic_events
ALTER TABLE topic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topic events" ON topic_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert topic events" ON topic_events
    FOR INSERT WITH CHECK (true); -- Assuming service role usage, or restricted to user

-- 2. Update badges table for Domain/Region mapping
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'domain') THEN
        ALTER TABLE badges ADD COLUMN domain TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'region') THEN
        ALTER TABLE badges ADD COLUMN region TEXT; -- This makes the badge "The Region Badge"
    END IF;
END $$;

-- 3. Update user_badges table for XP and Levels, with history tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'xp') THEN
        ALTER TABLE user_badges ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'level') THEN
        ALTER TABLE user_badges ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'last_active') THEN
        ALTER TABLE user_badges ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    -- Focus score for decay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'focus_score') THEN
        ALTER TABLE user_badges ADD COLUMN focus_score INTEGER DEFAULT 100;
    END IF;
END $$;
