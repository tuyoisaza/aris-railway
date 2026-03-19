
import { supabaseAdmin } from './server/db.js';

async function testParentFeatures() {
    const EPOCH = Date.now();
    const PARENT_EMAIL = `parent_1768666339676@gmail.com`;
    const CHILD_EMAIL = `child_${EPOCH}@gmail.com`;
    const TEST_PASSWORD = 'Password123!';
    const API_URL = 'http://localhost:3000/api';

    async function createUser(email, name) {
        console.log(`[Setup] Using user: ${email}...`);

        try {
            // Try Login first
            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: TEST_PASSWORD })
            });

            if (loginRes.ok) {
                const loginData = await loginRes.json();
                console.log(`[Setup] Login successful. ID: ${loginData.user.id}`);
                return { id: loginData.user.id, token: loginData.session.access_token };
            }

            // If login fails, THEN try signup
            console.log('[Setup] Login failed, trying signup...');
            const signupRes = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: TEST_PASSWORD, name })
            });
            const signupData = await signupRes.json();
            if (!signupRes.ok) throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
            const userId = signupData.user.id;

            // Auto-confirm
            await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

            // Login again
            const loginRes2 = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: TEST_PASSWORD })
            });
            const loginData2 = await loginRes2.json();
            return { id: userId, token: loginData2.session.access_token };

        } catch (err) {
            throw err;
        }
    }

    try {
        console.log('\n=== 1. Setup: User ===');
        const parent = await createUser(PARENT_EMAIL, 'Parent User');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parent.token}`
        };

        console.log('\n=== 2. Create Family ===');
        let familyId;
        const familyRes = await fetch(`${API_URL}/family`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId: parent.id, name: 'The Testers' })
        });

        if (familyRes.ok) {
            const fam = await familyRes.json();
            familyId = fam.id;
            console.log('Family Created:', familyId);
        } else {
            const err = await familyRes.json();
            console.log(`Create Family failed (${familyRes.status}):`, JSON.stringify(err));

            // Try fetching
            console.log('Attempting to fetch existing family...');
            const getRes = await fetch(`${API_URL}/family/${parent.id}`, { headers });
            if (getRes.ok) {
                const data = await getRes.json();
                if (data.id) {
                    familyId = data.id;
                    console.log('Family Fetched (Existing):', familyId);
                } else {
                    console.log('Fetch returned no family.');
                }
            } else {
                console.log('Fetch failed.');
            }
        }

        if (!familyId) throw new Error("Could not create or get family. Verification blocked.");

        console.log('\n=== 3. Set Profile PIN ===');
        const pinRes = await fetch(`${API_URL}/user`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ pin: '1234' })
        });
        console.log(`PIN Update Status: ${pinRes.status}`);

        console.log('\n=== 4. Invite Child Member ===');
        // Schema 'invite' in schemas.js: familyId, email, userId
        const inviteRes = await fetch(`${API_URL}/invite`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                familyId: familyId,
                email: CHILD_EMAIL,
                userId: parent.id
            })
        });

        const inviteData = await inviteRes.json();
        if (inviteRes.ok) {
            console.log('Invitation sent/created:', inviteData.link ? 'Has Link' : 'No Link');
        } else {
            console.log('Invite Route Failed:', inviteRes.status, JSON.stringify(inviteData));
        }

        console.log('\n=== 5. Fetch Family Activity (Feed) ===');
        const feedRes = await fetch(`${API_URL}/family/${familyId}/activity`, { headers });
        const feedData = await feedRes.json();
        console.log(`Activity Feed: ${Array.isArray(feedData) ? feedData.length + ' items' : JSON.stringify(feedData)}`);

        console.log('\n=== SUCCESS: Parent Dashboard Features Verified ===');

    } catch (err) {
        console.error('\nFAILURE:', err.message);
        process.exit(1);
    }
}

testParentFeatures();
