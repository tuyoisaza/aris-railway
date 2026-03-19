require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
// Mock the BadgeService logic invocation by calling it directly or simulating the API?
// Best to integration test via API if possible, but simpler to test logic via DB simulation if API is protected.
// Let's use internal logic which mirrors the API behavior.
const BadgeService = require('../services/BadgeService');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runTest() {
    console.log('🧪 Starting Badge Verification Test...');

    // 1. Setup Data
    // Create a dummy user and conversation
    const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
    if (!user) { console.error('No users found to test with.'); return; }

    const { data: conv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert([{ user_id: user.id, title: 'Badge Test', language: 'en-US' }])
        .select()
        .single();

    if (convError) { console.error('Failed to create conv:', convError); return; }

    console.log(`Created Test Conversation: ${conv.id}`);

    try {
        // 2. Insert 14 messages
        const messages = Array(14).fill(0).map((_, i) => ({
            conversation_id: conv.id,
            role: 'user',
            text: `Message ${i + 1}`
        }));

        await supabaseAdmin.from('messages').insert(messages);
        console.log('Inserted 14 messages.');

        // 3. Evaluate - Should be empty
        let alerts = await BadgeService.evaluate(user.id, conv.id);
        if (alerts.length > 0) {
            console.error('❌ FAIL: Alerts triggered prematurely at 14 messages.', alerts);
        } else {
            console.log('✅ PASS: No alerts at 14 messages.');
        }

        // 4. Insert 15th message
        await supabaseAdmin.from('messages').insert([{
            conversation_id: conv.id,
            role: 'user',
            text: 'Message 15'
        }]);
        console.log('Inserted 15th message.');

        // 5. Evaluate - Should trigger
        alerts = await BadgeService.evaluate(user.id, conv.id);

        if (alerts.length === 1 && alerts[0].includes('15 interactions')) {
            console.log(`✅ PASS: Alert triggered correctly: "${alerts[0]}"`);
        } else {
            console.error('❌ FAIL: Alert NOT triggered or incorrect.', alerts);
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        await supabaseAdmin.from('conversations').delete().eq('id', conv.id);
    }
}

runTest();
