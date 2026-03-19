import { supabaseAdmin as supabase } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('Running invitations migration...');

    try {
        const sqlPath = path.join(__dirname, '../migrations/create_invitations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Use RPC if available, or just log that we need to find another way if not
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Migration failed (RPC error):', error);
        } else {
            console.log('Migration successful: invitations table ensured.');
        }
    } catch (err) {
        console.error('Migration script error:', err);
    }
    process.exit(0);
}

runMigration();
