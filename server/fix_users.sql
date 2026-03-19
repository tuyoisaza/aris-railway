-- FIX: Sync auth.users to public.users
-- Run this in Supabase SQL Editor to fix "Foreign Key Violation" errors

-- 1. Ensure avatar column exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 2. Insert missing users from Auth into Public Users table
INSERT INTO public.users (id, email, name, avatar)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', 'System User') as name,
    raw_user_meta_data->>'avatar_url' as avatar
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    avatar = EXCLUDED.avatar;

-- 2. Output confirmation
SELECT count(*) as total_users FROM public.users;
