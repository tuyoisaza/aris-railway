const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const USERS_TO_RESET = [
    'thetboard@gmail.com',
    'tuyo@tuyoisaza.com'
];

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function hardReset() {
    console.log("⚠️  STARTING HARD RESET FOR USERS: ", USERS_TO_RESET);

    // 1. Find User IDs
    const userIds = [];
    for (const email of USERS_TO_RESET) {
        let { data: user } = await adminClient.from('users').select('id').eq('email', email).single();

        // Fallback to Auth search if not in public table
        if (!user) {
            let page = 1;
            let foundAuth = null;
            while (!foundAuth && page < 20) { // Safety limit
                const { data: { users } } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
                if (!users || users.length === 0) break;
                foundAuth = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                page++;
            }
            if (foundAuth) user = { id: foundAuth.id };
        }

        if (user) {
            console.log(`✅ Found User: ${email} -> ${user.id}`);
            userIds.push(user.id);
        } else {
            console.warn(`⚠️  User not found: ${email}`);
        }
    }

    if (userIds.length === 0) {
        console.log("No users found to reset. Exiting.");
        return;
    }

    // 2. Find Families Related to Users
    // We want to delete families where these users are members, to ensure "start from zero"
    const { data: memberships } = await adminClient
        .from('family_members')
        .select('family_id')
        .in('user_id', userIds);

    const familyIds = [...new Set(memberships.map(m => m.family_id))];
    console.log(`Found ${familyIds.length} related families to wipe.`);

    // 3. Delete Data (Order Matters for Foreign Keys)

    // A. Delete Memberships (Unlink users)
    const { error: memErr } = await adminClient
        .from('family_members')
        .delete()
        .in('user_id', userIds);
    if (memErr) console.error("Error deleting memberships:", memErr);
    else console.log("🗑️  Deleted family memberships.");

    // B. Delete Families (If we identified them)
    if (familyIds.length > 0) {
        const { error: famErr } = await adminClient
            .from('families')
            .delete()
            .in('id', familyIds);
        if (famErr) console.error("Error deleting families:", famErr); // Might fail if other members exist?
        else console.log(`🗑️  Deleted ${familyIds.length} families.`);
    }

    // C. Delete Conversations (Global Sweep to be sure)
    console.log("⚠️  Deleting ALL conversation data...");
    const { error: msgErr } = await adminClient.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All Messages first (though cascade handles this)
    const { error: convErr } = await adminClient.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All Conversations

    if (convErr) console.error("Error deleting conversations:", convErr);
    else console.log("🗑️  Deleted ALL Conversations (Folders).");

    // D. Delete Projects
    const { error: projErr } = await adminClient
        .from('projects')
        .delete()
        .in('user_id', userIds);
    if (projErr) console.error("Error deleting projects:", projErr);
    else console.log("🗑️  Deleted projects (and artifacts via cascade).");

    // E. Delete Progress
    const { error: progErr } = await adminClient
        .from('user_topic_progress')
        .delete()
        .in('user_id', userIds);
    if (progErr) console.error("Error deleting topic progress:", progErr);
    else console.log("🗑️  Deleted topic progress.");

    // X. DELETE GLOBAL TOPICS (User Request: "Still see topics")
    // WARNING: This clears topics for everyone, but matches "Start from Zero" on single-tenant dev.
    console.log("⚠️  Deleting Global Topics & Resources...");

    // Resources depend on topics
    const { error: resErr } = await adminClient.from('resources').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All
    if (resErr) console.error("Error deleting resources:", resErr);

    const { error: topErr } = await adminClient.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All
    if (topErr) console.error("Error deleting topics:", topErr);
    else console.log("🗑️  Deleted ALL Global Topics.");

    // F. Delete Invitations (Sent by OR sent to)
    const { error: invErr1 } = await adminClient
        .from('invitations')
        .delete()
        .in('created_by', userIds);

    // For sent-to, we match by email
    const { error: invErr2 } = await adminClient
        .from('invitations')
        .delete()
        .in('email', USERS_TO_RESET);

    if (invErr1 || invErr2) console.error("Error deleting invitations.");
    else console.log("🗑️  Deleted invitations.");

    // 4. Reset User Metadata (Plan -> Free)
    // This allows them to create a new family flow if the UI checks plan or family count
    const { error: updateErr } = await adminClient
        .from('users')
        .update({ plan: 'free' })
        .in('id', userIds);

    if (updateErr) console.error("Error resetting user plans:", updateErr);
    else console.log("✅ Reset user plans to 'free'.");

    console.log("\n✨ HARD RESET COMPLETE ✨");
    console.log("Users are preserved, but all their data is gone. They are ready to 'Start from Zero'.");
}

hardReset().catch(console.error);
