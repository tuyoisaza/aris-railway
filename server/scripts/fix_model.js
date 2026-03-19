
import { supabaseAdmin } from '../db.js';

async function run() {
    console.log('Updating cartographer_rel model to gpt-4o-mini...');
    const { error } = await supabaseAdmin
        .from('system_prompts')
        .update({ model: 'gpt-4o-mini', temperature: 0.5 })
        .eq('agent_id', 'cartographer_rel');

    if (error) console.error('Error:', error);
    else console.log('Successfully updated model to gpt-4o-mini.');
}

run();
