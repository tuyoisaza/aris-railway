
import 'dotenv/config';
import EventManager from './services/cognition/EventManager.js';
import './services/cognition/listeners/GamificationListener.js';
import './services/cognition/listeners/ExperienceListener.js';
import './services/cognition/listeners/CognitionListener.js';
import './services/cognition/listeners/TopicListener.js';
import TopicService from './services/TopicService.js';
import { supabaseAdmin } from './db.js';

console.log('🧪 Starting Event Architecture Verification...');

(async function runVerification() {
    // 1. Get Valid User
    const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
    if (!user) {
        console.error('❌ No users found in DB. Cannot run verification.');
        process.exit(1);
    }
    const TEST_USER_ID = user.id;
    const MOCK_CONV_ID = '00000000-0000-0000-0000-000000000002'; // Random UUID for conv

    console.log(`ℹ️ Using Test User ID: ${TEST_USER_ID}`);

    // 2. Mock Listener
    let eventReceived = false;
    let revisitedReceived = false;

    EventManager.on(EventManager.EVENTS.AI_RESPONSE_COMPLETED, (payload) => {
        console.log('✅ TEST LISTENER: Received AI_RESPONSE_COMPLETED.');
        eventReceived = true;
    });

    EventManager.on(EventManager.EVENTS.TOPIC_REVISITED, (payload) => {
        console.log('✅ TEST LISTENER: Received TOPIC_REVISITED.');
        console.log('   Payload:', JSON.stringify(payload));
        revisitedReceived = true;
    });

    // 3. Emit Simulation (Chat)
    console.log('📡 Emitting simulated chat completion...');
    EventManager.emitEvent(EventManager.EVENTS.AI_RESPONSE_COMPLETED, {
        userId: TEST_USER_ID,
        conversationId: MOCK_CONV_ID,
        userContent: 'I want to learn about biology',
        aiResponse: { action: null, response: 'Biology is the study of life.' }
    });

    // 4. Emit Milestone Simulation
    setTimeout(() => {
        console.log('📡 Emitting simulated Milestone...');
        EventManager.emitEvent(EventManager.EVENTS.AI_RESPONSE_COMPLETED, {
            userId: TEST_USER_ID,
            conversationId: MOCK_CONV_ID,
            userContent: 'I understand deeply.',
            aiResponse: {
                action: { type: 'milestone', payload: { type: 'MASTERY', topic: 'Biology' } },
                response: 'Great job!'
            }
        });
    }, 1000);

    // 5. Emit Topic Creation Simulation
    setTimeout(async () => {
        console.log('📡 Emitting simulated Topic Creation (Quantum Gardening)...');
        try {
            // Ensure topic doesn't exist or we tolerate it
            await TopicService.createTopic({
                title: 'Quantum Gardening',
                userId: TEST_USER_ID,
                description: 'First creation'
            });
        } catch (e) { console.error('TopicService Error 1:', e.message); }
    }, 2000);

    // 6. Emit Re-encounter Simulation (Duplicate)
    setTimeout(async () => {
        console.log('📡 Calling TopicService.createTopic (Duplicate)...');
        try {
            await TopicService.createTopic({
                title: 'Quantum Gardening', // Same name
                userId: TEST_USER_ID,
                description: 'Trying to create again'
            });
        } catch (e) {
            console.error('TopicService Error 2:', e.message);
        }
    }, 4000);

    // 7. Wait and Assert
    setTimeout(() => {
        if (eventReceived) {
            console.log('✨ SUCCESS: Event system is working.');
            if (revisitedReceived) {
                console.log('🧠 SUCCESS: Cognitive Re-encounter detected (TOPIC_REVISITED emitted).');
            } else {
                console.warn('⚠️ WARNING: TOPIC_REVISITED not received. Check duplication logic.');
            }
            process.exit(0);
        } else {
            console.error('❌ FAILURE: Event was not received by listener.');
            process.exit(1);
        }
    }, 8000);

})();
