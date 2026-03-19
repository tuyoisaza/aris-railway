const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PARENT_EMAIL = 'Thetboard@gmail.com';
const CHILD_EMAIL = 'tuyo@tuyoisaza.com';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function cleanupAndFix() {
    console.log("Starting Cleanup...");

    // 1. Fix Child Public User Record
    console.log("Checking Child User...");
    const { data: { users } } = await adminClient.auth.admin.listUsers();

    // Pagination safe search for child
    let childAuth = null;
    let page = 1;
    while (!childAuth && page < 10) {
        const { data: { users } } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
        childAuth = users.find(u => u.email.toLowerCase() === CHILD_EMAIL.toLowerCase());
        page++;
    }

    if (childAuth) {
        console.log(`Found Child Auth ID: ${childAuth.id}`);
        const { error: upsertErr } = await adminClient.from('users').upsert({
            id: childAuth.id,
            email: CHILD_EMAIL,
            name: 'Tuyo Isaza', // Best guess name
            plan: 'free',
            // role header 'child' is not in schema based on previous attempts, ignoring
        });
        if (upsertErr) console.error("Child Public Upsert Error:", upsertErr);
        else console.log("✅ Child Public User Synced.");
    } else {
        console.error("❌ Child Auth User NOT FOUND.");
    }

    // 2. Identify Target Family
    let { data: isazaFam } = await adminClient.from('families').select('id').ilike('name', '%Isaza%').maybeSingle();

    if (!isazaFam) {
        console.log("'Isaza Family' not found, checking for ANY family...");
        // This is tricky. If we rely on previous script, we might have just one good one.
        // Let's CREATE it if missing to be safe and authoritative.
        const { data: newFam } = await adminClient.from('families').insert({ name: 'Isaza Family' }).select().single();
        isazaFam = newFam;
        console.log(`Created New Family: ${isazaFam.id}`);
    } else {
        console.log(`Keep Family: ${isazaFam.id}`);
    }

    // 3. Find Parent ID
    // Re-using child loop logic for parent
    let parentAuth = null;
    page = 1;
    while (!parentAuth && page < 10) {
        const { data: { users } } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
        parentAuth = users.find(u => u.email.toLowerCase() === PARENT_EMAIL.toLowerCase());
        page++;
    }

    if (!parentAuth) { console.error("Parent Auth NOT FOUND."); return; }

    // 4. Cleanup Extra Families
    // Find all memberships for parent
    const { data: mems } = await adminClient.from('family_members').select('family_id, families(name)').eq('user_id', parentAuth.id);

    console.log(`Parent has ${mems.length} memberships.`);

    for (const mem of mems) {
        if (mem.family_id !== isazaFam.id) {
            console.log(`Removing from extra family: ${mem.families?.name} (${mem.family_id})`);
            // Delete membership
            await adminClient.from('family_members').delete().match({ family_id: mem.family_id, user_id: parentAuth.id });

            // Optionally delete family if empty? 
            // Ideally yes to clean DB.
            const { count } = await adminClient.from('family_members').select('*', { count: 'exact', head: true }).eq('family_id', mem.family_id);
            if (count === 0) {
                await adminClient.from('families').delete().eq('id', mem.family_id);
                console.log(`Deleted empty family: ${mem.family_id}`);
            }
        }
    }

    console.log("✅ Cleanup Complete.");
}

cleanupAndFix().catch(console.error);
