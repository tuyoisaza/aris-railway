
-- Enable users to insert new skills
CREATE POLICY "Users can insert skills" ON skills FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Also ensure they can see what they inserted (already done by global select true, but good to check)
