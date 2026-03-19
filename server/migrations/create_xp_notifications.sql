-- XP Notifications Table
-- Stores real-time notifications for XP gains to show in the UI

CREATE TABLE IF NOT EXISTS xp_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
    source VARCHAR(20) NOT NULL CHECK (source IN ('topic', 'conversation', 'skill', 'milestone')),
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    level INTEGER CHECK (level >= 1 AND level <= 10),
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_xp_notifications_user_id ON xp_notifications(user_id);
CREATE INDEX idx_xp_notifications_created_at ON xp_notifications(created_at);
CREATE INDEX idx_xp_notifications_read ON xp_notifications(read) WHERE read = FALSE;

-- Row Level Security
ALTER TABLE xp_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own XP notifications" ON xp_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own XP notifications" ON xp_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications (for the backend)
CREATE POLICY "Service role can insert XP notifications" ON xp_notifications
    FOR INSERT WITH CHECK (true);