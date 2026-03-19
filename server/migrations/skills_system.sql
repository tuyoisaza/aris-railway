-- SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Technical', 'Physical', 'Social', 'Creative', 'Cognitive', 'Domestic', 'General')) DEFAULT 'General',
    depth INTEGER DEFAULT 1, -- 1=Basic Action, 10=Mastery/Abstract
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SKILL GRAPH EDGES (Hierarchy)
CREATE TABLE IF NOT EXISTS skill_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES skills(id) ON DELETE CASCADE, -- Parent/Broad Skill
    target_id UUID REFERENCES skills(id) ON DELETE CASCADE, -- Child/Sub-Skill
    type TEXT CHECK (type IN ('sub_skill', 'prerequisite', 'related')) DEFAULT 'sub_skill',
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, target_id)
);

-- USER SKILL PROGRESS
CREATE TABLE IF NOT EXISTS user_skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 0, -- User's mastery level (1-100?)
    xp INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0, -- 0-100
    last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simple defaults for now)
-- Skills are readable by everyone
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "Edges are viewable by everyone" ON skill_edges FOR SELECT USING (true);

-- User Progress is private
CREATE POLICY "Users can view own skill progress" ON user_skill_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own skill progress" ON user_skill_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill progress" ON user_skill_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
