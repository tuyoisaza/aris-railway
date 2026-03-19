require('dotenv').config();
const { supabaseAdmin } = require('../db');

async function fixIsazaFamily() {
    console.log('[Fix] Starting Isaza Family Cleanup...');

    // 1. Find Alicia's User ID
    const { data: users, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .ilike('email', '%Thetboard@gmail.com%'); // Match verified email

    if (userError || !users.length) {
        console.error('Could not find Alicia user:', userError);
        return;
    }

    const alicia = users[0];
    console.log(`Target User: ${alicia.email} (${alicia.id})`);

    // 2. Find the Real "Isaza Family"
    const { data: families, error: famError } = await supabaseAdmin
        .from('families')
        .select('id, name')
        .ilike('name', '%Isaza Family%');

    if (famError || !families.length) {
        console.error('Could not find Isaza Family:', famError);
        return;
    }

    const isazaFamily = families[0];
    console.log(`Target Family: ${isazaFamily.name} (${isazaFamily.id})`);

    // 3. Find ALL memberships for Alicia
    const { data: memberships, error: memError } = await supabaseAdmin
        .from('family_members')
        .select('*')
        .eq('user_id', alicia.id);

    if (memError) {
        console.error('Error fetching memberships:', memError);
        return;
    }

    console.log(`Found ${memberships.length} memberships for Alicia.`);

    // 4. Identify Bad Memberships (NOT Isaza Family)
    const badMemberships = memberships.filter(m => m.family_id !== isazaFamily.id);
    const badIds = badMemberships.map(m => m.id);

    if (badIds.length > 0) {
        console.log(`Removing ${badIds.length} redundant memberships...`);

        const { error: delError } = await supabaseAdmin
            .from('family_members')
            .delete()
            .in('id', badIds);

        if (delError) {
            console.error('Data Cleanup Failed:', delError);
        } else {
            console.log('✓ Cleanup Complete. Redundant memberships removed.');
        }

        // Optional: Delete the orphaned families? 
        // We will skip that for now to be safe, just fixing the USER view is priority.
    } else {
        console.log('No redundant memberships found. User state is clean.');
    }
}

fixIsazaFamily();
