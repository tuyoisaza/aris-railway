-- Create Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'Award',
    trigger_type TEXT NOT NULL, 
    trigger_condition JSONB NOT NULL DEFAULT '{}',
    message_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public Read Badges (Anyone can see what badges exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'badges' AND policyname = 'Public Read Badges'
    ) THEN
        CREATE POLICY "Public Read Badges" ON badges FOR SELECT USING (true);
    END IF;
END $$;

-- 2. User Read Own Badges
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'User Read Own Badges'
    ) THEN
        CREATE POLICY "User Read Own Badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Seed Initial Badge (Topic Fatigue)
INSERT INTO badges (name, description, icon, trigger_type, trigger_condition, message_template)
VALUES (
    'Topic Fatigue', 
    'Warns user after 15 interactions in a single topic/conversation.', 
    'AlertTriangle', 
    'interaction_count', 
    '{"count": 15}', 
    'You''ve reached 15 interactions. It might be time to consolidate knowledge or take a break.'
)
ON CONFLICT (name) DO UPDATE SET 
    trigger_condition = '{"count": 15}',
    message_template = 'You''ve reached 15 interactions. It might be time to consolidate knowledge or take a break.';
