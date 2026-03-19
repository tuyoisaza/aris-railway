import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fix() {
    console.log('Resetting Cartographer (Map) temperature...');
    const { error } = await supabaseAdmin
        .from('system_prompts')
        .update({
            temperature: 1, // Default for most models, safe
            updated_at: new Date()
        })
        .eq('agent_id', 'cartographer_rel');

    if (error) {
        console.error('Failed:', error);
    } else {
        console.log('Success! Temperature reset to 1.');
    }
}

fix();
