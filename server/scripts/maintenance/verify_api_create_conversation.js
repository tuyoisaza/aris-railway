
import { supabaseAdmin } from './db.js';

const API_URL = 'http://localhost:3000/api';

async function verifyCreateConversation() {
    console.log('--- TESTING API CREATE CONVERSATION ---');

    const email = `test_api_${Date.now()}@example.com`;
    const password = 'Password123!';


    // 1. Get Existing User
    const { data: users, error: findError } = await supabaseAdmin.from('users').select('id, email').limit(1);
    if (!users || users.length === 0) {
        console.error("No users found to test with.");
        return;
    }
    const testUser = users[0];
    // const password already declared above.

    // 2. Reset Password & Login
    await supabaseAdmin.auth.admin.updateUserById(testUser.id, { password: password, email_confirm: true });

    // Login to get token
    const { data: matchData } = await supabaseAdmin.auth.signInWithPassword({ email: testUser.email, password });

    if (!matchData.session) {
        console.error("Login failed (no session)");
        return;
    }

    const token = matchData.session.access_token;
    const userId = matchData.user.id;


    console.log(`User: ${userId}`);

    // 3. Call API
    const payload = {
        userId: userId,
        title: 'API Test Chat',
        topicId: null,
        language: 'en-US'
    };

    console.log('Sending Payload:', payload);

    try {
        const res = await fetch(`${API_URL}/chat/conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const status = res.status;
        const text = await res.text();

        console.log(`Response Status: ${status}`);
        console.log(`Response Body: ${text}`);

        if (status === 200) {
            console.log('✅ API Create Success');
            const json = JSON.parse(text);
            // Cleanup
            await supabaseAdmin.from('conversations').delete().eq('id', json.id);
        } else {
            console.error('❌ API Create Failed');
        }

    } catch (e) {
        console.error('Fetch exception:', e);
    }
}

verifyCreateConversation();
