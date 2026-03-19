-- Seed Topics for ARIS Learning Map
-- Run this in Supabase SQL Editor

INSERT INTO topics (id, name, category, status, progress, description) VALUES
  (gen_random_uuid(), 'Mathematics Fundamentals', 'Mathematics', 'in-progress', 25, 'Core mathematical concepts including algebra, geometry, and arithmetic'),
  (gen_random_uuid(), 'Introduction to Physics', 'Science', 'not-started', 0, 'Basic physics principles: motion, forces, and energy'),
  (gen_random_uuid(), 'World History', 'History', 'not-started', 0, 'Major historical events and civilizations'),
  (gen_random_uuid(), 'Creative Writing', 'Language Arts', 'in-progress', 40, 'Storytelling, poetry, and expressive writing techniques'),
  (gen_random_uuid(), 'Computer Science Basics', 'Technology', 'completed', 100, 'Programming fundamentals and computational thinking'),
  (gen_random_uuid(), 'Earth Science', 'Science', 'not-started', 0, 'Geology, weather, and environmental systems'),
  (gen_random_uuid(), 'Spanish Language', 'Languages', 'in-progress', 15, 'Basic Spanish vocabulary and grammar'),
  (gen_random_uuid(), 'Art History', 'Arts', 'not-started', 0, 'Famous artists, movements, and art analysis'),
  (gen_random_uuid(), 'Critical Thinking', 'Life Skills', 'in-progress', 60, 'Logic, reasoning, and problem-solving strategies'),
  (gen_random_uuid(), 'Music Theory', 'Arts', 'not-started', 0, 'Notes, scales, rhythm, and musical composition')
ON CONFLICT DO NOTHING;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
