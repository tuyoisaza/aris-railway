import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const tables = [
    'families',
    'family_members',
    'users',
    'invitations',
    'topics',
    'resources',
    'user_topic_progress',
    'folders',
    'conversations',
    'messages',
    'projects'
];

async function inspect() {
    console.log('--- INSPECTING SCHEMA ---');
    for (const table of tables) {
        process.stdout.write(`Checking ${table}... `);
        try {
            const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
            if (error) {
                console.log(`Error: ${error.message}`);
            } else {
                if (data && data.length > 0) {
                    console.log('Columns:', Object.keys(data[0]).join(', '));
                } else {
                    console.log('Empty table (cannot determine columns easily)');
                }
            }
        } catch (e) {
            console.log(`Exception: ${e.message}`);
        }
    }
}

inspect();
