import { supabaseAdmin as supabase } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('Running activity_logs migration...');

    try {
        const sqlPath = path.join(__dirname, '../migrations/add_activity_log.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Migration failed:', error);
        } else {
            console.log('Migration successful: activity_logs table created.');
        }
    } catch (err) {
        console.error('Migration script error:', err);
    }
    process.exit(0);
}

runMigration();
