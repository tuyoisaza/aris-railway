import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing credentials!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDB() {
    console.log("Checking system_prompts table...");
    const { data: prompts, error: promptsError } = await supabase
        .from('system_prompts')
        .select('agent_id, prompt_text');

    if (promptsError) {
        console.error("Error fetching prompts:", promptsError.message);
    } else {
        console.log(`Found ${prompts.length} prompts:`);
        prompts.forEach(p => console.log(`- ${p.agent_id}: ${p.prompt_text ? p.prompt_text.substring(0, 30) + "..." : "EMPTY"}`));
    }

    console.log("\nChecking users table (Super Admin check)...");
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('email, is_super_admin')
        .eq('is_super_admin', true);

    if (usersError) {
        console.error("Error fetching users:", usersError.message);
    } else {
        console.log(`Found ${users.length} super admins:`);
        users.forEach(u => console.log(`- ${u.email}`));
    }
}

checkDB();
