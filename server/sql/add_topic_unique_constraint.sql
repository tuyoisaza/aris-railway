-- Add unique constraint for topic titles per user to prevent exact duplicates
-- This fixes the race condition in TopicService.js

-- First, clean up existing exact duplicates (keep first one)
WITH duplicates AS (
    SELECT 
        id,
        user_id,
        LOWER(TRIM(title)) as normalized_title,
        ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(TRIM(title)) ORDER BY created_at ASC) as rn
    FROM topics
),
to_delete AS (
    SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM topics WHERE id IN (SELECT id FROM to_delete);

-- Add unique constraint on normalized titles per user
ALTER TABLE topics 
ADD CONSTRAINT unique_topic_title_per_user 
UNIQUE (user_id, lower(trim(title)));

-- Add index for better performance
CREATE INDEX idx_topics_user_normalized_title ON topics (user_id, lower(trim(title)));

-- Add comment to document the constraint
COMMENT ON CONSTRAINT unique_topic_title_per_user ON topics IS 'Prevents exact duplicate topic titles per user';