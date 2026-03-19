-- Create Activity Logs table for tracking daily stats
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'chat', 'skill_practice', 'project_update'
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster stats aggregation
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs (user_id, created_at);
