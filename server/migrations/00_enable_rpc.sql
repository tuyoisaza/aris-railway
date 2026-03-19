-- Run this in your Supabase Dashboard > SQL Editor
-- This enables the "exec_sql" function which allows the server to run migrations automatically.

create or replace function exec_sql(sql_query text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql_query;
end;
$$;
