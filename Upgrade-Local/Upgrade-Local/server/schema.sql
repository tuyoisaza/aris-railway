-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to ensure schema matches (order matters due to FK constraints)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.user_tests CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.axes CASCADE;
DROP TABLE IF EXISTS public.mentors CASCADE;
DROP TABLE IF EXISTS public.translations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. PROFILES
-- Secure user profile data, separate from auth.users but linked
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_status TEXT DEFAULT 'free', -- 'free', 'active', 'past_due', 'cancelled'
    is_super_admin BOOLEAN DEFAULT FALSE,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. PENSUM STRUCTURE (Axes, Categories, Courses)
CREATE TABLE IF NOT EXISTS public.axes (
    id TEXT PRIMARY KEY, -- 'human', 'leadership', 'cocreation'
    title_key TEXT NOT NULL,
    desc_key TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY, -- Changed from UUID to TEXT to support semantic IDs
    axis_id TEXT REFERENCES public.axes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY, -- Changed from UUID to TEXT to support semantic IDs
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE, -- REFERENCES TEXT
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    syllabus JSONB DEFAULT '[]'::jsonb, -- Array of objects { title, duration, desc }
    sort_order INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'published', -- 'draft', 'review', 'published', 'archived'
    origin_topic TEXT,
    ai_metadata JSONB
);

ALTER TABLE public.axes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read axes" ON public.axes;
CREATE POLICY "Public read axes" ON public.axes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);

-- 3. MENTORS & TRANSLATIONS
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read mentors" ON public.mentors;
CREATE POLICY "Public read mentors" ON public.mentors FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.translations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lang TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    UNIQUE(lang, key)
);
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read translations" ON public.translations;
CREATE POLICY "Public read translations" ON public.translations FOR SELECT USING (true);

-- 4. TESTS & QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    axis_id TEXT REFERENCES public.axes(id) ON DELETE CASCADE,
    q TEXT NOT NULL, -- Question text
    options JSONB NOT NULL, -- Array of { text, points }
    sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

-- 5. USER DATA (Private)
CREATE TABLE IF NOT EXISTS public.user_tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    axis_id TEXT REFERENCES public.axes(id),
    score INTEGER NOT NULL,
    level_title TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tests" ON public.user_tests;
CREATE POLICY "Users can view own tests" ON public.user_tests
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tests" ON public.user_tests;
CREATE POLICY "Users can insert own tests" ON public.user_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    context TEXT,
    outcome TEXT,
    review_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own journal" ON public.journal_entries;
CREATE POLICY "Users can manage own journal" ON public.journal_entries
    FOR ALL USING (auth.uid() = user_id);

-- Subscriptions (Managed by Stripe Webhook / Service Role)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    plan_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Webhook Events (Idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 7. AI AGENTS (Admin Managed)
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id TEXT PRIMARY KEY, -- e.g., 'architect', 'teacher'
    name TEXT NOT NULL,
    role_description TEXT,
    system_prompt TEXT NOT NULL,
    model TEXT DEFAULT 'gpt-4o-mini',
    temperature NUMERIC DEFAULT 0.7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
-- Only admins can view/edit agents (enforced by API middleware, effectively private)


-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
