import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function reassignTopics() {
    const TARGET_USER_ID = '49c236ef-9088-437a-ae24-118bd0c444bf';

    console.log(`Reassigning all topics and skills to user: ${TARGET_USER_ID}`);

    // Update topics
    const { error: topicsError } = await supabase
        .from('topics')
        .update({ user_id: TARGET_USER_ID });

    if (topicsError) {
        console.error('Topics update error:', topicsError);
    } else {
        console.log('✅ Topics reassigned');
    }

    // Update skills
    const { error: skillsError } = await supabase
        .from('skills')
        .update({ user_id: TARGET_USER_ID });

    if (skillsError) {
        console.error('Skills update error:', skillsError);
    } else {
        console.log('✅ Skills reassigned');
    }

    console.log('Done!');
    process.exit(0);
}

reassignTopics();
