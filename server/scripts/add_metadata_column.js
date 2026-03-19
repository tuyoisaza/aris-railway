require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function addColumn() {
    console.log('Attempting to add metadata column via RPC exec_sql...');

    const sql = "ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';";

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('RPC Failed:', error);
        console.log('NOTE: If this fails, it means the exec_sql function is missing.');
    } else {
        console.log('Success! RPC executed.');
        console.log('Result:', data);
    }
}

addColumn();
