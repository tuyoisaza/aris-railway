
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// These are likely in the .env or readily available code, but I'll check the file first or just try to grab them from process.env if I run with dotenv
// Actually, looking at server/db.js or client config might match.
// For now, I'll try to use a simple fetch to the backend endpoints if they exist, 
// OR simpler: use the existing server functionality.

// Let's rely on the server's running instance. 
// The backend is on port 3000.
// Routes are likely /api/auth/...

async function testAuth() {
    const TEST_EMAIL = `test.user.${Date.now()}@gmail.com`;
    const TEST_PASSWORD = 'Password123!';

    console.log(`Testing Signup with ${TEST_EMAIL}...`);

    try {
        // 1. Signup
        const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
        });

        const signupData = await signupRes.json();
        console.log('Signup Status:', signupRes.status);
        console.log('Signup Response:', JSON.stringify(signupData, null, 2));

        if (signupRes.status !== 200 && signupRes.status !== 201) {
            throw new Error('Signup failed');
        }

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', JSON.stringify(loginData, null, 2));

        if (loginRes.status !== 200) {
            throw new Error('Login failed');
        }

        console.log('\nSUCCESS: Auth flow (Signup + Login) verified via API.');

    } catch (err) {
        console.error('\nFAILURE:', err.message);
        process.exit(1);
    }
}

testAuth();
