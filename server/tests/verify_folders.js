
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Key to bypass RLS for testing setup/teardown if needed, but optimally we simulate user

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFolders() {
    console.log("Starting Folder Verification...");

    // 1. Identify a user (Use the first user found)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users.users.length) {
        console.error("Failed to list users or no users found:", userError);
        return;
    }
    const userId = users.users[0].id; // Use first available user
    console.log(`Testing with User ID: ${userId}`);

    // Clean up any existing test folders
    const { error: cleanError } = await supabase.from('folders').delete().eq('user_id', userId).ilike('title', 'Test Folder%');
    if (cleanError) console.log("Cleanup warning:", cleanError.message);

    // 2. Create a Folder
    console.log("Creating 'Test Folder A'...");
    const { data: folder, error: createError } = await supabase
        .from('folders')
        .insert({ user_id: userId, title: 'Test Folder A' })
        .select()
        .single();

    if (createError) {
        console.error("❌ Link Creation Failed:", createError);
        return;
    }
    console.log("✅ Folder Created:", folder);

    // 3. Create a Dummy Conversation
    console.log("Creating Dummy Conversation...");
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title: 'Test Chat' })
        .select()
        .single();

    if (convError) {
        console.error("❌ Conversation Creation Failed:", convError);
        return;
    }
    console.log("✅ Conversation Created:", conversation.id);

    // 4. Move Conversation to Folder
    console.log(`Moving Conversation ${conversation.id} to Folder ${folder.id}...`);
    const { data: updatedConv, error: moveError } = await supabase
        .from('conversations')
        .update({ folder_id: folder.id })
        .eq('id', conversation.id)
        .select()
        .single();

    if (moveError) {
        console.error("❌ Move Failed:", moveError);
        return;
    }

    if (updatedConv.folder_id === folder.id) {
        console.log("✅ Move Successful: folder_id matches.");
    } else {
        console.error("❌ Move Failed: folder_id mismatch", updatedConv);
    }

    // 5. Fetch Folders with Chats (Simulate what the API does)
    // The API might do a join or separate queries. Let's check the relation.
    console.log("Verifying Relation...");
    const { data: folderWithChats, error: fetchError } = await supabase
        .from('folders')
        .select('*, conversations(*)')
        .eq('id', folder.id)
        .single();

    if (fetchError) {
        console.error("❌ Fetch with Relation Failed:", fetchError);
    } else {
        console.log("✅ Folder fetched with conversations:", folderWithChats.conversations.length, "conversations");
        if (folderWithChats.conversations.length > 0) {
            console.log("   - Linked Chat:", folderWithChats.conversations[0].title);
        }
    }

    // 6. Delete Folder (check on delete set null)
    console.log("Deleting Folder...");
    const { error: deleteError } = await supabase.from('folders').delete().eq('id', folder.id);
    if (deleteError) {
        console.error("❌ Delete Failed:", deleteError);
    } else {
        console.log("✅ Folder Deleted.");
    }

    // 7. Verify Conversation is Unorganized (folder_id is null)
    const { data: finalConv } = await supabase.from('conversations').select('*').eq('id', conversation.id).single();
    if (finalConv.folder_id === null) {
        console.log("✅ ON DELETE SET NULL Verified: Conversation is unorganized.");
    } else {
        console.error("❌ ON DELETE SET NULL Failed: folder_id is", finalConv.folder_id);
    }

    // Clean up conversation
    await supabase.from('conversations').delete().eq('id', conversation.id);
    console.log("Cleaned up test conversation.");
}

testFolders();
