const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TARGET_EMAIL = 'tuyo@tuyoisaza.com';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing credentials.");
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTest() {
    console.log(`🚀 Starting Test Run for ${TARGET_EMAIL}...`);

    // 1. Get User
    let { data: user } = await adminClient.from('users').select('id').eq('email', TARGET_EMAIL).single();
    if (!user) {
        // Fallback search
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const authUser = users.find(u => u.email === TARGET_EMAIL);
        if (!authUser) {
            console.error("❌ User not found.");
            return;
        }
        user = { id: authUser.id };
    }
    console.log(`✅ Found User: ${user.id}`);

    // 2. Create 1 Folder (Conversation with title)
    // "Folders" in Aris (based on prev context) seem to be just conversations.
    const { data: folder, error: folderErr } = await adminClient
        .from('conversations')
        .insert({
            user_id: user.id,
            title: 'Test Folder 📁',
            created_at: new Date()
        })
        .select()
        .single();

    if (folderErr) console.error("❌ Folder Error:", folderErr.message);
    else console.log(`✅ Created Folder: "${folder.title}" (${folder.id})`);

    // 3. Create 1 Active Conversation (with message)
    const { data: chat, error: chatErr } = await adminClient
        .from('conversations')
        .insert({
            user_id: user.id,
            title: 'Active Chat 💬',
            created_at: new Date()
        })
        .select()
        .single();

    if (chatErr) {
        console.error("❌ Chat Error:", chatErr.message);
    } else {
        console.log(`✅ Created Conversation: "${chat.title}" (${chat.id})`);
        // Add a message
        await adminClient.from('messages').insert({
            conversation_id: chat.id,
            role: 'user',
            content: 'Hello Aris, this is a test run!'
        });
        await adminClient.from('messages').insert({
            conversation_id: chat.id,
            role: 'ai',
            content: 'Hello! I am ready for the test.'
        });
        console.log("   Added messages.");
    }

    // 4. Create 1 Project
    const { data: project, error: projErr } = await adminClient
        .from('projects')
        .insert({
            user_id: user.id,
            title: 'Test Project 🚀',
            status: 'active',
            why_care: 'Testing the system',
            visibility: 'private'
        })
        .select()
        .single();

    if (projErr) console.error("❌ Project Error:", projErr.message);
    else console.log(`✅ Created Project: "${project.title}" (${project.id})`);

    // 5. Create 1 Family Member
    // First need family ID
    const { data: member } = await adminClient.from('family_members').select('family_id').eq('user_id', user.id).maybeSingle();
    let familyId = member?.family_id;

    if (!familyId) {
        console.log("   User has no family, creating one...");
        const { data: fam } = await adminClient.from('families').insert({ name: 'Isaza Family' }).select().single();
        familyId = fam.id;
        // Link user
        await adminClient.from('family_members').insert({ family_id: familyId, user_id: user.id, role: 'Parent' });
    }

    // Add new dummy member
    const newEmail = `cousin_${Date.now()}@test.com`;
    const { data: newUser, error: uErr } = await adminClient.auth.admin.createUser({
        email: newEmail,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { name: 'Test Cousin' }
    });

    if (uErr) {
        console.error("❌ Member Creation Error:", uErr.message);
    } else {
        await adminClient.from('users').insert({
            id: newUser.user.id,
            email: newEmail,
            name: 'Test Cousin'
        });

        const { error: memErr } = await adminClient.from('family_members').insert({
            family_id: familyId,
            user_id: newUser.user.id,
            role: 'Child', // or cousin? Schema usually Parent/Child.
            active: true
        });

        if (memErr) console.error("❌ Member Link Error:", memErr.message);
        else console.log(`✅ Created & Linked Family Member: "Test Cousin" (${newEmail})`);
    }

    console.log("\n✨ Test Run Complete!");
}

runTest().catch(console.error);
