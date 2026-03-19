const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function check() {
    console.log("--- CHECKING FAMILY MEMBERSHIP ---");
    const email = 'thetboard@gmail.com';

    // 1. Get User
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.log("User NOT FOUND");
        return;
    }
    console.log(`User ID: ${user.id}`);

    // 2. Check Family Members
    const { data: members, error } = await supabaseAdmin
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id);

    if (error) console.error("Error:", error);

    if (members && members.length > 0) {
        console.log("Membership Found:", JSON.stringify(members, null, 2));
    } else {
        console.log("NO FAMILY MEMBERSHIP FOUND for this user.");
    }
}

check();
