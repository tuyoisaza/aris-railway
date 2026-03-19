
import { supabaseAdmin } from './server/db.js';

async function testBackendFeatures() {
    const EPOCH = Date.now();
    const TEST_EMAIL = `feature_test_${EPOCH}@gmail.com`;
    const TEST_PASSWORD = 'Password123!';
    const API_URL = 'http://localhost:3000/api';

    console.log(`\n=== 1. Setup: Creating Admin User (${TEST_EMAIL}) ===`);
    let userId;
    let sessionToken;

    try {
        // A. Signup
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Admin Tester' })
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
        userId = signupData.user.id;

        // B. Confirm Email & Promote to Admin
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
        );
        if (updateError) throw new Error(`Confirm failed: ${updateError.message}`);

        const { error: roleError } = await supabaseAdmin
            .from('users')
            .update({ role: 'admin' }) // Promote to admin
            .eq('id', userId);

        if (roleError) throw new Error(`Role update failed: ${roleError.message}`);
        console.log('User confirmed and promoted to Admin.');

        // C. Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        sessionToken = loginData.session.access_token;
        console.log('Login Successful.');

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
        };

        // === 2. Topics (Learning Map) ===
        console.log('\n=== 2. Testing Learning Map (Topics) ===');
        const graphRes = await fetch(`${API_URL}/topics/graph`, { headers: authHeaders });
        const graphData = await graphRes.json();
        if (!graphRes.ok) throw new Error(`Graph fetch failed: ${JSON.stringify(graphData)}`);

        console.log(`Graph fetched: ${graphData.nodes?.length || 0} nodes, ${graphData.links?.length || 0} links.`);

        // === 3. Projects ===
        console.log('\n=== 3. Testing Projects ===');
        // Create Project
        const projRes = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                userId: userId,
                title: `Test Project ${EPOCH}`,
                whyICare: 'To test the system',
                intent: 'Verify API'
            })
        });
        const projData = await projRes.json();
        if (!projRes.ok) throw new Error(`Create Project failed: ${JSON.stringify(projData)}`);
        console.log('Project Created:', projData.title);

        // List Projects
        const listProjRes = await fetch(`${API_URL}/projects/${userId}`, { headers: authHeaders });
        const listProjData = await listProjRes.json();
        console.log(`Projects List: Found ${listProjData.length} projects.`);

        // === 4. Admin Console ===
        console.log('\n=== 4. Testing Admin Console ===');

        // Services Status
        const servicesRes = await fetch(`${API_URL}/admin/services`, { headers: authHeaders });
        const servicesData = await servicesRes.json();
        if (!servicesRes.ok) throw new Error(`Admin Services failed: ${JSON.stringify(servicesData)}`);
        console.log(`Services status checked: ${servicesData.length} services monitored.`);

        // Badges List
        const badgesRes = await fetch(`${API_URL}/admin/badges`, { headers: authHeaders });
        const badgesData = await badgesRes.json();
        if (!badgesRes.ok) throw new Error(`Admin Badges failed: ${JSON.stringify(badgesData)}`);
        console.log(`Badges fetched: ${badgesData.length} existing badges.`);

        console.log('\n=== SUCCESS: Backend Features (Topics, Projects, Admin) Verified ===');

    } catch (err) {
        console.error('\nFAILURE:', err.message);
        process.exit(1);
    }
}

testBackendFeatures();
