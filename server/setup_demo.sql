-- ============================================================
-- ARIS DEMO SETUP SCRIPT
-- ============================================================
-- 1. Updates table schema to support Learning Map features
-- 2. Creates helper functions for data seeding
-- ============================================================

-- 1. TOPICS TABLE SCHEMA
-- Add missing columns expected by Frontend (quoted for case sensitivity)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'General';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS "depth" int DEFAULT 1;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS "maxDepth" int DEFAULT 7;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS "engagement" int DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS "connections" int DEFAULT 0;

-- 2. USER TOPIC PROGRESS TABLE SCHEMA (If needed)
-- Ensure columns exist
ALTER TABLE user_topic_progress ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'locked'; -- locked, unlocked, in_progress, completed
ALTER TABLE user_topic_progress ADD COLUMN IF NOT EXISTS "progress" int DEFAULT 0;
ALTER TABLE user_topic_progress ADD COLUMN IF NOT EXISTS "score" int DEFAULT 0;

-- 2b. CONVERSATIONS TABLE SCHEMA
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "topic_id" text REFERENCES topics(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "title" text; -- Ensure title exists

-- 4. PROJECTS TABLE SCHEMA
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES auth.users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "topic_id" text REFERENCES topics(id); -- Text ID for topics
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'idea'; -- idea, active, paused, completed
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "why_i_care" text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "intent" text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "scope" text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "done_when" text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "artifacts" jsonb DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "reflections" text;

-- 3. CREATE FAMILY RPC (Transactional)
CREATE OR REPLACE FUNCTION create_new_family(name_input text, owner_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_family_id uuid;
  new_created_at timestamptz;
  new_pin text := '1234';
BEGIN
  -- 1. Insert Family
  INSERT INTO families (name, pin)
  VALUES (name_input, new_pin)
  RETURNING id, created_at INTO new_family_id, new_created_at;

  -- 2. Insert Member (Creator as Parent)
  INSERT INTO family_members (family_id, user_id, role, active, stats)
  VALUES (
    new_family_id, 
    owner_id_input, 
    'Parent', 
    true, 
    '{"weeklyUsage": 0, "avgSession": "0m", "activeTopics": 0}'::jsonb
  );

  -- 3. Return Family Object
  RETURN json_build_object(
    'id', new_family_id,
    'name', name_input,
    'pin', new_pin,
    'created_at', new_created_at
  );
END;
$$;
