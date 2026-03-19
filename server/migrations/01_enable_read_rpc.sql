-- Enable exec_sql_read for data inspection
create or replace function exec_sql_read(sql_query text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  execute 'SELECT json_agg(t) FROM (' || sql_query || ') t' into result;
  return result;
end;
$$;
