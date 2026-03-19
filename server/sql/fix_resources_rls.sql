-- Enable RLS on resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read resources (similar to topics, public educational content)
-- Or restricted?
-- Providing "Public Read" for now as it replaces Concept Books/Papers which seem generic.
DROP POLICY IF EXISTS "Anyone can view resources" ON resources;

CREATE POLICY "Anyone can view resources" ON resources
    FOR SELECT USING (true);

-- Only service role (admin) can insert/update for now.
-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'resources';
