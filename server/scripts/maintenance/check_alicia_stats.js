const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkStats() {
    console.log("--- CHECKING ALICIA STATS ---");
    const { data: members, error } = await supabaseAdmin
        .from('family_members')
        .select('*')
        .ilike('role', 'child'); // Finding the child

    const alicia = members.find(m => m.stats && m.stats.weeklyUsage === "5h 33m");

    if (alicia) {
        console.log("SUCCESS: Alicia Found with correct stats.");
        console.log(JSON.stringify(alicia.stats, null, 2));
    } else {
        console.log("FAILURE: Alicia stats not found.");
        console.log("Found members:", JSON.stringify(members, null, 2));
    }
}

checkStats();
