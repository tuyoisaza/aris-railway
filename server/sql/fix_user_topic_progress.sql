-- Create user_topic_progress if it doesn't exist
CREATE TABLE IF NOT EXISTS user_topic_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    current_depth INTEGER DEFAULT 1,
    engagement_score INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

-- Enable RLS
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
DROP POLICY IF EXISTS "View Topic Progress" ON user_topic_progress;
CREATE POLICY "View Topic Progress" ON user_topic_progress
    FOR SELECT USING (
        auth.uid() = user_id
        -- OR is_parent_of_user(user_id) -- Requires function to be present
    );

DROP POLICY IF EXISTS "Update Topic Progress" ON user_topic_progress;
CREATE POLICY "Update Topic Progress" ON user_topic_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modify Topic Progress" ON user_topic_progress;
CREATE POLICY "Modify Topic Progress" ON user_topic_progress
    FOR UPDATE USING (auth.uid() = user_id);
