-- Enable RLS on topics if not enabled (it likely is)
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if any (to avoid conflict or restrictive old one)
DROP POLICY IF EXISTS "topics_read_policy" ON "topics";
DROP POLICY IF EXISTS "Enable read access for all users" ON "topics";

-- Create permissive read policy
CREATE POLICY "topics_read_policy" ON "topics"
FOR SELECT USING (true);

-- Ensure topic_edges is also readable
ALTER TABLE "topic_edges" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "edges_read_policy" ON "topic_edges";
CREATE POLICY "edges_read_policy" ON "topic_edges"
FOR SELECT USING (true);
