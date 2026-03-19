
import { supabaseAdmin, createUserClient } from './db.js';

async function testInsertRLS() {
    console.log('--- TESTING INSERT WITH RLS (Existing User) ---');

    // 1. Find an existing user
    const { data: users, error: findError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .limit(1);

    if (findError || !users.length) {
        console.error('No users found:', findError);
        return;
    }

    const testUser = users[0];
    console.log(`Using User: ${testUser.id} (${testUser.email})`);

    const password = 'TempPassword123!';

    // 2. Reset Password (Admin) & Confirm Email
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        testUser.id,
        { password: password, email_confirm: true }
    );

    if (updateError) {
        console.error('Failed to update password:', updateError);
        // Fallback: If verifying invalid ID, maybe it's not in auth.users?
        return;
    }

    console.log('Password updated. Signing in...');

    // 3. Sign In
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: testUser.email,
        password: password
    });

    if (signInError) {
        console.error('Sign In Error:', signInError);
        return;
    }

    const token = signInData.session.access_token;
    console.log('Got Token:', token.substring(0, 20) + '...');

    // 4. Create User Client
    const userClient = createUserClient(token);

    const title = 'RLS Test Conv ' + Date.now();
    const language = 'en-US';
    const topicId = null; // Assuming null as per user report

    console.log('Payload:', { user_id: testUser.id, title, topic_id: topicId, language });

    // 5. Insert Conversation (RLS)
    try {
        const { data, error } = await userClient
            .from('conversations')
            .insert([{ user_id: testUser.id, title, topic_id: topicId, language }])
            .select()
            .single();

        if (error) {
            console.error('❌ RLS Insert FAILED:', error);
            console.error('Details:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ RLS Insert SUCCESS:', data);

            // Cleanup
            await supabaseAdmin.from('conversations').delete().eq('id', data.id);
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}

testInsertRLS();
