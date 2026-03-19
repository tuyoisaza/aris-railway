
-- Enable users to delete their own skill progress
CREATE POLICY "Users can delete own skill progress" ON user_skill_progress FOR DELETE USING (auth.uid() = user_id);
