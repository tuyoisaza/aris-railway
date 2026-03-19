-- =============================================================================
-- AGORA SHARED STATE ARCHITECTURE
-- Three-Layer Model for ARIS Internal AI Coordination
-- =============================================================================

-- -----------------------------------------------------------------------------
-- LAYER A: Stable User State
-- Purpose: Identity, permissions, and constraints
-- Writers: System/Auth/Parent Controls only
-- Readers: All AIs
-- Inference: NOT allowed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agora_stable_state (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role determines child/adult/professional context
    user_role TEXT CHECK (user_role IN ('child', 'adult', 'professional')) DEFAULT 'adult',
    
    -- Parental/Family boundaries (JSON for flexibility)
    family_boundaries JSONB DEFAULT '{}',
    
    -- Consent flags for various features
    consent_flags JSONB DEFAULT '{
        "memory_enabled": true,
        "trait_inference": true,
        "cross_session_learning": true
    }',
    
    -- Subscription/feature access level
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'basic', 'premium', 'family')) DEFAULT 'free',
    
    -- Language preference (sync with existing users.preferences)
    language_pref TEXT DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy: Users can read their own state, admins can write
ALTER TABLE agora_stable_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stable state"
    ON agora_stable_state FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stable state"
    ON agora_stable_state FOR ALL
    USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------------------
-- LAYER B: User Memory Layer (Managed by Ogma only)
-- Purpose: Long-term inferred traits and tendencies
-- Writers: Ogma only
-- Readers: All AIs
-- Inference: Allowed only by Ogma
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agora_user_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trait identification
    trait_key TEXT NOT NULL,  -- e.g., 'topic_affinity', 'reasoning_style', 'expression_preference'
    
    -- Human-readable, tentatively phrased value
    -- Examples: "Tends to return to astronomy across sessions"
    --           "Often reasons using analogies rather than abstractions"
    trait_value TEXT NOT NULL,
    
    -- Confidence score (0.0 - 1.0) for probabilistic nature
    confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Decay tracking
    last_confirmed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decay_factor DECIMAL(3,2) DEFAULT 1.0 CHECK (decay_factor >= 0 AND decay_factor <= 1),
    
    -- Versioning for auditability
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate traits per user
    UNIQUE(user_id, trait_key)
);

-- Index for efficient user memory lookups
CREATE INDEX IF NOT EXISTS idx_agora_memory_user ON agora_user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_agora_memory_confidence ON agora_user_memory(confidence DESC);

-- RLS Policy: Users can read their own memory, only service role can write
ALTER TABLE agora_user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memory"
    ON agora_user_memory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage memory"
    ON agora_user_memory FOR ALL
    USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------------------
-- LAYER C: Session Context
-- Purpose: Short-term operational context
-- Writers: Conversation system
-- Readers: All active AIs
-- Inference: NOT allowed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agora_session_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,  -- Unique per browser session
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Current conversation state
    active_topic TEXT,
    
    -- Posture from design doc
    current_posture TEXT CHECK (current_posture IN ('commentator', 'guide', 'challenger', 'witness')) DEFAULT 'guide',
    
    -- Current task/intent
    task_intent TEXT,
    
    -- Temporary constraints (JSON for flexibility)
    constraints JSONB DEFAULT '{}',
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    
    -- Only one active session context per session
    UNIQUE(session_id)
);

-- Index for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_agora_session_user ON agora_session_context(user_id);
CREATE INDEX IF NOT EXISTS idx_agora_session_expires ON agora_session_context(expires_at);

-- RLS Policy
ALTER TABLE agora_session_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session"
    ON agora_session_context FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
    ON agora_session_context FOR ALL
    USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------------------
-- POST-ACTION SUMMARY BUFFER
-- Purpose: Buffered signals from agents for Ogma processing
-- Writers: All AIs (post-action summaries only)
-- Readers: Ogma only
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agora_post_action_buffer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source agent
    agent_id TEXT NOT NULL,  -- e.g., 'cartographer', 'teacher', 'librarian'
    
    -- Target user
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Signal classification
    signal_type TEXT NOT NULL CHECK (signal_type IN (
        'TOPIC_RECURRENCE',
        'CROSS_TOPIC_REUSE',
        'VOLUNTARY_CONTINUATION',
        'EXPRESSION_MODE_CHOSEN',
        'ENGAGEMENT_SIGNAL',
        'DISENGAGEMENT_SIGNAL',
        'REASONING_STYLE_OBSERVED',
        'DEPTH_PROGRESSION',
        'BRANCH_EXPLORATION'
    )),
    
    -- Structured signal data (machine-readable)
    signal_data JSONB NOT NULL,
    
    -- Context reference (optional)
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Processing state
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Ogma processing
CREATE INDEX IF NOT EXISTS idx_agora_buffer_user ON agora_post_action_buffer(user_id);
CREATE INDEX IF NOT EXISTS idx_agora_buffer_unprocessed ON agora_post_action_buffer(processed, created_at) WHERE processed = FALSE;

-- RLS Policy: Only service role
ALTER TABLE agora_post_action_buffer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage buffer"
    ON agora_post_action_buffer FOR ALL
    USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------------------
-- MEMORY AUDIT LOG
-- Purpose: Track all changes to Layer B for transparency
-- Writers: System only
-- Readers: Users (own data), Admins
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agora_memory_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- What changed
    trait_key TEXT NOT NULL,
    change_type TEXT CHECK (change_type IN ('CREATE', 'UPDATE', 'DECAY', 'CORRECTION', 'DELETE')) NOT NULL,
    
    -- Before/after values
    old_value JSONB,
    new_value JSONB,
    
    -- Change metadata
    changed_by TEXT NOT NULL,  -- 'ogma', 'user_correction', 'system'
    change_reason TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user audit history
CREATE INDEX IF NOT EXISTS idx_agora_audit_user ON agora_memory_audit(user_id, created_at DESC);

-- RLS Policy
ALTER TABLE agora_memory_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audit log"
    ON agora_memory_audit FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage audit"
    ON agora_memory_audit FOR ALL
    USING (auth.role() = 'service_role');


-- -----------------------------------------------------------------------------
-- HELPER FUNCTION: Auto-create stable state for new users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_agora_stable_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agora_stable_state (user_id, language_pref)
    VALUES (NEW.id, COALESCE((NEW.preferences->>'language')::text, 'en'))
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user creation
DROP TRIGGER IF EXISTS trigger_create_agora_stable_state ON users;
CREATE TRIGGER trigger_create_agora_stable_state
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_agora_stable_state();


-- -----------------------------------------------------------------------------
-- HELPER FUNCTION: Clean expired sessions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM agora_session_context WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
