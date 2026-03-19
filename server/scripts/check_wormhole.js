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

async function inspectWormHole() {
    // 1. Find the topic
    const { data: topics } = await supabaseAdmin
        .from('topics')
        .select('*')
        .ilike('title', '%worm%hole%');

    console.log('Topics found:', topics.length);
    if (topics.length === 0) {
        // Check for "work hole" just in case
        const { data: workTopics } = await supabaseAdmin.from('topics').select('*').ilike('title', '%work%hole%');
        console.log('Work topics found:', workTopics.length);
        if (workTopics.length > 0) console.log(workTopics);
        return;
    }

    const topic = topics[0];
    console.log(`Topic: "${topic.title}" (Category: ${topic.category})`);

    // 2. Find edges
    const { data: edges } = await supabaseAdmin
        .from('topic_edges')
        .select('*')
        .or(`source_topic_id.eq.${topic.id},target_topic_id.eq.${topic.id}`);

    if (!edges || edges.length === 0) {
        console.log('❌ NO EDGES FOUND. Topic is isolated.');
    } else {
        console.log('Edges:');
        for (const e of edges) {
            // Fetch names
            const { data: t1 } = await supabaseAdmin.from('topics').select('title').eq('id', e.source_topic_id).single();
            const { data: t2 } = await supabaseAdmin.from('topics').select('title').eq('id', e.target_topic_id).single();
            console.log(`${t1?.title} --[${e.label}]--> ${t2?.title} (Rationale: ${e.rationale})`);
        }
    }

    process.exit(0);
}

inspectWormHole();
