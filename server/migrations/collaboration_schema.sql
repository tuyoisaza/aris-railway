-- Migration: Collaboration Schema for Family-based Learning
-- Adds support for shared entities, user presence, and collaborative sessions

-- Table for shared entities (topics, skills, projects that families can work on together)
CREATE TABLE IF NOT EXISTS shared_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('topic', 'skill', 'project', 'conversation')),
    entity_id UUID NOT NULL, -- Reference to the actual entity
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Visible to all family members
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking user presence status
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_activity VARCHAR(100),
    current_entity_type VARCHAR(50),
    current_entity_id UUID,
    socket_id VARCHAR(255), -- WebSocket connection identifier
    is_visible BOOLEAN DEFAULT TRUE, -- Whether user appears as online to family
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table for collaborative sessions
CREATE TABLE IF NOT EXISTS collaborative_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    shared_entity_id UUID REFERENCES shared_entities(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES users(id),
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('study_together', 'project_collaboration', 'skill_practice', 'challenge')),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE, -- Optional scheduling
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE, -- When session ended/completed
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}', -- Session-specific settings
    participants JSONB DEFAULT '[]', -- Array of participant objects with role and status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for collaborative session participation
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'observer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    contribution_score INTEGER DEFAULT 0, -- Track engagement/contribution
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'away', 'disconnected')),
    metadata JSONB DEFAULT '{}',
    UNIQUE(session_id, user_id)
);

-- Table for real-time collaboration events
CREATE TABLE IF NOT EXISTS collaboration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('join', 'leave', 'message', 'action', 'progress', 'achievement')),
    event_data JSONB DEFAULT '{}',
    entity_type VARCHAR(50), -- Optional context
    entity_id UUID, -- Optional context
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_entities_family_id ON shared_entities(family_id);
CREATE INDEX IF NOT EXISTS idx_shared_entities_entity ON shared_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_family_id ON user_presence(family_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_collaborative_sessions_family_id ON collaborative_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_sessions_active ON collaborative_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_session_id ON collaboration_events(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_family_id ON collaboration_events(family_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_timestamp ON collaboration_events(timestamp);

-- RLS Policies
ALTER TABLE shared_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_entities
CREATE POLICY "Family members can view shared entities" ON shared_entities
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR shared_by = auth.uid()
    );

CREATE POLICY "Family members can insert shared entities" ON shared_entities
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
        AND shared_by = auth.uid()
    );

CREATE POLICY "Shared entity owners can update" ON shared_entities
    FOR UPDATE USING (shared_by = auth.uid());

CREATE POLICY "Shared entity owners can delete" ON shared_entities
    FOR DELETE USING (shared_by = auth.uid());

-- RLS Policies for user_presence
CREATE POLICY "Users can view family members' presence" ON user_presence
    FOR SELECT USING (
        user_id = auth.uid()
        OR family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can update own presence" ON user_presence
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own presence" ON user_presence
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for collaborative_sessions
CREATE POLICY "Family members can view sessions" ON collaborative_sessions
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Family members can create sessions" ON collaborative_sessions
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
        AND initiated_by = auth.uid()
    );

CREATE POLICY "Session hosts can update sessions" ON collaborative_sessions
    FOR UPDATE USING (initiated_by = auth.uid());

CREATE POLICY "Session hosts can delete sessions" ON collaborative_sessions
    FOR DELETE USING (initiated_by = auth.uid());

-- RLS Policies for session_participants
CREATE POLICY "Users can view session participants" ON session_participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM collaborative_sessions 
            WHERE family_id IN (
                SELECT family_id FROM user_families 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Users can join sessions" ON session_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND session_id IN (
            SELECT id FROM collaborative_sessions 
            WHERE family_id IN (
                SELECT family_id FROM user_families 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Users can update own participation" ON session_participants
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for collaboration_events
CREATE POLICY "Family members can view collaboration events" ON collaboration_events
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create collaboration events" ON collaboration_events
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND family_id IN (
            SELECT family_id FROM user_families 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_shared_entities_updated_at BEFORE UPDATE ON shared_entities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborative_sessions_updated_at BEFORE UPDATE ON collaborative_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active family members
CREATE OR REPLACE FUNCTION get_active_family_members(family_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    status VARCHAR(20),
    last_seen TIMESTAMP WITH TIME ZONE,
    current_activity VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.status,
        up.last_seen,
        up.current_activity
    FROM user_presence up
    WHERE up.family_id = family_uuid 
    AND up.status != 'offline'
    AND up.is_visible = TRUE
    ORDER BY up.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join collaborative session
CREATE OR REPLACE FUNCTION join_collaborative_session(
    session_uuid UUID,
    participant_role VARCHAR DEFAULT 'participant'
)
RETURNS BOOLEAN AS $$
DECLARE
    session_family_id UUID;
    session_active BOOLEAN;
BEGIN
    -- Get session details
    SELECT family_id, is_active INTO session_family_id, session_active
    FROM collaborative_sessions 
    WHERE id = session_uuid;
    
    -- Validate session exists and is active
    IF session_family_id IS NULL OR NOT session_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is member of the family
    IF NOT EXISTS (
        SELECT 1 FROM user_families 
        WHERE family_id = session_family_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Add participant or update if exists
    INSERT INTO session_participants (session_id, user_id, role)
    VALUES (session_uuid, auth.uid(), participant_role)
    ON CONFLICT (session_id, user_id) 
    DO UPDATE SET 
        role = participant_role,
        joined_at = NOW(),
        left_at = NULL,
        status = 'active';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave collaborative session
CREATE OR REPLACE FUNCTION leave_collaborative_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE session_participants 
    SET left_at = NOW(), status = 'disconnected'
    WHERE session_id = session_uuid AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;