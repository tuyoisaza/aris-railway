require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const BadgeService = require('../services/BadgeService');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runTest() {
    console.log('🧪 Testing Badge vs Warning Categories...');

    // 1. Setup User & Conversation
    const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
    if (!user) return console.error('No user found');

    const { data: conv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert([{ user_id: user.id, title: 'Badge Cat Test', language: 'en-US' }])
        .select().single();
    if (convError) return console.error('Conv create failed', convError);

    const TEST_COUNT = 5;

    // 2. Create Test Badge (Persistent)
    const { data: badge } = await supabaseAdmin.from('badges').insert([{
        name: `Test Badge ${Date.now()}`,
        trigger_type: 'interaction_count',
        trigger_condition: { count: TEST_COUNT },
        category: 'badge',
        message_template: 'Badge Awarded!'
    }]).select().single();

    // 3. Create Test Warning (Transient)
    const { data: warning } = await supabaseAdmin.from('badges').insert([{
        name: `Test Warning ${Date.now()}`,
        trigger_type: 'interaction_count',
        trigger_condition: { count: TEST_COUNT },
        category: 'warning',
        message_template: 'Warning Triggered!'
    }]).select().single();

    console.log('Created definitions:', { badge: badge.id, warning: warning.id });

    try {
        // 4. Insert Messages to reach threshold
        const messages = Array(TEST_COUNT).fill(0).map((_, i) => ({
            conversation_id: conv.id, role: 'user', text: `Msg ${i}`
        }));
        await supabaseAdmin.from('messages').insert(messages);

        // 5. Evaluate
        const alerts = await BadgeService.evaluate(user.id, conv.id);
        console.log('Alerts:', alerts);

        // CHECK 1: Both alerts present?
        const hasBadgeAlert = alerts.some(a => a.includes('Badge Awarded!'));
        const hasWarningAlert = alerts.some(a => a.includes('Warning Triggered!'));

        if (hasBadgeAlert && hasWarningAlert) console.log('✅ PASS: Both alerts triggered.');
        else console.error('❌ FAIL: Missing alerts.');

        // CHECK 2: Persistence
        const { data: userBadges } = await supabaseAdmin
            .from('user_badges')
            .select('*')
            .eq('user_id', user.id);

        const awardedBadge = userBadges.find(ub => ub.badge_id === badge.id);
        const awardedWarning = userBadges.find(ub => ub.badge_id === warning.id);

        if (awardedBadge) console.log('✅ PASS: Badge was persisted.');
        else console.error('❌ FAIL: Badge NOT persisted.');

        if (!awardedWarning) console.log('✅ PASS: Warning was NOT persisted.');
        else console.error('❌ FAIL: Warning WAS persisted incorrectly.');

    } catch (e) {
        console.error(e);
    } finally {
        // Cleanup
        await supabaseAdmin.from('conversations').delete().eq('id', conv.id);
        await supabaseAdmin.from('badges').delete().in('id', [badge.id, warning.id]);
        // user_badges cascade delete via badge FK? Yes if defined. If not, manual cleanup needed.
        // Assuming cascade.
    }
}

runTest();
