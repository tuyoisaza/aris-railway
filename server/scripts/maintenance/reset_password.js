const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function resetPasswords() {
    const emails = ['thetboard@gmail.com', 'alicia@aris.demo', 'lorena@aris.demo'];
    const newPassword = 'Password123!';

    console.log("--- RESETTING PASSWORDS ---");

    for (const email of emails) {
        console.log(`Finding user: ${email}...`);
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.find(u => u.email === email);

        if (user) {
            console.log(`   Found ${user.id}. Resetting password...`);
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { password: newPassword }
            );
            if (updateError) {
                console.error(`   FAILED: ${updateError.message}`);
            } else {
                console.log(`   SUCCESS: Password set to '${newPassword}'`);
            }
        } else {
            console.log(`   User not found.`);
        }
    }
}

resetPasswords().catch(e => console.error(e));
