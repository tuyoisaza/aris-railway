const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PARENT_EMAIL = 'Thetboard@gmail.com';
const CHILD_EMAIL = 'tuyo@tuyoisaza.com';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyRoles() {
    console.log("Verifying Roles...");

    const checkUser = async (email) => {
        // Find user by email (pagination safe logic or just search public users which is faster)
        const { data: user } = await adminClient.from('users').select('id, name').ilike('email', email).single();

        if (!user) {
            console.log(`❌ User ${email} not found in public 'users' table.`);
            return;
        }

        const { data: memberships } = await adminClient.from('family_members')
            .select('role, families(name)')
            .eq('user_id', user.id);

        if (memberships && memberships.length > 0) {
            memberships.forEach(m => {
                console.log(`User: ${email} (${user.name}) | Role: ${m.role} | Family: ${m.families?.name}`);
            });
        } else {
            console.log(`User: ${email} has NO family memberships.`);
        }
    };

    await checkUser(PARENT_EMAIL);
    await checkUser(CHILD_EMAIL);
}

verifyRoles().catch(console.error);
