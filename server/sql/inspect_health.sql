-- Drop previous if exists
DROP FUNCTION IF EXISTS inspect_health();

-- Create inspection function
CREATE OR REPLACE FUNCTION inspect_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', t.table_name,
            'rls_enabled', c.relrowsecurity,
            'has_policies', EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)
        )
    )
    INTO result
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

    RETURN result;
END;
$$;
