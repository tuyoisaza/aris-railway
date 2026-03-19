-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Drop constraints relying on UUIDs
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_category_id_fkey;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_pkey CASCADE;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_pkey CASCADE;

-- 2. Alter Columns to TEXT
-- Note: converting UUID to TEXT is safe, but existing data might be weird if mixed. 
-- Best to clear data if this is dev.
TRUNCATE TABLE public.courses, public.categories CASCADE;

ALTER TABLE public.categories ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.categories ADD PRIMARY KEY (id);

ALTER TABLE public.courses ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.courses ALTER COLUMN category_id TYPE TEXT;
ALTER TABLE public.courses ADD PRIMARY KEY (id);

-- 3. Re-add Foreign Key
ALTER TABLE public.courses ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

-- 3b. Fix Mentors ID
-- Mentors also use string IDs in the seed data (e.g. "tuyo")
TRUNCATE TABLE public.mentors;
ALTER TABLE public.mentors DROP CONSTRAINT IF EXISTS mentors_pkey;
ALTER TABLE public.mentors ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.mentors ADD PRIMARY KEY (id);

-- 4. Fix Mentors columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentors' AND column_name = 'description') THEN
        ALTER TABLE public.mentors RENAME COLUMN desc_key TO description;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentors' AND column_name = 'role') THEN
        ALTER TABLE public.mentors RENAME COLUMN role_key TO role;
    END IF;
END $$;
