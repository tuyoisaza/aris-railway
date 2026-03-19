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
    console.log("Starting Pet Projects Feature Verification...");

    // 1. Setup Test Users
    console.log("\n[1] Setting up test users...");
    const emailChild = `childopt_${Date.now()}@test.com`;
    const emailParent = `parentopt_${Date.now()}@test.com`;
    const password = 'password123';

    // Helper to create user
    const createUser = async (email, name) => {
        const { data: { user }, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });
        if (error) throw error;
        // Insert into public users table if triggers don't handle it
        await adminClient.from('users').insert([{ id: user.id, email: email, name: name }]).select();
        return user;
    };

    const userChild = await createUser(emailChild, 'Child Project Tester');
    const userParent = await createUser(emailParent, 'Parent Project Tester');

    // Family Setup
    const { data: family } = await adminClient.from('families').insert([{ name: 'Project Test Family' }]).select().single();
    await adminClient.from('family_members').insert([
        { family_id: family.id, user_id: userChild.id, role: 'Child' },
        { family_id: family.id, user_id: userParent.id, role: 'Parent' }
    ]);
    console.log("    Users & Family created.");

    // Helper to get client
    const getClient = async (email) => {
        const { data, error } = await adminClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return createClient(SUPABASE_URL, process.env.SUPABASE_KEY, {
            global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
        });
    };

    const childClient = await getClient(emailChild);
    const parentClient = await getClient(emailParent);

    try {
        // 2. Project Creation (Child)
        console.log("\n[2] Testing Project Creation...");
        const { data: project, error: projErr } = await childClient.from('projects').insert({
            user_id: userChild.id,
            title: 'My Cool Robot',
            status: 'active',
            visibility: 'full_shared', // Allow parent to see artifacts
            intent: 'To restore faith in humanity',
            why_care: 'Because robots are cool'
        }).select().single();

        if (projErr) throw new Error(`Project Create Failed: ${projErr.message}`);
        console.log("    ✅ Project Created:", project.id);
        console.log("       Intent:", project.intent);

        // 3. Artifacts (Child adds)
        console.log("\n[3] Testing Artifacts...");
        const { data: artifact, error: artErr } = await childClient.from('project_artifacts').insert({
            project_id: project.id,
            name: 'Robot Schematic',
            type: 'link',
            content: 'http://example.com/schematic.pdf'
        }).select().single();

        if (artErr) throw new Error(`Artifact Create Failed: ${artErr.message}`);
        console.log("    ✅ Artifact Created:", artifact.id);

        // Verify Parent Read Artifact
        const { data: parentReadArt, error: pReadArtErr } = await parentClient.from('project_artifacts').select('*').eq('id', artifact.id).single();
        if (pReadArtErr) throw new Error(`Parent Read Artifact Failed: ${pReadArtErr.message}`);
        if (parentReadArt) console.log("    ✅ Parent can see artifact (Shared Visibility).");

        // 4. Reflections (Child adds, Private)
        console.log("\n[4] Testing Reflections (Privacy)...");
        const { data: reflection, error: refErr } = await childClient.from('project_reflections').insert({
            project_id: project.id,
            content: 'I am struggling with the servo motors.',
            is_private: true
        }).select().single();

        if (refErr) throw new Error(`Reflection Create Failed: ${refErr.message}`);
        console.log("    ✅ Reflection Created:", reflection.id);

        // Verify Parent CANNOT Read Reflection
        const { data: parentReadRef, error: pReadRefErr } = await parentClient.from('project_reflections').select('*').eq('id', reflection.id).maybeSingle();
        if (!parentReadRef) {
            console.log("    ✅ Parent CANNOT see private reflection (Expected).");
        } else {
            console.error("    ❌ FAILURE: Parent SAW private reflection!");
            throw new Error("Privacy Leak on Reflections");
        }

        // 5. Comments (Parent adds)
        console.log("\n[5] Testing Comments...");
        const { data: comment, error: commErr } = await parentClient.from('project_comments').insert({
            project_id: project.id,
            user_id: userParent.id, // Parent commenting
            content: 'Keep going! You can do it!'
        }).select().single();

        if (commErr) throw new Error(`Comment Create Failed: ${commErr.message}`);
        console.log("    ✅ Comment Created by Parent:", comment.id);

        // Verify Child Read Comment
        const { data: childReadComm, error: cReadCommErr } = await childClient.from('project_comments').select('*').eq('id', comment.id).single();
        if (cReadCommErr) throw new Error(`Child Read Comment Failed: ${cReadCommErr.message}`);
        if (childReadComm) console.log("    ✅ Child can see parent comment.");

    } catch (err) {
        console.error("\n❌ TEST SUITE FAILED");
        console.error(err);
        process.exit(1);
    } finally {
        // Cleanup
        console.log("\n[6] Cleanup...");
        await adminClient.auth.admin.deleteUser(userChild.id);
        await adminClient.auth.admin.deleteUser(userParent.id);
        // Cascading delete should handle the rest
        console.log("    Users deleted.");
    }

    console.log("\n✅ VERIFICATION COMPLETE: ALL FEATURES WORKING.");
}

runTests().catch(e => {
    console.error("Unexpected Error:", e);
    process.exit(1);
});
