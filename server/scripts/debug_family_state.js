require('dotenv').config();
const { supabaseAdmin } = require('../db');

async function debugFamilyState() {
    console.log('[Debug] Fetching Families...');
    
    // 1. Get all families
    const { data: families, error: famError } = await supabaseAdmin
        .from('families')
        .select('*');

    if (famError) {
        console.error('Error fetching families:', famError);
        return;
    }

    console.log(`Found ${families.length} families:`);
    families.forEach(f => console.log(`- [${f.id}] ${f.name} (Created: ${f.created_at})`));

    // 2. Get all members
    console.log('\n[Debug] Fetching Family Members...');
    const { data: members, error: memError } = await supabaseAdmin
        .from('family_members')
        .select('*, users(name, email)');

    if (memError) {
        console.error('Error fetching members:', memError);
        return;
    }

    console.log(`Found ${members.length} memberships:`);
    members.forEach(m => {
        const familyName = families.find(f => f.id === m.family_id)?.name || 'Unknown';
        console.log(`- User: ${m.users?.name} (${m.users?.email}) -> Family: ${familyName} [${m.role}]`);
    });

    // 3. Check specific "Isaza" case
    const isaza = families.find(f => f.name.includes('Isaza'));
    if (isaza) {
        console.log('\n[Debug] Isaza Family Analysis:');
        const isazaMembers = members.filter(m => m.family_id === isaza.id);
        if (isazaMembers.length === 0) {
            console.warn('WARNING: Isaza Family has NO members.');
        } else {
            console.log('Members:', isazaMembers.map(m => m.users?.name).join(', '));
        }
    } else {
        console.warn('\nWARNING: "Isaza Family" NOT found in DB.');
    }
}

debugFamilyState();
