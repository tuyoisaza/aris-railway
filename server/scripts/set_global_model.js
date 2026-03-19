import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function update() {
    console.log('Setting ALL agents to gpt-5-nano...');
    const { error } = await supabaseAdmin
        .from('system_prompts')
        .update({
            model: 'gpt-5-nano',
            updated_at: new Date()
        })
        .neq('agent_id', 'PLACEHOLDER_FOR_ALL'); // Updates all rows

    if (error) {
        console.error('Failed:', error);
    } else {
        console.log('Success! All agents updated to gpt-5-nano.');
    }
}

update();
