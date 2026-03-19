import { supabaseAdmin } from './db.js';

const inspectColumns = async () => {
    const sql = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'agora_stable_state'
    `;

    const { data } = await supabaseAdmin.rpc('exec_sql_read', { sql_query: sql });
    console.log('Columns:', data);

    const rlsSql = `
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'agora_stable_state'
    `;
    const { data: rlsData } = await supabaseAdmin.rpc('exec_sql_read', { sql_query: rlsSql });
    console.log('RLS Enabled:', rlsData);
};

inspectColumns();
