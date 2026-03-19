const { supabaseAdmin } = require('./server/db');
const CartographerAgent = require('./server/services/ai/agents/CartographerAgent');

async function run() {
    const conversationId = 'a1b8d6f6-91aa-4126-a8cb-f5e6d190acb5';
    const userId = '49c236ef-9088-437a-ae24-118bd0c444bf';

    console.log(`Debug: Running Cartographer for ${conversationId} / ${userId}`);

    try {
        await CartographerAgent.analyzeAndMap(conversationId, userId);
        console.log('Debug: Finished.');
    } catch (e) {
        console.error('Debug: Error:', e);
    }
}

run();
