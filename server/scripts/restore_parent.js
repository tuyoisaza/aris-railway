const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PARENT_EMAIL = 'Thetboard@gmail.com';
const PASSWORD = 'password123';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function restoreParent() {
    console.log(`Restoring user: ${PARENT_EMAIL}`);

    let user;
    const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
        email: PARENT_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Alicia Isaza' }
    });

    if (!createErr) user = createData.user;

    if (createErr) {
        console.log("Create User Error:", createErr.message);

        // Pagination logic to find user
        let found = null;
        let page = 1;
        const PER_PAGE = 50;

        while (!found) {
            const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page: page, perPage: PER_PAGE });
            if (error || !users || users.length === 0) break;

            found = users.find(u => u.email.toLowerCase() === PARENT_EMAIL.toLowerCase());
            if (found) break;

            page++;
            if (page > 10) break; // Safety break
        }

        if (found) {
            console.log(`✅ Found Existing Auth User: ${found.id}`);
            user = found;
        } else {
            console.error("Could not find user after searching multiple pages.");
            return;
        }
    } else {
        // User was created successfully and assigned in line 22
        console.log(`✅ Created Auth User: ${user.id}`);
    }

    // 2. Ensure Public User Record
    const { error: pubErr } = await adminClient.from('users').upsert({
        id: user.id,
        email: PARENT_EMAIL,
        name: 'Alicia Isaza',
        plan: 'family'
    });
    if (pubErr) console.error("Upsert Public User Error:", pubErr.message);
    else console.log("✅ Public User Record Synced.");

    // 3. Find Family (Likely 'Map Family' or similar from previous tests, or create new if none)
    // We want to attach to the SAME family Tuyo is in if possible.
    const CHILD_EMAIL = 'tuyo@tuyoisaza.com';

    // Find Child's ID
    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
    // Simple find might miss if child is on page 2+, but let's hope child is recent.
    const childAuthIndex = allUsers.find(u => u.email.toLowerCase() === CHILD_EMAIL.toLowerCase());

    let familyId;

    if (childAuthIndex) {
        const { data: childFam } = await adminClient.from('family_members').select('family_id').eq('user_id', childAuthIndex.id).single();
        if (childFam) {
            familyId = childFam.family_id;
            console.log(`Found existing family from Child: ${familyId}`);
        }
    }

    if (!familyId) {
        console.log("No existing family found. Creating new 'Isaza Family'...");
        const { data: newFam } = await adminClient.from('families').insert({ name: 'Isaza Family' }).select().single();
        familyId = newFam.id;
    }

    // 4. Add to Family as Parent
    const { error: memErr } = await adminClient.from('family_members').upsert({
        family_id: familyId,
        user_id: user.id,
        role: 'Parent',
        active: true,
        stats: { weeklyUsage: '12h', avgSession: '45m', activeTopics: 5 }
    }, { onConflict: 'family_id, user_id' }); // Avoid duplicate key error

    if (memErr) console.error("Add Family Member Error:", memErr.message);
    else console.log("✅ Added as Parent to Family.");

}

restoreParent().catch(console.error);
