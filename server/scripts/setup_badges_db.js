require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupBadges() {
    console.log('Setting up Badge System Tables...');

    const sql = `
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

        CREATE TABLE IF NOT EXISTS user_badges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
            awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, badge_id)
        );

        -- Add RLS Policies (simplified for MVP: Admin full access, Users read public badges?)
        -- Actually, user_badges is private? No, users might want to see their badges.
        -- For now, we rely on service role for awarding. Users can read their own badges.
        
        ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

        -- Policy: Everyone can read badges (public info)
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'badges' AND policyname = 'Public Read Badges'
            ) THEN
                CREATE POLICY "Public Read Badges" ON badges FOR SELECT USING (true);
            END IF;
        END $$;

        -- Policy: Users can read their own user_badges
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'User Read Own Badges'
            ) THEN
                CREATE POLICY "User Read Own Badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
            END IF;
        END $$;

        -- Seed Initial Badge
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
    `;

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('RPC Failed:', error);
    } else {
        console.log('Success! Tables created and seeded.');
    }
}

setupBadges();
