import { supabaseAdmin } from './db.js';

const API_URL = 'http://localhost:3000/api';

async function verifyNulls() {
    console.log('--- TESTING CONVERSATION CREATION WITH NULL FIELDS ---');

    // 1. Get User
    const { data: users } = await supabaseAdmin.from('users').select('id, email').limit(1);
    if (!users || !users.length) return;
    const testUser = users[0];
    const password = 'Password123!';

    // 2. Login
    await supabaseAdmin.auth.admin.updateUserById(testUser.id, { password: password });
    const { data: matchData } = await supabaseAdmin.auth.signInWithPassword({ email: testUser.email, password });
    const token = matchData.session.access_token;

    // 3. Call API with NULLS (mimicking api.ts behavior)
    const payload = {
        userId: testUser.id,
        title: 'Null Test Chat',
        topicId: null,
        language: 'en-US',
        brief: null,          // <--- This should fail Zod validation
        initialContext: null  // <--- This too
    };

    console.log('Sending Payload with Nulls:', payload);

    const res = await fetch(`${API_URL}/chat/conversation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${text}`);

    if (res.status === 400) {
        console.log("✅ Reproduced 400 Bad Request (Validation Error)");
    } else {
        console.log("❌ Failed to reproduce (Got success or other error)");
    }
}

verifyNulls();
