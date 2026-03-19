-- FIX: Create missing invitations table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL, -- The unique code in the link
    status TEXT CHECK (status IN ('Pending', 'Accepted', 'Expired')) DEFAULT 'Pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
