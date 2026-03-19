require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function checkSupabase() {
    console.log('--- Checking Supabase ---');
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('FAIL: Missing SUPABASE_URL or SUPABASE_ANON_KEY');
        return false;
    }

    if (!key.startsWith('eyJ')) {
        console.warn('WARNING: SUPABASE_ANON_KEY does not start with "eyJ". It might be invalid.');
    }

    try {
        const supabase = createClient(url, key);
        // Try a simple public read or health check
        // "profiles" might require auth, so let's try something that might fail with 401 but proves connection
        // actually, just checking if we can connect.
        const { data, error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            // If error is 401/403 (Auth), that means the KEY is valid enough to reach the server but RLS blocked it.
            // If error is "apikey not found" or DNS error, then it's bad.
            if (error.code === 'PGRST301' || error.message.includes('JWT')) {
                console.error('FAIL: Supabase Auth/Key Error:', error.message);
                return false;
            }
            // Valid connection, just RLS error or empty table is fine for now to prove URL/Key validity
            console.log('Supabase Connection: OK (API reached)');
            return true;
        }
        console.log('Supabase Connection: OK (Query successful)');
        return true;
    } catch (e) {
        console.error('FAIL: Supabase Exception:', e.message);
        return false;
    }
}

async function checkStripe() {
    console.log('\n--- Checking Stripe ---');
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        console.error('FAIL: Missing STRIPE_SECRET_KEY');
        return false;
    }

    try {
        const stripe = Stripe(key);
        const { data } = await stripe.products.list({ limit: 1 });
        console.log('Stripe Connection: OK');
        return true;
    } catch (e) {
        console.error('FAIL: Stripe Exception:', e.message);
        return false;
    }
}

async function run() {
    const supabaseOk = await checkSupabase();
    const stripeOk = await checkStripe();

    if (supabaseOk && stripeOk) {
        console.log('\nSUCCESS: Environment verification passed.');
        process.exit(0);
    } else {
        console.error('\nFAILURE: Environment verification failed.');
        process.exit(1);
    }
}

run();
