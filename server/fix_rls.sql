-- FIX: Disable Row Level Security (RLS) for invitations
-- The backend needs to be able to delete invites without a user session

ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- Force schema reload
NOTIFY pgrst, 'reload config';
