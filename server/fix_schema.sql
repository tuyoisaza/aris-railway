-- FIX: Recreate family_members table to ensure schema matches
-- Run this in your Supabase SQL Editor

DROP TABLE IF EXISTS family_members;

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Parent', 'Child', 'Admin')) DEFAULT 'Child',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    stats JSONB DEFAULT '{}',
    UNIQUE(family_id, user_id)
);

-- Force schema cache reload (Supabase specific)
NOTIFY pgrst, 'reload config';
