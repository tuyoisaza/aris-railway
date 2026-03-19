import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function inspectTopics() {
    const { data: topics, error } = await supabaseAdmin
        .from('topics')
        .select('id, title, category');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Current Topics in DB:');
    topics.forEach(t => {
        console.log(`- "${t.title}" (Category: "${t.category}")`);
    });
    process.exit(0);
}

inspectTopics();
