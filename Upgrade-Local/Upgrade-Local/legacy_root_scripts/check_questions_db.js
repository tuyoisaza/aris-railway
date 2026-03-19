const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Upgrade-Local/.env' });

async function checkQuestions() {
    console.log('Checking Questions Table...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        console.log(`Total Questions in DB: ${count}`);

        if (count === 0) {
            console.log('Table is empty.');
        } else {
            const { data } = await supabase.from('questions').select('axis_id').limit(5);
            console.log('Sample axes:', data.map(q => q.axis_id));
        }

    } catch (e) {
        console.error('Check Failed:', e.message);
    }
}

checkQuestions();
