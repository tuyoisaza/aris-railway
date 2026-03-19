-- ============================================================
-- BADGES & WARNINGS RLS
-- ============================================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- BADGES (Catalog)
-- Everyone can view badges (Gamification)
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges
    FOR SELECT USING (true);

-- Only Service Role can manage badges (Admin dashboard uses service role/admin client usually, or we need an admin policy)
-- Assuming Admin is handled via Service Role or specific Admin check.
-- For safety, explicit:
DROP POLICY IF EXISTS "Service role manages badges" ON badges;
CREATE POLICY "Service role manages badges" ON badges
    FOR ALL USING (auth.role() = 'service_role');


-- USER_BADGES (Assignments)
-- Users can view their own badges
DROP POLICY IF EXISTS "Users view own badges" ON user_badges;
CREATE POLICY "Users view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Parents can view child's badges
-- Reuse helper function if available, or straight join
DROP POLICY IF EXISTS "Parents view child badges" ON user_badges;
CREATE POLICY "Parents view child badges" ON user_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members parent
            JOIN family_members child ON parent.family_id = child.family_id
            WHERE parent.user_id = auth.uid()
            AND parent.role = 'Parent'
            AND child.user_id = user_badges.user_id
        )
    );

-- Insert: Usually done by system/Edge Function/Service Role
DROP POLICY IF EXISTS "System assigns badges" ON user_badges;
CREATE POLICY "System assigns badges" ON user_badges
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
