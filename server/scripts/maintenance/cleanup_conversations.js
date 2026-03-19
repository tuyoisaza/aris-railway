
import { supabaseAdmin } from './db.js';

const BAD_ID = 'd3daab12-dab0-414c-a46c-c19a2a9ddb5f';

async function cleanup() {
    console.log('--- Cleaning up Test Conversations ---');

    // 1. Delete the specific one reported by user (from my test script)
    const { error: e1 } = await supabaseAdmin.from('conversations').delete().eq('id', BAD_ID);
    if (e1) console.error('Error deleting BAD_ID:', e1);
    else console.log(`Deleted specific test conversation: ${BAD_ID}`);

    // 2. Delete generic title collisions (Safety measure)
    // Titles like "Level 1: Discovery Output" (without parens)
    const { data: generics } = await supabaseAdmin
        .from('conversations')
        .select('id, title')
        .not('title', 'ilike', '%(%') // Title usually has (Skill Name) now. 
        // Wait, generic titles don't have parens. "Level 1: Discovery Output".
        // But some manual ones might validly not have parens?
        // Let's be conservative. Only delete ones starting with "Level " and NO parens.
        .ilike('title', 'Level %')
        .not('title', 'ilike', '%(%');

    console.log('Found generic conversations:', generics?.length);

    if (generics && generics.length > 0) {
        for (const c of generics) {
            await supabaseAdmin.from('conversations').delete().eq('id', c.id);
            console.log(`Deleted generic: ${c.title} (${c.id})`);
        }
    }
}

cleanup();
