import { supabaseAdmin } from './db.js';

const checkTable = async () => {
    const sql = `
        SELECT to_regclass('public.agora_stable_state') as table_exists
    `;

    const { data, error } = await supabaseAdmin.rpc('exec_sql_read', { sql_query: sql });

    if (error) {
        console.error('Error checking table:', error);
    } else {
        console.log('Table exists:', data);
    }
};

checkTable();
