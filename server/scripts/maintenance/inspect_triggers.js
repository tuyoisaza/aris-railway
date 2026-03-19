import { supabaseAdmin } from './db.js';

const inspectTriggers = async () => {
    const sql = `
        SELECT trigger_name, action_statement, event_manipulation 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'public'
    `;

    const { data, error } = await supabaseAdmin.rpc('exec_sql_read', { sql_query: sql });

    if (error) {
        console.error('Error inspecting triggers:', error);
    } else {
        console.log('Triggers on public.users:', data);
    }
};

inspectTriggers();
