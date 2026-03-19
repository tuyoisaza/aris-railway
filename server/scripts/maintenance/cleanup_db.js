
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env from current directory (server/)
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDatabase() {
    const email = 'thetboard@gmail.com';
    console.log(`Cleaning database for ${email}...`);

    // 1. Get User ID
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);

    if (userError || !users.length) {
        console.error('User not found or error:', userError);
        return;
    }

    const userId = users[0].id;
    console.log(`Found User ID: ${userId}`);

    // 2. Find Family Memberships
    const { data: members, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId);

    if (memberError) {
        console.error('Error fetching members:', memberError);
        return;
    }

    const familyIds = members.map(m => m.family_id);
    console.log(`Found ${familyIds.length} family memberships to remove.`);

    // 3. Delete Memberships
    if (familyIds.length > 0) {
        // Delete ALL memberships for these families to clean them up completely?
        // Or just the user's?
        // If the user created them, they are likely the only member.
        // Let's delete the user's membership first.

        const { error: delMemberError } = await supabase
            .from('family_members')
            .delete()
            .eq('user_id', userId);

        if (delMemberError) console.error('Error deleting members:', delMemberError);
        else console.log('Deleted memberships.');

        // 4. Delete Families
        const { error: delFamilyError } = await supabase
            .from('families')
            .delete()
            .in('id', familyIds);

        if (delFamilyError) console.error('Error deleting families:', delFamilyError);
        else console.log(`Deleted ${familyIds.length} families.`);
    }

    // 5. Also reset user plan to 'free' so the UI state matches "No Family"
    const { error: updateError } = await supabase
        .from('users')
        .update({ plan: 'free' })
        .eq('id', userId);

    if (updateError) console.error('Error resetting user plan:', updateError);
    else console.log('Reset user plan to free.');

    console.log('Database cleanup complete.');
}

cleanDatabase();
