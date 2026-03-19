import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import CartographerAgent from '../services/ai/agents/CartographerAgent.js';

dotenv.config({ path: '../.env' });

// We need to initialize Supabase separately if Agent expects it, 
// but Agent imports 'db.js'. 
// Since we run this script from 'scripts/', 'db.js' import in Agent might fail 
// if it relies on process.env being set BEFORE import.
// But 'db.js' imports dotenv? Let's check db.js. 
// If db.js uses process.env.SUPABASE_URL at top level, we might be fine if we run with -r dotenv/config?
// Or we just rely on Agent's internal supabase usage.

const run = async () => {
    console.log("Testing Connector Agent...");

    // 1. Get a Topic
    // We assume db.js works. If not, this script crashes.
    // We can use the agent's internal supabase reference if exposed? No.
    // We'll trust the agent's import.

    // Mock data fetching since we can't easily access DB from here without same setup.
    // cartographerAgent uses 'supabaseAdmin' from '../../../db.js'.
    // Adjusted path in Agent import? 
    // Agent is in 'services/ai/agents/CartographerAgent.js'.
    // It imports from '../../../db.js'.
    // That resolves to 'server/db.js'. Correct.

    // CALL the method
    // We need a valid Topic ID.
    // Let's rely on Agent finding one? No, it takes an ID.
    // I need to fetch one first.

    // Use raw supabase client here to fetch an ID.
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: topics } = await sb.from('topics').select('id, title').limit(1);

    if (!topics || topics.length === 0) {
        console.error("No topics found to test.");
        return;
    }

    const topic = topics[0];
    console.log(`Analyzing relationships for: ${topic.title} (${topic.id})`);

    try {
        await CartographerAgent.analyzeTopicRelationships(topic.id);
        console.log("Agent finished. Check logs for results.");
    } catch (err) {
        console.error("Agent Failed:", err);
    }
};

run();
