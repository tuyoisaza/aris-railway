const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

// Helper to simulate fetch if needed, but we can use supabase client or fetch
// We want to test the ENDPOINT, so we should use fetch.
// But we need a token first. Supabase Client is easiest to get token.

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY // Anon
);

async function testApi() {
    console.log("--- TEST /api/family ---");
    const email = 'thetboard@gmail.com';
    const password = 'Password123!';

    // 1. Login to get Token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email, password
    });

    if (authError) {
        console.error("Login Failed:", authError.message);
        return;
    }
    const token = authData.session.access_token;
    const userId = authData.user.id;
    console.log("Logged in. User ID:", userId);

    // 2. Call API (using local fetch)
    const apiUrl = `http://localhost:3000/api/family/${userId}`;
    console.log(`Fetching ${apiUrl}...`);

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
        } else {
            const json = await response.json();
            console.log("API Response Success:");
            console.log(JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

testApi();
