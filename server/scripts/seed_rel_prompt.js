import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatible dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root (parent of script)
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Env Vars');
    process.exit(1);
}

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PROMPT = "You are a Knowledge Graph Architect. Identify semantic relationships between topics. Labels must be single, evocative verbs or nouns (e.g., 'Influences', 'Basis', 'Context', 'Evolves', 'Harmony', 'Tension').";

async function seed() {
    console.log('Seeding Cartographer (Map) prompt...');
    const { error } = await supabaseAdmin
        .from('system_prompts')
        .upsert({
            agent_id: 'cartographer_rel',
            name: 'Cartographer Relationships',
            prompt_text: PROMPT,
            model: 'gpt-4o',
            temperature: 0.5,
            updated_at: new Date()
        }, { onConflict: 'agent_id' });

    if (error) {
        console.error('Failed:', error);
    } else {
        console.log('Success!');
    }
}

seed();
