import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data, error } = await supabaseAdmin
        .from('system_prompts')
        .select('*')
        .eq('agent_id', 'cartographer_rel')
        .single();

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

check();
