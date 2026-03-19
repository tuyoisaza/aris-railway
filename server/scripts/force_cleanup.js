const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function cleanup() {
    console.log("Checking for Test Topics...");

    // 1. List all topics
    const { data: topics, error } = await adminClient.from('topics').select('id, title');
    if (error) {
        console.error("Error fetching topics:", error);
        return;
    }

    console.log(`Found ${topics.length} total topics.`);

    // 2. Filter for "Test Topic"
    const targets = topics.filter(t => t.title.includes("Test Topic"));

    if (targets.length === 0) {
        console.log("No topics with 'Test Topic' in title found.");
    } else {
        console.log(`Found ${targets.length} targets to delete:`);
        targets.forEach(t => console.log(` - [${t.id}] ${t.title}`));

        const ids = targets.map(t => t.id);
        const { error: delErr } = await adminClient.from('topics').delete().in('id', ids);

        if (delErr) console.error("Update failed:", delErr);
        else console.log("SUCCESS: Deleted target topics.");
    }
}

cleanup().catch(console.error);
