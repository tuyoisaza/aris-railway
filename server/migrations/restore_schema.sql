-- UNDO MISTAKE MIGRATION

-- 1. Remove accidental column from profiles (if it exists)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_super_admin;

-- 2. Drop the "bad" tables (the ones linking to auth.users or having wrong schema)
DROP TABLE IF EXISTS public.system_settings;
DROP TABLE IF EXISTS public.system_logs;

-- 3. RESTORE CORRECT TABLES (From original add_super_admin.sql)

-- Re-create System Logs table (referencing public.users)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role TEXT,
    result TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Re-create System Settings table (referencing public.users)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default debug setting
INSERT INTO system_settings (key, value)
VALUES ('global_debug', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
