import { supabaseAdmin } from './db.js';

const inspectFunction = async () => {
    // Correct query for function definition, no semicolon in subquery
    const sql = `
        SELECT pg_get_functiondef(oid) as definition
        FROM pg_proc
        WHERE proname = 'create_agora_stable_state'
    `;

    const { data, error } = await supabaseAdmin.rpc('exec_sql_read', { sql_query: sql });

    if (error) {
        console.error('Error inspecting function:', error);
    } else {
        console.log('Definition:', data);
    }
};

inspectFunction();
