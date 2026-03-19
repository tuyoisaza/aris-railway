
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock user ID (must exist in DB or use a fresh one)
// We'll search for an existing user or create one
async function run() {
    console.log("Starting Memory Test...");

    // 1. Get a User
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
        console.error("No users found. Run app to create one.");
        return;
    }
    const userId = users[0].id;
    console.log("Using User:", userId);

    // 2. Create Conversation
    const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert([{ user_id: userId, title: 'Memory Test' }])
        .select()
        .single();

    if (convError) {
        console.error("Create Conv Error:", convError);
        return;
    }
    console.log("Created Conversation:", conv.id);

    const convId = conv.id;

    // 3. Insert Msg 1 (User)
    console.log("Inserting Msg 1: 'My favorite color is Blue'");
    const { data: msg1 } = await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'user',
        content: 'My favorite color is Blue'
    }).select().single();

    // 4. Insert Msg 2 (AI)
    console.log("Inserting Msg 2: 'That is a nice color.'");
    await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'ai',
        content: 'That is a nice color.'
    });

    // 5. Simulate Fetching History for Msg 3 (User: "What is my favorite color?")
    // Logic from server/index.js
    const { data: historyData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        // Assume we inserted Msg 3 just now... let's insert it to match exact logic
        // .neq('id', msg3.id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (historyData === null) {
        console.error("Fetch Error maybe?");
        const { error } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', convId);
        console.error("Re-fetch error:", error);
    }

    console.log("--- Fetched History (Raw) ---");
    console.log(historyData);

    const history = (historyData || []).reverse().map(msg => ({
        role: msg.role,
        content: msg.content || msg.text
    }));

    console.log("--- Formatted History (for AI) ---");
    console.log(history);

    // Check if Msg 1 is present
    const hasContext = history.some(m => m.content.includes('Blue'));
    if (hasContext) {
        console.log("SUCCESS: Context includes 'Blue'");
    } else {
        console.log("FAILURE: Context missing 'Blue'");
    }
}

run();
