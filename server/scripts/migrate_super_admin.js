import 'dotenv/config';
import { supabaseAdmin } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/add_super_admin.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running SQL migration...');

        // Split by semicolon and run individually to avoid some parsing issues, 
        // though exec_sql usually handles blocks. 
        // But for safety, let's try running the whole block first.
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('RPC Error:', error);
            if (error.code === '42883') { // Undefined function
                console.log("\n[WARNING] 'exec_sql' function not found in Supabase.");
                console.log("Please copy the content of 'server/migrations/add_super_admin.sql' and run it in your Supabase SQL Editor.");
            }
        } else {
            console.log('Migration successful.');
        }
    } catch (e) {
        console.error(e);
    }
}

run();
