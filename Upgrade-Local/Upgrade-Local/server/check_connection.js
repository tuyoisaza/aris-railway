const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Checking connection to: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from('mentors').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Connection failed (Supabase Error):', error.message);
        } else {
            console.log('Connection successful!');
        }
    } catch (err) {
        console.error('Connection failed (Network/System Error):', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

checkConnection();
