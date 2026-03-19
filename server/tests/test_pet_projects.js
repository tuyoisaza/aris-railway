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
    console.log("Starting Pet Projects Verification...");

    // 1. Setup Test Users
    console.log("\n[1] Setting up test users...");
    const emailChild = `child_${Date.now()}@test.com`;
    const emailParent = `parent_${Date.now()}@test.com`;
    const password = 'password123';

    const { data: { user: userChild }, error: errChild } = await adminClient.auth.admin.createUser({ email: emailChild, password, email_confirm: true });
    if (errChild) throw errChild;
    const { data: { user: userParent }, error: errParent } = await adminClient.auth.admin.createUser({ email: emailParent, password, email_confirm: true });
    if (errParent) throw errParent;

    console.log(`    Child: ${userChild.id}`);
    console.log(`    Parent: ${userParent.id}`);

    // Create public profiles (mocking what backend usually does)
    await adminClient.from('users').insert([{ id: userChild.id, email: emailChild, name: 'Child Test' }]);
    await adminClient.from('users').insert([{ id: userParent.id, email: emailParent, name: 'Parent Test' }]);

    // Create Family Connection
    console.log("\n[2] Creating Family Connection...");
    const { data: family, error: famErr } = await adminClient.from('families').insert([{ name: 'Test Family' }]).select().single();
    if (famErr) throw famErr;

    await adminClient.from('family_members').insert([
        { family_id: family.id, user_id: userChild.id, role: 'Child' },
        { family_id: family.id, user_id: userParent.id, role: 'Parent' }
    ]);
    console.log("    Family link established.");

    // Clients
    const childClient = createClient(SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${await getUserToken(emailChild, password)}` } }
    });

    const parentClient = createClient(SUPABASE_URL, process.env.SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${await getUserToken(emailParent, password)}` } }
    });

    // 2. Child Creates Project
    console.log("\n[3] Child Creating Project...");
    const { data: project, error: projErr } = await childClient.from('projects').insert({
        user_id: userChild.id,
        title: 'Secret Base',
        why_care: 'Fun',
        intent: 'Build it',
        status: 'idea',
        visibility: 'private'
    }).select().single();

    if (projErr) throw projErr;
    console.log(`    Project Created: ${project.id} (Visibility: ${project.visibility})`);

    // 3. Child Adds Artifacts & Reflections
    console.log("\n[4] Child Adding Content...");
    const { data: artifact, error: artErr } = await childClient.from('project_artifacts').insert({
        project_id: project.id,
        name: 'Plan v1',
        type: 'text',
        content: 'Sketch of the base'
    }).select().single();
    if (artErr) throw artErr;

    const { data: reflection, error: refErr } = await childClient.from('project_reflections').insert({
        project_id: project.id,
        content: 'I need wood.'
    }).select().single();
    if (refErr) throw refErr;
    console.log("    Artifact & Reflection added.");

    // 4. Verify Parent Visibility (Private)
    console.log("\n[5] Testing Parent Visibility (Private Mode)...");
    const { data: parentViewProject } = await parentClient.from('projects').select('*').eq('id', project.id).single();
    if (!parentViewProject) console.error("    FAIL: Parent should see project metadata.");
    else console.log("    PASS: Parent sees project title.");

    const { data: parentViewArtifacts } = await parentClient.from('project_artifacts').select('*').eq('project_id', project.id);
    if (parentViewArtifacts && parentViewArtifacts.length > 0) console.error("    FAIL: Parent should NOT see artifacts in private mode.");
    else console.log("    PASS: Parent cannot see private artifacts.");

    // 5. Change Visibility to Shared
    console.log("\n[6] Child Sharing Project...");
    await childClient.from('projects').update({ visibility: 'full_shared' }).eq('id', project.id);
    console.log("    Visibility set to 'full_shared'.");

    // 6. Verify Parent Visibility (Shared)
    console.log("\n[7] Testing Parent Visibility (Shared Mode)...");
    const { data: sharedArtifacts } = await parentClient.from('project_artifacts').select('*').eq('project_id', project.id);
    if (sharedArtifacts && sharedArtifacts.length > 0) console.log("    PASS: Parent can now see artifacts.");
    else console.error("    FAIL: Parent SHOULD see artifacts now.");

    // 7. Verify Reflection Privacy (Always Private)
    console.log("\n[8] Testing Reflection Privacy...");
    const { data: sharedReflections } = await parentClient.from('project_reflections').select('*').eq('project_id', project.id);
    if (sharedReflections && sharedReflections.length > 0) console.error("    FAIL: Parent seeing private reflections!");
    else console.log("    PASS: Reflections remain private.");

    // Cleanup
    console.log("\n[9] Cleanup...");
    await adminClient.auth.admin.deleteUser(userChild.id);
    await adminClient.auth.admin.deleteUser(userParent.id);
    console.log("    Test users deleted.");

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
