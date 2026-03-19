-- 1. Super Admin Flag
-- Add is_super_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. System Settings Table
-- Key-value store for global configurations (e.g., debug_mode)
DROP TABLE IF EXISTS public.system_settings;
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
-- Only Super Admins can manage settings (enforced via API/RLS later)
CREATE POLICY "Read settings" ON public.system_settings FOR SELECT USING (true); -- Public read (for frontend config)

-- 3. System Logs Table
-- "Black box" recorder for debug mode
DROP TABLE IF EXISTS public.system_logs;
CREATE TABLE public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    level TEXT DEFAULT 'info', -- 'info', 'warn', 'error', 'debug'
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- User context (nullable)
    result TEXT, -- 'success', 'failure'
    details JSONB
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
-- Only Super Admins can read logs
-- (Policy strictly separate from RLS service if using Service Role, but good to have)

-- 4. Seed Data
-- Default Debug Mode = OFF
INSERT INTO public.system_settings (key, value, description)
VALUES ('debug_mode', 'false'::jsonb, 'Global Debug Switch')
ON CONFLICT (key) DO NOTHING;

-- Seed Super Admin (Temporary for dev: set existing dev user if exists)
-- Replace 'dev@upgrade.local' or specific ID if known, otherwise manual update required.
-- This script just sets up the structure.
