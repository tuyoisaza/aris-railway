-- EMERGENCY FIX: Reassign all topics and skills to the correct user
-- This will restore access to all topics for the current logged-in user

-- Reassign all topics to user: 49c236ef-9088-437a-ae24-118bd0c444bf (Tuyo Isaza / thetboard@gmail.com)
UPDATE topics 
SET user_id = '49c236ef-9088-437a-ae24-118bd0c444bf';

-- Reassign all skills to the same user
UPDATE skills 
SET user_id = '49c236ef-9088-437a-ae24-118bd0c444bf';

-- Verify the update
SELECT COUNT(*) as total_topics FROM topics WHERE user_id = '49c236ef-9088-437a-ae24-118bd0c444bf';
SELECT COUNT(*) as total_skills FROM skills WHERE user_id = '49c236ef-9088-437a-ae24-118bd0c444bf';
