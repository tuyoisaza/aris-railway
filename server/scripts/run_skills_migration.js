import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server root (parent of scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Env Vars: SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const run = async () => {
    const sqlPath = path.join(__dirname, '../migrations/skills_system.sql');

    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Applying migration: skills_system.sql');

        // Attempt RPC
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Migration Error:', error);
            console.log('Ensure the "exec_sql" RPC function exists in your Supabase database.');
        } else {
            console.log('Migration Successful!');
        }
    } catch (err) {
        console.error("Error reading or executing SQL:", err);
    }
};

run();
