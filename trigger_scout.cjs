const ScoutAgent = require('./server/services/ai/agents/ScoutAgent');
const { supabaseAdmin } = require('./server/db');

(async () => {
    // 1. Get Topic ID
    const { data: topic } = await supabaseAdmin.from('topics').select('*').eq('title', 'Paleontology').single();
    if (!topic) return console.log('Topic not found');

    console.log(`Triggering Scout for ${topic.title} (${topic.id})...`);
    await ScoutAgent.findResources({ topicId: topic.id });
    console.log('Finished.');
})();
