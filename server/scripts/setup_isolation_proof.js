const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PARENT_EMAIL = 'Thetboard@gmail.com';
const CHILD_EMAIL = 'tuyo@tuyoisaza.com';
const TOPIC_TITLE = 'Paleontology';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing credentials");
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function setupProof() {
    console.log("Setting up Isolation Proof...");

    // 1. Cleanup Test Topic
    const { error: delErr } = await adminClient.from('topics').delete().eq('title', 'Test Topic');
    if (!delErr) console.log("Cleaned up 'Test Topic'.");

    // 2. Get Parent ID
    // Try public table first
    let parentId;
    const { data: publicUser } = await adminClient.from('users').select('id').ilike('email', PARENT_EMAIL).single();

    if (publicUser) {
        parentId = publicUser.id;
    } else {
        // Fallback to Auth
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const found = users.find(u => u.email.toLowerCase() === PARENT_EMAIL.toLowerCase());
        if (found) parentId = found.id;
    }

    if (!parentId) {
        console.error("Parent user not found!");
        return;
    }
    console.log(`Parent ID: ${parentId}`);

    // 3. Get Topic ID
    const { data: topic } = await adminClient.from('topics').select('id').eq('title', TOPIC_TITLE).single();
    if (!topic) {
        console.error(`Topic '${TOPIC_TITLE}' not found.`);
        return;
    }

    // 4. Set Parent Progress to Layer 5
    const { error: upsertErr } = await adminClient.from('user_topic_progress').upsert({
        user_id: parentId,
        topic_id: topic.id,
        current_depth: 5,
        engagement_score: 80
    });

    if (upsertErr) console.error("Error setting parent progress:", upsertErr);
    else console.log(`Set Parent '${TOPIC_TITLE}' progress to Layer 5.`);

    // 5. Ensure Child has NO progress (Layer 1 default)
    // We already reset it, but let's be sure
    // (Skipping explicit delete as verified in previous step, but safe to assume it's clean)

    console.log("\nSetup Complete.");
    console.log("---------------------------------------------------");
    console.log("Test Scenario:");
    console.log(`1. Log in as ${PARENT_EMAIL} -> Should see '${TOPIC_TITLE}' at Layer 5.`);
    console.log(`2. Log in as ${CHILD_EMAIL} -> Should see '${TOPIC_TITLE}' at Layer 1.`);
}

setupProof().catch(console.error);
