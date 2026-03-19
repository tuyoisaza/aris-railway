import { supabaseAdmin } from './db.js';

const inspectPolicies = async () => {
    const sql = `
        SELECT policyname, cmd, roles, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'agora_stable_state'
    `;

    const { data } = await supabaseAdmin.rpc('exec_sql_read', { sql_query: sql });
    console.log('Policies:', data);
};

inspectPolicies();
