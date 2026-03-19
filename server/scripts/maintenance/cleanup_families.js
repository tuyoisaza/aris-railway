const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function cleanup() {
    console.log("--- CLEANING UP DUPLICATE FAMILIES ---");
    const email = 'thetboard@gmail.com';

    // 1. Get User
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) return console.log("User not found");

    // 2. Identify Spam IDs
    const { data: members } = await supabaseAdmin
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id);

    const keepFamilyName = 'Isaza Family';
    const toDeleteIds = [];

    members.forEach(m => {
        if (m.families.name !== keepFamilyName) {
            console.log(`Marking for deletion: ${m.families.name} (${m.family_id})`);
            toDeleteIds.push(m.family_id);
        } else {
            console.log(`KEEPING: ${m.families.name} (${m.family_id})`);
        }
    });

    if (toDeleteIds.length === 0) {
        console.log("Nothing to delete.");
        return;
    }

    // 3. Delete
    // Delete members first (cascade usually handles this but let's be safe)
    const { error: memErr } = await supabaseAdmin
        .from('family_members')
        .delete()
        .in('family_id', toDeleteIds);

    if (memErr) console.error("Error deleting members:", memErr);
    else console.log("Deleted spam members.");

    // Delete families
    const { error: famErr } = await supabaseAdmin
        .from('families')
        .delete()
        .in('id', toDeleteIds);

    if (famErr) console.error("Error deleting families:", famErr);
    else console.log("Deleted spam families.");
}

cleanup();
