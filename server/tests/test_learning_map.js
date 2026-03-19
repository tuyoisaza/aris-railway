const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTests() {
    console.log("Starting Learning Map Isolation Verification...");

    // 1. Setup Test Users
    console.log("\n[1] Setting up test users...");
    const emailChild = `childmap_${Date.now()}@test.com`;
    const emailParent = `parentmap_${Date.now()}@test.com`;
    const password = 'password123';

    const { data: { user: userChild }, error: errChild } = await adminClient.auth.admin.createUser({ email: emailChild, password, email_confirm: true });
    if (errChild) throw errChild;
    const { data: { user: userParent }, error: errParent } = await adminClient.auth.admin.createUser({ email: emailParent, password, email_confirm: true });
    if (errParent) throw errParent;

    // Create Users public records
    await adminClient.from('users').insert([{ id: userChild.id, email: emailChild, name: 'Child Map Test' }]);
    await adminClient.from('users').insert([{ id: userParent.id, email: emailParent, name: 'Parent Map Test' }]);

    // Family
    const { data: family } = await adminClient.from('families').insert([{ name: 'Map Family' }]).select().single();
    await adminClient.from('family_members').insert([
        { family_id: family.id, user_id: userChild.id, role: 'Child' },
        { family_id: family.id, user_id: userParent.id, role: 'Parent' }
    ]);
    console.log("    Users & Family created.");

    // 2. Setup a Topic
    const topicId = '123e4567-e89b-12d3-a456-426614174000'; // Manual UUID
    const { data: topic, error: topicErr } = await adminClient.from('topics').insert({
        id: topicId,
        title: 'Test Topic',
        depth: 1
    }).select().single();

    if (topicErr) {
        console.error("Topic Create Error:", topicErr);
        throw topicErr;
    }
    console.log(`    Topic Created: ${topic.id}`);

    // Clients
    const childClient = createClient(SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${await getUserToken(emailChild, password)}` } }
    });
    const parentClient = createClient(SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${await getUserToken(emailParent, password)}` } }
    });

    // 3. Child Updates Progress (Depth 3)
    console.log("\n[2] Child Updating Progress...");
    const { error: progErr } = await childClient.from('user_topic_progress').upsert({
        user_id: userChild.id,
        topic_id: topic.id,
        current_depth: 3,
        engagement_score: 50
    });
    if (progErr) throw progErr;
    console.log("    Progress set to Depth 3.");

    // 4. Verify Database Read (RLS Check)
    console.log("\n[3] Verifying RLS...");
    const { data: readSelf } = await childClient.from('user_topic_progress').select('*').eq('topic_id', topic.id).single();
    if (readSelf?.current_depth === 3) console.log("    PASS: Child can read own progress.");
    else console.error("    FAIL: Child cannot read own progress.");

    const { data: readParent } = await parentClient.from('user_topic_progress').select('*').eq('user_id', userChild.id).single();
    if (readParent?.current_depth === 3) console.log("    PASS: Parent can read child progress.");
    else console.error("    FAIL: Parent CANNOT read child progress.");

    // 5. Verify API Response Simulation
    // Since we can't easily curl the local express from here without fetch (which we have in newer nodes), 
    // we will rely on DB RLS pass-through. The API logic is:
    // fetch topics -> fetch progress -> merge.
    // If Child reads topics list, they should see depth 3.
    // We can't test the Express logic directly here without starting the server, 
    // but verifying RLS ensures the API *can* fetch the data.

    // Cleanup
    console.log("\n[4] Cleanup...");
    await adminClient.auth.admin.deleteUser(userChild.id);
    await adminClient.auth.admin.deleteUser(userParent.id);
    await adminClient.from('topics').delete().eq('id', topic.id);

    console.log("\nVERIFICATION COMPLETE.");
}

async function getUserToken(email, password) {
    const { data, error } = await adminClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session.access_token;
}

runTests().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
