require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const API_URL = 'http://localhost:3000/api';
const EMAIL = `chat_test_${Date.now()}@aris.com`;
const PASSWORD = 'Password123!';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function runTest() {
    console.log('🧪 Testing Chat Flow...');

    // 1. Create User
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Chat Tester' }
    });

    // Handle "User already registered" if run quickly
    let userId = userData?.user?.id;
    if (createError) {
        console.log('User creation note:', createError.message);
        // Try login if exists
    } else {
        console.log(`User Created: ${userId}`);
        // Sync to public if needed (assuming trigger handles it or we do it manual)
        await supabase.from('users').insert([{ id: userId, email: EMAIL, name: 'Chat Tester' }]);
    }

    // 2. Login to get Token
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (loginError) return console.error('Login Failed:', loginError.message);

    const token = sessionData.session.access_token;
    userId = sessionData.user.id; // Confirm ID
    console.log(`Logged in as: ${userId}`);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 3. Create Conversation
    console.log('▶ Creating Conversation...');
    const createRes = await fetch(`${API_URL}/chat/conversation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, title: 'Test Chat 1', topicId: null })
    });

    if (!createRes.ok) {
        console.error('❌ Create Conversation Failed:', await createRes.text());
        return;
    }
    const conversation = await createRes.json();
    console.log('✅ Conversation Created:', conversation.id, conversation.title);

    // 4. Send Message
    console.log('▶ Sending Message...');
    const msgRes = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversationId: conversation.id, role: 'user', content: 'Hello Aris!' })
    });

    if (!msgRes.ok) {
        console.error('❌ Send Message Failed:', await msgRes.text());
        return;
    }
    const msgData = await msgRes.json();
    console.log('✅ Message Sent & AI Responded');
    console.log('   User Full:', JSON.stringify(msgData.userMessage, null, 2));
    console.log('   AI Full:', JSON.stringify(msgData.aiMessage, null, 2));

    // 5. Fetch Folders/Conversations (Sidebar Data)
    console.log('▶ Fetching Sidebar Data (Conversations)...');
    const folderRes = await fetch(`${API_URL}/chat/folders/${userId}`, { headers });
    const conversations = await folderRes.json();

    if (conversations.length > 0) {
        console.log(`✅ Fetched ${conversations.length} conversation(s).`);
        console.log('   First Chat:', conversations[0].title, '| ID:', conversations[0].id);
        if (conversations[0].id === conversation.id) {
            console.log('   SUCCESS: New conversation is present in list.');
        } else {
            console.error('   WARNING: ID mismatch or ordering issue.');
        }
    } else {
        console.error('❌ Sidebar List is EMPTY! (RLS or Fetch Logic Failure)');
    }
}

runTest();
