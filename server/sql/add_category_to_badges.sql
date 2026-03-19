-- Run this in Supabase SQL Editor to add the category column
ALTER TABLE badges 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'warning';

-- Optional: Update existing badges if needed
-- UPDATE badges SET category = 'warning' WHERE name = 'Topic Fatigue';
