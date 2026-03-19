const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Upgrade-Local/.env' });

async function checkMentors() {
    console.log('Checking Mentors Table...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { count, error } = await supabase
            .from('mentors')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        console.log(`Total Mentors in DB: ${count}`);

    } catch (e) {
        console.error('Check Failed:', e.message);
    }
}

checkMentors();
