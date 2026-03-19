
import { supabase } from './src/db';

async function run() {
    console.log("Promoting user to Super Admin...");

    // 1. Find the mock user (or create if needed)
    // For now, we'll just update the first user we find for testing, 
    // OR ideally we use a specific ID if we knew it.
    // Let's list users to see who is there.

    // Check if profiles exist
    const { data: profiles, error } = await supabase.from('profiles').select('id, email').limit(1);

    if (error || !profiles || profiles.length === 0) {
        console.error("No users found to promote!", error);
        return;
    }

    const targetUser = profiles[0];
    console.log(`Promoting user: ${targetUser.email} (${targetUser.id})`);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_super_admin: true })
        .eq('id', targetUser.id);

    if (updateError) {
        console.error("Failed to promote:", updateError);
    } else {
        console.log("User promoted successfully!");

        // Output the token generation tip? We can't generate a real JWT signed by Supabase here easily without secret,
        // but our mock middleware might need adjustment if it doesn't lookup the user.
        // Wait, the 'mock-token' middleware in 'auth.ts' (if it exists) or the real auth?
        // Let's check auth.ts again.
    }
}

run();
