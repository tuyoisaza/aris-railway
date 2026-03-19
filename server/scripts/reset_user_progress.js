const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TARGET_EMAIL = 'tuyo@tuyoisaza.com';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function resetProgress() {
    console.log(`Looking up user: ${TARGET_EMAIL}...`);

    // 1. Get User ID (from auth or public users table)
    // Checking public users table first is easier if synced
    let { data: user, error } = await adminClient
        .from('users')
        .select('id')
        .eq('email', TARGET_EMAIL)
        .single();

    if (error || !user) {
        console.log("User not found in public table, checking Auth...");
        // Fallback to ListUsers (admin only) - simpler to error if not found for now
        // Actually, let's try to get via listUsers to be sure
        const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
        const authUser = users.find(u => u.email === TARGET_EMAIL);
        if (!authUser) {
            console.error("User not found in Auth system either.");
            process.exit(1);
        }
        user = { id: authUser.id };
    }

    console.log(`Found User ID: ${user.id}`);

    // 2. Delete Progress
    const { count, error: delError } = await adminClient
        .from('user_topic_progress')
        .delete({ count: 'exact' })
        .eq('user_id', user.id);

    if (delError) {
        console.error("Error deleting progress:", delError);
        process.exit(1);
    }

    console.log(`\nSUCCESS: Reset complete.`);
    console.log(`Deleted ${count} progress records for ${TARGET_EMAIL}.`);
    console.log(`The Learning Map for this user should now be empty (default state).`);
}

resetProgress().catch(e => console.error(e));
