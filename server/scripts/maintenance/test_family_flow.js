const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

// Config
const API_URL = 'http://localhost:3000/api';
const PARENT_EMAIL = 'verified_1766891636737@example.com';
const PARENT_PASSWORD = 'Password123!';
const CHILD_EMAIL = `child_${Date.now()}@example.com`;
const CHILD_PASSWORD = 'Password123!';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function runTest() {
    console.log('--- STARTING FAMILY FLOW TEST ---');

    // 1. Login Parent
    console.log(`1. Logging in Parent (${PARENT_EMAIL})...`);
    const parentLogin = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: PARENT_EMAIL, password: PARENT_PASSWORD })
    });

    if (!parentLogin.ok) {
        throw new Error(`Parent Login Failed: ${parentLogin.statusText} - ${await parentLogin.text()}`);
    }
    const parentData = await parentLogin.json();
    const parentToken = parentData.session.access_token;
    console.log(`   Success. Token: ${parentToken.substring(0, 15)}...`);

    // 2. Create Family
    console.log('2. Creating Family...');
    const familyRes = await fetch(`${API_URL}/family`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({
            userId: parentData.user.id,
            name: 'Integration Test Family'
        })
    });

    let familyId;
    if (familyRes.ok) {
        const family = await familyRes.json();
        familyId = family.id;
        console.log(`   Family Created: ${familyId}`);
    } else {
        const err = await familyRes.text();
        console.log(`   Family creation returned: ${familyRes.status} (Might already exist: ${err})`);

        // Fetch existing family
        const { data: families } = await supabaseAdmin
            .from('family_members')
            .select('family_id')
            .eq('user_id', parentData.user.id)
            .single();

        if (families) {
            familyId = families.family_id;
            console.log(`   Using existing family: ${familyId}`);
        } else {
            throw new Error('Could not find existing family');
        }
    }

    // 3. Invite Child
    console.log(`3. Inviting Child (${CHILD_EMAIL})...`);
    const inviteRes = await fetch(`${API_URL}/invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({
            userId: parentData.user.id,
            familyId: familyId,
            email: CHILD_EMAIL
        })
    });

    if (!inviteRes.ok) {
        throw new Error(`Invite Failed: ${await inviteRes.text()}`);
    }
    console.log('   Invite sent.');

    // 4. Get Invite Token (Admin Bypass)
    console.log('4. Fetching Invite Token from DB...');
    const { data: invite, error: inviteError } = await supabaseAdmin
        .from('invitations')
        .select('*')
        .eq('email', CHILD_EMAIL)
        .single();

    if (inviteError || !invite) {
        throw new Error('Token not found in DB');
    }
    console.log(`   Token found: ${invite.token}`);

    // 5. Create Child User
    console.log('5. Creating Child User...');
    const { data: childUser, error: childError } = await supabaseAdmin.auth.admin.createUser({
        email: CHILD_EMAIL,
        password: CHILD_PASSWORD,
        email_confirm: true
    });

    if (childError) throw childError;
    console.log(`   Child created: ${childUser.user.id}`);

    // Login as Child to get token? 
    // Actually the accept endpoint requires `userId` + Token, AND requires Auth header (requireAuth).
    // So we need child token.
    console.log('6. Logging in Child...');
    const childLogin = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: CHILD_EMAIL, password: CHILD_PASSWORD })
    });

    if (!childLogin.ok) throw new Error('Child login failed');
    const childData = await childLogin.json();
    const childToken = childData.session.access_token;

    // 6. Accept Invite
    console.log('7. Accepting Invite...');
    const acceptRes = await fetch(`${API_URL}/invite/accept`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${childToken}`
        },
        body: JSON.stringify({
            userId: childUser.user.id,
            token: invite.token
        })
    });

    if (!acceptRes.ok) {
        throw new Error(`Accept Failed: ${await acceptRes.text()}`);
    }
    console.log('   Invite accepted!');

    // 7. Verification - Check Family Members
    console.log('8. Verifying Membership...');
    const { count } = await supabaseAdmin
        .from('family_members')
        .select('*', { count: 'exact' })
        .eq('family_id', familyId);

    console.log(`   Total Family Members: ${count}`);

    if (count < 2) throw new Error('Membership count incorrect (expected at least 2)');

    console.log('--- TEST PASSED ---');
}

runTest().catch(e => console.error('TEST FAILED:', e));
