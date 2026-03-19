
import { supabaseAdmin } from './db.js';
import ConversationService from './services/ConversationService.js';

const USER_ID = '49c236ef-9088-437a-ae24-118bd0c444bf';

// Titles that represent what the frontend PROPOSES
const TITLE_L2_GENERIC = "Level 2: Basic Application";
const TITLE_L2_SPECIFIC = "Level 2: Basic Application (Critical Thinking)";

async function checkMatch(inputTitle) {
    console.log(`\n🔎 Searching for invalid match with title: "${inputTitle}"`);

    // REPLICATING ConversationService logic
    const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id, title')
        .eq('user_id', USER_ID)
        .ilike('title', inputTitle)
        .maybeSingle(); // This is what the service uses

    if (existingConv) {
        console.log(`✅ MATCH FOUND: ${existingConv.id} - "${existingConv.title}"`);
    } else {
        console.log(`❌ NO MATCH FOUND (Correct for new specific titles)`);
    }
}

async function run() {
    await checkMatch(TITLE_L2_GENERIC);
    await checkMatch(TITLE_L2_SPECIFIC);
}

run();
