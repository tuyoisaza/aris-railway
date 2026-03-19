import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CartographerAgent from '../services/ai/agents/CartographerAgent.js';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function testCartographerFlow() {
    console.log("🚀 Starting Cartographer Integration Test...");

    // 1. Setup Test Data
    let userId = '00000000-0000-0000-0000-000000000000';
    const conversationId = crypto.randomUUID();
    const specificTopic = "Deep Learning Neural Networks";

    // Fetch a real user first
    const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
    if (users && users.length > 0) {
        userId = users[0].id; // Use REAL user
        console.log(`Using real user ID: ${userId}`);
    } else {
        console.warn("⚠️ No users found in DB. Test might fail on FK constraints.");
        // If no user, maybe create one? Or just let it fail.
    }

    console.log(`\n1. Creating Test Conversation (${conversationId})`);

    // Create Conversation
    const { error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
            id: conversationId,
            user_id: userId,
            title: 'Test Conversation',
            created_at: new Date().toISOString()
        });

    if (convError) {
        console.error("Error creating conversation:", convError.message);
        return;
    }

    // Insert Messages
    const messages = [
        {
            conversation_id: conversationId,
            role: 'user',
            text: `I want to learn about ${specificTopic}. How do backpropagation and gradient descent work?`
        },
        {
            conversation_id: conversationId,
            role: 'assistant',
            text: `Start with the concept of a neuron. Backpropagation is how the network learns by propagating the error backward.`
        }
    ];

    const { error: msgError } = await supabaseAdmin.from('messages').insert(messages);
    if (msgError) console.error("Error inserting messages:", msgError);

    // 2. Run Cartographer
    console.log(`\n2. Running Cartographer Analysis...`);
    try {
        await CartographerAgent.analyzeAndMap(conversationId, userId);
    } catch (e) {
        console.error("Cartographer Error:", e);
    }

    // 3. Verify Results
    console.log(`\n3. Verifying Notification...`);

    // Check for System Notification
    // Wait a brief moment just in case async stuff is happening (though await above should handle it)

    const { data: notifications } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('role', 'system')
        .ilike('content', '%Topic Unlocked%');

    if (notifications && notifications.length > 0) {
        const notification = notifications[0];
        console.log(`✅ FOUND NOTIFICATION: "${notification.content}"`);

        // Validation Logic
        if (notification.content.includes("Computer Science") || notification.content.includes("Artificial Intelligence") || notification.content.includes("Data Science") || notification.content.includes("Machine Learning")) {
            console.log("✅ SUCCESS: Notification uses Domain Name.");
        } else if (notification.content.toLowerCase().includes(specificTopic.toLowerCase())) {
            console.log("❌ FAILURE: Notification uses specific input topic!");
        } else {
            console.log("⚠️ WARNING: Check domain manually. It might be valid but unexpected.");
        }

    } else {
        console.log("❌ FAILURE: No 'Topic Unlocked' notification found.");
    }

    // Cleanup
    console.log(`\n4. Cleanup...`);
    await supabaseAdmin.from('messages').delete().eq('conversation_id', conversationId);
    await supabaseAdmin.from('conversations').delete().eq('id', conversationId);
    console.log("Done.");
}

testCartographerFlow();
