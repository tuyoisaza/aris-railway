-- ============================================================
-- Create Family RPC (Transactional & Secure)
-- ============================================================
-- Run this script in Supabase SQL Editor to create the helper function.

CREATE OR REPLACE FUNCTION create_new_family(name_input text, owner_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as Database Owner (Bypasses RLS)
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
