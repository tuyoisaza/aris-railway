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

async function inspectEdgesSimple() {
    const { data: edges, error } = await supabaseAdmin
        .from('topic_edges')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Edges found:', edges.length);
    // Fetch topics to map names
    const { data: topics } = await supabaseAdmin.from('topics').select('id, title');
    const topicMap = {};
    topics.forEach(t => topicMap[t.id] = t.title);

    edges.forEach(e => {
        const sourceName = topicMap[e.source_topic_id] || e.source_topic_id;
        const targetName = topicMap[e.target_topic_id] || e.target_topic_id;
        if (sourceName.includes('muffin') || targetName.includes('muffin')) {
            console.log(`${sourceName} --[${e.label}]--> ${targetName}`);
        }
    });

    process.exit(0);
}

inspectEdgesSimple();
