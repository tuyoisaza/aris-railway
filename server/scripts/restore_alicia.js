require('dotenv').config();
const { supabaseAdmin } = require('../db');

async function restoreAlicia() {
    console.log('[Restore] Starting Recovery...');

    // 1. Find the User
    const { data: users } = await supabaseAdmin.from('users').select('id, email').ilike('email', '%Thetboard@gmail.com%');
    const alicia = users[0];
    if (!alicia) throw new Error('Alicia not found');
    console.log(`User: ${alicia.id}`);

    // 2. Find ALL Isaza Families
    const { data: families } = await supabaseAdmin.from('families').select('id, name, created_at').ilike('name', '%Isaza Family%');
    console.log(`Found ${families.length} Isaza Families.`);

    // 3. Find which one has members
    let targetFamilyId = null;

    for (const fam of families) {
        const { count } = await supabaseAdmin
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', fam.id);

        console.log(`- Family [${fam.id}] has ${count} members.`);

        if (count > 0) {
            targetFamilyId = fam.id;
        }
    }

    if (!targetFamilyId) {
        console.warn('No populated Isaza Family found. Picking the oldest one to re-seed.');
        // Sort by created_at asc
        families.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        targetFamilyId = families[0].id; // The "Original"
    }

    console.log(`Targeting Family: ${targetFamilyId}`);

    // 4. Insert Alicia
    const { error: insertError } = await supabaseAdmin
        .from('family_members')
        .insert({
            family_id: targetFamilyId,
            user_id: alicia.id,
            role: 'Parent'
        });

    if (insertError) {
        if (insertError.code === '23505') { // Unique violation
            console.log('User is already in this family.');
        } else {
            console.error('Insert Failed:', insertError);
        }
    } else {
        console.log('✓ Alicia restored to Isaza Family.');
    }
}

restoreAlicia();
