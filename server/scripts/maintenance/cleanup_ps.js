
import { supabaseAdmin } from './db.js';

const SKILL_TITLE_PART = 'public speaking'; // Lowercase as in DB

async function cleanupPS() {
    console.log(`--- Cleaning up '${SKILL_TITLE_PART}' Conversations ---`);

    const { data: convs } = await supabaseAdmin
        .from('conversations')
        .select('id, title')
        .ilike('title', `%${SKILL_TITLE_PART}%`);

    console.log(`Found ${convs?.length} conversations.`);

    if (convs && convs.length > 0) {
        for (const c of convs) {
            await supabaseAdmin.from('conversations').delete().eq('id', c.id);
            console.log(`Deleted: ${c.title} (${c.id})`);
        }
    }
}

cleanupPS();
