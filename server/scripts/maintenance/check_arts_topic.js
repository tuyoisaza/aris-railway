import { supabaseAdmin } from './db.js';

async function checkArtsTopic() {
    const { data: topic } = await supabaseAdmin
        .from('topics')
        .select('*')
        .ilike('title', '%Arts%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!topic) {
        console.log('No Arts topic found.');
        return;
    }

    console.log(`Topic: ${topic.title} (${topic.id})`);
    console.log(`Content present: ${!!topic.content}`);
    if (topic.content) {
        console.log('Keys:', Object.keys(topic.content));
    }
}

checkArtsTopic();
