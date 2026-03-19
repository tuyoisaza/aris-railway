import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from server root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment loaded from:', path.resolve(__dirname, '../.env'));
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'FOUND' : 'MISSING');

import ThothAgent from '../services/ai/agents/ThothAgent.js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function fixMissingDomains() {
    console.log('🔍 Finding topics with missing domains...');

    // 1. Fetch topics with empty or 'General' category
    // Using simple OR syntax for Supabase
    const { data: topics, error } = await supabaseAdmin
        .from('topics')
        .select('*');
    // .or('category.is.null,category.eq.,category.eq.General'); // Filter manually to be safe

    if (error) {
        console.error('Error fetching topics:', error.message);
        process.exit(1);
    }

    const targetTopics = topics.filter(t => !t.category || t.category === 'General' || t.category.trim() === '');
    console.log(`Found ${targetTopics.length} topics to classify (out of ${topics.length} total).`);

    // 2. Classify each
    for (const topic of targetTopics) {
        console.log(`\nProcessing: "${topic.title}"...`);
        try {
            const domain = await ThothAgent.classifyDomain(topic.title);

            if (domain && domain !== 'General') {
                const { error: updateError } = await supabaseAdmin
                    .from('topics')
                    .update({ category: domain })
                    .eq('id', topic.id);

                if (updateError) {
                    console.error(`❌ Failed to update ${topic.title}:`, updateError.message);
                } else {
                    console.log(`✅ Updated: "${topic.title}" -> ${domain}`);
                }
            } else {
                console.log(`⚠️ Skipped (General/Empty result): ${topic.title}`);
            }
        } catch (err) {
            console.error(`❌ Error processing ${topic.title}:`, err);
        }

        // Slight delay to define rate limits if needed, usually fine sequentially
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n✨ Done!');
    process.exit(0);
}

fixMissingDomains();
