
import { supabaseAdmin } from './db.js';

async function checkSchema() {
    try {
        const { data, error } = await supabaseAdmin
            .from('system_prompts')
            .select('instruction_text')
            .eq('agent_id', 'teacher')
            .single();

        if (error) {
            console.error('Error selecting instruction_text:', error);
        } else {
            console.log('instruction_text exists:', !!data.instruction_text);
            console.log(data.instruction_text?.substring(0, 50) + '...');
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

checkSchema();
