-- Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set the current user as admin
UPDATE users SET role = 'admin' WHERE id = '49c236ef-9088-437a-ae24-118bd0c444bf';

-- Verify the update
SELECT id, name, email, role FROM users WHERE id = '49c236ef-9088-437a-ae24-118bd0c444bf';
