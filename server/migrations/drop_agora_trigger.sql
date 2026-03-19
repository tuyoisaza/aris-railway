-- Drop the blocking trigger on public.users
DROP TRIGGER IF EXISTS trigger_create_agora_stable_state ON public.users;
-- Also try to drop the function if possible to clean up, but trigger drop is sufficient.
