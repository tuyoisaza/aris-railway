
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

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

    console.log('Database cleanup complete.');
}

cleanDatabase();
