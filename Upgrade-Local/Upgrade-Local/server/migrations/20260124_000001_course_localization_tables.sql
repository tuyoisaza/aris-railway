-- Course localization tables (English canonical fallback)
--
-- Rationale:
-- - Keep public.courses as the canonical structure (title/description + syllabus skeleton)
-- - Store localized course + step content per language in dedicated tables
-- - Allow public read; writes should be done via server using service role key

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Course-level translations
CREATE TABLE IF NOT EXISTS public.course_translations (
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK (lang IN ('en', 'es', 'pt')),
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (course_id, lang)
);

ALTER TABLE public.course_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read course_translations" ON public.course_translations;
CREATE POLICY "Public read course_translations" ON public.course_translations
  FOR SELECT USING (true);

-- 2) Step-level translations (where the big markdown lives)
CREATE TABLE IF NOT EXISTS public.course_step_translations (
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL CHECK (step_index >= 0),
  lang TEXT NOT NULL CHECK (lang IN ('en', 'es', 'pt')),
  title TEXT,
  description TEXT,
  markdown_content TEXT,
  resources JSONB,
  estimated_read_time TEXT,
  generator_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (course_id, step_index, lang)
);

ALTER TABLE public.course_step_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read course_step_translations" ON public.course_step_translations;
CREATE POLICY "Public read course_step_translations" ON public.course_step_translations
  FOR SELECT USING (true);

COMMIT;
