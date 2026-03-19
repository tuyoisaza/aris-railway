import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

// We need to reconstruct db connection here since local imports might be tricky with relative paths if db.js is CJS/ESM mix. 
// But let's try importing db.js first.
// Actually, db.js uses process.env, so config must be loaded first.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
    const sqlPath = path.join(__dirname, '../migrations/topic_edges.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration: topic_edges.sql');

    // Attempt RPC
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration Error:', error);
        console.log('If exec_sql is not defined, please run the SQL manually in Supabase Dashboard SQL Editor.');
    } else {
        console.log('Migration Successful!');
    }
};

run();
