
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Admin Client (for cleanup/setup)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
// Public Client (for auth)
const supabasePublic = createClient(SUPABASE_URL, ANON_KEY);

function httpRequest(path, method, headers, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Backend Verification (Native HTTP)...');

    const testEmail = `test_${Date.now()}@example.com`;
    const testPass = 'Password123!';
    let token = '';
    let userId = '';

    // 1. SIGNUP
    console.log(`\n[1] Registering User(${testEmail})...`);
    // Admin Create to bypass email confirm
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPass,
        email_confirm: true,
        user_metadata: { full_name: 'Admin Created User' }
    });

    if (adminError) throw new Error('Admin Create Failed: ' + adminError.message);
    userId = adminUser.user.id;
    console.log('   ✅ User Created (Admin Bypass)');


    // 2. LOGIN (Get Token)
    console.log('\n[2] Logging In...');
    const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({
        email: testEmail,
        password: testPass
    });
    if (loginError) throw new Error('Login Failed: ' + loginError.message);
    token = loginData.session.access_token;
    console.log('   ✅ Logged In. Token acquired.');

    // 3. API: GET USER PROFILE (Tests RLS + Profile Trigger)
    console.log('\n[3] Fetching GET /api/user...');
    const resProfile = await httpRequest('/api/user', 'GET', {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    if (resProfile.status !== 200) {
        throw new Error(`   ❌ API Failed(${resProfile.status}): ${resProfile.body} `);
    }
    const profileJson = JSON.parse(resProfile.body);
    console.log('   ✅ Profile:', profileJson.profile.email === testEmail ? 'MATCH' : 'MISMATCH');
    if (profileJson.profile.subscription_status === 'free') {
        console.log('   ✅ Subscription Status: Free (Default)');
    }

    // 4. API: JOURNAL (Tests Insert RLS)
    console.log('\n[4] Creating Journal Entry...');
    const entry = {
        decision: 'Test Decision',
        context: 'Automated test context',
        outcome: 'Success',
        reviewDate: new Date().toISOString()
    };
    const resJournal = await httpRequest('/api/user/journal', 'POST', {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }, JSON.stringify(entry));

    if (resJournal.status !== 200) {
        throw new Error(`   ❌ Journal Insert Failed: ${resJournal.body} `);
    }
    console.log('   ✅ Journal Entry Created');

    // 5. CLEANUP
    console.log(`\n[5] Cleanup: Deleting User ${userId}...`);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.log('   ✅ Cleanup Complete');

    console.log('\n🎉 ALL TESTS PASSED');
    process.exit(0);
}

runTests().catch(e => {
    console.error('\n💥 TEST FAILED:', e.message);
    process.exit(1);
});
