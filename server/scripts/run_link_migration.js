import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const run = async () => {
    const sqlPath = path.join(__dirname, '../migrations/link_projects_skills.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration: link_projects_skills.sql');
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Migration Successful!');
    }
};

run();
