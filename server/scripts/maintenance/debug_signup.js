import { supabaseAdmin } from './db.js';

const testSignup = async () => {
    const timestamp = Date.now();
    const email = `test_signup_admin_${timestamp}@example.com`;
    const password = 'testpassword123';
    const name = 'Signup Admin Test User';

    console.log(`Attempting Admin Create User for ${email}...`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name,
            avatar_url: 'https://via.placeholder.com/150'
        }
    });

    if (error) {
        console.error("Signup Failed:", error);
        // Clean error output
        if (error.status === 500) {
            console.error("CRITICAL: Database Trigger likely failed.");
        }
    } else {
        console.log("Signup Successful:", data.user.id);
        console.log("User metadata:", data.user.user_metadata);
    }
};

testSignup();
