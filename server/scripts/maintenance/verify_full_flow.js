
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './server/db.js';

// We need to polyfill fetch if node version is old, but Node 18+ has it.
// Assuming Node environment has fetch or this script might fail if we don't enable it.
// In recent Node versions, fetch is global.

async function testFullFlow() {
    const TEST_EMAIL = `flow_test_${Date.now()}@gmail.com`;
    const TEST_PASSWORD = 'Password123!';
    const API_URL = 'http://localhost:3000/api';

    console.log(`\n=== 1. Testing Signup (${TEST_EMAIL}) ===`);
    let userId;
    let sessionToken;
    let conversationId;

    try {
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Flow Tester' })
        });
        const signupData = await signupRes.json();

        if (!signupRes.ok) throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
        console.log('Signup Successful. User ID:', signupData.user.id);
        userId = signupData.user.id;

        // Auto-confirm email
        console.log('\n=== 2. Auto-confirming Email (Admin) ===');
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
        );
        if (confirmError) throw new Error(`Confirmation failed: ${confirmError.message}`);
        console.log('User confirmed.');

        // Login
        console.log('\n=== 3. Testing Login ===');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        console.log('Login Successful.');
        sessionToken = loginData.session.access_token;

        // Create Conversation
        console.log('\n=== 4. Testing Chat Creation ===');
        const convRes = await fetch(`${API_URL}/chat/conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                userId: userId,
                title: 'Test Chat',
                language: 'en'
            })
        });
        const convData = await convRes.json();
        if (!convRes.ok) throw new Error(`Create Chat failed: ${JSON.stringify(convData)}`);
        conversationId = convData.id;
        console.log('Conversation Created:', conversationId);

        // Send Message
        console.log('\n=== 5. Testing Message Sending ===');
        const msgRes = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                conversationId: conversationId,
                role: 'user',
                content: 'Hello, please confirm you can hear me.'
            })
        });
        const msgData = await msgRes.json();
        if (!msgRes.ok) throw new Error(`Message failed: ${JSON.stringify(msgData)}`);

        console.log('User Message Saved:', msgData.userMessage?.text);
        console.log('AI Response:', msgData.aiMessage?.text || 'No text response (maybe milestone)');

        console.log('\n=== SUCCESS: Full Auth & Chat Flow Verified ===');

    } catch (err) {
        console.error('\nFAILURE:', err.message);
        process.exit(1);
    }
}

testFullFlow();
