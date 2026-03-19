const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PARENT_EMAIL = 'Thetboard@gmail.com';
const CHILD_EMAIL = 'tuyo@tuyoisaza.com';
const FAMILY_NAME = 'Isaza Family';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalSync() {
    console.log("Finalizing Family Sync...");

    // 1. Get Target Family (should be the one just created or found)
    const { data: family } = await adminClient.from('families').select('id').eq('name', FAMILY_NAME).order('created_at', { ascending: false }).limit(1).single();

    if (!family) {
        console.error("Critical: Target Family not found even after cleanup!");
        return;
    }
    console.log(`Target Family: ${family.id}`);

    // 2. Get Users
    const getUser = async (email) => {
        let page = 1;
        while (page < 10) {
            const { data: { users } } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
            if (!users) break;
            const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
            if (u) return u;
            page++;
        }
        return null;
    };

    const parent = await getUser(PARENT_EMAIL);
    const child = await getUser(CHILD_EMAIL);

    if (!parent || !child) { console.error("Missing users for sync."); return; }

    // 3. Upsert Memberships
    const upsertMember = async (user, role) => {
        // First delete any other memberships to be clean
        await adminClient.from('family_members').delete().eq('user_id', user.id).neq('family_id', family.id);

        // Upsert correct one
        const { error } = await adminClient.from('family_members').upsert({
            family_id: family.id,
            user_id: user.id,
            role: role,
            active: true
        }, { onConflict: 'family_id, user_id' });

        if (error) console.error(`Error linking ${role}:`, error.message);
        else console.log(`✅ Linked ${role} (${user.email}) to family.`);
    };

    await upsertMember(parent, 'Parent');
    await upsertMember(child, 'Child');

    console.log("Sync Complete.");
}

finalSync().catch(console.error);
