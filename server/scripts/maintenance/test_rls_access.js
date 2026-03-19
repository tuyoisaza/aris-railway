const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Client simulation
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY // ANON KEY
);

async function testRLS() {
    console.log("--- TESTING CLIENT RLS ACCESS ---");
    const email = 'thetboard@gmail.com';
    const password = 'Password123!';

    // 1. Login
    console.log(`Logging in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email, password
    });

    if (authError) {
        console.error("LOGIN FAILED:", authError.message);
        return;
    }
    console.log("Login Success. User ID:", authData.user.id);

    // 2. Fetch Family Members (Simulating what backend does via req.userClient OR what client does)
    // Wait, the backend uses req.userClient. 
    // This script tests DIRECT Supabase access. 
    // If the app uses API endpoints, we should test the API.
    // But testing DB access confirms RLS is safe/working.

    console.log("Attempting to read 'family_members'...");
    const { data: members, error: memError } = await supabase
        .from('family_members')
        .select('*, families(*)');

    if (memError) {
        console.error("READ FAILED:", memError.message);
        console.error("Details:", memError.details);
        console.error("Hint:", memError.hint);
    } else {
        console.log("READ SUCCESS. Rows:", members?.length);
        if (members?.length > 0) {
            console.log(JSON.stringify(members, null, 2));
        }
    }
}

testRLS();
