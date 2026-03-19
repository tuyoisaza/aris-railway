require('dotenv').config({ path: 'server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function inspectTable() {
    console.log('🔍 Inspecting MESSAGES table schema...');

    // We can't query information_schema easily with js client for some auth/role reasons usually,
    // so we'll try to insert a dummy row into messages and see the error or just list columns via RPC if available.
    // Or better, select * limit 1 and look at keys.

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        console.log('Row sample:', data);
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Cannot infer columns from data.');
            // Try inserting a dummy row with just required fields to trigger error on missing cols?
            // Actually, let's try to query information schema via RPC if user defined one? No.
        }
    }
}

inspectTable();
